package config

import (
	"os"
	"strconv"
)

type Config struct {
	AppEnv          string
	AppPort         string
	AppSecret       string
	DatabaseURL     string
	UploadDir       string
	MaxUploadSizeMB int
	SidamiAPIBase   string
}

func LoadConfig() *Config {
	maxUploadMB, err := strconv.Atoi(getEnv("MAX_UPLOAD_SIZE_MB", "10"))
	if err != nil {
		maxUploadMB = 10
	}

	return &Config{
		AppEnv:          getEnv("APP_ENV", "development"),
		AppPort:         getEnv("APP_PORT", "8080"),
		AppSecret:       getEnv("APP_SECRET", "purbalingga-super-secret-key-change-in-production"),
		DatabaseURL:     getEnv("DATABASE_URL", "postgres://postgres:purbalinggapass@postgres:5432/eform_purbalingga?sslmode=disable"),
		UploadDir:       getEnv("UPLOAD_DIR", "/app/storage/uploads"),
		MaxUploadSizeMB: maxUploadMB,
		SidamiAPIBase:   getEnv("SIDAMI_API_BASE", "https://api.sidami.purbalinggakab.go.id/api"),
	}
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
