package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"time"

	"github.com/itdiagonals/website/backend/config"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type CartRepository interface {
	GetCart(context context.Context, customerID uint) (*domain.Cart, error)
	SaveCart(context context.Context, cart *domain.Cart) error
}

type cartRepository struct {
	db          *gorm.DB
	redisClient *redis.Client
	cacheTTL    time.Duration
}

func NewCartRepository(db *gorm.DB, redisClient *redis.Client) CartRepository {
	return &cartRepository{
		db:          db,
		redisClient: redisClient,
		cacheTTL:    getCartCacheTTL(),
	}
}

func (repository *cartRepository) GetCart(context context.Context, customerID uint) (*domain.Cart, error) {
	if repository.redisClient != nil {
		value, err := repository.redisClient.Get(context, repository.key(customerID)).Result()
		if err == nil {
			var cart domain.Cart
			if err := json.Unmarshal([]byte(value), &cart); err == nil {
				if cart.Items == nil {
					cart.Items = []domain.CartItem{}
				}
				return &cart, nil
			}
		}
		if err != nil && err != redis.Nil {
			return nil, err
		}
	}

	cart, err := repository.loadCartFromDatabase(context, customerID)
	if err != nil {
		return nil, err
	}

	repository.setCache(context, cart)

	return cart, nil
}

func (repository *cartRepository) SaveCart(context context.Context, cart *domain.Cart) error {
	if err := repository.db.WithContext(context).Transaction(func(tx *gorm.DB) error {
		var cartRecord domain.CartRecord
		err := tx.Where("customer_id = ?", cart.CustomerID).First(&cartRecord).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				cartRecord = domain.CartRecord{CustomerID: cart.CustomerID}
				if err := tx.Create(&cartRecord).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}

		if err := tx.Where("cart_id = ?", cartRecord.ID).Delete(&domain.CartItemRecord{}).Error; err != nil {
			return err
		}

		if len(cart.Items) == 0 {
			return tx.Model(&cartRecord).Update("updated_at", time.Now()).Error
		}

		items := make([]domain.CartItemRecord, 0, len(cart.Items))
		for _, item := range cart.Items {
			items = append(items, domain.CartItemRecord{
				CartID:            cartRecord.ID,
				ProductID:         item.ProductID,
				ProductName:       item.ProductName,
				Gender:            item.Gender,
				ImageURL:          item.ImageURL,
				BasePrice:         item.BasePrice,
				Quantity:          item.Quantity,
				SelectedSize:      item.SelectedSize,
				SelectedColorName: item.SelectedColorName,
				SelectedColorHex:  item.SelectedColorHex,
			})
		}

		if err := tx.Create(&items).Error; err != nil {
			return err
		}

		return tx.Model(&cartRecord).Update("updated_at", time.Now()).Error
	}); err != nil {
		return err
	}

	repository.setCache(context, cart)
	return nil
}

func (repository *cartRepository) key(customerID uint) string {
	return fmt.Sprintf("cart:customer:%d", customerID)
}

func (repository *cartRepository) loadCartFromDatabase(context context.Context, customerID uint) (*domain.Cart, error) {
	var cartRecord domain.CartRecord
	err := repository.db.WithContext(context).Preload("Items").Where("customer_id = ?", customerID).First(&cartRecord).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return &domain.Cart{CustomerID: customerID, Items: []domain.CartItem{}}, nil
		}

		return nil, err
	}

	items := make([]domain.CartItem, 0, len(cartRecord.Items))
	for _, item := range cartRecord.Items {
		items = append(items, domain.CartItem{
			ProductID:         item.ProductID,
			ProductName:       item.ProductName,
			Gender:            item.Gender,
			ImageURL:          item.ImageURL,
			BasePrice:         item.BasePrice,
			Quantity:          item.Quantity,
			Subtotal:          item.BasePrice * float64(item.Quantity),
			SelectedSize:      item.SelectedSize,
			SelectedColorName: item.SelectedColorName,
			SelectedColorHex:  item.SelectedColorHex,
		})
	}

	return &domain.Cart{CustomerID: customerID, Items: items}, nil
}

func (repository *cartRepository) setCache(context context.Context, cart *domain.Cart) {
	if repository.redisClient == nil {
		return
	}

	payload, err := json.Marshal(cart)
	if err != nil {
		return
	}

	_ = repository.redisClient.Set(context, repository.key(cart.CustomerID), payload, repository.cacheTTL).Err()
}

func getCartCacheTTL() time.Duration {
	config.LoadEnv()

	value := os.Getenv("CART_CACHE_TTL")
	if value == "" {
		return 24 * time.Hour
	}

	duration, err := time.ParseDuration(value)
	if err != nil {
		return 24 * time.Hour
	}

	return duration
}
