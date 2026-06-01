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
}

func NewAuthRateLimiter(redisClient *redis.Client) AuthRateLimiter {
	return &authRateLimiter{redis: redisClient}
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

	count, err := limiter.redis.Incr(ctx, rateKey).Result()
	if err != nil {
		return false, err
	}

	if count == 1 {
		if err := limiter.redis.Expire(ctx, rateKey, config.Window).Err(); err != nil {
			return false, err
		}
	}

	if count > config.Max {
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
