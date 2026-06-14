package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

type AuthRateLimitConfig struct {
	Scope    string
	Window   time.Duration
	Max      int64
	Cooldown time.Duration
}

type AuthRateLimiter interface {
	Allow(ctx context.Context, config AuthRateLimitConfig, keyParts ...string) (bool, error)
	AllowByIP(ctx context.Context, ip string, config AuthRateLimitConfig) (bool, error)
	AllowByIPAndIdentifier(ctx context.Context, ip string, identifier string, config AuthRateLimitConfig) (bool, error)
}

type authRateLimiter struct {
	redis *redis.Client
	now   func() time.Time
}

func NewAuthRateLimiter(redisClient *redis.Client) AuthRateLimiter {
	return &authRateLimiter{redis: redisClient, now: time.Now}
}

func (limiter *authRateLimiter) Allow(ctx context.Context, config AuthRateLimitConfig, keyParts ...string) (bool, error) {
	rateKey := limiter.rateKey(config.Scope, keyParts...)
	cooldownKey := limiter.cooldownKey(config.Scope, keyParts...)

	exists, err := limiter.redis.Exists(ctx, cooldownKey).Result()
	if err != nil {
		return false, err
	}
	if exists > 0 {
		return false, nil
	}

	now := limiter.now()
	windowStart := now.Add(-config.Window).UnixNano()

	if err := limiter.redis.ZRemRangeByScore(ctx, rateKey, "0", fmt.Sprintf("%d", windowStart)).Err(); err != nil {
		return false, err
	}

	count, err := limiter.redis.ZCard(ctx, rateKey).Result()
	if err != nil {
		return false, err
	}

	if count >= config.Max {
		if config.Cooldown > 0 {
			if err := limiter.redis.Del(ctx, rateKey).Err(); err != nil {
				return false, err
			}
			if err := limiter.redis.Set(ctx, cooldownKey, "1", config.Cooldown).Err(); err != nil {
				return false, err
			}
		}
		return false, nil
	}

	member := fmt.Sprintf("%d-%d", now.UnixNano(), count)
	if err := limiter.redis.ZAdd(ctx, rateKey, redis.Z{Score: float64(now.UnixNano()), Member: member}).Err(); err != nil {
		return false, err
	}
	if err := limiter.redis.Expire(ctx, rateKey, config.Window).Err(); err != nil {
		return false, err
	}

	return true, nil
}

func (limiter *authRateLimiter) AllowByIP(ctx context.Context, ip string, config AuthRateLimitConfig) (bool, error) {
	return limiter.Allow(ctx, config, strings.TrimSpace(ip))
}

func (limiter *authRateLimiter) AllowByIPAndIdentifier(ctx context.Context, ip string, identifier string, config AuthRateLimitConfig) (bool, error) {
	return limiter.Allow(ctx, config, strings.TrimSpace(ip), strings.TrimSpace(strings.ToLower(identifier)))
}

func (limiter *authRateLimiter) rateKey(scope string, keyParts ...string) string {
	return fmt.Sprintf("auth:ratelimit:%s:%s", strings.TrimSpace(scope), strings.Join(keyParts, ":"))
}

func (limiter *authRateLimiter) cooldownKey(scope string, keyParts ...string) string {
	return fmt.Sprintf("auth:cooldown:%s:%s", strings.TrimSpace(scope), strings.Join(keyParts, ":"))
}
