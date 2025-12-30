//go:build desktop

package main

import (
	"io/fs"
	"log"

	"natsman/internal/config"
	"natsman/internal/interfaces/wails"

	"github.com/gin-gonic/gin"
	wailsapp "github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

func StartApp(cfg *config.AppConfig, r *gin.Engine, assets fs.FS, app *wails.App) {
	// Desktop Mode
	log.Println("Starting Desktop Mode...")

	// Remove background server for pure RPC desktop app

	err := wailsapp.Run(&options.App{
		Title:  "NATS Manager",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 1},
		OnStartup:        app.Startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}
