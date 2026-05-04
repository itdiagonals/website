package domain

import "time"

type Category struct {
	ID           int       `json:"id" gorm:"column:id;primaryKey"`
	Name         string    `json:"name" gorm:"column:name;not null"`
	Slug         string    `json:"slug" gorm:"column:slug;uniqueIndex;not null"`
	CoverImageID int       `json:"cover_image_id" gorm:"column:cover_image_id"`
	CoverImage   *Media    `json:"cover_image,omitempty" gorm:"foreignKey:CoverImageID;references:ID"`
	CreatedAt    time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (Category) TableName() string {
	return "categories"
}
