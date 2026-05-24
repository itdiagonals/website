package middleware

import (
	"net/http"
	"net/url"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

var defaultAllowedMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
var defaultAllowedHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization", "X-CSRF-Token", "X-XSRF-Token", "X-Device-Name"}
var defaultExposedHeaders = []string{"X-CSRF-Token"}

func CORS() gin.HandlerFunc {
	allowedOrigins := allowedCORSOrigins()
	allowedOriginSet := make(map[string]struct{}, len(allowedOrigins))
	for _, origin := range allowedOrigins {
		allowedOriginSet[origin] = struct{}{}
	}

	allowedMethods := strings.Join(defaultAllowedMethods, ", ")
	allowedHeaders := strings.Join(defaultAllowedHeaders, ", ")
	exposedHeaders := strings.Join(defaultExposedHeaders, ", ")

	return func(context *gin.Context) {
		origin := normalizeCORSOrigin(context.GetHeader("Origin"))
		if origin != "" {
			context.Header("Vary", "Origin, Access-Control-Request-Method, Access-Control-Request-Headers")

			if _, allowed := allowedOriginSet[origin]; allowed {
				context.Header("Access-Control-Allow-Origin", origin)
				context.Header("Access-Control-Allow-Credentials", "true")
				context.Header("Access-Control-Allow-Methods", allowedMethods)
				context.Header("Access-Control-Allow-Headers", allowedHeaders)
				context.Header("Access-Control-Expose-Headers", exposedHeaders)
				context.Header("Access-Control-Max-Age", "600")
			}
		}

		if context.Request.Method == http.MethodOptions {
			context.AbortWithStatus(http.StatusNoContent)
			return
		}

		context.Next()
	}
}

func allowedCORSOrigins() []string {
	configured := strings.TrimSpace(os.Getenv("BACKEND_CORS_ALLOWED_ORIGINS"))
	if configured == "" {
		configured = strings.TrimSpace(os.Getenv("BACKEND_CSRF_TRUSTED_ORIGINS"))
	}

	if configured == "" {
		return nil
	}

	origins := make([]string, 0)
	for _, origin := range strings.Split(configured, ",") {
		normalized := normalizeCORSOrigin(origin)
		if normalized != "" {
			origins = append(origins, normalized)
		}
	}

	return origins
}

func normalizeCORSOrigin(raw string) string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return ""
	}

	parsed, err := url.Parse(trimmed)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return ""
	}

	return strings.ToLower(parsed.Scheme + "://" + parsed.Host)
}
