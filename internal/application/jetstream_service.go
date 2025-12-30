package application

import (
	"context"
	"fmt"
	"sync"
	"time"

	"natsman/internal/domain"
	"natsman/internal/infrastructure/nats"
	"natsman/internal/infrastructure/scripting"

	"github.com/nats-io/nats.go/jetstream"
)

type JetStreamService struct {
	repo     domain.ProfileRepository
	executor *scripting.Executor
	mu       sync.RWMutex
	// Cache for fetched messages
	messageCache map[string]*CachedMessages
	cacheMu      sync.RWMutex
}

type CachedMessages struct {
	Messages  []StreamMessage
	Timestamp time.Time
	Total     uint64
}

type StreamInfo struct {
	Name     string   `json:"name"`
	Subjects []string `json:"subjects"`
	Storage  string   `json:"storage"`
	Replicas int      `json:"replicas"`
}

type StreamCreateRequest struct {
	Name     string      `json:"name"`
	Subjects []string    `json:"subjects"`
	Storage  string      `json:"storage"` // "file" or "memory"
	Replicas int         `json:"replicas"`
	Config   nats.Config `json:"config"`
}

type ConsumerInfo struct {
	StreamName   string `json:"stream_name"`
	Name         string `json:"name"`
	DeliverPolicy string `json:"deliver_policy"`
	AckPolicy    string `json:"ack_policy"`
}

type ConsumerCreateRequest struct {
	StreamName    string      `json:"stream_name"`
	Name          string      `json:"name"`
	DeliverPolicy string      `json:"deliver_policy"` // "all", "last", "new"
	AckPolicy     string      `json:"ack_policy"`     // "explicit", "none", "all"
	FilterSubject string      `json:"filter_subject"`
	Config        nats.Config `json:"config"`
}

type JSPublishRequest struct {
	Subject   string                    `json:"subject"`
	Body      string                    `json:"body"`
	Variables map[string]domain.Variable `json:"variables"`
	Config    nats.Config               `json:"config"`
}

type JSPublishResponse struct {
	Stream   string `json:"stream"`
	Sequence uint64 `json:"sequence"`
	Status   string `json:"status"`
}

type StreamMessage struct {
	Sequence  uint64 `json:"sequence"`
	Subject   string `json:"subject"`
	Data      string `json:"data"`
	Time      string `json:"time"`
	Size      int    `json:"size"`
}

type GetMessagesRequest struct {
	StreamName string      `json:"stream_name"`
	Limit      int         `json:"limit"`
	StartSeq   uint64      `json:"start_seq"` // Start from this sequence (for pagination)
	Config     nats.Config `json:"config"`
}

type GetMessagesResponse struct {
	Messages   []StreamMessage `json:"messages"`
	Total      uint64          `json:"total"`
	StartSeq   uint64          `json:"start_seq"`
	EndSeq     uint64          `json:"end_seq"`
	HasMore    bool            `json:"has_more"`
}

func NewJetStreamService(repo domain.ProfileRepository, executor *scripting.Executor) *JetStreamService {
	return &JetStreamService{
		repo:         repo,
		executor:     executor,
		messageCache: make(map[string]*CachedMessages),
	}
}

// CreateStream creates a new JetStream stream
func (s *JetStreamService) CreateStream(req StreamCreateRequest) error {
	// Get config from store if not provided
	cfg := req.Config
	if cfg.URL == "" {
		cfg.URL, _ = s.repo.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.repo.GetNatsConfig()
	}

	client, err := nats.Connect(cfg)
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
func (s *JetStreamService) ListStreams(cfg nats.Config) ([]string, error) {
	// Get config from store if not provided
	if cfg.URL == "" {
		cfg.URL, _ = s.repo.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.repo.GetNatsConfig()
	}

	client, err := nats.Connect(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	streams := client.ListStreams()
	return streams, nil
}

// GetStreamInfo gets information about a specific stream
func (s *JetStreamService) GetStreamInfo(streamName string, cfg nats.Config) (*StreamInfo, error) {
	// Get config from store if not provided
	if cfg.URL == "" {
		cfg.URL, _ = s.repo.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.repo.GetNatsConfig()
	}

	client, err := nats.Connect(cfg)
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
func (s *JetStreamService) DeleteStream(streamName string, cfg nats.Config) error {
	// Get config from store if not provided
	if cfg.URL == "" {
		cfg.URL, _ = s.repo.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.repo.GetNatsConfig()
	}

	client, err := nats.Connect(cfg)
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
		cfg.URL, _ = s.repo.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.repo.GetNatsConfig()
	}

	client, err := nats.Connect(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	// Process variables (same as request_service)
	globalVars := s.repo.GetGlobalVars()
	finalVars := make(map[string]string)

	evaluateVar := func(key string, v domain.Variable) (string, error) {
		if v.Type == "dynamic" {
			return s.executor.Eval(v.Value)
		}
		return v.Value, nil
	}

	// 1. Process Global Variables
	for k, v := range globalVars {
		val, err := evaluateVar(k, v)
		if err != nil {
			return nil, fmt.Errorf("global variable '%s' error: %v", k, err)
		}
		finalVars[k] = val
	}

	// 2. Process Local Variables (Override globals)
	for k, v := range req.Variables {
		val, err := evaluateVar(k, v)
		if err != nil {
			return nil, fmt.Errorf("local variable '%s' error: %v", k, err)
		}
		finalVars[k] = val
	}

	// 3. Apply template substitution
	subject, err := ProcessTemplate(req.Subject, finalVars)
	if err != nil {
		return nil, fmt.Errorf("subject template error: %w", err)
	}

	body, err := ProcessTemplate(req.Body, finalVars)
	if err != nil {
		return nil, fmt.Errorf("body template error: %w", err)
	}

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
		cfg.URL, _ = s.repo.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.repo.GetNatsConfig()
	}

	client, err := nats.Connect(cfg)
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
func (s *JetStreamService) DeleteConsumer(streamName, consumerName string, cfg nats.Config) error {
	// Get config from store if not provided
	if cfg.URL == "" {
		cfg.URL, _ = s.repo.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.repo.GetNatsConfig()
	}

	client, err := nats.Connect(cfg)
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

// GetStreamMessages retrieves messages from a stream
func (s *JetStreamService) GetStreamMessages(req GetMessagesRequest) (*GetMessagesResponse, error) {
	// Get config from store if not provided
	cfg := req.Config
	if cfg.URL == "" {
		cfg.URL, _ = s.repo.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.repo.GetNatsConfig()
	}

	client, err := nats.Connect(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	// Get stream info to get total message count
	stream, err := client.GetStream(req.StreamName)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	info, err := stream.Info(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream info: %w", err)
	}

	// Get messages
	limit := req.Limit
	if limit <= 0 {
		limit = 10
	}

	// Determine start sequence
	startSeq := req.StartSeq
	if startSeq == 0 {
		startSeq = 1 // Start from first message if not specified
	}

	msgs, err := client.GetStreamMessages(req.StreamName, limit, startSeq)
	if err != nil {
		return nil, fmt.Errorf("failed to get messages: %w", err)
	}

	// Convert to response format
	messages := make([]StreamMessage, 0, len(msgs))
	var firstSeq, lastSeq uint64
	for i, msg := range msgs {
		meta, _ := msg.Metadata()
		seq := meta.Sequence.Stream
		if i == 0 {
			firstSeq = seq
		}
		lastSeq = seq
		messages = append(messages, StreamMessage{
			Sequence: seq,
			Subject:  msg.Subject(),
			Data:     string(msg.Data()),
			Time:     meta.Timestamp.Format(time.RFC3339),
			Size:     len(msg.Data()),
		})
	}

	// Determine if there are more messages
	hasMore := false
	if len(messages) > 0 && lastSeq < info.State.LastSeq {
		hasMore = true
	}

	return &GetMessagesResponse{
		Messages: messages,
		Total:    info.State.Msgs,
		StartSeq: firstSeq,
		EndSeq:   lastSeq,
		HasMore:  hasMore,
	}, nil
}

// FetchAllMessages fetches all messages from a stream using a consumer and caches them
func (s *JetStreamService) FetchAllMessages(streamName string, cfg nats.Config, refresh bool) (*GetMessagesResponse, error) {
	// Check cache first unless refresh is requested
	if !refresh {
		s.cacheMu.RLock()
		cached, exists := s.messageCache[streamName]
		s.cacheMu.RUnlock()
		
		if exists {
			return &GetMessagesResponse{
				Messages: cached.Messages,
				Total:    cached.Total,
				StartSeq: cached.Messages[0].Sequence,
				EndSeq:   cached.Messages[len(cached.Messages)-1].Sequence,
				HasMore:  false,
			}, nil
		}
	}

	// Get config from store if not provided
	if cfg.URL == "" {
		cfg.URL, _ = s.repo.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222"
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.repo.GetNatsConfig()
	}

	client, err := nats.Connect(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	// Get stream
	stream, err := client.GetStream(streamName)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream: %w", err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Get stream info
	info, err := stream.Info(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream info: %w", err)
	}

	if info.State.Msgs == 0 {
		return &GetMessagesResponse{
			Messages: []StreamMessage{},
			Total:    0,
			StartSeq: 0,
			EndSeq:   0,
			HasMore:  false,
		}, nil
	}

	// Create a temporary consumer to fetch all messages
	consumerName := fmt.Sprintf("temp_viewer_%d", time.Now().Unix())
	consumer, err := stream.CreateOrUpdateConsumer(ctx, jetstream.ConsumerConfig{
		Name:          consumerName,
		DeliverPolicy: jetstream.DeliverAllPolicy,
		AckPolicy:     jetstream.AckNonePolicy,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create consumer: %w", err)
	}

	// Fetch all messages
	messages := make([]StreamMessage, 0, info.State.Msgs)
	fetchCtx, fetchCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer fetchCancel()

	msgBatch, err := consumer.Fetch(int(info.State.Msgs), jetstream.FetchMaxWait(1*time.Second))
	if err != nil {
		// Try to clean up consumer
		stream.DeleteConsumer(ctx, consumerName)
		return nil, fmt.Errorf("failed to fetch messages: %w", err)
	}

	for msg := range msgBatch.Messages() {
		meta, _ := msg.Metadata()
		messages = append(messages, StreamMessage{
			Sequence: meta.Sequence.Stream,
			Subject:  msg.Subject(),
			Data:     string(msg.Data()),
			Time:     meta.Timestamp.Format(time.RFC3339),
			Size:     len(msg.Data()),
		})
	}

	// Clean up consumer
	if err := stream.DeleteConsumer(fetchCtx, consumerName); err != nil {
		// Log but don't fail - consumer will be deleted eventually
		fmt.Printf("Warning: failed to delete temporary consumer %s: %v\n", consumerName, err)
	}

	// Cache the results
	s.cacheMu.Lock()
	s.messageCache[streamName] = &CachedMessages{
		Messages:  messages,
		Timestamp: time.Now(),
		Total:     info.State.Msgs,
	}
	s.cacheMu.Unlock()

	var startSeq, endSeq uint64
	if len(messages) > 0 {
		startSeq = messages[0].Sequence
		endSeq = messages[len(messages)-1].Sequence
	}

	return &GetMessagesResponse{
		Messages: messages,
		Total:    info.State.Msgs,
		StartSeq: startSeq,
		EndSeq:   endSeq,
		HasMore:  false,
	}, nil
}
