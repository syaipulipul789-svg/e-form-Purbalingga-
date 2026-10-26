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
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrFormNotFound):
			Error(c, http.StatusNotFound, "NOT_FOUND", service.ErrFormNotFound.Error(), nil)
		case errors.Is(err, service.ErrFormForbidden):
			Error(c, http.StatusForbidden, "FORBIDDEN", service.ErrFormForbidden.Error(), nil)
		default:
			Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Gagal memuat respons formulir", nil)
		}
		return
	}

	Success(c, http.StatusOK, "Daftar respons berhasil dimuat", res)
}
