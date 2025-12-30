package domain

// TemplateRepository defines operations for managing templates
type TemplateRepository interface {
	GetTree() (*TreeNode, error)
	GetTemplate(path string) (*Template, error)
	SaveTemplate(path string, tmpl *Template) error
	CreateTemplate(path string, tmpl *Template) error
	DeleteTemplate(path string) error
	CreateFolder(path string) error
	MoveTemplate(from, to string) error
}

// ProfileRepository defines operations for managing profiles and configurations
type ProfileRepository interface {
	// Globals
	GetGlobalsProfiles() []GlobalsProfile
	GetActiveGlobalsProfile() string
	SaveGlobalsProfile(profile GlobalsProfile) error
	DeleteGlobalsProfile(name string) error
	ActivateGlobalsProfile(name string) error
	GetGlobalVars() map[string]Variable

	// NATS Profiles
	GetNatsProfiles() []NatsProfile
	GetActiveNatsProfile() string
	SaveNatsProfile(profile NatsProfile) error
	DeleteNatsProfile(name string) error
	ActivateNatsProfile(name string) error
	GetNatsConfig() (string, string) // URL, CredsPath

	// JS Extensions
	GetExtensionsDir() string
	ListJSExtensions() ([]string, error)
	GetActiveJSExtensions() []string
	SetActiveJSExtensions(extensions []string) error
	AddJSExtension(filename string) error
	RemoveJSExtension(filename string) error
}
