package service

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
)

type ShippingBookingService interface {
	BookShipmentForOrder(ctx context.Context, orderID string) error
}

type shippingBookingService struct {
	transactionRepository repository.TransactionRepository
	productRepository     repository.ProductRepository
	shippingService       ShippingService
}

func NewShippingBookingService(
	transactionRepository repository.TransactionRepository,
	productRepository repository.ProductRepository,
	shippingService ShippingService,
) ShippingBookingService {
	return &shippingBookingService{
		transactionRepository: transactionRepository,
		productRepository:     productRepository,
		shippingService:       shippingService,
	}
}

func (service *shippingBookingService) BookShipmentForOrder(ctx context.Context, orderID string) error {
	if service.shippingService == nil {
		return nil
	}

	transaction, err := service.transactionRepository.FindByOrderIDWithDetails(ctx, orderID)
	if err != nil {
		return err
	}
	if transaction == nil {
		return ErrMidtransOrderNotFound
	}

	if strings.TrimSpace(transaction.BiteshipOrderID) != "" {
		return nil
	}

	destinationAreaID := strings.TrimSpace(transaction.ShippingAddress.DestinationAreaID)
	if destinationAreaID == "" {
		lookupQuery := strings.TrimSpace(strings.Join([]string{
			transaction.ShippingAddress.FullAddress,
			transaction.ShippingAddress.Village,
			transaction.ShippingAddress.District,
			transaction.ShippingAddress.City,
			transaction.ShippingAddress.Province,
			transaction.ShippingAddress.PostalCode,
		}, " "))
		destination, lookupErr := service.shippingService.LookupDestination(ctx, lookupQuery)
		if lookupErr != nil {
			return lookupErr
		}
		destinationAreaID = strings.TrimSpace(destination.ID)
	}

	orderItems, err := service.buildShippingOrderItems(ctx, transaction.Items)
	if err != nil {
		return err
	}

	booking, err := service.shippingService.CreateOrder(ctx, CreateShippingOrderRequest{
		ReferenceID:             transaction.OrderID,
		CourierCompany:          transaction.CourierName,
		CourierType:             transaction.CourierService,
		DestinationContactName:  strings.TrimSpace(transaction.ShippingAddress.RecipientName),
		DestinationContactPhone: strings.TrimSpace(transaction.ShippingAddress.PhoneNumber),
		DestinationAddress:      strings.TrimSpace(transaction.ShippingAddress.FullAddress),
		DestinationPostalCode:   strings.TrimSpace(transaction.ShippingAddress.PostalCode),
		DestinationAreaID:       destinationAreaID,
		OrderNote:               "Paid order from Diagonals",
		Items:                   orderItems,
	})
	if err != nil {
		return err
	}

	if booking == nil || strings.TrimSpace(booking.OrderID) == "" {
		return errors.New("biteship booking response is empty")
	}

	shippingStatus := strings.TrimSpace(booking.ShippingStatus)
	if shippingStatus == "" {
		shippingStatus = "booked"
	}

	return service.transactionRepository.SetBiteshipBooking(
		ctx,
		orderID,
		strings.TrimSpace(booking.OrderID),
		firstNonEmpty(strings.TrimSpace(booking.ReferenceID), strings.TrimSpace(transaction.OrderID)),
		strings.TrimSpace(booking.TrackingNumber),
		shippingStatus,
	)
}

func (service *shippingBookingService) buildShippingOrderItems(ctx context.Context, transactionItems []domain.TransactionItem) ([]ShippingOrderItem, error) {
	if len(transactionItems) == 0 {
		return nil, ErrMidtransInvalidPayload
	}

	productsByID := make(map[int]*domain.Product)
	items := make([]ShippingOrderItem, 0, len(transactionItems))
	for _, transactionItem := range transactionItems {
		if transactionItem.ProductID <= 0 || transactionItem.Quantity <= 0 {
			continue
		}

		product, exists := productsByID[transactionItem.ProductID]
		if !exists {
			loadedProduct, err := service.productRepository.FindByID(ctx, transactionItem.ProductID)
			if err != nil {
				return nil, err
			}
			productsByID[transactionItem.ProductID] = loadedProduct
			product = loadedProduct
		}

		name := fmt.Sprintf("Product %d", transactionItem.ProductID)
		description := formatItemDescription("", transactionItem.SelectedSize, transactionItem.SelectedColor)
		if product != nil {
			if strings.TrimSpace(product.Name) != "" {
				name = strings.TrimSpace(product.Name)
			}
			description = formatItemDescription(product.Description, transactionItem.SelectedSize, transactionItem.SelectedColor)
		}

		items = append(items, ShippingOrderItem{
			Name:        name,
			Description: description,
			Value:       toIntegerAmount(transactionItem.Price),
			Length:      maxInt(productLength(product), 1),
			Width:       maxInt(productWidth(product), 1),
			Height:      maxInt(productHeight(product), 1),
			Weight:      maxInt(productWeight(product), 1),
			Quantity:    maxInt(transactionItem.Quantity, 1),
		})
	}

	if len(items) == 0 {
		return nil, ErrMidtransInvalidPayload
	}

	return items, nil
}

func productWeight(product *domain.Product) int {
	if product == nil {
		return 0
	}
	return product.Weight
}

func productLength(product *domain.Product) int {
	if product == nil {
		return 0
	}
	return product.Length
}

func productWidth(product *domain.Product) int {
	if product == nil {
		return 0
	}
	return product.Width
}

func productHeight(product *domain.Product) int {
	if product == nil {
		return 0
	}
	return product.Height
}
