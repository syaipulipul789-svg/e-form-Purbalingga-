package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

// Konteks key yang digunakan untuk menyimpan data pengguna terautentikasi.
const (
	CtxUserID = "auth_user_id"
	CtxRole   = "auth_role"
	CtxOPDID  = "auth_opd_id"
)

// JWTAuth memvalidasi Bearer token dan menyimpan klaim ke context Gin.
func JWTAuth(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			abortUnauthorized(c, "Token autentikasi tidak ditemukan")
			return
		}

		tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		if tokenString == "" {
			abortUnauthorized(c, "Token autentikasi tidak valid")
			return
		}

		claims := &service.JWTClaims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return []byte(secret), nil
		})

		if err != nil || !token.Valid {
			abortUnauthorized(c, "Sesi Anda telah berakhir, silakan login kembali")
			return
		}

		c.Set(CtxUserID, claims.UserID)
		c.Set(CtxRole, claims.Role)
		c.Set(CtxOPDID, claims.OPDID)
		c.Next()
	}
}

// RequireRole membatasi akses endpoint hanya untuk role tertentu.
func RequireRole(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]struct{}, len(roles))
	for _, r := range roles {
		allowed[r] = struct{}{}
	}

	return func(c *gin.Context) {
		role, _ := c.Get(CtxRole)
		roleStr, _ := role.(string)
		if _, ok := allowed[roleStr]; !ok {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Anda tidak memiliki hak akses untuk aksi ini",
				"error": gin.H{
					"code": "FORBIDDEN",
				},
			})
			return
		}
		c.Next()
	}
}

// CurrentUserID mengambil ID pengguna terautentikasi dari context.
func CurrentUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get(CtxUserID)
	if !exists {
		return uuid.Nil, false
	}
	id, ok := val.(uuid.UUID)
	return id, ok
}

// CurrentOPDID mengambil ID OPD pengguna terautentikasi dari context.
func CurrentOPDID(c *gin.Context) (*uuid.UUID, bool) {
	val, exists := c.Get(CtxOPDID)
	if !exists {
		return nil, false
	}
	id, ok := val.(*uuid.UUID)
	if !ok || id == nil {
		return nil, false
	}
	return id, true
}

// CurrentRole mengambil peran pengguna terautentikasi dari context.
func CurrentRole(c *gin.Context) (string, bool) {
	val, exists := c.Get(CtxRole)
	if !exists {
		return "", false
	}
	role, ok := val.(string)
	return role, ok
}

func abortUnauthorized(c *gin.Context, message string) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
		"success": false,
		"message": message,
		"error": gin.H{
			"code": "UNAUTHORIZED",
		},
	})
}
