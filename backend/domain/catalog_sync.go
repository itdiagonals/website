package domain

import "encoding/json"

type CatalogSyncCollection string

const (
	CatalogSyncCollectionMedia      CatalogSyncCollection = "media"
	CatalogSyncCollectionCategories CatalogSyncCollection = "categories"
	CatalogSyncCollectionSeasons    CatalogSyncCollection = "seasons"
	CatalogSyncCollectionCareGuides CatalogSyncCollection = "care-guides"
	CatalogSyncCollectionProducts   CatalogSyncCollection = "products"
)

type CatalogSyncOperation string

const (
	CatalogSyncOperationDelete CatalogSyncOperation = "delete"
	CatalogSyncOperationUpsert CatalogSyncOperation = "upsert"
)

type CatalogSyncEvent struct {
	EventID    string                `json:"eventId"`
	Collection CatalogSyncCollection `json:"collection"`
	Operation  CatalogSyncOperation  `json:"operation"`
	DocumentID int64                 `json:"documentId"`
	OccurredAt string                `json:"occurredAt"`
	Document   json.RawMessage       `json:"document,omitempty"`
}

type CatalogMediaSyncDocument struct {
	ID  int64  `json:"id"`
	Alt string `json:"alt"`
	URL string `json:"url"`
}

type CatalogCategorySyncDocument struct {
	ID           int64  `json:"id"`
	CoverImageID int64  `json:"coverImageId"`
	Name         string `json:"name"`
	Slug         string `json:"slug"`
}

type CatalogSeasonImageSyncDocument struct {
	ImageID   int64 `json:"imageId"`
	SortOrder int   `json:"sortOrder"`
}

type CatalogSeasonSyncDocument struct {
	ID            int64                            `json:"id"`
	CoverImageID  int64                            `json:"coverImageId"`
	Description   string                           `json:"description"`
	IsActive      bool                             `json:"isActive"`
	LookbookImage []CatalogSeasonImageSyncDocument `json:"lookbookImages"`
	Name          string                           `json:"name"`
	Slug          string                           `json:"slug"`
	Subtitle      string                           `json:"subtitle"`
}

type CatalogCareGuideSyncDocument struct {
	ID           int64           `json:"id"`
	Instructions json.RawMessage `json:"instructions"`
	Title        string          `json:"title"`
}

type CatalogProductGallerySyncDocument struct {
	ImageID   int64 `json:"imageId"`
	SortOrder int   `json:"sortOrder"`
}

type CatalogProductColorSyncDocument struct {
	ColorName string `json:"colorName"`
	HexCode   string `json:"hexCode"`
	SortOrder int    `json:"sortOrder"`
}

type CatalogProductSizeSyncDocument struct {
	Size      string `json:"size"`
	SortOrder int    `json:"sortOrder"`
}

type CatalogProductSyncDocument struct {
	ID              int64                               `json:"id"`
	BasePrice       float64                             `json:"basePrice"`
	CareGuideID     *int64                              `json:"careGuideId"`
	CategoryID      int64                               `json:"categoryId"`
	CoverImageID    int64                               `json:"coverImageId"`
	Description     string                              `json:"description"`
	DetailInfo      json.RawMessage                     `json:"detailInfo"`
	AvailableColors []CatalogProductColorSyncDocument   `json:"availableColors"`
	AvailableSizes  []CatalogProductSizeSyncDocument    `json:"availableSizes"`
	Gallery         []CatalogProductGallerySyncDocument `json:"gallery"`
	Gender          string                              `json:"gender"`
	Name            string                              `json:"name"`
	SeasonID        int64                               `json:"seasonId"`
	Slug            string                              `json:"slug"`
	Stock           int                                 `json:"stock"`
}
