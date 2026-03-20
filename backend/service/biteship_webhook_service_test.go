package service

import "testing"

func TestGetPayloadString(t *testing.T) {
	payload := map[string]any{
		"id":      "  abc123  ",
		"waybill": []byte("  WB1234  "),
	}

	if actual := getPayloadString(payload, "id"); actual != "abc123" {
		t.Fatalf("expected trimmed string, got %q", actual)
	}

	if actual := getPayloadString(payload, "waybill"); actual != "WB1234" {
		t.Fatalf("expected []byte to string conversion, got %q", actual)
	}

	if actual := getPayloadString(payload, "missing"); actual != "" {
		t.Fatalf("expected empty for missing key, got %q", actual)
	}
}

func TestGetNestedPayloadString(t *testing.T) {
	payload := map[string]any{
		"data": map[string]any{
			"status": " delivered ",
		},
	}

	if actual := getNestedPayloadString(payload, "data", "status"); actual != "delivered" {
		t.Fatalf("expected nested value, got %q", actual)
	}

	if actual := getNestedPayloadString(payload, "missing", "status"); actual != "" {
		t.Fatalf("expected empty for missing object, got %q", actual)
	}
}
