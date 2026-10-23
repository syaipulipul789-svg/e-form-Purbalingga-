package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/purbalinggakab/e-form-purbalingga/internal/middleware"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
)

type OPDHandler struct {
	opds *repository.OPDRepository
}

func NewOPDHandler(opds *repository.OPDRepository) *OPDHandler {
	return &OPDHandler{opds: opds}
}

func (h *OPDHandler) List(c *gin.Context) {
	user := middleware.CurrentUser(c)
	if user == nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"success": false,
			"message": "Sesi tidak valid",
			"error":   gin.H{"code": "UNAUTHORIZED"},
		})
		return
	}

	if user.Role != "SUPER_ADMIN" {
		if user.OPD == nil {
			respondList(c, "Daftar OPD berhasil dimuat", []any{}, map[string]any{})
			return
		}
		respondSuccess(c, "Daftar OPD berhasil dimuat", []any{*user.OPD})
		return
	}

	items, err := h.opds.List(c.Request.Context())
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, "Daftar OPD berhasil dimuat", items)
}
