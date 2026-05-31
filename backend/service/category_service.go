package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type CategoryService struct {
	repo      repository.CategoryRepository
	mediaRepo repository.MediaRepository
	cache     *CatalogCache
}

func NewCategoryService(repo repository.CategoryRepository, mediaRepo repository.MediaRepository, redisClient *redis.Client) *CategoryService {
	return &CategoryService{repo: repo, mediaRepo: mediaRepo, cache: NewCatalogCache(redisClient)}
}

func (s *CategoryService) GetAllCategories(ctx context.Context, page, limit int) ([]domain.Category, int64, error) {
	cacheKey := fmt.Sprintf("catalog:categories:list:page=%d:limit=%d", page, limit)
	if s.cache != nil {
		var cached cachedListPayload[domain.Category]
		cacheHit, err := s.cache.Get(ctx, cacheKey, &cached)
		if err == nil && cacheHit {
			return cached.Items, cached.Total, nil
		}
	}

	categories, total, err := s.repo.FindAll(ctx, page, limit)
	if err != nil {
		return nil, 0, err
	}
	if s.cache != nil {
		_ = s.cache.Set(ctx, cacheKey, cachedListPayload[domain.Category]{Items: categories, Total: total})
	}
	return categories, total, nil
}

func (s *CategoryService) GetCategoryByID(ctx context.Context, id int) (*domain.Category, error) {
	cacheKey := fmt.Sprintf("catalog:categories:id:%d", id)
	if s.cache != nil {
		var cached domain.Category
		cacheHit, err := s.cache.Get(ctx, cacheKey, &cached)
		if err == nil && cacheHit {
			return &cached, nil
		}
	}

	category, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if s.cache != nil {
		_ = s.cache.Set(ctx, cacheKey, category)
	}
	return category, nil
}

func (s *CategoryService) GetCategoryBySlug(ctx context.Context, slug string) (*domain.Category, error) {
	cacheKey := fmt.Sprintf("catalog:categories:slug:%s", slug)
	if s.cache != nil {
		var cached domain.Category
		cacheHit, err := s.cache.Get(ctx, cacheKey, &cached)
		if err == nil && cacheHit {
			return &cached, nil
		}
	}

	category, err := s.repo.FindBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	if s.cache != nil {
		_ = s.cache.Set(ctx, cacheKey, category)
	}
	return category, nil
}

func (s *CategoryService) CreateCategory(ctx context.Context, category *domain.Category, draftID string) error {
	if category.Name == "" || category.Slug == "" {
		return fmt.Errorf("name and slug are required")
	}
	if err := s.validateCoverImage(ctx, category.CoverImageID); err != nil {
		return err
	}
	if err := s.repo.Create(ctx, category); err != nil {
		return err
	}
	if draftID != "" && s.mediaRepo != nil {
		if err := s.mediaRepo.ClearDraftID(ctx, draftID); err != nil {
			logger.Error("service.categories.finalize_draft_failed", "draft_id", draftID, "error", err.Error())
		}
	}
	if s.cache != nil {
		_ = s.cache.InvalidateCatalog(ctx)
	}
	return nil
}

func (s *CategoryService) UpdateCategory(ctx context.Context, category *domain.Category) error {
	if category.ID == 0 {
		return fmt.Errorf("category id is required")
	}
	if err := s.validateCoverImage(ctx, category.CoverImageID); err != nil {
		return err
	}
	if err := s.repo.Update(ctx, category); err != nil {
		return err
	}
	if s.cache != nil {
		_ = s.cache.InvalidateCatalog(ctx)
	}
	return nil
}

func (s *CategoryService) DeleteCategory(ctx context.Context, id int) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	if s.cache != nil {
		_ = s.cache.InvalidateCatalog(ctx)
	}
	return nil
}

func (s *CategoryService) validateCoverImage(ctx context.Context, coverImageID int) error {
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
