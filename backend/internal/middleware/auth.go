package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
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
		c.Next()
	}
}

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
			})
			return
		}
		c.Next()
	}
}

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
	})
}
