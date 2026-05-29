package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/itdiagonals/website/backend/repository"
	"gorm.io/gorm"
)

type CategoryService struct {
	repo      repository.CategoryRepository
	mediaRepo repository.MediaRepository
}

func NewCategoryService(repo repository.CategoryRepository, mediaRepo repository.MediaRepository) *CategoryService {
	return &CategoryService{repo: repo, mediaRepo: mediaRepo}
}

func (s *CategoryService) GetAllCategories(ctx context.Context, page, limit int) ([]domain.Category, int64, error) {
	return s.repo.FindAll(ctx, page, limit)
}

func (s *CategoryService) GetCategoryByID(ctx context.Context, id int) (*domain.Category, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *CategoryService) GetCategoryBySlug(ctx context.Context, slug string) (*domain.Category, error) {
	return s.repo.FindBySlug(ctx, slug)
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
	return nil
}

func (s *CategoryService) UpdateCategory(ctx context.Context, category *domain.Category) error {
	if category.ID == 0 {
		return fmt.Errorf("category id is required")
	}
	if err := s.validateCoverImage(ctx, category.CoverImageID); err != nil {
		return err
	}
	return s.repo.Update(ctx, category)
}

func (s *CategoryService) DeleteCategory(ctx context.Context, id int) error {
	return s.repo.Delete(ctx, id)
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
