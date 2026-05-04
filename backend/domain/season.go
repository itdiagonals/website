package domain

import "time"

type Season struct {
	ID             int       `json:"id" gorm:"column:id;primaryKey"`
	Name           string    `json:"name" gorm:"column:name;not null"`
	Slug           string    `json:"slug" gorm:"column:slug;uniqueIndex;not null"`
	Subtitle       string    `json:"subtitle" gorm:"column:subtitle"`
	Description    string    `json:"description" gorm:"column:description"`
	CoverImageID   int       `json:"cover_image_id" gorm:"column:cover_image_id"`
	CoverImage     *Media    `json:"cover_image,omitempty" gorm:"foreignKey:CoverImageID;references:ID"`
	IsActive       bool      `json:"is_active" gorm:"column:is_active;default:true"`
	LookbookImages []Media   `json:"lookbook_images,omitempty" gorm:"many2many:season_lookbook_images;"`
	CreatedAt      time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt      time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (Season) TableName() string {
	return "seasons"
}
