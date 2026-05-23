package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/handler"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"gorm.io/gorm"
)

func registerOTPRoutes(api *gin.RouterGroup, db *gorm.DB, otpService service.OTPService) {
	userRepo := repository.NewUserRepository(db)
	otpHandler := handler.NewOTPHandler(otpService, userRepo)

	otp := api.Group("/otp")
	{
		otp.POST("/request", otpHandler.RequestOTP)
		otp.POST("/verify", otpHandler.VerifyOTP)
	}
}
