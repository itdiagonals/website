package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/service"
)

type AdminShipmentHandler struct {
	bookingService service.ShippingBookingService
}

type BookShipmentRequest struct {
	OrderID string `json:"order_id" binding:"required"`
}

type BookShipmentResponse struct {
	Message string `json:"message"`
}

func NewAdminShipmentHandler(bookingService service.ShippingBookingService) *AdminShipmentHandler {
	return &AdminShipmentHandler{bookingService: bookingService}
}

func (h *AdminShipmentHandler) BookShipment(c *gin.Context) {
	var req BookShipmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Message: "invalid request: " + err.Error()})
		return
	}

	orderID := strings.TrimSpace(req.OrderID)
	if orderID == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Message: "order_id is required"})
		return
	}

	if err := h.bookingService.BookShipmentForOrder(c.Request.Context(), orderID); err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Message: "failed to book shipment: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, BookShipmentResponse{Message: "shipment booked successfully"})
}
