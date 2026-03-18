package config

import (
	"log"

	"os"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DBBackend *gorm.DB
var DBPayload *gorm.DB

func ConnectDB() {
	LoadEnv()

	backendDSN := strings.TrimSpace(os.Getenv("BACKEND_DATABASE_URL"))
	payloadDSN := strings.TrimSpace(os.Getenv("PAYLOAD_DATABASE_URL"))

	if backendDSN == "" {
		log.Fatal("BACKEND_DATABASE_URL is not set")
	}
	if payloadDSN == "" {
		log.Fatal("PAYLOAD_DATABASE_URL is not set")
	}

	var err error

	DBBackend, err = gorm.Open(postgres.Open(backendDSN), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect DBBackend: ", err)
	}

	DBPayload, err = gorm.Open(postgres.Open(payloadDSN), &gorm.Config{})
	if err != nil {
		log.Fatal("failed to connect DBPayload: ", err)
	}
}
