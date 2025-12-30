package executor

import (
	"fmt"
	"time"

	"github.com/dop251/goja"
	"github.com/google/uuid"
)

// Executor provides a sandboxed JavaScript runtime for evaluating dynamic variables
type Executor struct {
	timeout time.Duration
}

// New creates a new Executor with default 1 second timeout
func New() *Executor {
	return &Executor{
		timeout: 1 * time.Second,
	}
}

// NewWithTimeout creates a new Executor with custom timeout
func NewWithTimeout(timeout time.Duration) *Executor {
	return &Executor{
		timeout: timeout,
	}
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
