package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestRequireCSRF_BlocksMissingToken(t *testing.T) {
	t.Setenv("COOKIE_SECURE", "false")
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(RequireCSRF())
	router.POST("/api/v1/test", func(context *gin.Context) {
		context.Status(http.StatusOK)
	})

	request := httptest.NewRequest(http.MethodPost, "/api/v1/test", nil)
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d", http.StatusForbidden, recorder.Code)
	}
}

func TestRequireCSRF_AllowsValidToken(t *testing.T) {
	t.Setenv("COOKIE_SECURE", "false")
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(RequireCSRF())
	router.POST("/api/v1/test", func(context *gin.Context) {
		context.Status(http.StatusOK)
	})

	request := httptest.NewRequest(http.MethodPost, "/api/v1/test", nil)
	request.AddCookie(&http.Cookie{Name: "csrf_token", Value: "token-value"})
	request.Header.Set("X-CSRF-Token", "token-value")
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}
}

func TestRequireCSRF_SkipsBearerRequests(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(RequireCSRF())
	router.POST("/api/v1/test", func(context *gin.Context) {
		context.Status(http.StatusOK)
	})

	request := httptest.NewRequest(http.MethodPost, "/api/v1/test", nil)
	request.Header.Set("Authorization", "Bearer some-token")
	recorder := httptest.NewRecorder()

	router.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}
}
