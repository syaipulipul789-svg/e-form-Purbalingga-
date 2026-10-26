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

type AdminHandler struct {
	service service.AdminService
}

func NewAdminHandler(adminService service.AdminService) *AdminHandler {
	return &AdminHandler{service: adminService}
}

func (h *AdminHandler) ListOPDs(c *gin.Context) {
	items, err := h.service.ListOPDs(c.Request.Context())
	if err != nil {
		Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Gagal memuat daftar OPD", nil)
		return
	}
	Success(c, http.StatusOK, "Daftar OPD berhasil dimuat", items)
}

func (h *AdminHandler) CreateOPD(c *gin.Context) {
	var req domain.AdminOPDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Data OPD tidak valid", err.Error())
		return
	}
	item, err := h.service.CreateOPD(c.Request.Context(), h.actor(c), req)
	if err != nil {
		h.writeError(c, err)
		return
	}
	Success(c, http.StatusCreated, "OPD berhasil ditambahkan", item)
}

func (h *AdminHandler) UpdateOPD(c *gin.Context) {
	id, ok := h.parseID(c)
	if !ok {
		return
	}
	var req domain.AdminOPDRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Data OPD tidak valid", err.Error())
		return
	}
	item, err := h.service.UpdateOPD(c.Request.Context(), h.actor(c), id, req)
	if err != nil {
		h.writeError(c, err)
		return
	}
	Success(c, http.StatusOK, "Data OPD berhasil diperbarui", item)
}

func (h *AdminHandler) ListUsers(c *gin.Context) {
	items, err := h.service.ListUsers(c.Request.Context())
	if err != nil {
		Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Gagal memuat daftar pengguna", nil)
		return
	}
	Success(c, http.StatusOK, "Daftar pengguna berhasil dimuat", items)
}

func (h *AdminHandler) CreateUser(c *gin.Context) {
	var req domain.AdminUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Data pengguna tidak valid", err.Error())
		return
	}
	item, err := h.service.CreateUser(c.Request.Context(), h.actor(c), req)
	if err != nil {
		h.writeError(c, err)
		return
	}
	Success(c, http.StatusCreated, "Pengguna berhasil ditambahkan", item)
}

func (h *AdminHandler) UpdateUser(c *gin.Context) {
	id, ok := h.parseID(c)
	if !ok {
		return
	}
	var req domain.AdminUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Data pengguna tidak valid", err.Error())
		return
	}
	if err := h.service.UpdateUser(c.Request.Context(), h.actor(c), id, req); err != nil {
		h.writeError(c, err)
		return
	}
	Success(c, http.StatusOK, "Data pengguna berhasil diperbarui", gin.H{"id": id})
}

func (h *AdminHandler) SetUserStatus(c *gin.Context) {
	id, ok := h.parseID(c)
	if !ok {
		return
	}
	var req domain.AdminUserStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Status pengguna tidak valid", err.Error())
		return
	}
	if err := h.service.SetUserStatus(c.Request.Context(), h.actor(c), id, req.IsActive); err != nil {
		h.writeError(c, err)
		return
	}
	Success(c, http.StatusOK, "Status pengguna berhasil diperbarui", gin.H{"id": id, "is_active": req.IsActive})
}

func (h *AdminHandler) Monitoring(c *gin.Context) {
	metrics, err := h.service.Metrics(c.Request.Context())
	if err != nil {
		Error(c, http.StatusServiceUnavailable, "MONITORING_UNAVAILABLE", "Data monitoring tidak dapat dimuat", nil)
		return
	}
	Success(c, http.StatusOK, "Monitoring sistem berhasil dimuat", metrics)
}

func (h *AdminHandler) AuditTrail(c *gin.Context) {
	page, err := strconv.Atoi(c.DefaultQuery("page", "1"))
	if err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Nomor halaman tidak valid", nil)
		return
	}
	limit, err := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Batas halaman tidak valid", nil)
		return
	}
	result, err := h.service.ListAudit(c.Request.Context(), domain.AuditListQuery{
		Page:       page,
		Limit:      limit,
		EntityType: c.Query("entity_type"),
		Search:     c.Query("search"),
	})
	if err != nil {
		h.writeError(c, err)
		return
	}
	Success(c, http.StatusOK, "Audit trail berhasil dimuat", result)
}

func (h *AdminHandler) actor(c *gin.Context) service.AdminActor {
	userID, _ := middleware.CurrentUserID(c)
	role, _ := middleware.CurrentRole(c)
	return service.AdminActor{UserID: userID, Role: role, IPAddress: c.ClientIP()}
}

func (h *AdminHandler) parseID(c *gin.Context) (uuid.UUID, bool) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "ID tidak valid", nil)
		return uuid.Nil, false
	}
	return id, true
}

func (h *AdminHandler) writeError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrAdminInvalidInput):
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", err.Error(), nil)
	case errors.Is(err, service.ErrAdminConflict):
		Error(c, http.StatusConflict, "CONFLICT", err.Error(), nil)
	case errors.Is(err, service.ErrAdminNotFound):
		Error(c, http.StatusNotFound, "NOT_FOUND", err.Error(), nil)
	case errors.Is(err, service.ErrAdminForbidden):
		Error(c, http.StatusForbidden, "FORBIDDEN", err.Error(), nil)
	default:
		Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Gagal memproses permintaan administrasi", nil)
	}
}
