package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/middleware"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"github.com/itdiagonals/website/backend/storage"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func registerUserRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	repo := repository.NewUserRepository(db)
	svc := service.NewUserService(repo)
	h := handler.NewUserHandler(svc)

	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	userRepository := repository.NewUserRepository(db)

	routes := api.Group("/users")
	routes.Use(middleware.RequireAuth(authSessionRepository, userRepository), middleware.RequireRole("admin"))
	{
		routes.GET("", h.GetAllUsers)
		routes.GET("/:id", h.GetUserByID)
		routes.POST("", h.CreateUser)
		routes.PUT("/:id", h.UpdateUser)
		routes.DELETE("/:id", h.DeleteUser)
	}
}

func registerMediaRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	store, err := storage.NewMinioStorage()
	if err != nil {
		logger.Warn("minio storage unavailable — upload endpoint will fail", "error", err.Error())
		store = nil // Ensure store remains nil interface (not typed nil *MinioStorage)
	}

	var mediaStore storage.Storage
	if store != nil {
		mediaStore = store
	}

	repo := repository.NewMediaRepository(db)
	svc := service.NewMediaService(repo)
	h := handler.NewMediaHandler(svc, mediaStore)

	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	userRepository := repository.NewUserRepository(db)

	api.GET("/media", h.GetAllMedia)
	api.GET("/media/:id", h.GetMediaByID)

	admin := api.Group("/media")
	admin.Use(middleware.RequireAuth(authSessionRepository, userRepository), middleware.RequireRole("admin"))
	{
		admin.POST("/upload", h.UploadMedia)
		admin.POST("", h.CreateMedia)
		admin.PUT("/:id", h.UpdateMedia)
		admin.DELETE("/:id", h.DeleteMedia)
	}
}

func registerCategoryRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	mediaRepo := repository.NewMediaRepository(db)
	repo := repository.NewCategoryRepository(db)
	svc := service.NewCategoryService(repo, mediaRepo)
	h := handler.NewCategoryHandler(svc)

	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	userRepository := repository.NewUserRepository(db)

	api.GET("/categories", h.GetAllCategories)
	api.GET("/categories/:id", h.GetCategoryByID)
	api.GET("/categories/slug/:slug", h.GetCategoryBySlug)

	admin := api.Group("/categories")
	admin.Use(middleware.RequireAuth(authSessionRepository, userRepository), middleware.RequireRole("admin"))
	{
		admin.POST("", h.CreateCategory)
		admin.PUT("/:id", h.UpdateCategory)
		admin.DELETE("/:id", h.DeleteCategory)
	}
}

func registerSeasonRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	mediaRepo := repository.NewMediaRepository(db)
	repo := repository.NewSeasonRepository(db)
	svc := service.NewSeasonService(repo, mediaRepo)
	h := handler.NewSeasonHandler(svc)

	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	userRepository := repository.NewUserRepository(db)

	api.GET("/seasons", h.GetAllSeasons)
	api.GET("/seasons/:id", h.GetSeasonByID)
	api.GET("/seasons/slug/:slug", h.GetSeasonBySlug)

	admin := api.Group("/seasons")
	admin.Use(middleware.RequireAuth(authSessionRepository, userRepository), middleware.RequireRole("admin"))
	{
		admin.POST("", h.CreateSeason)
		admin.PUT("/:id", h.UpdateSeason)
		admin.DELETE("/:id", h.DeleteSeason)
	}
}

func registerCareGuideRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	repo := repository.NewCareGuideRepository(db)
	svc := service.NewCareGuideService(repo)
	h := handler.NewCareGuideHandler(svc)

	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	userRepository := repository.NewUserRepository(db)

	api.GET("/care-guides", h.GetAllCareGuides)
	api.GET("/care-guides/:id", h.GetCareGuideByID)

	admin := api.Group("/care-guides")
	admin.Use(middleware.RequireAuth(authSessionRepository, userRepository), middleware.RequireRole("admin"))
	{
		admin.POST("", h.CreateCareGuide)
		admin.PUT("/:id", h.UpdateCareGuide)
		admin.DELETE("/:id", h.DeleteCareGuide)
	}
}
