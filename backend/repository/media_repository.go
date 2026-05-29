package repository

import (
	"context"
	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type MediaRepository interface {
	FindAll(ctx context.Context, page, limit int) ([]domain.Media, int64, error)
	FindByID(ctx context.Context, id int) (*domain.Media, error)
	FindByDraftID(ctx context.Context, draftID string) ([]domain.Media, error)
	Create(ctx context.Context, media *domain.Media) error
	Update(ctx context.Context, media *domain.Media) error
	Delete(ctx context.Context, id int) error
	ClearDraftID(ctx context.Context, draftID string) error
}

type mediaRepository struct {
	db *gorm.DB
}

func NewMediaRepository(db *gorm.DB) MediaRepository {
	return &mediaRepository{db: db}
}

func (r *mediaRepository) FindAll(ctx context.Context, page, limit int) ([]domain.Media, int64, error) {
	var media []domain.Media
	var total int64

	if err := r.db.WithContext(ctx).Model(&domain.Media{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.WithContext(ctx).Offset((page - 1) * limit).Limit(limit).Find(&media).Error; err != nil {
		return nil, 0, err
	}
	return media, total, nil
}

func (r *mediaRepository) FindByID(ctx context.Context, id int) (*domain.Media, error) {
	var m domain.Media
	if err := r.db.WithContext(ctx).First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *mediaRepository) FindByDraftID(ctx context.Context, draftID string) ([]domain.Media, error) {
	var media []domain.Media
	if err := r.db.WithContext(ctx).Where("draft_id = ?", draftID).Order("created_at DESC").Find(&media).Error; err != nil {
		return nil, err
	}
	return media, nil
}

func (r *mediaRepository) Create(ctx context.Context, media *domain.Media) error {
	return r.db.WithContext(ctx).Create(media).Error
}

func (r *mediaRepository) Update(ctx context.Context, media *domain.Media) error {
	return r.db.WithContext(ctx).Save(media).Error
}

func (r *mediaRepository) Delete(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).Delete(&domain.Media{}, id).Error
}

func (r *mediaRepository) ClearDraftID(ctx context.Context, draftID string) error {
	return r.db.WithContext(ctx).Model(&domain.Media{}).Where("draft_id = ?", draftID).Update("draft_id", nil).Error
}
