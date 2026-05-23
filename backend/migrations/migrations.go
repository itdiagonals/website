package migrations

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
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

func loadMigrations() []Migration {
	goMigrations := []Migration{
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
		migration0013InitPayloadTables,
		migration0014UnifyUsersCustomers,
		migration0015DropAuthSessionsTable,
		migration0016UserIDToUUID,
		migration0017AddPerformanceIndexes,
	}

	sqlMigrations, err := loadSQLMigrations()
	if err != nil {
		panic(fmt.Sprintf("load sql migrations: %v", err))
	}

	all := append(goMigrations, sqlMigrations...)
	sort.SliceStable(all, func(i, j int) bool {
		return all[i].Version < all[j].Version
	})

	return all
}

var allMigrations = loadMigrations()

var sqlMigrationPattern = regexp.MustCompile(`(?i)^--\s*migration:\s*(\S+)`)

func loadSQLMigrations() ([]Migration, error) {
	sqlFiles, err := filepath.Glob(filepath.Join("migrations", "*.sql"))
	if err != nil {
		return nil, fmt.Errorf("glob sql migrations: %w", err)
	}

	var migrations []Migration
	for _, path := range sqlFiles {
		content, err := os.ReadFile(path)
		if err != nil {
			return nil, fmt.Errorf("read sql migration %s: %w", path, err)
		}

		version, description, upSQL, err := parseSQLMigration(string(content))
		if err != nil {
			return nil, fmt.Errorf("parse sql migration %s: %w", path, err)
		}

		if version == "" {
			base := filepath.Base(path)
			version = strings.TrimSuffix(base, filepath.Ext(base))
		}

		sql := upSQL
		migrations = append(migrations, Migration{
			Version:     version,
			Description: description,
			Up: func(tx *gorm.DB) error {
				return tx.Exec(sql).Error
			},
		})
	}

	return migrations, nil
}

func parseSQLMigration(content string) (version, description, upSQL string, err error) {
	lines := strings.Split(content, "\n")
	var inUp bool
	var upLines []string

	for _, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}

		if strings.HasPrefix(trimmed, "--") {
			lower := strings.ToLower(trimmed)
			if match := sqlMigrationPattern.FindStringSubmatch(trimmed); match != nil {
				version = match[1]
				continue
			}
			if strings.HasPrefix(lower, "-- description:") {
				description = strings.TrimSpace(strings.TrimPrefix(trimmed, "-- description:"))
				continue
			}
			if lower == "-- up" {
				inUp = true
				continue
			}
			if lower == "-- down" {
				inUp = false
				continue
			}
			continue
		}

		if inUp {
			upLines = append(upLines, line)
		}
	}

	if len(upLines) == 0 {
		return "", "", "", fmt.Errorf("no -- up section found")
	}

	upSQL = strings.Join(upLines, "\n")
	return version, description, upSQL, nil
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
