package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"gorm.io/gorm"
)

func registerProductRoutes(api *gin.RouterGroup, db *gorm.DB) {
	repo := repository.NewProductFullRepository(db)
	svc := service.NewProductFullService(repo)
	h := handler.NewProductFullHandler(svc)

	api.GET("/products", h.GetAllProducts)
	api.GET("/products/:id", h.GetProductByID)
	api.GET("/products/slug/:slug", h.GetProductBySlug)
	api.POST("/products", h.CreateProduct)
	api.PUT("/products/:id", h.UpdateProduct)
	api.DELETE("/products/:id", h.DeleteProduct)
}
