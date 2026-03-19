package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"sort"
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
	ErrCheckoutCartEmpty            = errors.New("cart is empty")
	ErrCheckoutAddressNotFound      = errors.New("shipping address not found")
	ErrCheckoutRateNotFound         = errors.New("requested courier service is not available")
	ErrCheckoutOriginAreaMissing    = errors.New("BITESHIP_ORIGIN_AREA_ID is not set")
	ErrCheckoutAreaLookupFailed     = errors.New("failed to resolve destination area id from customer address")
	ErrCheckoutSelectedItemsEmpty   = errors.New("selected cart item ids are required")
	ErrCheckoutSelectedItemNotFound = errors.New("one or more selected cart items are not found in cart")
	ErrCheckoutInsufficientStock    = errors.New("insufficient stock for checkout")
)

type CheckoutRequest struct {
	AddressID           uint
	CourierName         string
	CourierService      string
	SelectedCartItemIDs []uint
}

type ShippingRatesRequest struct {
	AddressID           uint
	Couriers            string
	SelectedCartItemIDs []uint
}

type ShippingRatesResult struct {
	Address     *domain.CustomerAddress
	Rates       []ShippingRate
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
	shippingService            ShippingService
	cartRepository             repository.CartRepository
	customerAddressRepository  repository.CustomerAddressRepository
	customerRepository         repository.CustomerRepository
	productRepository          repository.ProductRepository
	transactionRepository      repository.TransactionRepository
	stockReservationRepository repository.StockReservationRepository
	shippingConfig             config.BiteshipConfig
}

func NewCheckoutService(
	customerRepository repository.CustomerRepository,
	customerAddressRepository repository.CustomerAddressRepository,
	cartRepository repository.CartRepository,
	productRepository repository.ProductRepository,
	transactionRepository repository.TransactionRepository,
	stockReservationRepository repository.StockReservationRepository,
	shippingService ShippingService,
) CheckoutService {
	return &checkoutService{
		shippingService:            shippingService,
		cartRepository:             cartRepository,
		customerAddressRepository:  customerAddressRepository,
		customerRepository:         customerRepository,
		productRepository:          productRepository,
		transactionRepository:      transactionRepository,
		stockReservationRepository: stockReservationRepository,
		shippingConfig:             config.GetBiteshipConfig(),
	}
}

func (service *checkoutService) GetAvailableShippingRates(ctx context.Context, customerID uint, req ShippingRatesRequest) (*ShippingRatesResult, error) {
	if customerID == 0 || req.AddressID == 0 {
		return nil, ErrInvalidShippingRequest
	}

	selectedCartItemIDs, err := normalizeSelectedCartItemIDs(req.SelectedCartItemIDs)
	if err != nil {
		return nil, err
	}

	address, _, subtotal, totalWeight, shippingItems, _, err := service.prepareCheckout(ctx, customerID, req.AddressID, selectedCartItemIDs)
	if err != nil {
		return nil, err
	}

	if strings.TrimSpace(service.shippingConfig.OriginAreaID) == "" {
		return nil, ErrCheckoutOriginAreaMissing
	}

	destinationID, err := service.lookupDestinationAreaID(ctx, address)
	if err != nil {
		return nil, err
	}

	couriers := normalizeCouriers(req.Couriers)
	rates, err := service.shippingService.GetShippingRates(ctx, service.shippingConfig.OriginAreaID, destinationID, shippingItems, couriers)
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

	selectedCartItemIDs, err := normalizeSelectedCartItemIDs(req.SelectedCartItemIDs)
	if err != nil {
		return nil, err
	}

	address, customer, subtotal, _, shippingItems, transactionItems, err := service.prepareCheckout(ctx, customerID, req.AddressID, selectedCartItemIDs)
	if err != nil {
		return nil, err
	}

	midtransItems := buildMidtransItems(transactionItems)

	if strings.TrimSpace(service.shippingConfig.OriginAreaID) == "" {
		return nil, ErrCheckoutOriginAreaMissing
	}

	destinationID, err := service.lookupDestinationAreaID(ctx, address)
	if err != nil {
		return nil, err
	}

	rates, err := service.shippingService.GetShippingRates(ctx, service.shippingConfig.OriginAreaID, destinationID, shippingItems, req.CourierName)
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

	reservationItems := aggregateReservationItems(transactionItems)
	if err := service.reserveStockForOrder(ctx, orderID, reservationItems); err != nil {
		return nil, err
	}

	midtransItems = append(midtransItems, midtrans.ItemDetails{
		ID:    "shipping",
		Name:  fmt.Sprintf("Shipping %s %s", selectedRate.CourierCode, selectedRate.ServiceCode),
		Price: toMidtransAmount(shippingCost),
		Qty:   1,
	})

	snapResponse, err := createSnapTransaction(orderID, grandTotal, customer, address, midtransItems)
	if err != nil {
		_ = service.releaseStockForOrder(ctx, orderID)
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
		_ = service.releaseStockForOrder(ctx, orderID)
		return nil, err
	}

	if err := service.removeSelectedItemsFromCart(ctx, customerID, selectedCartItemIDs); err != nil {
		// Cart cleanup failure should not cancel an already created transaction.
		return transaction, nil
	}

	return transaction, nil
}

func aggregateReservationItems(transactionItems []checkoutLineItem) []stockReservationItem {
	byProduct := make(map[int]int, len(transactionItems))
	for _, item := range transactionItems {
		if item.TransactionItem.ProductID <= 0 || item.TransactionItem.Quantity <= 0 {
			continue
		}

		byProduct[item.TransactionItem.ProductID] += item.TransactionItem.Quantity
	}

	productIDs := make([]int, 0, len(byProduct))
	for productID := range byProduct {
		productIDs = append(productIDs, productID)
	}
	sort.Ints(productIDs)

	items := make([]stockReservationItem, 0, len(productIDs))
	for _, productID := range productIDs {
		items = append(items, stockReservationItem{ProductID: productID, Quantity: byProduct[productID]})
	}

	return items
}

func (service *checkoutService) reserveStockForOrder(ctx context.Context, orderID string, items []stockReservationItem) error {
	if len(items) == 0 {
		return ErrCheckoutSelectedItemNotFound
	}

	reservations := make([]domain.StockReservation, 0, len(items))
	for _, item := range items {
		if item.ProductID <= 0 || item.Quantity <= 0 {
			return ErrCheckoutInsufficientStock
		}

		reservations = append(reservations, domain.StockReservation{
			OrderID:   orderID,
			ProductID: item.ProductID,
			Quantity:  item.Quantity,
			Status:    stockReservationStatusReserved,
		})
	}

	if err := service.stockReservationRepository.CreateMany(ctx, reservations); err != nil {
		return err
	}

	reservedItems := make([]stockReservationItem, 0, len(items))
	for _, item := range items {
		ok, err := service.productRepository.DecreaseStockIfAvailable(ctx, item.ProductID, item.Quantity)
		if err != nil {
			_ = service.rollbackReservedStock(ctx, reservedItems)
			_ = service.stockReservationRepository.UpdateStatusByOrderID(ctx, orderID, stockReservationStatusReserved, stockReservationStatusReleased)
			return err
		}

		if !ok {
			_ = service.rollbackReservedStock(ctx, reservedItems)
			_ = service.stockReservationRepository.UpdateStatusByOrderID(ctx, orderID, stockReservationStatusReserved, stockReservationStatusReleased)
			return ErrCheckoutInsufficientStock
		}

		reservedItems = append(reservedItems, item)
	}

	return nil
}

func (service *checkoutService) rollbackReservedStock(ctx context.Context, items []stockReservationItem) error {
	for _, item := range items {
		if err := service.productRepository.IncreaseStock(ctx, item.ProductID, item.Quantity); err != nil {
			return err
		}
	}

	return nil
}

func (service *checkoutService) releaseStockForOrder(ctx context.Context, orderID string) error {
	reservations, err := service.stockReservationRepository.FindByOrderIDAndStatus(ctx, orderID, stockReservationStatusReserved)
	if err != nil {
		return err
	}

	if len(reservations) == 0 {
		return nil
	}

	for _, reservation := range reservations {
		if err := service.productRepository.IncreaseStock(ctx, reservation.ProductID, reservation.Quantity); err != nil {
			return err
		}
	}

	reservationIDs := make([]uint, 0, len(reservations))
	for _, reservation := range reservations {
		reservationIDs = append(reservationIDs, reservation.ID)
	}

	return service.stockReservationRepository.UpdateStatusByIDs(ctx, reservationIDs, stockReservationStatusReserved, stockReservationStatusReleased)
}

func (service *checkoutService) prepareCheckout(ctx context.Context, customerID uint, addressID uint, selectedCartItemIDs []uint) (*domain.CustomerAddress, *domain.Customer, float64, int, []ShippingRateItem, []checkoutLineItem, error) {
	address, err := service.customerAddressRepository.FindByID(ctx, customerID, addressID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, 0, 0, nil, nil, ErrCheckoutAddressNotFound
		}

		return nil, nil, 0, 0, nil, nil, err
	}

	customer, err := service.customerRepository.FindByID(ctx, customerID)
	if err != nil {
		return nil, nil, 0, 0, nil, nil, err
	}

	cart, err := service.cartRepository.GetCart(ctx, customerID)
	if err != nil {
		return nil, nil, 0, 0, nil, nil, err
	}

	if cart == nil || len(cart.Items) == 0 {
		return nil, nil, 0, 0, nil, nil, ErrCheckoutCartEmpty
	}

	selectedIDSet := make(map[uint]struct{}, len(selectedCartItemIDs))
	for _, selectedCartItemID := range selectedCartItemIDs {
		selectedIDSet[selectedCartItemID] = struct{}{}
	}

	matchedIDs := make(map[uint]struct{}, len(selectedIDSet))

	subtotal := 0.0
	totalWeight := 0
	shippingItems := make([]ShippingRateItem, 0, len(selectedCartItemIDs))
	transactionItems := make([]checkoutLineItem, 0, len(selectedCartItemIDs))

	for _, cartItem := range cart.Items {
		if _, selected := selectedIDSet[cartItem.ID]; !selected {
			continue
		}

		matchedIDs[cartItem.ID] = struct{}{}

		product, err := service.productRepository.FindByID(ctx, cartItem.ProductID)
		if err != nil {
			return nil, nil, 0, 0, nil, nil, err
		}

		lineTotal := product.BasePrice * float64(cartItem.Quantity)
		subtotal += lineTotal
		totalWeight += product.Weight * cartItem.Quantity

		shippingItems = append(shippingItems, ShippingRateItem{
			Name:        product.Name,
			Description: formatItemDescription(product.Description, cartItem.SelectedSize, cartItem.SelectedColorName),
			Value:       toIntegerAmount(product.BasePrice),
			Length:      maxInt(product.Length, 1),
			Width:       maxInt(product.Width, 1),
			Height:      maxInt(product.Height, 1),
			Weight:      maxInt(product.Weight, 1),
			Quantity:    maxInt(cartItem.Quantity, 1),
		})

		transactionItems = append(transactionItems, checkoutLineItem{
			TransactionItem: domain.TransactionItem{
				ProductID: product.ID,
				Quantity:  cartItem.Quantity,
				Price:     product.BasePrice,
			},
			ProductName: product.Name,
		})
	}

	if len(transactionItems) == 0 {
		return nil, nil, 0, 0, nil, nil, ErrCheckoutSelectedItemNotFound
	}

	if len(matchedIDs) != len(selectedIDSet) {
		return nil, nil, 0, 0, nil, nil, ErrCheckoutSelectedItemNotFound
	}

	return address, customer, subtotal, totalWeight, shippingItems, transactionItems, nil
}

func normalizeSelectedCartItemIDs(selectedCartItemIDs []uint) ([]uint, error) {
	if len(selectedCartItemIDs) == 0 {
		return nil, ErrCheckoutSelectedItemsEmpty
	}

	normalized := make([]uint, 0, len(selectedCartItemIDs))
	seen := make(map[uint]struct{}, len(selectedCartItemIDs))
	for _, selectedCartItemID := range selectedCartItemIDs {
		if selectedCartItemID == 0 {
			return nil, ErrInvalidShippingRequest
		}

		if _, exists := seen[selectedCartItemID]; exists {
			continue
		}

		seen[selectedCartItemID] = struct{}{}
		normalized = append(normalized, selectedCartItemID)
	}

	if len(normalized) == 0 {
		return nil, ErrCheckoutSelectedItemsEmpty
	}

	return normalized, nil
}

func (service *checkoutService) removeSelectedItemsFromCart(ctx context.Context, customerID uint, selectedCartItemIDs []uint) error {
	cart, err := service.cartRepository.GetCart(ctx, customerID)
	if err != nil {
		return err
	}

	if cart == nil || len(cart.Items) == 0 {
		return nil
	}

	selectedIDSet := make(map[uint]struct{}, len(selectedCartItemIDs))
	for _, selectedCartItemID := range selectedCartItemIDs {
		selectedIDSet[selectedCartItemID] = struct{}{}
	}

	filteredItems := make([]domain.CartItem, 0, len(cart.Items))
	removedCount := 0
	for _, cartItem := range cart.Items {
		if _, remove := selectedIDSet[cartItem.ID]; remove {
			removedCount++
			continue
		}

		filteredItems = append(filteredItems, cartItem)
	}

	if removedCount == 0 {
		return ErrCheckoutSelectedItemNotFound
	}

	cart.Items = filteredItems
	return service.cartRepository.SaveCart(ctx, cart)
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

	if midtransConfig := config.GetMidtransConfig(); midtransConfig.FinishURL != "" {
		request.Callbacks = &snap.Callbacks{Finish: midtransConfig.FinishURL}
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
		return "jne,sicepat,jnt,anteraja,ninja,tiki,pos"
	}
	return strings.ReplaceAll(trimmed, ":", ",")
}

func (service *checkoutService) lookupDestinationAreaID(ctx context.Context, address *domain.CustomerAddress) (string, error) {
	if address == nil {
		return "", ErrCheckoutAreaLookupFailed
	}

	storedDestinationID := strings.TrimSpace(address.DestinationAreaID)
	if storedDestinationID != "" {
		return storedDestinationID, nil
	}

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
		{address.District, address.City, address.Province, address.PostalCode},
		{address.City, address.Province, address.PostalCode},
		{address.FullAddress, address.City, address.Province, address.PostalCode},
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

func findRequestedRate(response *ShippingRatesResponse, courierName string, courierService string) (*ShippingRate, error) {
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
