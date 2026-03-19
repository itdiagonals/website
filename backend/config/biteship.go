package config

import (
	"os"
	"strings"
)

type BiteshipConfig struct {
	BaseURL      string
	APIKey       string
	OriginAreaID string
}

func GetBiteshipConfig() BiteshipConfig {
	LoadEnv()

	baseURL := strings.TrimSpace(os.Getenv("BITESHIP_BASE_URL"))
	if baseURL == "" {
		baseURL = "https://api.biteship.com"
	}

	return BiteshipConfig{
		BaseURL:      strings.TrimRight(baseURL, "/"),
		APIKey:       strings.TrimSpace(os.Getenv("BITESHIP_API_KEY")),
		OriginAreaID: strings.TrimSpace(os.Getenv("BITESHIP_ORIGIN_AREA_ID")),
	}
}
