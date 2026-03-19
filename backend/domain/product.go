package domain

type Product struct {
	ID           int     `json:"id" gorm:"column:id;primaryKey"`
	Name         string  `json:"name" gorm:"column:name"`
	Slug         string  `json:"slug" gorm:"column:slug"`
	CategoryID   int     `json:"category_id" gorm:"column:category_id"`
	SeasonID     int     `json:"season_id" gorm:"column:season_id"`
	CareGuideID  int     `json:"care_guide_id" gorm:"column:care_guide_id"`
	Gender       string  `json:"gender" gorm:"column:gender"`
	BasePrice    float64 `json:"base_price" gorm:"column:base_price"`
	Stock        int     `json:"stock" gorm:"column:stock"`
	Weight       int     `json:"weight" gorm:"column:weight"`
	Length       int     `json:"length" gorm:"column:length"`
	Width        int     `json:"width" gorm:"column:width"`
	Height       int     `json:"height" gorm:"column:height"`
	Description  string  `json:"description" gorm:"column:description"`
	CoverImageID int     `json:"cover_image_id" gorm:"column:cover_image_id"`
}

func (Product) TableName() string {
	return "products"
}
