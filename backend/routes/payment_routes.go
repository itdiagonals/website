package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"gorm.io/gorm"
)

func registerPaymentRoutes(api *gin.RouterGroup, db *gorm.DB) {
	transactionRepository := repository.NewTransactionRepository(db)
	stockReservationRepository := repository.NewStockReservationRepository(db)
	productRepository := repository.NewProductRepository(db)
	shippingJobRepository := repository.NewShippingJobRepository(db)
	webhookEventRepository := repository.NewBiteshipWebhookEventRepository(db)
	notificationService := service.NewMidtransNotificationService(transactionRepository, stockReservationRepository, productRepository, shippingJobRepository)
	notificationHandler := handler.NewMidtransNotificationHandler(notificationService)
	biteshipWebhookService := service.NewBiteshipWebhookService(transactionRepository, webhookEventRepository)
	biteshipWebhookHandler := handler.NewBiteshipWebhookHandler(biteshipWebhookService)

	api.POST("/payments/midtrans/notification", notificationHandler.ReceiveNotification)
	api.POST("/payments/biteship/notification", biteshipWebhookHandler.ReceiveNotification)
}
