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

func registerProductRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	mediaRepo := repository.NewMediaRepository(db)
	categoryRepo := repository.NewCategoryRepository(db)
	seasonRepo := repository.NewSeasonRepository(db)
	careGuideRepo := repository.NewCareGuideRepository(db)
	repo := repository.NewProductFullRepository(db)
	productRepository := repository.NewProductRepository(db)
	stockReservationService := service.NewRedisStockReservationService(redisClient, productRepository)
	svc := service.NewProductFullService(repo, mediaRepo, categoryRepo, seasonRepo, careGuideRepo, redisClient, stockReservationService)
	h := handler.NewProductFullHandler(svc)
	authRateLimiter := service.NewAuthRateLimiter(redisClient)

	api.GET("/products", middleware.RequireRateLimitByIP(authRateLimiter, catalogReadIPRateLimit), h.GetAllProducts)
	api.GET("/products/:id", middleware.RequireRateLimitByIP(authRateLimiter, catalogReadIPRateLimit), h.GetProductByID)
	api.GET("/products/:id/similar", middleware.RequireRateLimitByIP(authRateLimiter, catalogReadIPRateLimit), h.GetSimilarProducts)
	api.GET("/products/slug/:slug", middleware.RequireRateLimitByIP(authRateLimiter, catalogReadIPRateLimit), h.GetProductBySlug)

	authSessionRepository := repository.NewAuthSessionRepository(redisClient)
	userRepository := repository.NewUserRepository(db)
	admin := api.Group("")
	admin.Use(middleware.RequireAuth(authSessionRepository, userRepository), middleware.RequireRole("admin"))
	admin.POST("/products", h.CreateProduct)
	admin.PUT("/products/:id", h.UpdateProduct)
	admin.DELETE("/products/:id", h.DeleteProduct)
}
