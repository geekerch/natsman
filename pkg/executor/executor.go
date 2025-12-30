package executor

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/dop251/goja"
	"github.com/google/uuid"
)

// Executor provides a sandboxed JavaScript runtime for evaluating dynamic variables
type Executor struct {
	timeout        time.Duration
	extensionsDir  string
	loadedExtensions map[string]string
}

// New creates a new Executor with default 1 second timeout
func New() *Executor {
	return &Executor{
		timeout:          1 * time.Second,
		loadedExtensions: make(map[string]string),
	}
}

// NewWithTimeout creates a new Executor with custom timeout
func NewWithTimeout(timeout time.Duration) *Executor {
	return &Executor{
		timeout:          timeout,
		loadedExtensions: make(map[string]string),
	}
}

// NewWithExtensions creates a new Executor with extensions directory
func NewWithExtensions(extensionsDir string) *Executor {
	return &Executor{
		timeout:          1 * time.Second,
		extensionsDir:    extensionsDir,
		loadedExtensions: make(map[string]string),
	}
}

// LoadExtension loads a JavaScript extension file
func (e *Executor) LoadExtension(filename string) error {
	var fullPath string
	
	if filepath.IsAbs(filename) {
		fullPath = filename
	} else if e.extensionsDir != "" {
		fullPath = filepath.Join(e.extensionsDir, filename)
	} else {
		return fmt.Errorf("no extensions directory set and path is not absolute")
	}
	
	content, err := os.ReadFile(fullPath)
	if err != nil {
		return fmt.Errorf("failed to read extension file: %w", err)
	}
	
	e.loadedExtensions[filename] = string(content)
	return nil
}

// SetExtensionsDir sets the extensions directory path
func (e *Executor) SetExtensionsDir(dir string) {
	e.extensionsDir = dir
}

// GetLoadedExtensions returns list of loaded extension filenames
func (e *Executor) GetLoadedExtensions() []string {
	extensions := make([]string, 0, len(e.loadedExtensions))
	for name := range e.loadedExtensions {
		extensions = append(extensions, name)
	}
	return extensions
}

// Eval evaluates a JavaScript expression and returns the result as a string
func (e *Executor) Eval(script string) (string, error) {
	// Create a new VM for each evaluation (isolation)
	vm := goja.New()

	// Set up timeout
	done := make(chan struct{})
	defer close(done)

	go func() {
		select {
		case <-time.After(e.timeout):
			vm.Interrupt("execution timeout")
		case <-done:
			return
		}
	}()

	// Register built-in helper functions
	if err := e.registerHelpers(vm); err != nil {
		return "", fmt.Errorf("failed to register helpers: %w", err)
	}

	// Load all extensions into VM
	for filename, content := range e.loadedExtensions {
		if _, err := vm.RunString(content); err != nil {
			return "", fmt.Errorf("failed to load extension '%s': %w", filename, err)
		}
	}

	// Execute the script
	val, err := vm.RunString(script)
	if err != nil {
		return "", fmt.Errorf("script execution error: %w", err)
	}

	// Convert result to string
	return val.String(), nil
}

// registerHelpers adds built-in helper functions to the VM
func (e *Executor) registerHelpers(vm *goja.Runtime) error {
	// timestamp() - Unix timestamp in seconds
	if err := vm.Set("timestamp", func() int64 {
		return time.Now().Unix()
	}); err != nil {
		return err
	}

	// timestampMs() - Unix timestamp in milliseconds
	if err := vm.Set("timestampMs", func() int64 {
		return time.Now().UnixMilli()
	}); err != nil {
		return err
	}

	// uuid() - Generate UUID v4
	if err := vm.Set("uuid", func() string {
		return uuid.New().String()
	}); err != nil {
		return err
	}

	// randomInt(min, max) - Random integer between min and max (inclusive)
	if err := vm.Set("randomInt", func(min, max int) int {
		if min > max {
			min, max = max, min
		}
		return min + int(time.Now().UnixNano()%(int64(max-min+1)))
	}); err != nil {
		return err
	}

	// now() - ISO 8601 timestamp
	if err := vm.Set("now", func() string {
		return time.Now().Format(time.RFC3339)
	}); err != nil {
		return err
	}

	// dateFormat(layout) - Current time in custom format
	if err := vm.Set("dateFormat", func(layout string) string {
		return time.Now().Format(layout)
	}); err != nil {
		return err
	}

	return nil
}
