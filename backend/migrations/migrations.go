package migrations

import (
	"fmt"
	"time"

	"gorm.io/gorm"
)

const migrationsTableName = "go_schema_migrations"

type schemaMigration struct {
	Version     string    `gorm:"column:version;primaryKey;type:varchar(50)"`
	Description string    `gorm:"column:description;type:text;not null"`
	AppliedAt   time.Time `gorm:"column:applied_at;autoCreateTime"`
}

func (schemaMigration) TableName() string {
	return migrationsTableName
}

type Migration struct {
	Version     string
	Description string
	Up          func(tx *gorm.DB) error
}

var allMigrations = []Migration{
	migration0001InitGoTables,
	migration0002InitCartTables,
	migration0003InitAuthSessionsTable,
	migration0004InitCustomerAddressesTable,
	migration0005InitWilayahTable,
	migration0006AlterTransactionsForLogisticsAndPayment,
	migration0007AlterCustomerAddressesForGeolocation,
	migration0008InitStockReservationsTable,
	migration0009AlterItemsAndReservationsForVariants,
	migration0010AlterTransactionsForBiteshipOrderFields,
	migration0011InitBiteshipWebhookEventsTable,
	migration0012InitShippingJobsTable,
}

func Apply(db *gorm.DB) error {
	if err := db.AutoMigrate(&schemaMigration{}); err != nil {
		return fmt.Errorf("ensure migrations table: %w", err)
	}

	for _, migration := range allMigrations {
		applied, err := isApplied(db, migration.Version)
		if err != nil {
			return err
		}

		if applied {
			continue
		}

		if err := db.Transaction(func(tx *gorm.DB) error {
			if err := migration.Up(tx); err != nil {
				return err
			}

			return tx.Create(&schemaMigration{
				Version:     migration.Version,
				Description: migration.Description,
			}).Error
		}); err != nil {
			return fmt.Errorf("apply migration %s: %w", migration.Version, err)
		}
	}

	return nil
}

func isApplied(db *gorm.DB, version string) (bool, error) {
	var count int64
	if err := db.Model(&schemaMigration{}).Where("version = ?", version).Count(&count).Error; err != nil {
		return false, fmt.Errorf("check migration %s: %w", version, err)
	}

	return count > 0, nil
}
