package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type CatalogSyncRepository interface {
	ApplyEvent(ctx context.Context, event domain.CatalogSyncEvent) error
}

type catalogSyncRepository struct {
	db *gorm.DB
}

func NewCatalogSyncRepository(db *gorm.DB) CatalogSyncRepository {
	return &catalogSyncRepository{db: db}
}

func (repository *catalogSyncRepository) ApplyEvent(ctx context.Context, event domain.CatalogSyncEvent) error {
	return repository.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		processed, err := repository.markProcessed(tx, event)
		if err != nil {
			return err
		}

		if !processed {
			return nil
		}

		switch event.Collection {
		case domain.CatalogSyncCollectionMedia:
			if event.Operation == domain.CatalogSyncOperationDelete {
				return tx.Exec(`DELETE FROM catalog_media WHERE id = ?`, event.DocumentID).Error
			}

			var doc domain.CatalogMediaSyncDocument
			if err := json.Unmarshal(event.Document, &doc); err != nil {
				return fmt.Errorf("unmarshal media sync document: %w", err)
			}

			return tx.Exec(`
				INSERT INTO catalog_media (id, alt, url, updated_at)
				VALUES (?, ?, ?, NOW())
				ON CONFLICT (id) DO UPDATE SET
					alt = EXCLUDED.alt,
					url = EXCLUDED.url,
					updated_at = NOW()
			`, doc.ID, strings.TrimSpace(doc.Alt), strings.TrimSpace(doc.URL)).Error
		case domain.CatalogSyncCollectionCategories:
			if event.Operation == domain.CatalogSyncOperationDelete {
				return tx.Exec(`DELETE FROM catalog_categories WHERE id = ?`, event.DocumentID).Error
			}

			var doc domain.CatalogCategorySyncDocument
			if err := json.Unmarshal(event.Document, &doc); err != nil {
				return fmt.Errorf("unmarshal category sync document: %w", err)
			}

			return tx.Exec(`
				INSERT INTO catalog_categories (id, name, slug, cover_image_id, updated_at)
				VALUES (?, ?, ?, ?, NOW())
				ON CONFLICT (id) DO UPDATE SET
					name = EXCLUDED.name,
					slug = EXCLUDED.slug,
					cover_image_id = EXCLUDED.cover_image_id,
					updated_at = NOW()
			`, doc.ID, strings.TrimSpace(doc.Name), strings.TrimSpace(doc.Slug), nullableInt64(doc.CoverImageID)).Error
		case domain.CatalogSyncCollectionSeasons:
			if event.Operation == domain.CatalogSyncOperationDelete {
				if err := tx.Exec(`DELETE FROM catalog_season_lookbook_images WHERE season_id = ?`, event.DocumentID).Error; err != nil {
					return err
				}
				return tx.Exec(`DELETE FROM catalog_seasons WHERE id = ?`, event.DocumentID).Error
			}

			var doc domain.CatalogSeasonSyncDocument
			if err := json.Unmarshal(event.Document, &doc); err != nil {
				return fmt.Errorf("unmarshal season sync document: %w", err)
			}

			if err := tx.Exec(`
				INSERT INTO catalog_seasons (id, name, slug, subtitle, description, cover_image_id, is_active, updated_at)
				VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
				ON CONFLICT (id) DO UPDATE SET
					name = EXCLUDED.name,
					slug = EXCLUDED.slug,
					subtitle = EXCLUDED.subtitle,
					description = EXCLUDED.description,
					cover_image_id = EXCLUDED.cover_image_id,
					is_active = EXCLUDED.is_active,
					updated_at = NOW()
			`, doc.ID, strings.TrimSpace(doc.Name), strings.TrimSpace(doc.Slug), strings.TrimSpace(doc.Subtitle), strings.TrimSpace(doc.Description), nullableInt64(doc.CoverImageID), doc.IsActive).Error; err != nil {
				return err
			}

			if err := tx.Exec(`DELETE FROM catalog_season_lookbook_images WHERE season_id = ?`, doc.ID).Error; err != nil {
				return err
			}

			for _, image := range doc.LookbookImage {
				if err := tx.Exec(`
					INSERT INTO catalog_season_lookbook_images (season_id, image_id, sort_order)
					VALUES (?, ?, ?)
				`, doc.ID, image.ImageID, image.SortOrder).Error; err != nil {
					return err
				}
			}

			return nil
		case domain.CatalogSyncCollectionCareGuides:
			if event.Operation == domain.CatalogSyncOperationDelete {
				return tx.Exec(`DELETE FROM catalog_care_guides WHERE id = ?`, event.DocumentID).Error
			}

			var doc domain.CatalogCareGuideSyncDocument
			if err := json.Unmarshal(event.Document, &doc); err != nil {
				return fmt.Errorf("unmarshal care guide sync document: %w", err)
			}

			return tx.Exec(`
				INSERT INTO catalog_care_guides (id, title, instructions, updated_at)
				VALUES (?, ?, CAST(? AS JSONB), NOW())
				ON CONFLICT (id) DO UPDATE SET
					title = EXCLUDED.title,
					instructions = EXCLUDED.instructions,
					updated_at = NOW()
			`, doc.ID, strings.TrimSpace(doc.Title), nullableJSON(doc.Instructions)).Error
		case domain.CatalogSyncCollectionProducts:
			if event.Operation == domain.CatalogSyncOperationDelete {
				if err := repository.deleteProductChildren(tx, event.DocumentID); err != nil {
					return err
				}
				return tx.Exec(`DELETE FROM catalog_products WHERE id = ?`, event.DocumentID).Error
			}

			var doc domain.CatalogProductSyncDocument
			if err := json.Unmarshal(event.Document, &doc); err != nil {
				return fmt.Errorf("unmarshal product sync document: %w", err)
			}

			if err := tx.Exec(`
				INSERT INTO catalog_products (
					id,
					name,
					slug,
					category_id,
					season_id,
					care_guide_id,
					gender,
					base_price,
					stock,
					description,
					detail_info,
					cover_image_id,
					updated_at
				)
				VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CAST(? AS JSONB), ?, NOW())
				ON CONFLICT (id) DO UPDATE SET
					name = EXCLUDED.name,
					slug = EXCLUDED.slug,
					category_id = EXCLUDED.category_id,
					season_id = EXCLUDED.season_id,
					care_guide_id = EXCLUDED.care_guide_id,
					gender = EXCLUDED.gender,
					base_price = EXCLUDED.base_price,
					stock = EXCLUDED.stock,
					description = EXCLUDED.description,
					detail_info = EXCLUDED.detail_info,
					cover_image_id = EXCLUDED.cover_image_id,
					updated_at = NOW()
			`, doc.ID, strings.TrimSpace(doc.Name), strings.TrimSpace(doc.Slug), doc.CategoryID, doc.SeasonID, nullablePointerInt64(doc.CareGuideID), strings.TrimSpace(doc.Gender), doc.BasePrice, doc.Stock, strings.TrimSpace(doc.Description), nullableJSON(doc.DetailInfo), nullableInt64(doc.CoverImageID)).Error; err != nil {
				return err
			}

			if err := repository.deleteProductChildren(tx, doc.ID); err != nil {
				return err
			}

			for _, galleryItem := range doc.Gallery {
				if err := tx.Exec(`
					INSERT INTO catalog_product_gallery (product_id, image_id, sort_order)
					VALUES (?, ?, ?)
				`, doc.ID, galleryItem.ImageID, galleryItem.SortOrder).Error; err != nil {
					return err
				}
			}

			for _, color := range doc.AvailableColors {
				if err := tx.Exec(`
					INSERT INTO catalog_product_colors (product_id, color_name, hex_code, sort_order)
					VALUES (?, ?, ?, ?)
				`, doc.ID, strings.TrimSpace(color.ColorName), strings.TrimSpace(color.HexCode), color.SortOrder).Error; err != nil {
					return err
				}
			}

			for _, size := range doc.AvailableSizes {
				if err := tx.Exec(`
					INSERT INTO catalog_product_sizes (product_id, size, sort_order)
					VALUES (?, ?, ?)
				`, doc.ID, strings.TrimSpace(size.Size), size.SortOrder).Error; err != nil {
					return err
				}
			}

			return nil
		default:
			return fmt.Errorf("unsupported catalog sync collection: %s", event.Collection)
		}
	})
}

func (repository *catalogSyncRepository) markProcessed(tx *gorm.DB, event domain.CatalogSyncEvent) (bool, error) {
	var occurredAt any
	if strings.TrimSpace(event.OccurredAt) != "" {
		parsed, err := time.Parse(time.RFC3339, event.OccurredAt)
		if err != nil {
			return false, fmt.Errorf("parse occurredAt: %w", err)
		}
		occurredAt = parsed
	}

	result := tx.Exec(`
		INSERT INTO catalog_sync_processed_events (event_id, collection, operation, document_id, occurred_at)
		VALUES (?, ?, ?, ?, ?)
		ON CONFLICT (event_id) DO NOTHING
	`, event.EventID, event.Collection, event.Operation, event.DocumentID, occurredAt)
	if result.Error != nil {
		return false, result.Error
	}

	return result.RowsAffected == 1, nil
}

func (repository *catalogSyncRepository) deleteProductChildren(tx *gorm.DB, productID int64) error {
	statements := []string{
		`DELETE FROM catalog_product_gallery WHERE product_id = ?`,
		`DELETE FROM catalog_product_colors WHERE product_id = ?`,
		`DELETE FROM catalog_product_sizes WHERE product_id = ?`,
	}

	for _, statement := range statements {
		if err := tx.Exec(statement, productID).Error; err != nil {
			return err
		}
	}

	return nil
}

func nullableInt64(value int64) any {
	if value <= 0 {
		return nil
	}

	return value
}

func nullablePointerInt64(value *int64) any {
	if value == nil || *value <= 0 {
		return nil
	}

	return *value
}

func nullableJSON(value json.RawMessage) any {
	trimmed := strings.TrimSpace(string(value))
	if trimmed == "" || trimmed == "null" {
		return nil
	}

	return trimmed
}
