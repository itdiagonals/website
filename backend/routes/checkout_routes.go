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

func registerCheckoutRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	userRepository := repository.NewUserRepository(db)
	customerAddressRepository := repository.NewCustomerAddressRepository(db)
	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	cartRepository := repository.NewCartRepository(db, redisClient)
	productRepository := repository.NewProductRepository(db)
	transactionRepository := repository.NewTransactionRepository(db)
	stockReservationRepository := repository.NewStockReservationRepository(db)
	shippingService := service.NewBiteshipService()
	checkoutService := service.NewCheckoutService(userRepository, customerAddressRepository, cartRepository, productRepository, transactionRepository, stockReservationRepository, shippingService)
	checkoutHandler := handler.NewCheckoutHandler(checkoutService)

	protected := api.Group("")
	protected.Use(middleware.RequireAuth(authSessionRepository, userRepository), middleware.RequireRole("customer"))
	protected.POST("/checkout/rates", checkoutHandler.GetShippingRates)
	protected.POST("/checkout", checkoutHandler.Checkout)
}
