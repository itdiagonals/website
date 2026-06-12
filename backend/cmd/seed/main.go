package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/itdiagonals/website/backend/config"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/storage"
	"gorm.io/gorm"
)

func main() {
	if len(os.Args) > 1 && (os.Args[1] == "-h" || os.Args[1] == "--help") {
		fmt.Println("Usage: go run ./cmd/seed [images-dir]")
		fmt.Println("")
		fmt.Println("Seeds catalog data (categories, seasons, care guides, media, products)")
		fmt.Println("into the backend database and uploads images to MinIO.")
		fmt.Println("")
		fmt.Println("Arguments:")
		fmt.Println("  images-dir   Path to directory containing product images.")
		fmt.Println("               Defaults to '../public/products' relative to backend/")
		os.Exit(0)
	}

	imagesDir := "../public/products"
	if len(os.Args) > 1 {
		imagesDir = os.Args[1]
	}

	config.LoadEnv()
	config.ConnectDB()

	store, err := storage.NewMinioStorage()
	if err != nil {
		log.Fatalf("failed to connect to MinIO: %v", err)
	}

	db := config.DB
	ctx := context.Background()

	log.Println("Starting catalog seed...")

	seedCareGuides(db)
	seedCategories(db, store, ctx, imagesDir)
	seasons := seedSeasons(db, store, ctx, imagesDir)
	seedProducts(db, store, ctx, imagesDir, seasons)

	log.Println("Catalog seed completed successfully.")
}

func seedCareGuides(db *gorm.DB) {
	guides := []domain.CareGuide{
		{
			Title: "Jersey Care Instructions",
			Instructions: map[string]any{
				"wash": "30°C inside out",
				"dry":  "Do not tumble dry",
				"iron": "Do not iron printed areas",
			},
		},
		{
			Title: "General Fabric Care",
			Instructions: map[string]any{
				"wash":      "Check label",
				"detergent": "Mild detergent",
				"bleach":    "Avoid bleach",
			},
		},
	}

	for _, g := range guides {
		if err := db.FirstOrCreate(&g, domain.CareGuide{Title: g.Title}).Error; err != nil {
			log.Fatalf("failed to seed care guide %q: %v", g.Title, err)
		}
		log.Printf("Seeded care guide: %s (id=%d)", g.Title, g.ID)
	}
}

func seedCategories(db *gorm.DB, store *storage.MinioStorage, ctx context.Context, imagesDir string) {
	items := []struct {
		Name string
		Slug string
		File string
	}{
		{"Jerseys", "jerseys", "products-1.webp"},
		{"Shorts", "shorts", "products-2.webp"},
		{"Accessories", "accessories", "products-3.webp"},
		{"Training", "training", ""},
	}

	for _, item := range items {
		var existing domain.Category
		if err := db.Where("slug = ?", item.Slug).First(&existing).Error; err == nil {
			log.Printf("Category %q already exists (id=%d), skipping.", item.Name, existing.ID)
			continue
		} else if err != gorm.ErrRecordNotFound {
			log.Fatalf("failed to check category %q: %v", item.Name, err)
		}

		cat := domain.Category{Name: item.Name, Slug: item.Slug}
		if item.File != "" {
			media := uploadImage(db, store, ctx, imagesDir, item.File, fmt.Sprintf("%s cover", item.Name))
			cat.CoverImageID = media.ID
			if err := db.Create(&cat).Error; err != nil {
				log.Fatalf("failed to seed category %q: %v", item.Name, err)
			}
		} else {
			if err := db.Omit("cover_image_id").Create(&cat).Error; err != nil {
				log.Fatalf("failed to seed category %q: %v", item.Name, err)
			}
		}
		log.Printf("Seeded category: %s (id=%d)", cat.Name, cat.ID)
	}
}

func seedSeasons(db *gorm.DB, store *storage.MinioStorage, ctx context.Context, imagesDir string) []domain.Season {
	items := []struct {
		Name          string
		Slug          string
		Subtitle      string
		Description   string
		Active        bool
		CoverFile     string
		LookbookFiles []string
	}{
		{
			Name:          "El Ligue Premiere",
			Slug:          "el-ligue-premiere",
			Subtitle:      "Navy & Gold",
			Description:   "Our flagship collection inspired by classic football aesthetics. Bold colors and premium materials for the ultimate fan experience.",
			Active:        true,
			CoverFile:     "season-1.webp",
			LookbookFiles: []string{"season-1.webp", "season-3.webp"},
		},
		{
			Name:          "Summer Drop",
			Slug:          "summer-drop",
			Subtitle:      "Pastel & White",
			Description:   "Lightweight summer essentials for on and off the pitch.",
			Active:        false,
			CoverFile:     "season-3.webp",
			LookbookFiles: []string{"season-3.webp"},
		},
	}

	var seeded []domain.Season
	for _, item := range items {
		var existing domain.Season
		if err := db.Where("slug = ?", item.Slug).First(&existing).Error; err == nil {
			log.Printf("Season %q already exists (id=%d), skipping.", item.Name, existing.ID)
			seeded = append(seeded, existing)
			continue
		} else if err != gorm.ErrRecordNotFound {
			log.Fatalf("failed to check season %q: %v", item.Name, err)
		}

		season := domain.Season{
			Name:        item.Name,
			Slug:        item.Slug,
			Subtitle:    item.Subtitle,
			Description: item.Description,
			IsActive:    item.Active,
		}

		if item.CoverFile != "" {
			media := uploadImage(db, store, ctx, imagesDir, item.CoverFile, fmt.Sprintf("%s cover", item.Name))
			season.CoverImageID = media.ID
			if err := db.Create(&season).Error; err != nil {
				log.Fatalf("failed to seed season %q: %v", item.Name, err)
			}
		} else {
			if err := db.Omit("cover_image_id").Create(&season).Error; err != nil {
				log.Fatalf("failed to seed season %q: %v", item.Name, err)
			}
		}

		if len(item.LookbookFiles) > 0 {
			for _, file := range item.LookbookFiles {
				media := uploadImage(db, store, ctx, imagesDir, file, fmt.Sprintf("%s lookbook", item.Name))
				if err := db.Exec(
					"INSERT INTO season_lookbook_images (season_id, media_id) VALUES (?, ?) ON CONFLICT DO NOTHING",
					season.ID, media.ID,
				).Error; err != nil {
					log.Fatalf("failed to link lookbook image: %v", err)
				}
			}
		}

		log.Printf("Seeded season: %s (id=%d)", season.Name, season.ID)
		seeded = append(seeded, season)
	}

	return seeded
}

func seedProducts(db *gorm.DB, store *storage.MinioStorage, ctx context.Context, imagesDir string, seasons []domain.Season) {
	var jerseysCat domain.Category
	if err := db.Where("slug = ?", "jerseys").First(&jerseysCat).Error; err != nil {
		log.Fatalf("jerseys category not found: %v", err)
	}

	var shortsCat domain.Category
	if err := db.Where("slug = ?", "shorts").First(&shortsCat).Error; err != nil {
		log.Fatalf("shorts category not found: %v", err)
	}

	var jerseyCare domain.CareGuide
	if err := db.Where("title = ?", "Jersey Care Instructions").First(&jerseyCare).Error; err != nil {
		log.Fatalf("care guide not found: %v", err)
	}

	var generalCare domain.CareGuide
	if err := db.Where("title = ?", "General Fabric Care").First(&generalCare).Error; err != nil {
		log.Fatalf("care guide not found: %v", err)
	}

	var activeSeason domain.Season
	if err := db.Where("is_active = ?", true).First(&activeSeason).Error; err != nil {
		log.Fatalf("active season not found: %v", err)
	}

	products := []struct {
		Name         string
		Slug         string
		SeasonID     int
		CategoryID   int
		Gender       string
		BasePrice    float64
		Weight       int
		Length       int
		Width        int
		Height       int
		Stock        int
		Description  string
		CoverFile    string
		CareGuideID  int
		DetailInfo   map[string]any
		Colors       []domain.ProductColor
		Sizes        []domain.ProductSize
		GalleryFiles []string
		Variants     []domain.ProductVariant
	}{
		{
			Name:        "El Ligue Home Jersey",
			Slug:        "el-ligue-home-jersey",
			SeasonID:    activeSeason.ID,
			CategoryID:  jerseysCat.ID,
			Gender:      "Men",
			BasePrice:   899000,
			Weight:      250,
			Length:      70,
			Width:       50,
			Height:      2,
			Stock:       45,
			Description: "Official home jersey from the El Ligue Premiere collection. Premium breathable fabric with moisture-wicking technology.",
			CoverFile:   "products-1.webp",
			CareGuideID: jerseyCare.ID,
			DetailInfo: map[string]any{
				"material":   "100% Polyester",
				"fit":        "Regular",
				"technology": "Dri-FIT",
			},
			Colors: []domain.ProductColor{
				{Order: 0, ColorName: "Navy", HexCode: "#1a237e"},
				{Order: 1, ColorName: "Black", HexCode: "#000000"},
			},
			Sizes: []domain.ProductSize{
				{Order: 0, Size: "S"},
				{Order: 1, Size: "M"},
				{Order: 2, Size: "L"},
				{Order: 3, Size: "XL"},
			},
			GalleryFiles: []string{"jersey-main.webp", "jersey-thumb-1.webp", "jersey-thumb-2.webp", "jersey-thumb-3.webp"},
			Variants: []domain.ProductVariant{
				{Order: 0, ColorName: "Navy", Size: "M", Stock: 12},
				{Order: 1, ColorName: "Navy", Size: "L", Stock: 8},
				{Order: 2, ColorName: "Black", Size: "M", Stock: 10},
				{Order: 3, ColorName: "Black", Size: "XL", Stock: 15},
			},
		},
		{
			Name:        "Summer Training Shorts",
			Slug:        "summer-training-shorts",
			SeasonID:    activeSeason.ID,
			CategoryID:  shortsCat.ID,
			Gender:      "Unisex",
			BasePrice:   459000,
			Weight:      180,
			Length:      45,
			Width:       35,
			Height:      3,
			Stock:       60,
			Description: "Breathable training shorts with elastic waistband and side pockets.",
			CoverFile:   "products-2.webp",
			CareGuideID: generalCare.ID,
			DetailInfo: map[string]any{
				"material": "88% Polyester, 12% Elastane",
				"inseam":   "7 inch",
			},
			Colors: []domain.ProductColor{
				{Order: 0, ColorName: "White", HexCode: "#ffffff"},
				{Order: 1, ColorName: "Black", HexCode: "#000000"},
				{Order: 2, ColorName: "Green", HexCode: "#388e3c"},
			},
			Sizes: []domain.ProductSize{
				{Order: 0, Size: "S"},
				{Order: 1, Size: "M"},
				{Order: 2, Size: "L"},
				{Order: 3, Size: "XL"},
			},
			GalleryFiles: []string{"products-2.webp"},
			Variants: []domain.ProductVariant{
				{Order: 0, ColorName: "White", Size: "M", Stock: 20},
				{Order: 1, ColorName: "Black", Size: "L", Stock: 18},
				{Order: 2, ColorName: "Green", Size: "XL", Stock: 22},
			},
		},
	}

	for _, p := range products {
		product := domain.Product{
			Name:        p.Name,
			Slug:        p.Slug,
			SeasonID:    p.SeasonID,
			CategoryID:  p.CategoryID,
			Gender:      p.Gender,
			BasePrice:   p.BasePrice,
			Weight:      p.Weight,
			Length:      p.Length,
			Width:       p.Width,
			Height:      p.Height,
			Stock:       p.Stock,
			Description: p.Description,
			CareGuideID: p.CareGuideID,
		}

		existing := domain.Product{}
		if err := db.Where("slug = ?", p.Slug).First(&existing).Error; err == nil {
			log.Printf("Product %q already exists (id=%d), skipping.", p.Slug, existing.ID)
			continue
		} else if err != gorm.ErrRecordNotFound {
			log.Fatalf("failed to check product %q: %v", p.Slug, err)
		}

		if p.CoverFile != "" {
			media := uploadImage(db, store, ctx, imagesDir, p.CoverFile, fmt.Sprintf("%s cover", p.Name))
			product.CoverImageID = media.ID
			if err := db.Create(&product).Error; err != nil {
				log.Fatalf("failed to create product %q: %v", p.Slug, err)
			}
		} else {
			if err := db.Omit("cover_image_id").Create(&product).Error; err != nil {
				log.Fatalf("failed to create product %q: %v", p.Slug, err)
			}
		}

		for i := range p.Colors {
			p.Colors[i].ParentID = product.ID
			if err := db.Create(&p.Colors[i]).Error; err != nil {
				log.Fatalf("failed to create product color: %v", err)
			}
		}

		for i := range p.Sizes {
			p.Sizes[i].ParentID = product.ID
			if err := db.Create(&p.Sizes[i]).Error; err != nil {
				log.Fatalf("failed to create product size: %v", err)
			}
		}

		for idx, file := range p.GalleryFiles {
			media := uploadImage(db, store, ctx, imagesDir, file, fmt.Sprintf("%s gallery %d", p.Name, idx))
			item := domain.ProductGalleryItem{
				ParentID: product.ID,
				Order:    idx,
				ImageID:  media.ID,
			}
			if err := db.Create(&item).Error; err != nil {
				log.Fatalf("failed to create gallery item: %v", err)
			}
		}

		for i := range p.Variants {
			p.Variants[i].ParentID = product.ID
			if err := db.Create(&p.Variants[i]).Error; err != nil {
				log.Fatalf("failed to create product variant: %v", err)
			}
		}

		log.Printf("Seeded product: %s (id=%d)", product.Name, product.ID)
	}
}

func uploadImage(db *gorm.DB, store *storage.MinioStorage, ctx context.Context, imagesDir, filename, alt string) domain.Media {
	path := filepath.Join(imagesDir, filename)
	data, err := os.ReadFile(path)
	if err != nil {
		log.Fatalf("failed to read image %s: %v", path, err)
	}

	objectKey := buildObjectKey(filename)
	contentType := detectContentType(filename)

	result, err := store.PutBytes(ctx, objectKey, data, contentType)
	if err != nil {
		log.Fatalf("failed to upload %s to MinIO: %v", filename, err)
	}

	media := domain.Media{
		Alt:      alt,
		URL:      result.URL,
		Filename: filename,
		MimeType: contentType,
		Filesize: int64(len(data)),
	}

	if err := db.Create(&media).Error; err != nil {
		log.Fatalf("failed to create media record for %s: %v", filename, err)
	}

	log.Printf("Uploaded image: %s -> %s (id=%d)", filename, result.URL, media.ID)
	return media
}

func buildObjectKey(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	name := strings.TrimSuffix(filename, ext)
	cleaned := strings.ReplaceAll(name, " ", "-")
	cleaned = strings.ReplaceAll(cleaned, "_", "-")
	timestamp := time.Now().UnixNano()
	return fmt.Sprintf("media/%d-%s%s", timestamp, cleaned, ext)
}

func detectContentType(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	switch ext {
	case ".png":
		return "image/png"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".webp":
		return "image/webp"
	case ".svg":
		return "image/svg+xml"
	default:
		return "application/octet-stream"
	}
}
