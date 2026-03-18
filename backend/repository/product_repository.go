package repository

import (
	"context"
	"encoding/json"

	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type ProductRepository interface {
	FindAll(ctx context.Context, categorySlug string) ([]domain.Product, error)
	FindByID(ctx context.Context, id int) (*domain.Product, error)
	FindDetailByID(ctx context.Context, id int) (*domain.ProductDetail, error)
	FindDetailBySlug(ctx context.Context, slug string) (*domain.ProductDetail, error)
	FindBySlug(ctx context.Context, slug string) (*domain.Product, error)
}

type productRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) ProductRepository {
	return &productRepository{db: db}
}

func (repository *productRepository) FindAll(ctx context.Context, categorySlug string) ([]domain.Product, error) {
	var products []domain.Product

	query := repository.db.WithContext(ctx).Table("products")
	if categorySlug != "" {
		query = query.
			Joins("JOIN categories ON categories.id = products.category_id").
			Where("categories.slug = ?", categorySlug)
	}

	if err := query.Select("products.id, products.name, products.slug, products.category_id, products.season_id, products.care_guide_id, products.gender, products.base_price, products.stock, products.weight, products.description, products.cover_image_id").Scan(&products).Error; err != nil {
		return nil, err
	}

	return products, nil
}

func (repository *productRepository) FindByID(ctx context.Context, id int) (*domain.Product, error) {
	var product domain.Product

	if err := repository.db.WithContext(ctx).Table("products").Where("id = ?", id).First(&product).Error; err != nil {
		return nil, err
	}

	return &product, nil
}

func (repository *productRepository) FindDetailByID(ctx context.Context, id int) (*domain.ProductDetail, error) {
	return repository.findDetail(ctx, "products.id = ?", id)
}

func (repository *productRepository) FindDetailBySlug(ctx context.Context, slug string) (*domain.ProductDetail, error) {
	return repository.findDetail(ctx, "products.slug = ?", slug)
}

func (repository *productRepository) FindBySlug(ctx context.Context, slug string) (*domain.Product, error) {
	var product domain.Product

	if err := repository.db.WithContext(ctx).Table("products").Where("slug = ?", slug).First(&product).Error; err != nil {
		return nil, err
	}

	return &product, nil
}

func (repository *productRepository) findDetail(ctx context.Context, condition string, value any) (*domain.ProductDetail, error) {
	result := struct {
		domain.ProductDetail
		DetailInfoBytes       []byte `gorm:"column:detail_info"`
		CategoryID            int    `gorm:"column:category_id"`
		CategoryName          string `gorm:"column:category_name"`
		CategorySlug          string `gorm:"column:category_slug"`
		SeasonID              int    `gorm:"column:season_id"`
		SeasonName            string `gorm:"column:season_name"`
		SeasonSlug            string `gorm:"column:season_slug"`
		CareGuideID           int    `gorm:"column:care_guide_id"`
		CareGuideTitle        string `gorm:"column:care_guide_title"`
		CareGuideInstructions []byte `gorm:"column:care_guide_instructions"`
	}{}

	err := repository.db.WithContext(ctx).
		Table("products").
		Select("products.id, products.name, products.slug, products.gender, products.base_price, products.stock, products.weight, products.description, products.detail_info, products.cover_image_id, media.url AS cover_image_url, media.alt AS cover_image_alt, categories.id AS category_id, categories.name AS category_name, categories.slug AS category_slug, seasons.id AS season_id, seasons.name AS season_name, seasons.slug AS season_slug, care_guides.id AS care_guide_id, care_guides.title AS care_guide_title, care_guides.instructions AS care_guide_instructions").
		Joins("LEFT JOIN media ON media.id = products.cover_image_id").
		Joins("LEFT JOIN categories ON categories.id = products.category_id").
		Joins("LEFT JOIN seasons ON seasons.id = products.season_id").
		Joins("LEFT JOIN care_guides care_guides ON care_guides.id = products.care_guide_id").
		Where(condition, value).
		Scan(&result).Error
	if err != nil {
		return nil, err
	}

	detail := result.ProductDetail
	if len(result.DetailInfoBytes) > 0 {
		var detailInfo any
		if err := json.Unmarshal(result.DetailInfoBytes, &detailInfo); err == nil {
			detail.DetailInfo = detailInfo
		}
	}

	if detail.ID == 0 {
		return nil, gorm.ErrRecordNotFound
	}

	detail.Category = domain.ProductReference{
		ID:   result.CategoryID,
		Name: result.CategoryName,
		Slug: result.CategorySlug,
	}
	detail.Season = domain.ProductReference{
		ID:   result.SeasonID,
		Name: result.SeasonName,
		Slug: result.SeasonSlug,
	}
	if result.CareGuideID != 0 {
		var instructions any
		if len(result.CareGuideInstructions) > 0 {
			if err := json.Unmarshal(result.CareGuideInstructions, &instructions); err != nil {
				instructions = nil
			}
		}

		detail.CareGuide = &domain.ProductCareGuide{
			ID:           result.CareGuideID,
			Title:        result.CareGuideTitle,
			Instructions: instructions,
		}
	}

	var colors []domain.ProductColorOption
	if err := repository.db.WithContext(ctx).
		Table("products_available_colors").
		Select("color_name, hex_code").
		Where("_parent_id = ?", detail.ID).
		Order("_order ASC").
		Scan(&colors).Error; err != nil {
		return nil, err
	}

	var sizes []domain.ProductSizeOption
	if err := repository.db.WithContext(ctx).
		Table("products_available_sizes").
		Select("size").
		Where("_parent_id = ?", detail.ID).
		Order("_order ASC").
		Scan(&sizes).Error; err != nil {
		return nil, err
	}

	var gallery []domain.ProductMediaItem
	if err := repository.db.WithContext(ctx).
		Table("products_gallery AS gallery").
		Select("media.id, media.url, media.alt").
		Joins("JOIN media ON media.id = gallery.image_id").
		Where("gallery._parent_id = ?", detail.ID).
		Order("gallery._order ASC").
		Scan(&gallery).Error; err != nil {
		return nil, err
	}

	detail.AvailableColors = colors
	detail.AvailableSizes = sizes
	detail.Gallery = gallery

	return &detail, nil
}
