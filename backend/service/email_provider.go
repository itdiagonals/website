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
