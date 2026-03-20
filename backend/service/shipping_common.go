package service

import "errors"

var ErrInvalidShippingRequest = errors.New("invalid shipping request")

func maxInt(value int, fallback int) int {
	if value > 0 {
		return value
	}
	return fallback
}
