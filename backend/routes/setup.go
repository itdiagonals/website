package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/service"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func SetupRoutes(router *gin.Engine, db *gorm.DB, redisClient *redis.Client, otpService service.OTPService, emailSender service.EmailSender, fromAddress domain.EmailAddress) {
	api := router.Group("/api/v1")

	registerAuthRoutes(api, db, redisClient, otpService)
	registerCustomerAddressRoutes(api, db, redisClient)
	registerWilayahRoutes(api, db)
	registerProductRoutes(api, db, redisClient)
	registerCheckoutRoutes(api, db, redisClient)
	registerPaymentRoutes(api, db)
	registerTransactionRoutes(api, db, redisClient)
	registerCartRoutes(router, redisClient, db)
	registerStatsRoutes(api, db, redisClient)

	registerUserRoutes(api, db, redisClient, emailSender, fromAddress)
	registerMediaRoutes(api, db, redisClient)
	registerCategoryRoutes(api, db, redisClient)
	registerSeasonRoutes(api, db, redisClient)
	registerCareGuideRoutes(api, db, redisClient)
	registerOTPRoutes(api, db, otpService)
}
