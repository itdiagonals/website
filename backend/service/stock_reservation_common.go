package service

import "time"

const (
	stockReservationStatusReserved = "reserved"
	stockReservationStatusConsumed = "consumed"
	stockReservationStatusReleased = "released"
	stockReservationTTL            = 3 * time.Hour
)

type stockReservationItem struct {
	ProductID         int
	SelectedSize      string
	SelectedColorName string
	SelectedColorHex  string
	Quantity          int
}
