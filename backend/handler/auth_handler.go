package handler

import (
	"errors"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/config"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/middleware"
	"github.com/itdiagonals/website/backend/service"
)

const (
	accessTokenCookieName  = "access_token"
	refreshTokenCookieName = "refresh_token"
)

type AuthHandler struct {
	authService service.AuthService
	otpService  service.OTPService
}

type RegisterRequest struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type ResetPasswordRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Code        string `json:"code" binding:"required,len=6"`
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

type VerifyRegistrationRequest struct {
	Email string `json:"email" binding:"required,email"`
	Code  string `json:"code" binding:"required,len=6"`
}

type StatusResponse struct {
	Status    string `json:"status"`
	Message   string `json:"message,omitempty"`
	CSRFToken string `json:"csrf_token,omitempty"`
}

type CSRFResponse struct {
	CSRFToken string `json:"csrf_token"`
}

type AuthSessionsResponse struct {
	Data []domain.AuthSessionSummary `json:"data"`
}

func NewAuthHandler(authService service.AuthService, otpService service.OTPService) *AuthHandler {
	return &AuthHandler{authService: authService, otpService: otpService}
}

// Register godoc
// @Summary Register customer account
// @Description Register a new customer. An OTP will be sent to the email for verification before the account can be used.
// @Tags Auth
// @Accept json
// @Produce json
// @Param payload body handler.RegisterRequest true "Registration payload"
// @Success 201 {object} handler.StatusResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 403 {object} handler.ErrorResponse "Invalid or missing CSRF token"
// @Failure 409 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/auth/register [post]
func (handler *AuthHandler) Register(context *gin.Context) {
	var request RegisterRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		return
	}

	request.Email = strings.TrimSpace(strings.ToLower(request.Email))

	_, err := handler.authService.Register(context.Request.Context(), service.RegisterInput{
		Name:     request.Name,
		Email:    request.Email,
		Password: request.Password,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrEmailAlreadyRegistered):
			context.JSON(http.StatusConflict, ErrorResponse{Message: err.Error()})
		case errors.Is(err, service.ErrWeakPassword):
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		default:
			context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		}
		return
	}

	_, otpErr := handler.otpService.RequestOTP(context.Request.Context(), request.Email, domain.OTPPurposeAccountVerification)
	if otpErr != nil {
		context.JSON(http.StatusCreated, StatusResponse{Status: "success", Message: "Registration successful, but failed to send verification email. Please request a new code."})
		return
	}

	context.JSON(http.StatusCreated, StatusResponse{Status: "success", Message: "Registration successful. Please check your email for the verification code."})
}

// VerifyRegistration godoc
// @Summary Verify registration OTP
// @Description Verify the OTP sent during registration and activate the account, issuing auth tokens.
// @Tags Auth
// @Accept json
// @Produce json
// @Param payload body handler.VerifyRegistrationRequest true "Verification payload"
// @Success 200 {object} handler.StatusResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 403 {object} handler.ErrorResponse "Invalid or missing CSRF token"
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/auth/verify-registration [post]
func (handler *AuthHandler) VerifyRegistration(context *gin.Context) {
	var request VerifyRegistrationRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		return
	}

	request.Email = strings.TrimSpace(strings.ToLower(request.Email))
	request.Code = strings.TrimSpace(request.Code)

	if err := handler.otpService.VerifyOTP(context.Request.Context(), request.Email, request.Code); err != nil {
		if errors.Is(err, service.ErrOTPInvalid) {
			context.JSON(http.StatusUnauthorized, ErrorResponse{Message: err.Error()})
			return
		}
		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	tokens, err := handler.authService.VerifyAndIssueTokens(context.Request.Context(), request.Email, buildSessionMetadata(context))
	if err != nil {
		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	csrfToken := handler.setAuthCookies(context, *tokens)
	context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "Email verified successfully", CSRFToken: csrfToken})
}

// Login godoc
// @Summary Login customer account
// @Description Authenticate a customer and create a new active session for the current device or browser. Returns a CSRF token in the csrf_token field.
// @Tags Auth
// @Accept json
// @Produce json
// @Param payload body handler.LoginRequest true "Login payload"
// @Success 200 {object} handler.StatusResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 403 {object} handler.ErrorResponse "Invalid or missing CSRF token"
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/auth/login [post]
func (handler *AuthHandler) Login(context *gin.Context) {
	var request LoginRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		return
	}

	response, err := handler.authService.Login(context.Request.Context(), service.LoginInput{
		Email:    request.Email,
		Password: request.Password,
	}, buildSessionMetadata(context))
	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			context.JSON(http.StatusUnauthorized, ErrorResponse{Message: err.Error()})
			return
		}
		if errors.Is(err, service.ErrEmailNotVerified) {
			context.JSON(http.StatusForbidden, ErrorResponse{Message: err.Error()})
			return
		}

		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	csrfToken := handler.setAuthCookies(context, *response)

	context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "login successful", CSRFToken: csrfToken})
}

// Refresh godoc
// @Summary Refresh access token
// @Description Validate the refresh token from HttpOnly cookie against the current session, rotate it, and update auth cookies. Returns a CSRF token in the csrf_token field.
// @Tags Auth
// @Produce json
// @Success 200 {object} handler.StatusResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 403 {object} handler.ErrorResponse "Invalid or missing CSRF token"
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/auth/refresh [post]
func (handler *AuthHandler) Refresh(context *gin.Context) {
	refreshToken, err := context.Cookie(refreshTokenCookieName)
	if err != nil || refreshToken == "" {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: service.ErrInvalidRefreshToken.Error()})
		return
	}

	response, err := handler.authService.Refresh(context.Request.Context(), refreshToken)
	if err != nil {
		if errors.Is(err, service.ErrInvalidRefreshToken) {
			handler.clearAuthCookies(context)
			context.JSON(http.StatusUnauthorized, ErrorResponse{Message: err.Error()})
			return
		}

		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	csrfToken := handler.setAuthCookies(context, *response)

	context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "token refreshed", CSRFToken: csrfToken})
}

// Logout godoc
// @Summary Logout current session
// @Description Revoke the authenticated session for the current device or browser and clear auth cookies
// @Tags Auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} handler.StatusResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/auth/logout [post]
func (handler *AuthHandler) Logout(context *gin.Context) {
	userID, sessionID, ok := getCurrentAuthContext(context)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	if err := handler.authService.LogoutCurrentSession(context.Request.Context(), userID, sessionID); err != nil {
		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	handler.clearAuthCookies(context)
	context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "logout successful"})
}

// LogoutAll godoc
// @Summary Logout all sessions
// @Description Revoke all active sessions for the authenticated user and clear auth cookies on the current device
// @Tags Auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} handler.StatusResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/auth/logout-all [post]
func (handler *AuthHandler) LogoutAll(context *gin.Context) {
	userID, _, ok := getCurrentAuthContext(context)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	if err := handler.authService.LogoutAllSessions(context.Request.Context(), userID); err != nil {
		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	handler.clearAuthCookies(context)
	context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "all sessions revoked"})
}

// ListSessions godoc
// @Summary List active sessions
// @Description List all active sessions for the authenticated user across devices and browsers
// @Tags Auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} handler.AuthSessionsResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/auth/sessions [get]
func (handler *AuthHandler) ListSessions(context *gin.Context) {
	userID, sessionID, ok := getCurrentAuthContext(context)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	sessions, err := handler.authService.ListSessions(context.Request.Context(), userID, sessionID)
	if err != nil {
		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	context.JSON(http.StatusOK, AuthSessionsResponse{Data: sessions})
}

// ResetPassword godoc
// @Summary Reset password with OTP
// @Description Verify OTP code and set a new password for the account
// @Tags Auth
// @Accept json
// @Produce json
// @Param payload body handler.ResetPasswordRequest true "Reset password payload"
// @Success 200 {object} handler.StatusResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 403 {object} handler.ErrorResponse "Invalid or missing CSRF token"
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/auth/reset-password [post]
func (handler *AuthHandler) ResetPassword(context *gin.Context) {
	var request ResetPasswordRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		return
	}

	request.Email = strings.TrimSpace(strings.ToLower(request.Email))
	request.Code = strings.TrimSpace(request.Code)

	if err := handler.otpService.VerifyOTP(context.Request.Context(), request.Email, request.Code); err != nil {
		if errors.Is(err, service.ErrOTPInvalid) {
			context.JSON(http.StatusUnauthorized, ErrorResponse{Message: err.Error()})
			return
		}
		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	if err := handler.authService.ResetPassword(context.Request.Context(), request.Email, request.NewPassword); err != nil {
		switch {
		case errors.Is(err, service.ErrUserNotFound):
			context.JSON(http.StatusNotFound, ErrorResponse{Message: err.Error()})
		case errors.Is(err, service.ErrWeakPassword):
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		default:
			context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		}
		return
	}

	context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "password reset successful"})
}

// CSRF godoc
// @Summary Get CSRF token
// @Description Return the Gorilla CSRF token for the current browser session and ensure the CSRF cookie is present
// @Tags Auth
// @Produce json
// @Success 200 {object} handler.CSRFResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/auth/csrf [get]
func (handler *AuthHandler) CSRF(context *gin.Context) {
	csrfToken := middleware.CSRFToken(context)
	if csrfToken == "" {
		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: "failed to issue csrf token"})
		return
	}

	context.JSON(http.StatusOK, CSRFResponse{CSRFToken: csrfToken})
}

func (handler *AuthHandler) setAuthCookies(context *gin.Context, tokens service.AuthTokens) string {
	config.LoadEnv()

	context.SetSameSite(middleware.CookieSameSite())
	context.SetCookie(
		accessTokenCookieName,
		tokens.AccessToken,
		secondsUntil(tokens.AccessExpiresAt),
		"/",
		os.Getenv("COOKIE_DOMAIN"),
		middleware.CookieSecure(),
		true,
	)
	context.SetCookie(
		refreshTokenCookieName,
		tokens.RefreshToken,
		secondsUntil(tokens.RefreshExpiresAt),
		"/",
		os.Getenv("COOKIE_DOMAIN"),
		middleware.CookieSecure(),
		true,
	)

	return middleware.CSRFToken(context)
}

func (handler *AuthHandler) clearAuthCookies(context *gin.Context) {
	config.LoadEnv()

	context.SetSameSite(middleware.CookieSameSite())
	context.SetCookie(accessTokenCookieName, "", -1, "/", os.Getenv("COOKIE_DOMAIN"), middleware.CookieSecure(), true)
	context.SetCookie(refreshTokenCookieName, "", -1, "/", os.Getenv("COOKIE_DOMAIN"), middleware.CookieSecure(), true)
	middleware.ClearCSRFCookie(context)
}

func secondsUntil(expiresAt time.Time) int {
	seconds := int(time.Until(expiresAt).Seconds())
	if seconds < 0 {
		return 0
	}

	return seconds
}

func buildSessionMetadata(context *gin.Context) service.SessionMetadata {
	return service.SessionMetadata{
		UserAgent:  strings.TrimSpace(context.Request.UserAgent()),
		IPAddress:  strings.TrimSpace(context.ClientIP()),
		DeviceName: strings.TrimSpace(context.GetHeader("X-Device-Name")),
	}
}

func getCurrentAuthContext(context *gin.Context) (string, string, bool) {
	userIDValue, ok := context.Get("user_id")
	if !ok {
		return "", "", false
	}

	userID, ok := userIDValue.(string)
	if !ok || strings.TrimSpace(userID) == "" {
		return "", "", false
	}

	sessionIDValue, ok := context.Get("session_id")
	if !ok {
		return "", "", false
	}

	sessionID, ok := sessionIDValue.(string)
	if !ok || strings.TrimSpace(sessionID) == "" {
		return "", "", false
	}

	return userID, sessionID, true
}
