package service

import "testing"

func TestChooseLatestShippingStatus(t *testing.T) {
	testCases := []struct {
		name     string
		current  string
		incoming string
		expected string
	}{
		{name: "promote from booked to picked", current: "booked", incoming: "picked", expected: "picked"},
		{name: "prevent regression from delivered", current: "delivered", incoming: "picking_up", expected: "delivered"},
		{name: "unknown incoming accepted", current: "picked", incoming: "custom_status", expected: "custom_status"},
		{name: "empty incoming keeps current", current: "in_transit", incoming: "", expected: "in_transit"},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			actual := chooseLatestShippingStatus(testCase.current, testCase.incoming)
			if actual != testCase.expected {
				t.Fatalf("expected %q, got %q", testCase.expected, actual)
			}
		})
	}
}
