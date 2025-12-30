package domain

// Template represents a request or pubsub template
type Template struct {
	Mode    string // "request" or "pubsub"
	Subject string
	Payload string
}

// TreeNode represents the file structure of templates
type TreeNode struct {
	Name     string
	Path     string
	IsFolder bool
	Children []*TreeNode
}

// Variable represents a value that can be static or dynamic
type Variable struct {
	Type  string // "static" or "dynamic"
	Value string // For static: the value; For dynamic: the script
}

// GlobalsProfile represents a collection of global variables
type GlobalsProfile struct {
	Name      string
	Variables map[string]Variable
}

// NatsProfile represents a NATS connection configuration
type NatsProfile struct {
	Name      string
	URL       string
	CredsPath string
}
