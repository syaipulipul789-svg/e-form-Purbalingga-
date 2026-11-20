package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/middleware"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

// ResponseHandler menangani endpoint daftar respons formulir.
type ResponseHandler struct {
	service service.ResponseService
}

// NewResponseHandler membuat instance handler respons formulir.
func NewResponseHandler(responseService service.ResponseService) *ResponseHandler {
	return &ResponseHandler{service: responseService}
}

// List menangani GET /api/v1/forms/:id/responses
func (h *ResponseHandler) List(c *gin.Context) {
	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "Token autentikasi tidak valid", nil)
		return
	}
	role, _ := middleware.CurrentRole(c)
	opdID, _ := middleware.CurrentOPDID(c)
	actor := service.Actor{UserID: userID, Role: role, OPDID: opdID}

	formID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "ID formulir tidak valid", nil)
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	res, err := h.service.List(c.Request.Context(), actor, formID, domain.FormResponseListQuery{
		Page:    page,
		Limit:   limit,
		Search:  c.Query("search"),
		KodeKec: c.Query("kode_kec"),
		Status:  c.Query("status"),
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrFormNotFound):
			Error(c, http.StatusNotFound, "NOT_FOUND", service.ErrFormNotFound.Error(), nil)
		case errors.Is(err, service.ErrFormForbidden):
			Error(c, http.StatusForbidden, "FORBIDDEN", service.ErrFormForbidden.Error(), nil)
		case errors.Is(err, service.ErrInvalidResponseStatus):
			Error(c, http.StatusUnprocessableEntity, "VALIDATION_ERROR", service.ErrInvalidResponseStatus.Error(), nil)
		default:
			Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Gagal memuat respons formulir", nil)
		}
		return
	}

	Success(c, http.StatusOK, "Daftar respons berhasil dimuat", res)
}

// Get menangani GET /api/v1/forms/:id/responses/:responseId
func (h *ResponseHandler) Get(c *gin.Context) {
	actor, formID, ok := h.actorAndFormID(c)
	if !ok {
		return
	}
	responseID, err := uuid.Parse(c.Param("responseId"))
	if err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "ID respons tidak valid", nil)
		return
	}

	res, err := h.service.Get(c.Request.Context(), actor, formID, responseID)
	if err != nil {
		h.writeError(c, err)
		return
	}
	Success(c, http.StatusOK, "Detail respons berhasil dimuat", res)
}

// UpdateStatus menangani PATCH /api/v1/forms/:id/responses/:responseId/status
func (h *ResponseHandler) UpdateStatus(c *gin.Context) {
	actor, formID, ok := h.actorAndFormID(c)
	if !ok {
		return
	}
	responseID, err := uuid.Parse(c.Param("responseId"))
	if err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "ID respons tidak valid", nil)
		return
	}

	var req domain.UpdateResponseStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Data yang dikirim tidak valid", err.Error())
		return
	}

	res, err := h.service.UpdateStatus(c.Request.Context(), actor, formID, responseID, req, c.ClientIP())
	if err != nil {
		h.writeError(c, err)
		return
	}
	Success(c, http.StatusOK, "Status pengajuan berhasil diperbarui", res)
}

func (h *ResponseHandler) actorAndFormID(c *gin.Context) (service.Actor, uuid.UUID, bool) {
	userID, ok := middleware.CurrentUserID(c)
	if !ok {
		Error(c, http.StatusUnauthorized, "UNAUTHORIZED", "Token autentikasi tidak valid", nil)
		return service.Actor{}, uuid.Nil, false
	}
	role, _ := middleware.CurrentRole(c)
	opdID, _ := middleware.CurrentOPDID(c)
	actor := service.Actor{UserID: userID, Role: role, OPDID: opdID}

	formID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "ID formulir tidak valid", nil)
		return service.Actor{}, uuid.Nil, false
	}
	return actor, formID, true
}

func (h *ResponseHandler) writeError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrFormNotFound):
		Error(c, http.StatusNotFound, "NOT_FOUND", service.ErrFormNotFound.Error(), nil)
	case errors.Is(err, service.ErrFormForbidden):
		Error(c, http.StatusForbidden, "FORBIDDEN", service.ErrFormForbidden.Error(), nil)
	case errors.Is(err, repository.ErrResponseNotFound):
		Error(c, http.StatusNotFound, "NOT_FOUND", repository.ErrResponseNotFound.Error(), nil)
	case errors.Is(err, service.ErrInvalidResponseStatus):
		Error(c, http.StatusUnprocessableEntity, "VALIDATION_ERROR", service.ErrInvalidResponseStatus.Error(), nil)
	case errors.Is(err, service.ErrInvalidStatusTransition):
		Error(c, http.StatusUnprocessableEntity, "INVALID_STATUS_TRANSITION", service.ErrInvalidStatusTransition.Error(), nil)
	case errors.Is(err, service.ErrPublicNoteRequired):
		Error(c, http.StatusUnprocessableEntity, "VALIDATION_ERROR", service.ErrPublicNoteRequired.Error(), nil)
	default:
		Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Gagal memproses respons formulir", nil)
	}
}
