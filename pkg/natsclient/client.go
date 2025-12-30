package natsclient

import (
	"context"
	"fmt"
	"time"

	"github.com/nats-io/nats.go"
	"github.com/nats-io/nats.go/jetstream"
)

type Config struct {
	URL       string `json:"url"`
	CredsPath string `json:"creds_path"`
}

type Client struct {
	nc *nats.Conn
	js jetstream.JetStream
}

func Connect(cfg Config) (*Client, error) {
	opts := []nats.Option{}
	if cfg.CredsPath != "" {
		opts = append(opts, nats.UserCredentials(cfg.CredsPath))
	}

	// Default URL if empty
	url := cfg.URL
	if url == "" {
		url = nats.DefaultURL
	}

	nc, err := nats.Connect(url, opts...)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to NATS: %w", err)
	}

	// Initialize JetStream
	js, err := jetstream.New(nc)
	if err != nil {
		nc.Close()
		return nil, fmt.Errorf("failed to initialize JetStream: %w", err)
	}

	return &Client{nc: nc, js: js}, nil
}

func (c *Client) Close() {
	if c.nc != nil {
		c.nc.Close()
	}
}

func (c *Client) Request(subject string, data []byte, timeout time.Duration) ([]byte, error) {
	if c.nc == nil {
		return nil, fmt.Errorf("not connected")
	}

	msg, err := c.nc.Request(subject, data, timeout)
	if err != nil {
		return nil, err
	}

	return msg.Data, nil
}

func (c *Client) Publish(subject string, data []byte) error {
	if c.nc == nil {
		return fmt.Errorf("not connected")
	}

	return c.nc.Publish(subject, data)
}

type Subscription struct {
	sub *nats.Subscription
}

func (c *Client) Subscribe(subject string, handler func(msg *nats.Msg)) (*Subscription, error) {
	if c.nc == nil {
		return nil, fmt.Errorf("not connected")
	}

	sub, err := c.nc.Subscribe(subject, handler)
	if err != nil {
		return nil, err
	}

	return &Subscription{sub: sub}, nil
}

func (s *Subscription) Unsubscribe() error {
	if s.sub != nil {
		return s.sub.Unsubscribe()
	}
	return nil
}

func (c *Client) Drain() error {
	if c.nc != nil {
		return c.nc.Drain()
	}
	return nil
}

// JetStream methods

func (c *Client) JetStream() jetstream.JetStream {
	return c.js
}

// CreateStream creates a JetStream stream
func (c *Client) CreateStream(cfg jetstream.StreamConfig) (jetstream.Stream, error) {
	if c.js == nil {
		return nil, fmt.Errorf("JetStream not initialized")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return c.js.CreateStream(ctx, cfg)
}

// GetStream retrieves a stream by name
func (c *Client) GetStream(name string) (jetstream.Stream, error) {
	if c.js == nil {
		return nil, fmt.Errorf("JetStream not initialized")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return c.js.Stream(ctx, name)
}

// DeleteStream deletes a stream
func (c *Client) DeleteStream(name string) error {
	if c.js == nil {
		return fmt.Errorf("JetStream not initialized")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return c.js.DeleteStream(ctx, name)
}

// ListStreams lists all streams
func (c *Client) ListStreams() []string {
	if c.js == nil {
		return nil
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	var names []string
	streams := c.js.ListStreams(ctx)
	for stream := range streams.Info() {
		names = append(names, stream.Config.Name)
	}
	return names
}

// JSPublish publishes a message to JetStream
func (c *Client) JSPublish(subject string, data []byte) (*jetstream.PubAck, error) {
	if c.js == nil {
		return nil, fmt.Errorf("JetStream not initialized")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	return c.js.Publish(ctx, subject, data)
}

// CreateConsumer creates a JetStream consumer
func (c *Client) CreateConsumer(streamName string, cfg jetstream.ConsumerConfig) (jetstream.Consumer, error) {
	if c.js == nil {
		return nil, fmt.Errorf("JetStream not initialized")
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	stream, err := c.js.Stream(ctx, streamName)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream: %w", err)
	}
	
	return stream.CreateConsumer(ctx, cfg)
}

// GetConsumer retrieves a consumer
func (c *Client) GetConsumer(streamName, consumerName string) (jetstream.Consumer, error) {
	if c.js == nil {
		return nil, fmt.Errorf("JetStream not initialized")
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	stream, err := c.js.Stream(ctx, streamName)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream: %w", err)
	}
	
	return stream.Consumer(ctx, consumerName)
}

// DeleteConsumer deletes a consumer
func (c *Client) DeleteConsumer(streamName, consumerName string) error {
	if c.js == nil {
		return fmt.Errorf("JetStream not initialized")
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	stream, err := c.js.Stream(ctx, streamName)
	if err != nil {
		return fmt.Errorf("failed to get stream: %w", err)
	}
	
	return stream.DeleteConsumer(ctx, consumerName)
}

// GetStreamMessages retrieves messages from a stream
func (c *Client) GetStreamMessages(streamName string, limit int) ([]jetstream.Msg, error) {
	if c.js == nil {
		return nil, fmt.Errorf("JetStream not initialized")
	}
	
	if limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	
	stream, err := c.js.Stream(ctx, streamName)
	if err != nil {
		return nil, fmt.Errorf("failed to get stream: %w", err)
	}
	
	// Create a temporary consumer to fetch messages
	consumerCfg := jetstream.ConsumerConfig{
		DeliverPolicy: jetstream.DeliverAllPolicy,
		AckPolicy:     jetstream.AckNonePolicy,
	}
	
	consumer, err := stream.CreateOrUpdateConsumer(ctx, consumerCfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create consumer: %w", err)
	}
	
	// Fetch messages
	messages := make([]jetstream.Msg, 0, limit)
	msgBatch, err := consumer.Fetch(limit, jetstream.FetchMaxWait(5*time.Second))
	if err != nil {
		return nil, fmt.Errorf("failed to fetch messages: %w", err)
	}
	
	for msg := range msgBatch.Messages() {
		messages = append(messages, msg)
		if len(messages) >= limit {
			break
		}
	}
	
	return messages, nil
}


