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

func registerCustomerAddressRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	customerAddressRepository := repository.NewCustomerAddressRepository(db)
	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	userRepository := repository.NewUserRepository(db)
	shippingService := service.NewBiteshipService()
	customerAddressService := service.NewCustomerAddressService(db, customerAddressRepository, shippingService)
	customerAddressHandler := handler.NewCustomerAddressHandler(customerAddressService)

	protected := api.Group("")
	protected.Use(middleware.RequireAuth(authSessionRepository, userRepository), middleware.RequireRole("customer"))
	protected.POST("/addresses", customerAddressHandler.AddAddress)
	protected.GET("/addresses", customerAddressHandler.GetMyAddresses)
	protected.PUT("/addresses/:id", customerAddressHandler.UpdateAddress)
}
