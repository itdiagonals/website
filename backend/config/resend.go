package config

// ResendConfig holds Resend email provider configuration.
// Resend is used as a fallback gateway when the primary provider (Mailtrap)
// hits a rate limit, quota error, or transient failure.
type ResendConfig struct {
	APIKey    string
	APIBaseURL string
	FromEmail string
	FromName  string
}

// LoadResendConfig loads Resend configuration from environment variables.
func LoadResendConfig() ResendConfig {
	return ResendConfig{
		APIKey:     getEnvOrDefault("RESEND_API_KEY", ""),
		APIBaseURL: getEnvOrDefault("RESEND_API_BASE_URL", "https://api.resend.com"),
		FromEmail:  getEnvOrDefault("RESEND_FROM_EMAIL", "onboarding@resend.dev"),
		FromName:   getEnvOrDefault("RESEND_FROM_NAME", "Diagonals"),
	}
}
