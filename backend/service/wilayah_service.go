package service

import (
	"context"
	"errors"
	"strings"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
)

var ErrInvalidWilayahSearch = errors.New("invalid wilayah search")

type SearchWilayahInput struct {
	Level      string
	ParentCode string
	Query      string
	Limit      int
}

type WilayahService interface {
	Search(context context.Context, input SearchWilayahInput) ([]domain.Wilayah, error)
}

type wilayahService struct {
	wilayahRepository repository.WilayahRepository
}

func NewWilayahService(wilayahRepository repository.WilayahRepository) WilayahService {
	return &wilayahService{wilayahRepository: wilayahRepository}
}

func (service *wilayahService) Search(context context.Context, input SearchWilayahInput) ([]domain.Wilayah, error) {
	input.Level = strings.TrimSpace(strings.ToLower(input.Level))
	input.ParentCode = strings.TrimSpace(input.ParentCode)
	input.Query = strings.TrimSpace(input.Query)

	if input.Level != "" && !isValidWilayahLevel(input.Level) {
		return nil, ErrInvalidWilayahSearch
	}

	if input.Limit <= 0 {
		input.Limit = 50
	}

	if input.Limit > 100 {
		input.Limit = 100
	}

	return service.wilayahRepository.Search(context, repository.SearchWilayahParams{
		Level:      input.Level,
		ParentCode: input.ParentCode,
		Query:      input.Query,
		Limit:      input.Limit,
	})
}

func isValidWilayahLevel(level string) bool {
	switch level {
	case "province", "city", "district", "village":
		return true
	default:
		return false
	}
}
