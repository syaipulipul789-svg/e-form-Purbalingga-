package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/middleware"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

type DashboardHandler struct {
	service service.DashboardService
}

func NewDashboardHandler(service service.DashboardService) *DashboardHandler {
	return &DashboardHandler{service: service}
}

func (h *DashboardHandler) Summary(c *gin.Context) {
	var opdID *uuid.UUID
	if raw := c.Query("opd_id"); raw != "" {
		parsed, err := uuid.Parse(raw)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"message": "Parameter opd_id tidak valid",
				"error":   gin.H{"code": "INVALID_OPD_ID"},
			})
			return
		}
		opdID = &parsed
	}

	summary, err := h.service.Summary(c.Request.Context(), middleware.CurrentUser(c), opdID)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, "Ringkasan dashboard berhasil dimuat", summary)
}
