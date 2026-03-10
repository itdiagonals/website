package service

import (
	"context"
	"errors"
	"fmt"
	"math"
	"strings"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
	"gorm.io/gorm"
)

var (
	ErrInvalidCartItem     = errors.New("invalid cart item")
	ErrCartProductNotFound = errors.New("product not found")
	ErrCartItemNotFound    = errors.New("cart item not found")
)

type InsufficientStockError struct {
	Available int
	Requested int
}

func (error *InsufficientStockError) Error() string {
	if error.Available <= 0 {
		return "stock is out"
	}

	return fmt.Sprintf("insufficient stock: only %d item(s) available", error.Available)
}

type CartService interface {
	AddToCart(context context.Context, customerID uint, item domain.CartItem) (*domain.Cart, error)
	GetMyCart(context context.Context, customerID uint) (*domain.Cart, error)
	RemoveFromCart(context context.Context, customerID uint, item domain.CartItem) (*domain.Cart, error)
	UpdateQuantity(context context.Context, customerID uint, item domain.CartItem) (*domain.Cart, error)
}

type cartService struct {
	cartRepository    repository.CartRepository
	productRepository repository.ProductRepository
}

func NewCartService(cartRepository repository.CartRepository, productRepository repository.ProductRepository) CartService {
	return &cartService{
		cartRepository:    cartRepository,
		productRepository: productRepository,
	}
}

func (service *cartService) AddToCart(context context.Context, customerID uint, item domain.CartItem) (*domain.Cart, error) {
	item.SelectedSize = strings.TrimSpace(item.SelectedSize)
	item.SelectedColorName = strings.TrimSpace(item.SelectedColorName)
	item.SelectedColorHex = strings.TrimSpace(item.SelectedColorHex)

	if item.ProductID <= 0 || item.Quantity <= 0 || item.SelectedSize == "" || item.SelectedColorName == "" {
		return nil, ErrInvalidCartItem
	}

	detail, err := service.productRepository.FindDetailByID(context, item.ProductID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCartProductNotFound
		}

		return nil, err
	}

	if !isAvailableSize(detail.AvailableSizes, item.SelectedSize) || !isAvailableColor(detail.AvailableColors, item.SelectedColorName, item.SelectedColorHex) {
		return nil, ErrInvalidCartItem
	}

	cart, err := service.cartRepository.GetCart(context, customerID)
	if err != nil {
		return nil, err
	}

	totalQuantityForProduct := item.Quantity
	for _, existingItem := range cart.Items {
		if existingItem.ProductID == item.ProductID {
			totalQuantityForProduct += existingItem.Quantity
		}
	}

	if totalQuantityForProduct > detail.Stock {
		return nil, &InsufficientStockError{Available: detail.Stock, Requested: totalQuantityForProduct}
	}

	item.ProductName = detail.Name
	item.Gender = detail.Gender
	item.ImageURL = detail.CoverImageURL
	item.BasePrice = detail.BasePrice
	item.AvailableStock = detail.Stock
	item.StockSufficient = true
	item.Subtotal = calculateSubtotal(detail.BasePrice, item.Quantity)

	if cart.CustomerID == 0 {
		cart.CustomerID = customerID
	}

	for index := range cart.Items {
		if isSameCartVariant(cart.Items[index], item) {
			cart.Items[index].ProductName = item.ProductName
			cart.Items[index].Gender = item.Gender
			cart.Items[index].ImageURL = item.ImageURL
			cart.Items[index].BasePrice = item.BasePrice
			cart.Items[index].Quantity += item.Quantity
			cart.Items[index].Subtotal = calculateSubtotal(cart.Items[index].BasePrice, cart.Items[index].Quantity)
			if err := service.cartRepository.SaveCart(context, cart); err != nil {
				return nil, err
			}

			return cart, nil
		}
	}

	cart.Items = append(cart.Items, item)
	if err := service.cartRepository.SaveCart(context, cart); err != nil {
		return nil, err
	}

	return cart, nil
}

func (service *cartService) GetMyCart(context context.Context, customerID uint) (*domain.Cart, error) {
	cart, err := service.cartRepository.GetCart(context, customerID)
	if err != nil {
		return nil, err
	}

	for index := range cart.Items {
		detail, err := service.productRepository.FindDetailByID(context, cart.Items[index].ProductID)
		if err != nil {
			cart.Items[index].AvailableStock = 0
			cart.Items[index].StockSufficient = false
			cart.Items[index].StockMessage = "product is unavailable"
			cart.Items[index].Subtotal = calculateSubtotal(cart.Items[index].BasePrice, cart.Items[index].Quantity)
			continue
		}

		totalQuantityForProduct := 0
		for _, item := range cart.Items {
			if item.ProductID == cart.Items[index].ProductID {
				totalQuantityForProduct += item.Quantity
			}
		}

		cart.Items[index].ProductName = detail.Name
		cart.Items[index].Gender = detail.Gender
		cart.Items[index].ImageURL = detail.CoverImageURL
		cart.Items[index].BasePrice = detail.BasePrice
		cart.Items[index].AvailableStock = detail.Stock
		cart.Items[index].StockSufficient = totalQuantityForProduct <= detail.Stock
		if !cart.Items[index].StockSufficient {
			if detail.Stock <= 0 {
				cart.Items[index].StockMessage = "stock is out"
			} else {
				cart.Items[index].StockMessage = fmt.Sprintf("stock is not enough, available %d item(s)", detail.Stock)
			}
		} else {
			cart.Items[index].StockMessage = ""
		}
		cart.Items[index].Subtotal = calculateSubtotal(detail.BasePrice, cart.Items[index].Quantity)
	}

	return cart, nil
}

func (service *cartService) RemoveFromCart(context context.Context, customerID uint, item domain.CartItem) (*domain.Cart, error) {
	item.SelectedSize = strings.TrimSpace(item.SelectedSize)
	item.SelectedColorName = strings.TrimSpace(item.SelectedColorName)
	item.SelectedColorHex = strings.TrimSpace(item.SelectedColorHex)

	if item.ProductID <= 0 || item.SelectedSize == "" || item.SelectedColorName == "" {
		return nil, ErrInvalidCartItem
	}

	cart, err := service.cartRepository.GetCart(context, customerID)
	if err != nil {
		return nil, err
	}

	filteredItems := make([]domain.CartItem, 0, len(cart.Items))
	removed := false
	for _, existingItem := range cart.Items {
		if isSameCartVariant(existingItem, item) {
			removed = true
			continue
		}

		filteredItems = append(filteredItems, existingItem)
	}

	if !removed {
		return nil, ErrCartItemNotFound
	}

	cart.Items = filteredItems
	if err := service.cartRepository.SaveCart(context, cart); err != nil {
		return nil, err
	}

	return cart, nil
}

func (service *cartService) UpdateQuantity(context context.Context, customerID uint, item domain.CartItem) (*domain.Cart, error) {
	item.SelectedSize = strings.TrimSpace(item.SelectedSize)
	item.SelectedColorName = strings.TrimSpace(item.SelectedColorName)
	item.SelectedColorHex = strings.TrimSpace(item.SelectedColorHex)

	if item.ProductID <= 0 || item.Quantity <= 0 || item.SelectedSize == "" || item.SelectedColorName == "" {
		return nil, ErrInvalidCartItem
	}

	detail, err := service.productRepository.FindDetailByID(context, item.ProductID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCartProductNotFound
		}

		return nil, err
	}

	if !isAvailableSize(detail.AvailableSizes, item.SelectedSize) || !isAvailableColor(detail.AvailableColors, item.SelectedColorName, item.SelectedColorHex) {
		return nil, ErrInvalidCartItem
	}

	cart, err := service.cartRepository.GetCart(context, customerID)
	if err != nil {
		return nil, err
	}

	itemIndex := -1
	totalQuantityForProduct := 0
	for index, existingItem := range cart.Items {
		if existingItem.ProductID == item.ProductID {
			if isSameCartVariant(existingItem, item) {
				itemIndex = index
				totalQuantityForProduct += item.Quantity
				continue
			}

			totalQuantityForProduct += existingItem.Quantity
		}
	}

	if itemIndex == -1 {
		return nil, ErrCartItemNotFound
	}

	if totalQuantityForProduct > detail.Stock {
		return nil, &InsufficientStockError{Available: detail.Stock, Requested: totalQuantityForProduct}
	}

	cart.Items[itemIndex].ProductName = detail.Name
	cart.Items[itemIndex].Gender = detail.Gender
	cart.Items[itemIndex].ImageURL = detail.CoverImageURL
	cart.Items[itemIndex].BasePrice = detail.BasePrice
	cart.Items[itemIndex].AvailableStock = detail.Stock
	cart.Items[itemIndex].StockSufficient = true
	cart.Items[itemIndex].StockMessage = ""
	cart.Items[itemIndex].Quantity = item.Quantity
	cart.Items[itemIndex].Subtotal = calculateSubtotal(detail.BasePrice, item.Quantity)

	if err := service.cartRepository.SaveCart(context, cart); err != nil {
		return nil, err
	}

	return cart, nil
}

func isSameCartVariant(existing domain.CartItem, candidate domain.CartItem) bool {
	if existing.ProductID != candidate.ProductID ||
		existing.SelectedSize != candidate.SelectedSize ||
		!strings.EqualFold(existing.SelectedColorName, candidate.SelectedColorName) {
		return false
	}

	if strings.TrimSpace(existing.SelectedColorHex) == "" || strings.TrimSpace(candidate.SelectedColorHex) == "" {
		return true
	}

	return strings.EqualFold(existing.SelectedColorHex, candidate.SelectedColorHex)
}

func isAvailableSize(sizes []domain.ProductSizeOption, selectedSize string) bool {
	for _, size := range sizes {
		if strings.EqualFold(strings.TrimSpace(size.Size), selectedSize) {
			return true
		}
	}

	return false
}

func isAvailableColor(colors []domain.ProductColorOption, colorName string, colorHex string) bool {
	for _, color := range colors {
		if strings.EqualFold(strings.TrimSpace(color.ColorName), colorName) {
			if colorHex == "" || strings.EqualFold(strings.TrimSpace(color.HexCode), colorHex) {
				return true
			}
		}
	}

	return false
}

func calculateSubtotal(basePrice float64, quantity int) float64 {
	subtotal := basePrice * float64(quantity)
	return math.Round(subtotal*100) / 100
}
