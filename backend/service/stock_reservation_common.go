package service

const (
	stockReservationStatusReserved = "reserved"
	stockReservationStatusConsumed = "consumed"
	stockReservationStatusReleased = "released"
)

type stockReservationItem struct {
	ProductID int
	Quantity  int
}
