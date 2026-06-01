package handler

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

func TestEnforceIdentifierRateLimit_AllowsWhenLimiterMissing(t *testing.T) {
	gatewayContext, _ := gin.CreateTestContext(httptest.NewRecorder())
	handler := &AuthHandler{}

	if !handler.enforceIdentifierRateLimit(gatewayContext, service.AuthRateLimitConfig{}, "user@example.com") {
		t.Fatal("expected request to be allowed when limiter is not configured")
	}
}

func TestEnforceIdentifierRateLimit_BlocksLimitedRequest(t *testing.T) {
	recorder := httptest.NewRecorder()
	gatewayContext, _ := gin.CreateTestContext(recorder)
	gatewayContext.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	gatewayContext.Request.RemoteAddr = "198.51.100.5:1234"
	handler := &AuthHandler{limiter: stubHandlerRateLimiter{allowed: false}}

	allowed := handler.enforceIdentifierRateLimit(gatewayContext, service.AuthRateLimitConfig{
		Scope:    "auth-login-identifier",
		Window:   15 * time.Minute,
		Max:      5,
		Cooldown: 15 * time.Minute,
	}, "user@example.com")

	if allowed {
		t.Fatal("expected request to be blocked")
	}
	if recorder.Code != http.StatusTooManyRequests {
		t.Fatalf("expected status %d, got %d", http.StatusTooManyRequests, recorder.Code)
	}
}

func TestEnforceIdentifierRateLimit_ReturnsServiceUnavailableOnLimiterError(t *testing.T) {
	recorder := httptest.NewRecorder()
	gatewayContext, _ := gin.CreateTestContext(recorder)
	gatewayContext.Request = httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", nil)
	gatewayContext.Request.RemoteAddr = "198.51.100.5:1234"
	handler := &AuthHandler{limiter: stubHandlerRateLimiter{err: errors.New("redis down")}}

	allowed := handler.enforceIdentifierRateLimit(gatewayContext, service.AuthRateLimitConfig{
		Scope:    "auth-login-identifier",
		Window:   15 * time.Minute,
		Max:      5,
		Cooldown: 15 * time.Minute,
	}, "user@example.com")

	if allowed {
		t.Fatal("expected request to be blocked")
	}
	if recorder.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status %d, got %d", http.StatusServiceUnavailable, recorder.Code)
	}
}

type stubHandlerRateLimiter struct {
	allowed bool
	err     error
}

func (stub stubHandlerRateLimiter) Allow(context.Context, service.AuthRateLimitConfig, ...string) (bool, error) {
	return stub.allowed, stub.err
}

func (stub stubHandlerRateLimiter) AllowByIP(context.Context, string, service.AuthRateLimitConfig) (bool, error) {
	return stub.allowed, stub.err
}

func (stub stubHandlerRateLimiter) AllowByIPAndIdentifier(context.Context, string, string, service.AuthRateLimitConfig) (bool, error) {
	return stub.allowed, stub.err
}
