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
	CreatedAt      time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt      time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (Season) TableName() string {
	return "seasons"
}

// CreateSeasonRequest is the request body for POST /api/v1/seasons.
type CreateSeasonRequest struct {
	Name             string `json:"name" binding:"required"`
	Slug             string `json:"slug" binding:"required"`
	Subtitle         string `json:"subtitle"`
	Description      string `json:"description"`
	CoverImageID     int    `json:"cover_image_id"`
	LookbookImageIDs []int  `json:"lookbook_image_ids,omitempty"`
	IsActive         *bool  `json:"is_active"`
}

func (r CreateSeasonRequest) ToSeason() Season {
	s := Season{
		Name:         r.Name,
		Slug:         r.Slug,
		Subtitle:     r.Subtitle,
		Description:  r.Description,
		CoverImageID: r.CoverImageID,
		IsActive:     true,
	}
	if len(r.LookbookImageIDs) > 0 {
		s.LookbookImages = mapMediaRefs(r.LookbookImageIDs)
	}
	if r.IsActive != nil {
		s.IsActive = *r.IsActive
	}
	return s
}

// UpdateSeasonRequest is the request body for PUT /api/v1/seasons/:id.
type UpdateSeasonRequest struct {
	Name             string `json:"name" binding:"required"`
	Slug             string `json:"slug" binding:"required"`
	Subtitle         string `json:"subtitle"`
	Description      string `json:"description"`
	CoverImageID     int    `json:"cover_image_id"`
	LookbookImageIDs []int  `json:"lookbook_image_ids,omitempty"`
	IsActive         *bool  `json:"is_active"`
}

func (r UpdateSeasonRequest) ToSeason(id int) Season {
	s := Season{
		ID:           id,
		Name:         r.Name,
		Slug:         r.Slug,
		Subtitle:     r.Subtitle,
		Description:  r.Description,
		CoverImageID: r.CoverImageID,
		IsActive:     true,
	}
	if len(r.LookbookImageIDs) > 0 {
		s.LookbookImages = mapMediaRefs(r.LookbookImageIDs)
	}
	if r.IsActive != nil {
		s.IsActive = *r.IsActive
	}
	return s
}

func mapMediaRefs(ids []int) []Media {
	refs := make([]Media, 0, len(ids))
	for _, id := range ids {
		refs = append(refs, Media{ID: id})
	}
	return refs
}
