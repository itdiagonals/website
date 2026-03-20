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
	RemoveFromCartByID(context context.Context, customerID uint, cartItemID uint) (*domain.Cart, error)
	RemoveFromCart(context context.Context, customerID uint, item domain.CartItem) (*domain.Cart, error)
	UpdateQuantityByID(context context.Context, customerID uint, cartItemID uint, quantity int) (*domain.Cart, error)
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

	variantAvailableStock, variantFound := getVariantAvailableStock(detail, item.SelectedSize, item.SelectedColorName)
	if !variantFound {
		return nil, ErrInvalidCartItem
	}

	totalQuantityForVariant := item.Quantity
	for _, existingItem := range cart.Items {
		if isSameCartVariant(existingItem, item) {
			totalQuantityForVariant += existingItem.Quantity
		}
	}

	if totalQuantityForVariant > variantAvailableStock {
		return nil, &InsufficientStockError{Available: variantAvailableStock, Requested: totalQuantityForVariant}
	}

	item.ProductName = detail.Name
	item.Gender = detail.Gender
	item.ImageURL = detail.CoverImageURL
	item.BasePrice = detail.BasePrice
	item.AvailableStock = variantAvailableStock
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

		variantAvailableStock, variantFound := getVariantAvailableStock(detail, cart.Items[index].SelectedSize, cart.Items[index].SelectedColorName)
		totalQuantityForVariant := cart.Items[index].Quantity
		for itemIndex, item := range cart.Items {
			if itemIndex == index {
				continue
			}

			if isSameCartVariant(item, cart.Items[index]) {
				totalQuantityForVariant += item.Quantity
			}
		}

		cart.Items[index].ProductName = detail.Name
		cart.Items[index].Gender = detail.Gender
		cart.Items[index].ImageURL = detail.CoverImageURL
		cart.Items[index].BasePrice = detail.BasePrice
		cart.Items[index].AvailableStock = variantAvailableStock
		cart.Items[index].StockSufficient = variantFound && totalQuantityForVariant <= variantAvailableStock
		if !cart.Items[index].StockSufficient {
			if !variantFound {
				cart.Items[index].StockMessage = "selected variant is unavailable"
			} else if variantAvailableStock <= 0 {
				cart.Items[index].StockMessage = "stock is out"
			} else {
				cart.Items[index].StockMessage = fmt.Sprintf("stock is not enough, available %d item(s)", variantAvailableStock)
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

func (service *cartService) RemoveFromCartByID(context context.Context, customerID uint, cartItemID uint) (*domain.Cart, error) {
	if customerID == 0 || cartItemID == 0 {
		return nil, ErrInvalidCartItem
	}

	cart, err := service.cartRepository.GetCart(context, customerID)
	if err != nil {
		return nil, err
	}

	filteredItems := make([]domain.CartItem, 0, len(cart.Items))
	removed := false
	for _, existingItem := range cart.Items {
		if existingItem.ID == cartItemID {
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

	variantAvailableStock, variantFound := getVariantAvailableStock(detail, item.SelectedSize, item.SelectedColorName)
	if !variantFound {
		return nil, ErrInvalidCartItem
	}

	cart, err := service.cartRepository.GetCart(context, customerID)
	if err != nil {
		return nil, err
	}

	itemIndex := -1
	totalQuantityForVariant := 0
	for index, existingItem := range cart.Items {
		if isSameCartVariant(existingItem, item) {
			if itemIndex == -1 {
				itemIndex = index
				totalQuantityForVariant += item.Quantity
				continue
			}

			totalQuantityForVariant += existingItem.Quantity
		}
	}

	if itemIndex == -1 {
		return nil, ErrCartItemNotFound
	}

	if totalQuantityForVariant > variantAvailableStock {
		return nil, &InsufficientStockError{Available: variantAvailableStock, Requested: totalQuantityForVariant}
	}

	cart.Items[itemIndex].ProductName = detail.Name
	cart.Items[itemIndex].Gender = detail.Gender
	cart.Items[itemIndex].ImageURL = detail.CoverImageURL
	cart.Items[itemIndex].BasePrice = detail.BasePrice
	cart.Items[itemIndex].AvailableStock = variantAvailableStock
	cart.Items[itemIndex].StockSufficient = true
	cart.Items[itemIndex].StockMessage = ""
	cart.Items[itemIndex].Quantity = item.Quantity
	cart.Items[itemIndex].Subtotal = calculateSubtotal(detail.BasePrice, item.Quantity)

	if err := service.cartRepository.SaveCart(context, cart); err != nil {
		return nil, err
	}

	return cart, nil
}

func (service *cartService) UpdateQuantityByID(context context.Context, customerID uint, cartItemID uint, quantity int) (*domain.Cart, error) {
	if customerID == 0 || cartItemID == 0 || quantity <= 0 {
		return nil, ErrInvalidCartItem
	}

	cart, err := service.cartRepository.GetCart(context, customerID)
	if err != nil {
		return nil, err
	}

	itemIndex := findCartItemIndexByID(cart.Items, cartItemID)
	if itemIndex == -1 {
		return nil, ErrCartItemNotFound
	}

	targetItem := cart.Items[itemIndex]
	detail, err := service.productRepository.FindDetailByID(context, targetItem.ProductID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCartProductNotFound
		}

		return nil, err
	}

	if !isAvailableSize(detail.AvailableSizes, targetItem.SelectedSize) || !isAvailableColor(detail.AvailableColors, targetItem.SelectedColorName, targetItem.SelectedColorHex) {
		return nil, ErrInvalidCartItem
	}

	variantAvailableStock, variantFound := getVariantAvailableStock(detail, targetItem.SelectedSize, targetItem.SelectedColorName)
	if !variantFound {
		return nil, ErrInvalidCartItem
	}

	totalQuantityForVariant := 0
	for index, existingItem := range cart.Items {
		if !isSameCartVariant(existingItem, targetItem) {
			continue
		}

		if index == itemIndex {
			totalQuantityForVariant += quantity
			continue
		}

		totalQuantityForVariant += existingItem.Quantity
	}

	if totalQuantityForVariant > variantAvailableStock {
		return nil, &InsufficientStockError{Available: variantAvailableStock, Requested: totalQuantityForVariant}
	}

	cart.Items[itemIndex].ProductName = detail.Name
	cart.Items[itemIndex].Gender = detail.Gender
	cart.Items[itemIndex].ImageURL = detail.CoverImageURL
	cart.Items[itemIndex].BasePrice = detail.BasePrice
	cart.Items[itemIndex].AvailableStock = variantAvailableStock
	cart.Items[itemIndex].StockSufficient = true
	cart.Items[itemIndex].StockMessage = ""
	cart.Items[itemIndex].Quantity = quantity
	cart.Items[itemIndex].Subtotal = calculateSubtotal(detail.BasePrice, quantity)

	if err := service.cartRepository.SaveCart(context, cart); err != nil {
		return nil, err
	}

	return cart, nil
}

func findCartItemIndexByID(items []domain.CartItem, cartItemID uint) int {
	for index, item := range items {
		if item.ID == cartItemID {
			return index
		}
	}

	return -1
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

func getVariantAvailableStock(detail *domain.ProductDetail, selectedSize string, selectedColorName string) (int, bool) {
	if detail == nil {
		return 0, false
	}

	normalizedSize := strings.ToLower(strings.TrimSpace(selectedSize))
	normalizedColor := strings.ToLower(strings.TrimSpace(selectedColorName))
	if normalizedSize == "" || normalizedColor == "" {
		return 0, false
	}

	if len(detail.Variants) == 0 {
		return detail.Stock, true
	}

	for _, variant := range detail.Variants {
		if strings.ToLower(strings.TrimSpace(variant.Size)) == normalizedSize && strings.ToLower(strings.TrimSpace(variant.ColorName)) == normalizedColor {
			return variant.Stock, true
		}
	}

	return 0, false
}

func calculateSubtotal(basePrice float64, quantity int) float64 {
	subtotal := basePrice * float64(quantity)
	return math.Round(subtotal*100) / 100
}
