package handler

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
)

// OTPHandler handles OTP-related HTTP requests.
type OTPHandler struct {
	otpService service.OTPService
	userRepo   repository.UserRepository
	limiter    service.AuthRateLimiter
}

// NewOTPHandler creates a new OTP handler.
func NewOTPHandler(otpService service.OTPService, userRepo repository.UserRepository, limiter service.AuthRateLimiter) *OTPHandler {
	return &OTPHandler{otpService: otpService, userRepo: userRepo, limiter: limiter}
}

var otpVerifyIdentifierRateLimit = service.AuthRateLimitConfig{
	Scope:    "otp-verify-identifier",
	Window:   15 * time.Minute,
	Max:      5,
	Cooldown: 15 * time.Minute,
}

// RequestOTP godoc
// @Summary Request OTP
// @Description Request an OTP code to be sent to the specified email address
// @Tags otp
// @Accept json
// @Produce json
// @Param input body domain.OTPRequestInput true "OTP Request Input"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 429 {object} map[string]string
// @Router /otp/request [post]
func (h *OTPHandler) RequestOTP(c *gin.Context) {
	var input domain.OTPRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.Email = strings.TrimSpace(strings.ToLower(input.Email))

	_, err := h.otpService.RequestOTP(c.Request.Context(), input.Email, input.Purpose)
	if err != nil {
		if err == service.ErrOTPRateLimitExceeded {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OTP sent successfully"})
}

// VerifyOTP godoc
// @Summary Verify OTP
// @Description Verify an OTP code for the specified email address
// @Tags otp
// @Accept json
// @Produce json
// @Param input body domain.OTPVerifyInput true "OTP Verify Input"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Router /otp/verify [post]
func (h *OTPHandler) VerifyOTP(c *gin.Context) {
	var input domain.OTPVerifyInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	input.Code = strings.TrimSpace(input.Code)

	if !h.enforceIdentifierRateLimit(c, otpVerifyIdentifierRateLimit, input.Email) {
		return
	}

	if err := h.otpService.VerifyOTP(c.Request.Context(), input.Email, input.Code, input.Purpose); err != nil {
		if err == service.ErrOTPInvalid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if input.Purpose == domain.OTPPurposeAccountVerification {
		if err := h.userRepo.VerifyEmail(c.Request.Context(), input.Email); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "OTP verified but failed to activate account"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "OTP verified successfully, account activated"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "OTP verified successfully"})
}

func (h *OTPHandler) enforceIdentifierRateLimit(c *gin.Context, config service.AuthRateLimitConfig, identifier string) bool {
	if h.limiter == nil {
		return true
	}

	allowed, err := h.limiter.AllowByIPAndIdentifier(c.Request.Context(), c.ClientIP(), identifier, config)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "service temporarily unavailable"})
		return false
	}

	if !allowed {
		c.JSON(http.StatusTooManyRequests, gin.H{"error": "too many requests, please try again later"})
		return false
	}

	return true
}
