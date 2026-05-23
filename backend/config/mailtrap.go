package config

import (
	"os"
)

// MailtrapConfig holds Mailtrap email provider configuration.
type MailtrapConfig struct {
	APIKey      string
	APIBaseURL  string
	FromEmail   string
	FromName    string
}

// LoadMailtrapConfig loads Mailtrap configuration from environment variables.
func LoadMailtrapConfig() MailtrapConfig {
	return MailtrapConfig{
		APIKey:     getEnvOrDefault("MAILTRAP_API_KEY", ""),
		APIBaseURL: getEnvOrDefault("MAILTRAP_API_BASE_URL", "https://send.api.mailtrap.io"),
		FromEmail:  getEnvOrDefault("MAILTRAP_FROM_EMAIL", "hello@demomailtrap.co"),
		FromName:   getEnvOrDefault("MAILTRAP_FROM_NAME", "Diagonals"),
	}
}

func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
