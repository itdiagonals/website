package service

import (
	"context"
	"errors"
	"strings"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
	"gorm.io/gorm"
)

var ErrInvalidCustomerAddress = errors.New("invalid customer address")

type AddCustomerAddressInput struct {
	Title         string
	RecipientName string
	PhoneNumber   string
	Province      string
	City          string
	District      string
	Village       string
	PostalCode    string
	FullAddress   string
	IsPrimary     bool
}

type CustomerAddressService interface {
	AddAddress(context context.Context, customerID uint, input AddCustomerAddressInput) (*domain.CustomerAddress, error)
	GetMyAddresses(context context.Context, customerID uint) ([]domain.CustomerAddress, error)
}

type customerAddressService struct {
	db                        *gorm.DB
	customerAddressRepository repository.CustomerAddressRepository
}

func NewCustomerAddressService(db *gorm.DB, customerAddressRepository repository.CustomerAddressRepository) CustomerAddressService {
	return &customerAddressService{
		db:                        db,
		customerAddressRepository: customerAddressRepository,
	}
}

func (service *customerAddressService) AddAddress(context context.Context, customerID uint, input AddCustomerAddressInput) (*domain.CustomerAddress, error) {
	address := &domain.CustomerAddress{
		CustomerID:    customerID,
		Title:         strings.TrimSpace(input.Title),
		RecipientName: strings.TrimSpace(input.RecipientName),
		PhoneNumber:   strings.TrimSpace(input.PhoneNumber),
		Province:      strings.TrimSpace(input.Province),
		City:          strings.TrimSpace(input.City),
		District:      strings.TrimSpace(input.District),
		Village:       strings.TrimSpace(input.Village),
		PostalCode:    strings.TrimSpace(input.PostalCode),
		FullAddress:   strings.TrimSpace(input.FullAddress),
		IsPrimary:     input.IsPrimary,
	}

	if customerID == 0 ||
		address.Title == "" ||
		address.RecipientName == "" ||
		address.PhoneNumber == "" ||
		address.Province == "" ||
		address.City == "" ||
		address.District == "" ||
		address.Village == "" ||
		address.PostalCode == "" ||
		address.FullAddress == "" {
		return nil, ErrInvalidCustomerAddress
	}

	if address.IsPrimary {
		if err := service.db.WithContext(context).Transaction(func(tx *gorm.DB) error {
			txRepository := repository.NewCustomerAddressRepository(tx)
			if err := txRepository.SetAllToNonPrimary(context, customerID); err != nil {
				return err
			}

			return txRepository.Create(context, address)
		}); err != nil {
			return nil, err
		}

		return address, nil
	}

	if err := service.customerAddressRepository.Create(context, address); err != nil {
		return nil, err
	}

	return address, nil
}

func (service *customerAddressService) GetMyAddresses(context context.Context, customerID uint) ([]domain.CustomerAddress, error) {
	if customerID == 0 {
		return nil, ErrInvalidCustomerAddress
	}

	return service.customerAddressRepository.FindByCustomerID(context, customerID)
}
