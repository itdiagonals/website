package domain

import (
	"time"
)

// EmailMessage represents an email to be sent.
type EmailMessage struct {
	From     EmailAddress   `json:"from"`
	To       []EmailAddress `json:"to"`
	Subject  string         `json:"subject"`
	Text     string         `json:"text,omitempty"`
	HTML     string         `json:"html,omitempty"`
	Category string         `json:"category,omitempty"`
}

// EmailAddress represents a sender or recipient email address.
type EmailAddress struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

// OTPData represents OTP information stored in Redis.
type OTPData struct {
	Code      string    `json:"code"`
	Purpose   string    `json:"purpose"`
	ExpiresAt time.Time `json:"expires_at"`
}

// OTPPurpose represents the purpose of an OTP.
type OTPPurpose string

const (
	OTPPurposeAccountVerification OTPPurpose = "account_verification"
	OTPPurposePasswordReset       OTPPurpose = "password_reset"
)

// OTPRequestInput represents a request to send OTP.
type OTPRequestInput struct {
	Email   string     `json:"email" binding:"required,email"`
	Purpose OTPPurpose `json:"purpose" binding:"required"`
}

// OTPVerifyInput represents a request to verify OTP.
type OTPVerifyInput struct {
	Email   string     `json:"email" binding:"required,email"`
	Code    string     `json:"code" binding:"required,len=6"`
	Purpose OTPPurpose `json:"purpose" binding:"required"`
}

// EmailTemplate represents a template-based email.
type EmailTemplate struct {
	From              EmailAddress      `json:"from"`
	To                []EmailAddress    `json:"to"`
	TemplateUUID      string            `json:"template_uuid"`
	TemplateVariables map[string]string `json:"template_variables"`
}
