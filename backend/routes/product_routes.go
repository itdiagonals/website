package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"gorm.io/gorm"
)

func registerProductRoutes(api *gin.RouterGroup, db *gorm.DB) {
	productRepository := repository.NewProductRepository(db)
	productService := service.NewProductService(productRepository)
	productHandler := handler.NewProductHandler(productService)

	api.GET("/products", productHandler.GetAll)
	api.GET("/products/:slug", productHandler.GetBySlug)
}
