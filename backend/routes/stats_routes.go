package routes

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/middleware"
	"github.com/itdiagonals/website/backend/service"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

var statsIPRateLimit = service.AuthRateLimitConfig{
	Scope:    "stats-ip",
	Window:   1 * time.Minute,
	Max:      60,
	Cooldown: 1 * time.Minute,
}

func registerStatsRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	statsSvc := service.NewStatsService(db, redisClient)
	h := handler.NewStatsHandler(statsSvc)
	authRateLimiter := service.NewAuthRateLimiter(redisClient)

	api.GET("/stats", middleware.RequireRateLimitByIP(authRateLimiter, statsIPRateLimit), h.GetDashboardStats)
}
