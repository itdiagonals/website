package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/itdiagonals/website/backend/config"
)

var ErrInvalidShippingRequest = errors.New("invalid shipping request")

type RajaOngkirRate struct {
	CourierName    string  `json:"courier_name"`
	CourierCode    string  `json:"courier_code"`
	ServiceName    string  `json:"service_name"`
	ServiceCode    string  `json:"service_code"`
	Price          float64 `json:"price"`
	EstimatedDays  string  `json:"estimated_days,omitempty"`
	EstimatedRange string  `json:"estimated_range,omitempty"`
}

type RajaOngkirRateResponse struct {
	Rates []RajaOngkirRate `json:"rates"`
}

type RajaOngkirDestination struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

type RajaOngkirService interface {
	GetShippingRates(ctx context.Context, originID string, destinationID string, weight int, couriers string) (*RajaOngkirRateResponse, error)
	LookupDestination(ctx context.Context, input string) (*RajaOngkirDestination, error)
}

type rajaOngkirService struct {
	client *http.Client
	config config.RajaOngkirConfig
}

func NewRajaOngkirService() RajaOngkirService {
	return &rajaOngkirService{
		client: &http.Client{Timeout: 15 * time.Second},
		config: config.GetRajaOngkirConfig(),
	}
}

func (service *rajaOngkirService) GetShippingRates(ctx context.Context, originID string, destinationID string, weight int, couriers string) (*RajaOngkirRateResponse, error) {
	originID = strings.TrimSpace(originID)
	destinationID = strings.TrimSpace(destinationID)
	courierList := normalizeRajaOngkirCouriers(couriers)

	if originID == "" || destinationID == "" || courierList == "" || weight <= 0 {
		return nil, ErrInvalidShippingRequest
	}

	if strings.TrimSpace(service.config.APIKey) == "" {
		return nil, errors.New("RAJAONGKIR_API_KEY is not set")
	}

	form := url.Values{}
	form.Set("origin", originID)
	form.Set("destination", destinationID)
	form.Set("weight", strconv.Itoa(weight))
	form.Set("courier", courierList)
	form.Set("price", "lowest")

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, service.config.BaseURL+"/calculate/domestic-cost", strings.NewReader(form.Encode()))
	if err != nil {
		return nil, err
	}

	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	request.Header.Set("key", service.config.APIKey)

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
		return nil, fmt.Errorf("rajaongkir cost request failed: status %d body %s", response.StatusCode, strings.TrimSpace(string(responseBody)))
	}

	var envelope map[string]any
	if err := json.Unmarshal(responseBody, &envelope); err != nil {
		return nil, err
	}

	rateItems := extractArray(envelope, "data", "results")
	rates := make([]RajaOngkirRate, 0, len(rateItems))
	for _, rateItem := range rateItems {
		rateMap, ok := rateItem.(map[string]any)
		if !ok {
			continue
		}

		price := firstNumber(rateMap, "cost", "price", "value")
		serviceCode := firstString(rateMap, "service", "service_code", "service_type")
		serviceName := firstString(rateMap, "description", "service_name", "service")
		estimated := firstString(rateMap, "etd", "estimate", "estimated_days")

		rates = append(rates, RajaOngkirRate{
			CourierName:    firstString(rateMap, "name", "courier_name", "shipping_name"),
			CourierCode:    strings.ToLower(firstString(rateMap, "code", "courier_code", "shipping_code")),
			ServiceName:    serviceName,
			ServiceCode:    strings.ToLower(serviceCode),
			Price:          price,
			EstimatedDays:  estimated,
			EstimatedRange: estimated,
		})
	}

	return &RajaOngkirRateResponse{Rates: rates}, nil
}

func (service *rajaOngkirService) LookupDestination(ctx context.Context, input string) (*RajaOngkirDestination, error) {
	query := strings.TrimSpace(input)
	if query == "" {
		return nil, ErrInvalidShippingRequest
	}

	if strings.TrimSpace(service.config.APIKey) == "" {
		return nil, errors.New("RAJAONGKIR_API_KEY is not set")
	}

	requestURL := fmt.Sprintf("%s/destination/domestic-destination?search=%s&limit=1&offset=0", service.config.BaseURL, url.QueryEscape(query))
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return nil, err
	}

	request.Header.Set("key", service.config.APIKey)

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
		return nil, fmt.Errorf("rajaongkir destination request failed: status %d body %s", response.StatusCode, strings.TrimSpace(string(responseBody)))
	}

	var envelope map[string]any
	if err := json.Unmarshal(responseBody, &envelope); err != nil {
		return nil, err
	}

	destinationItems := extractArray(envelope, "data", "results")
	if len(destinationItems) == 0 {
		return nil, errors.New("rajaongkir destination returned no matching result")
	}

	destinationMap, ok := destinationItems[0].(map[string]any)
	if !ok {
		return nil, errors.New("rajaongkir destination response format is invalid")
	}

	destination := &RajaOngkirDestination{
		ID:    firstString(destinationMap, "id"),
		Label: firstString(destinationMap, "label", "subdistrict_name", "district_name", "city_name"),
	}
	if destination.ID == "" {
		return nil, errors.New("rajaongkir destination returned no id")
	}

	return destination, nil
}

func normalizeRajaOngkirCouriers(couriers string) string {
	trimmed := strings.TrimSpace(strings.ToLower(couriers))
	trimmed = strings.ReplaceAll(trimmed, ",", ":")
	trimmed = strings.ReplaceAll(trimmed, " ", "")
	return trimmed
}

func extractArray(payload map[string]any, keys ...string) []any {
	for _, key := range keys {
		value, ok := payload[key]
		if !ok {
			continue
		}
		arrayValue, ok := value.([]any)
		if ok {
			return arrayValue
		}
	}
	return nil
}

func firstString(payload map[string]any, keys ...string) string {
	for _, key := range keys {
		value, ok := payload[key]
		if !ok || value == nil {
			continue
		}
		switch typed := value.(type) {
		case string:
			if strings.TrimSpace(typed) != "" {
				return strings.TrimSpace(typed)
			}
		case float64:
			return strconv.FormatInt(int64(typed), 10)
		}
	}
	return ""
}

func firstNumber(payload map[string]any, keys ...string) float64 {
	for _, key := range keys {
		value, ok := payload[key]
		if !ok || value == nil {
			continue
		}
		switch typed := value.(type) {
		case float64:
			return typed
		case int:
			return float64(typed)
		case string:
			parsed, err := strconv.ParseFloat(strings.TrimSpace(typed), 64)
			if err == nil {
				return parsed
			}
		}
	}
	return 0
}
