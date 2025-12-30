package main

import (
	"context"
	"fmt"
	"natsman/pkg/natsclient"
	"natsman/pkg/service"
	"natsman/pkg/store"
)

// App struct
type App struct {
	ctx        context.Context
	store      *store.Store
	service    *service.RequestService
	subService *service.SubscribeService
	jsService  *service.JetStreamService
	kvService  *service.KVService
}

// NewApp creates a new App application struct
func NewApp(store *store.Store, service *service.RequestService, subService *service.SubscribeService, jsService *service.JetStreamService, kvService *service.KVService) *App {
	return &App{
		store:      store,
		service:    service,
		subService: subService,
		jsService:  jsService,
		kvService:  kvService,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

// --- Store Wrappers ---

func (a *App) GetTree() (*store.TreeNode, error) {
	return a.store.GetTree()
}

func (a *App) GetTemplate(path string) (*store.Template, error) {
	return a.store.GetTemplate(path)
}

func (a *App) SaveTemplate(path string, tmpl *store.Template) error {
	return a.store.SaveTemplate(path, tmpl)
}

func (a *App) CreateTemplate(path string, tmpl *store.Template) error {
	return a.store.CreateTemplate(path, tmpl)
}

func (a *App) DeleteTemplate(path string) error {
	return a.store.DeleteTemplate(path)
}

func (a *App) CreateFolder(path string) error {
	return a.store.CreateFolder(path)
}

func (a *App) MoveTemplate(from, to string) error {
	return a.store.MoveTemplate(from, to)
}

// --- Globals ---

func (a *App) GetGlobalVars() map[string]store.Variable {
	return a.store.GetGlobalVars()
}

func (a *App) GetGlobalsProfiles() []store.GlobalsProfile {
	return a.store.GetGlobalsProfiles()
}

func (a *App) GetActiveGlobalsProfile() string {
	return a.store.GetActiveGlobalsProfile()
}

func (a *App) SaveGlobalsProfile(profile store.GlobalsProfile) error {
	return a.store.SaveGlobalsProfile(profile)
}

func (a *App) DeleteGlobalsProfile(name string) error {
	return a.store.DeleteGlobalsProfile(name)
}

func (a *App) ActivateGlobalsProfile(name string) error {
	return a.store.ActivateGlobalsProfile(name)
}

// --- NATS Profiles ---

func (a *App) GetNatsProfiles() []store.NatsProfile {
	return a.store.GetNatsProfiles()
}

func (a *App) GetActiveNatsProfile() string {
	return a.store.GetActiveNatsProfile()
}

func (a *App) SaveNatsProfile(profile store.NatsProfile) error {
	return a.store.SaveNatsProfile(profile)
}

func (a *App) DeleteNatsProfile(name string) error {
	return a.store.DeleteNatsProfile(name)
}

func (a *App) ActivateNatsProfile(name string) error {
	return a.store.ActivateNatsProfile(name)
}

func (a *App) GetNatsConfig() map[string]string {
	url, creds := a.store.GetNatsConfig()
	return map[string]string{
		"url":        url,
		"creds_path": creds,
	}
}

// --- Service Wrappers ---

func (a *App) SendRequest(req service.RequestPayload) (*service.SendReqResult, error) {
	return a.service.SendRequest(req)
}

func (a *App) ExtractVariables(content string) []string {
	return a.service.ExtractVariables(content)
}

func (a *App) EvalDynamicScript(script string) (string, error) {
	return a.service.EvalDynamicScript(script)
}

// --- Subscribe Service Wrappers ---

func (a *App) Subscribe(payload service.SubscribePayload) error {
	return a.subService.Subscribe(payload)
}

func (a *App) Unsubscribe(subject string) error {
	return a.subService.Unsubscribe(subject)
}

func (a *App) GetSubscriptionMessages(subject string) ([]service.SubscriptionMessage, error) {
	return a.subService.GetMessages(subject)
}

func (a *App) GetActiveSubscriptions() []string {
	return a.subService.GetActiveSubscriptions()
}

func (a *App) ClearSubscriptionMessages(subject string) error {
	return a.subService.ClearMessages(subject)
}

// --- JetStream Methods ---

func (a *App) CreateJSStream(req service.StreamCreateRequest) error {
	return a.jsService.CreateStream(req)
}

func (a *App) ListJSStreams() ([]string, error) {
	cfg := natsclient.Config{}
	return a.jsService.ListStreams(cfg)
}

func (a *App) GetJSStreamInfo(streamName string) (*service.StreamInfo, error) {
	cfg := natsclient.Config{}
	return a.jsService.GetStreamInfo(streamName, cfg)
}

func (a *App) DeleteJSStream(streamName string) error {
	cfg := natsclient.Config{}
	return a.jsService.DeleteStream(streamName, cfg)
}

func (a *App) JSPublish(req service.JSPublishRequest) (*service.JSPublishResponse, error) {
	return a.jsService.PublishToJetStream(req)
}

func (a *App) GetStreamMessages(req service.GetMessagesRequest) (*service.GetMessagesResponse, error) {
	return a.jsService.GetStreamMessages(req)
}

func (a *App) FetchAllStreamMessages(streamName string, refresh bool) (*service.GetMessagesResponse, error) {
	return a.jsService.FetchAllMessages(streamName, natsclient.Config{}, refresh)
}

func (a *App) CreateJSConsumer(req service.ConsumerCreateRequest) error {
	return a.jsService.CreateConsumer(req)
}

func (a *App) DeleteJSConsumer(streamName, consumerName string) error {
	cfg := natsclient.Config{}
	return a.jsService.DeleteConsumer(streamName, consumerName, cfg)
}

// --- KV Operations ---

func (a *App) CreateKVBucket(bucketName string, maxHistoryPerKey int) error {
	return a.kvService.CreateKVBucket(service.CreateKVBucketRequest{
		BucketName:       bucketName,
		MaxHistoryPerKey: maxHistoryPerKey,
	})
}

func (a *App) DeleteKVBucket(bucketName string) error {
	return a.kvService.DeleteKVBucket(service.DeleteKVBucketRequest{
		BucketName: bucketName,
	})
}

func (a *App) ListKVBuckets() ([]string, error) {
	// TODO: Add profile parameter support
	resp, err := a.kvService.ListKVBuckets(service.ListKVBucketsRequest{Profile: "default"})
	if err != nil {
		return nil, err
	}
	return resp.Buckets, nil
}

func (a *App) KVPut(bucketName, key, value string) (uint64, error) {
	resp, err := a.kvService.KVPut(service.KVPutRequest{
		BucketName: bucketName,
		Key:        key,
		Value:      value,
	})
	if err != nil {
		return 0, err
	}
	return resp.Revision, nil
}

func (a *App) KVGet(bucketName, key string) (*service.KVEntry, error) {
	resp, err := a.kvService.KVGet(service.KVGetRequest{
		BucketName: bucketName,
		Key:        key,
	})
	if err != nil {
		return nil, err
	}
	return &resp.Entry, nil
}

func (a *App) KVDelete(bucketName, key string) error {
	return a.kvService.KVDelete(service.KVDeleteRequest{
		BucketName: bucketName,
		Key:        key,
	})
}

func (a *App) KVKeys(bucketName string) ([]string, error) {
	resp, err := a.kvService.KVKeys(service.KVKeysRequest{
		BucketName: bucketName,
	})
	if err != nil {
		return nil, err
	}
	return resp.Keys, nil
}

func (a *App) KVHistory(bucketName, key string) ([]service.KVEntry, error) {
	resp, err := a.kvService.KVHistory(service.KVHistoryRequest{
		BucketName: bucketName,
		Key:        key,
	})
	if err != nil {
		return nil, err
	}
	return resp.History, nil
}

func (a *App) GetKVBucketInfo(bucketName string) (map[string]interface{}, error) {
	return a.kvService.GetKVBucketInfo(service.GetKVBucketInfoRequest{Profile: "default", BucketName: bucketName})
}

// Simple test method
func (a *App) HelloRPC(name string) string {
	return fmt.Sprintf("Hello %s from RPC!", name)
}
