package main

import (
	"fmt"
	"log"
	"os"

	"desis-keep/apps/api/internal/config"
	"desis-keep/apps/api/internal/database"
	"desis-keep/apps/api/internal/models"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	db, err := database.Connect(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Ensure tables exist before seeding
	fmt.Println("Running migrations...")
	if err := models.Migrate(db); err != nil {
		log.Fatalf("Migration failed: %v", err)
	}

	fmt.Println("Seeding database...")
	if err := database.Seed(db); err != nil {
		log.Fatalf("Seeding failed: %v", err)
	}

	fmt.Println("Database seeded successfully.")
	os.Exit(0)
}
