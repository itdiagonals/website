package config

import "os"

type RajaOngkirConfig struct {
	BaseURL  string
	APIKey   string
	OriginID string
}

func GetRajaOngkirConfig() RajaOngkirConfig {
	LoadEnv()

	return RajaOngkirConfig{
		BaseURL:  "https://rajaongkir.komerce.id/api/v1",
		APIKey:   os.Getenv("RAJAONGKIR_API_KEY"),
		OriginID: os.Getenv("RAJAONGKIR_ORIGIN_ID"),
	}
}