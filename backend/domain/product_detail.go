package domain

type ProductColorOption struct {
	ColorName string `json:"color_name" gorm:"column:color_name"`
	HexCode   string `json:"hex_code" gorm:"column:hex_code"`
}

type ProductSizeOption struct {
	Size string `json:"size" gorm:"column:size"`
}

type ProductReference struct {
	ID   int    `json:"id" gorm:"column:id"`
	Name string `json:"name" gorm:"column:name"`
	Slug string `json:"slug" gorm:"column:slug"`
}

type ProductMediaItem struct {
	ID  int    `json:"id" gorm:"column:id"`
	URL string `json:"url" gorm:"column:url"`
	Alt string `json:"alt" gorm:"column:alt"`
}

type ProductCareGuide struct {
	ID           int    `json:"id" gorm:"column:id"`
	Title        string `json:"title" gorm:"column:title"`
	Instructions any    `json:"instructions" gorm:"-" swaggertype:"object"`
}

type ProductDetail struct {
	ID              int                  `json:"id" gorm:"column:id;primaryKey"`
	Name            string               `json:"name" gorm:"column:name"`
	Slug            string               `json:"slug" gorm:"column:slug"`
	Gender          string               `json:"gender" gorm:"column:gender"`
	BasePrice       float64              `json:"base_price" gorm:"column:base_price"`
	Stock           int                  `json:"stock" gorm:"column:stock"`
	Weight          int                  `json:"weight" gorm:"column:weight"`
	Length          int                  `json:"length" gorm:"column:length"`
	Width           int                  `json:"width" gorm:"column:width"`
	Height          int                  `json:"height" gorm:"column:height"`
	Description     string               `json:"description" gorm:"column:description"`
	DetailInfo      any                  `json:"detail_info" gorm:"-" swaggertype:"object"`
	Category        ProductReference     `json:"category" gorm:"-"`
	Season          ProductReference     `json:"season" gorm:"-"`
	CareGuide       *ProductCareGuide    `json:"care_guide,omitempty" gorm:"-"`
	CoverImageID    int                  `json:"-" gorm:"column:cover_image_id"`
	CoverImageURL   string               `json:"cover_image_url" gorm:"column:cover_image_url"`
	CoverImageAlt   string               `json:"cover_image_alt" gorm:"column:cover_image_alt"`
	Gallery         []ProductMediaItem   `json:"gallery" gorm:"-"`
	AvailableColors []ProductColorOption `json:"available_colors" gorm:"-"`
	AvailableSizes  []ProductSizeOption  `json:"available_sizes" gorm:"-"`
}
