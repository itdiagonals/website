package config

import (
	"os"
	"strings"
)

type BiteshipConfig struct {
	BaseURL          string
	APIKey           string
	OriginAreaID     string
	OriginName       string
	OriginPhone      string
	OriginEmail      string
	OriginAddress    string
	OriginPostalCode string
	WebhookSecret    string
	WebhookToken     string
}

func GetBiteshipConfig() BiteshipConfig {
	LoadEnv()

	baseURL := strings.TrimSpace(os.Getenv("BITESHIP_BASE_URL"))
	if baseURL == "" {
		baseURL = "https://api.biteship.com"
	}

	return BiteshipConfig{
		BaseURL:          strings.TrimRight(baseURL, "/"),
		APIKey:           strings.TrimSpace(os.Getenv("BITESHIP_API_KEY")),
		OriginAreaID:     strings.TrimSpace(os.Getenv("BITESHIP_ORIGIN_AREA_ID")),
		OriginName:       strings.TrimSpace(os.Getenv("BITESHIP_ORIGIN_CONTACT_NAME")),
		OriginPhone:      strings.TrimSpace(os.Getenv("BITESHIP_ORIGIN_CONTACT_PHONE")),
		OriginEmail:      strings.TrimSpace(os.Getenv("BITESHIP_ORIGIN_CONTACT_EMAIL")),
		OriginAddress:    strings.TrimSpace(os.Getenv("BITESHIP_ORIGIN_ADDRESS")),
		OriginPostalCode: strings.TrimSpace(os.Getenv("BITESHIP_ORIGIN_POSTAL_CODE")),
		WebhookSecret:    strings.TrimSpace(os.Getenv("BITESHIP_WEBHOOK_SECRET")),
		WebhookToken:     strings.TrimSpace(os.Getenv("BITESHIP_WEBHOOK_TOKEN")),
	}
}
