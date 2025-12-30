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

// GetStreamMessages retrieves messages from a stream starting from a specific sequence
func (c *Client) GetStreamMessages(streamName string, limit int, startSeq uint64) ([]jetstream.Msg, error) {
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
	
	// Create an ephemeral consumer to fetch messages
	consumerCfg := jetstream.ConsumerConfig{
		AckPolicy: jetstream.AckNonePolicy,
		InactiveThreshold: 5 * time.Second, // Auto-delete after 5s of inactivity
	}
	
	// Set start sequence if provided, otherwise start from beginning
	if startSeq > 0 {
		consumerCfg.DeliverPolicy = jetstream.DeliverByStartSequencePolicy
		consumerCfg.OptStartSeq = startSeq
	} else {
		consumerCfg.DeliverPolicy = jetstream.DeliverAllPolicy
	}
	
	consumer, err := stream.CreateOrUpdateConsumer(ctx, consumerCfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create consumer: %w", err)
	}
	
	// Delete consumer after use
	defer func() {
		deleteCtx, deleteCancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer deleteCancel()
		stream.DeleteConsumer(deleteCtx, consumer.CachedInfo().Name)
	}()
	
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

// KV Operations

// CreateKVBucket creates a new KV bucket
func (c *Client) CreateKVBucket(ctx context.Context, bucketName string, maxHistoryPerKey int) error {
	if c.js == nil {
		return fmt.Errorf("JetStream not initialized")
	}
	
	config := jetstream.KeyValueConfig{
		Bucket:  bucketName,
		History: uint8(maxHistoryPerKey),
	}
	
	_, err := c.js.CreateKeyValue(ctx, config)
	if err != nil {
		return fmt.Errorf("failed to create KV bucket: %w", err)
	}
	
	return nil
}

// DeleteKVBucket deletes a KV bucket
func (c *Client) DeleteKVBucket(ctx context.Context, bucketName string) error {
	if c.js == nil {
		return fmt.Errorf("JetStream not initialized")
	}
	
	err := c.js.DeleteKeyValue(ctx, bucketName)
	if err != nil {
		return fmt.Errorf("failed to delete KV bucket: %w", err)
	}
	
	return nil
}

// ListKVBuckets lists all KV buckets
func (c *Client) ListKVBuckets(ctx context.Context) ([]string, error) {
	if c.js == nil {
		return nil, fmt.Errorf("JetStream not initialized")
	}
	
	names := c.js.KeyValueStoreNames(ctx)
	buckets := []string{}
	
	for name := range names.Name() {
		buckets = append(buckets, name)
	}
	
	if names.Error() != nil {
		return buckets, fmt.Errorf("error listing KV buckets: %w", names.Error())
	}
	
	return buckets, nil
}

// GetKVBucket gets a KV bucket handle
func (c *Client) GetKVBucket(ctx context.Context, bucketName string) (jetstream.KeyValue, error) {
	if c.js == nil {
		return nil, fmt.Errorf("JetStream not initialized")
	}
	
	kv, err := c.js.KeyValue(ctx, bucketName)
	if err != nil {
		return nil, fmt.Errorf("failed to get KV bucket: %w", err)
	}
	
	return kv, nil
}

// KVPut puts a value into KV store
func (c *Client) KVPut(ctx context.Context, bucketName, key string, value []byte) (uint64, error) {
	kv, err := c.GetKVBucket(ctx, bucketName)
	if err != nil {
		return 0, err
	}
	
	revision, err := kv.Put(ctx, key, value)
	if err != nil {
		return 0, fmt.Errorf("failed to put KV value: %w", err)
	}
	
	return revision, nil
}

// KVGet gets a value from KV store
func (c *Client) KVGet(ctx context.Context, bucketName, key string) (jetstream.KeyValueEntry, error) {
	kv, err := c.GetKVBucket(ctx, bucketName)
	if err != nil {
		return nil, err
	}
	
	entry, err := kv.Get(ctx, key)
	if err != nil {
		return nil, fmt.Errorf("failed to get KV value: %w", err)
	}
	
	return entry, nil
}

// KVDelete deletes a key from KV store
func (c *Client) KVDelete(ctx context.Context, bucketName, key string) error {
	kv, err := c.GetKVBucket(ctx, bucketName)
	if err != nil {
		return err
	}
	
	err = kv.Delete(ctx, key)
	if err != nil {
		return fmt.Errorf("failed to delete KV key: %w", err)
	}
	
	return nil
}

// KVKeys lists all keys in a bucket
func (c *Client) KVKeys(ctx context.Context, bucketName string) ([]string, error) {
	kv, err := c.GetKVBucket(ctx, bucketName)
	if err != nil {
		return nil, err
	}
	
	keys, err := kv.Keys(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to list KV keys: %w", err)
	}
	
	return keys, nil
}

// KVHistory gets the history of a key
func (c *Client) KVHistory(ctx context.Context, bucketName, key string) ([]jetstream.KeyValueEntry, error) {
	kv, err := c.GetKVBucket(ctx, bucketName)
	if err != nil {
		return nil, err
	}
	
	history, err := kv.History(ctx, key)
	if err != nil {
		return nil, fmt.Errorf("failed to get KV history: %w", err)
	}
	
	return history, nil
}


