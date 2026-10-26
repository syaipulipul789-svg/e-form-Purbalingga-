package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
	"github.com/purbalinggakab/e-form-purbalingga/internal/repository"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

// PublicHandler menangani endpoint yang dapat diakses tanpa autentikasi.
type PublicHandler struct {
	formService   service.PublicFormService
	uploadService service.UploadService
	maxUploadByte int64
}

// NewPublicHandler membuat instance handler publik.
func NewPublicHandler(formService service.PublicFormService, uploadService service.UploadService, maxUploadMB int) *PublicHandler {
	if maxUploadMB <= 0 {
		maxUploadMB = 10
	}
	return &PublicHandler{
		formService:   formService,
		uploadService: uploadService,
		maxUploadByte: int64(maxUploadMB) * 1024 * 1024,
	}
}

// GetForm menangani GET /api/v1/public/forms/:slug
func (h *PublicHandler) GetForm(c *gin.Context) {
	res, err := h.formService.GetBySlug(c.Request.Context(), c.Param("slug"))
	if err != nil {
		h.writeError(c, err)
		return
	}
	Success(c, http.StatusOK, "Detail formulir berhasil dimuat", res)
}

// Submit menangani POST /api/v1/public/forms/:slug/submit
func (h *PublicHandler) Submit(c *gin.Context) {
	var req domain.PublicSubmitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Data yang dikirim tidak valid", err.Error())
		return
	}

	res, err := h.formService.Submit(c.Request.Context(), c.Param("slug"), req, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		h.writeError(c, err)
		return
	}
	Success(c, http.StatusCreated, "Formulir berhasil dikirim", res)
}

// Upload menangani POST /api/v1/public/upload
func (h *PublicHandler) Upload(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, h.maxUploadByte+(1024*1024))

	file, err := c.FormFile("file")
	if err != nil {
		file, err = c.FormFile("berkas")
	}
	if err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Berkas wajib diunggah", err.Error())
		return
	}

	src, err := file.Open()
	if err != nil {
		Error(c, http.StatusBadRequest, "VALIDATION_ERROR", "Berkas tidak dapat dibaca", nil)
		return
	}
	defer src.Close()

	res, err := h.uploadService.Store(file.Filename, file.Size, src)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrUploadTooLarge):
			Error(c, http.StatusRequestEntityTooLarge, "UPLOAD_TOO_LARGE", service.ErrUploadTooLarge.Error(), nil)
		case errors.Is(err, service.ErrUploadType):
			Error(c, http.StatusUnsupportedMediaType, "UPLOAD_TYPE_NOT_ALLOWED", service.ErrUploadType.Error(), nil)
		case errors.Is(err, service.ErrUploadInvalid):
			Error(c, http.StatusBadRequest, "VALIDATION_ERROR", service.ErrUploadInvalid.Error(), nil)
		default:
			Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Gagal menyimpan berkas", nil)
		}
		return
	}

	Success(c, http.StatusCreated, "Berkas berhasil diunggah", res)
}

func (h *PublicHandler) writeError(c *gin.Context, err error) {
	var closedErr *service.FormClosedError
	var validationErr *service.ValidationError

	switch {
	case errors.Is(err, service.ErrFormNotFound):
		Error(c, http.StatusNotFound, "NOT_FOUND", service.ErrFormNotFound.Error(), nil)
	case errors.As(err, &closedErr):
		Error(c, http.StatusConflict, "FORM_CLOSED", closedErr.Reason, gin.H{"reason": closedErr.Reason})
	case errors.As(err, &validationErr):
		Error(c, http.StatusUnprocessableEntity, "VALIDATION_ERROR", validationErr.Error(), validationErr.Fields)
	case errors.Is(err, service.ErrNIKFieldMissing):
		Error(c, http.StatusUnprocessableEntity, "FORM_CONFIG_ERROR", service.ErrNIKFieldMissing.Error(), nil)
	case errors.Is(err, repository.ErrDuplicateResponse):
		Error(c, http.StatusConflict, "DUPLICATE_RESPONSE", repository.ErrDuplicateResponse.Error(), nil)
	case errors.Is(err, repository.ErrQuotaExceeded):
		Error(c, http.StatusConflict, "QUOTA_EXCEEDED", repository.ErrQuotaExceeded.Error(), nil)
	default:
		Error(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Gagal memproses formulir", nil)
	}
}
