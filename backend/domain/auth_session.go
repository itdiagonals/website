package domain

import "time"

type AuthSession struct {
	ID               string     `json:"id"`
	UserID           uint       `json:"user_id"`
	RefreshTokenHash string     `json:"refresh_token_hash"`
	UserAgent        string     `json:"user_agent"`
	IPAddress        string     `json:"ip_address"`
	DeviceName       string     `json:"device_name"`
	LastSeenAt       time.Time  `json:"last_seen_at"`
	ExpiresAt        time.Time  `json:"expires_at"`
	RevokedAt        *time.Time `json:"revoked_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
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
