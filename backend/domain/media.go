package domain

import "time"

type Media struct {
	ID        int       `json:"id" gorm:"column:id;primaryKey"`
	Alt       string    `json:"alt" gorm:"column:alt;not null"`
	URL       string    `json:"url" gorm:"column:url;not null"`
	Filename  string    `json:"filename" gorm:"column:filename;not null"`
	MimeType  string    `json:"mime_type" gorm:"column:mime_type"`
	Filesize  int64     `json:"filesize" gorm:"column:filesize"`
	Width     int       `json:"width" gorm:"column:width"`
	Height    int       `json:"height" gorm:"column:height"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (Media) TableName() string {
	return "media"
}
