package service

import (
	"context"
	"errors"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
	"gorm.io/gorm"
)

var ErrProductNotFound = errors.New("product not found")

type ProductService interface {
	GetAllProducts(ctx context.Context, categorySlug string) ([]domain.Product, error)
	GetProductBySlug(ctx context.Context, slug string) (*domain.ProductDetail, error)
}

type productService struct {
	productRepository repository.ProductRepository
}

func NewProductService(productRepository repository.ProductRepository) ProductService {
	return &productService{productRepository: productRepository}
}

func (service *productService) GetAllProducts(ctx context.Context, categorySlug string) ([]domain.Product, error) {
	products, err := service.productRepository.FindAll(ctx, categorySlug)
	if err != nil {
		return nil, err
	}

	return products, nil
}

func (service *productService) GetProductBySlug(ctx context.Context, slug string) (*domain.ProductDetail, error) {
	product, err := service.productRepository.FindDetailBySlug(ctx, slug)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrProductNotFound
		}

		return nil, err
	}

	if product == nil {
		return nil, ErrProductNotFound
	}

	return product, nil
}
