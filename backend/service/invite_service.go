package service

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"strings"
	"time"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/itdiagonals/website/backend/repository"
	"github.com/redis/go-redis/v9"
)

var (
	ErrInviteTokenInvalid = fmt.Errorf("invalid or expired invite token")
	ErrInviteAlreadyAdmin = fmt.Errorf("user is already an admin")
)

type InviteService struct {
	repo        repository.UserRepository
	redis       *redis.Client
	emailSender EmailSender
	fromAddress domain.EmailAddress
}

func NewInviteService(repo repository.UserRepository, redis *redis.Client, sender EmailSender, from domain.EmailAddress) *InviteService {
	return &InviteService{repo: repo, redis: redis, emailSender: sender, fromAddress: from}
}

func (s *InviteService) InviteAdmin(ctx context.Context, email string, inviterName string) (string, error) {
	email = strings.TrimSpace(strings.ToLower(email))
	if email == "" {
		return "", fmt.Errorf("email is required")
	}

	user, err := s.repo.FindByEmail(ctx, email)
	if err == nil && user != nil {
		if user.Role == "admin" {
			return "", ErrInviteAlreadyAdmin
		}
		if err := s.repo.UpdateRole(ctx, user.ID, "admin"); err != nil {
			return "", fmt.Errorf("failed to promote user: %w", err)
		}
		if err := s.sendPromotedEmail(ctx, email, user.Name); err != nil {
			logger.Warn("invite.promote_email_failed", "error", err.Error())
		}
		return "", nil
	}

	token := generateInviteToken()
	key := inviteTokenKey(token)
	if err := s.redis.Set(ctx, key, email, 24*time.Hour).Err(); err != nil {
		return "", fmt.Errorf("failed to store invite token: %w", err)
	}

	if err := s.sendInviteEmail(ctx, email, token, inviterName); err != nil {
		logger.Warn("invite.invite_email_failed", "error", err.Error())
	}

	return token, nil
}

func (s *InviteService) CheckInviteToken(ctx context.Context, token string) (string, bool, error) {
	key := inviteTokenKey(token)
	email, err := s.redis.Get(ctx, key).Result()
	if err == redis.Nil {
		return "", false, ErrInviteTokenInvalid
	}
	if err != nil {
		return "", false, fmt.Errorf("failed to check invite token: %w", err)
	}

	user, err := s.repo.FindByEmail(ctx, email)
	if err == nil && user != nil {
		if user.Role == "admin" {
			return email, true, nil
		}
		return email, true, nil
	}

	return email, false, nil
}

func (s *InviteService) RedeemInviteToken(ctx context.Context, token string) error {
	key := inviteTokenKey(token)
	email, err := s.redis.Get(ctx, key).Result()
	if err == redis.Nil {
		return ErrInviteTokenInvalid
	}
	if err != nil {
		return fmt.Errorf("failed to retrieve invite token: %w", err)
	}

	user, err := s.repo.FindByEmail(ctx, email)
	if err == nil && user != nil {
		if user.Role != "admin" {
			if err := s.repo.UpdateRole(ctx, user.ID, "admin"); err != nil {
				return fmt.Errorf("failed to promote user: %w", err)
			}
		}
		_ = s.redis.Del(ctx, key)
		return nil
	}

	return fmt.Errorf("user not found for invite email")
}

func generateInviteToken() string {
	b := make([]byte, 32)
	_, _ = rand.Read(b)
	return hex.EncodeToString(b)
}

func inviteTokenKey(token string) string {
	return fmt.Sprintf("invite:%s", token)
}

func (s *InviteService) sendInviteEmail(ctx context.Context, email, token, inviterName string) error {
	msg := domain.EmailMessage{
		From:     s.fromAddress,
		To:       []domain.EmailAddress{{Email: email}},
		Subject:  "You've been invited to join Diagonals Admin",
		Text:     fmt.Sprintf("Hi,\n\n%s has invited you to join the Diagonals admin team.\n\nUse this link to accept your invitation:\nhttp://localhost:3000/invite-admin?token=%s\n\nThis link expires in 24 hours.\n\nIf you don't have an account yet, create one first at the registration page with this invite token.\n\nBest regards,\nDiagonals Team", inviterName, token),
		HTML:     fmt.Sprintf(`<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:40px 0"><table width="480" style="margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:#212121;padding:32px 40px;text-align:center"><h1 style="margin:0;color:#f4f4f4;font-size:24px;font-weight:600;font-family:Georgia,serif">Diagonals</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 16px 0;color:#212121;font-size:20px;font-weight:600">Admin Invitation</h2><p style="margin:0 0 24px 0;color:#484848;font-size:15px;line-height:1.6"><strong>%s</strong> has invited you to join the Diagonals admin team.</p><div style="background:#212121;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px 0"><p style="margin:0 0 8px 0;color:#dfdfdf;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;font-weight:500">Invitation Link</p><a href="http://localhost:3000/invite-admin?token=%s" style="display:inline-block;background:#ffdb43;color:#212121;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Accept Invitation</a></div><p style="margin:0 0 24px 0;color:#737373;font-size:13px;line-height:1.5">This link expires in <strong style="color:#484848">24 hours</strong>. If you don't have an account yet, create one first on the registration page.</p></td></tr></table></body></html>`, inviterName, token),
		Category: "Invite",
	}
	return s.emailSender.Send(ctx, msg)
}

func (s *InviteService) sendPromotedEmail(ctx context.Context, email, name string) error {
	msg := domain.EmailMessage{
		From:     s.fromAddress,
		To:       []domain.EmailAddress{{Email: email}},
		Subject:  "You have been promoted to Admin - Diagonals",
		Text:     "Hi,\n\nYour account has been promoted to admin role on Diagonals.\n\nYou can now access the admin dashboard at http://localhost:3000/admin\n\nBest regards,\nDiagonals Team",
		HTML:     `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;background:#f4f4f4;padding:40px 0"><table width="480" style="margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)"><tr><td style="background:#212121;padding:32px 40px;text-align:center"><h1 style="margin:0;color:#f4f4f4;font-size:24px;font-weight:600;font-family:Georgia,serif">Diagonals</h1></td></tr><tr><td style="padding:40px"><h2 style="margin:0 0 16px 0;color:#212121;font-size:20px;font-weight:600">Promoted to Admin</h2><p style="margin:0 0 24px 0;color:#484848;font-size:15px;line-height:1.6">Your account has been promoted to <strong>admin</strong> role on Diagonals.</p><div style="background:#212121;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px 0"><a href="http://localhost:3000/admin" style="display:inline-block;background:#ffdb43;color:#212121;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Go to Dashboard</a></div></td></tr></table></body></html>`,
		Category: "Invite",
	}
	return s.emailSender.Send(ctx, msg)
}
