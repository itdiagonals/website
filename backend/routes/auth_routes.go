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

var (
	registerIPRateLimit = service.AuthRateLimitConfig{
		Scope:    "auth-register-ip",
		Window:   time.Hour,
		Max:      5,
		Cooldown: 30 * time.Minute,
	}
	loginIPRateLimit = service.AuthRateLimitConfig{
		Scope:    "auth-login-ip",
		Window:   15 * time.Minute,
		Max:      30,
		Cooldown: 15 * time.Minute,
	}
	verifyIPRateLimit = service.AuthRateLimitConfig{
		Scope:    "auth-verify-ip",
		Window:   15 * time.Minute,
		Max:      10,
		Cooldown: 15 * time.Minute,
	}
	resetIPRateLimit = service.AuthRateLimitConfig{
		Scope:    "auth-reset-ip",
		Window:   15 * time.Minute,
		Max:      10,
		Cooldown: 15 * time.Minute,
	}
	refreshIPRateLimit = service.AuthRateLimitConfig{
		Scope:    "auth-refresh-ip",
		Window:   1 * time.Minute,
		Max:      100,
		Cooldown: 1 * time.Minute,
	}
)

func registerAuthRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client, otpService service.OTPService) {
	userRepository := repository.NewUserRepository(db)
	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	authService := service.NewAuthService(userRepository, authSessionRepository)
	authRateLimiter := service.NewAuthRateLimiter(redisClient)
	authHandler := handler.NewAuthHandler(authService, otpService, authRateLimiter)

	api.GET("/auth/csrf", authHandler.CSRF)
	api.POST("/auth/register", middleware.RequireRateLimitByIP(authRateLimiter, registerIPRateLimit), authHandler.Register)
	api.POST("/auth/verify-registration", middleware.RequireRateLimitByIP(authRateLimiter, verifyIPRateLimit), authHandler.VerifyRegistration)
	api.POST("/auth/login", middleware.RequireRateLimitByIP(authRateLimiter, loginIPRateLimit), authHandler.Login)
	api.POST("/auth/refresh", middleware.RequireRateLimitByIP(authRateLimiter, refreshIPRateLimit), authHandler.Refresh)
	api.POST("/auth/reset-password", middleware.RequireRateLimitByIP(authRateLimiter, resetIPRateLimit), authHandler.ResetPassword)

	protectedAuth := api.Group("/auth")
	protectedAuth.Use(middleware.RequireAuth(authSessionRepository, userRepository))
	protectedAuth.GET("/sessions", authHandler.ListSessions)
	protectedAuth.POST("/logout", authHandler.Logout)
	protectedAuth.POST("/logout-all", authHandler.LogoutAll)
}
