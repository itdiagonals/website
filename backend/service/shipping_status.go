package service

import "strings"

var shippingStatusRank = map[string]int{
	"pending":    0,
	"booked":     1,
	"picking_up": 2,
	"picked":     3,
	"in_transit": 4,
	"delivered":  5,
	"failed":     5,
}

func chooseLatestShippingStatus(current string, incoming string) string {
	current = normalizeShippingStatus(strings.TrimSpace(current))
	incoming = normalizeShippingStatus(strings.TrimSpace(incoming))

	if incoming == "" {
		return current
	}
	if current == "" {
		return incoming
	}
	if current == incoming {
		return current
	}

	currentRank, currentKnown := shippingStatusRank[current]
	incomingRank, incomingKnown := shippingStatusRank[incoming]

	if !currentKnown || !incomingKnown {
		return incoming
	}
	if incomingRank < currentRank {
		return current
	}

	return incoming
}
