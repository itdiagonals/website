package config

import (
	"log"
	"os"
	"strings"
	"time"

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

	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatal("failed to get underlying sql.DB: ", err)
	}

	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetConnMaxLifetime(15 * time.Minute)

	log.Println("database connection pool configured: max_open=25, max_idle=10, max_lifetime=15m")
}
