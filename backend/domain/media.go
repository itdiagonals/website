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
	DraftID   *string   `json:"draft_id,omitempty" gorm:"column:draft_id;index"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (Media) TableName() string {
	return "media"
}

// CreateMediaRequest is the request body for POST /api/v1/media.
type CreateMediaRequest struct {
	Alt      string `json:"alt" binding:"required"`
	URL      string `json:"url" binding:"required"`
	Filename string `json:"filename" binding:"required"`
	MimeType string `json:"mime_type"`
	Filesize int64  `json:"filesize"`
	Width    int    `json:"width"`
	Height   int    `json:"height"`
}

func (r CreateMediaRequest) ToMedia() Media {
	return Media{
		Alt:      r.Alt,
		URL:      r.URL,
		Filename: r.Filename,
		MimeType: r.MimeType,
		Filesize: r.Filesize,
		Width:    r.Width,
		Height:   r.Height,
	}
}

// UpdateMediaRequest is the request body for PUT /api/v1/media/:id.
type UpdateMediaRequest struct {
	Alt      string `json:"alt" binding:"required"`
	URL      string `json:"url" binding:"required"`
	Filename string `json:"filename" binding:"required"`
	MimeType string `json:"mime_type"`
	Filesize int64  `json:"filesize"`
	Width    int    `json:"width"`
	Height   int    `json:"height"`
}

func (r UpdateMediaRequest) ToMedia(id int) Media {
	return Media{
		ID:       id,
		Alt:      r.Alt,
		URL:      r.URL,
		Filename: r.Filename,
		MimeType: r.MimeType,
		Filesize: r.Filesize,
		Width:    r.Width,
		Height:   r.Height,
	}
}
