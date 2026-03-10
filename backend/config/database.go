package config

import (
	"errors"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func ConnectDatabase() (*gorm.DB, error) {
	LoadEnv()

	databaseURL := os.Getenv("BACKEND_DATABASE_URL")
	if databaseURL == "" {
		return nil, errors.New("BACKEND_DATABASE_URL is not set")
	}

	db, err := gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	return db, nil
}
