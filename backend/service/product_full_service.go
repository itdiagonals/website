package service

import (
	"context"
	"fmt"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
)

type ProductFullService struct {
	repo repository.ProductFullRepository
}

func NewProductFullService(repo repository.ProductFullRepository) *ProductFullService {
	return &ProductFullService{repo: repo}
}

func (s *ProductFullService) GetAllProducts(ctx context.Context, categorySlug string) ([]domain.Product, error) {
	return s.repo.FindAll(ctx, categorySlug)
}

func (s *ProductFullService) GetProductByID(ctx context.Context, id int) (*domain.Product, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *ProductFullService) GetProductBySlug(ctx context.Context, slug string) (*domain.Product, error) {
	return s.repo.FindBySlug(ctx, slug)
}

func (s *ProductFullService) CreateProduct(ctx context.Context, product *domain.Product) error {
	if err := validateProduct(product); err != nil {
		return err
	}
	if err := repository.ValidateVariants(product.Variants, product.AvailableColors, product.AvailableSizes); err != nil {
		return err
	}
	product.Stock = repository.CalculateTotalStock(product.Variants)
	return s.repo.Create(ctx, product)
}

func (s *ProductFullService) UpdateProduct(ctx context.Context, product *domain.Product) error {
	if product.ID == 0 {
		return fmt.Errorf("product id is required")
	}
	if err := validateProduct(product); err != nil {
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
