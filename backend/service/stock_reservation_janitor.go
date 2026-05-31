package service

import (
	"context"
	"errors"
	"time"

	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/itdiagonals/website/backend/repository"
	"gorm.io/gorm"
)

type StockReservationJanitor interface {
	Start(ctx context.Context)
}

type stockReservationJanitor struct {
	transactionRepository   repository.TransactionRepository
	stockReservationService StockReservationService
	pollInterval            time.Duration
	stalePendingAge         time.Duration
}

func NewStockReservationJanitor(transactionRepository repository.TransactionRepository, stockReservationService StockReservationService) StockReservationJanitor {
	return &stockReservationJanitor{
		transactionRepository:   transactionRepository,
		stockReservationService: stockReservationService,
		pollInterval:            10 * time.Minute,
		stalePendingAge:         2 * time.Hour,
	}
}

func (janitor *stockReservationJanitor) Start(ctx context.Context) {
	if janitor == nil || janitor.transactionRepository == nil || janitor.stockReservationService == nil {
		return
	}

	janitor.runOnce(ctx)

	ticker := time.NewTicker(janitor.pollInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			janitor.runOnce(ctx)
		}
	}
}

func (janitor *stockReservationJanitor) runOnce(ctx context.Context) {
	if err := janitor.stockReservationService.CleanupOrderIndex(ctx); err != nil {
		logger.Warn("stock reservation janitor cleanup failed", "error", err.Error())
		return
	}

	orderIDs, err := janitor.listActiveOrders(ctx)
	if err != nil {
		logger.Warn("stock reservation janitor list failed", "error", err.Error())
		return
	}

	now := time.Now()
	for _, orderID := range orderIDs {
		transaction, err := janitor.transactionRepository.FindByOrderID(ctx, orderID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				if releaseErr := janitor.stockReservationService.Release(ctx, orderID); releaseErr != nil {
					logger.Warn("stock reservation janitor release failed for missing transaction", "order_id", orderID, "error", releaseErr.Error())
				}
				continue
			}
			logger.Warn("stock reservation janitor lookup failed", "order_id", orderID, "error", err.Error())
			continue
		}

		switch transaction.Status {
		case "paid":
			if err := janitor.stockReservationService.Confirm(ctx, orderID); err != nil {
				logger.Warn("stock reservation janitor confirm failed", "order_id", orderID, "error", err.Error())
			}
		case "failed", "refunded":
			if err := janitor.stockReservationService.Release(ctx, orderID); err != nil {
				logger.Warn("stock reservation janitor release failed", "order_id", orderID, "error", err.Error())
			}
		case "pending":
			if now.Sub(transaction.CreatedAt) >= janitor.stalePendingAge {
				if err := janitor.transactionRepository.UpdateStatusByOrderID(ctx, orderID, "failed"); err != nil {
					logger.Warn("stock reservation janitor status update failed", "order_id", orderID, "error", err.Error())
					continue
				}
				if err := janitor.stockReservationService.Release(ctx, orderID); err != nil {
					logger.Warn("stock reservation janitor stale release failed", "order_id", orderID, "error", err.Error())
				}
			}
		}
	}
}

func (janitor *stockReservationJanitor) listActiveOrders(ctx context.Context) ([]string, error) {
	reservationService, ok := janitor.stockReservationService.(*redisStockReservationService)
	if !ok || reservationService.redisClient == nil {
		return nil, ErrStockReservationUnavailable
	}

	return reservationService.redisClient.SMembers(ctx, stockReservationOrdersSetKey).Result()
}
