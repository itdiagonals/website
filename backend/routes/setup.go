package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/service"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func SetupRoutes(router *gin.Engine, db *gorm.DB, redisClient *redis.Client, otpService service.OTPService) {
	api := router.Group("/api/v1")

	registerAuthRoutes(api, db, redisClient, otpService)
	registerCustomerAddressRoutes(api, db, redisClient)
	registerWilayahRoutes(api, db)
	registerProductRoutes(api, db, redisClient)
	registerCheckoutRoutes(api, db, redisClient)
	registerPaymentRoutes(api, db)
	registerTransactionRoutes(api, db, redisClient)
	registerCartRoutes(router, redisClient, db)

	registerUserRoutes(api, db, redisClient)
	registerMediaRoutes(api, db, redisClient)
	registerCategoryRoutes(api, db, redisClient)
	registerSeasonRoutes(api, db, redisClient)
	registerCareGuideRoutes(api, db, redisClient)
	registerOTPRoutes(api, db, otpService)
}
