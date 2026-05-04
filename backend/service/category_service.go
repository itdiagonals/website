package service

import (
	"context"
	"fmt"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
)

type CategoryService struct {
	repo repository.CategoryRepository
}

func NewCategoryService(repo repository.CategoryRepository) *CategoryService {
	return &CategoryService{repo: repo}
}

func (s *CategoryService) GetAllCategories(ctx context.Context) ([]domain.Category, error) {
	return s.repo.FindAll(ctx)
}

func (s *CategoryService) GetCategoryByID(ctx context.Context, id int) (*domain.Category, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *CategoryService) GetCategoryBySlug(ctx context.Context, slug string) (*domain.Category, error) {
	return s.repo.FindBySlug(ctx, slug)
}

func (s *CategoryService) CreateCategory(ctx context.Context, category *domain.Category) error {
	if category.Name == "" || category.Slug == "" {
		return fmt.Errorf("name and slug are required")
	}
	return s.repo.Create(ctx, category)
}

func (s *CategoryService) UpdateCategory(ctx context.Context, category *domain.Category) error {
	if category.ID == 0 {
		return fmt.Errorf("category id is required")
	}
	return s.repo.Update(ctx, category)
}

func (s *CategoryService) DeleteCategory(ctx context.Context, id int) error {
	return s.repo.Delete(ctx, id)
}
