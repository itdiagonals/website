package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type SeasonService struct {
	repo      repository.SeasonRepository
	mediaRepo repository.MediaRepository
	cache     *CatalogCache
}

func NewSeasonService(repo repository.SeasonRepository, mediaRepo repository.MediaRepository, redisClient *redis.Client) *SeasonService {
	return &SeasonService{repo: repo, mediaRepo: mediaRepo, cache: NewCatalogCache(redisClient)}
}

func (s *SeasonService) GetAllSeasons(ctx context.Context, page, limit int) ([]domain.Season, int64, error) {
	cacheKey := fmt.Sprintf("catalog:seasons:list:page=%d:limit=%d", page, limit)
	if s.cache != nil {
		var cached cachedListPayload[domain.Season]
		cacheHit, err := s.cache.Get(ctx, cacheKey, &cached)
		if err == nil && cacheHit {
			return cached.Items, cached.Total, nil
		}
	}

	seasons, total, err := s.repo.FindAll(ctx, page, limit)
	if err != nil {
		return nil, 0, err
	}
	if s.cache != nil {
		_ = s.cache.Set(ctx, cacheKey, cachedListPayload[domain.Season]{Items: seasons, Total: total})
	}
	return seasons, total, nil
}

func (s *SeasonService) GetSeasonByID(ctx context.Context, id int) (*domain.Season, error) {
	cacheKey := fmt.Sprintf("catalog:seasons:id:%d", id)
	if s.cache != nil {
		var cached domain.Season
		cacheHit, err := s.cache.Get(ctx, cacheKey, &cached)
		if err == nil && cacheHit {
			return &cached, nil
		}
	}

	season, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if s.cache != nil {
		_ = s.cache.Set(ctx, cacheKey, season)
	}
	return season, nil
}

func (s *SeasonService) GetSeasonBySlug(ctx context.Context, slug string) (*domain.Season, error) {
	cacheKey := fmt.Sprintf("catalog:seasons:slug:%s", slug)
	if s.cache != nil {
		var cached domain.Season
		cacheHit, err := s.cache.Get(ctx, cacheKey, &cached)
		if err == nil && cacheHit {
			return &cached, nil
		}
	}

	season, err := s.repo.FindBySlug(ctx, slug)
	if err != nil {
		return nil, err
	}
	if s.cache != nil {
		_ = s.cache.Set(ctx, cacheKey, season)
	}
	return season, nil
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
	if s.cache != nil {
		_ = s.cache.InvalidateCatalog(ctx)
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
	if err := s.repo.Update(ctx, season); err != nil {
		return err
	}
	if s.cache != nil {
		_ = s.cache.InvalidateCatalog(ctx)
	}
	return nil
}

func (s *SeasonService) DeleteSeason(ctx context.Context, id int) error {
	if err := s.repo.Delete(ctx, id); err != nil {
		return err
	}
	if s.cache != nil {
		_ = s.cache.InvalidateCatalog(ctx)
	}
	return nil
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
