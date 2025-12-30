package main

import (
	"context"
	"fmt"
	"natsman/pkg/service"
	"natsman/pkg/store"
)

// App struct
type App struct {
	ctx        context.Context
	store      *store.Store
	service    *service.RequestService
	subService *service.SubscribeService
}

// NewApp creates a new App application struct
func NewApp(store *store.Store, service *service.RequestService, subService *service.SubscribeService) *App {
	return &App{
		store:      store,
		service:    service,
		subService: subService,
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

// Simple test method
func (a *App) HelloRPC(name string) string {
	return fmt.Sprintf("Hello %s from RPC!", name)
}
