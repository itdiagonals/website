package domain

import "time"

type Category struct {
	ID           int       `json:"id" gorm:"column:id;primaryKey"`
	Name         string    `json:"name" gorm:"column:name;not null"`
	Slug         string    `json:"slug" gorm:"column:slug;uniqueIndex;not null"`
	CoverImageID int       `json:"cover_image_id" gorm:"column:cover_image_id"`
	CoverImage   *Media    `json:"cover_image,omitempty" gorm:"foreignKey:CoverImageID;references:ID"`
	CreatedAt    time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (Category) TableName() string {
	return "categories"
}

// CreateCategoryRequest is the request body for POST /api/v1/categories.
type CreateCategoryRequest struct {
	Name         string `json:"name" binding:"required"`
	Slug         string `json:"slug" binding:"required"`
	CoverImageID int    `json:"cover_image_id"`
	DraftID      string `json:"draft_id"`
}

func (r CreateCategoryRequest) ToCategory() Category {
	return Category{
		Name:         r.Name,
		Slug:         r.Slug,
		CoverImageID: r.CoverImageID,
	}
}

// UpdateCategoryRequest is the request body for PUT /api/v1/categories/:id.
type UpdateCategoryRequest struct {
	Name         string `json:"name" binding:"required"`
	Slug         string `json:"slug" binding:"required"`
	CoverImageID int    `json:"cover_image_id"`
}

func (r UpdateCategoryRequest) ToCategory(id int) Category {
	return Category{
		ID:           id,
		Name:         r.Name,
		Slug:         r.Slug,
		CoverImageID: r.CoverImageID,
	}
}
