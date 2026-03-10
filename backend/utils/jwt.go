package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/itdiagonals/website/backend/config"
)

const (
	accessTokenType  = "access"
	refreshTokenType = "refresh"

	defaultAccessTTL  = 15 * time.Minute
	defaultRefreshTTL = 7 * 24 * time.Hour
)

type TokenClaims struct {
	CustomerID uint   `json:"customer_id"`
	SessionID  string `json:"session_id"`
	TokenType  string `json:"token_type"`
	jwt.RegisteredClaims
}

func GenerateToken(customerID uint, sessionID string) (string, error) {
	token, _, _, err := generateSignedToken(customerID, sessionID, accessTokenType)
	if err != nil {
		return "", err
	}

	return token, nil
}

func GenerateRefreshToken(customerID uint, sessionID string) (string, string, time.Time, error) {
	return generateSignedToken(customerID, sessionID, refreshTokenType)
}

func ValidateToken(tokenString string) (*TokenClaims, error) {
	return validateToken(tokenString, accessTokenType)
}

func ValidateRefreshToken(tokenString string) (*TokenClaims, error) {
	return validateToken(tokenString, refreshTokenType)
}

func AccessTokenExpiry() time.Time {
	return time.Now().Add(getTokenTTL("ACCESS_TOKEN_TTL", defaultAccessTTL))
}

func GenerateSessionID() (string, error) {
	return generateOpaqueID()
}

func HashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

func VerifyTokenHash(token string, hashedToken string) bool {
	computedHash := HashToken(token)
	return subtle.ConstantTimeCompare([]byte(computedHash), []byte(hashedToken)) == 1
}

func generateSignedToken(customerID uint, sessionID string, tokenType string) (string, string, time.Time, error) {
	secret, err := getSecretForTokenType(tokenType)
	if err != nil {
		return "", "", time.Time{}, err
	}

	expiresAt := time.Now().Add(getTTLForTokenType(tokenType))
	tokenID, err := generateOpaqueID()
	if err != nil {
		return "", "", time.Time{}, err
	}

	claims := TokenClaims{
		CustomerID: customerID,
		SessionID:  sessionID,
		TokenType:  tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   fmt.Sprintf("%d", customerID),
			ID:        tokenID,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(secret))
	if err != nil {
		return "", "", time.Time{}, err
	}

	return signedToken, tokenID, expiresAt, nil
}

func validateToken(tokenString string, expectedType string) (*TokenClaims, error) {
	secret, err := getSecretForTokenType(expectedType)
	if err != nil {
		return nil, err
	}

	parsedToken, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}

		return []byte(secret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := parsedToken.Claims.(*TokenClaims)
	if !ok || !parsedToken.Valid {
		return nil, errors.New("invalid token")
	}

	if claims.TokenType != expectedType {
		return nil, errors.New("invalid token type")
	}

	return claims, nil
}

func getSecretForTokenType(tokenType string) (string, error) {
	config.LoadEnv()

	var envKey string
	if tokenType == refreshTokenType {
		envKey = "REFRESH_TOKEN_SECRET"
	} else {
		envKey = "ACCESS_TOKEN_SECRET"
	}

	secret := os.Getenv(envKey)
	if secret == "" {
		secret = os.Getenv("PAYLOAD_SECRET")
	}

	if secret == "" {
		return "", fmt.Errorf("%s is not set", envKey)
	}

	return secret, nil
}

func getTTLForTokenType(tokenType string) time.Duration {
	if tokenType == refreshTokenType {
		return getTokenTTL("REFRESH_TOKEN_TTL", defaultRefreshTTL)
	}

	return getTokenTTL("ACCESS_TOKEN_TTL", defaultAccessTTL)
}

func getTokenTTL(envKey string, fallback time.Duration) time.Duration {
	config.LoadEnv()

	value := os.Getenv(envKey)
	if value == "" {
		return fallback
	}

	duration, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}

	return duration
}

func generateOpaqueID() (string, error) {
	buffer := make([]byte, 16)
	if _, err := rand.Read(buffer); err != nil {
		return "", err
	}

	return hex.EncodeToString(buffer), nil
}
