package handler

import (
	"errors"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/config"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/service"
)

const (
	accessTokenCookieName  = "access_token"
	refreshTokenCookieName = "refresh_token"
)

type AuthHandler struct {
	authService service.AuthService
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

type StatusResponse struct {
	Status  string `json:"status"`
	Message string `json:"message,omitempty"`
}

type AuthSessionsResponse struct {
	Data []domain.AuthSessionSummary `json:"data"`
}

func NewAuthHandler(authService service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

// Register godoc
// @Summary Register customer account
// @Description Register a new customer in Go-owned tables and issue access and refresh tokens
// @Tags Auth
// @Accept json
// @Produce json
// @Param payload body handler.RegisterRequest true "Registration payload"
// @Success 201 {object} handler.StatusResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 409 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/auth/register [post]
func (handler *AuthHandler) Register(context *gin.Context) {
	var request RegisterRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		return
	}

	response, err := handler.authService.Register(context.Request.Context(), service.RegisterInput{
		Name:     request.Name,
		Email:    request.Email,
		Password: request.Password,
	}, buildSessionMetadata(context))
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

	handler.setAuthCookies(context, *response)
	context.JSON(http.StatusCreated, StatusResponse{Status: "success", Message: "register successful"})
}

// Login godoc
// @Summary Login customer account
// @Description Authenticate a customer and create a new active session for the current device or browser
// @Tags Auth
// @Accept json
// @Produce json
// @Param payload body handler.LoginRequest true "Login payload"
// @Success 200 {object} handler.StatusResponse
// @Failure 400 {object} handler.ErrorResponse
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

		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	handler.setAuthCookies(context, *response)
	context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "login successful"})
}

// Refresh godoc
// @Summary Refresh access token
// @Description Validate the refresh token from HttpOnly cookie against the current session, rotate it, and update auth cookies
// @Tags Auth
// @Produce json
// @Success 200 {object} handler.StatusResponse
// @Failure 401 {object} handler.ErrorResponse
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

	handler.setAuthCookies(context, *response)
	context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "token refreshed"})
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
	customerID, sessionID, ok := getCurrentAuthContext(context)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	if err := handler.authService.LogoutCurrentSession(context.Request.Context(), customerID, sessionID); err != nil {
		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	handler.clearAuthCookies(context)
	context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "logout successful"})
}

// LogoutAll godoc
// @Summary Logout all sessions
// @Description Revoke all active sessions for the authenticated customer and clear auth cookies on the current device
// @Tags Auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} handler.StatusResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/auth/logout-all [post]
func (handler *AuthHandler) LogoutAll(context *gin.Context) {
	customerID, _, ok := getCurrentAuthContext(context)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	if err := handler.authService.LogoutAllSessions(context.Request.Context(), customerID); err != nil {
		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	handler.clearAuthCookies(context)
	context.JSON(http.StatusOK, StatusResponse{Status: "success", Message: "all sessions revoked"})
}

// ListSessions godoc
// @Summary List active sessions
// @Description List all active sessions for the authenticated customer across devices and browsers
// @Tags Auth
// @Security BearerAuth
// @Produce json
// @Success 200 {object} handler.AuthSessionsResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/auth/sessions [get]
func (handler *AuthHandler) ListSessions(context *gin.Context) {
	customerID, sessionID, ok := getCurrentAuthContext(context)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	sessions, err := handler.authService.ListSessions(context.Request.Context(), customerID, sessionID)
	if err != nil {
		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	context.JSON(http.StatusOK, AuthSessionsResponse{Data: sessions})
}

func (handler *AuthHandler) setAuthCookies(context *gin.Context, tokens service.AuthTokens) {
	config.LoadEnv()

	context.SetSameSite(getCookieSameSite())
	context.SetCookie(
		accessTokenCookieName,
		tokens.AccessToken,
		secondsUntil(tokens.AccessExpiresAt),
		"/",
		os.Getenv("COOKIE_DOMAIN"),
		getCookieSecure(),
		true,
	)
	context.SetCookie(
		refreshTokenCookieName,
		tokens.RefreshToken,
		secondsUntil(tokens.RefreshExpiresAt),
		"/",
		os.Getenv("COOKIE_DOMAIN"),
		getCookieSecure(),
		true,
	)
}

func (handler *AuthHandler) clearAuthCookies(context *gin.Context) {
	config.LoadEnv()

	context.SetSameSite(getCookieSameSite())
	context.SetCookie(accessTokenCookieName, "", -1, "/", os.Getenv("COOKIE_DOMAIN"), getCookieSecure(), true)
	context.SetCookie(refreshTokenCookieName, "", -1, "/", os.Getenv("COOKIE_DOMAIN"), getCookieSecure(), true)
}

func getCookieSecure() bool {
	value, err := strconv.ParseBool(os.Getenv("COOKIE_SECURE"))
	if err != nil {
		return false
	}

	return value
}

func getCookieSameSite() http.SameSite {
	switch os.Getenv("COOKIE_SAME_SITE") {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
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

func getCurrentAuthContext(context *gin.Context) (uint, string, bool) {
	customerIDValue, ok := context.Get("customer_id")
	if !ok {
		return 0, "", false
	}

	customerID, ok := customerIDValue.(uint)
	if !ok {
		return 0, "", false
	}

	sessionIDValue, ok := context.Get("session_id")
	if !ok {
		return 0, "", false
	}

	sessionID, ok := sessionIDValue.(string)
	if !ok || strings.TrimSpace(sessionID) == "" {
		return 0, "", false
	}

	return customerID, sessionID, true
}
