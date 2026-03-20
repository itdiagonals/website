package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/middleware"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"gorm.io/gorm"
)

func registerCustomerAddressRoutes(api *gin.RouterGroup, db *gorm.DB) {
	customerAddressRepository := repository.NewCustomerAddressRepository(db)
	authSessionRepository := repository.NewAuthSessionRepository(db)
	shippingService := service.NewBiteshipService()
	customerAddressService := service.NewCustomerAddressService(db, customerAddressRepository, shippingService)
	customerAddressHandler := handler.NewCustomerAddressHandler(customerAddressService)

	protected := api.Group("")
	protected.Use(middleware.RequireAuth(authSessionRepository))
	protected.POST("/addresses", customerAddressHandler.AddAddress)
	protected.GET("/addresses", customerAddressHandler.GetMyAddresses)
	protected.PUT("/addresses/:id", customerAddressHandler.UpdateAddress)
}
