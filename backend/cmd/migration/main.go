package main

import (
	"log"

	"github.com/itdiagonals/website/backend/config"
	"github.com/itdiagonals/website/backend/migrations"
)

func main() {
	log.Println("starting database migration")

	config.ConnectDB()

	if err := migrations.Apply(config.DBBackend); err != nil {
		log.Printf("migration failed: %v", err)
		return
	}

	log.Println("database migration completed successfully")
}
