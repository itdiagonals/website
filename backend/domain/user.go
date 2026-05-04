package domain

import "time"

type User struct {
	ID        int       `json:"id" gorm:"column:id;primaryKey"`
	Email     string    `json:"email" gorm:"column:email;uniqueIndex;not null"`
	Password  string    `json:"-" gorm:"column:password"`
	Name      string    `json:"name" gorm:"column:name"`
	Role      string    `json:"role" gorm:"column:role;default:admin"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at"`
}

func (User) TableName() string {
	return "users"
}
