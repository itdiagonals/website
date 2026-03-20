package repository

import (
	"context"

	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type TransactionRepository interface {
	CreateWithItems(context context.Context, transaction *domain.Transaction, items []domain.TransactionItem) error
	FindByOrderID(context context.Context, orderID string) (*domain.Transaction, error)
	FindByBiteshipOrderID(context context.Context, biteshipOrderID string) (*domain.Transaction, error)
	FindByOrderIDWithDetails(context context.Context, orderID string) (*domain.Transaction, error)
	FindByCustomerIDPaginated(context context.Context, customerID uint, page int, limit int, status string) ([]domain.Transaction, error)
	CountByCustomerID(context context.Context, customerID uint, status string) (int64, error)
	FindByCustomerAndOrderID(context context.Context, customerID uint, orderID string) (*domain.Transaction, error)
	UpdateStatusByOrderIDAndCurrent(context context.Context, orderID string, currentStatus string, nextStatus string) (bool, error)
	UpdateStatusByOrderID(context context.Context, orderID string, status string) error
	SetBiteshipBooking(context context.Context, orderID string, biteshipOrderID string, biteshipReferenceID string, trackingNumber string, shippingStatus string) error
	UpdateShippingByOrderID(context context.Context, orderID string, trackingNumber string, shippingStatus string) error
	UpdateShippingByBiteshipOrderID(context context.Context, biteshipOrderID string, trackingNumber string, shippingStatus string) (bool, error)
}

type transactionRepository struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) TransactionRepository {
	return &transactionRepository{db: db}
}

func (repository *transactionRepository) CreateWithItems(context context.Context, transaction *domain.Transaction, items []domain.TransactionItem) error {
	return repository.db.WithContext(context).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(transaction).Error; err != nil {
			return err
		}

		for index := range items {
			items[index].TransactionID = transaction.ID
		}

		if len(items) == 0 {
			return nil
		}

		return tx.Create(&items).Error
	})
}

func (repository *transactionRepository) FindByOrderID(context context.Context, orderID string) (*domain.Transaction, error) {
	var transaction domain.Transaction
	err := repository.db.WithContext(context).Where("order_id = ?", orderID).First(&transaction).Error
	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

func (repository *transactionRepository) FindByBiteshipOrderID(context context.Context, biteshipOrderID string) (*domain.Transaction, error) {
	var transaction domain.Transaction
	err := repository.db.WithContext(context).Where("biteship_order_id = ?", biteshipOrderID).First(&transaction).Error
	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

func (repository *transactionRepository) FindByOrderIDWithDetails(context context.Context, orderID string) (*domain.Transaction, error) {
	var transaction domain.Transaction
	err := repository.db.WithContext(context).
		Preload("ShippingAddress").
		Preload("Items").
		Where("order_id = ?", orderID).
		First(&transaction).Error
	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

func (repository *transactionRepository) FindByCustomerIDPaginated(context context.Context, customerID uint, page int, limit int, status string) ([]domain.Transaction, error) {
	query := repository.db.WithContext(context).
		Where("customer_id = ?", customerID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	offset := (page - 1) * limit
	var transactions []domain.Transaction
	err := query.
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&transactions).Error
	if err != nil {
		return nil, err
	}

	return transactions, nil
}

func (repository *transactionRepository) CountByCustomerID(context context.Context, customerID uint, status string) (int64, error) {
	query := repository.db.WithContext(context).
		Model(&domain.Transaction{}).
		Where("customer_id = ?", customerID)

	if status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	err := query.Count(&total).Error
	if err != nil {
		return 0, err
	}

	return total, nil
}

func (repository *transactionRepository) FindByCustomerAndOrderID(context context.Context, customerID uint, orderID string) (*domain.Transaction, error) {
	var transaction domain.Transaction
	err := repository.db.WithContext(context).
		Preload("ShippingAddress").
		Preload("Items").
		Where("customer_id = ? AND order_id = ?", customerID, orderID).
		First(&transaction).Error
	if err != nil {
		return nil, err
	}

	return &transaction, nil
}

func (repository *transactionRepository) UpdateStatusByOrderID(context context.Context, orderID string, status string) error {
	return repository.db.WithContext(context).
		Model(&domain.Transaction{}).
		Where("order_id = ?", orderID).
		Update("status", status).Error
}

func (repository *transactionRepository) UpdateStatusByOrderIDAndCurrent(context context.Context, orderID string, currentStatus string, nextStatus string) (bool, error) {
	result := repository.db.WithContext(context).
		Model(&domain.Transaction{}).
		Where("order_id = ? AND status = ?", orderID, currentStatus).
		Update("status", nextStatus)
	if result.Error != nil {
		return false, result.Error
	}

	return result.RowsAffected > 0, nil
}

func (repository *transactionRepository) SetBiteshipBooking(context context.Context, orderID string, biteshipOrderID string, biteshipReferenceID string, trackingNumber string, shippingStatus string) error {
	updates := map[string]any{
		"biteship_order_id":     biteshipOrderID,
		"biteship_reference_id": biteshipReferenceID,
		"shipping_status":       shippingStatus,
	}

	if trackingNumber != "" {
		updates["tracking_number"] = trackingNumber
	}

	return repository.db.WithContext(context).
		Model(&domain.Transaction{}).
		Where("order_id = ? AND (biteship_order_id IS NULL OR biteship_order_id = '')", orderID).
		Updates(updates).Error
}

func (repository *transactionRepository) UpdateShippingByOrderID(context context.Context, orderID string, trackingNumber string, shippingStatus string) error {
	updates := map[string]any{}
	if trackingNumber != "" {
		updates["tracking_number"] = trackingNumber
	}
	if shippingStatus != "" {
		updates["shipping_status"] = shippingStatus
	}

	if len(updates) == 0 {
		return nil
	}

	return repository.db.WithContext(context).
		Model(&domain.Transaction{}).
		Where("order_id = ?", orderID).
		Updates(updates).Error
}

func (repository *transactionRepository) UpdateShippingByBiteshipOrderID(context context.Context, biteshipOrderID string, trackingNumber string, shippingStatus string) (bool, error) {
	updates := map[string]any{}
	if trackingNumber != "" {
		updates["tracking_number"] = trackingNumber
	}
	if shippingStatus != "" {
		updates["shipping_status"] = shippingStatus
	}

	if len(updates) == 0 {
		return false, nil
	}

	result := repository.db.WithContext(context).
		Model(&domain.Transaction{}).
		Where("biteship_order_id = ?", biteshipOrderID).
		Updates(updates)
	if result.Error != nil {
		return false, result.Error
	}

	return result.RowsAffected > 0, nil
}
