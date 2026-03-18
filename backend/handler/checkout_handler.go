package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/service"
)

type CheckoutHandler struct {
	checkoutService service.CheckoutService
}

type CheckoutRequest struct {
	AddressID      uint   `json:"address_id" binding:"required"`
	CourierName    string `json:"courier_name" binding:"required"`
	CourierService string `json:"courier_service" binding:"required"`
}

type CheckoutResponse struct {
	Data domain.Transaction `json:"data"`
}

type ShippingRatesRequest struct {
	AddressID uint   `json:"address_id" binding:"required"`
	Couriers  string `json:"couriers"`
}

type ShippingRatesResponse struct {
	Data ShippingRatesData `json:"data"`
}

type ShippingRatesData struct {
	AddressID   uint                      `json:"address_id"`
	Subtotal    float64                   `json:"subtotal"`
	TotalWeight int                       `json:"total_weight"`
	Rates       []service.RajaOngkirRate  `json:"rates"`
}

func NewCheckoutHandler(checkoutService service.CheckoutService) *CheckoutHandler {
	return &CheckoutHandler{checkoutService: checkoutService}
}

// GetShippingRates godoc
// @Summary Get available checkout couriers
// @Description Calculate available courier and service options for the authenticated customer's current cart and selected shipping address
// @Tags Checkout
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body handler.ShippingRatesRequest true "Shipping rates payload"
// @Success 200 {object} handler.ShippingRatesResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 404 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/checkout/rates [post]
func (handler *CheckoutHandler) GetShippingRates(context *gin.Context) {
	customerIDValue, ok := context.Get("customer_id")
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	customerID, ok := customerIDValue.(uint)
	if !ok || customerID == 0 {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "invalid customer context"})
		return
	}

	var request ShippingRatesRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		return
	}

	result, err := handler.checkoutService.GetAvailableShippingRates(context.Request.Context(), customerID, service.ShippingRatesRequest{
		AddressID: request.AddressID,
		Couriers:  request.Couriers,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrCheckoutCartEmpty),
			errors.Is(err, service.ErrCheckoutOriginAreaMissing),
			errors.Is(err, service.ErrCheckoutAreaLookupFailed),
			errors.Is(err, service.ErrInvalidShippingRequest):
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		case errors.Is(err, service.ErrCheckoutAddressNotFound):
			context.JSON(http.StatusNotFound, ErrorResponse{Message: err.Error()})
		default:
			context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		}
		return
	}

	context.JSON(http.StatusOK, ShippingRatesResponse{Data: ShippingRatesData{
		AddressID:   result.Address.ID,
		Subtotal:    result.Subtotal,
		TotalWeight: result.TotalWeight,
		Rates:       result.Rates,
	}})
}

// Checkout godoc
// @Summary Checkout current cart
// @Description Validate the authenticated customer's address, cart, shipping rate, and Midtrans payment request, then create a pending transaction and clear the cart
// @Tags Checkout
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body handler.CheckoutRequest true "Checkout payload"
// @Success 201 {object} handler.CheckoutResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 404 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/checkout [post]
func (handler *CheckoutHandler) Checkout(context *gin.Context) {
	customerIDValue, ok := context.Get("customer_id")
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	customerID, ok := customerIDValue.(uint)
	if !ok || customerID == 0 {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "invalid customer context"})
		return
	}

	var request CheckoutRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		return
	}

	transaction, err := handler.checkoutService.Checkout(context.Request.Context(), customerID, service.CheckoutRequest{
		AddressID:      request.AddressID,
		CourierName:    request.CourierName,
		CourierService: request.CourierService,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrCheckoutCartEmpty),
			errors.Is(err, service.ErrCheckoutOriginAreaMissing),
			errors.Is(err, service.ErrCheckoutAreaLookupFailed),
			errors.Is(err, service.ErrCheckoutRateNotFound),
			errors.Is(err, service.ErrInvalidShippingRequest):
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		case errors.Is(err, service.ErrCheckoutAddressNotFound):
			context.JSON(http.StatusNotFound, ErrorResponse{Message: err.Error()})
		default:
			context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		}
		return
	}

	context.JSON(http.StatusCreated, CheckoutResponse{Data: *transaction})
}
