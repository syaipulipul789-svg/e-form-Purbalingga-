package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
<<<<<<< HEAD
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
=======
	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
	"github.com/purbalinggakab/e-form-purbalingga/internal/utils"
)

const contextAuthUser = "auth_user"

type AuthMiddleware struct {
	users      *repository.UserRepository
	opds       *repository.OPDRepository
	jwtSecret  string
	cookieName string
}

func NewAuthMiddleware(users *repository.UserRepository, opds *repository.OPDRepository, jwtSecret, cookieName string) *AuthMiddleware {
	return &AuthMiddleware{
		users:      users,
		opds:       opds,
		jwtSecret:  jwtSecret,
		cookieName: cookieName,
	}
}

func (m *AuthMiddleware) Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		token := ""
		if cookieValue, err := c.Cookie(m.cookieName); err == nil {
			token = cookieValue
		}
		if token == "" {
			header := strings.TrimSpace(c.GetHeader("Authorization"))
			if strings.HasPrefix(strings.ToLower(header), "bearer ") {
				token = strings.TrimSpace(header[7:])
			}
		}
		if token == "" {
			abortUnauthorized(c)
			return
		}

		claims, err := utils.ParseToken(token, m.jwtSecret)
		if err != nil {
			abortUnauthorized(c)
			return
		}
		userID, err := uuid.Parse(claims.Subject)
		if err != nil {
			abortUnauthorized(c)
			return
		}

		user, err := m.users.GetByID(c.Request.Context(), userID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"message": "Gagal memvalidasi sesi pengguna",
				"error":   gin.H{"code": "INTERNAL_ERROR"},
			})
			return
		}
		if user == nil || !user.IsActive {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Akun tidak aktif atau tidak ditemukan",
				"error":   gin.H{"code": "USER_INACTIVE"},
			})
			return
		}

		authUser := &domain.AuthUser{
			ID:     user.ID,
			Nama:   user.Nama,
			Email:  user.Email,
			Role:   user.Role,
			OPDID:  user.OPDID,
			Active: user.IsActive,
		}
		if user.OPDID != nil {
			opd, opdErr := m.opds.GetByID(c.Request.Context(), *user.OPDID)
			if opdErr == nil && opd != nil {
				authUser.OPD = &domain.OPDSummary{
					ID:        opd.ID,
					KodeOPD:   opd.KodeOPD,
					NamaOPD:   opd.NamaOPD,
					Singkatan: opd.Singkatan,
				}
			}
		}

		c.Set(contextAuthUser, authUser)
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
		c.Next()
	}
}

<<<<<<< HEAD
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
=======
func RequireRoles(roles ...string) gin.HandlerFunc {
	allowed := make(map[string]bool, len(roles))
	for _, role := range roles {
		allowed[role] = true
	}
	return func(c *gin.Context) {
		user := CurrentUser(c)
		if user == nil {
			abortUnauthorized(c)
			return
		}
		if !allowed[user.Role] {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Anda tidak memiliki akses untuk tindakan ini",
				"error":   gin.H{"code": "FORBIDDEN"},
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
			})
			return
		}
		c.Next()
	}
}

<<<<<<< HEAD
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
=======
func CurrentUser(c *gin.Context) *domain.AuthUser {
	value, exists := c.Get(contextAuthUser)
	if !exists {
		return nil
	}
	user, ok := value.(*domain.AuthUser)
	if !ok {
		return nil
	}
	return user
}

func abortUnauthorized(c *gin.Context) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
		"success": false,
		"message": "Sesi tidak valid atau sudah berakhir. Silakan login kembali.",
		"error":   gin.H{"code": "UNAUTHORIZED"},
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
	})
}
