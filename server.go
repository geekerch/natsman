package main

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"natsman/pkg/natsclient"
	"natsman/pkg/service"
	"natsman/pkg/store"

	"github.com/gin-gonic/gin"
)

// SetupRouter initializes the Gin engine and defines all API routes
func SetupRouter(exeDir string, appCfg *AppConfig, configPath string, dataStore *store.Store, reqService *service.RequestService, subService *service.SubscribeService, embeddedFS embed.FS) *gin.Engine {
	// Setup Gin
	r := gin.New() // Use New() to avoid default Logger causing double logging potentially
	r.Use(gin.Recovery())

	// Add debug logging middleware
	r.Use(func(c *gin.Context) {
		log.Printf("[GIN DEBUG] Request: %s %s (Full: %s)", c.Request.Method, c.Request.URL.Path, c.Request.URL.String())
		c.Next()
		log.Printf("[GIN DEBUG] Response: %d", c.Writer.Status())
	})

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// Log 404s explicitly
	r.NoRoute(func(c *gin.Context) {
		log.Printf("[GIN DEBUG] 404 Not Found: %s %s", c.Request.Method, c.Request.URL.Path)
		c.JSON(http.StatusNotFound, gin.H{"error": "Route not found", "path": c.Request.URL.Path})
	})

	// Setup static files
	setupStaticFiles(r, exeDir, embeddedFS)

	api := r.Group("/api")
	{
		// Get active NATS config
		api.GET("/config", func(c *gin.Context) {
			url, credsPath := dataStore.GetNatsConfig()
			c.JSON(http.StatusOK, gin.H{
				"url":        url,
				"creds_path": credsPath,
			})
		})

		// This endpoint is kept for backward compatibility but not used with profiles
		api.POST("/config", func(c *gin.Context) {
			var newCfg natsclient.Config
			if err := c.BindJSON(&newCfg); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			// Update runtime config and save back to config.json
			appCfg.NatsURL = newCfg.URL
			appCfg.NatsCreds = newCfg.CredsPath
			saveConfig(configPath, appCfg)
			c.JSON(http.StatusOK, gin.H{"status": "updated"})
		})

		// Get tree structure
		api.GET("/templates", func(c *gin.Context) {
			tree, err := dataStore.GetTree()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, tree)
		})

		// Get specific template
		api.GET("/templates/*path", func(c *gin.Context) {
			path := c.Param("path")
			if path == "" || path == "/" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "path required"})
				return
			}
			// Remove leading slash
			if path[0] == '/' {
				path = path[1:]
			}
			template, err := dataStore.GetTemplate(path)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, template)
		})

		// Save template
		api.POST("/templates", func(c *gin.Context) {
			var req struct {
				Path     string         `json:"path"`
				Template store.Template `json:"template"`
			}
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := dataStore.SaveTemplate(req.Path, &req.Template); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "saved"})
		})

		// Create template
		api.POST("/templates/create", func(c *gin.Context) {
			var req struct {
				Path     string         `json:"path"`
				Template store.Template `json:"template"`
			}
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := dataStore.CreateTemplate(req.Path, &req.Template); err != nil {
				// 409 Conflict if already exists (optional, or just 500/400 with error msg)
				// Using 400 or 500 is fine, frontend displays error string.
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "created"})
		})

		// Delete template or folder
		api.DELETE("/templates/*path", func(c *gin.Context) {
			path := c.Param("path")
			if path == "" || path == "/" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "path required"})
				return
			}
			// Remove leading slash
			if path[0] == '/' {
				path = path[1:]
			}
			if err := dataStore.DeleteTemplate(path); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "deleted"})
		})

		// Create folder
		api.POST("/v1/folders/create", func(c *gin.Context) {
			log.Println("[API] Received POST request to create folder")
			var req struct {
				Path string `json:"path"`
			}
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := dataStore.CreateFolder(req.Path); err != nil {
				log.Printf("[API] CreateFolder error: %v", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			log.Printf("[API] Folder created: %s", req.Path)
			c.JSON(http.StatusOK, gin.H{"status": "created"})
		})

		// Move template/folder
		api.POST("/move", func(c *gin.Context) {
			var req struct {
				From string `json:"from"`
				To   string `json:"to"`
			}
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := dataStore.MoveTemplate(req.From, req.To); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "moved"})
		})

		api.GET("/globals", func(c *gin.Context) {
			c.JSON(http.StatusOK, dataStore.GetGlobalVars())
		})

		// Profile endpoints
		// Globals Profiles
		api.GET("/profiles/globals", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"profiles": dataStore.GetGlobalsProfiles(),
				"active":   dataStore.GetActiveGlobalsProfile(),
			})
		})

		api.POST("/profiles/globals", func(c *gin.Context) {
			var profile store.GlobalsProfile
			if err := c.BindJSON(&profile); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := dataStore.SaveGlobalsProfile(profile); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "saved"})
		})

		api.DELETE("/profiles/globals/:name", func(c *gin.Context) {
			name := c.Param("name")
			if err := dataStore.DeleteGlobalsProfile(name); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "deleted"})
		})

		api.POST("/profiles/globals/activate/:name", func(c *gin.Context) {
			name := c.Param("name")
			if err := dataStore.ActivateGlobalsProfile(name); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "activated"})
		})

		// NATS Profiles
		api.GET("/profiles/nats", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"profiles": dataStore.GetNatsProfiles(),
				"active":   dataStore.GetActiveNatsProfile(),
			})
		})

		api.POST("/profiles/nats", func(c *gin.Context) {
			var profile store.NatsProfile
			if err := c.BindJSON(&profile); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := dataStore.SaveNatsProfile(profile); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "saved"})
		})

		api.DELETE("/profiles/nats/:name", func(c *gin.Context) {
			name := c.Param("name")
			if err := dataStore.DeleteNatsProfile(name); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "deleted"})
		})

		api.POST("/profiles/nats/activate/:name", func(c *gin.Context) {
			name := c.Param("name")
			if err := dataStore.ActivateNatsProfile(name); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "activated"})
		})

		api.POST("/parse", func(c *gin.Context) {
			var req struct {
				Content string `json:"content"`
			}
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			vars := reqService.ExtractVariables(req.Content)
			c.JSON(http.StatusOK, vars)
		})

		// Test dynamic variable
		api.POST("/variables/test", func(c *gin.Context) {
			var req struct {
				Script string `json:"script"`
			}
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			result, err := reqService.EvalDynamicScript(req.Script)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"result": result})
		})

		api.POST("/send", func(c *gin.Context) {
			var req service.RequestPayload
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			// Service handles all the logic (variable parsing, templates, NATS connection)
			result, err := reqService.SendRequest(req)
			if err != nil {
				// We don't distinguish detailed error types easily here, but usually it's 500 or 400.
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"reply":   result.Reply,
				"status":  result.Status,
				"elapsed": result.Elapsed,
			})
		})

		// Subscribe endpoints
		api.POST("/subscribe", func(c *gin.Context) {
			var req service.SubscribePayload
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			if err := subService.Subscribe(req); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"status": "subscribed", "subject": req.Subject})
		})

		api.POST("/unsubscribe", func(c *gin.Context) {
			var req struct {
				Subject string `json:"subject"`
			}
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			if err := subService.Unsubscribe(req.Subject); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"status": "unsubscribed"})
		})

		api.GET("/subscriptions", func(c *gin.Context) {
			subjects := subService.GetActiveSubscriptions()
			c.JSON(http.StatusOK, gin.H{"subscriptions": subjects})
		})

		api.GET("/subscriptions/:subject/messages", func(c *gin.Context) {
			subject := c.Param("subject")
			messages, err := subService.GetMessages(subject)
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"messages": messages})
		})

		api.DELETE("/subscriptions/:subject/messages", func(c *gin.Context) {
			subject := c.Param("subject")
			if err := subService.ClearMessages(subject); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "cleared"})
		})
	}

	return r
}

func setupStaticFiles(r *gin.Engine, exeDir string, embeddedFS embed.FS) {
	// Check if local web directory exists (development mode)
	webDir := filepath.Join(exeDir, "web")
	if stat, err := os.Stat(webDir); err == nil && stat.IsDir() {
		log.Printf("📁 Using local web directory: %s", webDir)
		r.Static("/web", webDir)
		r.StaticFile("/app.js", filepath.Join(webDir, "app.js"))
		r.StaticFile("/style.css", filepath.Join(webDir, "style.css"))
		r.GET("/", func(c *gin.Context) {
			c.File(filepath.Join(webDir, "index.html"))
		})
	} else {
		// Use embedded files (production mode)
		log.Println("📦 Using embedded web files")

		// Create a sub-filesystem rooted at "web"
		webFS, err := fs.Sub(embeddedFS, "web")
		if err != nil {
			log.Fatalf("Failed to create web sub-filesystem: %v", err)
		}

		// Serve static files from embedded FS
		r.StaticFS("/web", http.FS(webFS))

		r.GET("/app.js", func(c *gin.Context) {
			c.FileFromFS("app.js", http.FS(webFS))
		})
		r.GET("/style.css", func(c *gin.Context) {
			c.FileFromFS("style.css", http.FS(webFS))
		})

		// Serve index.html at root
		r.GET("/", func(c *gin.Context) {
			data, err := embeddedFS.ReadFile("web/index.html")
			if err != nil {
				c.String(http.StatusInternalServerError, "Failed to load index.html")
				return
			}
			c.Data(http.StatusOK, "text/html; charset=utf-8", data)
		})
	}
}
