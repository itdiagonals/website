package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
)

var ErrInvalidCatalogSyncEvent = errors.New("invalid catalog sync event")

type CatalogSyncService interface {
	ApplyEvent(ctx context.Context, event domain.CatalogSyncEvent) error
}

type catalogSyncService struct {
	repository repository.CatalogSyncRepository
}

func NewCatalogSyncService(repository repository.CatalogSyncRepository) CatalogSyncService {
	return &catalogSyncService{repository: repository}
}

func (service *catalogSyncService) ApplyEvent(ctx context.Context, event domain.CatalogSyncEvent) error {
	if strings.TrimSpace(event.EventID) == "" {
		return fmt.Errorf("%w: eventId is required", ErrInvalidCatalogSyncEvent)
	}

	if event.DocumentID <= 0 {
		return fmt.Errorf("%w: documentId must be positive", ErrInvalidCatalogSyncEvent)
	}

	if strings.TrimSpace(event.OccurredAt) != "" {
		if _, err := time.Parse(time.RFC3339, event.OccurredAt); err != nil {
			return fmt.Errorf("%w: occurredAt must be RFC3339", ErrInvalidCatalogSyncEvent)
		}
	}

	switch event.Collection {
	case domain.CatalogSyncCollectionMedia,
		domain.CatalogSyncCollectionCategories,
		domain.CatalogSyncCollectionSeasons,
		domain.CatalogSyncCollectionCareGuides,
		domain.CatalogSyncCollectionProducts:
	default:
		return fmt.Errorf("%w: unsupported collection", ErrInvalidCatalogSyncEvent)
	}

	switch event.Operation {
	case domain.CatalogSyncOperationDelete:
	case domain.CatalogSyncOperationUpsert:
		if len(event.Document) == 0 {
			return fmt.Errorf("%w: document is required for upsert", ErrInvalidCatalogSyncEvent)
		}
	default:
		return fmt.Errorf("%w: unsupported operation", ErrInvalidCatalogSyncEvent)
	}

	return service.repository.ApplyEvent(ctx, event)
}
