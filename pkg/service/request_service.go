package service

import (
	"bytes"
	"fmt"
	"html/template"
	"regexp"
	"time"

	"natsman/pkg/executor"
	"natsman/pkg/natsclient"
	"natsman/pkg/store"
)

type RequestService struct {
	store    *store.Store
	executor *executor.Executor
}

func NewRequestService(store *store.Store, executor *executor.Executor) *RequestService {
	return &RequestService{
		store:    store,
		executor: executor,
	}
}

// RequestPayload defines the structure for sending a NATS request
type RequestPayload struct {
	Mode      string                    `json:"mode"` // "request" or "pubsub"
	Subject   string                    `json:"subject"`
	Body      string                    `json:"body"`
	Variables map[string]store.Variable `json:"variables"`
	Config    natsclient.Config         `json:"config"`
}

// SendReqResult defines the result of a NATS request
type SendReqResult struct {
	Reply   string `json:"reply"`
	Status  string `json:"status"`
	Elapsed string `json:"elapsed"`
}

// SendRequest handles the logic of processing templates and sending the NATS request or publish
func (s *RequestService) SendRequest(req RequestPayload) (*SendReqResult, error) {
	// Load active JS extensions
	activeExtensions := s.store.GetActiveJSExtensions()
	
	for _, extFile := range activeExtensions {
		if err := s.executor.LoadExtension(extFile); err != nil {
			return nil, fmt.Errorf("failed to load extension '%s': %v", extFile, err)
		}
	}
	
	// Get global variables
	globalVars := s.store.GetGlobalVars()
	finalVars := make(map[string]string)

	// Helper to evaluate variable
	evaluateVar := func(key string, v store.Variable) (string, error) {
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

	// Process Templates
	subject, err := ProcessTemplate(req.Subject, finalVars)
	if err != nil {
		return nil, fmt.Errorf("template error in Subject: %v", err)
	}
	body, err := ProcessTemplate(req.Body, finalVars)
	if err != nil {
		return nil, fmt.Errorf("template error in Body: %v", err)
	}

	// Connect and Send
	cfg := req.Config
	if cfg.URL == "" {
		cfg.URL, _ = s.store.GetNatsConfig()
		if cfg.URL == "" {
			cfg.URL = "nats://localhost:4222" // Fallback
		}
	}
	if cfg.CredsPath == "" {
		_, cfg.CredsPath = s.store.GetNatsConfig()
	}

	client, err := natsclient.Connect(cfg)
	if err != nil {
		return nil, err
	}
	defer client.Close()

	mode := req.Mode
	if mode == "" {
		mode = "request" // Default mode
	}

	start := time.Now()
	
	if mode == "pubsub" {
		// Publish mode
		err = client.Publish(subject, []byte(body))
		if err != nil {
			return nil, err
		}
		elapsed := time.Since(start)
		
		return &SendReqResult{
			Reply:   "Message published successfully",
			Status:  "OK",
			Elapsed: elapsed.String(),
		}, nil
	} else {
		// Request/Reply mode
		resp, err := client.Request(subject, []byte(body), 5*time.Second) // 5s timeout
		if err != nil {
			return nil, err
		}
		elapsed := time.Since(start)

		return &SendReqResult{
			Reply:   string(resp),
			Status:  "OK",
			Elapsed: elapsed.String(),
		}, nil
	}
}

// ExtractVariables parses the content and returns list of {{.Var}} names
func (s *RequestService) ExtractVariables(content string) []string {
	re := regexp.MustCompile(`\{\{\.([a-zA-Z0-9_]+)\}\}`)
	matches := re.FindAllStringSubmatch(content, -1)
	seen := make(map[string]bool)
	var vars []string
	for _, m := range matches {
		if len(m) > 1 {
			if !seen[m[1]] {
				seen[m[1]] = true
				vars = append(vars, m[1])
			}
		}
	}
	return vars
}

// EvalDynamicScript evaluates a JS script
func (s *RequestService) EvalDynamicScript(script string) (string, error) {
	return s.executor.Eval(script)
}

// ProcessTemplate executes the Go template with variables
func ProcessTemplate(tmplStr string, vars map[string]string) (string, error) {
	t, err := template.New("t").Parse(tmplStr)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err := t.Execute(&buf, vars); err != nil {
		return "", err
	}
	return buf.String(), nil
}
