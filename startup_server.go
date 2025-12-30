//go:build !desktop

package main

import (
	"fmt"
	"io/fs"
	"log"

	"github.com/gin-gonic/gin"
)

func StartApp(cfg *AppConfig, r *gin.Engine, assets fs.FS, app *App) {
	// In pure server mode, we just run Gin.
	// The assets logic was already handled by specific Gin handlers in SetupRouter,
	// or we ignore the passed assets here because SetupRouter used the 'web' directory logic.
	addr := fmt.Sprintf(":%d", cfg.Port)
	log.Printf("Server starting on http://localhost%s (Mode: server - Server-Only Build)", addr)
	r.Run(addr)
}
