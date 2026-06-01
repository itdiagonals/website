package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/middleware"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
	"time"
)

var (
	otpRequestIPRateLimit = service.AuthRateLimitConfig{
		Scope:    "otp-request-ip",
		Window:   15 * time.Minute,
		Max:      10,
		Cooldown: 15 * time.Minute,
	}
	otpVerifyIPRateLimit = service.AuthRateLimitConfig{
		Scope:    "otp-verify-ip",
		Window:   15 * time.Minute,
		Max:      10,
		Cooldown: 15 * time.Minute,
	}
)

func registerOTPRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client, otpService service.OTPService) {
	userRepo := repository.NewUserRepository(db)
	authRateLimiter := service.NewAuthRateLimiter(redisClient)
	otpHandler := handler.NewOTPHandler(otpService, userRepo, authRateLimiter)

	otp := api.Group("/otp")
	{
		otp.POST("/request", middleware.RequireRateLimitByIP(authRateLimiter, otpRequestIPRateLimit), otpHandler.RequestOTP)
		otp.POST("/verify", middleware.RequireRateLimitByIP(authRateLimiter, otpVerifyIPRateLimit), otpHandler.VerifyOTP)
	}
}
