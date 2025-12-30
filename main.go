package main

import (
	"embed"
	"flag"
	"io/fs"
	"log"
	"os"
	"path/filepath"

	"natsman/internal/application"
	"natsman/internal/config"
	"natsman/internal/infrastructure/persistence"
	"natsman/internal/infrastructure/scripting"
	"natsman/internal/interfaces/http"
	"natsman/internal/interfaces/wails"
)

//go:embed frontend/dist/*
var embeddedFS embed.FS

var (
	// Global variables for services if needed elsewhere
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
	appCfg := config.LoadConfig(configPath)

	// Initialize Store with absolute paths
	templatesDir := appCfg.TemplatesDir
	if !filepath.IsAbs(templatesDir) {
		templatesDir = filepath.Join(exeDir, templatesDir)
	}
	profilesFile := appCfg.ProfilesFile
	if !filepath.IsAbs(profilesFile) {
		profilesFile = filepath.Join(exeDir, profilesFile)
	}

	// Initialize Persistence (FileStore implements both repositories)
	fileStore, err := persistence.NewFileStore(templatesDir, profilesFile)
	if err != nil {
		log.Fatalf("Failed to initialize store: %v", err)
	}

	// Initialize executor with extensions directory
	exec := scripting.New()
	exec.SetExtensionsDir(fileStore.GetExtensionsDir())

	// Initialize Application Services
	reqService := application.NewRequestService(fileStore, exec)
	subService := application.NewSubscribeService(fileStore)
	jsService := application.NewJetStreamService(fileStore, exec)
	kvService := application.NewKVService(fileStore)

	// Initialize Wails App Adapter (RPC Layer)
	app := wails.NewApp(fileStore, fileStore, reqService, subService, jsService, kvService)

	// Setup Router
	r := http.SetupRouter(exeDir, appCfg, configPath, fileStore, fileStore, reqService, subService, jsService, kvService, embeddedFS)

	// Mode Handling via StartApp (implementation depends on build tags)
	webFS, err := fs.Sub(embeddedFS, "frontend/dist")
	if err != nil {
		log.Fatalf("Failed to create web filesystem: %v", err)
	}
	StartApp(appCfg, r, webFS, app)
}
