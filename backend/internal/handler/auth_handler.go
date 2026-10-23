package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/purbalinggakab/e-form-purbalingga/internal/config"
	"github.com/purbalinggakab/e-form-purbalingga/internal/middleware"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

type AuthHandler struct {
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
}
