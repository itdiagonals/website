package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
)

type MediaService struct {
	repo repository.MediaRepository
}

func NewMediaService(repo repository.MediaRepository) *MediaService {
	return &MediaService{repo: repo}
}

func (s *MediaService) GetAllMedia(ctx context.Context, page, limit int) ([]domain.Media, int64, error) {
	return s.repo.FindAll(ctx, page, limit)
}

func (s *MediaService) GetMediaByID(ctx context.Context, id int) (*domain.Media, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *MediaService) GetMediaByDraftID(ctx context.Context, draftID string) ([]domain.Media, error) {
	return s.repo.FindByDraftID(ctx, draftID)
}

func (s *MediaService) FinalizeDraftMedia(ctx context.Context, draftID string) error {
	if draftID == "" {
		return nil
	}
	return s.repo.ClearDraftID(ctx, draftID)
}

func (s *MediaService) CreateMedia(ctx context.Context, media *domain.Media) error {
	if err := validateMedia(media); err != nil {
		return err
	}
	return s.repo.Create(ctx, media)
}

func (s *MediaService) UpdateMedia(ctx context.Context, media *domain.Media) error {
	if media.ID == 0 {
		return fmt.Errorf("media id is required")
	}
	if err := validateMedia(media); err != nil {
		return err
	}
	return s.repo.Update(ctx, media)
}

func (s *MediaService) DeleteMedia(ctx context.Context, id int) error {
	return s.repo.Delete(ctx, id)
}

func validateMedia(media *domain.Media) error {
	if strings.TrimSpace(media.Alt) == "" {
		return fmt.Errorf("alt is required")
	}
	if strings.TrimSpace(media.URL) == "" {
		return fmt.Errorf("url is required")
	}
	if strings.TrimSpace(media.Filename) == "" {
		return fmt.Errorf("filename is required")
	}
	return nil
}
