//go:build desktop

package main

import (
	"io/fs"
	"log"

	"github.com/gin-gonic/gin"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
)

func StartApp(cfg *AppConfig, r *gin.Engine, assets fs.FS, app *App) {
	// Desktop Mode
	log.Println("Starting Desktop Mode...")

	// Desktop Mode
	log.Println("Starting Desktop Mode...")

	// Remove background server for pure RPC desktop app

	err := wails.Run(&options.App{
		Title:  "NATS Manager",
		Width:  1024,
		Height: 768,
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		log.Fatal(err)
	}
}
