package handler

import "github.com/gin-gonic/gin"

// APIError merepresentasikan objek error terstruktur pada envelope respon.
type APIError struct {
	Code    string      `json:"code"`
	Details interface{} `json:"details,omitempty"`
}

// Success mengirim respon sukses dengan envelope standar API v1.
func Success(c *gin.Context, status int, message string, data interface{}) {
	c.JSON(status, gin.H{
		"success": true,
		"message": message,
		"data":    data,
	})
}

// Error mengirim respon gagal dengan envelope standar API v1.
func Error(c *gin.Context, status int, code string, message string, details interface{}) {
	c.JSON(status, gin.H{
		"success": false,
		"message": message,
		"error": APIError{
			Code:    code,
			Details: details,
		},
	})
}
