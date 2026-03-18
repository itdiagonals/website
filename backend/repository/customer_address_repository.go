package repository

import (
	"context"

	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type CustomerAddressRepository interface {
	Create(context context.Context, address *domain.CustomerAddress) error
	FindByCustomerID(context context.Context, customerID uint) ([]domain.CustomerAddress, error)
	FindByID(context context.Context, customerID uint, addressID uint) (*domain.CustomerAddress, error)
	SetAllToNonPrimary(context context.Context, customerID uint) error
	Delete(context context.Context, customerID uint, addressID uint) error
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

func (repository *customerAddressRepository) FindByCustomerID(context context.Context, customerID uint) ([]domain.CustomerAddress, error) {
	var addresses []domain.CustomerAddress

	err := repository.db.WithContext(context).
		Where("customer_id = ?", customerID).
		Order("is_primary DESC, updated_at DESC, created_at DESC").
		Find(&addresses).Error
	if err != nil {
		return nil, err
	}

	return addresses, nil
}

func (repository *customerAddressRepository) FindByID(context context.Context, customerID uint, addressID uint) (*domain.CustomerAddress, error) {
	var address domain.CustomerAddress

	err := repository.db.WithContext(context).
		Where("customer_id = ? AND id = ?", customerID, addressID).
		First(&address).Error
	if err != nil {
		return nil, err
	}

	return &address, nil
}

func (repository *customerAddressRepository) SetAllToNonPrimary(context context.Context, customerID uint) error {
	return repository.db.WithContext(context).
		Model(&domain.CustomerAddress{}).
		Where("customer_id = ? AND is_primary = ?", customerID, true).
		Updates(map[string]any{
			"is_primary": false,
		}).Error
}

func (repository *customerAddressRepository) Delete(context context.Context, customerID uint, addressID uint) error {
	return repository.db.WithContext(context).
		Where("customer_id = ? AND id = ?", customerID, addressID).
		Delete(&domain.CustomerAddress{}).Error
}
