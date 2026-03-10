package main

import (
	"log"

	"github.com/itdiagonals/website/backend/config"
	"github.com/itdiagonals/website/backend/migrations"
)

func main() {
	log.Println("starting database migration")

	db, err := config.ConnectDatabase()
	if err != nil {
		log.Printf("failed to connect database: %v", err)
		return
	}

	if err := migrations.Apply(db); err != nil {
		log.Printf("migration failed: %v", err)
		return
	}

	log.Println("database migration completed successfully")
}
