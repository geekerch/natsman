package persistence

import (
	"os"
	"path/filepath"
	"testing"

	"natsman/internal/domain"
)

func TestFileStore_DoubleUnlockFix(t *testing.T) {
	// Setup temp dir
	tmpDir, err := os.MkdirTemp("", "natsman_store_test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	templatesDir := filepath.Join(tmpDir, "templates")
	profilesFile := filepath.Join(tmpDir, "profiles.json")

	// Initialize store
	s, err := NewFileStore(templatesDir, profilesFile)
	if err != nil {
		t.Fatalf("Failed to create store: %v", err)
	}

	// Test SaveGlobalsProfile
	t.Run("SaveGlobalsProfile", func(t *testing.T) {
		defer func() {
			if r := recover(); r != nil {
				t.Errorf("SaveGlobalsProfile panicked: %v", r)
			}
		}()

		profile := domain.GlobalsProfile{
			Name: "TestGlobal",
			Variables: map[string]domain.Variable{
				"foo": {Type: "static", Value: "bar"},
			},
		}
		if err := s.SaveGlobalsProfile(profile); err != nil {
			t.Errorf("SaveGlobalsProfile failed: %v", err)
		}
	})

	// Test SaveNatsProfile
	t.Run("SaveNatsProfile", func(t *testing.T) {
		defer func() {
			if r := recover(); r != nil {
				t.Errorf("SaveNatsProfile panicked: %v", r)
			}
		}()

		profile := domain.NatsProfile{
			Name: "TestNats",
			URL:  "nats://localhost:4222",
		}
		if err := s.SaveNatsProfile(profile); err != nil {
			t.Errorf("SaveNatsProfile failed: %v", err)
		}
	})

	// Test DeleteGlobalsProfile
	t.Run("DeleteGlobalsProfile", func(t *testing.T) {
		defer func() {
			if r := recover(); r != nil {
				t.Errorf("DeleteGlobalsProfile panicked: %v", r)
			}
		}()

		// We need > 1 profile to delete one. "Default" is created by NewStore.
		// "TestGlobal" was created above. So we have 2.
		if err := s.DeleteGlobalsProfile("TestGlobal"); err != nil {
			t.Errorf("DeleteGlobalsProfile failed: %v", err)
		}
	})

	// Test DeleteNatsProfile
	t.Run("DeleteNatsProfile", func(t *testing.T) {
		defer func() {
			if r := recover(); r != nil {
				t.Errorf("DeleteNatsProfile panicked: %v", r)
			}
		}()

		// Equivalent logic for NATS
		if err := s.DeleteNatsProfile("TestNats"); err != nil {
			t.Errorf("DeleteNatsProfile failed: %v", err)
		}
	})
}
