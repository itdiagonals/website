package repository

import (
	"context"
	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type SeasonRepository interface {
	FindAll(ctx context.Context) ([]domain.Season, error)
	FindByID(ctx context.Context, id int) (*domain.Season, error)
	FindBySlug(ctx context.Context, slug string) (*domain.Season, error)
	Create(ctx context.Context, season *domain.Season) error
	Update(ctx context.Context, season *domain.Season) error
	Delete(ctx context.Context, id int) error
}

type seasonRepository struct {
	db *gorm.DB
}

func NewSeasonRepository(db *gorm.DB) SeasonRepository {
	return &seasonRepository{db: db}
}

func (r *seasonRepository) FindAll(ctx context.Context) ([]domain.Season, error) {
	var seasons []domain.Season
	if err := r.db.WithContext(ctx).Preload("CoverImage").Preload("LookbookImages").Find(&seasons).Error; err != nil {
		return nil, err
	}
	return seasons, nil
}

func (r *seasonRepository) FindByID(ctx context.Context, id int) (*domain.Season, error) {
	var season domain.Season
	if err := r.db.WithContext(ctx).Preload("CoverImage").Preload("LookbookImages").First(&season, id).Error; err != nil {
		return nil, err
	}
	return &season, nil
}

func (r *seasonRepository) FindBySlug(ctx context.Context, slug string) (*domain.Season, error) {
	var season domain.Season
	if err := r.db.WithContext(ctx).Preload("CoverImage").Preload("LookbookImages").Where("slug = ?", slug).First(&season).Error; err != nil {
		return nil, err
	}
	return &season, nil
}

func (r *seasonRepository) Create(ctx context.Context, season *domain.Season) error {
	return r.db.WithContext(ctx).Create(season).Error
}

func (r *seasonRepository) Update(ctx context.Context, season *domain.Season) error {
	return r.db.WithContext(ctx).Save(season).Error
}

func (r *seasonRepository) Delete(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).Delete(&domain.Season{}, id).Error
}
