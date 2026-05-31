package domain

import "time"

type Product struct {
	ID              int                  `json:"id" gorm:"column:id;primaryKey"`
	Name            string               `json:"name" gorm:"column:name;not null;index"`
	Slug            string               `json:"slug" gorm:"column:slug;uniqueIndex;not null"`
	SeasonID        int                  `json:"season_id" gorm:"column:season_id"`
	Season          *Season              `json:"season,omitempty" gorm:"foreignKey:SeasonID;references:ID"`
	CategoryID      int                  `json:"category_id" gorm:"column:category_id"`
	Category        *Category            `json:"category,omitempty" gorm:"foreignKey:CategoryID;references:ID"`
	Gender          string               `json:"gender" gorm:"column:gender;not null;default:Unisex;index"`
	BasePrice       float64              `json:"base_price" gorm:"column:base_price;not null"`
	Weight          int                  `json:"weight" gorm:"column:weight;not null;default:0"`
	Length          int                  `json:"length" gorm:"column:length;not null;default:0"`
	Width           int                  `json:"width" gorm:"column:width;not null;default:0"`
	Height          int                  `json:"height" gorm:"column:height;not null;default:0"`
	Stock           int                  `json:"stock" gorm:"column:stock;not null;default:0"`
	Description     string               `json:"description" gorm:"column:description"`
	CoverImageID    int                  `json:"cover_image_id" gorm:"column:cover_image_id"`
	CoverImage      *Media               `json:"cover_image,omitempty" gorm:"foreignKey:CoverImageID;references:ID"`
	DetailInfo      map[string]any       `json:"detail_info,omitempty" gorm:"column:detail_info;type:jsonb;serializer:json" swaggertype:"object"`
	CareGuideID     int                  `json:"care_guide_id" gorm:"column:care_guide_id"`
	CareGuide       *CareGuide           `json:"care_guide,omitempty" gorm:"foreignKey:CareGuideID;references:ID"`
	AvailableColors []ProductColor       `json:"available_colors,omitempty" gorm:"foreignKey:ParentID;references:ID"`
	AvailableSizes  []ProductSize        `json:"available_sizes,omitempty" gorm:"foreignKey:ParentID;references:ID"`
	Gallery         []ProductGalleryItem `json:"gallery,omitempty" gorm:"foreignKey:ParentID;references:ID"`
	Variants        []ProductVariant     `json:"variants,omitempty" gorm:"foreignKey:ParentID;references:ID"`
	IsLookbook      bool                 `json:"is_lookbook" gorm:"column:is_lookbook;not null;default:false"`
	CreatedAt       time.Time            `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt       time.Time            `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (Product) TableName() string {
	return "products"
}

// --- Sub-types (domain models for DB rows) ---

type ProductColor struct {
	ID        int       `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	ParentID  int       `json:"_parent_id" gorm:"column:_parent_id;not null"`
	Order     int       `json:"_order" gorm:"column:_order"`
	ColorName string    `json:"color_name" gorm:"column:color_name;not null"`
	HexCode   string    `json:"hex_code" gorm:"column:hex_code;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (ProductColor) TableName() string {
	return "products_available_colors"
}

type ProductSize struct {
	ID        int       `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	ParentID  int       `json:"_parent_id" gorm:"column:_parent_id;not null"`
	Order     int       `json:"_order" gorm:"column:_order"`
	Size      string    `json:"size" gorm:"column:size;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (ProductSize) TableName() string {
	return "products_available_sizes"
}

type ProductGalleryItem struct {
	ID        int       `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	ParentID  int       `json:"_parent_id" gorm:"column:_parent_id;not null"`
	Order     int       `json:"_order" gorm:"column:_order"`
	ImageID   int       `json:"image_id" gorm:"column:image_id;not null"`
	Image     *Media    `json:"image,omitempty" gorm:"foreignKey:ImageID;references:ID"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (ProductGalleryItem) TableName() string {
	return "products_gallery"
}

type ProductVariant struct {
	ID        int       `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	ParentID  int       `json:"_parent_id" gorm:"column:_parent_id;not null"`
	Order     int       `json:"_order" gorm:"column:_order"`
	ColorName string    `json:"color_name" gorm:"column:color_name;not null"`
	Size      string    `json:"size" gorm:"column:size;not null"`
	Stock     int       `json:"stock" gorm:"column:stock;not null;default:0"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (ProductVariant) TableName() string {
	return "products_variants"
}

// --- Request types for POST/PUT (auto-generated fields omitted) ---

type CreateProductColorRequest struct {
	Order     int    `json:"_order"`
	ColorName string `json:"color_name" binding:"required"`
	HexCode   string `json:"hex_code" binding:"required"`
}

func (r CreateProductColorRequest) ToProductColor() ProductColor {
	return ProductColor{
		Order:     r.Order,
		ColorName: r.ColorName,
		HexCode:   r.HexCode,
	}
}

type CreateProductSizeRequest struct {
	Order int    `json:"_order"`
	Size  string `json:"size" binding:"required"`
}

func (r CreateProductSizeRequest) ToProductSize() ProductSize {
	return ProductSize{
		Order: r.Order,
		Size:  r.Size,
	}
}

type CreateProductGalleryItemRequest struct {
	Order   int `json:"_order"`
	ImageID int `json:"image_id" binding:"required"`
}

func (r CreateProductGalleryItemRequest) ToProductGalleryItem() ProductGalleryItem {
	return ProductGalleryItem{
		Order:   r.Order,
		ImageID: r.ImageID,
	}
}

type CreateProductVariantRequest struct {
	Order     int    `json:"_order"`
	ColorName string `json:"color_name" binding:"required"`
	Size      string `json:"size" binding:"required"`
	Stock     int    `json:"stock"`
}

func (r CreateProductVariantRequest) ToProductVariant() ProductVariant {
	return ProductVariant{
		Order:     r.Order,
		ColorName: r.ColorName,
		Size:      r.Size,
		Stock:     r.Stock,
	}
}

type CreateProductRequest struct {
	Name            string                            `json:"name" binding:"required"`
	Slug            string                            `json:"slug" binding:"required"`
	SeasonID        int                               `json:"season_id"`
	CategoryID      int                               `json:"category_id"`
	Gender          string                            `json:"gender"`
	BasePrice       float64                           `json:"base_price" binding:"required"`
	Weight          int                               `json:"weight"`
	Length          int                               `json:"length"`
	Width           int                               `json:"width"`
	Height          int                               `json:"height"`
	Stock           int                               `json:"stock"`
	Description     string                            `json:"description"`
	CoverImageID    int                               `json:"cover_image_id"`
	DetailInfo      map[string]any                    `json:"detail_info,omitempty" swaggertype:"object"`
	CareGuideID     int                               `json:"care_guide_id"`
	AvailableColors []CreateProductColorRequest       `json:"available_colors,omitempty"`
	AvailableSizes  []CreateProductSizeRequest        `json:"available_sizes,omitempty"`
	Gallery         []CreateProductGalleryItemRequest `json:"gallery,omitempty"`
	Variants        []CreateProductVariantRequest     `json:"variants,omitempty"`
	IsLookbook      bool                              `json:"is_lookbook"`
	DraftID         string                            `json:"draft_id"`
}

func (r CreateProductRequest) ToProduct() Product {
	return Product{
		Name:            r.Name,
		Slug:            r.Slug,
		SeasonID:        r.SeasonID,
		CategoryID:      r.CategoryID,
		Gender:          r.Gender,
		BasePrice:       r.BasePrice,
		Weight:          r.Weight,
		Length:          r.Length,
		Width:           r.Width,
		Height:          r.Height,
		Stock:           r.Stock,
		Description:     r.Description,
		CoverImageID:    r.CoverImageID,
		DetailInfo:      r.DetailInfo,
		CareGuideID:     r.CareGuideID,
		IsLookbook:      r.IsLookbook,
		AvailableColors: mapColors(r.AvailableColors),
		AvailableSizes:  mapSizes(r.AvailableSizes),
		Gallery:         mapGallery(r.Gallery),
		Variants:        mapVariants(r.Variants),
	}
}

type UpdateProductRequest struct {
	Name            string                            `json:"name" binding:"required"`
	Slug            string                            `json:"slug" binding:"required"`
	SeasonID        int                               `json:"season_id"`
	CategoryID      int                               `json:"category_id"`
	Gender          string                            `json:"gender"`
	BasePrice       float64                           `json:"base_price" binding:"required"`
	Weight          int                               `json:"weight"`
	Length          int                               `json:"length"`
	Width           int                               `json:"width"`
	Height          int                               `json:"height"`
	Stock           int                               `json:"stock"`
	Description     string                            `json:"description"`
	CoverImageID    int                               `json:"cover_image_id"`
	DetailInfo      map[string]any                    `json:"detail_info,omitempty" swaggertype:"object"`
	CareGuideID     int                               `json:"care_guide_id"`
	AvailableColors []CreateProductColorRequest       `json:"available_colors,omitempty"`
	AvailableSizes  []CreateProductSizeRequest        `json:"available_sizes,omitempty"`
	Gallery         []CreateProductGalleryItemRequest `json:"gallery,omitempty"`
	Variants        []CreateProductVariantRequest     `json:"variants,omitempty"`
	IsLookbook      bool                              `json:"is_lookbook"`
}

func (r UpdateProductRequest) ToProduct(id int) Product {
	return Product{
		ID:              id,
		Name:            r.Name,
		Slug:            r.Slug,
		SeasonID:        r.SeasonID,
		CategoryID:      r.CategoryID,
		Gender:          r.Gender,
		BasePrice:       r.BasePrice,
		Weight:          r.Weight,
		Length:          r.Length,
		Width:           r.Width,
		Height:          r.Height,
		Stock:           r.Stock,
		Description:     r.Description,
		CoverImageID:    r.CoverImageID,
		DetailInfo:      r.DetailInfo,
		CareGuideID:     r.CareGuideID,
		IsLookbook:      r.IsLookbook,
		AvailableColors: mapColors(r.AvailableColors),
		AvailableSizes:  mapSizes(r.AvailableSizes),
		Gallery:         mapGallery(r.Gallery),
		Variants:        mapVariants(r.Variants),
	}
}

func mapColors(reqs []CreateProductColorRequest) []ProductColor {
	out := make([]ProductColor, len(reqs))
	for i, r := range reqs {
		out[i] = r.ToProductColor()
	}
	return out
}

func mapSizes(reqs []CreateProductSizeRequest) []ProductSize {
	out := make([]ProductSize, len(reqs))
	for i, r := range reqs {
		out[i] = r.ToProductSize()
	}
	return out
}

func mapGallery(reqs []CreateProductGalleryItemRequest) []ProductGalleryItem {
	out := make([]ProductGalleryItem, len(reqs))
	for i, r := range reqs {
		out[i] = r.ToProductGalleryItem()
	}
	return out
}

func mapVariants(reqs []CreateProductVariantRequest) []ProductVariant {
	out := make([]ProductVariant, len(reqs))
	for i, r := range reqs {
		out[i] = r.ToProductVariant()
	}
	return out
}
