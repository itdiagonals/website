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
	notificationService := service.NewMidtransNotificationService(transactionRepository, stockReservationRepository, productRepository)
	notificationHandler := handler.NewMidtransNotificationHandler(notificationService)

	api.POST("/payments/midtrans/notification", notificationHandler.ReceiveNotification)
}
