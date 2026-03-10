package config

import (
	"sync"

	"github.com/joho/godotenv"
)

var envLoadOnce sync.Once

func LoadEnv() {
	envLoadOnce.Do(func() {
		_ = godotenv.Load(".env", "../.env")
	})
}
