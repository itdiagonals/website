package domain

import "time"

type AuthSession struct {
	ID               string     `json:"id" gorm:"column:id;primaryKey;type:varchar(64)"`
	CustomerID       uint       `json:"customer_id" gorm:"column:customer_id;not null;index"`
	RefreshTokenHash string     `json:"-" gorm:"column:refresh_token_hash;type:text;not null"`
	UserAgent        string     `json:"user_agent" gorm:"column:user_agent;type:text"`
	IPAddress        string     `json:"ip_address" gorm:"column:ip_address;type:varchar(255)"`
	DeviceName       string     `json:"device_name" gorm:"column:device_name;type:varchar(255)"`
	LastSeenAt       time.Time  `json:"last_seen_at" gorm:"column:last_seen_at;not null"`
	ExpiresAt        time.Time  `json:"expires_at" gorm:"column:expires_at;not null;index"`
	RevokedAt        *time.Time `json:"revoked_at,omitempty" gorm:"column:revoked_at"`
	CreatedAt        time.Time  `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt        time.Time  `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (AuthSession) TableName() string {
	return "auth_sessions"
}

type AuthSessionSummary struct {
	ID         string    `json:"id"`
	DeviceName string    `json:"device_name,omitempty"`
	UserAgent  string    `json:"user_agent,omitempty"`
	IPAddress  string    `json:"ip_address,omitempty"`
	LastSeenAt time.Time `json:"last_seen_at"`
	ExpiresAt  time.Time `json:"expires_at"`
	CreatedAt  time.Time `json:"created_at"`
	Current    bool      `json:"current"`
}
