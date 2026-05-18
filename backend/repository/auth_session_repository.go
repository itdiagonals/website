package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/redis/go-redis/v9"
)

type AuthSessionRepository interface {
	Create(ctx context.Context, session *domain.AuthSession) error
	FindByID(ctx context.Context, sessionID string) (*domain.AuthSession, error)
	UpdateRefreshToken(ctx context.Context, sessionID string, refreshTokenHash string, expiresAt time.Time, lastSeenAt time.Time) error
	RevokeSession(ctx context.Context, userID string, sessionID string, revokedAt time.Time) error
	RevokeAllSessions(ctx context.Context, userID string, revokedAt time.Time) error
	ListActiveByUserID(ctx context.Context, userID string) ([]domain.AuthSession, error)
}

type authSessionRepository struct {
	redisClient *redis.Client
}

func NewAuthSessionRepository(redisClient *redis.Client) AuthSessionRepository {
	return &authSessionRepository{redisClient: redisClient}
}

func sessionKey(sessionID string) string {
	return fmt.Sprintf("auth:session:%s", sessionID)
}

func userSessionsKey(userID string) string {
	return fmt.Sprintf("auth:user:%s:sessions", userID)
}

func (r *authSessionRepository) Create(ctx context.Context, session *domain.AuthSession) error {
	data, err := json.Marshal(session)
	if err != nil {
		return err
	}

	ttl := time.Until(session.ExpiresAt)
	if ttl <= 0 {
		return fmt.Errorf("session already expired")
	}

	pipe := r.redisClient.Pipeline()
	pipe.Set(ctx, sessionKey(session.ID), data, ttl)
	pipe.SAdd(ctx, userSessionsKey(session.UserID), session.ID)
	_, err = pipe.Exec(ctx)
	return err
}

func (r *authSessionRepository) FindByID(ctx context.Context, sessionID string) (*domain.AuthSession, error) {
	data, err := r.redisClient.Get(ctx, sessionKey(sessionID)).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("session not found")
		}
		return nil, err
	}

	var session domain.AuthSession
	if err := json.Unmarshal(data, &session); err != nil {
		return nil, err
	}

	return &session, nil
}

func (r *authSessionRepository) UpdateRefreshToken(ctx context.Context, sessionID string, refreshTokenHash string, expiresAt time.Time, lastSeenAt time.Time) error {
	data, err := r.redisClient.Get(ctx, sessionKey(sessionID)).Bytes()
	if err != nil {
		if err == redis.Nil {
			return fmt.Errorf("session not found")
		}
		return err
	}

	var session domain.AuthSession
	if err := json.Unmarshal(data, &session); err != nil {
		return err
	}

	session.RefreshTokenHash = refreshTokenHash
	session.ExpiresAt = expiresAt
	session.LastSeenAt = lastSeenAt
	session.UpdatedAt = lastSeenAt

	updated, err := json.Marshal(session)
	if err != nil {
		return err
	}

	ttl := time.Until(expiresAt)
	if ttl <= 0 {
		return r.redisClient.Del(ctx, sessionKey(sessionID)).Err()
	}

	return r.redisClient.Set(ctx, sessionKey(sessionID), updated, ttl).Err()
}

func (r *authSessionRepository) RevokeSession(ctx context.Context, userID string, sessionID string, _ time.Time) error {
	pipe := r.redisClient.Pipeline()
	pipe.Del(ctx, sessionKey(sessionID))
	pipe.SRem(ctx, userSessionsKey(userID), sessionID)
	_, err := pipe.Exec(ctx)
	return err
}

func (r *authSessionRepository) RevokeAllSessions(ctx context.Context, userID string, _ time.Time) error {
	key := userSessionsKey(userID)
	sessionIDs, err := r.redisClient.SMembers(ctx, key).Result()
	if err != nil {
		return err
	}

	if len(sessionIDs) == 0 {
		return nil
	}

	sessionKeys := make([]string, 0, len(sessionIDs))
	for _, id := range sessionIDs {
		sessionKeys = append(sessionKeys, sessionKey(id))
	}

	pipe := r.redisClient.Pipeline()
	pipe.Del(ctx, sessionKeys...)
	pipe.Del(ctx, key)
	_, err = pipe.Exec(ctx)
	return err
}

func (r *authSessionRepository) ListActiveByUserID(ctx context.Context, userID string) ([]domain.AuthSession, error) {
	key := userSessionsKey(userID)
	sessionIDs, err := r.redisClient.SMembers(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	if len(sessionIDs) == 0 {
		return []domain.AuthSession{}, nil
	}

	now := time.Now()
	sessions := make([]domain.AuthSession, 0, len(sessionIDs))
	staleIDs := make([]string, 0)

	for _, id := range sessionIDs {
		data, err := r.redisClient.Get(ctx, sessionKey(id)).Bytes()
		if err != nil {
			if err == redis.Nil {
				staleIDs = append(staleIDs, id)
			}
			continue
		}

		var session domain.AuthSession
		if err := json.Unmarshal(data, &session); err != nil {
			continue
		}

		if session.RevokedAt != nil || !session.ExpiresAt.After(now) {
			continue
		}

		sessions = append(sessions, session)
	}

	// Lazy cleanup: remove stale session IDs from the user's set
	if len(staleIDs) > 0 {
		members := make([]any, len(staleIDs))
		for i, id := range staleIDs {
			members[i] = id
		}
		_ = r.redisClient.SRem(ctx, key, members...).Err()
	}

	return sessions, nil
}
