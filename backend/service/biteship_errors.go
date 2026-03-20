package service

import (
	"encoding/json"
	"fmt"
	"strings"
)

type BiteshipAPIError struct {
	Operation    string
	HTTPStatus   int
	ProviderCode string
	ProviderErr  string
	Body         string
}

func (err *BiteshipAPIError) Error() string {
	providerCode := strings.TrimSpace(err.ProviderCode)
	providerErr := strings.TrimSpace(err.ProviderErr)
	body := strings.TrimSpace(err.Body)

	if providerCode != "" || providerErr != "" {
		return fmt.Sprintf("biteship %s failed: status %d code %s error %s", err.Operation, err.HTTPStatus, providerCode, providerErr)
	}
	return fmt.Sprintf("biteship %s failed: status %d body %s", err.Operation, err.HTTPStatus, body)
}

func IsBiteshipErrorCode(err error, providerCode string) bool {
	apiError, ok := err.(*BiteshipAPIError)
	if !ok || apiError == nil {
		return false
	}

	return strings.EqualFold(strings.TrimSpace(apiError.ProviderCode), strings.TrimSpace(providerCode))
}

func parseBiteshipAPIError(operation string, statusCode int, responseBody []byte) error {
	body := strings.TrimSpace(string(responseBody))
	apiError := &BiteshipAPIError{
		Operation:  strings.TrimSpace(operation),
		HTTPStatus: statusCode,
		Body:       body,
	}

	var payload struct {
		Code    any    `json:"code"`
		Error   string `json:"error"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal(responseBody, &payload); err != nil {
		return apiError
	}

	apiError.ProviderCode = normalizeProviderCode(payload.Code)
	apiError.ProviderErr = strings.TrimSpace(firstNonEmptyString(payload.Error, payload.Message))
	return apiError
}

func normalizeProviderCode(value any) string {
	switch typed := value.(type) {
	case nil:
		return ""
	case string:
		return strings.TrimSpace(typed)
	case float64:
		if typed == float64(int64(typed)) {
			return fmt.Sprintf("%d", int64(typed))
		}
		return strings.TrimSpace(fmt.Sprintf("%f", typed))
	default:
		return strings.TrimSpace(fmt.Sprint(typed))
	}
}
