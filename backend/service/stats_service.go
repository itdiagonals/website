package service

import (
	"context"
	"fmt"
	"strconv"
	"time"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

const statsCacheTTL = 30 * time.Second

type DashboardStats struct {
	Products       int64 `json:"products"`
	Seasons        int64 `json:"seasons"`
	ActiveSeasons  int64 `json:"active_seasons"`
	CareGuides     int64 `json:"care_guides"`
	Media          int64 `json:"media"`
	Users          int64 `json:"users"`
	AdminUsers     int64 `json:"admin_users"`
	LowStock       int64 `json:"low_stock"`
	OutOfStock     int64 `json:"out_of_stock"`
	TotalStock     int64 `json:"total_stock"`
	CatalogValue   int64 `json:"catalog_value"`
}

type StatsService struct {
	db    *gorm.DB
	redis *redis.Client
}

func NewStatsService(db *gorm.DB, redisClient *redis.Client) *StatsService {
	return &StatsService{db: db, redis: redisClient}
}

func (s *StatsService) GetDashboardStats(ctx context.Context) (*DashboardStats, error) {
	cached, err := s.getCachedStats(ctx)
	if err == nil && cached != nil {
		return cached, nil
	}

	stats := &DashboardStats{}

	s.db.WithContext(ctx).Table("products").Count(&stats.Products)
	s.db.WithContext(ctx).Table("seasons").Count(&stats.Seasons)
	s.db.WithContext(ctx).Table("seasons").Where("is_active = ?", true).Count(&stats.ActiveSeasons)
	s.db.WithContext(ctx).Table("care_guides").Count(&stats.CareGuides)
	s.db.WithContext(ctx).Table("media").Count(&stats.Media)
	s.db.WithContext(ctx).Table("users").Count(&stats.Users)
	s.db.WithContext(ctx).Table("users").Where("role = ?", "admin").Count(&stats.AdminUsers)
	s.db.WithContext(ctx).Table("products").Where("stock < ? AND stock > 0", 10).Count(&stats.LowStock)
	s.db.WithContext(ctx).Table("products").Where("stock = ?", 0).Count(&stats.OutOfStock)

	var totalStock int64
	s.db.WithContext(ctx).Raw("SELECT COALESCE(SUM(stock), 0) FROM products").Scan(&totalStock)
	stats.TotalStock = totalStock

	var catalogValue int64
	s.db.WithContext(ctx).Raw("SELECT COALESCE(SUM(base_price * stock), 0) FROM products").Scan(&catalogValue)
	stats.CatalogValue = catalogValue

	_ = s.cacheStats(ctx, stats)

	return stats, nil
}

func (s *StatsService) getCachedStats(ctx context.Context) (*DashboardStats, error) {
	keys := []string{
		"stats:products", "stats:seasons", "stats:active_seasons",
		"stats:care_guides", "stats:media", "stats:users",
		"stats:admin_users", "stats:low_stock", "stats:out_of_stock",
		"stats:total_stock", "stats:catalog_value",
	}
	vals, err := s.redis.MGet(ctx, keys...).Result()
	if err != nil {
		return nil, err
	}

	for _, v := range vals {
		if v == nil {
			return nil, fmt.Errorf("cache miss")
		}
	}

	parse := func(i int) int64 {
		s, _ := strconv.ParseInt(vals[i].(string), 10, 64)
		return s
	}

	return &DashboardStats{
		Products:      parse(0),
		Seasons:       parse(1),
		ActiveSeasons: parse(2),
		CareGuides:    parse(3),
		Media:         parse(4),
		Users:         parse(5),
		AdminUsers:    parse(6),
		LowStock:      parse(7),
		OutOfStock:    parse(8),
		TotalStock:    parse(9),
		CatalogValue:  parse(10),
	}, nil
}

func (s *StatsService) cacheStats(ctx context.Context, stats *DashboardStats) error {
	pipe := s.redis.Pipeline()
	pipe.Set(ctx, "stats:products", stats.Products, statsCacheTTL)
	pipe.Set(ctx, "stats:seasons", stats.Seasons, statsCacheTTL)
	pipe.Set(ctx, "stats:active_seasons", stats.ActiveSeasons, statsCacheTTL)
	pipe.Set(ctx, "stats:care_guides", stats.CareGuides, statsCacheTTL)
	pipe.Set(ctx, "stats:media", stats.Media, statsCacheTTL)
	pipe.Set(ctx, "stats:users", stats.Users, statsCacheTTL)
	pipe.Set(ctx, "stats:admin_users", stats.AdminUsers, statsCacheTTL)
	pipe.Set(ctx, "stats:low_stock", stats.LowStock, statsCacheTTL)
	pipe.Set(ctx, "stats:out_of_stock", stats.OutOfStock, statsCacheTTL)
	pipe.Set(ctx, "stats:total_stock", stats.TotalStock, statsCacheTTL)
	pipe.Set(ctx, "stats:catalog_value", stats.CatalogValue, statsCacheTTL)
	_, err := pipe.Exec(ctx)
	return err
}
