package service

import (
	"context"
	"fmt"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
)

type MediaService struct {
	repo repository.MediaRepository
}

func NewMediaService(repo repository.MediaRepository) *MediaService {
	return &MediaService{repo: repo}
}

func (s *MediaService) GetAllMedia(ctx context.Context) ([]domain.Media, error) {
	return s.repo.FindAll(ctx)
}

func (s *MediaService) GetMediaByID(ctx context.Context, id int) (*domain.Media, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *MediaService) CreateMedia(ctx context.Context, media *domain.Media) error {
	if media.URL == "" || media.Filename == "" {
		return fmt.Errorf("url and filename are required")
	}
	return s.repo.Create(ctx, media)
}

func (s *MediaService) UpdateMedia(ctx context.Context, media *domain.Media) error {
	if media.ID == 0 {
		return fmt.Errorf("media id is required")
	}
	return s.repo.Update(ctx, media)
}

func (s *MediaService) DeleteMedia(ctx context.Context, id int) error {
	return s.repo.Delete(ctx, id)
}
