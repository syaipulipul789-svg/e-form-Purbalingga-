package handler

import (
<<<<<<< HEAD
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
=======
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/purbalinggakab/e-form-purbalingga/internal/config"
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
	"github.com/purbalinggakab/e-form-purbalingga/internal/middleware"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

type AuthHandler struct {
<<<<<<< HEAD
	authService service.AuthService
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Login menangani POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req domain.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Data login tidak valid", err.Error())
		return
	}

	resp, err := h.authService.Login(c.Request.Context(), req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidCredentials):
			Error(c, http.StatusUnauthorized, "INVALID_CREDENTIALS", "Email atau password salah", nil)
		case errors.Is(err, service.ErrInactiveUser):
			Error(c, http.StatusForbidden, "ACCOUNT_INACTIVE", err.Error(), nil)
		default:
			Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Gagal memproses login", nil)
		}
		return
	}

	Success(c, http.StatusOK, "Login berhasil", resp)
}

// Me menangani GET /api/v1/auth/me
func (h *AuthHandler) Me(c *gin.Context) {
	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "Token autentikasi tidak valid", nil)
		return
	}

	profile, err := h.authService.GetProfile(c.Request.Context(), userID)
	if err != nil {
		Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Gagal memuat profil pengguna", nil)
		return
	}

	Success(c, http.StatusOK, "Profil pengguna berhasil dimuat", profile)
=======
	service service.AuthService
	config  *config.Config
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func NewAuthHandler(service service.AuthService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{service: service, config: cfg}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Payload login tidak valid",
			"error":   gin.H{"code": "INVALID_PAYLOAD"},
		})
		return
	}

	result, err := h.service.Login(c.Request.Context(), req.Email, req.Password)
	if err != nil {
		respondError(c, err)
		return
	}

	h.setSessionCookie(c, result.Token, time.Duration(result.ExpiresIn)*time.Second)
	respondSuccess(c, "Login berhasil", result)
}

func (h *AuthHandler) Me(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Sesi tidak valid atau sudah berakhir",
			"error":   gin.H{"code": "UNAUTHORIZED"},
		})
		return
	}
	respondSuccess(c, "Profil pengguna berhasil dimuat", user)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(h.config.CookieName, "", -1, "/", "", h.config.CookieSecure, true)
	respondSuccess(c, "Logout berhasil", gin.H{"logged_out": true})
}

func (h *AuthHandler) setSessionCookie(c *gin.Context, token string, duration time.Duration) {
	maxAge := int(duration.Seconds())
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie(
		h.config.CookieName,
		strings.TrimSpace(token),
		maxAge,
		"/",
		"",
		h.config.CookieSecure,
		true,
	)
>>>>>>> 07c00404be99e7853df025b53dea2a67f4023a33
}
