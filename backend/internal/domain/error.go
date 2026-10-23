package domain

import "net/http"

type AppError struct {
	Status  int
	Code    string
	Message string
	Details any
}

func (e *AppError) Error() string {
	return e.Message
}

func NewAppError(status int, code, message string, details any) *AppError {
	return &AppError{
		Status:  status,
		Code:    code,
		Message: message,
		Details: details,
	}
}

func BadRequest(code, message string, details any) *AppError {
	return NewAppError(http.StatusBadRequest, code, message, details)
}

func NotFound(message string) *AppError {
	return NewAppError(http.StatusNotFound, "NOT_FOUND", message, nil)
}

func Conflict(code, message string) *AppError {
	return NewAppError(http.StatusConflict, code, message, nil)
}

func Unprocessable(code, message string, details any) *AppError {
	return NewAppError(http.StatusUnprocessableEntity, code, message, details)
}

func Internal(message string) *AppError {
	return NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", message, nil)
}
