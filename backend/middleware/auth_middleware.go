package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/utils"
)

func RequireAuth(authSessionRepository repository.AuthSessionRepository) gin.HandlerFunc {
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
		if err != nil || session.CustomerID != claims.CustomerID || session.RevokedAt != nil || !session.ExpiresAt.After(time.Now()) {
			context.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"message": "unauthorized"})
			return
		}

		context.Set("customer_id", claims.CustomerID)
		context.Set("session_id", claims.SessionID)
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
