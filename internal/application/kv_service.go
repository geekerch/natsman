package application

import (
	"context"
	"fmt"
	"time"

	"natsman/internal/domain"
	"natsman/internal/infrastructure/nats"
)

type KVService struct {
	repo domain.ProfileRepository
}

func NewKVService(repo domain.ProfileRepository) *KVService {
	return &KVService{
		repo: repo,
	}
}

type CreateKVBucketRequest struct {
	Profile           string `json:"profile"`
	BucketName        string `json:"bucket_name"`
	MaxHistoryPerKey  int    `json:"max_history_per_key"`
}

type KVPutRequest struct {
	Profile    string `json:"profile"`
	BucketName string `json:"bucket_name"`
	Key        string `json:"key"`
	Value      string `json:"value"`
}

type KVGetRequest struct {
	Profile    string `json:"profile"`
	BucketName string `json:"bucket_name"`
	Key        string `json:"key"`
}

type KVDeleteRequest struct {
	Profile    string `json:"profile"`
	BucketName string `json:"bucket_name"`
	Key        string `json:"key"`
}

type KVKeysRequest struct {
	Profile    string `json:"profile"`
	BucketName string `json:"bucket_name"`
}

type KVHistoryRequest struct{
	Profile    string `json:"profile"`
	BucketName string `json:"bucket_name"`
	Key        string `json:"key"`
}

type DeleteKVBucketRequest struct {
	Profile    string `json:"profile"`
	BucketName string `json:"bucket_name"`
}

type ListKVBucketsRequest struct {
	Profile string `json:"profile"`
}

type GetKVBucketInfoRequest struct {
	Profile    string `json:"profile"`
	BucketName string `json:"bucket_name"`
}

type KVEntry struct {
	Key       string    `json:"key"`
	Value     string    `json:"value"`
	Revision  uint64    `json:"revision"`
	Created   time.Time `json:"created"`
	Operation string    `json:"operation"`
}

type KVPutResponse struct {
	Revision uint64 `json:"revision"`
}

type KVGetResponse struct {
	Entry KVEntry `json:"entry"`
}

type KVKeysResponse struct {
	Keys []string `json:"keys"`
}

type KVHistoryResponse struct {
	History []KVEntry `json:"history"`
}

type ListKVBucketsResponse struct {
	Buckets []string `json:"buckets"`
}

func (s *KVService) getConfig(profile string) (nats.Config, error) {
	// TODO: Implement profile-based config
	// For now, use default config from store
	url, credsPath := s.repo.GetNatsConfig()
	if url == "" {
		url = "nats://localhost:4222"
	}
	return nats.Config{
		URL:       url,
		CredsPath: credsPath,
	}, nil
}

func (s *KVService) CreateKVBucket(req CreateKVBucketRequest) error {
	cfg, err := s.getConfig(req.Profile)
	if err != nil {
		return err
	}

	client, err := nats.Connect(cfg)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if req.MaxHistoryPerKey <= 0 {
		req.MaxHistoryPerKey = 1
	}

	return client.CreateKVBucket(ctx, req.BucketName, req.MaxHistoryPerKey)
}

func (s *KVService) DeleteKVBucket(req DeleteKVBucketRequest) error {
	cfg, err := s.getConfig(req.Profile)
	if err != nil {
		return err
	}

	client, err := nats.Connect(cfg)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	return client.DeleteKVBucket(ctx, req.BucketName)
}

func (s *KVService) ListKVBuckets(req ListKVBucketsRequest) (*ListKVBucketsResponse, error) {
	cfg, err := s.getConfig(req.Profile)
	if err != nil {
		return nil, err
	}

	client, err := nats.Connect(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	buckets, err := client.ListKVBuckets(ctx)
	if err != nil {
		return nil, err
	}

	return &ListKVBucketsResponse{Buckets: buckets}, nil
}

func (s *KVService) KVPut(req KVPutRequest) (*KVPutResponse, error) {
	cfg, err := s.getConfig(req.Profile)
	if err != nil {
		return nil, err
	}

	client, err := nats.Connect(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	revision, err := client.KVPut(ctx, req.BucketName, req.Key, []byte(req.Value))
	if err != nil {
		return nil, err
	}

	return &KVPutResponse{Revision: revision}, nil
}

func (s *KVService) KVGet(req KVGetRequest) (*KVGetResponse, error) {
	cfg, err := s.getConfig(req.Profile)
	if err != nil {
		return nil, err
	}

	client, err := nats.Connect(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	entry, err := client.KVGet(ctx, req.BucketName, req.Key)
	if err != nil {
		return nil, err
	}

	operation := "PUT"
	if entry.Operation().String() == "DEL" || entry.Operation().String() == "PURGE" {
		operation = "DEL"
	}

	return &KVGetResponse{
		Entry: KVEntry{
			Key:       entry.Key(),
			Value:     string(entry.Value()),
			Revision:  entry.Revision(),
			Created:   entry.Created(),
			Operation: operation,
		},
	}, nil
}

func (s *KVService) KVDelete(req KVDeleteRequest) error {
	cfg, err := s.getConfig(req.Profile)
	if err != nil {
		return err
	}

	client, err := nats.Connect(cfg)
	if err != nil {
		return fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	return client.KVDelete(ctx, req.BucketName, req.Key)
}

func (s *KVService) KVKeys(req KVKeysRequest) (*KVKeysResponse, error) {
	cfg, err := s.getConfig(req.Profile)
	if err != nil {
		return nil, err
	}

	client, err := nats.Connect(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	keys, err := client.KVKeys(ctx, req.BucketName)
	if err != nil {
		return nil, err
	}

	return &KVKeysResponse{Keys: keys}, nil
}

func (s *KVService) KVHistory(req KVHistoryRequest) (*KVHistoryResponse, error) {
	cfg, err := s.getConfig(req.Profile)
	if err != nil {
		return nil, err
	}

	client, err := nats.Connect(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	entries, err := client.KVHistory(ctx, req.BucketName, req.Key)
	if err != nil {
		return nil, err
	}

	history := make([]KVEntry, 0, len(entries))
	for _, entry := range entries {
		operation := "PUT"
		if entry.Operation().String() == "DEL" || entry.Operation().String() == "PURGE" {
			operation = "DEL"
		}

		history = append(history, KVEntry{
			Key:       entry.Key(),
			Value:     string(entry.Value()),
			Revision:  entry.Revision(),
			Created:   entry.Created(),
			Operation: operation,
		})
	}

	return &KVHistoryResponse{History: history}, nil
}

func (s *KVService) GetKVBucketInfo(req GetKVBucketInfoRequest) (map[string]interface{}, error) {
	cfg, err := s.getConfig(req.Profile)
	if err != nil {
		return nil, err
	}

	client, err := nats.Connect(cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to connect: %w", err)
	}
	defer client.Close()

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	kv, err := client.GetKVBucket(ctx, req.BucketName)
	if err != nil {
		return nil, err
	}

	status, err := kv.Status(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get bucket status: %w", err)
	}

	info := map[string]interface{}{
		"bucket":          status.Bucket(),
		"values":          status.Values(),
		"history":         status.History(),
		"ttl":             status.TTL().String(),
		"bucket_location": status.BackingStore(),
	}

	return info, nil
}
