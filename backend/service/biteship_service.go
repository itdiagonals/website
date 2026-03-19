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

type ShippingService interface {
	GetShippingRates(ctx context.Context, originAreaID string, destinationAreaID string, items []ShippingRateItem, couriers string) (*ShippingRatesResponse, error)
	LookupDestination(ctx context.Context, input string) (*ShippingDestination, error)
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
		return nil, fmt.Errorf("biteship maps request failed: status %d body %s", response.StatusCode, strings.TrimSpace(string(responseBody)))
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
		return nil, fmt.Errorf("biteship rates request failed: status %d body %s", response.StatusCode, strings.TrimSpace(string(responseBody)))
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
