package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"github.com/itdiagonals/website/backend/config"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/midtrans/midtrans-go"
	"github.com/midtrans/midtrans-go/snap"
	"gorm.io/gorm"
)

var (
	ErrCheckoutCartEmpty         = errors.New("cart is empty")
	ErrCheckoutAddressNotFound   = errors.New("shipping address not found")
	ErrCheckoutRateNotFound      = errors.New("requested courier service is not available")
	ErrCheckoutOriginAreaMissing = errors.New("RAJAONGKIR_ORIGIN_ID is not set")
	ErrCheckoutAreaLookupFailed  = errors.New("failed to resolve RajaOngkir destination id from customer address")
)

type CheckoutRequest struct {
	AddressID      uint
	CourierName    string
	CourierService string
}

type ShippingRatesRequest struct {
	AddressID uint
	Couriers  string
}

type ShippingRatesResult struct {
	Address     *domain.CustomerAddress
	Rates       []RajaOngkirRate
	Subtotal    float64
	TotalWeight int
}

type checkoutLineItem struct {
	TransactionItem domain.TransactionItem
	ProductName     string
}

type CheckoutService interface {
	GetAvailableShippingRates(ctx context.Context, customerID uint, req ShippingRatesRequest) (*ShippingRatesResult, error)
	Checkout(ctx context.Context, customerID uint, req CheckoutRequest) (*domain.Transaction, error)
}

type checkoutService struct {
	shippingService           RajaOngkirService
	cartRepository            repository.CartRepository
	customerAddressRepository repository.CustomerAddressRepository
	customerRepository        repository.CustomerRepository
	productRepository         repository.ProductRepository
	transactionRepository     repository.TransactionRepository
	shippingConfig            config.RajaOngkirConfig
}

func NewCheckoutService(
	customerRepository repository.CustomerRepository,
	customerAddressRepository repository.CustomerAddressRepository,
	cartRepository repository.CartRepository,
	productRepository repository.ProductRepository,
	transactionRepository repository.TransactionRepository,
	shippingService RajaOngkirService,
) CheckoutService {
	return &checkoutService{
		shippingService:           shippingService,
		cartRepository:            cartRepository,
		customerAddressRepository: customerAddressRepository,
		customerRepository:        customerRepository,
		productRepository:         productRepository,
		transactionRepository:     transactionRepository,
		shippingConfig:            config.GetRajaOngkirConfig(),
	}
}

func (service *checkoutService) GetAvailableShippingRates(ctx context.Context, customerID uint, req ShippingRatesRequest) (*ShippingRatesResult, error) {
	if customerID == 0 || req.AddressID == 0 {
		return nil, ErrInvalidShippingRequest
	}

	address, _, subtotal, totalWeight, _, err := service.prepareCheckout(ctx, customerID, req.AddressID)
	if err != nil {
		return nil, err
	}

	if strings.TrimSpace(service.shippingConfig.OriginID) == "" {
		return nil, ErrCheckoutOriginAreaMissing
	}

	destinationID, err := service.lookupDestinationAreaID(ctx, address)
	if err != nil {
		return nil, err
	}

	couriers := normalizeCouriers(req.Couriers)
	rates, err := service.shippingService.GetShippingRates(ctx, service.shippingConfig.OriginID, destinationID, totalWeight, couriers)
	if err != nil {
		return nil, err
	}

	return &ShippingRatesResult{
		Address:     address,
		Rates:       rates.Rates,
		Subtotal:    subtotal,
		TotalWeight: totalWeight,
	}, nil

}

func (service *checkoutService) Checkout(ctx context.Context, customerID uint, req CheckoutRequest) (*domain.Transaction, error) {
	req.CourierName = strings.TrimSpace(strings.ToLower(req.CourierName))
	req.CourierService = strings.TrimSpace(strings.ToLower(req.CourierService))

	if customerID == 0 || req.AddressID == 0 || req.CourierName == "" || req.CourierService == "" {
		return nil, ErrInvalidShippingRequest
	}

	address, customer, subtotal, totalWeight, transactionItems, err := service.prepareCheckout(ctx, customerID, req.AddressID)
	if err != nil {
		return nil, err
	}

	midtransItems := buildMidtransItems(transactionItems)

	if strings.TrimSpace(service.shippingConfig.OriginID) == "" {
		return nil, ErrCheckoutOriginAreaMissing
	}

	destinationID, err := service.lookupDestinationAreaID(ctx, address)
	if err != nil {
		return nil, err
	}

	rates, err := service.shippingService.GetShippingRates(ctx, service.shippingConfig.OriginID, destinationID, totalWeight, req.CourierName)
	if err != nil {
		return nil, err
	}

	selectedRate, err := findRequestedRate(rates, req.CourierName, req.CourierService)
	if err != nil {
		return nil, err
	}

	shippingCost := selectedRate.Price
	grandTotal := subtotal + shippingCost
	orderID := fmt.Sprintf("TRX-%d", time.Now().UnixNano())

	midtransItems = append(midtransItems, midtrans.ItemDetails{
		ID:    "shipping",
		Name:  fmt.Sprintf("Shipping %s %s", selectedRate.CourierCode, selectedRate.ServiceCode),
		Price: toMidtransAmount(shippingCost),
		Qty:   1,
	})

	snapResponse, err := createSnapTransaction(orderID, grandTotal, customer, address, midtransItems)
	if err != nil {
		return nil, err
	}

	transaction := &domain.Transaction{
		OrderID:           orderID,
		CustomerID:        customerID,
		ShippingAddressID: req.AddressID,
		TotalAmount:       grandTotal,
		ShippingCost:      shippingCost,
		CourierName:       selectedRate.CourierCode,
		CourierService:    selectedRate.ServiceCode,
		Status:            "pending",
		ShippingStatus:    "pending",
		SnapToken:         snapResponse.Token,
		Customer:          *customer,
		ShippingAddress:   *address,
	}

	persistedItems := make([]domain.TransactionItem, 0, len(transactionItems))
	for _, transactionItem := range transactionItems {
		persistedItems = append(persistedItems, transactionItem.TransactionItem)
	}

	if err := service.transactionRepository.CreateWithItems(ctx, transaction, persistedItems); err != nil {
		return nil, err
	}

	if err := service.cartRepository.ClearCart(ctx, customerID); err != nil {
		return nil, err
	}

	return transaction, nil
}

func (service *checkoutService) prepareCheckout(ctx context.Context, customerID uint, addressID uint) (*domain.CustomerAddress, *domain.Customer, float64, int, []checkoutLineItem, error) {
	address, err := service.customerAddressRepository.FindByID(ctx, customerID, addressID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, 0, 0, nil, ErrCheckoutAddressNotFound
		}

		return nil, nil, 0, 0, nil, err
	}

	customer, err := service.customerRepository.FindByID(ctx, customerID)
	if err != nil {
		return nil, nil, 0, 0, nil, err
	}

	cart, err := service.cartRepository.GetCart(ctx, customerID)
	if err != nil {
		return nil, nil, 0, 0, nil, err
	}

	if cart == nil || len(cart.Items) == 0 {
		return nil, nil, 0, 0, nil, ErrCheckoutCartEmpty
	}

	subtotal := 0.0
	totalWeight := 0
	transactionItems := make([]checkoutLineItem, 0, len(cart.Items))

	for _, cartItem := range cart.Items {
		product, err := service.productRepository.FindByID(ctx, cartItem.ProductID)
		if err != nil {
			return nil, nil, 0, 0, nil, err
		}

		lineTotal := product.BasePrice * float64(cartItem.Quantity)
		subtotal += lineTotal
		totalWeight += product.Weight * cartItem.Quantity

		transactionItems = append(transactionItems, checkoutLineItem{
			TransactionItem: domain.TransactionItem{
				ProductID: product.ID,
				Quantity:  cartItem.Quantity,
				Price:     product.BasePrice,
			},
			ProductName: product.Name,
		})
	}

	return address, customer, subtotal, totalWeight, transactionItems, nil
}

func buildMidtransItems(transactionItems []checkoutLineItem) []midtrans.ItemDetails {
	items := make([]midtrans.ItemDetails, 0, len(transactionItems)+1)
	for _, transactionItem := range transactionItems {
		items = append(items, midtrans.ItemDetails{
			ID:    fmt.Sprintf("product-%d", transactionItem.TransactionItem.ProductID),
			Name:  transactionItem.ProductName,
			Price: toMidtransAmount(transactionItem.TransactionItem.Price),
			Qty:   int32(transactionItem.TransactionItem.Quantity),
		})
	}

	return items
}

func createSnapTransaction(orderID string, grandTotal float64, customer *domain.Customer, address *domain.CustomerAddress, items []midtrans.ItemDetails) (*snap.Response, error) {
	if config.MidtransSnapClient == nil {
		config.InitMidtrans()
	}

	if config.MidtransSnapClient == nil {
		return nil, errors.New("midtrans client is not initialized")
	}

	midtransAddress := &midtrans.CustomerAddress{
		FName:       address.RecipientName,
		Phone:       address.PhoneNumber,
		Address:     address.FullAddress,
		City:        address.City,
		Postcode:    address.PostalCode,
		CountryCode: "IDN",
	}

	request := &snap.Request{
		TransactionDetails: midtrans.TransactionDetails{
			OrderID:  orderID,
			GrossAmt: toMidtransAmount(grandTotal),
		},
		Items: &items,
		CustomerDetail: &midtrans.CustomerDetails{
			FName:    customer.Name,
			Email:    customer.Email,
			Phone:    firstNonEmpty(address.PhoneNumber, customer.Phone),
			BillAddr: midtransAddress,
			ShipAddr: midtransAddress,
		},
	}

	response, midtransError := config.MidtransSnapClient.CreateTransaction(request)
	if midtransError != nil {
		return nil, fmt.Errorf("midtrans create transaction failed: %s", midtransError.Error())
	}

	return response, nil
}

func normalizeCouriers(couriers string) string {
	trimmed := strings.TrimSpace(strings.ToLower(couriers))
	if trimmed == "" {
		return "jne:sicepat:jnt:anteraja:ninja:tiki:pos"
	}
	return strings.ReplaceAll(trimmed, ",", ":")
}

func (service *checkoutService) lookupDestinationAreaID(ctx context.Context, address *domain.CustomerAddress) (string, error) {
	queries := buildDestinationLookupQueries(address)
	for _, query := range queries {
		destination, err := service.shippingService.LookupDestination(ctx, query)
		if err == nil && destination != nil && strings.TrimSpace(destination.ID) != "" {
			return strings.TrimSpace(destination.ID), nil
		}
	}

	return "", ErrCheckoutAreaLookupFailed
}

func buildDestinationLookupQueries(address *domain.CustomerAddress) []string {
	parts := [][]string{
		{address.PostalCode},
		{address.Village, address.District, address.City, address.Province, address.PostalCode},
		{address.Village, address.District, address.City, address.Province, address.PostalCode},
		{address.District, address.City, address.Province, address.PostalCode},
		{address.City, address.Province, address.PostalCode},
		{address.City, address.Province},
	}

	queries := make([]string, 0, len(parts))
	seen := map[string]struct{}{}
	for _, partGroup := range parts {
		filtered := make([]string, 0, len(partGroup))
		for _, part := range partGroup {
			trimmed := strings.TrimSpace(part)
			if trimmed == "" {
				continue
			}
			filtered = append(filtered, trimmed)
		}

		if len(filtered) == 0 {
			continue
		}

		query := strings.Join(filtered, " ")
		if _, exists := seen[query]; exists {
			continue
		}

		seen[query] = struct{}{}
		queries = append(queries, query)
	}

	return queries
}

func findRequestedRate(response *RajaOngkirRateResponse, courierName string, courierService string) (*RajaOngkirRate, error) {
	if response == nil {
		return nil, ErrCheckoutRateNotFound
	}

	for _, rate := range response.Rates {
		courierMatched := strings.EqualFold(rate.CourierCode, courierName) || strings.EqualFold(rate.CourierName, courierName)
		serviceMatched := strings.EqualFold(rate.ServiceCode, courierService) || strings.EqualFold(rate.ServiceName, courierService)
		if courierMatched && serviceMatched {
			rateCopy := rate
			return &rateCopy, nil
		}
	}

	return nil, ErrCheckoutRateNotFound
}

func toMidtransAmount(amount float64) int64 {
	return int64(math.Round(amount))
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" {
			return trimmed
		}
	}

	return ""
}
