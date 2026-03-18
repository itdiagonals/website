package repository

import (
	"context"
	"strings"

	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type SearchWilayahParams struct {
	Level      string
	ParentCode string
	Query      string
	Limit      int
}

type WilayahRepository interface {
	Search(context context.Context, params SearchWilayahParams) ([]domain.Wilayah, error)
}

type wilayahRepository struct {
	db *gorm.DB
}

func NewWilayahRepository(db *gorm.DB) WilayahRepository {
	return &wilayahRepository{db: db}
}

func (repository *wilayahRepository) Search(context context.Context, params SearchWilayahParams) ([]domain.Wilayah, error) {
	var wilayah []domain.Wilayah

	query := repository.db.WithContext(context).Model(&domain.Wilayah{})
	if params.Level != "" {
		query = query.Where("level = ?", params.Level)
	}

	if params.ParentCode != "" {
		query = query.Where("parent_code = ?", params.ParentCode)
	}

	if params.Query != "" {
		queryText := "%" + strings.ToLower(params.Query) + "%"
		query = query.Where("LOWER(nama) LIKE ?", queryText)
	}

	err := query.Order("nama ASC").Limit(params.Limit).Find(&wilayah).Error
	if err != nil {
		return nil, err
	}

	return wilayah, nil
}
