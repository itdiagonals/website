package service

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"github.com/redis/go-redis/v9"
)

const catalogCacheTTL = 5 * time.Minute

type CatalogCache struct {
	redis *redis.Client
}

type cachedListPayload[T any] struct {
	Items []T   `json:"items"`
	Total int64 `json:"total"`
}

func NewCatalogCache(redisClient *redis.Client) *CatalogCache {
	return &CatalogCache{redis: redisClient}
}

func (c *CatalogCache) Enabled() bool {
	return c != nil && c.redis != nil
}

func (c *CatalogCache) Get(ctx context.Context, key string, target any) (bool, error) {
	if !c.Enabled() {
		return false, nil
	}

	value, err := c.redis.Get(ctx, key).Bytes()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return false, nil
		}
		return false, err
	}

	if err := json.Unmarshal(value, target); err != nil {
		return false, err
	}

	return true, nil
}

func (c *CatalogCache) Set(ctx context.Context, key string, value any) error {
	if !c.Enabled() {
		return nil
	}

	payload, err := json.Marshal(value)
	if err != nil {
		return err
	}

	return c.redis.Set(ctx, key, payload, catalogCacheTTL).Err()
}

func (c *CatalogCache) InvalidateCatalog(ctx context.Context) error {
	if !c.Enabled() {
		return nil
	}

	return c.deleteByPatterns(ctx,
		"catalog:products:*",
		"catalog:categories:*",
		"catalog:seasons:*",
		"stats:*",
	)
}

func (c *CatalogCache) deleteByPatterns(ctx context.Context, patterns ...string) error {
	if !c.Enabled() {
		return nil
	}

	for _, pattern := range patterns {
		var cursor uint64
		for {
			keys, nextCursor, err := c.redis.Scan(ctx, cursor, pattern, 100).Result()
			if err != nil {
				return err
			}

			if len(keys) > 0 {
				if err := c.redis.Del(ctx, keys...).Err(); err != nil {
					return err
				}
			}

			cursor = nextCursor
			if cursor == 0 {
				break
			}
		}
	}

	return nil
}
