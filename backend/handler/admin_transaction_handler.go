package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/config"
	"github.com/itdiagonals/website/backend/repository"
	"gorm.io/gorm"
)

type AdminTransactionHandler struct {
	transactionRepository repository.TransactionRepository
}

type AdminTransactionListItem struct {
	ID                uint    `json:"id"`
	OrderID           string  `json:"order_id"`
	CustomerID        string  `json:"customer_id"`
	TotalAmount       float64 `json:"total_amount"`
	ShippingCost      float64 `json:"shipping_cost"`
	Status            string  `json:"status"`
	ShippingStatus    string  `json:"shipping_status"`
	CourierName       string  `json:"courier_name"`
	CourierService    string  `json:"courier_service"`
	TrackingNumber    string  `json:"tracking_number,omitempty"`
	CreatedAt         string  `json:"created_at"`
	UpdatedAt         string  `json:"updated_at"`
}

type AdminTransactionListResponse struct {
	Data       []AdminTransactionListItem `json:"data"`
	Pagination TransactionHistoryPagination `json:"pagination"`
}

func NewAdminTransactionHandler(transactionRepository repository.TransactionRepository) *AdminTransactionHandler {
	return &AdminTransactionHandler{transactionRepository: transactionRepository}
}

func (h *AdminTransactionHandler) ListTransactions(c *gin.Context) {
	page := 1
	if pageQuery := strings.TrimSpace(c.Query("page")); pageQuery != "" {
		parsedPage, err := strconv.Atoi(pageQuery)
		if err == nil && parsedPage > 0 {
			page = parsedPage
		}
	}

	limit := 50
	if limitQuery := strings.TrimSpace(c.Query("limit")); limitQuery != "" {
		parsedLimit, err := strconv.Atoi(limitQuery)
		if err == nil && parsedLimit > 0 && parsedLimit <= 100 {
			limit = parsedLimit
		}
	}

	status := strings.TrimSpace(c.Query("status"))

	total, err := h.transactionRepository.CountAll(c.Request.Context(), status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Message: "failed to count transactions"})
		return
	}

	transactions, err := h.transactionRepository.FindAllPaginated(c.Request.Context(), page, limit, status)
	if err != nil {
		c.JSON(http.StatusInternalServerError, ErrorResponse{Message: "failed to fetch transactions"})
		return
	}

	items := make([]AdminTransactionListItem, 0, len(transactions))
	for _, tx := range transactions {
		items = append(items, AdminTransactionListItem{
			ID:             tx.ID,
			OrderID:        tx.OrderID,
			CustomerID:     tx.UserID,
			TotalAmount:    tx.TotalAmount,
			ShippingCost:   tx.ShippingCost,
			Status:         tx.Status,
			ShippingStatus: tx.ShippingStatus,
			CourierName:    tx.CourierName,
			CourierService: tx.CourierService,
			TrackingNumber: tx.TrackingNumber,
			CreatedAt:      tx.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt:      tx.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}

	totalPages := 0
	if total > 0 {
		totalPages = int((total + int64(limit) - 1) / int64(limit))
	}

	c.JSON(http.StatusOK, AdminTransactionListResponse{
		Data: items,
		Pagination: TransactionHistoryPagination{
			Page:       page,
			Limit:      limit,
			Total:      total,
			TotalPages: totalPages,
		},
	})
}

func (h *AdminTransactionHandler) GetTransactionDetail(c *gin.Context) {
	orderID := strings.TrimSpace(c.Param("order_id"))
	if orderID == "" {
		c.JSON(http.StatusBadRequest, ErrorResponse{Message: "invalid order id"})
		return
	}

	tx, err := h.transactionRepository.FindByOrderIDWithDetails(c.Request.Context(), orderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, ErrorResponse{Message: "transaction not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, ErrorResponse{Message: "failed to fetch transaction"})
		return
	}

	responseItems := make([]TransactionHistoryDetailItem, 0, len(tx.Items))
	for _, item := range tx.Items {
		responseItems = append(responseItems, TransactionHistoryDetailItem{
			ID:                item.ID,
			ProductID:         item.ProductID,
			SelectedSize:      item.SelectedSize,
			SelectedColorName: item.SelectedColor,
			SelectedColorHex:  item.SelectedColorHex,
			Quantity:          item.Quantity,
			Price:             item.Price,
			Subtotal:          item.Price * float64(item.Quantity),
		})
	}

	biteshipConfig := config.GetBiteshipConfig()

	senderInfo := TransactionHistorySenderInfo{
		Name:       biteshipConfig.OriginName,
		Phone:      biteshipConfig.OriginPhone,
		Email:      biteshipConfig.OriginEmail,
		Address:    biteshipConfig.OriginAddress,
		PostalCode: biteshipConfig.OriginPostalCode,
	}

	c.JSON(http.StatusOK, TransactionHistoryDetailResponse{Data: TransactionHistoryDetail{
		ID:                tx.ID,
		OrderID:           tx.OrderID,
		CustomerID:        tx.UserID,
		ShippingAddressID: tx.ShippingAddressID,
		TotalAmount:       tx.TotalAmount,
		ShippingCost:      tx.ShippingCost,
		Status:            tx.Status,
		ShippingStatus:    tx.ShippingStatus,
		CourierName:       tx.CourierName,
		CourierService:    tx.CourierService,
		TrackingNumber:    tx.TrackingNumber,
		SnapToken:         tx.SnapToken,
		Notes:             tx.Notes,
		CreatedAt:         tx.CreatedAt,
		UpdatedAt:         tx.UpdatedAt,
		ShippingAddress: TransactionHistoryAddressSummary{
			ID:                   tx.ShippingAddress.ID,
			Title:                tx.ShippingAddress.Title,
			RecipientName:        tx.ShippingAddress.RecipientName,
			PhoneNumber:          tx.ShippingAddress.PhoneNumber,
			Province:             tx.ShippingAddress.Province,
			City:                 tx.ShippingAddress.City,
			District:             tx.ShippingAddress.District,
			Village:              tx.ShippingAddress.Village,
			PostalCode:           tx.ShippingAddress.PostalCode,
			FullAddress:          tx.ShippingAddress.FullAddress,
			Latitude:             tx.ShippingAddress.Latitude,
			Longitude:            tx.ShippingAddress.Longitude,
			DestinationAreaID:    tx.ShippingAddress.DestinationAreaID,
			DestinationAreaLabel: tx.ShippingAddress.DestinationAreaLabel,
			IsPrimary:            tx.ShippingAddress.IsPrimary,
		},
		Sender: senderInfo,
		Items:  responseItems,
	}})
}
