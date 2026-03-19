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
var ErrCustomerAddressNotFound = errors.New("customer address not found")

type AddCustomerAddressInput struct {
	Title                string
	RecipientName        string
	PhoneNumber          string
	Province             string
	City                 string
	District             string
	Village              string
	PostalCode           string
	FullAddress          string
	Latitude             *float64
	Longitude            *float64
	PlaceID              string
	MapProvider          string
	LocationSource       string
	DestinationAreaID    string
	DestinationAreaLabel string
	IsPrimary            bool
}

type CustomerAddressService interface {
	AddAddress(context context.Context, customerID uint, input AddCustomerAddressInput) (*domain.CustomerAddress, error)
	UpdateAddress(context context.Context, customerID uint, addressID uint, input AddCustomerAddressInput) (*domain.CustomerAddress, error)
	GetMyAddresses(context context.Context, customerID uint) ([]domain.CustomerAddress, error)
}

type customerAddressService struct {
	db                        *gorm.DB
	customerAddressRepository repository.CustomerAddressRepository
	shippingService           ShippingService
}

func NewCustomerAddressService(db *gorm.DB, customerAddressRepository repository.CustomerAddressRepository, shippingService ShippingService) CustomerAddressService {
	return &customerAddressService{
		db:                        db,
		customerAddressRepository: customerAddressRepository,
		shippingService:           shippingService,
	}
}

func (service *customerAddressService) AddAddress(context context.Context, customerID uint, input AddCustomerAddressInput) (*domain.CustomerAddress, error) {
	if !isValidCoordinatePair(input.Latitude, input.Longitude) {
		return nil, ErrInvalidCustomerAddress
	}

	address := &domain.CustomerAddress{
		CustomerID:           customerID,
		Title:                strings.TrimSpace(input.Title),
		RecipientName:        strings.TrimSpace(input.RecipientName),
		PhoneNumber:          strings.TrimSpace(input.PhoneNumber),
		Province:             strings.TrimSpace(input.Province),
		City:                 strings.TrimSpace(input.City),
		District:             strings.TrimSpace(input.District),
		Village:              strings.TrimSpace(input.Village),
		PostalCode:           strings.TrimSpace(input.PostalCode),
		FullAddress:          strings.TrimSpace(input.FullAddress),
		Latitude:             input.Latitude,
		Longitude:            input.Longitude,
		PlaceID:              strings.TrimSpace(input.PlaceID),
		MapProvider:          strings.TrimSpace(input.MapProvider),
		LocationSource:       strings.TrimSpace(input.LocationSource),
		DestinationAreaID:    strings.TrimSpace(input.DestinationAreaID),
		DestinationAreaLabel: strings.TrimSpace(input.DestinationAreaLabel),
		IsPrimary:            input.IsPrimary,
	}

	if address.MapProvider != "" {
		address.MapProvider = strings.ToLower(address.MapProvider)
	}

	if address.LocationSource != "" {
		address.LocationSource = strings.ToLower(address.LocationSource)
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

	if address.DestinationAreaID == "" {
		if destination := service.tryResolveDestinationArea(context, address); destination != nil {
			address.DestinationAreaID = destination.ID
			address.DestinationAreaLabel = destination.Label
		}
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

func (service *customerAddressService) UpdateAddress(context context.Context, customerID uint, addressID uint, input AddCustomerAddressInput) (*domain.CustomerAddress, error) {
	if customerID == 0 || addressID == 0 {
		return nil, ErrInvalidCustomerAddress
	}

	if !isValidCoordinatePair(input.Latitude, input.Longitude) {
		return nil, ErrInvalidCustomerAddress
	}

	address, err := service.customerAddressRepository.FindByID(context, customerID, addressID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCustomerAddressNotFound
		}
		return nil, err
	}

	address.Title = strings.TrimSpace(input.Title)
	address.RecipientName = strings.TrimSpace(input.RecipientName)
	address.PhoneNumber = strings.TrimSpace(input.PhoneNumber)
	address.Province = strings.TrimSpace(input.Province)
	address.City = strings.TrimSpace(input.City)
	address.District = strings.TrimSpace(input.District)
	address.Village = strings.TrimSpace(input.Village)
	address.PostalCode = strings.TrimSpace(input.PostalCode)
	address.FullAddress = strings.TrimSpace(input.FullAddress)
	address.Latitude = input.Latitude
	address.Longitude = input.Longitude
	address.PlaceID = strings.TrimSpace(input.PlaceID)
	address.MapProvider = strings.ToLower(strings.TrimSpace(input.MapProvider))
	address.LocationSource = strings.ToLower(strings.TrimSpace(input.LocationSource))
	address.DestinationAreaID = strings.TrimSpace(input.DestinationAreaID)
	address.DestinationAreaLabel = strings.TrimSpace(input.DestinationAreaLabel)
	address.IsPrimary = input.IsPrimary

	if address.Title == "" ||
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

	if address.DestinationAreaID == "" {
		if destination := service.tryResolveDestinationArea(context, address); destination != nil {
			address.DestinationAreaID = destination.ID
			address.DestinationAreaLabel = destination.Label
		}
	}

	if address.IsPrimary {
		if err := service.db.WithContext(context).Transaction(func(tx *gorm.DB) error {
			txRepository := repository.NewCustomerAddressRepository(tx)
			if err := txRepository.SetAllToNonPrimary(context, customerID); err != nil {
				return err
			}

			return txRepository.Update(context, address)
		}); err != nil {
			return nil, err
		}

		return address, nil
	}

	if err := service.customerAddressRepository.Update(context, address); err != nil {
		return nil, err
	}

	return address, nil
}

func isValidCoordinatePair(latitude *float64, longitude *float64) bool {
	if latitude == nil && longitude == nil {
		return true
	}

	if latitude == nil || longitude == nil {
		return false
	}

	if *latitude < -90 || *latitude > 90 {
		return false
	}

	if *longitude < -180 || *longitude > 180 {
		return false
	}

	return true
}

func (service *customerAddressService) tryResolveDestinationArea(ctx context.Context, address *domain.CustomerAddress) *ShippingDestination {
	if service.shippingService == nil {
		return nil
	}

	queries := []string{
		strings.TrimSpace(address.PostalCode),
		strings.TrimSpace(strings.Join([]string{address.Village, address.District, address.City, address.Province, address.PostalCode}, " ")),
		strings.TrimSpace(strings.Join([]string{address.District, address.City, address.Province, address.PostalCode}, " ")),
		strings.TrimSpace(strings.Join([]string{address.City, address.Province, address.PostalCode}, " ")),
		strings.TrimSpace(strings.Join([]string{address.FullAddress, address.City, address.Province, address.PostalCode}, " ")),
	}

	seen := make(map[string]struct{}, len(queries))
	for _, query := range queries {
		if query == "" {
			continue
		}

		if _, exists := seen[query]; exists {
			continue
		}
		seen[query] = struct{}{}

		destination, err := service.shippingService.LookupDestination(ctx, query)
		if err != nil || destination == nil || strings.TrimSpace(destination.ID) == "" {
			continue
		}

		return &ShippingDestination{
			ID:    strings.TrimSpace(destination.ID),
			Label: strings.TrimSpace(destination.Label),
		}
	}

	return nil
}
