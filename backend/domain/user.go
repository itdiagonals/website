package domain

import "time"

type User struct {
	ID        uint      `json:"id" gorm:"column:id;primaryKey"`
	Email     string    `json:"email" gorm:"column:email;uniqueIndex;not null"`
	Password  string    `json:"-" gorm:"column:password"`
	Name      string    `json:"name" gorm:"column:name"`
	Role      string    `json:"role" gorm:"column:role;default:admin"`
	Phone     string    `json:"phone" gorm:"column:phone"`
	Address   string    `json:"address" gorm:"column:address"`
	CreatedAt time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (User) TableName() string {
	return "users"
}

// CreateUserRequest is the request body for POST /api/v1/users.
type CreateUserRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
	Name     string `json:"name"`
	Role     string `json:"role"`
	Phone    string `json:"phone"`
	Address  string `json:"address"`
}

func (r CreateUserRequest) ToUser() User {
	role := r.Role
	if role == "" {
		role = "admin"
	}
	return User{
		Email:    r.Email,
		Password: r.Password,
		Name:     r.Name,
		Role:     role,
		Phone:    r.Phone,
		Address:  r.Address,
	}
}

// UpdateUserRequest is the request body for PUT /api/v1/users/:id.
type UpdateUserRequest struct {
	Email   string `json:"email" binding:"required"`
	Name    string `json:"name"`
	Role    string `json:"role"`
	Phone   string `json:"phone"`
	Address string `json:"address"`
}

func (r UpdateUserRequest) ToUser(id uint) User {
	role := r.Role
	if role == "" {
		role = "admin"
	}
	return User{
		ID:      id,
		Email:   r.Email,
		Name:    r.Name,
		Role:    role,
		Phone:   r.Phone,
		Address: r.Address,
	}
}
