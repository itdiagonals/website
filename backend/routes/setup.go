package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func SetupRoutes(router *gin.Engine, db *gorm.DB, redisClient *redis.Client) {
	api := router.Group("/api/v1")

	registerCatalogSyncRoutes(router, db)
	registerAuthRoutes(api, db, redisClient)
	registerProductRoutes(api, db)
	registerCartRoutes(router, redisClient, db)
}
