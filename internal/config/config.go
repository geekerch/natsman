package config

import (
	"encoding/json"
	"os"
)

type AppConfig struct {
	Port         int    `json:"port"`
	Mode         string `json:"mode"` // "desktop", "server", "hybrid"
	TemplatesDir string `json:"templates_dir"`
	ProfilesFile string `json:"profiles_file"`
	NatsURL      string `json:"nats_url"`
	NatsCreds    string `json:"nats_creds"`
}

func LoadConfig(path string) *AppConfig {
	cfg := &AppConfig{
		Port:         8080,
		Mode:         "server",
		TemplatesDir: "templates",
		ProfilesFile: "profiles.json",
		NatsURL:      "nats://localhost:4222",
	}
	data, err := os.ReadFile(path)
	if err == nil {
		json.Unmarshal(data, cfg)
	} else if os.IsNotExist(err) {
		// Create default config file
		SaveConfig(path, cfg)
	}
	return cfg
}

func SaveConfig(path string, cfg *AppConfig) {
	data, _ := json.MarshalIndent(cfg, "", "  ")
	os.WriteFile(path, data, 0644)
}
