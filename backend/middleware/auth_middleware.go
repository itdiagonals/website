package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/service"
	"github.com/itdiagonals/website/backend/utils"
)

const (
	authRateLimitExceededMessage = "too many requests, please try again later"
	authRateLimitUnavailable     = "service temporarily unavailable"
)

func RequireAuth(authSessionRepository repository.AuthSessionRepository, userRepository repository.UserRepository) gin.HandlerFunc {
	return func(context *gin.Context) {
		token, err := extractAccessToken(context)
		if err != nil {
			context.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}

		claims, err := utils.ValidateToken(token)
		if err != nil {
			context.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}

		session, err := authSessionRepository.FindByID(context.Request.Context(), claims.SessionID)
		if err != nil || session.UserID != claims.UserID || session.RevokedAt != nil || !session.ExpiresAt.After(time.Now()) {
			context.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}

		user, err := userRepository.FindByID(context.Request.Context(), claims.UserID)
		if err != nil {
			context.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}

		context.Set("user_id", claims.UserID)
		context.Set("session_id", claims.SessionID)
		context.Set("role", user.Role)
		context.Set("name", claims.Name)
		context.Set("email", claims.Email)
		context.Next()
	}
}

func RequireRole(allowedRoles ...string) gin.HandlerFunc {
	return func(context *gin.Context) {
		roleValue, exists := context.Get("role")
		if !exists {
			context.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "forbidden"})
			return
		}

		role, ok := roleValue.(string)
		if !ok {
			context.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "forbidden"})
			return
		}

		for _, allowed := range allowedRoles {
			if role == allowed {
				context.Next()
				return
			}
		}

		context.AbortWithStatusJSON(http.StatusForbidden, gin.H{"message": "forbidden"})
	}
}

func RequireRateLimitByIP(limiter service.AuthRateLimiter, config service.AuthRateLimitConfig) gin.HandlerFunc {
	return func(context *gin.Context) {
		allowed, err := limiter.AllowByIP(context.Request.Context(), context.ClientIP(), config)
		if err != nil {
			context.AbortWithStatusJSON(http.StatusServiceUnavailable, gin.H{"message": authRateLimitUnavailable})
			return
		}

		if !allowed {
			context.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{"message": authRateLimitExceededMessage})
			return
		}

		context.Next()
	}
}

func extractAccessToken(context *gin.Context) (string, error) {
	authorizationHeader := context.GetHeader("Authorization")
	if authorizationHeader != "" {
		parts := strings.SplitN(authorizationHeader, " ", 2)
		if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
			token := strings.TrimSpace(parts[1])
			if token != "" {
				return token, nil
			}
		}
	}

	token, err := context.Cookie("access_token")
	if err != nil || strings.TrimSpace(token) == "" {
		return "", err
	}

	return strings.TrimSpace(token), nil
}
