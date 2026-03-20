package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/service"
)

type TransactionHandler struct {
	transactionService service.TransactionHistoryService
}

type TransactionHistoryListResponse struct {
	Data       []TransactionHistoryListItem `json:"data"`
	Pagination TransactionHistoryPagination `json:"pagination"`
}

type TransactionHistoryPagination struct {
	Page       int   `json:"page"`
	Limit      int   `json:"limit"`
	Total      int64 `json:"total"`
	TotalPages int   `json:"total_pages"`
}

type TransactionHistoryListItem struct {
	ID             uint      `json:"id"`
	OrderID        string    `json:"order_id"`
	TotalAmount    float64   `json:"total_amount"`
	ShippingCost   float64   `json:"shipping_cost"`
	Status         string    `json:"status"`
	ShippingStatus string    `json:"shipping_status"`
	CourierName    string    `json:"courier_name"`
	CourierService string    `json:"courier_service"`
	CreatedAt      time.Time `json:"created_at"`
}

type TransactionHistoryDetailResponse struct {
	Data TransactionHistoryDetail `json:"data"`
}

type TransactionTrackingResponse struct {
	Data TransactionTrackingData `json:"data"`
}

type TransactionTrackingData struct {
	OrderID         string                          `json:"order_id"`
	BiteshipOrderID string                          `json:"biteship_order_id,omitempty"`
	TrackingNumber  string                          `json:"tracking_number,omitempty"`
	ShippingStatus  string                          `json:"shipping_status"`
	RawStatus       string                          `json:"raw_status,omitempty"`
	CourierName     string                          `json:"courier_name"`
	CourierService  string                          `json:"courier_service"`
	Events          []service.ShippingTrackingEvent `json:"events,omitempty"`
}

type TransactionHistoryDetail struct {
	ID                uint                             `json:"id"`
	OrderID           string                           `json:"order_id"`
	CustomerID        uint                             `json:"customer_id"`
	ShippingAddressID uint                             `json:"shipping_address_id"`
	TotalAmount       float64                          `json:"total_amount"`
	ShippingCost      float64                          `json:"shipping_cost"`
	Status            string                           `json:"status"`
	ShippingStatus    string                           `json:"shipping_status"`
	CourierName       string                           `json:"courier_name"`
	CourierService    string                           `json:"courier_service"`
	TrackingNumber    string                           `json:"tracking_number,omitempty"`
	SnapToken         string                           `json:"snap_token"`
	CreatedAt         time.Time                        `json:"created_at"`
	UpdatedAt         time.Time                        `json:"updated_at"`
	ShippingAddress   TransactionHistoryAddressSummary `json:"shipping_address"`
	Items             []TransactionHistoryDetailItem   `json:"items"`
}

type TransactionHistoryAddressSummary struct {
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

type TransactionHistoryDetailItem struct {
	ID                uint    `json:"id"`
	ProductID         int     `json:"product_id"`
	SelectedSize      string  `json:"selected_size"`
	SelectedColorName string  `json:"selected_color_name"`
	SelectedColorHex  string  `json:"selected_color_hex,omitempty"`
	Quantity          int     `json:"quantity"`
	Price             float64 `json:"price"`
	Subtotal          float64 `json:"subtotal"`
}

func NewTransactionHandler(transactionService service.TransactionHistoryService) *TransactionHandler {
	return &TransactionHandler{transactionService: transactionService}
}

// GetMyTransactions godoc
// @Summary Get my transaction history
// @Description Get paginated transaction history for the authenticated customer, optionally filtered by payment status
// @Tags Transactions
// @Security BearerAuth
// @Produce json
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Items per page" default(10)
// @Param status query string false "Filter by payment status (pending|paid|failed|refunded)"
// @Success 200 {object} handler.TransactionHistoryListResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/transactions [get]
func (handler *TransactionHandler) GetMyTransactions(context *gin.Context) {
	customerID, ok := getCurrentCustomerID(context)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	page := 1
	if pageQuery := strings.TrimSpace(context.Query("page")); pageQuery != "" {
		parsedPage, err := strconv.Atoi(pageQuery)
		if err != nil {
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: "invalid page query"})
			return
		}
		page = parsedPage
	}

	limit := 10
	if limitQuery := strings.TrimSpace(context.Query("limit")); limitQuery != "" {
		parsedLimit, err := strconv.Atoi(limitQuery)
		if err != nil {
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: "invalid limit query"})
			return
		}
		limit = parsedLimit
	}

	result, err := handler.transactionService.ListMyTransactions(context.Request.Context(), customerID, service.TransactionHistoryQuery{
		Page:   page,
		Limit:  limit,
		Status: strings.TrimSpace(context.Query("status")),
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrTransactionHistoryInvalidQuery):
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		default:
			context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		}
		return
	}

	responseItems := make([]TransactionHistoryListItem, 0, len(result.Items))
	for _, item := range result.Items {
		responseItems = append(responseItems, TransactionHistoryListItem{
			ID:             item.ID,
			OrderID:        item.OrderID,
			TotalAmount:    item.TotalAmount,
			ShippingCost:   item.ShippingCost,
			Status:         item.Status,
			ShippingStatus: item.ShippingStatus,
			CourierName:    item.CourierName,
			CourierService: item.CourierService,
			CreatedAt:      item.CreatedAt,
		})
	}

	context.JSON(http.StatusOK, TransactionHistoryListResponse{
		Data: responseItems,
		Pagination: TransactionHistoryPagination{
			Page:       result.Page,
			Limit:      result.Limit,
			Total:      result.Total,
			TotalPages: result.TotalPages,
		},
	})
}

// GetMyTransactionDetail godoc
// @Summary Get my transaction detail
// @Description Get one transaction detail by order id for the authenticated customer
// @Tags Transactions
// @Security BearerAuth
// @Produce json
// @Param order_id path string true "Order ID"
// @Success 200 {object} handler.TransactionHistoryDetailResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 404 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/transactions/{order_id} [get]
func (handler *TransactionHandler) GetMyTransactionDetail(context *gin.Context) {
	customerID, ok := getCurrentCustomerID(context)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	orderID := strings.TrimSpace(context.Param("order_id"))
	if orderID == "" {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: "invalid order id"})
		return
	}

	result, err := handler.transactionService.GetMyTransactionByOrderID(context.Request.Context(), customerID, orderID)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrTransactionHistoryInvalidQuery):
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		case errors.Is(err, service.ErrTransactionNotFound):
			context.JSON(http.StatusNotFound, ErrorResponse{Message: err.Error()})
		default:
			context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		}
		return
	}

	responseItems := make([]TransactionHistoryDetailItem, 0, len(result.Items))
	for _, item := range result.Items {
		responseItems = append(responseItems, TransactionHistoryDetailItem{
			ID:                item.ID,
			ProductID:         item.ProductID,
			SelectedSize:      item.SelectedSize,
			SelectedColorName: item.SelectedColorName,
			SelectedColorHex:  item.SelectedColorHex,
			Quantity:          item.Quantity,
			Price:             item.Price,
			Subtotal:          item.Subtotal,
		})
	}

	context.JSON(http.StatusOK, TransactionHistoryDetailResponse{Data: TransactionHistoryDetail{
		ID:                result.ID,
		OrderID:           result.OrderID,
		CustomerID:        result.CustomerID,
		ShippingAddressID: result.ShippingAddressID,
		TotalAmount:       result.TotalAmount,
		ShippingCost:      result.ShippingCost,
		Status:            result.Status,
		ShippingStatus:    result.ShippingStatus,
		CourierName:       result.CourierName,
		CourierService:    result.CourierService,
		TrackingNumber:    result.TrackingNumber,
		SnapToken:         result.SnapToken,
		CreatedAt:         result.CreatedAt,
		UpdatedAt:         result.UpdatedAt,
		ShippingAddress: TransactionHistoryAddressSummary{
			ID:                   result.ShippingAddress.ID,
			Title:                result.ShippingAddress.Title,
			RecipientName:        result.ShippingAddress.RecipientName,
			PhoneNumber:          result.ShippingAddress.PhoneNumber,
			Province:             result.ShippingAddress.Province,
			City:                 result.ShippingAddress.City,
			District:             result.ShippingAddress.District,
			Village:              result.ShippingAddress.Village,
			PostalCode:           result.ShippingAddress.PostalCode,
			FullAddress:          result.ShippingAddress.FullAddress,
			Latitude:             result.ShippingAddress.Latitude,
			Longitude:            result.ShippingAddress.Longitude,
			DestinationAreaID:    result.ShippingAddress.DestinationAreaID,
			DestinationAreaLabel: result.ShippingAddress.DestinationAreaLabel,
			IsPrimary:            result.ShippingAddress.IsPrimary,
		},
		Items: responseItems,
	}})
}

// GetMyTransactionTracking godoc
// @Summary Get my transaction tracking
// @Description Get current shipping tracking data for a paid transaction. By default data is served from local transaction state; use refresh=true to fetch latest status and events from Biteship API.
// @Tags Transactions
// @Security BearerAuth
// @Produce json
// @Param order_id path string true "Order ID"
// @Param refresh query bool false "Refresh tracking from Biteship"
// @Success 200 {object} handler.TransactionTrackingResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 404 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/transactions/{order_id}/tracking [get]
func (handler *TransactionHandler) GetMyTransactionTracking(context *gin.Context) {
	customerID, ok := getCurrentCustomerID(context)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	orderID := strings.TrimSpace(context.Param("order_id"))
	if orderID == "" {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: "invalid order id"})
		return
	}

	refresh := strings.EqualFold(strings.TrimSpace(context.Query("refresh")), "true")

	result, err := handler.transactionService.GetMyTransactionTracking(context.Request.Context(), customerID, orderID, refresh)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrTransactionHistoryInvalidQuery),
			errors.Is(err, service.ErrTransactionTrackingUnavailable):
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		case errors.Is(err, service.ErrTransactionNotFound):
			context.JSON(http.StatusNotFound, ErrorResponse{Message: err.Error()})
		default:
			context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		}
		return
	}

	context.JSON(http.StatusOK, TransactionTrackingResponse{Data: TransactionTrackingData{
		OrderID:         result.OrderID,
		BiteshipOrderID: result.BiteshipOrderID,
		TrackingNumber:  result.TrackingNumber,
		ShippingStatus:  result.ShippingStatus,
		RawStatus:       result.RawStatus,
		CourierName:     result.CourierName,
		CourierService:  result.CourierService,
		Events:          result.Events,
	}})
}
