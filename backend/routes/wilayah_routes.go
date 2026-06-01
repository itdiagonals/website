package routes

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/middleware"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

var utilityIPRateLimit = service.AuthRateLimitConfig{
	Scope:    "utility-ip",
	Window:   1 * time.Minute,
	Max:      100,
	Cooldown: 1 * time.Minute,
}

func registerWilayahRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	wilayahRepository := repository.NewWilayahRepository(db)
	wilayahService := service.NewWilayahService(wilayahRepository)
	wilayahCache := service.NewCatalogCache(redisClient)
	wilayahHandler := handler.NewWilayahHandler(wilayahService, wilayahCache)
	authRateLimiter := service.NewAuthRateLimiter(redisClient)

	api.GET("/wilayah/search", middleware.RequireRateLimitByIP(authRateLimiter, utilityIPRateLimit), wilayahHandler.Search)
}
