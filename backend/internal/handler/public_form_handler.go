package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

type PublicFormHandler struct {
	service service.PublicFormService
}

type submitRequest struct {
	RespondentNIK string          `json:"respondent_nik"`
	Answers       json.RawMessage `json:"answers"`
}

func NewPublicFormHandler(service service.PublicFormService) *PublicFormHandler {
	return &PublicFormHandler{service: service}
}

func (h *PublicFormHandler) List(c *gin.Context) {
	forms, err := h.service.ListPublicForms(c.Request.Context())
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Daftar formulir publik berhasil dimuat",
		"data":    forms,
	})
}

func (h *PublicFormHandler) GetForm(c *gin.Context) {
	form, err := h.service.GetPublicForm(c.Request.Context(), c.Param("slug"))
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Formulir berhasil dimuat",
		"data":    form,
	})
}

func (h *PublicFormHandler) Submit(c *gin.Context) {
	var req submitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Payload isian formulir tidak valid",
			"error": gin.H{
				"code": "INVALID_PAYLOAD",
			},
		})
		return
	}

	idempotencyKey := strings.TrimSpace(c.GetHeader("Idempotency-Key"))
	if len(idempotencyKey) > 100 {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Idempotency-Key maksimal 100 karakter",
			"error": gin.H{
				"code": "INVALID_IDEMPOTENCY_KEY",
			},
		})
		return
	}

	result, err := h.service.SubmitResponse(c.Request.Context(), c.Param("slug"), idempotencyKey, service.SubmitInput{
		RespondentNIK: req.RespondentNIK,
		Answers:       req.Answers,
		IPAddress:     c.ClientIP(),
		UserAgent:     c.Request.UserAgent(),
	})
	if err != nil {
		respondError(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": "Formulir berhasil terkirim",
		"data":    result,
	})
}
