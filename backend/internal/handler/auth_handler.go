package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/middleware"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

type AuthHandler struct {
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
}
