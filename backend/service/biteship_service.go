package service

import (
	"bytes"
	"context"
	"crypto/sha1"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/itdiagonals/website/backend/config"
)

var ErrBiteshipAPIKeyMissing = errors.New("BITESHIP_API_KEY is not set")
var ErrBiteshipOriginConfigMissing = errors.New("BITESHIP origin sender config is incomplete")
var ErrInvalidTrackingRequest = errors.New("invalid tracking request")

type ShippingService interface {
	GetShippingRates(ctx context.Context, originAreaID string, destinationAreaID string, items []ShippingRateItem, couriers string) (*ShippingRatesResponse, error)
	LookupDestination(ctx context.Context, input string) (*ShippingDestination, error)
	CreateOrder(ctx context.Context, req CreateShippingOrderRequest) (*CreateShippingOrderResponse, error)
	GetTrackingByWaybill(ctx context.Context, waybillID string, courierCode string) (*ShippingTrackingResponse, error)
	GetOrderByID(ctx context.Context, orderID string) (*ShippingOrderResponse, error)
}

type destinationCacheItem struct {
	value     *ShippingDestination
	expiresAt time.Time
}

type ratesCacheItem struct {
	value     *ShippingRatesResponse
	expiresAt time.Time
}

type biteshipService struct {
	client *http.Client
	config config.BiteshipConfig

	cacheMu            sync.RWMutex
	destinationCache   map[string]destinationCacheItem
	shippingRatesCache map[string]ratesCacheItem
}

func NewBiteshipService() ShippingService {
	return &biteshipService{
		client:             &http.Client{Timeout: 15 * time.Second},
		config:             config.GetBiteshipConfig(),
		destinationCache:   make(map[string]destinationCacheItem),
		shippingRatesCache: make(map[string]ratesCacheItem),
	}
}

func (service *biteshipService) LookupDestination(ctx context.Context, input string) (*ShippingDestination, error) {
	query := strings.TrimSpace(input)
	if query == "" {
		return nil, ErrInvalidShippingRequest
	}
	if service.config.APIKey == "" {
		return nil, ErrBiteshipAPIKeyMissing
	}

	cacheKey := strings.ToLower(query)
	if cached := service.getDestinationFromCache(cacheKey); cached != nil {
		return cached, nil
	}

	requestURL := fmt.Sprintf("%s/v1/maps/areas?countries=ID&input=%s&type=single", service.config.BaseURL, url.QueryEscape(query))
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, err
	}
	request.Header.Set("Authorization", service.config.APIKey)

	response, err := service.client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return nil, parseBiteshipAPIError("maps request", response.StatusCode, responseBody)
	}

	var payload struct {
		Areas []struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		} `json:"areas"`
	}
	if err := json.Unmarshal(responseBody, &payload); err != nil {
		return nil, err
	}
	if len(payload.Areas) == 0 || strings.TrimSpace(payload.Areas[0].ID) == "" {
		return nil, errors.New("biteship maps returned no matching area")
	}

	destination := &ShippingDestination{
		ID:    strings.TrimSpace(payload.Areas[0].ID),
		Label: strings.TrimSpace(payload.Areas[0].Name),
	}
	service.setDestinationCache(cacheKey, destination, 15*time.Minute)

	return destination, nil
}

func (service *biteshipService) GetShippingRates(ctx context.Context, originAreaID string, destinationAreaID string, items []ShippingRateItem, couriers string) (*ShippingRatesResponse, error) {
	originAreaID = strings.TrimSpace(originAreaID)
	destinationAreaID = strings.TrimSpace(destinationAreaID)
	normalizedItems := normalizeShippingItems(items)
	normalizedCouriers := normalizeBiteshipCouriers(couriers)

	if originAreaID == "" || destinationAreaID == "" || normalizedCouriers == "" || len(normalizedItems) == 0 {
		return nil, ErrInvalidShippingRequest
	}
	if service.config.APIKey == "" {
		return nil, ErrBiteshipAPIKeyMissing
	}

	cacheKey, err := buildRatesCacheKey(originAreaID, destinationAreaID, normalizedCouriers, normalizedItems)
	if err == nil {
		if cached := service.getRatesFromCache(cacheKey); cached != nil {
			return cached, nil
		}
	}

	requestBody := map[string]any{
		"origin_area_id":      originAreaID,
		"destination_area_id": destinationAreaID,
		"couriers":            normalizedCouriers,
		"items":               normalizedItems,
	}

	encodedBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, service.config.BaseURL+"/v1/rates/couriers", bytes.NewReader(encodedBody))
	if err != nil {
		return nil, err
	}
	request.Header.Set("Authorization", service.config.APIKey)
	request.Header.Set("Content-Type", "application/json")

	response, err := service.client.Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}

	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		return nil, parseBiteshipAPIError("rates request", response.StatusCode, responseBody)
	}

	var payload struct {
		Pricing []struct {
			CourierName        string   `json:"courier_name"`
			CourierCode        string   `json:"courier_code"`
			CourierService     string   `json:"courier_service_name"`
			CourierServiceCode string   `json:"courier_service_code"`
			Duration           string   `json:"duration"`
			ShippingFee        float64  `json:"shipping_fee"`
			InsuranceFee       float64  `json:"insurance_fee"`
			CashOnDeliveryFee  float64  `json:"cash_on_delivery_fee"`
			Price              float64  `json:"price"`
			CollectionMethods  []string `json:"available_collection_method"`
		} `json:"pricing"`
	}
	if err := json.Unmarshal(responseBody, &payload); err != nil {
		return nil, err
	}

	rates := make([]ShippingRate, 0, len(payload.Pricing))
	for _, item := range payload.Pricing {
		rates = append(rates, ShippingRate{
			CourierName:              strings.TrimSpace(item.CourierName),
			CourierCode:              strings.ToLower(strings.TrimSpace(item.CourierCode)),
			ServiceName:              strings.TrimSpace(item.CourierService),
			ServiceCode:              strings.ToLower(strings.TrimSpace(item.CourierServiceCode)),
			EstimatedRange:           strings.TrimSpace(item.Duration),
			EstimatedDays:            strings.TrimSpace(item.Duration),
			Price:                    item.Price,
			ShippingFee:              item.ShippingFee,
			InsuranceFee:             item.InsuranceFee,
			CashOnDeliveryFee:        item.CashOnDeliveryFee,
			AvailableCollectionTypes: item.CollectionMethods,
		})
	}

	result := &ShippingRatesResponse{Rates: rates}
	if cacheKey != "" {
		service.setRatesCache(cacheKey, result, 5*time.Minute)
	}

	return result, nil
}

func (service *biteshipService) CreateOrder(ctx context.Context, req CreateShippingOrderRequest) (*CreateShippingOrderResponse, error) {
	if service.config.APIKey == "" {
		return nil, ErrBiteshipAPIKeyMissing
	}

	if strings.TrimSpace(service.config.OriginName) == "" || strings.TrimSpace(service.config.OriginPhone) == "" || strings.TrimSpace(service.config.OriginAddress) == "" || strings.TrimSpace(service.config.OriginPostalCode) == "" {
		return nil, ErrBiteshipOriginConfigMissing
	}

	referenceID := strings.TrimSpace(req.ReferenceID)
	courierCompany := strings.ToLower(strings.TrimSpace(req.CourierCompany))
	courierType := strings.ToLower(strings.TrimSpace(req.CourierType))
	destinationContactName := strings.TrimSpace(req.DestinationContactName)
	destinationContactPhone := sanitizePhoneNumber(req.DestinationContactPhone)
	destinationAddress := strings.TrimSpace(req.DestinationAddress)
	destinationPostalCode := strings.TrimSpace(req.DestinationPostalCode)
	destinationAreaID := strings.TrimSpace(req.DestinationAreaID)

	items := normalizeOrderItems(req.Items)
	if referenceID == "" || courierCompany == "" || courierType == "" || destinationContactName == "" || destinationContactPhone == "" || destinationAddress == "" || destinationPostalCode == "" || len(items) == 0 {
		return nil, ErrInvalidShippingRequest
	}

	requestBody := map[string]any{
		"reference_id":              referenceID,
		"origin_contact_name":       service.config.OriginName,
		"origin_contact_phone":      sanitizePhoneNumber(service.config.OriginPhone),
		"origin_address":            service.config.OriginAddress,
		"origin_postal_code":        service.config.OriginPostalCode,
		"origin_area_id":            strings.TrimSpace(service.config.OriginAreaID),
		"destination_contact_name":  destinationContactName,
		"destination_contact_phone": destinationContactPhone,
		"destination_address":       destinationAddress,
		"destination_postal_code":   destinationPostalCode,
		"courier_company":           courierCompany,
		"courier_type":              courierType,
		"delivery_type":             "now",
		"items":                     items,
	}

	if strings.TrimSpace(service.config.OriginEmail) != "" {
		requestBody["origin_contact_email"] = strings.TrimSpace(service.config.OriginEmail)
	}
	if destinationAreaID != "" {
		requestBody["destination_area_id"] = destinationAreaID
	}
	if strings.TrimSpace(req.OrderNote) != "" {
		requestBody["order_note"] = strings.TrimSpace(req.OrderNote)
	}

	encodedBody, err := json.Marshal(requestBody)
	if err != nil {
		return nil, err
	}

	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodPost, service.config.BaseURL+"/v1/orders", bytes.NewReader(encodedBody))
	if err != nil {
		return nil, err
	}
	httpRequest.Header.Set("Authorization", service.config.APIKey)
	httpRequest.Header.Set("Content-Type", "application/json")

	httpResponse, err := service.client.Do(httpRequest)
	if err != nil {
		return nil, err
	}
	defer httpResponse.Body.Close()

	responseBody, err := io.ReadAll(httpResponse.Body)
	if err != nil {
		return nil, err
	}

	if httpResponse.StatusCode < http.StatusOK || httpResponse.StatusCode >= http.StatusMultipleChoices {
		return nil, parseBiteshipAPIError("create order request", httpResponse.StatusCode, responseBody)
	}

	var payload struct {
		ID             string `json:"id"`
		ReferenceID    string `json:"reference_id"`
		WaybillID      string `json:"waybill_id"`
		TrackingNumber string `json:"tracking_number"`
		Status         string `json:"status"`
		Courier        struct {
			Company   string `json:"company"`
			Type      string `json:"type"`
			WaybillID string `json:"waybill_id"`
		} `json:"courier"`
	}
	if err := json.Unmarshal(responseBody, &payload); err != nil {
		return nil, err
	}

	trackingNumber := strings.TrimSpace(payload.TrackingNumber)
	if trackingNumber == "" {
		trackingNumber = strings.TrimSpace(payload.WaybillID)
	}
	if trackingNumber == "" {
		trackingNumber = strings.TrimSpace(payload.Courier.WaybillID)
	}

	return &CreateShippingOrderResponse{
		OrderID:        strings.TrimSpace(payload.ID),
		ReferenceID:    firstNonEmptyString(strings.TrimSpace(payload.ReferenceID), referenceID),
		TrackingNumber: trackingNumber,
		ShippingStatus: normalizeShippingStatus(payload.Status),
		CourierCompany: firstNonEmptyString(strings.TrimSpace(payload.Courier.Company), courierCompany),
		CourierType:    firstNonEmptyString(strings.TrimSpace(payload.Courier.Type), courierType),
	}, nil
}

func (service *biteshipService) GetTrackingByWaybill(ctx context.Context, waybillID string, courierCode string) (*ShippingTrackingResponse, error) {
	waybillID = strings.TrimSpace(waybillID)
	courierCode = strings.ToLower(strings.TrimSpace(courierCode))
	if waybillID == "" || courierCode == "" {
		return nil, ErrInvalidTrackingRequest
	}
	if service.config.APIKey == "" {
		return nil, ErrBiteshipAPIKeyMissing
	}

	requestURL := fmt.Sprintf("%s/v1/trackings/%s/couriers/%s", service.config.BaseURL, url.PathEscape(waybillID), url.PathEscape(courierCode))
	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, err
	}
	httpRequest.Header.Set("Authorization", service.config.APIKey)

	httpResponse, err := service.client.Do(httpRequest)
	if err != nil {
		return nil, err
	}
	defer httpResponse.Body.Close()

	responseBody, err := io.ReadAll(httpResponse.Body)
	if err != nil {
		return nil, err
	}

	if httpResponse.StatusCode < http.StatusOK || httpResponse.StatusCode >= http.StatusMultipleChoices {
		return nil, parseBiteshipAPIError("tracking request", httpResponse.StatusCode, responseBody)
	}

	var payload struct {
		Tracking struct {
			Status         string `json:"status"`
			WaybillID      string `json:"waybill_id"`
			TrackingNumber string `json:"tracking_number"`
			History        []struct {
				Status    string `json:"status"`
				Note      string `json:"note"`
				UpdatedAt string `json:"updated_at"`
				EventDate string `json:"event_date"`
				EventTime string `json:"event_time"`
			} `json:"history"`
		} `json:"tracking"`
		Status string `json:"status"`
	}
	if err := json.Unmarshal(responseBody, &payload); err != nil {
		return nil, err
	}

	events := make([]ShippingTrackingEvent, 0, len(payload.Tracking.History))
	for _, history := range payload.Tracking.History {
		updatedAt := strings.TrimSpace(history.UpdatedAt)
		if updatedAt == "" {
			updatedAt = strings.TrimSpace(strings.TrimSpace(history.EventDate) + " " + strings.TrimSpace(history.EventTime))
		}

		events = append(events, ShippingTrackingEvent{
			Status:      normalizeShippingStatus(history.Status),
			Description: strings.TrimSpace(history.Note),
			UpdatedAt:   strings.TrimSpace(updatedAt),
		})
	}

	rawStatus := firstNonEmptyString(strings.TrimSpace(payload.Tracking.Status), strings.TrimSpace(payload.Status))
	trackingNumber := firstNonEmptyString(strings.TrimSpace(payload.Tracking.TrackingNumber), strings.TrimSpace(payload.Tracking.WaybillID), waybillID)

	return &ShippingTrackingResponse{
		TrackingNumber: trackingNumber,
		ShippingStatus: normalizeShippingStatus(rawStatus),
		RawStatus:      rawStatus,
		Events:         events,
	}, nil
}

func (service *biteshipService) GetOrderByID(ctx context.Context, orderID string) (*ShippingOrderResponse, error) {
	orderID = strings.TrimSpace(orderID)
	if orderID == "" {
		return nil, ErrInvalidTrackingRequest
	}
	if service.config.APIKey == "" {
		return nil, ErrBiteshipAPIKeyMissing
	}

	requestURL := fmt.Sprintf("%s/v1/orders/%s", service.config.BaseURL, url.PathEscape(orderID))
	httpRequest, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, err
	}
	httpRequest.Header.Set("Authorization", service.config.APIKey)

	httpResponse, err := service.client.Do(httpRequest)
	if err != nil {
		return nil, err
	}
	defer httpResponse.Body.Close()

	responseBody, err := io.ReadAll(httpResponse.Body)
	if err != nil {
		return nil, err
	}

	if httpResponse.StatusCode < http.StatusOK || httpResponse.StatusCode >= http.StatusMultipleChoices {
		return nil, parseBiteshipAPIError("get order request", httpResponse.StatusCode, responseBody)
	}

	var payload struct {
		ID          string `json:"id"`
		ReferenceID string `json:"reference_id"`
		Status      string `json:"status"`
		Courier     struct {
			WaybillID string `json:"waybill_id"`
			Company   string `json:"company"`
			Type      string `json:"type"`
		} `json:"courier"`
	}
	if err := json.Unmarshal(responseBody, &payload); err != nil {
		return nil, err
	}

	rawStatus := strings.TrimSpace(payload.Status)

	return &ShippingOrderResponse{
		OrderID:        firstNonEmptyString(strings.TrimSpace(payload.ID), orderID),
		ReferenceID:    strings.TrimSpace(payload.ReferenceID),
		TrackingNumber: strings.TrimSpace(payload.Courier.WaybillID),
		ShippingStatus: normalizeShippingStatus(rawStatus),
		RawStatus:      rawStatus,
		CourierCompany: strings.TrimSpace(payload.Courier.Company),
		CourierType:    strings.TrimSpace(payload.Courier.Type),
	}, nil
}

func normalizeBiteshipCouriers(couriers string) string {
	trimmed := strings.TrimSpace(strings.ToLower(couriers))
	if trimmed == "" {
		return "jne,sicepat,jnt,anteraja,ninja,tiki,pos"
	}

	parts := strings.FieldsFunc(trimmed, func(r rune) bool {
		return r == ',' || r == ':' || r == ';' || r == ' '
	})
	if len(parts) == 0 {
		return ""
	}

	unique := make(map[string]struct{}, len(parts))
	ordered := make([]string, 0, len(parts))
	for _, part := range parts {
		value := strings.TrimSpace(part)
		if value == "" {
			continue
		}
		if _, exists := unique[value]; exists {
			continue
		}
		unique[value] = struct{}{}
		ordered = append(ordered, value)
	}

	return strings.Join(ordered, ",")
}

func normalizeShippingItems(items []ShippingRateItem) []ShippingRateItem {
	normalized := make([]ShippingRateItem, 0, len(items))
	for _, item := range items {
		value := item.Value
		if value <= 0 {
			value = 1
		}

		normalized = append(normalized, ShippingRateItem{
			Name:        strings.TrimSpace(item.Name),
			Description: strings.TrimSpace(item.Description),
			Value:       value,
			Length:      maxInt(item.Length, 1),
			Width:       maxInt(item.Width, 1),
			Height:      maxInt(item.Height, 1),
			Weight:      maxInt(item.Weight, 1),
			Quantity:    maxInt(item.Quantity, 1),
		})
	}
	return normalized
}

func normalizeOrderItems(items []ShippingOrderItem) []ShippingOrderItem {
	normalized := make([]ShippingOrderItem, 0, len(items))
	for _, item := range items {
		value := item.Value
		if value <= 0 {
			value = 1
		}

		normalized = append(normalized, ShippingOrderItem{
			Name:        strings.TrimSpace(item.Name),
			Description: strings.TrimSpace(item.Description),
			Value:       value,
			Length:      maxInt(item.Length, 1),
			Width:       maxInt(item.Width, 1),
			Height:      maxInt(item.Height, 1),
			Weight:      maxInt(item.Weight, 1),
			Quantity:    maxInt(item.Quantity, 1),
		})
	}

	return normalized
}

func sanitizePhoneNumber(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return ""
	}

	builder := strings.Builder{}
	for index, runeValue := range trimmed {
		if runeValue >= '0' && runeValue <= '9' {
			builder.WriteRune(runeValue)
			continue
		}

		if runeValue == '+' && index == 0 {
			builder.WriteRune(runeValue)
		}
	}

	return builder.String()
}

func firstNonEmptyString(values ...string) string {
	for _, value := range values {
		trimmed := strings.TrimSpace(value)
		if trimmed != "" {
			return trimmed
		}
	}

	return ""
}

func normalizeShippingStatus(value string) string {
	status := strings.ToLower(strings.TrimSpace(value))
	switch status {
	case "confirmed", "booked", "scheduled", "allocated", "ready", "ready_to_ship":
		return "booked"
	case "picked", "picked_up":
		return "picked"
	case "picking_up", "pickup":
		return "picking_up"
	case "dropping_off", "in_transit", "on_going", "on_delivery":
		return "in_transit"
	case "delivered":
		return "delivered"
	case "cancelled", "canceled", "rejected", "failed", "courier_not_found":
		return "failed"
	case "pending", "":
		return "pending"
	default:
		return status
	}
}

func buildRatesCacheKey(originAreaID string, destinationAreaID string, couriers string, items []ShippingRateItem) (string, error) {
	sortedItems := make([]ShippingRateItem, len(items))
	copy(sortedItems, items)
	sort.Slice(sortedItems, func(i, j int) bool {
		left := sortedItems[i]
		right := sortedItems[j]
		if left.Name != right.Name {
			return left.Name < right.Name
		}
		if left.Weight != right.Weight {
			return left.Weight < right.Weight
		}
		return left.Quantity < right.Quantity
	})

	encodedItems, err := json.Marshal(sortedItems)
	if err != nil {
		return "", err
	}

	hasher := sha1.New()
	_, _ = hasher.Write([]byte(originAreaID))
	_, _ = hasher.Write([]byte("|"))
	_, _ = hasher.Write([]byte(destinationAreaID))
	_, _ = hasher.Write([]byte("|"))
	_, _ = hasher.Write([]byte(couriers))
	_, _ = hasher.Write([]byte("|"))
	_, _ = hasher.Write(encodedItems)
	return hex.EncodeToString(hasher.Sum(nil)), nil
}

func (service *biteshipService) getDestinationFromCache(key string) *ShippingDestination {
	service.cacheMu.RLock()
	item, ok := service.destinationCache[key]
	service.cacheMu.RUnlock()
	if !ok || time.Now().After(item.expiresAt) {
		return nil
	}

	copied := *item.value
	return &copied
}

func (service *biteshipService) setDestinationCache(key string, value *ShippingDestination, ttl time.Duration) {
	service.cacheMu.Lock()
	service.destinationCache[key] = destinationCacheItem{value: value, expiresAt: time.Now().Add(ttl)}
	service.cacheMu.Unlock()
}

func (service *biteshipService) getRatesFromCache(key string) *ShippingRatesResponse {
	service.cacheMu.RLock()
	item, ok := service.shippingRatesCache[key]
	service.cacheMu.RUnlock()
	if !ok || time.Now().After(item.expiresAt) {
		return nil
	}

	ratesCopy := make([]ShippingRate, len(item.value.Rates))
	copy(ratesCopy, item.value.Rates)
	return &ShippingRatesResponse{Rates: ratesCopy}
}

func (service *biteshipService) setRatesCache(key string, value *ShippingRatesResponse, ttl time.Duration) {
	if value == nil {
		return
	}

	ratesCopy := make([]ShippingRate, len(value.Rates))
	copy(ratesCopy, value.Rates)

	service.cacheMu.Lock()
	service.shippingRatesCache[key] = ratesCacheItem{value: &ShippingRatesResponse{Rates: ratesCopy}, expiresAt: time.Now().Add(ttl)}
	service.cacheMu.Unlock()
}

func toIntegerAmount(value float64) int64 {
	if value <= 0 {
		return 1
	}
	return int64(value + 0.5)
}

func formatItemDescription(base string, size string, color string) string {
	parts := make([]string, 0, 3)
	if strings.TrimSpace(base) != "" {
		parts = append(parts, strings.TrimSpace(base))
	}
	if strings.TrimSpace(size) != "" {
		parts = append(parts, "size "+strings.TrimSpace(size))
	}
	if strings.TrimSpace(color) != "" {
		parts = append(parts, "color "+strings.TrimSpace(color))
	}
	return strings.Join(parts, ", ")
}
