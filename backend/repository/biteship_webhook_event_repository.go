package repository

import (
	"context"

	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type BiteshipWebhookEventRepository interface {
	CreateIfAbsent(ctx context.Context, event domain.BiteshipWebhookEvent) (bool, error)
}

type biteshipWebhookEventRepository struct {
	db *gorm.DB
}

func NewBiteshipWebhookEventRepository(db *gorm.DB) BiteshipWebhookEventRepository {
	return &biteshipWebhookEventRepository{db: db}
}

func (repository *biteshipWebhookEventRepository) CreateIfAbsent(ctx context.Context, event domain.BiteshipWebhookEvent) (bool, error) {
	result := repository.db.WithContext(ctx).
		Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "event_key"}}, DoNothing: true}).
		Create(&event)
	if result.Error != nil {
		return false, result.Error
	}

	return result.RowsAffected > 0, nil
}
