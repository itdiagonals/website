package domain

import "time"

type CareGuide struct {
	ID           int       `json:"id" gorm:"column:id;primaryKey"`
	Title        string    `json:"title" gorm:"column:title;not null"`
	Instructions any       `json:"instructions" gorm:"column:instructions;type:jsonb;serializer:json" swaggertype:"object"`
	CreatedAt    time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (CareGuide) TableName() string {
	return "care_guides"
}

// CreateCareGuideRequest is the request body for POST /api/v1/care-guides.
type CreateCareGuideRequest struct {
	Title        string `json:"title" binding:"required"`
	Instructions any    `json:"instructions" swaggertype:"object"`
}

func (r CreateCareGuideRequest) ToCareGuide() CareGuide {
	return CareGuide{
		Title:        r.Title,
		Instructions: r.Instructions,
	}
}

// UpdateCareGuideRequest is the request body for PUT /api/v1/care-guides/:id.
type UpdateCareGuideRequest struct {
	Title        string `json:"title" binding:"required"`
	Instructions any    `json:"instructions" swaggertype:"object"`
}

func (r UpdateCareGuideRequest) ToCareGuide(id int) CareGuide {
	return CareGuide{
		ID:           id,
		Title:        r.Title,
		Instructions: r.Instructions,
	}
}
