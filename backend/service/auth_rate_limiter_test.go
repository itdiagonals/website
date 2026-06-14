package service

import (
	"context"
	"testing"
	"time"

	miniredis "github.com/alicebob/miniredis/v2"
	"github.com/redis/go-redis/v9"
)

func TestAuthRateLimiter_ResetsBudgetAfterCooldown(t *testing.T) {
	server, client := newAuthRateLimiterTestClient(t)
	limiter := NewAuthRateLimiter(client)
	ctx := context.Background()
	config := AuthRateLimitConfig{
		Scope:    "login",
		Window:   time.Hour,
		Max:      2,
		Cooldown: 15 * time.Minute,
	}

	for range 2 {
		allowed, err := limiter.AllowByIP(ctx, "198.51.100.10", config)
		if err != nil {
			t.Fatalf("unexpected limiter error: %v", err)
		}
		if !allowed {
			t.Fatal("expected request to be allowed before reaching max")
		}
	}

	allowed, err := limiter.AllowByIP(ctx, "198.51.100.10", config)
	if err != nil {
		t.Fatalf("unexpected limiter error: %v", err)
	}
	if allowed {
		t.Fatal("expected request over max to be blocked")
	}

	server.FastForward(15 * time.Minute)

	allowed, err = limiter.AllowByIP(ctx, "198.51.100.10", config)
	if err != nil {
		t.Fatalf("unexpected limiter error after cooldown: %v", err)
	}
	if !allowed {
		t.Fatal("expected limiter budget to reset after cooldown")
	}
}

func TestAuthRateLimiter_NormalizesIdentifier(t *testing.T) {
	_, client := newAuthRateLimiterTestClient(t)
	limiter := NewAuthRateLimiter(client)
	ctx := context.Background()
	config := AuthRateLimitConfig{
		Scope:    "verify",
		Window:   15 * time.Minute,
		Max:      1,
		Cooldown: 15 * time.Minute,
	}

	allowed, err := limiter.AllowByIPAndIdentifier(ctx, "198.51.100.11", " User@Example.com ", config)
	if err != nil {
		t.Fatalf("unexpected limiter error: %v", err)
	}
	if !allowed {
		t.Fatal("expected first normalized identifier attempt to pass")
	}

	allowed, err = limiter.AllowByIPAndIdentifier(ctx, "198.51.100.11", "user@example.com", config)
	if err != nil {
		t.Fatalf("unexpected limiter error on normalized retry: %v", err)
	}
	if allowed {
		t.Fatal("expected second normalized identifier attempt to be limited")
	}
}

func TestAuthRateLimiter_WindowOnlyWithoutCooldown(t *testing.T) {
	server, client := newAuthRateLimiterTestClient(t)
	limiter := NewAuthRateLimiter(client)
	ctx := context.Background()
	config := AuthRateLimitConfig{
		Scope:    "catalog-read",
		Window:   1 * time.Minute,
		Max:      2,
		Cooldown: 0,
	}

	for range 2 {
		allowed, err := limiter.AllowByIP(ctx, "198.51.100.12", config)
		if err != nil {
			t.Fatalf("unexpected limiter error: %v", err)
		}
		if !allowed {
			t.Fatal("expected request to be allowed before reaching max")
		}
	}

	allowed, err := limiter.AllowByIP(ctx, "198.51.100.12", config)
	if err != nil {
		t.Fatalf("unexpected limiter error: %v", err)
	}
	if allowed {
		t.Fatal("expected request over max to be blocked")
	}

	server.FastForward(1 * time.Minute)

	allowed, err = limiter.AllowByIP(ctx, "198.51.100.12", config)
	if err != nil {
		t.Fatalf("unexpected limiter error after window: %v", err)
	}
	if !allowed {
		t.Fatal("expected limiter budget to reset after window when cooldown is 0")
	}
}

func TestAuthRateLimiter_SlidingWindowPreventsBoundaryBurst(t *testing.T) {
	_, client := newAuthRateLimiterTestClient(t)
	limiter := &authRateLimiter{redis: client, now: time.Now}

	base := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	current := base
	limiter.now = func() time.Time { return current }

	ctx := context.Background()
	config := AuthRateLimitConfig{
		Scope:  "login",
		Window: time.Minute,
		Max:    3,
	}

	for range 3 {
		allowed, err := limiter.AllowByIP(ctx, "203.0.113.7", config)
		if err != nil {
			t.Fatalf("unexpected limiter error: %v", err)
		}
		if !allowed {
			t.Fatal("expected request within max to be allowed")
		}
	}

	current = base.Add(59 * time.Second)
	allowed, err := limiter.AllowByIP(ctx, "203.0.113.7", config)
	if err != nil {
		t.Fatalf("unexpected limiter error: %v", err)
	}
	if allowed {
		t.Fatal("sliding window must still block within the original window (no boundary burst)")
	}

	current = base.Add(61 * time.Second)
	allowed, err = limiter.AllowByIP(ctx, "203.0.113.7", config)
	if err != nil {
		t.Fatalf("unexpected limiter error: %v", err)
	}
	if !allowed {
		t.Fatal("expected request to be allowed once earliest hits age out of the window")
	}
}

func newAuthRateLimiterTestClient(t *testing.T) (*miniredis.Miniredis, *redis.Client) {
	t.Helper()

	server, err := miniredis.Run()
	if err != nil {
		t.Fatalf("failed to start miniredis: %v", err)
	}
	t.Cleanup(server.Close)

	client := redis.NewClient(&redis.Options{Addr: server.Addr()})
	t.Cleanup(func() {
		_ = client.Close()
	})

	return server, client
}
