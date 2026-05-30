package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type ProductFullRepository interface {
	FindAll(ctx context.Context, categorySlug string, page, limit int) ([]domain.Product, int64, error)
	FindByID(ctx context.Context, id int) (*domain.Product, error)
	FindBySlug(ctx context.Context, slug string) (*domain.Product, error)
	FindSimilar(ctx context.Context, seasonID, categoryID, excludeID, limit int) ([]domain.Product, error)
	Create(ctx context.Context, product *domain.Product) error
	Update(ctx context.Context, product *domain.Product) error
	Delete(ctx context.Context, id int) error
}

type productFullRepository struct {
	db *gorm.DB
}

func NewProductFullRepository(db *gorm.DB) ProductFullRepository {
	return &productFullRepository{db: db}
}

func (r *productFullRepository) FindAll(ctx context.Context, categorySlug string, page, limit int) ([]domain.Product, int64, error) {
	var products []domain.Product
	query := r.db.WithContext(ctx).Preload("Season").Preload("Category").Preload("CoverImage").Preload("CareGuide")

	if categorySlug != "" {
		query = query.Joins("JOIN categories ON categories.id = products.category_id").Where("categories.slug = ?", categorySlug)
	}

	var total int64
	if err := query.Model(&domain.Product{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if err := query.Offset((page - 1) * limit).Limit(limit).Find(&products).Error; err != nil {
		return nil, 0, err
	}
	return products, total, nil
}

func (r *productFullRepository) FindByID(ctx context.Context, id int) (*domain.Product, error) {
	var product domain.Product
	if err := r.db.WithContext(ctx).
		Preload("Season").
		Preload("Category").
		Preload("CoverImage").
		Preload("CareGuide").
		Preload("AvailableColors").
		Preload("AvailableSizes").
		Preload("Gallery.Image").
		Preload("Variants").
		First(&product, id).Error; err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productFullRepository) FindBySlug(ctx context.Context, slug string) (*domain.Product, error) {
	var product domain.Product
	if err := r.db.WithContext(ctx).
		Preload("Season").
		Preload("Category").
		Preload("CoverImage").
		Preload("CareGuide").
		Preload("AvailableColors").
		Preload("AvailableSizes").
		Preload("Gallery.Image").
		Preload("Variants").
		Where("slug = ?", slug).
		First(&product).Error; err != nil {
		return nil, err
	}
	return &product, nil
}

func (r *productFullRepository) FindSimilar(ctx context.Context, seasonID, categoryID, excludeID, limit int) ([]domain.Product, error) {
	var products []domain.Product
	orderClause := fmt.Sprintf(
		"CASE WHEN season_id = %d THEN 1 WHEN category_id = %d THEN 2 ELSE 3 END, updated_at DESC",
		seasonID, categoryID,
	)
	if err := r.db.WithContext(ctx).
		Preload("Season").
		Preload("Category").
		Preload("CoverImage").
		Where("id != ?", excludeID).
		Order(orderClause).
		Limit(limit).
		Find(&products).Error; err != nil {
		return nil, err
	}
	return products, nil
}

func (r *productFullRepository) Create(ctx context.Context, product *domain.Product) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Omit("AvailableColors", "AvailableSizes", "Gallery", "Variants").Create(product).Error; err != nil {
			return err
		}

		for i := range product.AvailableColors {
			product.AvailableColors[i].ID = 0
			product.AvailableColors[i].ParentID = product.ID
			if err := tx.Create(&product.AvailableColors[i]).Error; err != nil {
				return err
			}
		}

		for i := range product.AvailableSizes {
			product.AvailableSizes[i].ID = 0
			product.AvailableSizes[i].ParentID = product.ID
			if err := tx.Create(&product.AvailableSizes[i]).Error; err != nil {
				return err
			}
		}

		for i := range product.Gallery {
			product.Gallery[i].ID = 0
			product.Gallery[i].ParentID = product.ID
			if err := tx.Create(&product.Gallery[i]).Error; err != nil {
				return err
			}
		}

		for i := range product.Variants {
			product.Variants[i].ID = 0
			product.Variants[i].ParentID = product.ID
			if err := tx.Create(&product.Variants[i]).Error; err != nil {
				return err
			}
		}

		return r.updateStockFromVariants(tx, product.ID)
	})
}

func (r *productFullRepository) Update(ctx context.Context, product *domain.Product) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(product).Error; err != nil {
			return err
		}

		tx.Where("_parent_id = ?", product.ID).Delete(&domain.ProductColor{})
		for i := range product.AvailableColors {
			product.AvailableColors[i].ID = 0
			product.AvailableColors[i].ParentID = product.ID
			if err := tx.Create(&product.AvailableColors[i]).Error; err != nil {
				return err
			}
		}

		tx.Where("_parent_id = ?", product.ID).Delete(&domain.ProductSize{})
		for i := range product.AvailableSizes {
			product.AvailableSizes[i].ID = 0
			product.AvailableSizes[i].ParentID = product.ID
			if err := tx.Create(&product.AvailableSizes[i]).Error; err != nil {
				return err
			}
		}

		tx.Where("_parent_id = ?", product.ID).Delete(&domain.ProductGalleryItem{})
		for i := range product.Gallery {
			product.Gallery[i].ID = 0
			product.Gallery[i].ParentID = product.ID
			if err := tx.Create(&product.Gallery[i]).Error; err != nil {
				return err
			}
		}

		tx.Where("_parent_id = ?", product.ID).Delete(&domain.ProductVariant{})
		for i := range product.Variants {
			product.Variants[i].ID = 0
			product.Variants[i].ParentID = product.ID
			if err := tx.Create(&product.Variants[i]).Error; err != nil {
				return err
			}
		}

		return r.updateStockFromVariants(tx, product.ID)
	})
}

func (r *productFullRepository) Delete(ctx context.Context, id int) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		tx.Where("_parent_id = ?", id).Delete(&domain.ProductColor{})
		tx.Where("_parent_id = ?", id).Delete(&domain.ProductSize{})
		tx.Where("_parent_id = ?", id).Delete(&domain.ProductGalleryItem{})
		tx.Where("_parent_id = ?", id).Delete(&domain.ProductVariant{})

		return tx.Delete(&domain.Product{}, id).Error
	})
}

func (r *productFullRepository) updateStockFromVariants(tx *gorm.DB, productID int) error {
	result := tx.Model(&domain.Product{}).Where("id = ?", productID).
		Update("stock", tx.Model(&domain.ProductVariant{}).
			Select("COALESCE(SUM(stock), 0)").
			Where("_parent_id = ?", productID))
	return result.Error
}

func ValidateVariants(variants []domain.ProductVariant, availableColors []domain.ProductColor, availableSizes []domain.ProductSize) error {
	if len(variants) == 0 {
		return fmt.Errorf("minimal harus ada satu varian stok")
	}

	colorOptions := make(map[string]bool)
	for _, c := range availableColors {
		colorOptions[strings.ToLower(strings.TrimSpace(c.ColorName))] = true
	}

	sizeOptions := make(map[string]bool)
	for _, s := range availableSizes {
		sizeOptions[strings.ToLower(strings.TrimSpace(s.Size))] = true
	}

	seen := make(map[string]bool)
	for _, v := range variants {
		color := strings.ToLower(strings.TrimSpace(v.ColorName))
		size := strings.ToLower(strings.TrimSpace(v.Size))

		if color == "" || size == "" {
			return fmt.Errorf("setiap varian wajib memiliki color_name dan size")
		}

		if len(colorOptions) > 0 && !colorOptions[color] {
			return fmt.Errorf("warna varian tidak valid: %s", v.ColorName)
		}

		if len(sizeOptions) > 0 && !sizeOptions[size] {
			return fmt.Errorf("size varian tidak valid: %s", v.Size)
		}

		key := fmt.Sprintf("%s::%s", color, size)
		if seen[key] {
			return fmt.Errorf("kombinasi varian duplikat ditemukan: %s - %s", v.ColorName, v.Size)
		}
		seen[key] = true
	}

	return nil
}

func CalculateTotalStock(variants []domain.ProductVariant) int {
	total := 0
	for _, v := range variants {
		if v.Stock > 0 {
			total += v.Stock
		}
	}
	return total
}
