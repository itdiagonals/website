package service

import "testing"

func TestParseBiteshipAPIError(t *testing.T) {
	err := parseBiteshipAPIError("tracking request", 400, []byte(`{"success":false,"error":"Data is not found","code":40003003}`))

	apiErr, ok := err.(*BiteshipAPIError)
	if !ok || apiErr == nil {
		t.Fatalf("expected BiteshipAPIError")
	}

	if apiErr.ProviderCode != "40003003" {
		t.Fatalf("expected provider code 40003003, got %q", apiErr.ProviderCode)
	}

	if !IsBiteshipErrorCode(err, "40003003") {
		t.Fatalf("expected error code match")
	}
}
