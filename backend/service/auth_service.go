package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
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
	LogoutCurrentSession(context context.Context, userID string, sessionID string) error
	LogoutAllSessions(context context.Context, userID string) error
	ListSessions(context context.Context, userID string, currentSessionID string) ([]domain.AuthSessionSummary, error)
}

type authService struct {
	userRepository        repository.UserRepository
	authSessionRepository repository.AuthSessionRepository
}

func NewAuthService(userRepository repository.UserRepository, authSessionRepository repository.AuthSessionRepository) AuthService {
	return &authService{
		userRepository:        userRepository,
		authSessionRepository: authSessionRepository,
	}
}

func (service *authService) Register(context context.Context, input RegisterInput, metadata SessionMetadata) (*AuthTokens, error) {
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))
	if len(input.Password) < 8 {
		return nil, ErrWeakPassword
	}

	exists, err := service.userRepository.ExistsByEmail(context, input.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrEmailAlreadyRegistered
	}

	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	user := &domain.User{
		ID:       uuid.New().String(),
		Name:     strings.TrimSpace(input.Name),
		Email:    input.Email,
		Password: hashedPassword,
		Role:     "customer",
	}

	if err := service.userRepository.Create(context, user); err != nil {
		return nil, err
	}

	tokens, err := service.createSessionAndIssueTokens(context, user, metadata)
	if err != nil {
		return nil, err
	}

	return tokens, nil
}

func (service *authService) Login(context context.Context, input LoginInput, metadata SessionMetadata) (*AuthTokens, error) {
	input.Email = strings.TrimSpace(strings.ToLower(input.Email))

	user, err := service.userRepository.FindByEmail(context, input.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}

		return nil, err
	}

	if !utils.CheckPasswordHash(input.Password, user.Password) {
		return nil, ErrInvalidCredentials
	}

	tokens, err := service.createSessionAndIssueTokens(context, user, metadata)
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

	if session.UserID != claims.UserID || session.RevokedAt != nil || !session.ExpiresAt.After(time.Now()) {
		return nil, ErrInvalidRefreshToken
	}

	if !utils.VerifyTokenHash(refreshToken, session.RefreshTokenHash) {
		return nil, ErrInvalidRefreshToken
	}

	user, err := service.userRepository.FindByID(context, claims.UserID)
	if err != nil {
		return nil, ErrInvalidRefreshToken
	}

	tokens, refreshTokenHash, err := service.issueTokens(user, session.ID)
	if err != nil {
		return nil, err
	}

	if err := service.authSessionRepository.UpdateRefreshToken(context, session.ID, refreshTokenHash, tokens.RefreshExpiresAt, time.Now()); err != nil {
		return nil, err
	}

	return &tokens, nil
}

func (service *authService) LogoutCurrentSession(context context.Context, userID string, sessionID string) error {
	if strings.TrimSpace(sessionID) == "" {
		return ErrInvalidRefreshToken
	}

	return service.authSessionRepository.RevokeSession(context, userID, sessionID, time.Now())
}

func (service *authService) LogoutAllSessions(context context.Context, userID string) error {
	return service.authSessionRepository.RevokeAllSessions(context, userID, time.Now())
}

func (service *authService) ListSessions(context context.Context, userID string, currentSessionID string) ([]domain.AuthSessionSummary, error) {
	sessions, err := service.authSessionRepository.ListActiveByUserID(context, userID)
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

func (service *authService) createSessionAndIssueTokens(context context.Context, user *domain.User, metadata SessionMetadata) (*AuthTokens, error) {
	sessionID, err := utils.GenerateSessionID()
	if err != nil {
		return nil, err
	}

	tokens, refreshTokenHash, err := service.issueTokens(user, sessionID)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	session := &domain.AuthSession{
		ID:               sessionID,
		UserID:           user.ID,
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

func (service *authService) issueTokens(user *domain.User, sessionID string) (AuthTokens, string, error) {
	accessToken, err := utils.GenerateToken(user.ID, sessionID, user.Name, user.Email, user.Role)
	if err != nil {
		return AuthTokens{}, "", err
	}

	refreshToken, _, refreshExpiresAt, err := utils.GenerateRefreshToken(user.ID, sessionID)
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
