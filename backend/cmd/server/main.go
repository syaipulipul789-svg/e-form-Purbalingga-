package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
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

	// 3. Inisialisasi Repository, Service dan Handler
	wilayahSvc := service.NewWilayahService(cfg.SidamiAPIBase)
	wilayahHdl := handler.NewWilayahHandler(wilayahSvc)

	userRepo := repository.NewUserRepository(db)
	opdRepo := repository.NewOPDRepository(db)
	authSvc := service.NewAuthService(userRepo, opdRepo, cfg.AppSecret, cfg.JWTExpiryHours)
	authHdl := handler.NewAuthHandler(authSvc)

	formRepo := repository.NewFormRepository(db)
	formSvc := service.NewFormService(formRepo)
	formHdl := handler.NewFormHandler(formSvc)

	// 4. Setup Gin Router
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	router := gin.Default()

	// 5. Setup CORS Middleware
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "http://localhost:3002", "http://127.0.0.1:3000", "http://127.0.0.1:3002"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "Idempotency-Key"},
		ExposeHeaders:    []string{"Content-Length", "Content-Disposition"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// 6. Static File Serving untuk Uploads
	_ = os.MkdirAll(cfg.UploadDir, 0755)
	router.Static("/uploads", cfg.UploadDir)

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
		// Autentikasi & Akun Admin OPD
		auth := apiV1.Group("/auth")
		{
			auth.POST("/login", authHdl.Login)
			auth.GET("/me", middleware.JWTAuth(cfg.AppSecret), authHdl.Me)
		}

		// Wilayah Purbalingga (Chaining Data Endpoints)
		wilayah := apiV1.Group("/wilayah")
		{
			wilayah.GET("/kecamatan", wilayahHdl.GetKecamatan)
			wilayah.GET("/desa", wilayahHdl.GetDesa)
		}

		// Manajemen Formulir (Form Builder) untuk Admin OPD & Super Admin
		forms := apiV1.Group("/forms")
		forms.Use(middleware.JWTAuth(cfg.AppSecret), middleware.RequireRole("ADMIN_OPD", "SUPER_ADMIN"))
		{
			forms.GET("", formHdl.List)
			forms.POST("", formHdl.Create)
			forms.GET("/:id", formHdl.Get)
			forms.PUT("/:id", formHdl.Update)
			forms.PATCH("/:id/status", formHdl.UpdateStatus)
			forms.DELETE("/:id", formHdl.Delete)
		}

		// Endpoint terproteksi untuk uji RBAC (sementara)
		admin := apiV1.Group("/admin")
		admin.Use(middleware.JWTAuth(cfg.AppSecret))
		{
			admin.GET("/ping", middleware.RequireRole("SUPER_ADMIN", "ADMIN_OPD", "OPERATOR"), func(c *gin.Context) {
				handler.Success(c, http.StatusOK, "Akses admin berhasil", gin.H{
					"role": c.GetString(middleware.CtxRole),
				})
			})
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
