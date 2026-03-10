package repository

import (
	"context"
	"time"

	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type AuthSessionRepository interface {
	Create(context context.Context, session *domain.AuthSession) error
	FindByID(context context.Context, sessionID string) (*domain.AuthSession, error)
	UpdateRefreshToken(context context.Context, sessionID string, refreshTokenHash string, expiresAt time.Time, lastSeenAt time.Time) error
	RevokeSession(context context.Context, customerID uint, sessionID string, revokedAt time.Time) error
	RevokeAllSessions(context context.Context, customerID uint, revokedAt time.Time) error
	ListActiveByCustomerID(context context.Context, customerID uint) ([]domain.AuthSession, error)
}

type authSessionRepository struct {
	db *gorm.DB
}

func NewAuthSessionRepository(db *gorm.DB) AuthSessionRepository {
	return &authSessionRepository{db: db}
}

func (repository *authSessionRepository) Create(context context.Context, session *domain.AuthSession) error {
	return repository.db.WithContext(context).Create(session).Error
}

func (repository *authSessionRepository) FindByID(context context.Context, sessionID string) (*domain.AuthSession, error) {
	var session domain.AuthSession

	err := repository.db.WithContext(context).Where("id = ?", sessionID).First(&session).Error
	if err != nil {
		return nil, err
	}

	return &session, nil
}

func (repository *authSessionRepository) UpdateRefreshToken(context context.Context, sessionID string, refreshTokenHash string, expiresAt time.Time, lastSeenAt time.Time) error {
	return repository.db.WithContext(context).
		Model(&domain.AuthSession{}).
		Where("id = ?", sessionID).
		Updates(map[string]any{
			"refresh_token_hash": refreshTokenHash,
			"expires_at":         expiresAt,
			"last_seen_at":       lastSeenAt,
			"updated_at":         lastSeenAt,
		}).Error
}

func (repository *authSessionRepository) RevokeSession(context context.Context, customerID uint, sessionID string, revokedAt time.Time) error {
	return repository.db.WithContext(context).
		Model(&domain.AuthSession{}).
		Where("id = ? AND customer_id = ? AND revoked_at IS NULL", sessionID, customerID).
		Updates(map[string]any{
			"revoked_at": revokedAt,
			"updated_at": revokedAt,
		}).Error
}

func (repository *authSessionRepository) RevokeAllSessions(context context.Context, customerID uint, revokedAt time.Time) error {
	return repository.db.WithContext(context).
		Model(&domain.AuthSession{}).
		Where("customer_id = ? AND revoked_at IS NULL", customerID).
		Updates(map[string]any{
			"revoked_at": revokedAt,
			"updated_at": revokedAt,
		}).Error
}

func (repository *authSessionRepository) ListActiveByCustomerID(context context.Context, customerID uint) ([]domain.AuthSession, error) {
	var sessions []domain.AuthSession

	err := repository.db.WithContext(context).
		Where("customer_id = ? AND revoked_at IS NULL AND expires_at > ?", customerID, time.Now()).
		Order("last_seen_at DESC, created_at DESC").
		Find(&sessions).Error
	if err != nil {
		return nil, err
	}

	return sessions, nil
}
