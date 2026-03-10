package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/itdiagonals/website/backend/utils"
	"gorm.io/gorm"
)

var (
	ErrEmailAlreadyRegistered = errors.New("email already registered")
	ErrInvalidCredentials     = errors.New("invalid email or password")
	ErrInvalidRefreshToken    = errors.New("invalid refresh token")
	ErrWeakPassword           = errors.New("password must be at least 8 characters")
)

type RegisterInput struct {
	Name     string
	Email    string
	Password string
}

type LoginInput struct {
	Email    string
	Password string
}

type SessionMetadata struct {
	UserAgent  string
	IPAddress  string
	DeviceName string
}

type AuthTokens struct {
	AccessToken      string    `json:"access_token"`
	AccessExpiresAt  time.Time `json:"access_expires_at"`
	RefreshToken     string    `json:"refresh_token"`
	RefreshExpiresAt time.Time `json:"refresh_expires_at"`
}

type AuthService interface {
	Register(context context.Context, input RegisterInput, metadata SessionMetadata) (*AuthTokens, error)
	Login(context context.Context, input LoginInput, metadata SessionMetadata) (*AuthTokens, error)
	Refresh(context context.Context, refreshToken string) (*AuthTokens, error)
	LogoutCurrentSession(context context.Context, customerID uint, sessionID string) error
	LogoutAllSessions(context context.Context, customerID uint) error
	ListSessions(context context.Context, customerID uint, currentSessionID string) ([]domain.AuthSessionSummary, error)
}

type authService struct {
	customerRepository    repository.CustomerRepository
	authSessionRepository repository.AuthSessionRepository
}

func NewAuthService(customerRepository repository.CustomerRepository, authSessionRepository repository.AuthSessionRepository) AuthService {
	return &authService{
		customerRepository:    customerRepository,
		authSessionRepository: authSessionRepository,
	}
}

func (service *authService) Register(context context.Context, input RegisterInput, metadata SessionMetadata) (*AuthTokens, error) {
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	if len(input.Password) < 8 {
		return nil, ErrWeakPassword
	}

	_, err := service.customerRepository.FindByEmail(context, input.Email)
	if err == nil {
		return nil, ErrEmailAlreadyRegistered
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, err
	}

	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	customer := &domain.Customer{
		Name:         strings.TrimSpace(input.Name),
		Email:        input.Email,
		PasswordHash: hashedPassword,
	}

	if err := service.customerRepository.Create(context, customer); err != nil {
		return nil, err
	}

	tokens, err := service.createSessionAndIssueTokens(context, customer.ID, metadata)
	if err != nil {
		return nil, err
	}

	return tokens, nil
}

func (service *authService) Login(context context.Context, input LoginInput, metadata SessionMetadata) (*AuthTokens, error) {
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))

	customer, err := service.customerRepository.FindByEmail(context, input.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}

		return nil, err
	}

	if !utils.CheckPasswordHash(input.Password, customer.PasswordHash) {
		return nil, ErrInvalidCredentials
	}

	tokens, err := service.createSessionAndIssueTokens(context, customer.ID, metadata)
	if err != nil {
		return nil, err
	}

	return tokens, nil
}

func (service *authService) Refresh(context context.Context, refreshToken string) (*AuthTokens, error) {
	claims, err := utils.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, ErrInvalidRefreshToken
	}

	session, err := service.authSessionRepository.FindByID(context, claims.SessionID)
	if err != nil {
		return nil, ErrInvalidRefreshToken
	}

	if session.CustomerID != claims.CustomerID || session.RevokedAt != nil || !session.ExpiresAt.After(time.Now()) {
		return nil, ErrInvalidRefreshToken
	}

	if !utils.VerifyTokenHash(refreshToken, session.RefreshTokenHash) {
		return nil, ErrInvalidRefreshToken
	}

	tokens, refreshTokenHash, err := service.issueTokens(claims.CustomerID, session.ID)
	if err != nil {
		return nil, err
	}

	if err := service.authSessionRepository.UpdateRefreshToken(context, session.ID, refreshTokenHash, tokens.RefreshExpiresAt, time.Now()); err != nil {
		return nil, err
	}

	return &tokens, nil
}

func (service *authService) LogoutCurrentSession(context context.Context, customerID uint, sessionID string) error {
	if strings.TrimSpace(sessionID) == "" {
		return ErrInvalidRefreshToken
	}

	return service.authSessionRepository.RevokeSession(context, customerID, sessionID, time.Now())
}

func (service *authService) LogoutAllSessions(context context.Context, customerID uint) error {
	return service.authSessionRepository.RevokeAllSessions(context, customerID, time.Now())
}

func (service *authService) ListSessions(context context.Context, customerID uint, currentSessionID string) ([]domain.AuthSessionSummary, error) {
	sessions, err := service.authSessionRepository.ListActiveByCustomerID(context, customerID)
	if err != nil {
		return nil, err
	}

	summaries := make([]domain.AuthSessionSummary, 0, len(sessions))
	for _, session := range sessions {
		summaries = append(summaries, domain.AuthSessionSummary{
			ID:         session.ID,
			DeviceName: session.DeviceName,
			UserAgent:  session.UserAgent,
			IPAddress:  session.IPAddress,
			LastSeenAt: session.LastSeenAt,
			ExpiresAt:  session.ExpiresAt,
			CreatedAt:  session.CreatedAt,
			Current:    session.ID == currentSessionID,
		})
	}

	return summaries, nil
}

func (service *authService) createSessionAndIssueTokens(context context.Context, customerID uint, metadata SessionMetadata) (*AuthTokens, error) {
	sessionID, err := utils.GenerateSessionID()
	if err != nil {
		return nil, err
	}

	tokens, refreshTokenHash, err := service.issueTokens(customerID, sessionID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	session := &domain.AuthSession{
		ID:               sessionID,
		CustomerID:       customerID,
		RefreshTokenHash: refreshTokenHash,
		UserAgent:        strings.TrimSpace(metadata.UserAgent),
		IPAddress:        strings.TrimSpace(metadata.IPAddress),
		DeviceName:       strings.TrimSpace(metadata.DeviceName),
		LastSeenAt:       now,
		ExpiresAt:        tokens.RefreshExpiresAt,
	}

	if err := service.authSessionRepository.Create(context, session); err != nil {
		return nil, err
	}

	return &tokens, nil
}

func (service *authService) issueTokens(customerID uint, sessionID string) (AuthTokens, string, error) {
	accessToken, err := utils.GenerateToken(customerID, sessionID)
	if err != nil {
		return AuthTokens{}, "", err
	}

	refreshToken, _, refreshExpiresAt, err := utils.GenerateRefreshToken(customerID, sessionID)
	if err != nil {
		return AuthTokens{}, "", err
	}

	return AuthTokens{
		AccessToken:      accessToken,
		AccessExpiresAt:  utils.AccessTokenExpiry(),
		RefreshToken:     refreshToken,
		RefreshExpiresAt: refreshExpiresAt,
	}, utils.HashToken(refreshToken), nil
}
