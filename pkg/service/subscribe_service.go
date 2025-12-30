package service

import (
	"fmt"
	"sync"
	"time"

	"natsman/pkg/natsclient"
	"natsman/pkg/store"

	"github.com/nats-io/nats.go"
)

type SubscribeService struct {
	store         *store.Store
	mu            sync.RWMutex
	subscriptions map[string]*ActiveSubscription
}

type ActiveSubscription struct {
	Subject     string
	Client      *natsclient.Client
	Subscription *natsclient.Subscription
	Messages    []SubscriptionMessage
	StartTime   time.Time
	MessageChan chan SubscriptionMessage
	mu          sync.RWMutex
}

type SubscriptionMessage struct {
	Subject   string    `json:"subject"`
	Data      string    `json:"data"`
	Timestamp time.Time `json:"timestamp"`
}

type SubscribePayload struct {
	Subject string                `json:"subject"`
	Config  natsclient.Config     `json:"config"`
}

func NewSubscribeService(store *store.Store) *SubscribeService {
	return &SubscribeService{
		store:         store,
		subscriptions: make(map[string]*ActiveSubscription),
	}
}

func (s *SubscribeService) Subscribe(payload SubscribePayload) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	// Check if already subscribed
	if _, exists := s.subscriptions[payload.Subject]; exists {
		return fmt.Errorf("already subscribed to subject: %s", payload.Subject)
	}

	// Get config from store if not provided
	cfg := payload.Config
	if cfg.URL == "" {
		cfg.URL, _ = s.store.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.store.GetNatsConfig()
	}

	// Connect to NATS
	client, err := natsclient.Connect(cfg)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}

	activeSub := &ActiveSubscription{
		Subject:     payload.Subject,
		Client:      client,
		Messages:    make([]SubscriptionMessage, 0),
		StartTime:   time.Now(),
		MessageChan: make(chan SubscriptionMessage, 100),
	}

	// Subscribe
	sub, err := client.Subscribe(payload.Subject, func(msg *nats.Msg) {
		subMsg := SubscriptionMessage{
			Subject:   msg.Subject,
			Data:      string(msg.Data),
			Timestamp: time.Now(),
		}
		
		activeSub.mu.Lock()
		activeSub.Messages = append(activeSub.Messages, subMsg)
		activeSub.mu.Unlock()

		// Send to channel for real-time updates
		select {
		case activeSub.MessageChan <- subMsg:
		default:
			// Channel full, skip
		}
	})

	if err != nil {
		client.Close()
		return fmt.Errorf("failed to subscribe: %w", err)
	}

	activeSub.Subscription = sub
	s.subscriptions[payload.Subject] = activeSub

	return nil
}

func (s *SubscribeService) Unsubscribe(subject string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	activeSub, exists := s.subscriptions[subject]
	if !exists {
		return fmt.Errorf("not subscribed to subject: %s", subject)
	}

	// Unsubscribe
	if activeSub.Subscription != nil {
		activeSub.Subscription.Unsubscribe()
	}

	// Close client
	if activeSub.Client != nil {
		activeSub.Client.Close()
	}

	// Close message channel
	close(activeSub.MessageChan)

	delete(s.subscriptions, subject)
	return nil
}

func (s *SubscribeService) GetMessages(subject string) ([]SubscriptionMessage, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	activeSub, exists := s.subscriptions[subject]
	if !exists {
		return nil, fmt.Errorf("not subscribed to subject: %s", subject)
	}

	activeSub.mu.RLock()
	defer activeSub.mu.RUnlock()

	// Return a copy
	messages := make([]SubscriptionMessage, len(activeSub.Messages))
	copy(messages, activeSub.Messages)
	return messages, nil
}

func (s *SubscribeService) GetActiveSubscriptions() []string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	subjects := make([]string, 0, len(s.subscriptions))
	for subject := range s.subscriptions {
		subjects = append(subjects, subject)
	}
	return subjects
}

func (s *SubscribeService) ClearMessages(subject string) error {
	s.mu.RLock()
	defer s.mu.RUnlock()

	activeSub, exists := s.subscriptions[subject]
	if !exists {
		return fmt.Errorf("not subscribed to subject: %s", subject)
	}

	activeSub.mu.Lock()
	activeSub.Messages = make([]SubscriptionMessage, 0)
	activeSub.mu.Unlock()

	return nil
}
