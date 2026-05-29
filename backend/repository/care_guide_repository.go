package repository

import (
	"context"
	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type CareGuideRepository interface {
	FindAll(ctx context.Context, page, limit int) ([]domain.CareGuide, int64, error)
	FindByID(ctx context.Context, id int) (*domain.CareGuide, error)
	Create(ctx context.Context, careGuide *domain.CareGuide) error
	Update(ctx context.Context, careGuide *domain.CareGuide) error
	Delete(ctx context.Context, id int) error
}

type careGuideRepository struct {
	db *gorm.DB
}

func NewCareGuideRepository(db *gorm.DB) CareGuideRepository {
	return &careGuideRepository{db: db}
}

func (r *careGuideRepository) FindAll(ctx context.Context, page, limit int) ([]domain.CareGuide, int64, error) {
	var careGuides []domain.CareGuide
	var total int64

	if err := r.db.WithContext(ctx).Model(&domain.CareGuide{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.WithContext(ctx).Offset((page - 1) * limit).Limit(limit).Find(&careGuides).Error; err != nil {
		return nil, 0, err
	}
	return careGuides, total, nil
}

func (r *careGuideRepository) FindByID(ctx context.Context, id int) (*domain.CareGuide, error) {
	var careGuide domain.CareGuide
	if err := r.db.WithContext(ctx).First(&careGuide, id).Error; err != nil {
		return nil, err
	}
	return &careGuide, nil
}

func (r *careGuideRepository) Create(ctx context.Context, careGuide *domain.CareGuide) error {
	return r.db.WithContext(ctx).Create(careGuide).Error
}

func (r *careGuideRepository) Update(ctx context.Context, careGuide *domain.CareGuide) error {
	return r.db.WithContext(ctx).Save(careGuide).Error
}

func (r *careGuideRepository) Delete(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).Delete(&domain.CareGuide{}, id).Error
}
