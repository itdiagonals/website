package service

import (
	"context"
	"crypto/subtle"
	"errors"
	"fmt"
	"math/rand/v2"
	"strings"
	"time"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/redis/go-redis/v9"
)

var (
	ErrOTPRateLimitExceeded = errors.New("too many OTP requests, please try again later")
	ErrOTPInvalid           = errors.New("invalid or expired OTP")
	ErrOTPNotFound          = errors.New("no active OTP found for this email")
)

const (
	otpLength               = 6
	otpExpiry               = 10 * time.Minute
	otpRateLimitWindow      = 1 * time.Hour
	otpMaxRequestsPerWindow = 3
	otpCooldownAfterMax     = 15 * time.Minute
)

// OTPService handles OTP generation, storage, and verification.
type OTPService interface {
	RequestOTP(ctx context.Context, email string, purpose domain.OTPPurpose) (string, error)
	VerifyOTP(ctx context.Context, email string, code string) error
}

// EmailSender is the abstraction for sending emails.
type EmailSender interface {
	Send(ctx context.Context, msg domain.EmailMessage) error
}

type otpService struct {
	redis       *redis.Client
	emailSender EmailSender
	fromAddress domain.EmailAddress
}

// NewOTPService creates a new OTP service.
func NewOTPService(redisClient *redis.Client, sender EmailSender, from domain.EmailAddress) OTPService {
	return &otpService{
		redis:       redisClient,
		emailSender: sender,
		fromAddress: from,
	}
}

func (s *otpService) RequestOTP(ctx context.Context, email string, purpose domain.OTPPurpose) (string, error) {
	email = strings.TrimSpace(strings.ToLower(email))

	allowed, err := s.checkRateLimit(ctx, email)
	if err != nil {
		return "", fmt.Errorf("rate limit check failed: %w", err)
	}
	if !allowed {
		return "", ErrOTPRateLimitExceeded
	}

	code := generateSecureOTP()

	key := otpKey(email, purpose)
	if err := s.redis.Set(ctx, key, code, otpExpiry).Err(); err != nil {
		return "", fmt.Errorf("failed to store OTP: %w", err)
	}

	msg := domain.EmailMessage{
		From:     s.fromAddress,
		To:       []domain.EmailAddress{{Email: email}},
		Subject:  getOTPEmailSubject(purpose),
		Text:     getOTPEmailBody(code, purpose),
		HTML:     getOTPEmailHTML(code, purpose),
		Category: "OTP",
	}

	if err := s.emailSender.Send(ctx, msg); err != nil {
		logger.Error("failed to enqueue OTP email", "error", err.Error(), "email", email)
	}

	return code, nil
}

func (s *otpService) VerifyOTP(ctx context.Context, email string, code string) error {
	email = strings.TrimSpace(strings.ToLower(email))
	code = strings.TrimSpace(code)

	for _, purpose := range []domain.OTPPurpose{domain.OTPPurposeAccountVerification, domain.OTPPurposePasswordReset} {
		key := otpKey(email, purpose)
		storedCode, err := s.redis.Get(ctx, key).Result()
		if err == redis.Nil {
			continue
		}
		if err != nil {
			return fmt.Errorf("failed to retrieve OTP: %w", err)
		}

		if subtle.ConstantTimeCompare([]byte(storedCode), []byte(code)) == 1 {
			if err := s.redis.Del(ctx, key).Err(); err != nil {
				logger.Warn("failed to delete OTP after verification", "error", err.Error())
			}
			return nil
		}
	}

	return ErrOTPInvalid
}

func (s *otpService) checkRateLimit(ctx context.Context, email string) (bool, error) {
	rateKey := fmt.Sprintf("otp:ratelimit:%s", email)

	cooldownKey := fmt.Sprintf("otp:cooldown:%s", email)
	exists, err := s.redis.Exists(ctx, cooldownKey).Result()
	if err != nil {
		return false, err
	}
	if exists > 0 {
		return false, nil
	}

	count, err := s.redis.Incr(ctx, rateKey).Result()
	if err != nil {
		return false, err
	}

	if count == 1 {
		if err := s.redis.Expire(ctx, rateKey, otpRateLimitWindow).Err(); err != nil {
			return false, err
		}
	}

	if count > otpMaxRequestsPerWindow {
		s.redis.Set(ctx, cooldownKey, "1", otpCooldownAfterMax)
		return false, nil
	}

	return true, nil
}

func generateSecureOTP() string {
	const digits = "0123456789"
	b := make([]byte, otpLength)
	for i := range b {
		b[i] = digits[rand.IntN(len(digits))]
	}
	return string(b)
}

func otpKey(email string, purpose domain.OTPPurpose) string {
	return fmt.Sprintf("otp:%s:%s", purpose, email)
}

func getOTPEmailSubject(purpose domain.OTPPurpose) string {
	switch purpose {
	case domain.OTPPurposeAccountVerification:
		return "Verify Your Account - Diagonals"
	case domain.OTPPurposePasswordReset:
		return "Reset Your Password - Diagonals"
	default:
		return "Your Verification Code - Diagonals"
	}
}

func getOTPEmailBody(code string, purpose domain.OTPPurpose) string {
	var action string
	switch purpose {
	case domain.OTPPurposeAccountVerification:
		action = "verify your account"
	case domain.OTPPurposePasswordReset:
		action = "reset your password"
	default:
		action = "complete your request"
	}

	return fmt.Sprintf(`Hi there,

Your verification code to %s is: %s

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
Diagonals Team`, action, code)
}

func getOTPEmailHTML(code string, purpose domain.OTPPurpose) string {
	var action, title string
	switch purpose {
	case domain.OTPPurposeAccountVerification:
		action = "verify your account"
		title = "Verify Your Account"
	case domain.OTPPurposePasswordReset:
		action = "reset your password"
		title = "Reset Your Password"
	default:
		action = "complete your request"
		title = "Verification Code"
	}

	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>%s</title>
</head>
<body style="margin: 0; padding: 0; background-color: #cac5c5; font-family: 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%%" style="background-color: #cac5c5; padding: 40px 0;">
<tr>
<td align="center">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="480" style="background-color: #f4f4f4; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
<tr>
<td style="background-color: #212121; padding: 32px 40px; text-align: center;">
<h1 style="margin: 0; color: #f4f4f4; font-size: 24px; font-weight: 600; letter-spacing: -0.02em; font-family: Georgia, 'Times New Roman', serif;">Diagonals</h1>
</td>
</tr>
<tr>
<td style="padding: 40px;">
<h2 style="margin: 0 0 16px 0; color: #212121; font-size: 20px; font-weight: 600; line-height: 1.3;">%s</h2>
<p style="margin: 0 0 24px 0; color: #484848; font-size: 15px; line-height: 1.6;">Use the verification code below to %s:</p>
<div style="background-color: #212121; border-radius: 8px; padding: 24px; text-align: center; margin: 0 0 24px 0;">
<p style="margin: 0 0 8px 0; color: #dfdfdf; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 500;">Verification Code</p>
<p style="margin: 0; color: #ffdb43; font-size: 36px; font-weight: 700; letter-spacing: 0.15em; font-family: 'Courier New', monospace;">%s</p>
</div>
<p style="margin: 0 0 24px 0; color: #737373; font-size: 13px; line-height: 1.5;">This code will expire in <strong style="color: #484848;">10 minutes</strong>. If you did not request this code, you can safely ignore this email.</p>
<div style="border-top: 1px solid #dfdfdf; padding-top: 24px; text-align: center;">
<p style="margin: 0 0 4px 0; color: #909090; font-size: 12px;">Need help? Contact us at <a href="mailto:support@diagonals.id" style="color: #6b6b6b; text-decoration: underline;">support@diagonals.id</a></p>
<p style="margin: 0; color: #b4b4b4; font-size: 11px;">Diagonals &copy; 2026</p>
</div>
</td>
</tr>
</table>
</td>
</tr>
</table>
</body>
</html>`, title, title, action, code)
}
