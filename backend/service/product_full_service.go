package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type ProductFullService struct {
	repo             repository.ProductFullRepository
	mediaRepo        repository.MediaRepository
	categoryRepo     repository.CategoryRepository
	seasonRepo       repository.SeasonRepository
	careGuideRepo    repository.CareGuideRepository
	redis            *redis.Client
	stockReservation StockReservationService
}

func NewProductFullService(
	repo repository.ProductFullRepository,
	mediaRepo repository.MediaRepository,
	categoryRepo repository.CategoryRepository,
	seasonRepo repository.SeasonRepository,
	careGuideRepo repository.CareGuideRepository,
	redisClient *redis.Client,
	stockReservation StockReservationService,
) *ProductFullService {
	return &ProductFullService{
		repo:             repo,
		mediaRepo:        mediaRepo,
		categoryRepo:     categoryRepo,
		seasonRepo:       seasonRepo,
		careGuideRepo:    careGuideRepo,
		redis:            redisClient,
		stockReservation: stockReservation,
	}
}

func (s *ProductFullService) GetAllProducts(ctx context.Context, categorySlug string, page, limit int) ([]domain.Product, int64, error) {
	products, total, err := s.repo.FindAll(ctx, categorySlug, page, limit)
	if err != nil {
		return nil, 0, err
	}
	if err := s.adjustProductStocks(ctx, products); err != nil {
		return nil, 0, err
	}
	return products, total, nil
}

func (s *ProductFullService) GetProductByID(ctx context.Context, id int) (*domain.Product, error) {
	product, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if err := s.adjustProductStock(ctx, product); err != nil {
		return nil, err
	}
	return product, nil
}

func (s *ProductFullService) GetProductBySlug(ctx context.Context, slug string) (*domain.Product, error) {
	product, err := s.repo.FindBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	if err := s.adjustProductStock(ctx, product); err != nil {
		return nil, err
	}
	return product, nil
}

func (s *ProductFullService) GetSimilarProducts(ctx context.Context, productID, seasonID, categoryID, limit int) ([]domain.Product, error) {
	cacheKey := fmt.Sprintf("products:similar:%d:%d:%d:%d", productID, seasonID, categoryID, limit)

	if s.redis != nil {
		cached, err := s.redis.Get(ctx, cacheKey).Result()
		if err == nil && cached != "" {
			var products []domain.Product
			if err := json.Unmarshal([]byte(cached), &products); err == nil {
				if err := s.adjustProductStocks(ctx, products); err != nil {
					return nil, err
				}
				return products, nil
			}
		}
	}

	products, err := s.repo.FindSimilar(ctx, seasonID, categoryID, productID, limit)
	if err != nil {
		return nil, err
	}

	if s.redis != nil {
		data, _ := json.Marshal(products)
		_ = s.redis.Set(ctx, cacheKey, data, 5*time.Minute).Err()
	}

	if err := s.adjustProductStocks(ctx, products); err != nil {
		return nil, err
	}

	return products, nil
}

func (s *ProductFullService) adjustProductStocks(ctx context.Context, products []domain.Product) error {
	for index := range products {
		if err := s.adjustProductStock(ctx, &products[index]); err != nil {
			return err
		}
	}
	return nil
}

func (s *ProductFullService) adjustProductStock(ctx context.Context, product *domain.Product) error {
	if product == nil || s.stockReservation == nil || product.ID <= 0 {
		return nil
	}

	if len(product.Variants) == 0 {
		reservedQuantity, err := s.stockReservation.GetReservedProductQuantity(ctx, product.ID)
		if err != nil {
			return err
		}
		product.Stock -= reservedQuantity
		if product.Stock < 0 {
			product.Stock = 0
		}
		return nil
	}

	totalStock := 0
	for index := range product.Variants {
		reservedQuantity, err := s.stockReservation.GetReservedQuantity(ctx, product.ID, product.Variants[index].Size, product.Variants[index].ColorName)
		if err != nil {
			return err
		}
		product.Variants[index].Stock -= reservedQuantity
		if product.Variants[index].Stock < 0 {
			product.Variants[index].Stock = 0
		}
		totalStock += product.Variants[index].Stock
	}
	product.Stock = totalStock
	return nil
}

func (s *ProductFullService) CreateProduct(ctx context.Context, product *domain.Product, draftID string) error {
	if err := validateProduct(product); err != nil {
		return err
	}
	if err := s.validateReferences(ctx, product); err != nil {
		return err
	}
	if err := repository.ValidateVariants(product.Variants, product.AvailableColors, product.AvailableSizes); err != nil {
		return err
	}
	product.Stock = repository.CalculateTotalStock(product.Variants)
	if err := s.repo.Create(ctx, product); err != nil {
		return err
	}
	if draftID != "" && s.mediaRepo != nil {
		if err := s.mediaRepo.ClearDraftID(ctx, draftID); err != nil {
			logger.Error("service.products.finalize_draft_failed", "draft_id", draftID, "error", err.Error())
		}
	}
	return nil
}

func (s *ProductFullService) UpdateProduct(ctx context.Context, product *domain.Product) error {
	if product.ID == 0 {
		return fmt.Errorf("product id is required")
	}
	if err := validateProduct(product); err != nil {
		return err
	}
	if err := s.validateReferences(ctx, product); err != nil {
		return err
	}
	if err := repository.ValidateVariants(product.Variants, product.AvailableColors, product.AvailableSizes); err != nil {
		return err
	}
	product.Stock = repository.CalculateTotalStock(product.Variants)
	return s.repo.Update(ctx, product)
}

func (s *ProductFullService) DeleteProduct(ctx context.Context, id int) error {
	return s.repo.Delete(ctx, id)
}

func validateProduct(product *domain.Product) error {
	if product.Name == "" {
		return fmt.Errorf("product name is required")
	}
	if product.Slug == "" {
		return fmt.Errorf("product slug is required")
	}
	if product.BasePrice < 0 {
		return fmt.Errorf("base price cannot be negative")
	}
	if len(product.Variants) == 0 {
		return fmt.Errorf("at least one variant is required")
	}
	return nil
}

func (s *ProductFullService) validateReferences(ctx context.Context, product *domain.Product) error {
	if err := s.validateCategory(ctx, product.CategoryID); err != nil {
		return err
	}
	if err := s.validateSeason(ctx, product.SeasonID); err != nil {
		return err
	}
	if err := s.validateCareGuide(ctx, product.CareGuideID); err != nil {
		return err
	}
	if err := s.validateCoverImage(ctx, product.CoverImageID); err != nil {
		return err
	}
	if err := s.validateGallery(ctx, product.Gallery); err != nil {
		return err
	}
	return nil
}

func (s *ProductFullService) validateCategory(ctx context.Context, categoryID int) error {
	if categoryID == 0 {
		return nil
	}
	if s.categoryRepo == nil {
		return fmt.Errorf("category repository is not configured")
	}
	_, err := s.categoryRepo.FindByID(ctx, categoryID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("category not found")
		}
		return err
	}
	return nil
}

func (s *ProductFullService) validateSeason(ctx context.Context, seasonID int) error {
	if seasonID == 0 {
		return nil
	}
	if s.seasonRepo == nil {
		return fmt.Errorf("season repository is not configured")
	}
	_, err := s.seasonRepo.FindByID(ctx, seasonID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("season not found")
		}
		return err
	}
	return nil
}

func (s *ProductFullService) validateCareGuide(ctx context.Context, careGuideID int) error {
	if careGuideID == 0 {
		return nil
	}
	if s.careGuideRepo == nil {
		return fmt.Errorf("care guide repository is not configured")
	}
	_, err := s.careGuideRepo.FindByID(ctx, careGuideID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("care guide not found")
		}
		return err
	}
	return nil
}

func (s *ProductFullService) validateCoverImage(ctx context.Context, coverImageID int) error {
	if coverImageID == 0 {
		return nil
	}
	if s.mediaRepo == nil {
		return fmt.Errorf("media repository is not configured")
	}
	_, err := s.mediaRepo.FindByID(ctx, coverImageID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return fmt.Errorf("cover image not found")
		}
		return err
	}
	return nil
}

func (s *ProductFullService) validateGallery(ctx context.Context, gallery []domain.ProductGalleryItem) error {
	if len(gallery) == 0 {
		return nil
	}
	seen := make(map[int]struct{}, len(gallery))
	for _, item := range gallery {
		if item.ImageID <= 0 {
			return fmt.Errorf("gallery image id is required")
		}
		if _, ok := seen[item.ImageID]; ok {
			return fmt.Errorf("duplicate gallery image id: %d", item.ImageID)
		}
		seen[item.ImageID] = struct{}{}
		if s.mediaRepo == nil {
			return fmt.Errorf("media repository is not configured")
		}
		_, err := s.mediaRepo.FindByID(ctx, item.ImageID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return fmt.Errorf("gallery image not found")
			}
			return err
		}
	}
	return nil
}
