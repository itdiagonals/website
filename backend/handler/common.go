package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/pkg/logger"
)

type ErrorResponse struct {
	Message string `json:"message"`
}

// internalError logs the real error server-side and returns a generic body,
// so internal/upstream error detail (DB, Midtrans, Biteship) never leaks to
// clients. event should identify the call site, e.g. "handler.cart.add".
func internalError(c *gin.Context, event string, err error) {
	logger.Error(event, "error", err.Error())
	c.JSON(http.StatusInternalServerError, ErrorResponse{Message: "internal server error"})
}
