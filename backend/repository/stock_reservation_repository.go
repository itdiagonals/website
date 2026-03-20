package repository

import (
	"context"

	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type StockReservationRepository interface {
	CreateMany(ctx context.Context, reservations []domain.StockReservation) error
	FindByOrderIDAndStatus(ctx context.Context, orderID string, status string) ([]domain.StockReservation, error)
	UpdateStatusByOrderID(ctx context.Context, orderID string, fromStatus string, toStatus string) error
	UpdateStatusByIDs(ctx context.Context, ids []uint, fromStatus string, toStatus string) error
}

type stockReservationRepository struct {
	db *gorm.DB
}

func NewStockReservationRepository(db *gorm.DB) StockReservationRepository {
	return &stockReservationRepository{db: db}
}

func (repository *stockReservationRepository) CreateMany(ctx context.Context, reservations []domain.StockReservation) error {
	if len(reservations) == 0 {
		return nil
	}

	return repository.db.WithContext(ctx).Create(&reservations).Error
}

func (repository *stockReservationRepository) FindByOrderIDAndStatus(ctx context.Context, orderID string, status string) ([]domain.StockReservation, error) {
	var reservations []domain.StockReservation
	err := repository.db.WithContext(ctx).
		Where("order_id = ? AND status = ?", orderID, status).
		Order("id ASC").
		Find(&reservations).Error
	if err != nil {
		return nil, err
	}

	return reservations, nil
}

func (repository *stockReservationRepository) UpdateStatusByOrderID(ctx context.Context, orderID string, fromStatus string, toStatus string) error {
	return repository.db.WithContext(ctx).
		Model(&domain.StockReservation{}).
		Where("order_id = ? AND status = ?", orderID, fromStatus).
		Update("status", toStatus).Error
}

func (repository *stockReservationRepository) UpdateStatusByIDs(ctx context.Context, ids []uint, fromStatus string, toStatus string) error {
	if len(ids) == 0 {
		return nil
	}

	return repository.db.WithContext(ctx).
		Model(&domain.StockReservation{}).
		Where("id IN ? AND status = ?", ids, fromStatus).
		Update("status", toStatus).Error
}
