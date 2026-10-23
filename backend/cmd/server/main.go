package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/purbalinggakab/e-form-purbalingga/internal/config"
	"github.com/purbalinggakab/e-form-purbalingga/internal/database"
	"github.com/purbalinggakab/e-form-purbalingga/internal/handler"
	"github.com/purbalinggakab/e-form-purbalingga/internal/middleware"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

func main() {
	log.Println("=== Memulai E-Form Server Kabupaten Purbalingga ===")

	// 1. Load Konfigurasi
	cfg := config.LoadConfig()

	// 2. Koneksi Database
	db, err := database.InitDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Fatal: Gagal menghubungkan ke database: %v", err)
	}
	defer db.Close()

	// 3. Inisialisasi Repository, Service, dan Handler
	formRepo := repository.NewFormRepository(db)
	responseRepo := repository.NewResponseRepository(db)
	userRepo := repository.NewUserRepository(db)
	opdRepo := repository.NewOPDRepository(db)
	dashboardRepo := repository.NewDashboardRepository(db)

	wilayahSvc := service.NewWilayahService(cfg.SidamiAPIBase)
	wilayahHdl := handler.NewWilayahHandler(wilayahSvc)

	publicFormSvc := service.NewPublicFormService(db, formRepo, responseRepo, cfg.AppSecret)
	publicFormHdl := handler.NewPublicFormHandler(publicFormSvc)

	uploadSvc := service.NewUploadService(cfg.UploadDir, cfg.MaxUploadSizeMB)
	uploadHdl := handler.NewUploadHandler(uploadSvc)

	authSvc := service.NewAuthService(userRepo, opdRepo, cfg.JWTSecret, time.Duration(cfg.JWTExpiresHours)*time.Hour)
	authHdl := handler.NewAuthHandler(authSvc, cfg)
	authMW := middleware.NewAuthMiddleware(userRepo, opdRepo, cfg.JWTSecret, cfg.CookieName)

	adminFormSvc := service.NewAdminFormService(db, formRepo, opdRepo)
	adminFormHdl := handler.NewAdminFormHandler(adminFormSvc)

	adminResponseSvc := service.NewAdminResponseService(formRepo, responseRepo)
	adminResponseHdl := handler.NewAdminResponseHandler(adminResponseSvc)

	dashboardSvc := service.NewDashboardService(dashboardRepo)
	dashboardHdl := handler.NewDashboardHandler(dashboardSvc)

	opdHdl := handler.NewOPDHandler(opdRepo)

	// 4. Setup Gin Router
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// 5. Setup CORS Middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "Idempotency-Key"},
		ExposeHeaders:    []string{"Content-Length", "Content-Disposition"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))
	router.Use(middleware.EnforceAllowedOrigin(cfg.AllowedOrigins))

	// 6. Static File Serving untuk Uploads
	_ = os.MkdirAll(cfg.UploadDir, 0755)
	router.Static("/uploads/forms", filepath.Join(cfg.UploadDir, "forms"))
	router.Static("/uploads/banners", filepath.Join(cfg.UploadDir, "banners"))
	submissionFiles := router.Group("/uploads/submissions")
	submissionFiles.Use(authMW.Authenticate())
	submissionFiles.Static("", filepath.Join(cfg.UploadDir, "submissions"))

	// 7. Health Check
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"app":       "E-Form Kabupaten Purbalingga",
			"timestamp": time.Now(),
		})
	})

	// 8. Register API v1 Group
	apiV1 := router.Group("/api/v1")
	{
		// Wilayah Purbalingga (Chaining Data Endpoints)
		wilayah := apiV1.Group("/wilayah")
		{
			wilayah.GET("/kecamatan", wilayahHdl.GetKecamatan)
			wilayah.GET("/desa", wilayahHdl.GetDesa)
		}

		// Formulir publik & pengunggahan berkas
		public := apiV1.Group("/public")
		{
			public.GET("/forms", publicFormHdl.List)
			public.GET("/forms/:slug", publicFormHdl.GetForm)
			public.POST("/forms/:slug/submit", publicFormHdl.Submit)
			public.POST("/upload", uploadHdl.Upload)
		}

		// Autentikasi admin
		auth := apiV1.Group("/auth")
		{
			auth.POST("/login", middleware.LoginRateLimit(20, time.Minute), authHdl.Login)
			auth.GET("/me", authMW.Authenticate(), authHdl.Me)
			auth.POST("/logout", authHdl.Logout)
		}

		// Endpoint admin terproteksi
		admin := apiV1.Group("")
		admin.Use(authMW.Authenticate())
		{
			admin.GET("/opd", opdHdl.List)
			admin.GET("/dashboard/summary", dashboardHdl.Summary)

			admin.GET("/forms", adminFormHdl.List)
			admin.POST("/forms", adminFormHdl.Create)
			admin.GET("/forms/:id", adminFormHdl.Get)
			admin.PUT("/forms/:id", adminFormHdl.Update)
			admin.PATCH("/forms/:id/status", adminFormHdl.UpdateStatus)
			admin.DELETE("/forms/:id", adminFormHdl.Delete)

			admin.GET("/forms/:id/responses", adminResponseHdl.List)
			admin.GET("/forms/:id/responses/:responseId", adminResponseHdl.Get)
			admin.PATCH("/forms/:id/responses/:responseId/verification", adminResponseHdl.UpdateVerification)
			admin.GET("/forms/:id/export", adminResponseHdl.Export)
		}
	}

	// 9. Server HTTP dengan Graceful Shutdown
	serverAddr := fmt.Sprintf(":%s", cfg.AppPort)
	srv := &http.Server{
		Addr:    serverAddr,
		Handler: router,
	}

	go func() {
		log.Printf("✓ Server REST API berjalan di http://localhost%s", serverAddr)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Gagal menjalankan server: %v", err)
		}
	}()

	// Menunggu sinyal OS untuk shutdown secara mulus
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	log.Println("Mematikan server E-Form dengan aman (graceful shutdown)...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("Server dipaksa berhenti: %v", err)
	}

	log.Println("Server E-Form Purbalingga telah berhenti sepenuhnya.")
}
