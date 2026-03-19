package handler

import (
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/service"
)

type MidtransNotificationHandler struct {
	notificationService service.MidtransNotificationService
}

type MidtransNotificationRequest struct {
	OrderID           string `json:"order_id" binding:"required"`
	StatusCode        string `json:"status_code" binding:"required"`
	GrossAmount       string `json:"gross_amount" binding:"required"`
	SignatureKey      string `json:"signature_key" binding:"required"`
	TransactionStatus string `json:"transaction_status" binding:"required"`
	FraudStatus       string `json:"fraud_status"`
	TransactionID     string `json:"transaction_id"`
	PaymentType       string `json:"payment_type"`
}

func NewMidtransNotificationHandler(notificationService service.MidtransNotificationService) *MidtransNotificationHandler {
	return &MidtransNotificationHandler{notificationService: notificationService}
}

// ReceiveNotification godoc
// @Summary Receive Midtrans payment notification
// @Description Verify Midtrans signature and update transaction payment status by order id
// @Tags Payments
// @Accept json
// @Produce json
// @Param payload body handler.MidtransNotificationRequest true "Midtrans notification payload"
// @Success 200 {object} handler.StatusResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/payments/midtrans/notification [post]
func (handler *MidtransNotificationHandler) ReceiveNotification(context *gin.Context) {
	var request MidtransNotificationRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		return
	}

	err := handler.notificationService.HandleNotification(context.Request.Context(), service.MidtransNotification{
		OrderID:           strings.TrimSpace(request.OrderID),
		StatusCode:        strings.TrimSpace(request.StatusCode),
		GrossAmount:       strings.TrimSpace(request.GrossAmount),
		SignatureKey:      strings.TrimSpace(request.SignatureKey),
		TransactionStatus: strings.TrimSpace(request.TransactionStatus),
		FraudStatus:       strings.TrimSpace(request.FraudStatus),
		TransactionID:     strings.TrimSpace(request.TransactionID),
		PaymentType:       strings.TrimSpace(request.PaymentType),
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrMidtransInvalidPayload), errors.Is(err, service.ErrMidtransUnknownStatus), errors.Is(err, service.ErrMidtransAmountMismatch):
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		case errors.Is(err, service.ErrMidtransInvalidSignature):
			context.JSON(http.StatusUnauthorized, ErrorResponse{Message: err.Error()})
		case errors.Is(err, service.ErrMidtransOrderNotFound):
			// Return 200 to avoid unnecessary Midtrans retries for unknown/obsolete orders.
			context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "notification ignored"})
		default:
			context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		}
		return
	}

	context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "notification processed"})
}
