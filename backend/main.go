package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/config"
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
// @description Customer auth and product catalog API for the Diagonals website backend.
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @BasePath /
func main() {
	config.LoadEnv()

	ginMode := strings.TrimSpace(os.Getenv("BACKEND_GIN_MODE"))
	if ginMode == "" {
		ginMode = gin.ReleaseMode
	}
	gin.SetMode(ginMode)

	config.ConnectDB()
	config.InitMidtrans()

	redisClient, err := config.ConnectRedis()
	if err != nil {
		log.Fatalf("failed to connect redis: %v", err)
	}

	startShippingJobWorker(config.DBBackend, config.DBPayload)

	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())

	trustedProxies := getTrustedProxies()
	if err := router.SetTrustedProxies(trustedProxies); err != nil {
		log.Fatalf("failed to configure trusted proxies: %v", err)
	}

	routes.SetupRoutes(router, config.DBBackend, config.DBPayload, redisClient)

	router.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	router.GET("/ping", func(context *gin.Context) {
		context.JSON(http.StatusOK, gin.H{
			"message": "pong",
		})
	})

	if err := router.Run(":8080"); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}

func startShippingJobWorker(backendDB *gorm.DB, payloadDB *gorm.DB) {
	if backendDB == nil {
		log.Printf("shipping worker disabled: invalid backend db")
		return
	}

	if payloadDB == nil {
		log.Printf("shipping worker disabled: invalid payload db")
		return
	}

	transactionRepository := repository.NewTransactionRepository(backendDB)
	productRepository := repository.NewProductRepository(payloadDB)
	shippingJobRepository := repository.NewShippingJobRepository(backendDB)
	shippingService := service.NewBiteshipService()
	bookingService := service.NewShippingBookingService(transactionRepository, productRepository, shippingService)
	worker := service.NewShippingJobWorker(shippingJobRepository, bookingService)

	go worker.Start(context.Background())
	log.Printf("shipping job worker started")
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
