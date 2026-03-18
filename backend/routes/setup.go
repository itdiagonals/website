package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func SetupRoutes(router *gin.Engine, backendDB *gorm.DB, payloadDB *gorm.DB, redisClient *redis.Client) {
	api := router.Group("/api/v1")

	registerAuthRoutes(api, backendDB, redisClient)
	registerCustomerAddressRoutes(api, backendDB)
	registerWilayahRoutes(api, backendDB)
	registerProductRoutes(api, payloadDB)
	registerCheckoutRoutes(api, backendDB, payloadDB, redisClient)
	registerCartRoutes(router, redisClient, backendDB, payloadDB)
}
