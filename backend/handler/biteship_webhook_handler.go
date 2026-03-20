package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/service"
)

type BiteshipWebhookHandler struct {
	webhookService service.BiteshipWebhookService
}

func NewBiteshipWebhookHandler(webhookService service.BiteshipWebhookService) *BiteshipWebhookHandler {
	return &BiteshipWebhookHandler{webhookService: webhookService}
}

// ReceiveNotification godoc
// @Summary Receive Biteship shipping webhook
// @Description Receive Biteship shipping webhook events and sync shipping status/tracking by Biteship order id. Empty body probe requests are acknowledged with 200 for webhook installation checks.
// @Tags Payments
// @Accept json
// @Produce json
// @Param X-Biteship-Webhook-Secret header string false "Webhook secret (preferred header for real events)"
// @Param X-Webhook-Secret header string false "Webhook secret (fallback header for compatibility)"
// @Param token query string false "Webhook token passed in callback URL when custom headers are unavailable"
// @Param payload body map[string]interface{} false "Biteship webhook payload; may be empty for installation probe"
// @Success 200 {object} handler.StatusResponse "notification processed | notification ignored | notification probe acknowledged"
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/payments/biteship/notification [post]
func (handler *BiteshipWebhookHandler) ReceiveNotification(context *gin.Context) {
	rawPayload, err := io.ReadAll(context.Request.Body)
	if err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: "invalid request body"})
		return
	}

	trimmedPayload := bytes.TrimSpace(rawPayload)
	if len(trimmedPayload) == 0 {
		context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "notification probe acknowledged"})
		return
	}

	var payload map[string]any
	if err := json.Unmarshal(trimmedPayload, &payload); err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: "invalid json payload"})
		return
	}
	if len(payload) == 0 {
		context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "notification probe acknowledged"})
		return
	}

	providedSecret := strings.TrimSpace(context.GetHeader("X-Biteship-Webhook-Secret"))
	if providedSecret == "" {
		providedSecret = strings.TrimSpace(context.GetHeader("X-Webhook-Secret"))
	}
	providedToken := strings.TrimSpace(context.Query("token"))

	err = handler.webhookService.HandleNotification(context.Request.Context(), providedSecret, providedToken, payload)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrBiteshipWebhookUnauthorized):
			context.JSON(http.StatusUnauthorized, ErrorResponse{Message: err.Error()})
		case errors.Is(err, service.ErrBiteshipWebhookInvalidBody):
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		case errors.Is(err, service.ErrBiteshipWebhookOrderMissing):
			context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "notification ignored"})
		default:
			context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		}
		return
	}

	context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "notification processed"})
}
