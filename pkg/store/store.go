package store

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
)

type Template struct {
	Mode    string `json:"mode"` // "request" or "pubsub"
	Subject string `json:"subject"`
	Payload string `json:"payload"`
}

type TreeNode struct {
	Name     string      `json:"name"`
	Path     string      `json:"path"`
	IsFolder bool        `json:"is_folder"`
	Children []*TreeNode `json:"children,omitempty"`
}

type Variable struct {
	Type  string `json:"type"`  // "static" or "dynamic"
	Value string `json:"value"` // For static: the value; For dynamic: the script
}

type GlobalsProfile struct {
	Name      string              `json:"name"`
	Variables map[string]Variable `json:"variables"`
}

type NatsProfile struct {
	Name      string `json:"name"`
	URL       string `json:"url"`
	CredsPath string `json:"creds_path"`
}

type ProfileData struct {
	GlobalsProfiles      []GlobalsProfile `json:"globals_profiles"`
	ActiveGlobalsProfile string           `json:"active_globals_profile"`
	NatsProfiles         []NatsProfile    `json:"nats_profiles"`
	ActiveNatsProfile    string           `json:"active_nats_profile"`
}

type Store struct {
	mu           sync.RWMutex
	templatesDir string
	profilesFile string
	profiles     ProfileData
}

func NewStore(templatesDir string, profilesFile string) (*Store, error) {
	s := &Store{
		templatesDir: templatesDir,
		profilesFile: profilesFile,
		profiles: ProfileData{
			GlobalsProfiles: []GlobalsProfile{},
			NatsProfiles:    []NatsProfile{},
		},
	}

	// Create templates directory if not exists
	if err := os.MkdirAll(templatesDir, 0755); err != nil {
		return nil, err
	}

	// Load profiles
	if err := s.LoadProfiles(); err != nil && !os.IsNotExist(err) {
		return nil, err
	}

	// Initialize default profiles if none exist
	if len(s.profiles.GlobalsProfiles) == 0 {
		s.profiles.GlobalsProfiles = []GlobalsProfile{
			{
				Name: "Default",
				Variables: map[string]Variable{
					"example": {Type: "static", Value: "value"},
				},
			},
		}
		s.profiles.ActiveGlobalsProfile = "Default"
	}

	if len(s.profiles.NatsProfiles) == 0 {
		s.profiles.NatsProfiles = []NatsProfile{
			{Name: "Default", URL: "nats://localhost:4222", CredsPath: ""},
		}
		s.profiles.ActiveNatsProfile = "Default"
	}

	// Save initial profiles
	s.SaveProfiles()

	return s, nil
}

// Template operations
func (s *Store) GetTree() (*TreeNode, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	root := &TreeNode{
		Name:     "Templates",
		Path:     "",
		IsFolder: true,
		Children: []*TreeNode{},
	}

	err := s.buildTree(s.templatesDir, "", root)
	return root, err
}

func (s *Store) buildTree(baseDir, relativePath string, node *TreeNode) error {
	fullPath := filepath.Join(baseDir, relativePath)

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		childPath := filepath.Join(relativePath, entry.Name())

		child := &TreeNode{
			Name:     entry.Name(),
			Path:     childPath,
			IsFolder: entry.IsDir(),
		}

		if entry.IsDir() {
			child.Children = []*TreeNode{}
			if err := s.buildTree(baseDir, childPath, child); err != nil {
				return err
			}
		} else if strings.HasSuffix(entry.Name(), ".nm") {
			// Only include .nm files
			child.Name = strings.TrimSuffix(entry.Name(), ".nm")
		} else {
			// Skip non-.nm files
			continue
		}

		node.Children = append(node.Children, child)
	}

	return nil
}

func (s *Store) GetTemplate(path string) (*Template, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	fullPath := filepath.Join(s.templatesDir, path)
	if !strings.HasSuffix(fullPath, ".nm") {
		fullPath += ".nm"
	}

	data, err := os.ReadFile(fullPath)
	if err != nil {
		return nil, err
	}

	return parseTemplate(string(data)), nil
}

func (s *Store) SaveTemplate(path string, template *Template) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	fullPath := filepath.Join(s.templatesDir, path)
	if !strings.HasSuffix(fullPath, ".nm") {
		fullPath += ".nm"
	}

	// Create parent directories
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return err
	}

	content := formatTemplate(template)
	return os.WriteFile(fullPath, []byte(content), 0644)
}

func (s *Store) DeleteTemplate(path string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	fullPath := filepath.Join(s.templatesDir, path)

	// Check if it's a directory
	info, err := os.Stat(fullPath)
	if err != nil {
		// Try with .nm extension
		fullPath += ".nm"
		info, err = os.Stat(fullPath)
		if err != nil {
			return err
		}
	}

	if info.IsDir() {
		return os.RemoveAll(fullPath)
	}
	return os.Remove(fullPath)
}

func (s *Store) CreateFolder(path string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	fullPath := filepath.Join(s.templatesDir, path)
	if _, err := os.Stat(fullPath); !os.IsNotExist(err) {
		return fmt.Errorf("folder '%s' already exists", path)
	}
	return os.MkdirAll(fullPath, 0755)
}

func (s *Store) CreateTemplate(path string, template *Template) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	fullPath := filepath.Join(s.templatesDir, path)
	if !strings.HasSuffix(fullPath, ".nm") {
		fullPath += ".nm"
	}

	if _, err := os.Stat(fullPath); !os.IsNotExist(err) {
		return fmt.Errorf("template '%s' already exists", path)
	}

	// Create parent directories (recursive mkdir is fine here)
	if err := os.MkdirAll(filepath.Dir(fullPath), 0755); err != nil {
		return err
	}

	content := formatTemplate(template)
	return os.WriteFile(fullPath, []byte(content), 0644)
}

func (s *Store) MoveTemplate(from, to string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	fromPath := filepath.Join(s.templatesDir, from)
	toPath := filepath.Join(s.templatesDir, to)

	// Ensure from path exists
	info, err := os.Stat(fromPath)
	if err != nil {
		// Try with .nm extension
		fromPath += ".nm"
		info, err = os.Stat(fromPath)
		if err != nil {
			return err
		}
		// If we had to add extension to find source, add it to dest too
		toPath += ".nm"
	} else {
		// Source exists as provided.
		// If it's a file and ends in .nm, ensure dest also has .nm
		if !info.IsDir() && strings.HasSuffix(fromPath, ".nm") && !strings.HasSuffix(toPath, ".nm") {
			toPath += ".nm"
		}
	}

	// Create parent directory for destination
	if err := os.MkdirAll(filepath.Dir(toPath), 0755); err != nil {
		return err
	}

	return os.Rename(fromPath, toPath)
}

// Profile operations
func (s *Store) LoadProfiles() error {
	data, err := os.ReadFile(s.profilesFile)
	if err != nil {
		return err
	}

	return json.Unmarshal(data, &s.profiles)
}

func (s *Store) SaveProfiles() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	bytes, err := json.MarshalIndent(s.profiles, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(s.profilesFile, bytes, 0644)
}

func (s *Store) GetGlobalsProfiles() []GlobalsProfile {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.profiles.GlobalsProfiles
}

func (s *Store) GetActiveGlobalsProfile() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.profiles.ActiveGlobalsProfile
}

func (s *Store) SaveGlobalsProfile(profile GlobalsProfile) error {
	s.mu.Lock()

	// Find and update or append
	found := false
	for i, p := range s.profiles.GlobalsProfiles {
		if p.Name == profile.Name {
			s.profiles.GlobalsProfiles[i] = profile
			found = true
			break
		}
	}

	if !found {
		s.profiles.GlobalsProfiles = append(s.profiles.GlobalsProfiles, profile)
	}

	s.mu.Unlock()
	return s.SaveProfiles()
}

func (s *Store) DeleteGlobalsProfile(name string) error {
	s.mu.Lock()

	// Don't allow deleting if it's the only profile
	if len(s.profiles.GlobalsProfiles) <= 1 {
		return fmt.Errorf("cannot delete the last profile")
	}

	// Find and remove
	for i, p := range s.profiles.GlobalsProfiles {
		if p.Name == name {
			s.profiles.GlobalsProfiles = append(s.profiles.GlobalsProfiles[:i], s.profiles.GlobalsProfiles[i+1:]...)

			// If deleting active profile, switch to first one
			if s.profiles.ActiveGlobalsProfile == name {
				s.profiles.ActiveGlobalsProfile = s.profiles.GlobalsProfiles[0].Name
			}
			break
		}
	}

	s.mu.Unlock()
	return s.SaveProfiles()
}

func (s *Store) ActivateGlobalsProfile(name string) error {
	s.mu.Lock()
	s.profiles.ActiveGlobalsProfile = name
	s.mu.Unlock()
	return s.SaveProfiles()
}

func (s *Store) GetGlobalVars() map[string]Variable {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, p := range s.profiles.GlobalsProfiles {
		if p.Name == s.profiles.ActiveGlobalsProfile {
			vars := make(map[string]Variable)
			for k, v := range p.Variables {
				vars[k] = v
			}
			return vars
		}
	}

	return make(map[string]Variable)
}

func (s *Store) GetNatsProfiles() []NatsProfile {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.profiles.NatsProfiles
}

func (s *Store) GetActiveNatsProfile() string {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.profiles.ActiveNatsProfile
}

func (s *Store) SaveNatsProfile(profile NatsProfile) error {
	s.mu.Lock()

	// Find and update or append
	found := false
	for i, p := range s.profiles.NatsProfiles {
		if p.Name == profile.Name {
			s.profiles.NatsProfiles[i] = profile
			found = true
			break
		}
	}

	if !found {
		s.profiles.NatsProfiles = append(s.profiles.NatsProfiles, profile)
	}

	s.mu.Unlock()
	return s.SaveProfiles()
}

func (s *Store) DeleteNatsProfile(name string) error {
	s.mu.Lock()

	// Don't allow deleting if it's the only profile
	if len(s.profiles.NatsProfiles) <= 1 {
		return fmt.Errorf("cannot delete the last profile")
	}

	// Find and remove
	for i, p := range s.profiles.NatsProfiles {
		if p.Name == name {
			s.profiles.NatsProfiles = append(s.profiles.NatsProfiles[:i], s.profiles.NatsProfiles[i+1:]...)

			// If deleting active profile, switch to first one
			if s.profiles.ActiveNatsProfile == name {
				s.profiles.ActiveNatsProfile = s.profiles.NatsProfiles[0].Name
			}
			break
		}
	}

	s.mu.Unlock()
	return s.SaveProfiles()
}

func (s *Store) ActivateNatsProfile(name string) error {
	s.mu.Lock()
	s.profiles.ActiveNatsProfile = name
	s.mu.Unlock()
	return s.SaveProfiles()
}

func (s *Store) GetNatsConfig() (string, string) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	for _, p := range s.profiles.NatsProfiles {
		if p.Name == s.profiles.ActiveNatsProfile {
			return p.URL, p.CredsPath
		}
	}

	return "nats://localhost:4222", ""
}

// Template file format parsing
func parseTemplate(content string) *Template {
	parts := strings.SplitN(content, "---", 2)

	template := &Template{
		Mode: "request", // Default mode
	}

	if len(parts) > 0 {
		// Parse headers from first part
		lines := strings.Split(parts[0], "\n")
		for _, line := range lines {
			line = strings.TrimSpace(line)
			if strings.HasPrefix(line, "Mode:") {
				template.Mode = strings.ToLower(strings.TrimSpace(strings.TrimPrefix(line, "Mode:")))
			} else if strings.HasPrefix(line, "Subject:") {
				template.Subject = strings.TrimSpace(strings.TrimPrefix(line, "Subject:"))
			}
		}
	}

	if len(parts) > 1 {
		template.Payload = strings.TrimSpace(parts[1])
	}

	return template
}

func formatTemplate(template *Template) string {
	mode := template.Mode
	if mode == "" {
		mode = "request"
	}
	return fmt.Sprintf("Mode: %s\nSubject: %s\n---\n%s", mode, template.Subject, template.Payload)
}
