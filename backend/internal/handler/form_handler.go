package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/middleware"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

// FormHandler menangani endpoint CRUD modul formulir.
type FormHandler struct {
	service service.FormService
}

// NewFormHandler membuat instance handler formulir.
func NewFormHandler(formService service.FormService) *FormHandler {
	return &FormHandler{service: formService}
}

// List menangani GET /api/v1/forms
func (h *FormHandler) List(c *gin.Context) {
	actor, ok := h.actor(c)
	if !ok {
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	res, err := h.service.List(c.Request.Context(), actor, domain.FormListQuery{
		Page:   page,
		Limit:  limit,
		Status: c.Query("status"),
		Search: c.Query("search"),
	})
	if err != nil {
		h.writeError(c, err)
		return
	}

	Success(c, http.StatusOK, "Daftar formulir berhasil dimuat", res)
}

// Create menangani POST /api/v1/forms
func (h *FormHandler) Create(c *gin.Context) {
	actor, ok := h.actor(c)
	if !ok {
		return
	}

	var req domain.CreateFormRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Data formulir tidak valid", err.Error())
		return
	}

	res, err := h.service.Create(c.Request.Context(), actor, req)
	if err != nil {
		h.writeError(c, err)
		return
	}

	Success(c, http.StatusCreated, "Formulir berhasil dibuat", res)
}

// Get menangani GET /api/v1/forms/:id
func (h *FormHandler) Get(c *gin.Context) {
	actor, ok := h.actor(c)
	if !ok {
		return
	}

	id, ok := h.parseID(c)
	if !ok {
		return
	}

	res, err := h.service.Get(c.Request.Context(), actor, id)
	if err != nil {
		h.writeError(c, err)
		return
	}

	Success(c, http.StatusOK, "Detail formulir berhasil dimuat", res)
}

// Update menangani PUT /api/v1/forms/:id
func (h *FormHandler) Update(c *gin.Context) {
	actor, ok := h.actor(c)
	if !ok {
		return
	}

	id, ok := h.parseID(c)
	if !ok {
		return
	}

	var req domain.UpdateFormRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Data formulir tidak valid", err.Error())
		return
	}

	res, err := h.service.Update(c.Request.Context(), actor, id, req)
	if err != nil {
		h.writeError(c, err)
		return
	}

	Success(c, http.StatusOK, "Formulir berhasil diperbarui", res)
}

// UpdateStatus menangani PATCH /api/v1/forms/:id/status
func (h *FormHandler) UpdateStatus(c *gin.Context) {
	actor, ok := h.actor(c)
	if !ok {
		return
	}

	id, ok := h.parseID(c)
	if !ok {
		return
	}

	var req domain.UpdateStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Status formulir tidak valid", err.Error())
		return
	}

	res, err := h.service.UpdateStatus(c.Request.Context(), actor, id, req.Status)
	if err != nil {
		h.writeError(c, err)
		return
	}

	Success(c, http.StatusOK, "Status formulir berhasil diperbarui", res)
}

// Delete menangani DELETE /api/v1/forms/:id
func (h *FormHandler) Delete(c *gin.Context) {
	actor, ok := h.actor(c)
	if !ok {
		return
	}

	id, ok := h.parseID(c)
	if !ok {
		return
	}

	if err := h.service.Delete(c.Request.Context(), actor, id); err != nil {
		h.writeError(c, err)
		return
	}

	Success(c, http.StatusOK, "Formulir berhasil dihapus", gin.H{"id": id})
}

func (h *FormHandler) actor(c *gin.Context) (service.Actor, bool) {
	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "Token autentikasi tidak valid", nil)
		return service.Actor{}, false
	}
	role, _ := middleware.CurrentRole(c)
	opdID, _ := middleware.CurrentOPDID(c)
	return service.Actor{UserID: userID, Role: role, OPDID: opdID}, true
}

func (h *FormHandler) parseID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "ID formulir tidak valid", nil)
		return uuid.Nil, false
	}
	return id, true
}

func (h *FormHandler) writeError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrFormNotFound):
		Error(c, http.StatusNotFound, "NOT_FOUND", service.ErrFormNotFound.Error(), nil)
	case errors.Is(err, service.ErrFormForbidden):
		Error(c, http.StatusForbidden, "FORBIDDEN", service.ErrFormForbidden.Error(), nil)
	case errors.Is(err, service.ErrSlugConflict):
		Error(c, http.StatusConflict, "SLUG_CONFLICT", service.ErrSlugConflict.Error(), nil)
	case errors.Is(err, service.ErrInvalidInput):
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", service.ErrInvalidInput.Error(), nil)
	default:
		Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Gagal memproses permintaan formulir", nil)
	}
}
