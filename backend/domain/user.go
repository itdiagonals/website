package domain

import (
	"time"

	"github.com/google/uuid"
)

type User struct {
	ID         string    `json:"id" gorm:"column:id;primaryKey;type:uuid;default:gen_random_uuid()"`
	Email      string    `json:"email" gorm:"column:email;uniqueIndex;not null"`
	Password   string    `json:"-" gorm:"column:password"`
	Name       string    `json:"name" gorm:"column:name"`
	Role       string    `json:"role" gorm:"column:role;default:customer;index"`
	Phone      string    `json:"phone" gorm:"column:phone"`
	Address    string    `json:"address" gorm:"column:address"`
	IsVerified bool      `json:"is_verified" gorm:"column:is_verified;default:false"`
	OTPCode    string    `json:"-" gorm:"column:otp_code"`
	CreatedAt  time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt  time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (User) TableName() string {
	return "users"
}

const (
	RoleCustomer = "customer"
	RoleAdmin    = "admin"
)

// AllowedRoles enumerates the role values accepted by the user system.
// Anything outside this set is rejected and mapped to RoleCustomer.
var AllowedRoles = map[string]struct{}{
	RoleCustomer: {},
	RoleAdmin:    {},
}

// NormalizeRole returns the input role if it is in AllowedRoles, otherwise
// it returns RoleCustomer. Empty input is also mapped to RoleCustomer so
// no code path accidentally mints an admin via a missing field.
func NormalizeRole(role string) string {
	if _, ok := AllowedRoles[role]; ok {
		return role
	}
	return RoleCustomer
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

// ToUser omits Password by design: the raw password must be hashed in the
// service layer before persistence (see UserService.CreateUser).
func (r CreateUserRequest) ToUser() User {
	return User{
		ID:      uuid.New().String(),
		Email:   r.Email,
		Name:    r.Name,
		Role:    NormalizeRole(r.Role),
		Phone:   r.Phone,
		Address: r.Address,
	}
}

// UpdateUserRequest is the request body for PUT /api/v1/users/:id.
//
// Role is intentionally excluded: role changes go through the audited
// invite/promote flow rather than generic user updates.
type UpdateUserRequest struct {
	Email   string `json:"email" binding:"required"`
	Name    string `json:"name"`
	Phone   string `json:"phone"`
	Address string `json:"address"`
}

func (r UpdateUserRequest) ToUser(id string, currentRole string) User {
	return User{
		ID:      id,
		Email:   r.Email,
		Name:    r.Name,
		Role:    NormalizeRole(currentRole),
		Phone:   r.Phone,
		Address: r.Address,
	}
}
