package service

import (
	"context"
	"testing"

	"github.com/itdiagonals/website/backend/domain"
)

func TestOTPService_VerifyOTP_IsPurposeSpecific(t *testing.T) {
	_, client := newAuthRateLimiterTestClient(t)
	service := NewOTPService(client, stubEmailSender{}, domain.EmailAddress{Email: "noreply@example.com"})
	ctx := context.Background()
	email := "user@example.com"
	code := "123456"

	if err := client.Set(ctx, otpKey(email, domain.OTPPurposeAccountVerification), code, otpExpiry).Err(); err != nil {
		t.Fatalf("failed to seed account verification otp: %v", err)
	}

	if err := service.VerifyOTP(ctx, email, code, domain.OTPPurposePasswordReset); err != ErrOTPInvalid {
		t.Fatalf("expected password reset verification to fail with ErrOTPInvalid, got %v", err)
	}

	if err := service.VerifyOTP(ctx, email, code, domain.OTPPurposeAccountVerification); err != nil {
		t.Fatalf("expected account verification OTP to succeed, got %v", err)
	}
}

type stubEmailSender struct{}

func (stubEmailSender) Send(context.Context, domain.EmailMessage) error {
	return nil
}
