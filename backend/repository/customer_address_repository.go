package repository

import (
	"context"

	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type CustomerAddressRepository interface {
	Create(context context.Context, address *domain.CustomerAddress) error
	Update(context context.Context, address *domain.CustomerAddress) error
	FindByUserID(context context.Context, userID string) ([]domain.CustomerAddress, error)
	FindByID(context context.Context, userID string, addressID uint) (*domain.CustomerAddress, error)
	SetAllToNonPrimary(context context.Context, userID string) error
	Delete(context context.Context, userID string, addressID uint) error
}

type customerAddressRepository struct {
	db *gorm.DB
}

func NewCustomerAddressRepository(db *gorm.DB) CustomerAddressRepository {
	return &customerAddressRepository{db: db}
}

func (repository *customerAddressRepository) Create(context context.Context, address *domain.CustomerAddress) error {
	return repository.db.WithContext(context).Create(address).Error
}

func (repository *customerAddressRepository) Update(context context.Context, address *domain.CustomerAddress) error {
	return repository.db.WithContext(context).Save(address).Error
}

func (repository *customerAddressRepository) FindByUserID(context context.Context, userID string) ([]domain.CustomerAddress, error) {
	var addresses []domain.CustomerAddress

	err := repository.db.WithContext(context).
		Where("user_id = ?", userID).
		Order("is_primary DESC, updated_at DESC, created_at DESC").
		Find(&addresses).Error
	if err != nil {
		return nil, err
	}

	return addresses, nil
}

func (repository *customerAddressRepository) FindByID(context context.Context, userID string, addressID uint) (*domain.CustomerAddress, error) {
	var address domain.CustomerAddress

	err := repository.db.WithContext(context).
		Where("user_id = ? AND id = ?", userID, addressID).
		First(&address).Error
	if err != nil {
		return nil, err
	}

	return &address, nil
}

func (repository *customerAddressRepository) SetAllToNonPrimary(context context.Context, userID string) error {
	return repository.db.WithContext(context).
		Model(&domain.CustomerAddress{}).
		Where("user_id = ? AND is_primary = ?", userID, true).
		Updates(map[string]any{
			"is_primary": false,
		}).Error
}

func (repository *customerAddressRepository) Delete(context context.Context, userID string, addressID uint) error {
	return repository.db.WithContext(context).
		Where("user_id = ? AND id = ?", userID, addressID).
		Delete(&domain.CustomerAddress{}).Error
}
