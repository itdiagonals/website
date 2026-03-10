package repository

import (
	"context"

	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type CustomerRepository interface {
	Create(context context.Context, customer *domain.Customer) error
	FindByEmail(context context.Context, email string) (*domain.Customer, error)
}

type customerRepository struct {
	db *gorm.DB
}

func NewCustomerRepository(db *gorm.DB) CustomerRepository {
	return &customerRepository{db: db}
}

func (repository *customerRepository) Create(context context.Context, customer *domain.Customer) error {
	return repository.db.WithContext(context).Create(customer).Error
}

func (repository *customerRepository) FindByEmail(context context.Context, email string) (*domain.Customer, error) {
	var customer domain.Customer

	err := repository.db.WithContext(context).Where("email = ?", email).First(&customer).Error
	if err != nil {
		return nil, err
	}

	return &customer, nil
}
