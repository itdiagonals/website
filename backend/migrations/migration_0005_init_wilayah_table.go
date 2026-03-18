package migrations

import (
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

var migration0005InitWilayahTable = Migration{
	Version:     "0005_init_wilayah_table",
	Description: "Create wilayah table and import master wilayah data",
	Up: func(tx *gorm.DB) error {
		statements := []string{
			`CREATE TABLE IF NOT EXISTS wilayah (
				kode VARCHAR(13) PRIMARY KEY,
				nama VARCHAR(255) NOT NULL,
				level VARCHAR(20) NOT NULL,
				parent_code VARCHAR(13)
			)`,
			`CREATE INDEX IF NOT EXISTS idx_wilayah_name ON wilayah(nama)`,
			`CREATE INDEX IF NOT EXISTS idx_wilayah_level ON wilayah(level)`,
			`CREATE INDEX IF NOT EXISTS idx_wilayah_parent_code ON wilayah(parent_code)`,
		}

		for _, statement := range statements {
			if err := tx.Exec(statement).Error; err != nil {
				return err
			}
		}

		var count int64
		if err := tx.Model(&domain.Wilayah{}).Count(&count).Error; err != nil {
			return err
		}

		if count > 0 {
			return nil
		}

		records, err := loadWilayahRecords()
		if err != nil {
			return err
		}

		for start := 0; start < len(records); start += 1000 {
			end := start + 1000
			if end > len(records) {
				end = len(records)
			}

			if err := tx.CreateInBatches(records[start:end], 1000).Error; err != nil {
				return err
			}
		}

		return nil
	},
}

func loadWilayahRecords() ([]domain.Wilayah, error) {
	seedPath := filepath.Join("utils", "wilayah", "wilayah.sql")
	content, err := os.ReadFile(seedPath)
	if err != nil {
		return nil, fmt.Errorf("read wilayah seed file: %w", err)
	}

	tuplePattern := regexp.MustCompile(`\('((?:[^']|'')*)','((?:[^']|'')*)'\)`)
	matches := tuplePattern.FindAllStringSubmatch(string(content), -1)
	if len(matches) == 0 {
		return nil, fmt.Errorf("no wilayah records found in seed file")
	}

	records := make([]domain.Wilayah, 0, len(matches))
	for _, match := range matches {
		code := normalizeWilayahValue(match[1])
		name := normalizeWilayahValue(match[2])
		level, parentCode := deriveWilayahHierarchy(code)

		records = append(records, domain.Wilayah{
			Code:       code,
			Name:       name,
			Level:      level,
			ParentCode: parentCode,
		})
	}

	return records, nil
}

func normalizeWilayahValue(value string) string {
	return strings.TrimSpace(strings.ReplaceAll(value, "''", "'"))
}

func deriveWilayahHierarchy(code string) (string, *string) {
	parts := strings.Split(code, ".")
	if len(parts) == 0 {
		return "", nil
	}

	switch len(parts) {
	case 1:
		return "province", nil
	case 2:
		parent := parts[0]
		return "city", &parent
	case 3:
		parent := strings.Join(parts[:2], ".")
		return "district", &parent
	default:
		parent := strings.Join(parts[:3], ".")
		return "village", &parent
	}
}
