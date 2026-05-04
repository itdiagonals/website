package apperror

import "fmt"

// AppError represents a domain/application error with an associated HTTP status code.
type AppError struct {
	Code       string
	Message    string
	StatusCode int
	Err        error
}

func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("[%s] %s: %v", e.Code, e.Message, e.Err)
	}
	return fmt.Sprintf("[%s] %s", e.Code, e.Message)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

// Common error codes
const (
	CodeNotFound            = "NOT_FOUND"
	CodeBadRequest          = "BAD_REQUEST"
	CodeUnauthorized        = "UNAUTHORIZED"
	CodeForbidden           = "FORBIDDEN"
	CodeConflict            = "CONFLICT"
	CodeInternal            = "INTERNAL_ERROR"
	CodeValidation          = "VALIDATION_ERROR"
	CodeDatabase            = "DATABASE_ERROR"
	CodeExternalService     = "EXTERNAL_SERVICE_ERROR"
)

// Predefined errors
var (
	ErrNotFound     = New(CodeNotFound, "resource not found", 404, nil)
	ErrUnauthorized = New(CodeUnauthorized, "unauthorized", 401, nil)
	ErrForbidden    = New(CodeForbidden, "forbidden", 403, nil)
	ErrBadRequest   = New(CodeBadRequest, "bad request", 400, nil)
	ErrConflict     = New(CodeConflict, "resource conflict", 409, nil)
	ErrInternal     = New(CodeInternal, "internal server error", 500, nil)
)

// New creates a new AppError.
func New(code, message string, status int, err error) *AppError {
	return &AppError{
		Code:       code,
		Message:    message,
		StatusCode: status,
		Err:        err,
	}
}

// WithMessage returns a copy of the error with a new message.
func (e *AppError) WithMessage(msg string) *AppError {
	return &AppError{
		Code:       e.Code,
		Message:    msg,
		StatusCode: e.StatusCode,
		Err:        e.Err,
	}
}

// Wrap wraps an existing error into an AppError.
func Wrap(err error, code, message string, status int) *AppError {
	if err == nil {
		return nil
	}
	if appErr, ok := err.(*AppError); ok {
		return &AppError{
			Code:       appErr.Code,
			Message:    message,
			StatusCode: appErr.StatusCode,
			Err:        appErr,
		}
	}
	return New(code, message, status, err)
}

// IsNotFound checks if error is a NOT_FOUND error.
func IsNotFound(err error) bool {
	if appErr, ok := err.(*AppError); ok {
		return appErr.Code == CodeNotFound
	}
	return false
}

// IsValidation checks if error is a VALIDATION error.
func IsValidation(err error) bool {
	if appErr, ok := err.(*AppError); ok {
		return appErr.Code == CodeValidation
	}
	return false
}

// IsConflict checks if error is a CONFLICT error.
func IsConflict(err error) bool {
	if appErr, ok := err.(*AppError); ok {
		return appErr.Code == CodeConflict
	}
	return false
}
