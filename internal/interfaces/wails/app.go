package wails

import (
	"context"
	"fmt"
	"natsman/internal/application"
	"natsman/internal/domain"
	"natsman/internal/infrastructure/nats"
)

// App struct
type App struct {
	ctx          context.Context
	tmplRepo     domain.TemplateRepository
	profileRepo  domain.ProfileRepository
	reqService   *application.RequestService
	subService   *application.SubscribeService
	jsService    *application.JetStreamService
	kvService    *application.KVService
}

// NewApp creates a new App application struct
func NewApp(tmplRepo domain.TemplateRepository, profileRepo domain.ProfileRepository, reqService *application.RequestService, subService *application.SubscribeService, jsService *application.JetStreamService, kvService *application.KVService) *App {
	return &App{
		tmplRepo:    tmplRepo,
		profileRepo: profileRepo,
		reqService:  reqService,
		subService:  subService,
		jsService:   jsService,
		kvService:   kvService,
	}
}

// Startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) Startup(ctx context.Context) {
	a.ctx = ctx
}

// --- Store Wrappers ---

func (a *App) GetTree() (*domain.TreeNode, error) {
	return a.tmplRepo.GetTree()
}

func (a *App) GetTemplate(path string) (*domain.Template, error) {
	return a.tmplRepo.GetTemplate(path)
}

func (a *App) SaveTemplate(path string, tmpl *domain.Template) error {
	return a.tmplRepo.SaveTemplate(path, tmpl)
}

func (a *App) CreateTemplate(path string, tmpl *domain.Template) error {
	return a.tmplRepo.CreateTemplate(path, tmpl)
}

func (a *App) DeleteTemplate(path string) error {
	return a.tmplRepo.DeleteTemplate(path)
}

func (a *App) CreateFolder(path string) error {
	return a.tmplRepo.CreateFolder(path)
}

func (a *App) MoveTemplate(from, to string) error {
	return a.tmplRepo.MoveTemplate(from, to)
}

// --- Globals ---

func (a *App) GetGlobalVars() map[string]domain.Variable {
	return a.profileRepo.GetGlobalVars()
}

func (a *App) GetGlobalsProfiles() []domain.GlobalsProfile {
	return a.profileRepo.GetGlobalsProfiles()
}

func (a *App) GetActiveGlobalsProfile() string {
	return a.profileRepo.GetActiveGlobalsProfile()
}

func (a *App) SaveGlobalsProfile(profile domain.GlobalsProfile) error {
	return a.profileRepo.SaveGlobalsProfile(profile)
}

func (a *App) DeleteGlobalsProfile(name string) error {
	return a.profileRepo.DeleteGlobalsProfile(name)
}

func (a *App) ActivateGlobalsProfile(name string) error {
	return a.profileRepo.ActivateGlobalsProfile(name)
}

// --- NATS Profiles ---

func (a *App) GetNatsProfiles() []domain.NatsProfile {
	return a.profileRepo.GetNatsProfiles()
}

func (a *App) GetActiveNatsProfile() string {
	return a.profileRepo.GetActiveNatsProfile()
}

func (a *App) SaveNatsProfile(profile domain.NatsProfile) error {
	return a.profileRepo.SaveNatsProfile(profile)
}

func (a *App) DeleteNatsProfile(name string) error {
	return a.profileRepo.DeleteNatsProfile(name)
}

func (a *App) ActivateNatsProfile(name string) error {
	return a.profileRepo.ActivateNatsProfile(name)
}

func (a *App) GetNatsConfig() map[string]string {
	url, creds := a.profileRepo.GetNatsConfig()
	return map[string]string{
		"url":        url,
		"creds_path": creds,
	}
}

// --- Service Wrappers ---

func (a *App) SendRequest(req application.RequestPayload) (*application.SendReqResult, error) {
	return a.reqService.SendRequest(req)
}

func (a *App) ExtractVariables(content string) []string {
	return a.reqService.ExtractVariables(content)
}

func (a *App) EvalDynamicScript(script string) (string, error) {
	return a.reqService.EvalDynamicScript(script)
}

// --- Subscribe Service Wrappers ---

func (a *App) Subscribe(payload application.SubscribePayload) error {
	return a.subService.Subscribe(payload)
}

func (a *App) Unsubscribe(subject string) error {
	return a.subService.Unsubscribe(subject)
}

func (a *App) GetSubscriptionMessages(subject string) ([]application.SubscriptionMessage, error) {
	return a.subService.GetMessages(subject)
}

func (a *App) GetActiveSubscriptions() []string {
	return a.subService.GetActiveSubscriptions()
}

func (a *App) ClearSubscriptionMessages(subject string) error {
	return a.subService.ClearMessages(subject)
}

// --- JetStream Methods ---

func (a *App) CreateJSStream(req application.StreamCreateRequest) error {
	return a.jsService.CreateStream(req)
}

func (a *App) ListJSStreams() ([]string, error) {
	cfg := nats.Config{}
	return a.jsService.ListStreams(cfg)
}

func (a *App) GetJSStreamInfo(streamName string) (*application.StreamInfo, error) {
	cfg := nats.Config{}
	return a.jsService.GetStreamInfo(streamName, cfg)
}

func (a *App) DeleteJSStream(streamName string) error {
	cfg := nats.Config{}
	return a.jsService.DeleteStream(streamName, cfg)
}

func (a *App) JSPublish(req application.JSPublishRequest) (*application.JSPublishResponse, error) {
	return a.jsService.PublishToJetStream(req)
}

func (a *App) GetStreamMessages(req application.GetMessagesRequest) (*application.GetMessagesResponse, error) {
	return a.jsService.GetStreamMessages(req)
}

func (a *App) FetchAllStreamMessages(streamName string, refresh bool) (*application.GetMessagesResponse, error) {
	return a.jsService.FetchAllMessages(streamName, nats.Config{}, refresh)
}

func (a *App) CreateJSConsumer(req application.ConsumerCreateRequest) error {
	return a.jsService.CreateConsumer(req)
}

func (a *App) DeleteJSConsumer(streamName, consumerName string) error {
	cfg := nats.Config{}
	return a.jsService.DeleteConsumer(streamName, consumerName, cfg)
}

// --- KV Operations ---

func (a *App) CreateKVBucket(bucketName string, maxHistoryPerKey int) error {
	return a.kvService.CreateKVBucket(application.CreateKVBucketRequest{
		BucketName:       bucketName,
		MaxHistoryPerKey: maxHistoryPerKey,
	})
}

func (a *App) DeleteKVBucket(bucketName string) error {
	return a.kvService.DeleteKVBucket(application.DeleteKVBucketRequest{
		BucketName: bucketName,
	})
}

func (a *App) ListKVBuckets() ([]string, error) {
	// TODO: Add profile parameter support
	resp, err := a.kvService.ListKVBuckets(application.ListKVBucketsRequest{Profile: "default"})
	if err != nil {
		return nil, err
	}
	return resp.Buckets, nil
}

func (a *App) KVPut(bucketName, key, value string) (uint64, error) {
	resp, err := a.kvService.KVPut(application.KVPutRequest{
		BucketName: bucketName,
		Key:        key,
		Value:      value,
	})
	if err != nil {
		return 0, err
	}
	return resp.Revision, nil
}

func (a *App) KVGet(bucketName, key string) (*application.KVEntry, error) {
	resp, err := a.kvService.KVGet(application.KVGetRequest{
		BucketName: bucketName,
		Key:        key,
	})
	if err != nil {
		return nil, err
	}
	return &resp.Entry, nil
}

func (a *App) KVDelete(bucketName, key string) error {
	return a.kvService.KVDelete(application.KVDeleteRequest{
		BucketName: bucketName,
		Key:        key,
	})
}

func (a *App) KVKeys(bucketName string) ([]string, error) {
	resp, err := a.kvService.KVKeys(application.KVKeysRequest{
		BucketName: bucketName,
	})
	if err != nil {
		return nil, err
	}
	return resp.Keys, nil
}

func (a *App) KVHistory(bucketName, key string) ([]application.KVEntry, error) {
	resp, err := a.kvService.KVHistory(application.KVHistoryRequest{
		BucketName: bucketName,
		Key:        key,
	})
	if err != nil {
		return nil, err
	}
	return resp.History, nil
}

func (a *App) GetKVBucketInfo(bucketName string) (map[string]interface{}, error) {
	return a.kvService.GetKVBucketInfo(application.GetKVBucketInfoRequest{Profile: "default", BucketName: bucketName})
}

// --- JS Extensions ---

func (a *App) ListJSExtensions() ([]string, error) {
	return a.profileRepo.ListJSExtensions()
}

func (a *App) GetActiveJSExtensions() []string {
	return a.profileRepo.GetActiveJSExtensions()
}

func (a *App) SetActiveJSExtensions(extensions []string) error {
	return a.profileRepo.SetActiveJSExtensions(extensions)
}

func (a *App) AddJSExtension(filename string) error {
	return a.profileRepo.AddJSExtension(filename)
}

func (a *App) RemoveJSExtension(filename string) error {
	return a.profileRepo.RemoveJSExtension(filename)
}

// Simple test method
func (a *App) HelloRPC(name string) string {
	return fmt.Sprintf("Hello %s from RPC!", name)
}
