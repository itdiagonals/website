package service

const (
	stockReservationStatusReserved = "reserved"
	stockReservationStatusConsumed = "consumed"
	stockReservationStatusReleased = "released"
)

type stockReservationItem struct {
	ProductID         int
	SelectedSize      string
	SelectedColorName string
	SelectedColorHex  string
	Quantity          int
}
