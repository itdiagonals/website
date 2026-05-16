package repository

import (
	"context"
	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type MediaRepository interface {
	FindAll(ctx context.Context) ([]domain.Media, error)
	FindByID(ctx context.Context, id int) (*domain.Media, error)
	Create(ctx context.Context, media *domain.Media) error
	Update(ctx context.Context, media *domain.Media) error
	Delete(ctx context.Context, id int) error
}

type mediaRepository struct {
	db *gorm.DB
}

func NewMediaRepository(db *gorm.DB) MediaRepository {
	return &mediaRepository{db: db}
}

func (r *mediaRepository) FindAll(ctx context.Context) ([]domain.Media, error) {
	var media []domain.Media
	if err := r.db.WithContext(ctx).Find(&media).Error; err != nil {
		return nil, err
	}
	return media, nil
}

func (r *mediaRepository) FindByID(ctx context.Context, id int) (*domain.Media, error) {
	var m domain.Media
	if err := r.db.WithContext(ctx).First(&m, id).Error; err != nil {
		return nil, err
	}
	return &m, nil
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
