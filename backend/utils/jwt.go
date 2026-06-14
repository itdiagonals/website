package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"strings"
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
	UserID    string `json:"user_id"`
	SessionID string `json:"session_id"`
	TokenType string `json:"token_type"`
	Name      string `json:"name,omitempty"`
	Email     string `json:"email,omitempty"`
	Role      string `json:"role,omitempty"`
	jwt.RegisteredClaims
}

func GenerateToken(userID string, sessionID string, name, email, role string) (string, error) {
	token, _, _, err := generateSignedToken(userID, sessionID, accessTokenType, name, email, role)
	if err != nil {
		return "", err
	}

	return token, nil
}

func GenerateRefreshToken(userID string, sessionID string) (string, string, time.Time, error) {
	return generateSignedToken(userID, sessionID, refreshTokenType, "", "", "")
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

func generateSignedToken(userID string, sessionID string, tokenType string, name, email, role string) (string, string, time.Time, error) {
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
		UserID:    userID,
		SessionID: sessionID,
		TokenType: tokenType,
		Name:      name,
		Email:     email,
		Role:      role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   userID,
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

	secret := strings.TrimSpace(os.Getenv(envKey))
	if err := validateSecretStrength(envKey, secret); err != nil {
		return "", err
	}

	return secret, nil
}

// minSecretLength is the minimum accepted length for token signing secrets.
// 32 bytes is the floor for HS256 keys per common guidance.
const minSecretLength = 32

// knownWeakSecrets lists placeholder values that must never be accepted in
// non-debug environments. The list is intentionally short and must be
// extended whenever a new placeholder is added to .env.example.
var knownWeakSecrets = map[string]struct{}{
	"supersecret":     {},
	"supersecretkey":  {},
	"changeme":        {},
	"change-me":       {},
	"replace-me":      {},
	"your-secret-key": {},
}

func validateSecretStrength(envKey, secret string) error {
	if secret == "" {
		return fmt.Errorf("%s is not set", envKey)
	}

	if len(secret) < minSecretLength {
		return fmt.Errorf("%s must be at least %d characters of high-entropy random data", envKey, minSecretLength)
	}

	if _, weak := knownWeakSecrets[strings.ToLower(secret)]; weak {
		return fmt.Errorf("%s is set to a known placeholder value; replace it with a high-entropy random secret", envKey)
	}

	lower := strings.ToLower(secret)
	if strings.HasPrefix(lower, "change_me") || strings.Contains(lower, "generate_a_32_byte") {
		return fmt.Errorf("%s is still a .env.example placeholder; replace it with a high-entropy random secret (e.g. `openssl rand -hex 32`)", envKey)
	}

	return nil
}

// ValidateSecretStrength enforces the same minimum-entropy and placeholder
// rejection rules used for token secrets, so other secrets (e.g. CSRF_AUTH_KEY)
// can share one source of truth.
func ValidateSecretStrength(envKey, secret string) error {
	return validateSecretStrength(envKey, secret)
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
