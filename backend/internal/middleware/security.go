package middleware

import (
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

func EnforceAllowedOrigin(allowedOrigins []string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(allowedOrigins))
	for _, origin := range allowedOrigins {
		allowed[origin] = true
	}

	return func(c *gin.Context) {
		switch c.Request.Method {
		case "GET", "HEAD", "OPTIONS":
			c.Next()
			return
		}

		origin := c.GetHeader("Origin")
		if origin == "" {
			c.Next()
			return
		}
		if !allowed[origin] {
			c.AbortWithStatusJSON(403, gin.H{
				"success": false,
				"message": "Origin permintaan tidak diizinkan",
				"error":   gin.H{"code": "INVALID_ORIGIN"},
			})
			return
		}
		c.Next()
	}
}

type loginAttempt struct {
	count   int
	resetAt time.Time
}

func LoginRateLimit(maxAttempts int, window time.Duration) gin.HandlerFunc {
	var mu sync.Mutex
	attempts := map[string]*loginAttempt{}

	return func(c *gin.Context) {
		key := c.ClientIP()
		now := time.Now()

		mu.Lock()
		entry, exists := attempts[key]
		if !exists || now.After(entry.resetAt) {
			entry = &loginAttempt{count: 0, resetAt: now.Add(window)}
			attempts[key] = entry
		}
		if entry.count >= maxAttempts {
			mu.Unlock()
			c.AbortWithStatusJSON(429, gin.H{
				"success": false,
				"message": "Terlalu banyak percobaan login. Silakan coba lagi beberapa saat.",
				"error":   gin.H{"code": "TOO_MANY_ATTEMPTS"},
			})
			return
		}
		entry.count++
		mu.Unlock()

		c.Next()
	}
}
