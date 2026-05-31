package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/itdiagonals/website/backend/repository"
	"github.com/redis/go-redis/v9"
)

var ErrStockReservationUnavailable = errors.New("stock reservation service is unavailable")

const (
	stockReservationOrderKeyPrefix   = "stock_res:order:"
	stockReservationCounterKeyPrefix = "stock_res:qty:"
	stockReservationLockKeyPrefix    = "stock_res:lock:"
	stockReservationOrdersSetKey     = "stock_res:orders"
	stockReservationMaxRetries       = 5
	stockReservationLockTTL          = 30 * time.Second
)

type StockReservationService interface {
	Reserve(ctx context.Context, orderID string, items []stockReservationItem, ttl time.Duration) error
	Confirm(ctx context.Context, orderID string) error
	Release(ctx context.Context, orderID string) error
	IsAvailable(ctx context.Context, productID int, size string, color string, quantity int) (bool, error)
	GetAvailableStock(ctx context.Context, productID int, size string, color string) (int, error)
	GetReservedQuantity(ctx context.Context, productID int, size string, color string) (int, error)
	GetReservedProductQuantity(ctx context.Context, productID int) (int, error)
	CleanupOrderIndex(ctx context.Context) error
}

type redisReservationPayload struct {
	OrderID   string                 `json:"order_id"`
	Items     []stockReservationItem `json:"items"`
	Status    string                 `json:"status"`
	ExpiresAt time.Time              `json:"expires_at"`
}

type redisStockReservationService struct {
	redisClient       *redis.Client
	productRepository repository.ProductRepository
}

func NewRedisStockReservationService(redisClient *redis.Client, productRepository repository.ProductRepository) StockReservationService {
	return &redisStockReservationService{
		redisClient:       redisClient,
		productRepository: productRepository,
	}
}

func (service *redisStockReservationService) Reserve(ctx context.Context, orderID string, items []stockReservationItem, ttl time.Duration) error {
	if service.redisClient == nil || service.productRepository == nil {
		return ErrStockReservationUnavailable
	}

	normalizedItems := normalizeReservationItems(items)
	if strings.TrimSpace(orderID) == "" || len(normalizedItems) == 0 {
		return ErrCheckoutSelectedItemNotFound
	}
	if ttl <= 0 {
		ttl = stockReservationTTL
	}

	orderKey := reservationOrderKey(orderID)
	watchKeys := make([]string, 0, len(normalizedItems)+1)
	watchKeys = append(watchKeys, orderKey)
	for _, item := range normalizedItems {
		watchKeys = append(watchKeys, reservationCounterKey(item.ProductID, item.SelectedSize, item.SelectedColorName))
	}

	payload := redisReservationPayload{
		OrderID:   orderID,
		Items:     normalizedItems,
		Status:    stockReservationStatusReserved,
		ExpiresAt: time.Now().Add(ttl),
	}
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	for attempt := 0; attempt < stockReservationMaxRetries; attempt++ {
		err = service.redisClient.Watch(ctx, func(tx *redis.Tx) error {
			exists, err := tx.Exists(ctx, orderKey).Result()
			if err != nil {
				return err
			}
			if exists > 0 {
				return nil
			}

			for _, item := range normalizedItems {
				availableStock, err := service.GetAvailableStock(ctx, item.ProductID, item.SelectedSize, item.SelectedColorName)
				if err != nil {
					return err
				}
				if availableStock < item.Quantity {
					return ErrCheckoutInsufficientStock
				}
			}

			_, err = tx.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
				pipe.Set(ctx, orderKey, payloadBytes, ttl)
				pipe.SAdd(ctx, stockReservationOrdersSetKey, orderID)
				for _, item := range normalizedItems {
					pipe.IncrBy(ctx, reservationCounterKey(item.ProductID, item.SelectedSize, item.SelectedColorName), int64(item.Quantity))
				}
				return nil
			})
			return err
		}, watchKeys...)

		if err == nil {
			return nil
		}
		if !errors.Is(err, redis.TxFailedErr) {
			return err
		}
	}

	return ErrCheckoutInsufficientStock
}

func (service *redisStockReservationService) Confirm(ctx context.Context, orderID string) error {
	if service.redisClient == nil || service.productRepository == nil {
		return ErrStockReservationUnavailable
	}

	payload, err := service.getReservationPayload(ctx, orderID)
	if err != nil || payload == nil {
		return err
	}
	if payload.Status == stockReservationStatusConsumed {
		return service.deleteReservation(ctx, payload)
	}

	lockKey := reservationLockKey(orderID)
	acquired, err := service.redisClient.SetNX(ctx, lockKey, "1", stockReservationLockTTL).Result()
	if err != nil {
		return err
	}
	if !acquired {
		return nil
	}
	defer func() {
		_ = service.redisClient.Del(ctx, lockKey).Err()
	}()

	consumedItems := make([]stockReservationItem, 0, len(payload.Items))
	for _, item := range payload.Items {
		ok, err := service.productRepository.DecreaseVariantStockIfAvailable(ctx, item.ProductID, item.SelectedSize, item.SelectedColorName, item.Quantity)
		if err != nil {
			_ = service.rollbackConsumedStock(ctx, consumedItems)
			return err
		}
		if !ok {
			_ = service.rollbackConsumedStock(ctx, consumedItems)
			return ErrCheckoutInsufficientStock
		}
		consumedItems = append(consumedItems, item)
	}

	if err := service.markReservationStatus(ctx, payload, stockReservationStatusConsumed); err != nil {
		_ = service.rollbackConsumedStock(ctx, consumedItems)
		return err
	}
	payload.Status = stockReservationStatusConsumed

	return service.deleteReservation(ctx, payload)
}

func (service *redisStockReservationService) Release(ctx context.Context, orderID string) error {
	if service.redisClient == nil {
		return ErrStockReservationUnavailable
	}

	payload, err := service.getReservationPayload(ctx, orderID)
	if err != nil || payload == nil {
		if err == nil {
			return service.redisClient.SRem(ctx, stockReservationOrdersSetKey, orderID).Err()
		}
		return err
	}

	lockKey := reservationLockKey(orderID)
	acquired, err := service.redisClient.SetNX(ctx, lockKey, "1", stockReservationLockTTL).Result()
	if err != nil {
		return err
	}
	if !acquired {
		return nil
	}
	defer func() {
		_ = service.redisClient.Del(ctx, lockKey).Err()
	}()

	return service.deleteReservation(ctx, payload)
}

func (service *redisStockReservationService) IsAvailable(ctx context.Context, productID int, size string, color string, quantity int) (bool, error) {
	availableStock, err := service.GetAvailableStock(ctx, productID, size, color)
	if err != nil {
		return false, err
	}
	return availableStock >= quantity, nil
}

func (service *redisStockReservationService) GetAvailableStock(ctx context.Context, productID int, size string, color string) (int, error) {
	if service.productRepository == nil {
		return 0, ErrStockReservationUnavailable
	}

	dbStock, err := service.productRepository.FindVariantStock(ctx, productID, size, color)
	if err != nil {
		return 0, err
	}

	reservedQuantity, err := service.GetReservedQuantity(ctx, productID, size, color)
	if err != nil {
		return 0, err
	}

	availableStock := dbStock - reservedQuantity
	if availableStock < 0 {
		return 0, nil
	}

	return availableStock, nil
}

func (service *redisStockReservationService) GetReservedQuantity(ctx context.Context, productID int, size string, color string) (int, error) {
	if service.redisClient == nil {
		return 0, ErrStockReservationUnavailable
	}

	value, err := service.redisClient.Get(ctx, reservationCounterKey(productID, size, color)).Int()
	if errors.Is(err, redis.Nil) {
		return 0, nil
	}
	if err != nil {
		return 0, err
	}
	if value < 0 {
		return 0, nil
	}

	return value, nil
}

func (service *redisStockReservationService) GetReservedProductQuantity(ctx context.Context, productID int) (int, error) {
	if service.redisClient == nil {
		return 0, ErrStockReservationUnavailable
	}

	var (
		cursor uint64
		total  int
	)
	pattern := fmt.Sprintf("%s%d:*", stockReservationCounterKeyPrefix, productID)
	for {
		keys, nextCursor, err := service.redisClient.Scan(ctx, cursor, pattern, 100).Result()
		if err != nil {
			return 0, err
		}
		if len(keys) > 0 {
			values, err := service.redisClient.MGet(ctx, keys...).Result()
			if err != nil {
				return 0, err
			}
			for _, value := range values {
				switch typed := value.(type) {
				case string:
					var reserved int
					_, _ = fmt.Sscanf(typed, "%d", &reserved)
					if reserved > 0 {
						total += reserved
					}
				}
			}
		}
		cursor = nextCursor
		if cursor == 0 {
			break
		}
	}

	return total, nil
}

func (service *redisStockReservationService) CleanupOrderIndex(ctx context.Context) error {
	if service.redisClient == nil {
		return ErrStockReservationUnavailable
	}

	orderIDs, err := service.redisClient.SMembers(ctx, stockReservationOrdersSetKey).Result()
	if err != nil {
		return err
	}

	for _, orderID := range orderIDs {
		if strings.TrimSpace(orderID) == "" {
			continue
		}

		exists, err := service.redisClient.Exists(ctx, reservationOrderKey(orderID)).Result()
		if err != nil {
			return err
		}
		if exists == 0 {
			if err := service.redisClient.SRem(ctx, stockReservationOrdersSetKey, orderID).Err(); err != nil {
				return err
			}
		}
	}

	return nil
}

func (service *redisStockReservationService) getReservationPayload(ctx context.Context, orderID string) (*redisReservationPayload, error) {
	if strings.TrimSpace(orderID) == "" {
		return nil, nil
	}

	value, err := service.redisClient.Get(ctx, reservationOrderKey(orderID)).Bytes()
	if errors.Is(err, redis.Nil) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var payload redisReservationPayload
	if err := json.Unmarshal(value, &payload); err != nil {
		return nil, err
	}
	if strings.TrimSpace(payload.Status) == "" {
		payload.Status = stockReservationStatusReserved
	}

	payload.Items = normalizeReservationItems(payload.Items)
	if len(payload.Items) == 0 {
		return nil, nil
	}

	return &payload, nil
}

func (service *redisStockReservationService) markReservationStatus(ctx context.Context, payload *redisReservationPayload, status string) error {
	if payload == nil {
		return nil
	}

	payload.Status = status
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	ttl, err := service.redisClient.TTL(ctx, reservationOrderKey(payload.OrderID)).Result()
	if err != nil {
		return err
	}
	if ttl <= 0 {
		ttl = time.Minute
	}

	return service.redisClient.Set(ctx, reservationOrderKey(payload.OrderID), payloadBytes, ttl).Err()
}

func (service *redisStockReservationService) deleteReservation(ctx context.Context, payload *redisReservationPayload) error {
	if payload == nil {
		return nil
	}

	_, err := service.redisClient.TxPipelined(ctx, func(pipe redis.Pipeliner) error {
		for _, item := range payload.Items {
			pipe.DecrBy(ctx, reservationCounterKey(item.ProductID, item.SelectedSize, item.SelectedColorName), int64(item.Quantity))
		}
		pipe.Del(ctx, reservationOrderKey(payload.OrderID))
		pipe.SRem(ctx, stockReservationOrdersSetKey, payload.OrderID)
		return nil
	})
	if err != nil {
		return err
	}

	for _, item := range payload.Items {
		key := reservationCounterKey(item.ProductID, item.SelectedSize, item.SelectedColorName)
		val, getErr := service.redisClient.Get(ctx, key).Int()
		if getErr == nil && val <= 0 {
			_ = service.redisClient.Del(ctx, key).Err()
		}
	}

	return nil
}

func (service *redisStockReservationService) rollbackConsumedStock(ctx context.Context, items []stockReservationItem) error {
	for _, item := range items {
		if err := service.productRepository.IncreaseVariantStock(ctx, item.ProductID, item.SelectedSize, item.SelectedColorName, item.Quantity); err != nil {
			return err
		}
	}

	return nil
}

func normalizeReservationItems(items []stockReservationItem) []stockReservationItem {
	byVariant := make(map[string]stockReservationItem, len(items))
	for _, item := range items {
		if item.ProductID <= 0 || item.Quantity <= 0 {
			continue
		}

		normalizedSize := strings.TrimSpace(item.SelectedSize)
		normalizedColor := strings.TrimSpace(item.SelectedColorName)
		if normalizedSize == "" || normalizedColor == "" {
			continue
		}

		key := reservationVariantKey(item.ProductID, normalizedSize, normalizedColor)
		current := byVariant[key]
		if current.ProductID == 0 {
			current = stockReservationItem{
				ProductID:         item.ProductID,
				SelectedSize:      normalizedSize,
				SelectedColorName: normalizedColor,
				SelectedColorHex:  strings.TrimSpace(item.SelectedColorHex),
			}
		}
		current.Quantity += item.Quantity
		byVariant[key] = current
	}

	normalizedItems := make([]stockReservationItem, 0, len(byVariant))
	for _, item := range byVariant {
		normalizedItems = append(normalizedItems, item)
	}

	return normalizedItems
}

func reservationOrderKey(orderID string) string {
	return stockReservationOrderKeyPrefix + strings.TrimSpace(orderID)
}

func reservationLockKey(orderID string) string {
	return stockReservationLockKeyPrefix + strings.TrimSpace(orderID)
}

func reservationCounterKey(productID int, size string, color string) string {
	return stockReservationCounterKeyPrefix + reservationVariantKey(productID, size, color)
}

func reservationVariantKey(productID int, size string, color string) string {
	return fmt.Sprintf("%d:%s:%s", productID, normalizeReservationPart(size), normalizeReservationPart(color))
}

func normalizeReservationPart(value string) string {
	return strings.ToLower(strings.TrimSpace(value))
}
