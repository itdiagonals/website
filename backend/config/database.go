package config

import (
	"log"

	"os"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	LoadEnv()

	dsn := strings.TrimSpace(os.Getenv("BACKEND_DATABASE_URL"))
	if dsn == "" {
		log.Fatal("BACKEND_DATABASE_URL is not set")
	}

	var err error

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect database: ", err)
	}
}
