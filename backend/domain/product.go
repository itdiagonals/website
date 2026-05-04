package domain

import "time"

type Product struct {
	ID              int                  `json:"id" gorm:"column:id;primaryKey"`
	Name            string               `json:"name" gorm:"column:name;not null"`
	Slug            string               `json:"slug" gorm:"column:slug;uniqueIndex;not null"`
	SeasonID        int                  `json:"season_id" gorm:"column:season_id"`
	Season          *Season              `json:"season,omitempty" gorm:"foreignKey:SeasonID;references:ID"`
	CategoryID      int                  `json:"category_id" gorm:"column:category_id"`
	Category        *Category            `json:"category,omitempty" gorm:"foreignKey:CategoryID;references:ID"`
	Gender          string               `json:"gender" gorm:"column:gender;not null;default:unisex"`
	BasePrice       float64              `json:"base_price" gorm:"column:base_price;not null"`
	Weight          int                  `json:"weight" gorm:"column:weight;not null;default:0"`
	Length          int                  `json:"length" gorm:"column:length;not null;default:0"`
	Width           int                  `json:"width" gorm:"column:width;not null;default:0"`
	Height          int                  `json:"height" gorm:"column:height;not null;default:0"`
	Stock           int                  `json:"stock" gorm:"column:stock;not null;default:0"`
	Description     string               `json:"description" gorm:"column:description"`
	CoverImageID    int                  `json:"cover_image_id" gorm:"column:cover_image_id"`
	CoverImage      *Media               `json:"cover_image,omitempty" gorm:"foreignKey:CoverImageID;references:ID"`
	DetailInfo      any                  `json:"detail_info,omitempty" gorm:"-" swaggertype:"object"`
	CareGuideID     int                  `json:"care_guide_id" gorm:"column:care_guide_id"`
	CareGuide       *CareGuide           `json:"care_guide,omitempty" gorm:"foreignKey:CareGuideID;references:ID"`
	AvailableColors []ProductColor       `json:"available_colors,omitempty" gorm:"foreignKey:ParentID;references:ID"`
	AvailableSizes  []ProductSize        `json:"available_sizes,omitempty" gorm:"foreignKey:ParentID;references:ID"`
	Gallery         []ProductGalleryItem `json:"gallery,omitempty" gorm:"foreignKey:ParentID;references:ID"`
	Variants        []ProductVariant     `json:"variants,omitempty" gorm:"foreignKey:ParentID;references:ID"`
	CreatedAt       time.Time            `json:"created_at" gorm:"column:created_at"`
	UpdatedAt       time.Time            `json:"updated_at" gorm:"column:updated_at"`
}

func (Product) TableName() string {
	return "products"
}

type ProductColor struct {
	ID        int       `json:"id" gorm:"column:id;primaryKey"`
	ParentID  int       `json:"_parent_id" gorm:"column:_parent_id;not null"`
	Order     int       `json:"_order" gorm:"column:_order"`
	ColorName string    `json:"color_name" gorm:"column:color_name;not null"`
	HexCode   string    `json:"hex_code" gorm:"column:hex_code;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (ProductColor) TableName() string {
	return "products_available_colors"
}

type ProductSize struct {
	ID        int       `json:"id" gorm:"column:id;primaryKey"`
	ParentID  int       `json:"_parent_id" gorm:"column:_parent_id;not null"`
	Order     int       `json:"_order" gorm:"column:_order"`
	Size      string    `json:"size" gorm:"column:size;not null"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (ProductSize) TableName() string {
	return "products_available_sizes"
}

type ProductGalleryItem struct {
	ID        int       `json:"id" gorm:"column:id;primaryKey"`
	ParentID  int       `json:"_parent_id" gorm:"column:_parent_id;not null"`
	Order     int       `json:"_order" gorm:"column:_order"`
	ImageID   int       `json:"image_id" gorm:"column:image_id;not null"`
	Image     *Media    `json:"image,omitempty" gorm:"foreignKey:ImageID;references:ID"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (ProductGalleryItem) TableName() string {
	return "products_gallery"
}

type ProductVariant struct {
	ID        int       `json:"id" gorm:"column:id;primaryKey"`
	ParentID  int       `json:"_parent_id" gorm:"column:_parent_id;not null"`
	Order     int       `json:"_order" gorm:"column:_order"`
	ColorName string    `json:"color_name" gorm:"column:color_name;not null"`
	Size      string    `json:"size" gorm:"column:size;not null"`
	Stock     int       `json:"stock" gorm:"column:stock;not null;default:0"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (ProductVariant) TableName() string {
	return "products_variants"
}
