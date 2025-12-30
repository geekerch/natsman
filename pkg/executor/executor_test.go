package executor

import (
	"regexp"
	"strings"
	"testing"
	"time"
)

func TestEvalStaticExpression(t *testing.T) {
	exec := New()

	tests := []struct {
		name     string
		script   string
		expected string
	}{
		{"simple math", "1 + 1", "2"},
		{"string concat", "'hello' + ' ' + 'world'", "hello world"},
		{"template literal", "`test-${123}`", "test-123"},
		{"json stringify", "JSON.stringify({key: 'value'})", `{"key":"value"}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := exec.Eval(tt.script)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if result != tt.expected {
				t.Errorf("expected %q, got %q", tt.expected, result)
			}
		})
	}
}

func TestBuiltinTimestamp(t *testing.T) {
	exec := New()

	result, err := exec.Eval("timestamp()")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should be a valid Unix timestamp (10 digits)
	if len(result) != 10 {
		t.Errorf("expected 10 digit timestamp, got %q", result)
	}
}

func TestBuiltinTimestampMs(t *testing.T) {
	exec := New()

	result, err := exec.Eval("timestampMs()")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should be a valid Unix timestamp in milliseconds (13 digits)
	if len(result) != 13 {
		t.Errorf("expected 13 digit timestamp, got %q", result)
	}
}

func TestBuiltinUUID(t *testing.T) {
	exec := New()

	result, err := exec.Eval("uuid()")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should match UUID v4 format
	uuidRegex := regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)
	if !uuidRegex.MatchString(result) {
		t.Errorf("invalid UUID format: %q", result)
	}
}

func TestBuiltinRandomInt(t *testing.T) {
	exec := New()

	result, err := exec.Eval("randomInt(1, 100)")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should be a number (just check it's not empty)
	if result == "" {
		t.Error("expected non-empty result")
	}
}

func TestBuiltinNow(t *testing.T) {
	exec := New()

	result, err := exec.Eval("now()")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should be ISO 8601 format (contains T and Z or offset)
	if !strings.Contains(result, "T") {
		t.Errorf("expected ISO 8601 format, got %q", result)
	}
}

func TestBuiltinDateFormat(t *testing.T) {
	exec := New()

	result, err := exec.Eval(`dateFormat("2006-01-02")`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Should match YYYY-MM-DD format
	dateRegex := regexp.MustCompile(`^\d{4}-\d{2}-\d{2}$`)
	if !dateRegex.MatchString(result) {
		t.Errorf("expected YYYY-MM-DD format, got %q", result)
	}
}

func TestTimeout(t *testing.T) {
	exec := NewWithTimeout(100 * time.Millisecond)

	// Infinite loop should timeout
	_, err := exec.Eval("while(true) {}")
	if err == nil {
		t.Error("expected timeout error")
	}
	if !strings.Contains(err.Error(), "timeout") {
		t.Errorf("expected timeout error, got: %v", err)
	}
}

func TestErrorHandling(t *testing.T) {
	exec := New()

	tests := []struct {
		name   string
		script string
	}{
		{"syntax error", "this is not valid javascript"},
		{"undefined variable", "undefinedVariable"},
		{"invalid function", "invalidFunction()"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := exec.Eval(tt.script)
			if err == nil {
				t.Error("expected error for invalid script")
			}
		})
	}
}

func TestComplexExpressions(t *testing.T) {
	exec := New()

	tests := []struct {
		name   string
		script string
	}{
		{"timestamp in template", "`request-${timestamp()}`"},
		{"uuid with prefix", "`user-${uuid()}`"},
		{"math with timestamp", "Math.floor(Date.now() / 1000)"},
		{"conditional", "timestamp() > 0 ? 'valid' : 'invalid'"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := exec.Eval(tt.script)
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if result == "" {
				t.Error("expected non-empty result")
			}
		})
	}
}
