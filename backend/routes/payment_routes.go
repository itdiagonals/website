package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

func registerPaymentRoutes(api *gin.RouterGroup, db *gorm.DB, redisClient *redis.Client) {
	transactionRepository := repository.NewTransactionRepository(db)
	productRepository := repository.NewProductRepository(db)
	stockReservationService := service.NewRedisStockReservationService(redisClient, productRepository)
	shippingJobRepository := repository.NewShippingJobRepository(db)
	webhookEventRepository := repository.NewBiteshipWebhookEventRepository(db)
	notificationService := service.NewMidtransNotificationService(transactionRepository, stockReservationService, shippingJobRepository)
	notificationHandler := handler.NewMidtransNotificationHandler(notificationService)
	biteshipWebhookService := service.NewBiteshipWebhookService(transactionRepository, webhookEventRepository)
	biteshipWebhookHandler := handler.NewBiteshipWebhookHandler(biteshipWebhookService)

	api.POST("/payments/midtrans/notification", notificationHandler.ReceiveNotification)
	api.POST("/payments/biteship/notification", biteshipWebhookHandler.ReceiveNotification)
}
