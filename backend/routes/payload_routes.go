package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"gorm.io/gorm"
)

func registerUserRoutes(api *gin.RouterGroup, db *gorm.DB) {
	repo := repository.NewUserRepository(db)
	svc := service.NewUserService(repo)
	h := handler.NewUserHandler(svc)

	routes := api.Group("/users")
	{
		routes.GET("", h.GetAllUsers)
		routes.GET("/:id", h.GetUserByID)
		routes.POST("", h.CreateUser)
		routes.PUT("/:id", h.UpdateUser)
		routes.DELETE("/:id", h.DeleteUser)
	}
}

func registerMediaRoutes(api *gin.RouterGroup, db *gorm.DB) {
	repo := repository.NewMediaRepository(db)
	svc := service.NewMediaService(repo)
	h := handler.NewMediaHandler(svc)

	routes := api.Group("/media")
	{
		routes.GET("", h.GetAllMedia)
		routes.GET("/:id", h.GetMediaByID)
		routes.POST("", h.CreateMedia)
		routes.PUT("/:id", h.UpdateMedia)
		routes.DELETE("/:id", h.DeleteMedia)
	}
}

func registerCategoryRoutes(api *gin.RouterGroup, db *gorm.DB) {
	repo := repository.NewCategoryRepository(db)
	svc := service.NewCategoryService(repo)
	h := handler.NewCategoryHandler(svc)

	routes := api.Group("/categories")
	{
		routes.GET("", h.GetAllCategories)
		routes.GET("/:id", h.GetCategoryByID)
		routes.GET("/slug/:slug", h.GetCategoryBySlug)
		routes.POST("", h.CreateCategory)
		routes.PUT("/:id", h.UpdateCategory)
		routes.DELETE("/:id", h.DeleteCategory)
	}
}

func registerSeasonRoutes(api *gin.RouterGroup, db *gorm.DB) {
	repo := repository.NewSeasonRepository(db)
	svc := service.NewSeasonService(repo)
	h := handler.NewSeasonHandler(svc)

	routes := api.Group("/seasons")
	{
		routes.GET("", h.GetAllSeasons)
		routes.GET("/:id", h.GetSeasonByID)
		routes.GET("/slug/:slug", h.GetSeasonBySlug)
		routes.POST("", h.CreateSeason)
		routes.PUT("/:id", h.UpdateSeason)
		routes.DELETE("/:id", h.DeleteSeason)
	}
}

func registerCareGuideRoutes(api *gin.RouterGroup, db *gorm.DB) {
	repo := repository.NewCareGuideRepository(db)
	svc := service.NewCareGuideService(repo)
	h := handler.NewCareGuideHandler(svc)

	routes := api.Group("/care-guides")
	{
		routes.GET("", h.GetAllCareGuides)
		routes.GET("/:id", h.GetCareGuideByID)
		routes.POST("", h.CreateCareGuide)
		routes.PUT("/:id", h.UpdateCareGuide)
		routes.DELETE("/:id", h.DeleteCareGuide)
	}
}


