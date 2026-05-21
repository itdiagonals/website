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

func registerTransactionRoutes(api *gin.RouterGroup, backendDB *gorm.DB, redisClient *redis.Client) {
	transactionRepository := repository.NewTransactionRepository(backendDB)
	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	userRepository := repository.NewUserRepository(backendDB)
	shippingService := service.NewBiteshipService()
	transactionService := service.NewTransactionHistoryService(transactionRepository, shippingService)
	transactionHandler := handler.NewTransactionHandler(transactionService)

	protected := api.Group("")
	protected.Use(middleware.RequireAuth(authSessionRepository, userRepository), middleware.RequireRole("customer"))
	protected.GET("/transactions", transactionHandler.GetMyTransactions)
	protected.GET("/transactions/:order_id", transactionHandler.GetMyTransactionDetail)
	protected.GET("/transactions/:order_id/tracking", transactionHandler.GetMyTransactionTracking)
}
