package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

const maxMultipartRequestBytes int64 = 6 * 1024 * 1024

type UploadHandler struct {
	service service.UploadService
}

func NewUploadHandler(service service.UploadService) *UploadHandler {
	return &UploadHandler{service: service}
}

func (h *UploadHandler) Upload(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxMultipartRequestBytes)

	fileHeader, err := c.FormFile("file")
	if err != nil {
		var maxBytesErr *http.MaxBytesError
		if errors.As(err, &maxBytesErr) {
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{
				"success": false,
				"message": "Ukuran berkas maksimal 5 MB",
				"error": gin.H{
					"code": "FILE_TOO_LARGE",
				},
			})
			return
		}
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Berkas wajib diunggah pada field 'file'",
			"error": gin.H{
				"code": "FILE_REQUIRED",
			},
		})
		return
	}

	result, err := h.service.Save(fileHeader)
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Berkas berhasil diunggah",
		"data":    result,
	})
}
