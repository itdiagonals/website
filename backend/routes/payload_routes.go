package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/middleware"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"github.com/itdiagonals/website/backend/storage"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func registerUserRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client, emailSender service.EmailSender, fromAddress domain.EmailAddress) {
	repo := repository.NewUserRepository(db)
	svc := service.NewUserService(repo)
	h := handler.NewUserHandler(svc)

	inviteSvc := service.NewInviteService(repo, redisClient, emailSender, fromAddress)
	inviteH := handler.NewInviteHandler(inviteSvc)

	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	userRepository := repository.NewUserRepository(db)

	me := api.Group("/users")
	me.Use(middleware.RequireAuth(authSessionRepository, userRepository))
	{
		me.GET("/me", h.GetMe)
		me.PUT("/me", h.UpdateMe)
	}

	admin := api.Group("/users")
	admin.Use(middleware.RequireAuth(authSessionRepository, userRepository), middleware.RequireRole("admin"))
	{
		admin.GET("", h.GetAllUsers)
		admin.GET("/:id", h.GetUserByID)
		admin.POST("", h.CreateUser)
		admin.PUT("/:id", h.UpdateUser)
		admin.DELETE("/:id", h.DeleteUser)
		admin.POST("/invite", inviteH.InviteAdmin)
	}

	api.GET("/users/invite-check", inviteH.CheckInviteToken)
	api.POST("/users/invite-redeem", inviteH.RedeemInviteToken)
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
	svc := service.NewMediaService(repo, mediaStore)
	h := handler.NewMediaHandler(svc, mediaStore)

	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	userRepository := repository.NewUserRepository(db)

	api.GET("/media", h.GetAllMedia)
	api.GET("/media/:id", h.GetMediaByID)

	admin := api.Group("/media")
	admin.Use(middleware.RequireAuth(authSessionRepository, userRepository), middleware.RequireRole("admin"))
	{
		admin.POST("/presigned-url", h.GetPresignedURL)
		admin.POST("/confirm", h.ConfirmUpload)
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
