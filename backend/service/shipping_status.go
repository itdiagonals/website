package service

import "strings"

var shippingStatusRank = map[string]int{
	"pending":    0,
	"packed":     1,
	"booked":     2,
	"picking_up": 3,
	"picked":     4,
	"in_transit": 5,
	"delivered":  6,
	"failed":     6,
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
