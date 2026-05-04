package domain

import "time"

type CareGuide struct {
	ID           int       `json:"id" gorm:"column:id;primaryKey"`
	Title        string    `json:"title" gorm:"column:title;not null"`
	Instructions any       `json:"instructions" gorm:"-" swaggertype:"object"`
	CreatedAt    time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (CareGuide) TableName() string {
	return "care_guides"
}
