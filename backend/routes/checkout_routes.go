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
	checkoutRatesIPRateLimit = service.AuthRateLimitConfig{
		Scope:    "checkout-rates-ip",
		Window:   1 * time.Minute,
		Max:      20,
		Cooldown: 1 * time.Minute,
	}
	checkoutIPRateLimit = service.AuthRateLimitConfig{
		Scope:    "checkout-ip",
		Window:   1 * time.Minute,
		Max:      10,
		Cooldown: 1 * time.Minute,
	}
)

func registerCheckoutRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	userRepository := repository.NewUserRepository(db)
	customerAddressRepository := repository.NewCustomerAddressRepository(db)
	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	cartRepository := repository.NewCartRepository(db, redisClient)
	productRepository := repository.NewProductRepository(db)
	transactionRepository := repository.NewTransactionRepository(db)
	stockReservationService := service.NewRedisStockReservationService(redisClient, productRepository)
	shippingService := service.NewBiteshipService()
	checkoutService := service.NewCheckoutService(userRepository, customerAddressRepository, cartRepository, productRepository, transactionRepository, stockReservationService, shippingService)
	checkoutHandler := handler.NewCheckoutHandler(checkoutService)

	authRateLimiter := service.NewAuthRateLimiter(redisClient)
	protected := api.Group("")
	protected.Use(middleware.RequireAuth(authSessionRepository, userRepository), middleware.RequireRole("customer"))
	protected.POST("/checkout/rates", middleware.RequireRateLimitByIP(authRateLimiter, checkoutRatesIPRateLimit), checkoutHandler.GetShippingRates)
	protected.POST("/checkout", middleware.RequireRateLimitByIP(authRateLimiter, checkoutIPRateLimit), checkoutHandler.Checkout)
}
