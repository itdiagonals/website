package response

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/pkg/apperror"
)

type Response[T any] struct {
	Success bool   `json:"success"`
	Code    string `json:"code"`
	Message string `json:"message,omitempty"`
	Data    T      `json:"data,omitempty"`
}

type ListMeta struct {
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	Total      int `json:"total"`
	TotalPages int `json:"total_pages"`
}

type ListResponse[T any] struct {
	Success bool     `json:"success"`
	Code    string   `json:"code"`
	Message string   `json:"message,omitempty"`
	Data    []T      `json:"data"`
	Meta    ListMeta `json:"meta"`
}

func OK[T any](c *gin.Context, data T) {
	c.JSON(http.StatusOK, Response[T]{
		Success: true,
		Code:    "OK",
		Data:    data,
	})
}

func Created[T any](c *gin.Context, data T) {
	c.JSON(http.StatusCreated, Response[T]{
		Success: true,
		Code:    "CREATED",
		Data:    data,
	})
}

func NoContent(c *gin.Context) {
	c.Status(http.StatusNoContent)
}

func List[T any](c *gin.Context, data []T, page, limit, total int) {
	totalPages := 0
	if limit > 0 {
		totalPages = (total + limit - 1) / limit
	}
	c.JSON(http.StatusOK, ListResponse[T]{
		Success: true,
		Code:    "OK",
		Data:    data,
		Meta: ListMeta{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}

func Error(c *gin.Context, statusCode int, code, message string) {
	c.JSON(statusCode, Response[any]{
		Success: false,
		Code:    code,
		Message: message,
	})
}

func FromError(c *gin.Context, err error) {
	if err == nil {
		return
	}

	if ae, ok := err.(*apperror.AppError); ok {
		c.JSON(ae.StatusCode, Response[any]{
			Success: false,
			Code:    ae.Code,
			Message: ae.Message,
		})
		return
	}

	c.JSON(http.StatusInternalServerError, Response[any]{
		Success: false,
		Code:    apperror.CodeInternal,
		Message: err.Error(),
	})
}
