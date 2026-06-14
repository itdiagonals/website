package utils

import "testing"

func TestValidateSecretStrength(t *testing.T) {
	const validSecret = "9f8c1d2e3a4b5c6d7e8f9a0b1c2d3e4f"

	cases := []struct {
		name    string
		secret  string
		wantErr bool
	}{
		{"empty", "", true},
		{"too short", "short", true},
		{"known weak", "supersecret", true},
		{"example placeholder refresh", "CHANGE_ME_generate_a_32_byte_random_secret_for_refresh", true},
		{"example placeholder access", "CHANGE_ME_generate_a_32_byte_random_secret_for_access", true},
		{"example placeholder csrf", "CHANGE_ME_generate_a_32_byte_random_secret_for_csrf", true},
		{"change_me lowercase", "change_me_this_is_a_long_enough_placeholder_value", true},
		{"valid high entropy", validSecret, false},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			err := ValidateSecretStrength("TEST_SECRET", tc.secret)
			if tc.wantErr && err == nil {
				t.Fatalf("expected error for %q, got nil", tc.secret)
			}
			if !tc.wantErr && err != nil {
				t.Fatalf("expected no error for %q, got %v", tc.secret, err)
			}
		})
	}
}
