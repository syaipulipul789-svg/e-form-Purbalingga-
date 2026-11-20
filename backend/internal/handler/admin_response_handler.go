package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/purbalinggakab/e-form-purbalingga/internal/middleware"
	"github.com/purbalinggakab/e-form-purbalingga/internal/service"
)

type AdminResponseHandler struct {
	service service.AdminResponseService
}

type verificationRequest struct {
	Status string `json:"status"`
	Note   string `json:"note"`
}

type responsePageMeta struct {
	PageMeta
	Summary any `json:"summary"`
}

func NewAdminResponseHandler(service service.AdminResponseService) *AdminResponseHandler {
	return &AdminResponseHandler{service: service}
}

func (h *AdminResponseHandler) List(c *gin.Context) {
	formID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}
	page, limit := parsePagination(c)
	dateFrom, dateTo, ok := parseDateRange(c)
	if !ok {
		return
	}

	items, total, summary, err := h.service.List(c.Request.Context(), middleware.CurrentUser(c), formID, service.ResponseListParams{
		Page:               page,
		Limit:              limit,
		Search:             c.Query("search"),
		VerificationStatus: c.Query("verification_status"),
		KodeKec:            c.Query("kode_kec"),
		DateFrom:           dateFrom,
		DateTo:             dateTo,
	})
	if err != nil {
		respondError(c, err)
		return
	}

	meta := responsePageMeta{PageMeta: pageMeta(page, limit, total), Summary: summary}
	respondList(c, "Daftar respons berhasil dimuat", items, meta)
}

func (h *AdminResponseHandler) Get(c *gin.Context) {
	formID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}
	responseID, ok := parseUUIDParam(c, "responseId")
	if !ok {
		return
	}

	response, err := h.service.Get(c.Request.Context(), middleware.CurrentUser(c), formID, responseID)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, "Detail respons berhasil dimuat", response)
}

func (h *AdminResponseHandler) UpdateVerification(c *gin.Context) {
	formID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}
	responseID, ok := parseUUIDParam(c, "responseId")
	if !ok {
		return
	}
	var req verificationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Payload verifikasi tidak valid",
			"error":   gin.H{"code": "INVALID_PAYLOAD"},
		})
		return
	}

	response, err := h.service.UpdateVerification(c.Request.Context(), middleware.CurrentUser(c), formID, responseID, req.Status, req.Note)
	if err != nil {
		respondError(c, err)
		return
	}
	respondSuccess(c, "Status verifikasi berhasil diperbarui", response)
}

func (h *AdminResponseHandler) Export(c *gin.Context) {
	formID, ok := parseUUIDParam(c, "id")
	if !ok {
		return
	}
	dateFrom, dateTo, ok := parseDateRange(c)
	if !ok {
		return
	}

	filename, contentType, content, err := h.service.Export(c.Request.Context(), middleware.CurrentUser(c), formID, c.DefaultQuery("format", "xlsx"), service.ResponseListParams{
		Search:             c.Query("search"),
		VerificationStatus: c.Query("verification_status"),
		KodeKec:            c.Query("kode_kec"),
		DateFrom:           dateFrom,
		DateTo:             dateTo,
	})
	if err != nil {
		respondError(c, err)
		return
	}

	c.Header("Content-Disposition", `attachment; filename="`+filename+`"`)
	c.Data(http.StatusOK, contentType, content)
}

func parseDateRange(c *gin.Context) (*time.Time, *time.Time, bool) {
	from, ok := parseDateValue(c.Query("date_from"))
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Parameter date_from tidak valid",
			"error":   gin.H{"code": "INVALID_DATE"},
		})
		return nil, nil, false
	}
	to, ok := parseDateValue(c.Query("date_to"))
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"message": "Parameter date_to tidak valid",
			"error":   gin.H{"code": "INVALID_DATE"},
		})
		return nil, nil, false
	}
	if to != nil && !strings.Contains(c.Query("date_to"), "T") {
		endOfDay := to.Add(24*time.Hour - time.Nanosecond)
		to = &endOfDay
	}
	return from, to, true
}

func parseDateValue(raw string) (*time.Time, bool) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return nil, true
	}
	if parsed, err := time.Parse(time.RFC3339, raw); err == nil {
		return &parsed, true
	}
	if parsed, err := time.Parse("2006-01-02", raw); err == nil {
		return &parsed, true
	}
	return nil, false
}

