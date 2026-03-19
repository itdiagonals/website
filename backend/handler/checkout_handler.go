package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/service"
)

type CheckoutHandler struct {
	checkoutService service.CheckoutService
}

type CheckoutRequest struct {
	AddressID           uint   `json:"address_id" binding:"required"`
	CourierName         string `json:"courier_name" binding:"required"`
	CourierService      string `json:"courier_service" binding:"required"`
	SelectedCartItemIDs []uint `json:"selected_cart_item_ids" binding:"required,min=1,dive,gt=0"`
}

type CheckoutResponse struct {
	Data CheckoutData `json:"data"`
}

type CheckoutData struct {
	ID                uint                   `json:"id"`
	OrderID           string                 `json:"order_id"`
	CustomerID        uint                   `json:"customer_id"`
	ShippingAddressID uint                   `json:"shipping_address_id"`
	TotalAmount       float64                `json:"total_amount"`
	ShippingCost      float64                `json:"shipping_cost"`
	CourierName       string                 `json:"courier_name"`
	CourierService    string                 `json:"courier_service"`
	TrackingNumber    string                 `json:"tracking_number,omitempty"`
	Status            string                 `json:"status"`
	ShippingStatus    string                 `json:"shipping_status"`
	SnapToken         string                 `json:"snap_token"`
	CreatedAt         time.Time              `json:"created_at"`
	UpdatedAt         time.Time              `json:"updated_at"`
	ShippingAddress   CheckoutAddressSummary `json:"shipping_address"`
}

type CheckoutAddressSummary struct {
	ID                   uint     `json:"id"`
	Title                string   `json:"title"`
	RecipientName        string   `json:"recipient_name"`
	PhoneNumber          string   `json:"phone_number"`
	Province             string   `json:"province"`
	City                 string   `json:"city"`
	District             string   `json:"district"`
	Village              string   `json:"village"`
	PostalCode           string   `json:"postal_code"`
	FullAddress          string   `json:"full_address"`
	Latitude             *float64 `json:"latitude,omitempty"`
	Longitude            *float64 `json:"longitude,omitempty"`
	DestinationAreaID    string   `json:"destination_area_id,omitempty"`
	DestinationAreaLabel string   `json:"destination_area_label,omitempty"`
	IsPrimary            bool     `json:"is_primary"`
}

type ShippingRatesRequest struct {
	AddressID           uint   `json:"address_id" binding:"required"`
	Couriers            string `json:"couriers"`
	SelectedCartItemIDs []uint `json:"selected_cart_item_ids" binding:"required,min=1,dive,gt=0"`
}

type ShippingRatesResponse struct {
	Data ShippingRatesData `json:"data"`
}

type ShippingRatesData struct {
	AddressID   uint                   `json:"address_id"`
	Subtotal    float64                `json:"subtotal"`
	TotalWeight int                    `json:"total_weight"`
	Rates       []service.ShippingRate `json:"rates"`
}

func NewCheckoutHandler(checkoutService service.CheckoutService) *CheckoutHandler {
	return &CheckoutHandler{checkoutService: checkoutService}
}

// GetShippingRates godoc
// @Summary Get available checkout couriers
// @Description Calculate available courier and service options for the authenticated customer's selected cart items and shipping address
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
		AddressID:           request.AddressID,
		Couriers:            request.Couriers,
		SelectedCartItemIDs: request.SelectedCartItemIDs,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrCheckoutCartEmpty),
			errors.Is(err, service.ErrCheckoutSelectedItemsEmpty),
			errors.Is(err, service.ErrCheckoutSelectedItemNotFound),
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
// @Description Validate the authenticated customer's address, selected cart items, shipping rate, and Midtrans payment request, then create a pending transaction and remove only the selected items from cart
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
		AddressID:           request.AddressID,
		CourierName:         request.CourierName,
		CourierService:      request.CourierService,
		SelectedCartItemIDs: request.SelectedCartItemIDs,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrCheckoutCartEmpty),
			errors.Is(err, service.ErrCheckoutSelectedItemsEmpty),
			errors.Is(err, service.ErrCheckoutSelectedItemNotFound),
			errors.Is(err, service.ErrCheckoutInsufficientStock),
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

	context.JSON(http.StatusCreated, CheckoutResponse{Data: toCheckoutData(transaction)})
}

func toCheckoutData(transaction *domain.Transaction) CheckoutData {
	if transaction == nil {
		return CheckoutData{}
	}

	return CheckoutData{
		ID:                transaction.ID,
		OrderID:           transaction.OrderID,
		CustomerID:        transaction.CustomerID,
		ShippingAddressID: transaction.ShippingAddressID,
		TotalAmount:       transaction.TotalAmount,
		ShippingCost:      transaction.ShippingCost,
		CourierName:       transaction.CourierName,
		CourierService:    transaction.CourierService,
		TrackingNumber:    transaction.TrackingNumber,
		Status:            transaction.Status,
		ShippingStatus:    transaction.ShippingStatus,
		SnapToken:         transaction.SnapToken,
		CreatedAt:         transaction.CreatedAt,
		UpdatedAt:         transaction.UpdatedAt,
		ShippingAddress: CheckoutAddressSummary{
			ID:                   transaction.ShippingAddress.ID,
			Title:                transaction.ShippingAddress.Title,
			RecipientName:        transaction.ShippingAddress.RecipientName,
			PhoneNumber:          transaction.ShippingAddress.PhoneNumber,
			Province:             transaction.ShippingAddress.Province,
			City:                 transaction.ShippingAddress.City,
			District:             transaction.ShippingAddress.District,
			Village:              transaction.ShippingAddress.Village,
			PostalCode:           transaction.ShippingAddress.PostalCode,
			FullAddress:          transaction.ShippingAddress.FullAddress,
			Latitude:             transaction.ShippingAddress.Latitude,
			Longitude:            transaction.ShippingAddress.Longitude,
			DestinationAreaID:    transaction.ShippingAddress.DestinationAreaID,
			DestinationAreaLabel: transaction.ShippingAddress.DestinationAreaLabel,
			IsPrimary:            transaction.ShippingAddress.IsPrimary,
		},
	}
}
