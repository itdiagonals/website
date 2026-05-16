package middleware

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/base64"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	csrfCookieNameDefault = "csrf_token"
	csrfHeaderName        = "X-CSRF-Token"
	csrfAltHeaderName     = "X-XSRF-Token"
	csrfCookieMaxAge      = 60 * 60 * 12
)

var csrfExemptPaths = map[string]struct{}{
	"/api/v1/auth/csrf":                      {},
	"/api/v1/payments/midtrans/notification": {},
	"/api/v1/payments/biteship/notification": {},
}

func RequireCSRF() gin.HandlerFunc {
	trustedOrigins := trustedCSRFOrigins()

	return func(context *gin.Context) {
		if isSafeMethod(context.Request.Method) || hasBearerAuthorization(context.GetHeader("Authorization")) {
			context.Next()
			return
		}

		if _, exempt := csrfExemptPaths[context.Request.URL.Path]; exempt {
			context.Next()
			return
		}

		if !isOriginAllowed(context, trustedOrigins) {
			context.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "invalid request origin"})
			return
		}

		cookieToken, err := context.Cookie(csrfCookieNameDefault)
		if err != nil || strings.TrimSpace(cookieToken) == "" {
			context.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "missing csrf token"})
			return
		}

		headerToken := strings.TrimSpace(context.GetHeader(csrfHeaderName))
		if headerToken == "" {
			headerToken = strings.TrimSpace(context.GetHeader(csrfAltHeaderName))
		}
		if headerToken == "" {
			context.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "invalid csrf token"})
			return
		}

		if subtle.ConstantTimeCompare([]byte(headerToken), []byte(cookieToken)) != 1 {
			context.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "invalid csrf token"})
			return
		}

		context.Next()
	}
}

func IssueCSRFToken(context *gin.Context) (string, error) {
	token, err := generateCSRFToken()
	if err != nil {
		return "", err
	}

	context.SetSameSite(CookieSameSite())
	context.SetCookie(
		csrfCookieNameDefault,
		token,
		cookieMaxAgeFromEnv(),
		"/",
		strings.TrimSpace(os.Getenv("COOKIE_DOMAIN")),
		CookieSecure(),
		true,
	)

	return token, nil
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

func generateCSRFToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}

	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func CookieSecure() bool {
	value, err := strconv.ParseBool(os.Getenv("COOKIE_SECURE"))
	if err != nil {
		return false
	}

	return value
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

func trustedCSRFOrigins() map[string]struct{} {
	origins := map[string]struct{}{}
	configured := strings.TrimSpace(os.Getenv("BACKEND_CSRF_TRUSTED_ORIGINS"))
	if configured == "" {
		return origins
	}

	for _, origin := range strings.Split(configured, ",") {
		normalized := normalizeOrigin(origin)
		if normalized == "" {
			continue
		}
		origins[normalized] = struct{}{}
	}

	return origins
}

func isOriginAllowed(context *gin.Context, trustedOrigins map[string]struct{}) bool {
	originHeader := strings.TrimSpace(context.GetHeader("Origin"))
	if originHeader == "" {
		return true
	}

	origin := normalizeOrigin(originHeader)
	if origin == "" {
		return false
	}

	if origin == requestOrigin(context) {
		return true
	}

	_, trusted := trustedOrigins[origin]
	return trusted
}

func requestOrigin(context *gin.Context) string {
	host := strings.TrimSpace(context.Request.Host)
	if host == "" {
		return ""
	}

	scheme := "http"
	if context.Request.TLS != nil {
		scheme = "https"
	}
	if forwardedProto := strings.TrimSpace(context.GetHeader("X-Forwarded-Proto")); forwardedProto != "" {
		scheme = strings.ToLower(forwardedProto)
	}

	return normalizeOrigin(scheme + "://" + host)
}

func normalizeOrigin(raw string) string {
	parsed, err := url.Parse(strings.TrimSpace(raw))
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return ""
	}

	return strings.ToLower(parsed.Scheme) + "://" + strings.ToLower(parsed.Host)
}

func hasBearerAuthorization(header string) bool {
	parts := strings.SplitN(strings.TrimSpace(header), " ", 2)
	return len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") && strings.TrimSpace(parts[1]) != ""
}

func isSafeMethod(method string) bool {
	switch strings.ToUpper(strings.TrimSpace(method)) {
	case http.MethodGet, http.MethodHead, http.MethodOptions, http.MethodTrace:
		return true
	default:
		return false
	}
}
