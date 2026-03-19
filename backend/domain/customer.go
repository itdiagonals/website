package domain

import "time"

type Customer struct {
	ID           uint      `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	Name         string    `json:"name" gorm:"column:name;type:varchar(255);not null"`
	Email        string    `json:"email" gorm:"column:email;type:varchar(255);uniqueIndex;not null"`
	PasswordHash string    `json:"-" gorm:"column:password_hash;type:text;not null"`
	Phone        string    `json:"phone" gorm:"column:phone;type:varchar(50)"`
	Address      string    `json:"address" gorm:"column:address;type:text"`
	CreatedAt    time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (Customer) TableName() string {
	return "customers"
}
