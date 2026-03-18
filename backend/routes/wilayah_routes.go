package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"gorm.io/gorm"
)

func registerWilayahRoutes(api *gin.RouterGroup, db *gorm.DB) {
	wilayahRepository := repository.NewWilayahRepository(db)
	wilayahService := service.NewWilayahService(wilayahRepository)
	wilayahHandler := handler.NewWilayahHandler(wilayahService)

	api.GET("/wilayah/search", wilayahHandler.Search)
}
