package middleware

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/service"
)

func TestRequireRateLimitByIP_AllowsRequest(t *testing.T) {
	gateway := newAuthRateLimitTestRouter(stubAuthRateLimiter{allowed: true})
	request := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	request.RemoteAddr = "198.51.100.5:1234"
	recorder := httptest.NewRecorder()

	gateway.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}
}

func TestRequireRateLimitByIP_BlocksLimitedRequest(t *testing.T) {
	gateway := newAuthRateLimitTestRouter(stubAuthRateLimiter{allowed: false})
	request := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	request.RemoteAddr = "198.51.100.5:1234"
	recorder := httptest.NewRecorder()

	gateway.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("expected status %d, got %d", http.StatusTooManyRequests, recorder.Code)
	}
}

func TestRequireRateLimitByIP_ReturnsServiceUnavailableOnLimiterError(t *testing.T) {
	gateway := newAuthRateLimitTestRouter(stubAuthRateLimiter{err: errors.New("redis down")})
	request := httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	request.RemoteAddr = "198.51.100.5:1234"
	recorder := httptest.NewRecorder()

	gateway.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status %d, got %d", http.StatusServiceUnavailable, recorder.Code)
	}
}

func newAuthRateLimitTestRouter(limiter service.AuthRateLimiter) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/v1/auth/login", RequireRateLimitByIP(limiter, service.AuthRateLimitConfig{
		Scope:    "auth-login-ip",
		Window:   15 * time.Minute,
		Max:      30,
		Cooldown: 15 * time.Minute,
	}), func(context *gin.Context) {
		context.Status(http.StatusOK)
	})
	return router
}

type stubAuthRateLimiter struct {
	allowed bool
	err     error
}

func (stub stubAuthRateLimiter) Allow(context.Context, service.AuthRateLimitConfig, ...string) (bool, error) {
	return stub.allowed, stub.err
}

func (stub stubAuthRateLimiter) AllowByIP(context.Context, string, service.AuthRateLimitConfig) (bool, error) {
	return stub.allowed, stub.err
}

func (stub stubAuthRateLimiter) AllowByIPAndIdentifier(context.Context, string, string, service.AuthRateLimitConfig) (bool, error) {
	return stub.allowed, stub.err
}
