package http

import (
	"embed"
	"io/fs"
	"log"
	"net/http"
	"strconv"

	"natsman/internal/application"
	"natsman/internal/config"
	"natsman/internal/domain"
	"natsman/internal/infrastructure/nats"

	"github.com/gin-gonic/gin"
)

// SetupRouter initializes the Gin engine and defines all API routes
func SetupRouter(exeDir string, appCfg *config.AppConfig, configPath string, tmplRepo domain.TemplateRepository, profileRepo domain.ProfileRepository, reqService *application.RequestService, subService *application.SubscribeService, jsService *application.JetStreamService, kvService *application.KVService, embeddedFS embed.FS) *gin.Engine {
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
			url, credsPath := profileRepo.GetNatsConfig()
			c.JSON(http.StatusOK, gin.H{
				"url":        url,
				"creds_path": credsPath,
			})
		})

		// This endpoint is kept for backward compatibility but not used with profiles
		api.POST("/config", func(c *gin.Context) {
			var newCfg nats.Config
			if err := c.BindJSON(&newCfg); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			// Update runtime config and save back to config.json
			appCfg.NatsURL = newCfg.URL
			appCfg.NatsCreds = newCfg.CredsPath
			config.SaveConfig(configPath, appCfg)
			c.JSON(http.StatusOK, gin.H{"status": "updated"})
		})

		// Get tree structure
		api.GET("/templates", func(c *gin.Context) {
			tree, err := tmplRepo.GetTree()
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
			template, err := tmplRepo.GetTemplate(path)
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
				Template domain.Template `json:"template"`
			}
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := tmplRepo.SaveTemplate(req.Path, &req.Template); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "saved"})
		})

		// Create template
		api.POST("/templates/create", func(c *gin.Context) {
			var req struct {
				Path     string         `json:"path"`
				Template domain.Template `json:"template"`
			}
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := tmplRepo.CreateTemplate(req.Path, &req.Template); err != nil {
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
			if err := tmplRepo.DeleteTemplate(path); err != nil {
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
			if err := tmplRepo.CreateFolder(req.Path); err != nil {
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
			if err := tmplRepo.MoveTemplate(req.From, req.To); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "moved"})
		})

		api.GET("/globals", func(c *gin.Context) {
			c.JSON(http.StatusOK, profileRepo.GetGlobalVars())
		})

		// Profile endpoints
		// Globals Profiles
		api.GET("/profiles/globals", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"profiles": profileRepo.GetGlobalsProfiles(),
				"active":   profileRepo.GetActiveGlobalsProfile(),
			})
		})

		api.POST("/profiles/globals", func(c *gin.Context) {
			var profile domain.GlobalsProfile
			if err := c.BindJSON(&profile); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := profileRepo.SaveGlobalsProfile(profile); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "saved"})
		})

		api.DELETE("/profiles/globals/:name", func(c *gin.Context) {
			name := c.Param("name")
			if err := profileRepo.DeleteGlobalsProfile(name); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "deleted"})
		})

		api.POST("/profiles/globals/activate/:name", func(c *gin.Context) {
			name := c.Param("name")
			if err := profileRepo.ActivateGlobalsProfile(name); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "activated"})
		})

		// NATS Profiles
		api.GET("/profiles/nats", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"profiles": profileRepo.GetNatsProfiles(),
				"active":   profileRepo.GetActiveNatsProfile(),
			})
		})

		api.POST("/profiles/nats", func(c *gin.Context) {
			var profile domain.NatsProfile
			if err := c.BindJSON(&profile); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := profileRepo.SaveNatsProfile(profile); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "saved"})
		})

		api.DELETE("/profiles/nats/:name", func(c *gin.Context) {
			name := c.Param("name")
			if err := profileRepo.DeleteNatsProfile(name); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "deleted"})
		})

		api.POST("/profiles/nats/activate/:name", func(c *gin.Context) {
			name := c.Param("name")
			if err := profileRepo.ActivateNatsProfile(name); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "activated"})
		})

		// JS Extensions
		api.GET("/extensions", func(c *gin.Context) {
			available, err := profileRepo.ListJSExtensions()
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			active := profileRepo.GetActiveJSExtensions()
			c.JSON(http.StatusOK, gin.H{
				"available": available,
				"active":    active,
			})
		})

		api.POST("/extensions/activate", func(c *gin.Context) {
			var req struct {
				Extensions []string `json:"extensions"`
			}
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			if err := profileRepo.SetActiveJSExtensions(req.Extensions); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "activated"})
		})

		api.POST("/extensions/add/:filename", func(c *gin.Context) {
			filename := c.Param("filename")
			if err := profileRepo.AddJSExtension(filename); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "added"})
		})

		api.DELETE("/extensions/:filename", func(c *gin.Context) {
			filename := c.Param("filename")
			if err := profileRepo.RemoveJSExtension(filename); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "removed"})
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
			var req application.RequestPayload
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
			var req application.SubscribePayload
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

		// JetStream endpoints
		api.POST("/jetstream/streams", func(c *gin.Context) {
			var req application.StreamCreateRequest
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			if err := jsService.CreateStream(req); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"status": "created", "stream": req.Name})
		})

		api.GET("/jetstream/streams", func(c *gin.Context) {
			streams, err := jsService.ListStreams(nats.Config{})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"streams": streams})
		})

		api.GET("/jetstream/streams/:name", func(c *gin.Context) {
			name := c.Param("name")
			info, err := jsService.GetStreamInfo(name, nats.Config{})
			if err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, info)
		})

		api.DELETE("/jetstream/streams/:name", func(c *gin.Context) {
			name := c.Param("name")
			if err := jsService.DeleteStream(name, nats.Config{}); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "deleted"})
		})

		api.POST("/jetstream/publish", func(c *gin.Context) {
			var req application.JSPublishRequest
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			result, err := jsService.PublishToJetStream(req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, result)
		})

		api.POST("/jetstream/consumers", func(c *gin.Context) {
			var req application.ConsumerCreateRequest
			if err := c.BindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			if err := jsService.CreateConsumer(req); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"status": "created", "consumer": req.Name})
		})

		api.DELETE("/jetstream/consumers/:stream/:consumer", func(c *gin.Context) {
			streamName := c.Param("stream")
			consumerName := c.Param("consumer")
			if err := jsService.DeleteConsumer(streamName, consumerName, nats.Config{}); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, gin.H{"status": "deleted"})
		})

		// Get stream messages
		api.GET("/jetstream/streams/:name/messages", func(c *gin.Context) {
			streamName := c.Param("name")
			limitStr := c.DefaultQuery("limit", "10")
			limit, _ := strconv.Atoi(limitStr)
			
			startSeqStr := c.DefaultQuery("start_seq", "1")
			startSeq, _ := strconv.ParseUint(startSeqStr, 10, 64)

			req := application.GetMessagesRequest{
				StreamName: streamName,
				Limit:      limit,
				StartSeq:   startSeq,
				Config:     nats.Config{},
			}

			result, err := jsService.GetStreamMessages(req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, result)
		})

		api.GET("/jetstream/streams/:name/messages/all", func(c *gin.Context) {
			streamName := c.Param("name")
			refreshStr := c.DefaultQuery("refresh", "false")
			refresh := refreshStr == "true"

			result, err := jsService.FetchAllMessages(streamName, nats.Config{}, refresh)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, result)
		})

		// --- KV API Routes ---

		// List KV buckets
		api.GET("/kv/buckets", func(c *gin.Context) {
			profile := c.Query("profile")
			if profile == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "profile parameter is required"})
				return
			}
			
			result, err := kvService.ListKVBuckets(application.ListKVBucketsRequest{Profile: profile})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}
			c.JSON(http.StatusOK, result)
		})

		// Create KV bucket
		api.POST("/kv/buckets", func(c *gin.Context) {
			var req application.CreateKVBucketRequest
			if err := c.ShouldBindJSON(&req); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			if err := kvService.CreateKVBucket(req); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"status": "created"})
		})

		// Delete KV bucket
		api.DELETE("/kv/buckets/:bucket", func(c *gin.Context) {
			bucketName := c.Param("bucket")
			profile := c.Query("profile")
			if profile == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "profile parameter is required"})
				return
			}
			
			req := application.DeleteKVBucketRequest{
				Profile:    profile,
				BucketName: bucketName,
			}
			
			if err := kvService.DeleteKVBucket(req); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"status": "deleted"})
		})

		// Get KV bucket info
		api.GET("/kv/buckets/:bucket/info", func(c *gin.Context) {
			bucketName := c.Param("bucket")
			profile := c.Query("profile")
			if profile == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "profile parameter is required"})
				return
			}
			
			info, err := kvService.GetKVBucketInfo(application.GetKVBucketInfoRequest{
				Profile:    profile,
				BucketName: bucketName,
			})
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, info)
		})

		// List keys in bucket
		api.GET("/kv/buckets/:bucket/keys", func(c *gin.Context) {
			bucketName := c.Param("bucket")
			profile := c.Query("profile")
			if profile == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "profile parameter is required"})
				return
			}
			
			req := application.KVKeysRequest{
				Profile:    profile,
				BucketName: bucketName,
			}
			
			result, err := kvService.KVKeys(req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, result)
		})

		// Put KV value
		api.PUT("/kv/buckets/:bucket/keys/:key", func(c *gin.Context) {
			bucketName := c.Param("bucket")
			key := c.Param("key")
			profile := c.Query("profile")
			if profile == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "profile parameter is required"})
				return
			}
			
			var body struct {
				Value string `json:"value"`
			}
			if err := c.ShouldBindJSON(&body); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}

			req := application.KVPutRequest{
				Profile:    profile,
				BucketName: bucketName,
				Key:        key,
				Value:      body.Value,
			}

			result, err := kvService.KVPut(req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, result)
		})

		// Get KV value
		api.GET("/kv/buckets/:bucket/keys/:key", func(c *gin.Context) {
			bucketName := c.Param("bucket")
			key := c.Param("key")
			profile := c.Query("profile")
			if profile == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "profile parameter is required"})
				return
			}
			
			req := application.KVGetRequest{
				Profile:    profile,
				BucketName: bucketName,
				Key:        key,
			}

			result, err := kvService.KVGet(req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, result)
		})

		// Delete KV key
		api.DELETE("/kv/buckets/:bucket/keys/:key", func(c *gin.Context) {
			bucketName := c.Param("bucket")
			key := c.Param("key")
			profile := c.Query("profile")
			if profile == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "profile parameter is required"})
				return
			}
			
			req := application.KVDeleteRequest{
				Profile:    profile,
				BucketName: bucketName,
				Key:        key,
			}

			if err := kvService.KVDelete(req); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, gin.H{"status": "deleted"})
		})

		// Get KV key history
		api.GET("/kv/buckets/:bucket/keys/:key/history", func(c *gin.Context) {
			bucketName := c.Param("bucket")
			key := c.Param("key")
			profile := c.Query("profile")
			if profile == "" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "profile parameter is required"})
				return
			}
			
			req := application.KVHistoryRequest{
				Profile:    profile,
				BucketName: bucketName,
				Key:        key,
			}

			result, err := kvService.KVHistory(req)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
				return
			}

			c.JSON(http.StatusOK, result)
		})
	}

	return r
}

func setupStaticFiles(r *gin.Engine, exeDir string, embeddedFS embed.FS) {
	// Always use embedded files (production mode)
	log.Println("📦 Using embedded web files")

	// Create a sub-filesystem rooted at "frontend/dist"
	distFS, err := fs.Sub(embeddedFS, "frontend/dist")
	if err != nil {
		log.Fatalf("Failed to create web sub-filesystem: %v", err)
	}

	// Serve assets folder
	// We need to serve /assets from frontend/dist/assets
	assetsFS, err := fs.Sub(distFS, "assets")
	if err != nil {
		log.Fatalf("Failed to create assets sub-filesystem: %v", err)
	}
	r.StaticFS("/assets", http.FS(assetsFS))

	// Serve index.html at root
	r.GET("/", func(c *gin.Context) {
		data, err := embeddedFS.ReadFile("frontend/dist/index.html")
		if err != nil {
			c.String(http.StatusInternalServerError, "Failed to load index.html")
			return
		}
		c.Data(http.StatusOK, "text/html; charset=utf-8", data)
	})
}
