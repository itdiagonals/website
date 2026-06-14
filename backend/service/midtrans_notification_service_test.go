package service

import "testing"

func TestMapMidtransStatus(t *testing.T) {
	cases := []struct {
		name       string
		txStatus   string
		fraud      string
		want       string
		wantErr    bool
	}{
		{"settlement is paid", "settlement", "", "paid", false},
		{"capture accept is paid", "capture", "accept", "paid", false},
		{"capture challenge is pending", "capture", "challenge", "pending", false},
		{"capture deny is not paid", "capture", "deny", "pending", false},
		{"capture unknown fraud is not paid", "capture", "weird", "pending", false},
		{"capture empty fraud is not paid", "capture", "", "pending", false},
		{"pending stays pending", "pending", "", "pending", false},
		{"deny is failed", "deny", "", "failed", false},
		{"cancel is failed", "cancel", "", "failed", false},
		{"expire is failed", "expire", "", "failed", false},
		{"failure is failed", "failure", "", "failed", false},
		{"refund is refunded", "refund", "", "refunded", false},
		{"partial refund is refunded", "partial_refund", "", "refunded", false},
		{"unknown status errors", "something", "", "", true},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := mapMidtransStatus(tc.txStatus, tc.fraud)
			if tc.wantErr {
				if err == nil {
					t.Fatalf("expected error for status=%q fraud=%q", tc.txStatus, tc.fraud)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tc.want {
				t.Fatalf("status=%q fraud=%q: got %q, want %q", tc.txStatus, tc.fraud, got, tc.want)
			}
		})
	}
}
