package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"gorm.io/gorm"
)

func registerCatalogSyncRoutes(router *gin.Engine, db *gorm.DB) {
	catalogSyncRepository := repository.NewCatalogSyncRepository(db)
	catalogSyncService := service.NewCatalogSyncService(catalogSyncRepository)
	catalogSyncHandler := handler.NewCatalogSyncHandler(catalogSyncService)

	router.POST("/api/internal/catalog-sync", catalogSyncHandler.Handle)
}
