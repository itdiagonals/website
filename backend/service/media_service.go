package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/storage"
)

type MediaService struct {
	repo  repository.MediaRepository
	store storage.Storage
}

func NewMediaService(repo repository.MediaRepository, store storage.Storage) *MediaService {
	return &MediaService{repo: repo, store: store}
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
	media, err := s.repo.FindByID(ctx, id)
	if err != nil {
		return err
	}

	if s.store != nil {
		objectKey := extractObjectKeyFromURL(media.URL)
		if objectKey != "" {
			_ = s.store.Delete(ctx, objectKey)
		}
	}

	return s.repo.Delete(ctx, id)
}

func (s *MediaService) GeneratePresignedURL(ctx context.Context, objectKey string) (string, string, error) {
	if s.store == nil {
		return "", "", fmt.Errorf("object storage is not configured")
	}

	signedURL, err := s.store.PresignedPutURL(ctx, objectKey, 15*time.Minute)
	if err != nil {
		return "", "", err
	}

	publicURL := storage.PublicObjectURL(objectKey)
	return signedURL, publicURL, nil
}

func (s *MediaService) ConfirmUpload(ctx context.Context, tempKey, alt, draftID string, width, height int, filesize int64, mimeType string) (*domain.Media, error) {
	if s.store == nil {
		return nil, fmt.Errorf("object storage is not configured")
	}

	exists, err := s.store.ObjectExists(ctx, tempKey)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("uploaded object not found")
	}

	storedName := strings.TrimPrefix(tempKey, "temp/")
	finalKey := "media/" + storedName

	if err := s.store.MoveObject(ctx, tempKey, finalKey); err != nil {
		return nil, err
	}

	media := domain.Media{
		Alt:      strings.TrimSpace(alt),
		URL:      storage.PublicObjectURL(finalKey),
		Filename: storedName,
		MimeType: mimeType,
		Filesize: filesize,
		Width:    width,
		Height:   height,
	}

	if draftID != "" {
		media.DraftID = &draftID
	}

	if err := validateMedia(&media); err != nil {
		return nil, err
	}

	if err := s.repo.Create(ctx, &media); err != nil {
		_ = s.store.Delete(ctx, finalKey)
		return nil, err
	}

	return &media, nil
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

func extractObjectKeyFromURL(url string) string {
	parts := strings.Split(url, "/")
	if len(parts) < 3 {
		return ""
	}
	return strings.Join(parts[len(parts)-2:], "/")
}
