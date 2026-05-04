package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/middleware"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func registerAuthRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	userRepository := repository.NewUserRepository(db)
	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	authService := service.NewAuthService(userRepository, authSessionRepository)
	authHandler := handler.NewAuthHandler(authService)

	api.POST("/auth/register", authHandler.Register)
	api.POST("/auth/login", authHandler.Login)
	api.POST("/auth/refresh", authHandler.Refresh)

	protectedAuth := api.Group("/auth")
	protectedAuth.Use(middleware.RequireAuth(authSessionRepository, userRepository))
	protectedAuth.GET("/sessions", authHandler.ListSessions)
	protectedAuth.POST("/logout", authHandler.Logout)
	protectedAuth.POST("/logout-all", authHandler.LogoutAll)
}
