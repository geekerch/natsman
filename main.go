package main

import (
	"embed"
	"flag"
	"io/fs"
	"log"
	"os"
	"path/filepath"

	"natsman/pkg/executor"
	"natsman/pkg/service"
	"natsman/pkg/store"
)

//go:embed web/*
var embeddedFS embed.FS

var (
	dataStore *store.Store
	exec      *executor.Executor // JavaScript executor for dynamic variables
)

func main() {
	var configPath string
	flag.StringVar(&configPath, "config", "config.json", "Path to configuration file")
	flag.Parse()

	// Get executable directory for resolving relative paths
	exePath, err := os.Executable()
	if err != nil {
		log.Fatalf("Failed to get executable path: %v", err)
	}
	exeDir := filepath.Dir(exePath)

	// Make config path absolute relative to executable
	if !filepath.IsAbs(configPath) {
		configPath = filepath.Join(exeDir, configPath)
	}

	// Load or create default config
	appCfg := loadConfig(configPath)

	// Initialize Store with absolute paths
	templatesDir := appCfg.TemplatesDir
	if !filepath.IsAbs(templatesDir) {
		templatesDir = filepath.Join(exeDir, templatesDir)
	}
	profilesFile := appCfg.ProfilesFile
	if !filepath.IsAbs(profilesFile) {
		profilesFile = filepath.Join(exeDir, profilesFile)
	}

	dataStore, err = store.NewStore(templatesDir, profilesFile)
	if err != nil {
		log.Fatalf("Failed to initialize store: %v", err)
	}

	// Initialize executor
	exec = executor.New()

	// Initialize Request Service
	reqService := service.NewRequestService(dataStore, exec)

	// Initialize Subscribe Service
	subService := service.NewSubscribeService(dataStore)

	// Initialize JetStream Service
	jsService := service.NewJetStreamService(dataStore)

	// Initialize Wails App Adapter (RPC Layer)
	app := NewApp(dataStore, reqService, subService, jsService)

	// Setup Router
	r := SetupRouter(exeDir, appCfg, configPath, dataStore, reqService, subService, jsService, embeddedFS)

	// Mode Handling via StartApp (implementation depends on build tags)
	webFS, err := fs.Sub(embeddedFS, "web")
	if err != nil {
		log.Fatalf("Failed to create web filesystem: %v", err)
	}
	StartApp(appCfg, r, webFS, app)
}
