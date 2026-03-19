package domain

import "time"

type CustomerAddress struct {
	ID                   uint      `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	CustomerID           uint      `json:"customer_id" gorm:"column:customer_id;not null;index"`
	Title                string    `json:"title" gorm:"column:title;type:varchar(100);not null"`
	RecipientName        string    `json:"recipient_name" gorm:"column:recipient_name;type:varchar(255);not null"`
	PhoneNumber          string    `json:"phone_number" gorm:"column:phone_number;type:varchar(50);not null"`
	Province             string    `json:"province" gorm:"column:province;type:varchar(255);not null"`
	City                 string    `json:"city" gorm:"column:city;type:varchar(255);not null"`
	District             string    `json:"district" gorm:"column:district;type:varchar(255);not null"`
	Village              string    `json:"village" gorm:"column:village;type:varchar(255);not null"`
	PostalCode           string    `json:"postal_code" gorm:"column:postal_code;type:varchar(20);not null"`
	FullAddress          string    `json:"full_address" gorm:"column:full_address;type:text;not null"`
	Latitude             *float64  `json:"latitude,omitempty" gorm:"column:latitude;type:decimal(10,7)"`
	Longitude            *float64  `json:"longitude,omitempty" gorm:"column:longitude;type:decimal(10,7)"`
	PlaceID              string    `json:"place_id,omitempty" gorm:"column:place_id;type:varchar(255)"`
	MapProvider          string    `json:"map_provider,omitempty" gorm:"column:map_provider;type:varchar(50)"`
	LocationSource       string    `json:"location_source,omitempty" gorm:"column:location_source;type:varchar(50)"`
	DestinationAreaID    string    `json:"destination_area_id,omitempty" gorm:"column:destination_area_id;type:varchar(64);index"`
	DestinationAreaLabel string    `json:"destination_area_label,omitempty" gorm:"column:destination_area_label;type:varchar(255)"`
	IsPrimary            bool      `json:"is_primary" gorm:"column:is_primary;not null;default:false"`
	CreatedAt            time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt            time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (CustomerAddress) TableName() string {
	return "customer_addresses"
}
