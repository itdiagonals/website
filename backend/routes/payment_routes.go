package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"gorm.io/gorm"
)

func registerPaymentRoutes(api *gin.RouterGroup, backendDB *gorm.DB, payloadDB *gorm.DB) {
	transactionRepository := repository.NewTransactionRepository(backendDB)
	stockReservationRepository := repository.NewStockReservationRepository(backendDB)
	productRepository := repository.NewProductRepository(payloadDB)
	shippingJobRepository := repository.NewShippingJobRepository(backendDB)
	webhookEventRepository := repository.NewBiteshipWebhookEventRepository(backendDB)
	notificationService := service.NewMidtransNotificationService(transactionRepository, stockReservationRepository, productRepository, shippingJobRepository)
	notificationHandler := handler.NewMidtransNotificationHandler(notificationService)
	biteshipWebhookService := service.NewBiteshipWebhookService(transactionRepository, webhookEventRepository)
	biteshipWebhookHandler := handler.NewBiteshipWebhookHandler(biteshipWebhookService)

	api.POST("/payments/midtrans/notification", notificationHandler.ReceiveNotification)
	api.POST("/payments/biteship/notification", biteshipWebhookHandler.ReceiveNotification)
}
