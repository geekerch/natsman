package service

import (
	"context"
	"fmt"
	"sync"
	"time"

	"natsman/pkg/natsclient"
	"natsman/pkg/store"

	"github.com/nats-io/nats.go/jetstream"
)

type JetStreamService struct {
	store *store.Store
	mu    sync.RWMutex
}

type StreamInfo struct {
	Name     string   `json:"name"`
	Subjects []string `json:"subjects"`
	Storage  string   `json:"storage"`
	Replicas int      `json:"replicas"`
}

type StreamCreateRequest struct {
	Name     string   `json:"name"`
	Subjects []string `json:"subjects"`
	Storage  string   `json:"storage"` // "file" or "memory"
	Replicas int      `json:"replicas"`
	Config   natsclient.Config `json:"config"`
}

type ConsumerInfo struct {
	StreamName   string `json:"stream_name"`
	Name         string `json:"name"`
	DeliverPolicy string `json:"deliver_policy"`
	AckPolicy    string `json:"ack_policy"`
}

type ConsumerCreateRequest struct {
	StreamName    string `json:"stream_name"`
	Name          string `json:"name"`
	DeliverPolicy string `json:"deliver_policy"` // "all", "last", "new"
	AckPolicy     string `json:"ack_policy"`     // "explicit", "none", "all"
	FilterSubject string `json:"filter_subject"`
	Config        natsclient.Config `json:"config"`
}

type JSPublishRequest struct {
	Subject   string                `json:"subject"`
	Body      string                `json:"body"`
	Variables map[string]string     `json:"variables"`
	Config    natsclient.Config     `json:"config"`
}

type JSPublishResponse struct {
	Stream   string `json:"stream"`
	Sequence uint64 `json:"sequence"`
	Status   string `json:"status"`
}

func NewJetStreamService(store *store.Store) *JetStreamService {
	return &JetStreamService{
		store: store,
	}
}

// CreateStream creates a new JetStream stream
func (s *JetStreamService) CreateStream(req StreamCreateRequest) error {
	// Get config from store if not provided
	cfg := req.Config
	if cfg.URL == "" {
		cfg.URL, _ = s.store.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.store.GetNatsConfig()
	}

	client, err := natsclient.Connect(cfg)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	// Determine storage type
	var storage jetstream.StorageType
	switch req.Storage {
	case "memory":
		storage = jetstream.MemoryStorage
	default:
		storage = jetstream.FileStorage
	}

	// Create stream config
	streamConfig := jetstream.StreamConfig{
		Name:     req.Name,
		Subjects: req.Subjects,
		Storage:  storage,
	}
	
	if req.Replicas > 0 {
		streamConfig.Replicas = req.Replicas
	}

	_, err = client.CreateStream(streamConfig)
	if err != nil {
		return fmt.Errorf("failed to create stream: %w", err)
	}

	return nil
}

// ListStreams lists all streams
func (s *JetStreamService) ListStreams(cfg natsclient.Config) ([]string, error) {
	// Get config from store if not provided
	if cfg.URL == "" {
		cfg.URL, _ = s.store.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.store.GetNatsConfig()
	}

	client, err := natsclient.Connect(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	streams := client.ListStreams()
	return streams, nil
}

// GetStreamInfo gets information about a specific stream
func (s *JetStreamService) GetStreamInfo(streamName string, cfg natsclient.Config) (*StreamInfo, error) {
	// Get config from store if not provided
	if cfg.URL == "" {
		cfg.URL, _ = s.store.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.store.GetNatsConfig()
	}

	client, err := natsclient.Connect(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	stream, err := client.GetStream(streamName)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	info, err := stream.Info(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream info: %w", err)
	}

	storage := "file"
	if info.Config.Storage == jetstream.MemoryStorage {
		storage = "memory"
	}

	return &StreamInfo{
		Name:     info.Config.Name,
		Subjects: info.Config.Subjects,
		Storage:  storage,
		Replicas: info.Config.Replicas,
	}, nil
}

// DeleteStream deletes a stream
func (s *JetStreamService) DeleteStream(streamName string, cfg natsclient.Config) error {
	// Get config from store if not provided
	if cfg.URL == "" {
		cfg.URL, _ = s.store.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.store.GetNatsConfig()
	}

	client, err := natsclient.Connect(cfg)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	err = client.DeleteStream(streamName)
	if err != nil {
		return fmt.Errorf("failed to delete stream: %w", err)
	}

	return nil
}

// PublishToJetStream publishes a message to JetStream
func (s *JetStreamService) PublishToJetStream(req JSPublishRequest) (*JSPublishResponse, error) {
	// Get config from store if not provided
	cfg := req.Config
	if cfg.URL == "" {
		cfg.URL, _ = s.store.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.store.GetNatsConfig()
	}

	client, err := natsclient.Connect(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	// Parse variables in subject and body (similar to request_service)
	subject := req.Subject
	body := req.Body
	
	// TODO: Apply variable substitution if needed
	// For now, just use the values as-is

	ack, err := client.JSPublish(subject, []byte(body))
	if err != nil {
		return nil, fmt.Errorf("failed to publish: %w", err)
	}

	return &JSPublishResponse{
		Stream:   ack.Stream,
		Sequence: ack.Sequence,
		Status:   "published",
	}, nil
}

// CreateConsumer creates a JetStream consumer
func (s *JetStreamService) CreateConsumer(req ConsumerCreateRequest) error {
	// Get config from store if not provided
	cfg := req.Config
	if cfg.URL == "" {
		cfg.URL, _ = s.store.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.store.GetNatsConfig()
	}

	client, err := natsclient.Connect(cfg)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	// Parse deliver policy
	var deliverPolicy jetstream.DeliverPolicy
	switch req.DeliverPolicy {
	case "last":
		deliverPolicy = jetstream.DeliverLastPolicy
	case "new":
		deliverPolicy = jetstream.DeliverNewPolicy
	default:
		deliverPolicy = jetstream.DeliverAllPolicy
	}

	// Parse ack policy
	var ackPolicy jetstream.AckPolicy
	switch req.AckPolicy {
	case "none":
		ackPolicy = jetstream.AckNonePolicy
	case "all":
		ackPolicy = jetstream.AckAllPolicy
	default:
		ackPolicy = jetstream.AckExplicitPolicy
	}

	consumerConfig := jetstream.ConsumerConfig{
		Name:          req.Name,
		DeliverPolicy: deliverPolicy,
		AckPolicy:     ackPolicy,
	}
	
	if req.FilterSubject != "" {
		consumerConfig.FilterSubject = req.FilterSubject
	}

	_, err = client.CreateConsumer(req.StreamName, consumerConfig)
	if err != nil {
		return fmt.Errorf("failed to create consumer: %w", err)
	}

	return nil
}

// DeleteConsumer deletes a consumer
func (s *JetStreamService) DeleteConsumer(streamName, consumerName string, cfg natsclient.Config) error {
	// Get config from store if not provided
	if cfg.URL == "" {
		cfg.URL, _ = s.store.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.store.GetNatsConfig()
	}

	client, err := natsclient.Connect(cfg)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	err = client.DeleteConsumer(streamName, consumerName)
	if err != nil {
		return fmt.Errorf("failed to delete consumer: %w", err)
	}

	return nil
}
