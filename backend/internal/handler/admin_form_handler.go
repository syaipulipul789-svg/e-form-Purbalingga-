package handler

import (
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/middleware"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

type AdminFormHandler struct {
	service service.AdminFormService
}

type formRequest struct {
	Title       string          `json:"title"`
	Slug        string          `json:"slug"`
	Description *string         `json:"description"`
	BannerURL   *string         `json:"banner_url"`
	Status      string          `json:"status"`
	Schema      json.RawMessage `json:"schema"`
	Settings    json.RawMessage `json:"settings"`
	OPDID       *uuid.UUID      `json:"opd_id"`
}

type formStatusRequest struct {
	Status string `json:"status"`
}

func NewAdminFormHandler(service service.AdminFormService) *AdminFormHandler {
	return &AdminFormHandler{service: service}
}

func (h *AdminFormHandler) List(c *gin.Context) {
	user := middleware.CurrentUser(c)
	page, limit := parsePagination(c)

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

	items, total, err := h.service.List(c.Request.Context(), user, service.FormListParams{
		Page:   page,
		Limit:  limit,
		Status: c.Query("status"),
		Search: c.Query("search"),
		OPDID:  opdID,
	})
	if err != nil {
		respondError(c, err)
		return
	}

	respondList(c, "Daftar formulir berhasil dimuat", items, pageMeta(page, limit, total))
}

func (h *AdminFormHandler) Get(c *gin.Context) {
	formID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	form, err := h.service.Get(c.Request.Context(), middleware.CurrentUser(c), formID)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, "Detail formulir berhasil dimuat", form)
}

func (h *AdminFormHandler) Create(c *gin.Context) {
	var req formRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Payload formulir tidak valid",
			"error":   gin.H{"code": "INVALID_PAYLOAD"},
		})
		return
	}

	form, err := h.service.Create(c.Request.Context(), middleware.CurrentUser(c), toFormInput(req))
	if err != nil {
		respondError(c, err)
		return
	}
	respondCreated(c, "Formulir berhasil dibuat", form)
}

func (h *AdminFormHandler) Update(c *gin.Context) {
	formID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}
	var req formRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Payload formulir tidak valid",
			"error":   gin.H{"code": "INVALID_PAYLOAD"},
		})
		return
	}

	form, err := h.service.Update(c.Request.Context(), middleware.CurrentUser(c), formID, toFormInput(req))
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, "Formulir berhasil diperbarui", form)
}

func (h *AdminFormHandler) UpdateStatus(c *gin.Context) {
	formID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}
	var req formStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Payload status tidak valid",
			"error":   gin.H{"code": "INVALID_PAYLOAD"},
		})
		return
	}

	form, err := h.service.UpdateStatus(c.Request.Context(), middleware.CurrentUser(c), formID, req.Status)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, "Status formulir berhasil diperbarui", form)
}

func (h *AdminFormHandler) Delete(c *gin.Context) {
	formID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}

	if err := h.service.Delete(c.Request.Context(), middleware.CurrentUser(c), formID); err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, "Formulir berhasil dihapus", gin.H{"deleted": true})
}

func toFormInput(req formRequest) service.FormInput {
	return service.FormInput{
		Title:       req.Title,
		Slug:        req.Slug,
		Description: req.Description,
		BannerURL:   req.BannerURL,
		Status:      req.Status,
		Schema:      req.Schema,
		Settings:    req.Settings,
		OPDID:       req.OPDID,
	}
}

func parseUUIDParam(c *gin.Context, name string) (uuid.UUID, bool) {
	value, err := uuid.Parse(c.Param(name))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Parameter ID tidak valid",
			"error":   gin.H{"code": "INVALID_ID"},
		})
		return uuid.Nil, false
	}
	return value, true
}
