package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/purbalinggakab/e-form-purbalingga/internal/domain"
)

type PageMeta struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

func respondSuccess(c *gin.Context, message string, data any) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": message,
		"data":    data,
	})
}

func respondCreated(c *gin.Context, message string, data any) {
	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"message": message,
		"data":    data,
	})
}

func respondList(c *gin.Context, message string, data any, meta any) {
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": message,
		"data":    data,
		"meta":    meta,
	})
}

func respondError(c *gin.Context, err error) {
	var appErr *domain.AppError
	if errors.As(err, &appErr) {
		errorBody := gin.H{"code": appErr.Code}
		if appErr.Details != nil {
			errorBody["details"] = appErr.Details
		}
		c.JSON(appErr.Status, gin.H{
			"success": false,
			"message": appErr.Message,
			"error":   errorBody,
		})
		return
	}

	c.JSON(http.StatusInternalServerError, gin.H{
		"success": false,
		"message": "Terjadi kesalahan pada server",
		"error": gin.H{
			"code": "INTERNAL_ERROR",
		},
	})
}

func parsePagination(c *gin.Context) (int, int) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	return page, limit
}

func pageMeta(page, limit, total int) PageMeta {
	totalPages := 0
	if limit > 0 {
		totalPages = (total + limit - 1) / limit
	}
	return PageMeta{Page: page, Limit: limit, Total: total, TotalPages: totalPages}
}
