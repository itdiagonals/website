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

func registerCartRoutes(router *gin.Engine, redisClient *redis.Client, backendDB *gorm.DB, payloadDB *gorm.DB) {
	cartRepository := repository.NewCartRepository(backendDB, redisClient)
	productRepository := repository.NewProductRepository(payloadDB)
	authSessionRepository := repository.NewAuthSessionRepository(backendDB)
	cartService := service.NewCartService(cartRepository, productRepository)
	cartHandler := handler.NewCartHandler(cartService)

	protected := router.Group("/api/v1")
	protected.Use(middleware.RequireAuth(authSessionRepository))
	protected.POST("/cart/add", cartHandler.AddToCart)
	protected.GET("/cart", cartHandler.GetCart)
	protected.PATCH("/cart/quantity", cartHandler.UpdateQuantity)
	protected.DELETE("/cart/remove", cartHandler.RemoveFromCart)
}
