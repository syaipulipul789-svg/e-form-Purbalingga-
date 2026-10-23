package config

import (
	"os"
	"strconv"
	"strings"
)

type Config struct {
	AppEnv          string
	AppPort         string
	AppSecret       string
	JWTSecret       string
	JWTExpiresHours int
	CookieName      string
	CookieSecure    bool
	AllowedOrigins  []string
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

	expiresHours, err := strconv.Atoi(getEnv("JWT_EXPIRES_HOURS", "24"))
	if err != nil || expiresHours <= 0 {
		expiresHours = 24
	}

	appEnv := getEnv("APP_ENV", "development")
	appSecret := getEnv("APP_SECRET", "purbalingga-super-secret-key-change-in-production-min32chars")

	return &Config{
		AppEnv:          appEnv,
		AppPort:         getEnv("APP_PORT", "8080"),
		AppSecret:       appSecret,
		JWTSecret:       getEnv("JWT_SECRET", appSecret),
		JWTExpiresHours: expiresHours,
		CookieName:      getEnv("COOKIE_NAME", "eform_session"),
		CookieSecure:    getEnvBool("COOKIE_SECURE", appEnv == "production"),
		AllowedOrigins:  getEnvList("CORS_ALLOWED_ORIGINS", []string{"http://localhost:3000", "http://localhost:3002", "http://127.0.0.1:3000", "http://127.0.0.1:3002"}),
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

func getEnvBool(key string, defaultVal bool) bool {
	val := strings.TrimSpace(os.Getenv(key))
	if val == "" {
		return defaultVal
	}
	parsed, err := strconv.ParseBool(val)
	if err != nil {
		return defaultVal
	}
	return parsed
}

func getEnvList(key string, defaultVal []string) []string {
	val := strings.TrimSpace(os.Getenv(key))
	if val == "" {
		return defaultVal
	}

	items := make([]string, 0)
	for _, item := range strings.Split(val, ",") {
		if trimmed := strings.TrimSpace(item); trimmed != "" {
			items = append(items, trimmed)
		}
	}
	if len(items) == 0 {
		return defaultVal
	}
	return items
}
