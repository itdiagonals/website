package domain

import "time"

type CustomerAddress struct {
	ID            uint      `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	CustomerID    uint      `json:"customer_id" gorm:"column:customer_id;not null;index"`
	Title         string    `json:"title" gorm:"column:title;type:varchar(100);not null"`
	RecipientName string    `json:"recipient_name" gorm:"column:recipient_name;type:varchar(255);not null"`
	PhoneNumber   string    `json:"phone_number" gorm:"column:phone_number;type:varchar(50);not null"`
	Province      string    `json:"province" gorm:"column:province;type:varchar(255);not null"`
	City          string    `json:"city" gorm:"column:city;type:varchar(255);not null"`
	District      string    `json:"district" gorm:"column:district;type:varchar(255);not null"`
	Village       string    `json:"village" gorm:"column:village;type:varchar(255);not null"`
	PostalCode    string    `json:"postal_code" gorm:"column:postal_code;type:varchar(20);not null"`
	FullAddress   string    `json:"full_address" gorm:"column:full_address;type:text;not null"`
	IsPrimary     bool      `json:"is_primary" gorm:"column:is_primary;not null;default:false"`
	CreatedAt     time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt     time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (CustomerAddress) TableName() string {
	return "customer_addresses"
}
