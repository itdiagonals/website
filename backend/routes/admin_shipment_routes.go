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

func registerAdminShipmentRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	transactionRepository := repository.NewTransactionRepository(db)
	productRepository := repository.NewProductRepository(db)
	shippingService := service.NewBiteshipService()
	bookingService := service.NewShippingBookingService(transactionRepository, productRepository, shippingService)
	shipmentHandler := handler.NewAdminShipmentHandler(bookingService)
	transactionHandler := handler.NewAdminTransactionHandler(transactionRepository)

	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	userRepository := repository.NewUserRepository(db)

	admin := api.Group("/admin")
	admin.Use(middleware.RequireAuth(authSessionRepository, userRepository), middleware.RequireRole("admin"))
	admin.POST("/shipments/pack", shipmentHandler.MarkPacked)
	admin.POST("/shipments/book", shipmentHandler.BookShipment)
	admin.GET("/transactions", transactionHandler.ListTransactions)
	admin.GET("/transactions/:order_id", transactionHandler.GetTransactionDetail)
}
