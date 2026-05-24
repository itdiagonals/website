package repository

import (
	"context"
	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type CategoryRepository interface {
	FindAll(ctx context.Context, page, limit int) ([]domain.Category, int64, error)
	FindByID(ctx context.Context, id int) (*domain.Category, error)
	FindBySlug(ctx context.Context, slug string) (*domain.Category, error)
	Create(ctx context.Context, category *domain.Category) error
	Update(ctx context.Context, category *domain.Category) error
	Delete(ctx context.Context, id int) error
}

type categoryRepository struct {
	db *gorm.DB
}

func NewCategoryRepository(db *gorm.DB) CategoryRepository {
	return &categoryRepository{db: db}
}

func (r *categoryRepository) FindAll(ctx context.Context, page, limit int) ([]domain.Category, int64, error) {
	var categories []domain.Category
	var total int64

	if err := r.db.WithContext(ctx).Model(&domain.Category{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := r.db.WithContext(ctx).Preload("CoverImage").Offset((page - 1) * limit).Limit(limit).Find(&categories).Error; err != nil {
		return nil, 0, err
	}
	return categories, total, nil
}

func (r *categoryRepository) FindByID(ctx context.Context, id int) (*domain.Category, error) {
	var category domain.Category
	if err := r.db.WithContext(ctx).Preload("CoverImage").First(&category, id).Error; err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) FindBySlug(ctx context.Context, slug string) (*domain.Category, error) {
	var category domain.Category
	if err := r.db.WithContext(ctx).Preload("CoverImage").Where("slug = ?", slug).First(&category).Error; err != nil {
		return nil, err
	}
	return &category, nil
}

func (r *categoryRepository) Create(ctx context.Context, category *domain.Category) error {
	return r.db.WithContext(ctx).Create(category).Error
}

func (r *categoryRepository) Update(ctx context.Context, category *domain.Category) error {
	return r.db.WithContext(ctx).Save(category).Error
}

func (r *categoryRepository) Delete(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).Delete(&domain.Category{}, id).Error
}
