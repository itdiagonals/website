package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/middleware"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"gorm.io/gorm"
)

func registerTransactionRoutes(api *gin.RouterGroup, backendDB *gorm.DB) {
	transactionRepository := repository.NewTransactionRepository(backendDB)
	authSessionRepository := repository.NewAuthSessionRepository(backendDB)
	transactionService := service.NewTransactionHistoryService(transactionRepository)
	transactionHandler := handler.NewTransactionHandler(transactionService)

	protected := api.Group("")
	protected.Use(middleware.RequireAuth(authSessionRepository))
	protected.GET("/transactions", transactionHandler.GetMyTransactions)
	protected.GET("/transactions/:order_id", transactionHandler.GetMyTransactionDetail)
}
