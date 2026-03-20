package service

import "testing"

func TestNormalizeShippingStatus(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{name: "confirmed maps to booked", input: "confirmed", expected: "booked"},
		{name: "allocated maps to booked", input: "allocated", expected: "booked"},
		{name: "picked stays picked", input: "picked", expected: "picked"},
		{name: "in transit maps to in_transit", input: "in_transit", expected: "in_transit"},
		{name: "on delivery maps to in_transit", input: "on_delivery", expected: "in_transit"},
		{name: "delivered stays delivered", input: "delivered", expected: "delivered"},
		{name: "cancelled maps failed", input: "cancelled", expected: "failed"},
		{name: "empty maps pending", input: "", expected: "pending"},
		{name: "unknown lowercased", input: "CUSTOM_STATUS", expected: "custom_status"},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			actual := normalizeShippingStatus(testCase.input)
			if actual != testCase.expected {
				t.Fatalf("expected %q but got %q", testCase.expected, actual)
			}
		})
	}
}

func TestSanitizePhoneNumber(t *testing.T) {
	testCases := []struct {
		name     string
		input    string
		expected string
	}{
		{name: "remove spaces and symbols", input: "0812-3456 7890", expected: "081234567890"},
		{name: "keep leading plus", input: "+62 812 3333", expected: "+628123333"},
		{name: "strip non numeric body", input: "+62(812)ABC", expected: "+62812"},
		{name: "empty remains empty", input: "", expected: ""},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			actual := sanitizePhoneNumber(testCase.input)
			if actual != testCase.expected {
				t.Fatalf("expected %q but got %q", testCase.expected, actual)
			}
		})
	}
}
