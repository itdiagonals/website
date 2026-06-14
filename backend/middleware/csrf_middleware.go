package middleware

import (
	"crypto/sha256"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/csrf"
	"github.com/itdiagonals/website/backend/utils"
)

const (
	csrfCookieNameDefault = "csrf_token"
	csrfHeaderName        = "X-CSRF-Token"
	csrfAltHeaderName     = "X-XSRF-Token"
	csrfCookieMaxAge      = 60 * 60 * 12
)

var csrfExemptPaths = map[string]struct{}{
	"/api/v1/payments/midtrans/notification": {},
	"/api/v1/payments/biteship/notification": {},
}

func NewCSRFHandler(next http.Handler) (http.Handler, error) {
	authKey, err := csrfAuthKey()
	if err != nil {
		return nil, err
	}

	options := []csrf.Option{
		csrf.CookieName(csrfCookieNameDefault),
		csrf.RequestHeader(csrfHeaderName),
		csrf.Path("/"),
		csrf.MaxAge(cookieMaxAgeFromEnv()),
		csrf.Secure(CookieSecure()),
		csrf.HttpOnly(true),
		csrf.SameSite(csrfSameSiteMode()),
		csrf.ErrorHandler(http.HandlerFunc(handleCSRFFailure)),
	}

	if cookieDomain := strings.TrimSpace(os.Getenv("COOKIE_DOMAIN")); cookieDomain != "" {
		options = append(options, csrf.Domain(cookieDomain))
	}

	if trustedOrigins := trustedCSRFOrigins(); len(trustedOrigins) > 0 {
		options = append(options, csrf.TrustedOrigins(trustedOrigins))
	}

	protected := csrf.Protect(authKey, options...)(next)

	return http.HandlerFunc(func(writer http.ResponseWriter, request *http.Request) {
		request = prepareCSRFRequest(request)
		protected.ServeHTTP(writer, request)
	}), nil
}

func WriteCSRFToken() gin.HandlerFunc {
	return func(context *gin.Context) {
		token := strings.TrimSpace(csrf.Token(context.Request))
		if token != "" {
			context.Header(csrfHeaderName, token)
		}

		context.Next()
	}
}

func CSRFToken(context *gin.Context) string {
	return strings.TrimSpace(csrf.Token(context.Request))
}

func ClearCSRFCookie(context *gin.Context) {
	context.SetSameSite(CookieSameSite())
	context.SetCookie(
		csrfCookieNameDefault,
		"",
		-1,
		"/",
		strings.TrimSpace(os.Getenv("COOKIE_DOMAIN")),
		CookieSecure(),
		true,
	)
}

func CookieSecure() bool {
	value := strings.TrimSpace(os.Getenv("COOKIE_SECURE"))
	if value == "" {
		return true
	}

	parsed, err := strconv.ParseBool(value)
	if err != nil {
		return true
	}

	return parsed
}

func CookieSameSite() http.SameSite {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("COOKIE_SAME_SITE"))) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
}

func cookieMaxAgeFromEnv() int {
	configured := strings.TrimSpace(os.Getenv("CSRF_COOKIE_MAX_AGE_SECONDS"))
	if configured == "" {
		return csrfCookieMaxAge
	}

	value, err := strconv.Atoi(configured)
	if err != nil || value <= 0 {
		return csrfCookieMaxAge
	}

	return value
}

func trustedCSRFOrigins() []string {
	configured := strings.TrimSpace(os.Getenv("BACKEND_CSRF_TRUSTED_ORIGINS"))
	if configured == "" {
		return nil
	}

	origins := make([]string, 0)
	for _, origin := range strings.Split(configured, ",") {
		if normalized := normalizeTrustedOrigin(origin); normalized != "" {
			origins = append(origins, normalized)
		}
	}

	if len(origins) == 0 {
		return nil
	}

	return origins
}

func normalizeTrustedOrigin(raw string) string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return ""
	}

	if !strings.Contains(trimmed, "://") {
		trimmed = "https://" + trimmed
	}

	parsed, err := url.Parse(trimmed)
	if err != nil || parsed.Host == "" {
		return ""
	}

	return strings.ToLower(parsed.Host)
}

func prepareCSRFRequest(request *http.Request) *http.Request {
	if request == nil {
		return request
	}

	if isPlaintextRequest(request) {
		request = csrf.PlaintextHTTPRequest(request)
	}

	if headerToken := strings.TrimSpace(request.Header.Get(csrfHeaderName)); headerToken == "" {
		if altHeaderToken := strings.TrimSpace(request.Header.Get(csrfAltHeaderName)); altHeaderToken != "" {
			request.Header.Set(csrfHeaderName, altHeaderToken)
		}
	}

	if shouldSkipCSRF(request) {
		return csrf.UnsafeSkipCheck(request)
	}

	return request
}

func isPlaintextRequest(request *http.Request) bool {
	if request == nil {
		return false
	}

	if request.TLS != nil {
		return false
	}

	forwardedProto := strings.ToLower(strings.TrimSpace(request.Header.Get("X-Forwarded-Proto")))
	if forwardedProto == "https" {
		return false
	}

	return true
}

func shouldSkipCSRF(request *http.Request) bool {
	if request == nil {
		return false
	}

	if hasBearerAuthorization(request.Header.Get("Authorization")) {
		return true
	}

	_, exempt := csrfExemptPaths[request.URL.Path]
	return exempt
}

func csrfAuthKey() ([]byte, error) {
	key := strings.TrimSpace(os.Getenv("CSRF_AUTH_KEY"))
	if err := utils.ValidateSecretStrength("CSRF_AUTH_KEY", key); err != nil {
		return nil, err
	}

	sum := sha256.Sum256([]byte(key))
	return sum[:], nil
}

func csrfSameSiteMode() csrf.SameSiteMode {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("COOKIE_SAME_SITE"))) {
	case "strict":
		return csrf.SameSiteStrictMode
	case "none":
		return csrf.SameSiteNoneMode
	default:
		return csrf.SameSiteLaxMode
	}
}

func handleCSRFFailure(writer http.ResponseWriter, _ *http.Request) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(http.StatusForbidden)
	_, _ = writer.Write([]byte(`{"message":"invalid csrf token"}`))
}

func hasBearerAuthorization(header string) bool {
	parts := strings.SplitN(strings.TrimSpace(header), " ", 2)
	return len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") && strings.TrimSpace(parts[1]) != ""
}
