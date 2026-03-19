package service

import (
	"context"
	"errors"
	"math"
	"strings"
	"time"

	"github.com/itdiagonals/website/backend/repository"
	"gorm.io/gorm"
)

var (
	ErrTransactionHistoryInvalidQuery = errors.New("invalid transaction history query")
	ErrTransactionNotFound            = errors.New("transaction not found")
)

type TransactionHistoryQuery struct {
	Page   int
	Limit  int
	Status string
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

type TransactionHistoryListResult struct {
	Items      []TransactionHistoryListItem `json:"items"`
	Page       int                          `json:"page"`
	Limit      int                          `json:"limit"`
	Total      int64                        `json:"total"`
	TotalPages int                          `json:"total_pages"`
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
	ID        uint    `json:"id"`
	ProductID int     `json:"product_id"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
	Subtotal  float64 `json:"subtotal"`
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

type TransactionHistoryService interface {
	ListMyTransactions(ctx context.Context, customerID uint, query TransactionHistoryQuery) (*TransactionHistoryListResult, error)
	GetMyTransactionByOrderID(ctx context.Context, customerID uint, orderID string) (*TransactionHistoryDetail, error)
}

type transactionHistoryService struct {
	transactionRepository repository.TransactionRepository
}

func NewTransactionHistoryService(transactionRepository repository.TransactionRepository) TransactionHistoryService {
	return &transactionHistoryService{transactionRepository: transactionRepository}
}

func (service *transactionHistoryService) ListMyTransactions(ctx context.Context, customerID uint, query TransactionHistoryQuery) (*TransactionHistoryListResult, error) {
	if customerID == 0 {
		return nil, ErrTransactionHistoryInvalidQuery
	}

	normalizedPage, normalizedLimit, normalizedStatus, err := normalizeTransactionQuery(query)
	if err != nil {
		return nil, err
	}

	total, err := service.transactionRepository.CountByCustomerID(ctx, customerID, normalizedStatus)
	if err != nil {
		return nil, err
	}

	transactions, err := service.transactionRepository.FindByCustomerIDPaginated(ctx, customerID, normalizedPage, normalizedLimit, normalizedStatus)
	if err != nil {
		return nil, err
	}

	items := make([]TransactionHistoryListItem, 0, len(transactions))
	for _, transaction := range transactions {
		items = append(items, TransactionHistoryListItem{
			ID:             transaction.ID,
			OrderID:        transaction.OrderID,
			TotalAmount:    transaction.TotalAmount,
			ShippingCost:   transaction.ShippingCost,
			Status:         transaction.Status,
			ShippingStatus: transaction.ShippingStatus,
			CourierName:    transaction.CourierName,
			CourierService: transaction.CourierService,
			CreatedAt:      transaction.CreatedAt,
		})
	}

	totalPages := 0
	if total > 0 {
		totalPages = int(math.Ceil(float64(total) / float64(normalizedLimit)))
	}

	return &TransactionHistoryListResult{
		Items:      items,
		Page:       normalizedPage,
		Limit:      normalizedLimit,
		Total:      total,
		TotalPages: totalPages,
	}, nil
}

func (service *transactionHistoryService) GetMyTransactionByOrderID(ctx context.Context, customerID uint, orderID string) (*TransactionHistoryDetail, error) {
	if customerID == 0 || strings.TrimSpace(orderID) == "" {
		return nil, ErrTransactionHistoryInvalidQuery
	}

	transaction, err := service.transactionRepository.FindByCustomerAndOrderID(ctx, customerID, strings.TrimSpace(orderID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrTransactionNotFound
		}

		return nil, err
	}

	if transaction == nil {
		return nil, ErrTransactionNotFound
	}

	mappedItems := make([]TransactionHistoryDetailItem, 0, len(transaction.Items))
	for _, item := range transaction.Items {
		mappedItems = append(mappedItems, TransactionHistoryDetailItem{
			ID:        item.ID,
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Price:     item.Price,
			Subtotal:  item.Price * float64(item.Quantity),
		})
	}

	return &TransactionHistoryDetail{
		ID:                transaction.ID,
		OrderID:           transaction.OrderID,
		CustomerID:        transaction.CustomerID,
		ShippingAddressID: transaction.ShippingAddressID,
		TotalAmount:       transaction.TotalAmount,
		ShippingCost:      transaction.ShippingCost,
		Status:            transaction.Status,
		ShippingStatus:    transaction.ShippingStatus,
		CourierName:       transaction.CourierName,
		CourierService:    transaction.CourierService,
		TrackingNumber:    transaction.TrackingNumber,
		SnapToken:         transaction.SnapToken,
		CreatedAt:         transaction.CreatedAt,
		UpdatedAt:         transaction.UpdatedAt,
		ShippingAddress: TransactionHistoryAddressSummary{
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
		Items: mappedItems,
	}, nil
}

func normalizeTransactionQuery(query TransactionHistoryQuery) (int, int, string, error) {
	page := query.Page
	if page <= 0 {
		page = 1
	}

	limit := query.Limit
	if limit <= 0 {
		limit = 10
	}
	if limit > 50 {
		limit = 50
	}

	status := strings.ToLower(strings.TrimSpace(query.Status))
	if status == "" {
		return page, limit, "", nil
	}

	switch status {
	case "pending", "paid", "failed", "refunded":
		return page, limit, status, nil
	default:
		return 0, 0, "", ErrTransactionHistoryInvalidQuery
	}
}
