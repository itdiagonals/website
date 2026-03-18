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

func registerCheckoutRoutes(api *gin.RouterGroup, backendDB *gorm.DB, payloadDB *gorm.DB, redisClient *redis.Client) {
	customerRepository := repository.NewCustomerRepository(backendDB)
	customerAddressRepository := repository.NewCustomerAddressRepository(backendDB)
	authSessionRepository := repository.NewAuthSessionRepository(backendDB)
	cartRepository := repository.NewCartRepository(backendDB, redisClient)
	productRepository := repository.NewProductRepository(payloadDB)
	transactionRepository := repository.NewTransactionRepository(backendDB)
	shippingService := service.NewRajaOngkirService()
	checkoutService := service.NewCheckoutService(customerRepository, customerAddressRepository, cartRepository, productRepository, transactionRepository, shippingService)
	checkoutHandler := handler.NewCheckoutHandler(checkoutService)

	protected := api.Group("")
	protected.Use(middleware.RequireAuth(authSessionRepository))
	protected.POST("/checkout/rates", checkoutHandler.GetShippingRates)
	protected.POST("/checkout", checkoutHandler.Checkout)
}
