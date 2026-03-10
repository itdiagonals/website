package config

import (
	"context"
	"errors"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

func ConnectRedis() (*redis.Client, error) {
	LoadEnv()

	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		return nil, errors.New("REDIS_URL is not set")
	}

	options, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, err
	}

	client := redis.NewClient(options)

	context, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(context).Err(); err != nil {
		return nil, err
	}

	return client, nil
}
