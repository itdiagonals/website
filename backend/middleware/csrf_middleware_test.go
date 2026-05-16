package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestCSRF_BlocksMissingToken(t *testing.T) {
	handler := newCSRFTestHandler(t)

	request := httptest.NewRequest(http.MethodPost, "/api/v1/test", nil)
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusForbidden {
		t.Fatalf("expected status %d, got %d", http.StatusForbidden, recorder.Code)
	}
}

func TestCSRF_AllowsValidToken(t *testing.T) {
	handler := newCSRFTestHandler(t)

	getRequest := httptest.NewRequest(http.MethodGet, "/api/v1/test", nil)
	getRecorder := httptest.NewRecorder()
	handler.ServeHTTP(getRecorder, getRequest)

	token := strings.TrimSpace(getRecorder.Header().Get(csrfHeaderName))
	if token == "" {
		t.Fatal("expected csrf token header to be set")
	}

	cookies := getRecorder.Result().Cookies()
	if len(cookies) == 0 {
		t.Fatal("expected csrf cookie to be set")
	}

	postRequest := httptest.NewRequest(http.MethodPost, "/api/v1/test", nil)
	for _, cookie := range cookies {
		postRequest.AddCookie(cookie)
	}
	postRequest.Header.Set(csrfHeaderName, token)

	postRecorder := httptest.NewRecorder()
	handler.ServeHTTP(postRecorder, postRequest)

	if postRecorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, postRecorder.Code)
	}
}

func TestCSRF_AcceptsAlternateHeader(t *testing.T) {
	handler := newCSRFTestHandler(t)

	getRequest := httptest.NewRequest(http.MethodGet, "/api/v1/test", nil)
	getRecorder := httptest.NewRecorder()
	handler.ServeHTTP(getRecorder, getRequest)

	token := strings.TrimSpace(getRecorder.Header().Get(csrfHeaderName))
	if token == "" {
		t.Fatal("expected csrf token header to be set")
	}

	postRequest := httptest.NewRequest(http.MethodPost, "/api/v1/test", nil)
	for _, cookie := range getRecorder.Result().Cookies() {
		postRequest.AddCookie(cookie)
	}
	postRequest.Header.Set(csrfAltHeaderName, token)

	postRecorder := httptest.NewRecorder()
	handler.ServeHTTP(postRecorder, postRequest)

	if postRecorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, postRecorder.Code)
	}
}

func TestCSRF_SkipsBearerRequests(t *testing.T) {
	handler := newCSRFTestHandler(t)

	request := httptest.NewRequest(http.MethodPost, "/api/v1/test", nil)
	request.Header.Set("Authorization", "Bearer some-token")
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}
}

func TestCSRF_SkipsExemptWebhookPaths(t *testing.T) {
	handler := newCSRFTestHandler(t)

	request := httptest.NewRequest(http.MethodPost, "/api/v1/payments/midtrans/notification", nil)
	recorder := httptest.NewRecorder()

	handler.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusOK {
		t.Fatalf("expected status %d, got %d", http.StatusOK, recorder.Code)
	}
}

func newCSRFTestHandler(t *testing.T) http.Handler {
	t.Helper()
	t.Setenv("COOKIE_SECURE", "false")
	t.Setenv("CSRF_AUTH_KEY", "csrf-test-secret")
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(WriteCSRFToken())
	router.GET("/api/v1/test", func(context *gin.Context) {
		context.Status(http.StatusOK)
	})
	router.POST("/api/v1/test", func(context *gin.Context) {
		context.Status(http.StatusOK)
	})
	router.POST("/api/v1/payments/midtrans/notification", func(context *gin.Context) {
		context.Status(http.StatusOK)
	})

	handler, err := NewCSRFHandler(router)
	if err != nil {
		t.Fatalf("failed to create csrf handler: %v", err)
	}

	return handler
}
