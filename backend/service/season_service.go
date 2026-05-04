package service

import (
	"context"
	"fmt"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
)

type SeasonService struct {
	repo repository.SeasonRepository
}

func NewSeasonService(repo repository.SeasonRepository) *SeasonService {
	return &SeasonService{repo: repo}
}

func (s *SeasonService) GetAllSeasons(ctx context.Context) ([]domain.Season, error) {
	return s.repo.FindAll(ctx)
}

func (s *SeasonService) GetSeasonByID(ctx context.Context, id int) (*domain.Season, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *SeasonService) GetSeasonBySlug(ctx context.Context, slug string) (*domain.Season, error) {
	return s.repo.FindBySlug(ctx, slug)
}

func (s *SeasonService) CreateSeason(ctx context.Context, season *domain.Season) error {
	if season.Name == "" || season.Slug == "" {
		return fmt.Errorf("name and slug are required")
	}
	return s.repo.Create(ctx, season)
}

func (s *SeasonService) UpdateSeason(ctx context.Context, season *domain.Season) error {
	if season.ID == 0 {
		return fmt.Errorf("season id is required")
	}
	return s.repo.Update(ctx, season)
}

func (s *SeasonService) DeleteSeason(ctx context.Context, id int) error {
	return s.repo.Delete(ctx, id)
}
