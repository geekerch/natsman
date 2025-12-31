package domain

// Template represents a request or pubsub template
type Template struct {
	Mode    string `json:"mode"`
	Subject string `json:"subject"`
	Payload string `json:"payload"`
}

// TreeNode represents the file structure of templates
type TreeNode struct {
	Name     string      `json:"name"`
	Path     string      `json:"path"`
	IsFolder bool        `json:"is_folder"`
	Children []*TreeNode `json:"children,omitempty"`
}

// Variable represents a value that can be static or dynamic
type Variable struct {
	Type  string `json:"type"`
	Value string `json:"value"`
}

// GlobalsProfile represents a collection of global variables
type GlobalsProfile struct {
	Name      string              `json:"name"`
	Variables map[string]Variable `json:"variables"`
}

// NatsProfile represents a NATS connection configuration
type NatsProfile struct {
	Name      string `json:"name"`
	URL       string `json:"url"`
	CredsPath string `json:"creds_path"`
}
