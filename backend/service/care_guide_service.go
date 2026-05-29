package service

import (
	"context"
	"fmt"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
)

type CareGuideService struct {
	repo repository.CareGuideRepository
}

func NewCareGuideService(repo repository.CareGuideRepository) *CareGuideService {
	return &CareGuideService{repo: repo}
}

func (s *CareGuideService) GetAllCareGuides(ctx context.Context, page, limit int) ([]domain.CareGuide, int64, error) {
	return s.repo.FindAll(ctx, page, limit)
}

func (s *CareGuideService) GetCareGuideByID(ctx context.Context, id int) (*domain.CareGuide, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *CareGuideService) CreateCareGuide(ctx context.Context, careGuide *domain.CareGuide) error {
	if careGuide.Title == "" {
		return fmt.Errorf("title is required")
	}
	return s.repo.Create(ctx, careGuide)
}

func (s *CareGuideService) UpdateCareGuide(ctx context.Context, careGuide *domain.CareGuide) error {
	if careGuide.ID == 0 {
		return fmt.Errorf("care guide id is required")
	}
	return s.repo.Update(ctx, careGuide)
}

func (s *CareGuideService) DeleteCareGuide(ctx context.Context, id int) error {
	return s.repo.Delete(ctx, id)
}
