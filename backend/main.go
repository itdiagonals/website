package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/config"
	"github.com/itdiagonals/website/backend/middleware"
	"github.com/itdiagonals/website/backend/migrations"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/routes"
	"github.com/itdiagonals/website/backend/service"

	_ "github.com/itdiagonals/website/backend/docs"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/gorm"
)

// @title Diagonals API
// @version 1.0
// @description Customer auth, product catalog, and admin CMS API for the Diagonals website backend.
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @BasePath /
func main() {
	config.LoadEnv()

	initLogger()

	ginMode := strings.TrimSpace(os.Getenv("BACKEND_GIN_MODE"))
	if ginMode == "" {
		ginMode = gin.ReleaseMode
	}
	gin.SetMode(ginMode)

	config.ConnectDB()

	if err := migrations.Apply(config.DB); err != nil {
		logger.Fatal("database migration failed", "error", err.Error())
	}

	config.InitMidtrans()

	redisClient, err := config.ConnectRedis()
	if err != nil {
		logger.Fatal("failed to connect redis", "error", err.Error())
	}

	startShippingJobWorker(config.DB)

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())
	router.Use(middleware.RequireCSRF())

	trustedProxies := getTrustedProxies()
	if err := router.SetTrustedProxies(trustedProxies); err != nil {
		logger.Fatal("failed to configure trusted proxies", "error", err.Error())
	}

	routes.SetupRoutes(router, config.DB, redisClient)
	router.Static("/uploads", "./uploads")

	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	router.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	logger.Info("server.starting", "address", ":8080")
	if err := router.Run(":8080"); err != nil {
		logger.Fatal("failed to start server", "error", err.Error())
	}
}

func initLogger() {
	logLevel := slog.LevelInfo
	if strings.TrimSpace(os.Getenv("BACKEND_GIN_MODE")) == "debug" {
		logLevel = slog.LevelDebug
	}
	logger.Init(logger.Config{
		Level:  logLevel,
		JSON:   true,
		Output: os.Stdout,
	})
}

func startShippingJobWorker(db *gorm.DB) {
	if db == nil {
		logger.Warn("shipping worker disabled: invalid db")
		return
	}

	transactionRepository := repository.NewTransactionRepository(db)
	productRepository := repository.NewProductRepository(db)
	shippingJobRepository := repository.NewShippingJobRepository(db)
	shippingService := service.NewBiteshipService()
	bookingService := service.NewShippingBookingService(transactionRepository, productRepository, shippingService)
	worker := service.NewShippingJobWorker(shippingJobRepository, bookingService)

	go worker.Start(context.Background())
	logger.Info("shipping job worker started")
}

func getTrustedProxies() []string {
	configured := strings.TrimSpace(os.Getenv("BACKEND_TRUSTED_PROXIES"))
	if configured == "" {
		return []string{"127.0.0.1", "::1"}
	}

	parts := strings.Split(configured, ",")
	proxies := make([]string, 0, len(parts))
	for _, part := range parts {
		trimmed := strings.TrimSpace(part)
		if trimmed != "" {
			proxies = append(proxies, trimmed)
		}
	}

	if len(proxies) == 0 {
		return []string{"127.0.0.1", "::1"}
	}

	return proxies
}
