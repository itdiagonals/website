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

type SeasonService struct {
	repo      repository.SeasonRepository
	mediaRepo repository.MediaRepository
}

func NewSeasonService(repo repository.SeasonRepository, mediaRepo repository.MediaRepository) *SeasonService {
	return &SeasonService{repo: repo, mediaRepo: mediaRepo}
}

func (s *SeasonService) GetAllSeasons(ctx context.Context, page, limit int) ([]domain.Season, int64, error) {
	return s.repo.FindAll(ctx, page, limit)
}

func (s *SeasonService) GetSeasonByID(ctx context.Context, id int) (*domain.Season, error) {
	return s.repo.FindByID(ctx, id)
}

func (s *SeasonService) GetSeasonBySlug(ctx context.Context, slug string) (*domain.Season, error) {
	return s.repo.FindBySlug(ctx, slug)
}

func (s *SeasonService) CreateSeason(ctx context.Context, season *domain.Season, draftID string) error {
	if season.Name == "" || season.Slug == "" {
		return fmt.Errorf("name and slug are required")
	}
	if err := s.validateCoverImage(ctx, season.CoverImageID); err != nil {
		return err
	}
	if err := s.validateLookbookImages(ctx, season.LookbookImages); err != nil {
		return err
	}
	if err := s.repo.Create(ctx, season); err != nil {
		return err
	}
	if draftID != "" && s.mediaRepo != nil {
		if err := s.mediaRepo.ClearDraftID(ctx, draftID); err != nil {
			logger.Error("service.seasons.finalize_draft_failed", "draft_id", draftID, "error", err.Error())
		}
	}
	return nil
}

func (s *SeasonService) UpdateSeason(ctx context.Context, season *domain.Season) error {
	if season.ID == 0 {
		return fmt.Errorf("season id is required")
	}
	if err := s.validateCoverImage(ctx, season.CoverImageID); err != nil {
		return err
	}
	if err := s.validateLookbookImages(ctx, season.LookbookImages); err != nil {
		return err
	}
	return s.repo.Update(ctx, season)
}

func (s *SeasonService) DeleteSeason(ctx context.Context, id int) error {
	return s.repo.Delete(ctx, id)
}

func (s *SeasonService) validateCoverImage(ctx context.Context, coverImageID int) error {
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

func (s *SeasonService) validateLookbookImages(ctx context.Context, images []domain.Media) error {
	if len(images) == 0 {
		return nil
	}

	if s.mediaRepo == nil {
		return fmt.Errorf("media repository is not configured")
	}

	seen := make(map[int]struct{}, len(images))
	for _, image := range images {
		if image.ID <= 0 {
			return fmt.Errorf("lookbook image id is required")
		}
		if _, ok := seen[image.ID]; ok {
			return fmt.Errorf("duplicate lookbook image id: %d", image.ID)
		}
		seen[image.ID] = struct{}{}

		_, err := s.mediaRepo.FindByID(ctx, image.ID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return fmt.Errorf("lookbook image not found")
			}
			return err
		}
	}

	return nil
}
