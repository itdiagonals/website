package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/service"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func registerStatsRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	statsSvc := service.NewStatsService(db, redisClient)
	h := handler.NewStatsHandler(statsSvc)

	api.GET("/stats", h.GetDashboardStats)
}
