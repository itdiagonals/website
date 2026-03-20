package service

import (
	"context"
	"crypto/sha1"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"log"
	"strings"

	"github.com/itdiagonals/website/backend/config"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
	"gorm.io/gorm"
)

var (
	ErrBiteshipWebhookUnauthorized = errors.New("unauthorized biteship webhook")
	ErrBiteshipWebhookInvalidBody  = errors.New("invalid biteship webhook payload")
	ErrBiteshipWebhookOrderMissing = errors.New("biteship order not found")
)

type BiteshipWebhookService interface {
	HandleNotification(ctx context.Context, providedSecret string, providedToken string, payload map[string]any) error
}

type biteshipWebhookService struct {
	transactionRepository repository.TransactionRepository
	webhookEventRepo      repository.BiteshipWebhookEventRepository
	config                config.BiteshipConfig
}

func NewBiteshipWebhookService(transactionRepository repository.TransactionRepository, webhookEventRepo repository.BiteshipWebhookEventRepository) BiteshipWebhookService {
	return &biteshipWebhookService{
		transactionRepository: transactionRepository,
		webhookEventRepo:      webhookEventRepo,
		config:                config.GetBiteshipConfig(),
	}
}

func (service *biteshipWebhookService) HandleNotification(ctx context.Context, providedSecret string, providedToken string, payload map[string]any) error {
	if payload == nil {
		return ErrBiteshipWebhookInvalidBody
	}

	if !service.isWebhookAuthorized(providedSecret, providedToken) {
		return ErrBiteshipWebhookUnauthorized
	}

	webhookEvent := normalizeWebhookPayload(payload)
	if webhookEvent.BiteshipOrderID == "" {
		return ErrBiteshipWebhookInvalidBody
	}
	if webhookEvent.TrackingNumber == "" && webhookEvent.ShippingStatus == "pending" {
		return ErrBiteshipWebhookInvalidBody
	}

	if service.webhookEventRepo != nil {
		eventKey := buildWebhookEventKey(webhookEvent)
		inserted, err := service.webhookEventRepo.CreateIfAbsent(ctx, domain.BiteshipWebhookEvent{
			EventKey:  eventKey,
			EventType: webhookEvent.EventType,
			OrderID:   webhookEvent.BiteshipOrderID,
			Status:    webhookEvent.RawStatus,
			WaybillID: webhookEvent.TrackingNumber,
		})
		if err != nil {
			return err
		}
		if !inserted {
			log.Printf("biteship webhook duplicate ignored event=%s order_id=%s waybill=%s", webhookEvent.EventType, webhookEvent.BiteshipOrderID, webhookEvent.TrackingNumber)
			return nil
		}
	}

	transaction, findErr := service.transactionRepository.FindByBiteshipOrderID(ctx, webhookEvent.BiteshipOrderID)
	if findErr != nil && !errors.Is(findErr, gorm.ErrRecordNotFound) {
		return findErr
	}
	if transaction == nil {
		return ErrBiteshipWebhookOrderMissing
	}

	shippingStatus := chooseLatestShippingStatus(strings.TrimSpace(transaction.ShippingStatus), webhookEvent.ShippingStatus)

	updated, err := service.transactionRepository.UpdateShippingByBiteshipOrderID(ctx, webhookEvent.BiteshipOrderID, webhookEvent.TrackingNumber, shippingStatus)
	if err != nil {
		return err
	}
	if !updated {
		return ErrBiteshipWebhookOrderMissing
	}

	log.Printf("biteship webhook processed event=%s order_id=%s status=%s tracking=%s", webhookEvent.EventType, webhookEvent.BiteshipOrderID, shippingStatus, webhookEvent.TrackingNumber)

	return nil
}

func (service *biteshipWebhookService) isWebhookAuthorized(providedSecret string, providedToken string) bool {
	expectedSecret := strings.TrimSpace(service.config.WebhookSecret)
	providedSecret = strings.TrimSpace(providedSecret)
	if expectedSecret != "" && subtle.ConstantTimeCompare([]byte(expectedSecret), []byte(providedSecret)) == 1 {
		return true
	}

	expectedToken := strings.TrimSpace(service.config.WebhookToken)
	providedToken = strings.TrimSpace(providedToken)
	if expectedToken != "" && subtle.ConstantTimeCompare([]byte(expectedToken), []byte(providedToken)) == 1 {
		return true
	}

	return false
}

func getPayloadString(payload map[string]any, key string) string {
	if payload == nil {
		return ""
	}

	value, exists := payload[key]
	if !exists {
		return ""
	}

	switch typed := value.(type) {
	case string:
		return strings.TrimSpace(typed)
	case []byte:
		return strings.TrimSpace(string(typed))
	default:
		return strings.TrimSpace("")
	}
}

func getNestedPayloadString(payload map[string]any, objectKey string, fieldKey string) string {
	if payload == nil {
		return ""
	}

	nestedRaw, exists := payload[objectKey]
	if !exists {
		return ""
	}

	nested, ok := nestedRaw.(map[string]any)
	if !ok {
		return ""
	}

	return getPayloadString(nested, fieldKey)
}

type normalizedWebhookPayload struct {
	EventType       string
	BiteshipOrderID string
	TrackingNumber  string
	ShippingStatus  string
	RawStatus       string
}

func normalizeWebhookPayload(payload map[string]any) normalizedWebhookPayload {
	eventType := firstNonEmptyString(
		getPayloadString(payload, "event"),
		getNestedPayloadString(payload, "data", "event"),
	)

	biteshipOrderID := firstNonEmptyString(
		getPayloadString(payload, "id"),
		getPayloadString(payload, "order_id"),
		getPayloadString(payload, "biteship_order_id"),
		getNestedPayloadString(payload, "data", "id"),
		getNestedPayloadString(payload, "data", "order_id"),
	)

	trackingNumber := firstNonEmptyString(
		getPayloadString(payload, "courier_waybill_id"),
		getPayloadString(payload, "tracking_number"),
		getPayloadString(payload, "waybill_id"),
		getNestedPayloadString(payload, "data", "courier_waybill_id"),
		getNestedPayloadString(payload, "courier", "waybill_id"),
		getNestedPayloadString(payload, "data", "tracking_number"),
	)

	rawStatus := firstNonEmptyString(
		getPayloadString(payload, "status"),
		getPayloadString(payload, "courier_status"),
		getNestedPayloadString(payload, "data", "status"),
		getNestedPayloadString(payload, "tracking", "status"),
	)

	return normalizedWebhookPayload{
		EventType:       strings.TrimSpace(eventType),
		BiteshipOrderID: strings.TrimSpace(biteshipOrderID),
		TrackingNumber:  strings.TrimSpace(trackingNumber),
		ShippingStatus:  normalizeShippingStatus(rawStatus),
		RawStatus:       strings.TrimSpace(rawStatus),
	}
}

func buildWebhookEventKey(event normalizedWebhookPayload) string {
	hasher := sha1.New()
	_, _ = hasher.Write([]byte(strings.TrimSpace(event.EventType)))
	_, _ = hasher.Write([]byte("|"))
	_, _ = hasher.Write([]byte(strings.TrimSpace(event.BiteshipOrderID)))
	_, _ = hasher.Write([]byte("|"))
	_, _ = hasher.Write([]byte(strings.TrimSpace(event.TrackingNumber)))
	_, _ = hasher.Write([]byte("|"))
	_, _ = hasher.Write([]byte(strings.TrimSpace(event.RawStatus)))

	return hex.EncodeToString(hasher.Sum(nil))
}
