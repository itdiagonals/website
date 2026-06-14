package handler

import (
	"errors"
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

type PackShipmentRequest struct {
	OrderID string `json:"order_id" binding:"required"`
}

type PackShipmentResponse struct {
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
		if errors.Is(err, service.ErrShippingOrderNotPaid) || errors.Is(err, service.ErrShippingOrderAlreadyBooked) || errors.Is(err, service.ErrShippingOrderInvalidState) || errors.Is(err, service.ErrMidtransOrderNotFound) {
			c.JSON(http.StatusBadRequest, ErrorResponse{Message: "failed to book shipment: " + err.Error()})
			return
		}
		internalError(c, "handler.admin_shipment.book", err)
		return
	}

	c.JSON(http.StatusOK, BookShipmentResponse{Message: "shipment booked successfully"})
}

func (h *AdminShipmentHandler) MarkPacked(c *gin.Context) {
	var req PackShipmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, ErrorResponse{Message: "invalid request: " + err.Error()})
		return
	}

	orderID := strings.TrimSpace(req.OrderID)
	if orderID == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Message: "order_id is required"})
		return
	}

	if err := h.bookingService.MarkOrderPacked(c.Request.Context(), orderID); err != nil {
		if errors.Is(err, service.ErrShippingOrderNotPaid) || errors.Is(err, service.ErrShippingOrderAlreadyBooked) || errors.Is(err, service.ErrShippingOrderInvalidState) || errors.Is(err, service.ErrMidtransOrderNotFound) {
			c.JSON(http.StatusBadRequest, ErrorResponse{Message: "failed to mark packed: " + err.Error()})
			return
		}
		internalError(c, "handler.admin_shipment.mark_packed", err)
		return
	}

	c.JSON(http.StatusOK, PackShipmentResponse{Message: "order marked as packed"})
}
