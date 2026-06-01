package service

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/itdiagonals/website/backend/config"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/resend/resend-go/v3"
)

// EmailProvider is the abstraction for email sending providers.
type EmailProvider interface {
	Send(ctx context.Context, msg domain.EmailMessage) error
}

// mailtrapProvider implements EmailProvider using Mailtrap API.
type mailtrapProvider struct {
	config     config.MailtrapConfig
	httpClient *http.Client
}

// NewMailtrapProvider creates a new Mailtrap email provider.
func NewMailtrapProvider(cfg config.MailtrapConfig) EmailProvider {
	return &mailtrapProvider{
		config: cfg,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (p *mailtrapProvider) Send(ctx context.Context, msg domain.EmailMessage) error {
	payload := mailtrapPayload{
		From: mailtrapAddress{
			Email: msg.From.Email,
			Name:  msg.From.Name,
		},
		To:      convertAddresses(msg.To),
		Subject: msg.Subject,
		Text:    msg.Text,
		HTML:    msg.HTML,
		Category: msg.Category,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal email payload: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, p.config.APIBaseURL+"/api/send", bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Authorization", "Bearer "+p.config.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := p.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResp mailtrapErrorResponse
		if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
			return fmt.Errorf("mailtrap returned status %d", resp.StatusCode)
		}
		return fmt.Errorf("mailtrap error: %v", errResp.Errors)
	}

	var successResp mailtrapSuccessResponse
	if err := json.NewDecoder(resp.Body).Decode(&successResp); err != nil {
		logger.Warn("failed to decode mailtrap success response", "error", err.Error())
		return nil
	}

	if !successResp.Success {
		return fmt.Errorf("mailtrap reported failure")
	}

	return nil
}

type mailtrapAddress struct {
	Email string `json:"email"`
	Name  string `json:"name,omitempty"`
}

type mailtrapPayload struct {
	From     mailtrapAddress   `json:"from"`
	To       []mailtrapAddress `json:"to"`
	Subject  string            `json:"subject"`
	Text     string            `json:"text,omitempty"`
	HTML     string            `json:"html,omitempty"`
	Category string            `json:"category,omitempty"`
}

type mailtrapSuccessResponse struct {
	Success   bool     `json:"success"`
	MessageIDs []string `json:"message_ids"`
}

type mailtrapErrorResponse struct {
	Success bool     `json:"success"`
	Errors  []string `json:"errors"`
}

func convertAddresses(addrs []domain.EmailAddress) []mailtrapAddress {
	result := make([]mailtrapAddress, len(addrs))
	for i, addr := range addrs {
		result[i] = mailtrapAddress{Email: addr.Email, Name: addr.Name}
	}
	return result
}

// resendProvider implements EmailProvider using the Resend SDK.
type resendProvider struct {
	config config.ResendConfig
	client *resend.Client
}

func NewResendProvider(cfg config.ResendConfig) EmailProvider {
	return &resendProvider{
		config: cfg,
		client: resend.NewClient(cfg.APIKey),
	}
}

func (p *resendProvider) Send(ctx context.Context, msg domain.EmailMessage) error {
	from := formatResendFrom(msg.From, p.config)
	to := convertToResendRecipients(msg.To)

	params := &resend.SendEmailRequest{
		From:    from,
		To:      to,
		Subject: msg.Subject,
		Text:    msg.Text,
		Html:    msg.HTML,
	}

	sent, err := p.client.Emails.Send(params)
	if err != nil {
		return fmt.Errorf("resend send failed: %w", err)
	}
	if sent == nil || sent.Id == "" {
		return fmt.Errorf("resend returned empty response")
	}

	logger.Info("email.resend.sent", "id", sent.Id, "to", to)
	return nil
}

func formatResendFrom(addr domain.EmailAddress, cfg config.ResendConfig) string {
	name := addr.Name
	if name == "" {
		name = cfg.FromName
	}
	email := addr.Email
	if email == "" {
		email = cfg.FromEmail
	}
	if name == "" {
		return email
	}
	return fmt.Sprintf("%s <%s>", name, email)
}

func convertToResendRecipients(addrs []domain.EmailAddress) []string {
	result := make([]string, len(addrs))
	for i, addr := range addrs {
		if addr.Name != "" {
			result[i] = fmt.Sprintf("%s <%s>", addr.Name, addr.Email)
			continue
		}
		result[i] = addr.Email
	}
	return result
}

// fallbackEmailProvider tries the primary provider first and, if it fails,
// retries the same message against the secondary provider. It returns an
// error only if both providers fail.
type fallbackEmailProvider struct {
	primary   EmailProvider
	secondary EmailProvider
}

func NewFallbackEmailProvider(primary, secondary EmailProvider) EmailProvider {
	return &fallbackEmailProvider{
		primary:   primary,
		secondary: secondary,
	}
}

func (f *fallbackEmailProvider) Send(ctx context.Context, msg domain.EmailMessage) error {
	primaryErr := f.primary.Send(ctx, msg)
	if primaryErr == nil {
		return nil
	}
	logger.Warn("email.primary.failed.fallback", "provider", "mailtrap", "error", primaryErr.Error())

	if f.secondary == nil {
		return fmt.Errorf("primary provider failed and no fallback configured: %w", primaryErr)
	}

	if err := f.secondary.Send(ctx, msg); err != nil {
		logger.Error("email.fallback.failed", "provider", "resend", "error", err.Error())
		return fmt.Errorf("primary failed (%v) and fallback failed: %w", primaryErr, err)
	}

	logger.Info("email.fallback.success", "provider", "resend")
	return nil
}
