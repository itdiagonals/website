package repository

import (
	"context"
	"time"

	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const (
	ShippingJobTypeBookShipment = "book_shipment"

	ShippingJobStatusQueued     = "queued"
	ShippingJobStatusProcessing = "processing"
	ShippingJobStatusSucceeded  = "succeeded"
	ShippingJobStatusFailed     = "failed"
)

type ShippingJobRepository interface {
	EnqueueBookShipment(ctx context.Context, orderID string) error
	ClaimNext(ctx context.Context) (*domain.ShippingJob, error)
	MarkSucceeded(ctx context.Context, id uint) error
	MarkRetry(ctx context.Context, id uint, nextRunAt time.Time, lastError string) error
	MarkFailed(ctx context.Context, id uint, lastError string) error
}

type shippingJobRepository struct {
	db *gorm.DB
}

func NewShippingJobRepository(db *gorm.DB) ShippingJobRepository {
	return &shippingJobRepository{db: db}
}

func (repository *shippingJobRepository) EnqueueBookShipment(ctx context.Context, orderID string) error {
	now := time.Now().UTC()
	job := domain.ShippingJob{
		JobType:     ShippingJobTypeBookShipment,
		OrderID:     orderID,
		Status:      ShippingJobStatusQueued,
		Attempts:    0,
		MaxAttempts: 8,
		NextRunAt:   now,
		LockedAt:    nil,
		LastError:   "",
	}

	return repository.db.WithContext(ctx).
		Clauses(clause.OnConflict{
			Columns: []clause.Column{{Name: "job_type"}, {Name: "order_id"}},
			DoUpdates: clause.Assignments(map[string]any{
				"status":      ShippingJobStatusQueued,
				"attempts":    0,
				"next_run_at": now,
				"locked_at":   nil,
				"last_error":  "",
				"updated_at":  now,
			}),
		}).
		Create(&job).Error
}

func (repository *shippingJobRepository) ClaimNext(ctx context.Context) (*domain.ShippingJob, error) {
	var claimed *domain.ShippingJob
	err := repository.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		now := time.Now().UTC()
		staleLockCutoff := now.Add(-15 * time.Minute)

		var job domain.ShippingJob
		result := tx.Clauses(clause.Locking{Strength: "UPDATE", Options: "SKIP LOCKED"}).
			Where(
				"(status = ? AND next_run_at <= ?) OR (status = ? AND locked_at IS NOT NULL AND locked_at <= ?)",
				ShippingJobStatusQueued,
				now,
				ShippingJobStatusProcessing,
				staleLockCutoff,
			).
			Order("next_run_at ASC, id ASC").
			Limit(1).
			Find(&job)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return nil
		}

		job.Status = ShippingJobStatusProcessing
		job.LockedAt = &now
		if err := tx.Save(&job).Error; err != nil {
			return err
		}
		claimed = &job
		return nil
	})
	if err != nil {
		return nil, err
	}

	return claimed, nil
}

func (repository *shippingJobRepository) MarkSucceeded(ctx context.Context, id uint) error {
	return repository.db.WithContext(ctx).
		Model(&domain.ShippingJob{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"status":     ShippingJobStatusSucceeded,
			"locked_at":  nil,
			"last_error": "",
		}).Error
}

func (repository *shippingJobRepository) MarkRetry(ctx context.Context, id uint, nextRunAt time.Time, lastError string) error {
	return repository.db.WithContext(ctx).
		Model(&domain.ShippingJob{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"status":      ShippingJobStatusQueued,
			"attempts":    gorm.Expr("attempts + 1"),
			"next_run_at": nextRunAt,
			"locked_at":   nil,
			"last_error":  lastError,
		}).Error
}

func (repository *shippingJobRepository) MarkFailed(ctx context.Context, id uint, lastError string) error {
	return repository.db.WithContext(ctx).
		Model(&domain.ShippingJob{}).
		Where("id = ?", id).
		Updates(map[string]any{
			"status":     ShippingJobStatusFailed,
			"locked_at":  nil,
			"last_error": lastError,
		}).Error
}
