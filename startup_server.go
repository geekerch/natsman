//go:build !desktop

package main

import (
	"fmt"
	"io/fs"
	"log"

	"natsman/internal/config"
	"natsman/internal/interfaces/wails"

	"github.com/gin-gonic/gin"
)

func StartApp(cfg *config.AppConfig, r *gin.Engine, assets fs.FS, app *wails.App) {
	// In pure server mode, we just run Gin.
	// The assets logic was already handled by specific Gin handlers in SetupRouter,
	// or we ignore the passed assets here because SetupRouter used the 'web' directory logic.
	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("Server starting on http://localhost%s (Mode: server - Server-Only Build)", addr)
	r.Run(addr)
}
