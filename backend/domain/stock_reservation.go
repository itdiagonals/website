package domain

import "time"

type StockReservation struct {
	ID                uint      `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	OrderID           string    `json:"order_id" gorm:"column:order_id;type:varchar(100);not null;index"`
	ProductID         int       `json:"product_id" gorm:"column:product_id;not null;index"`
	SelectedSize      string    `json:"selected_size" gorm:"column:selected_size;type:varchar(100);not null"`
	SelectedColorName string    `json:"selected_color_name" gorm:"column:selected_color_name;type:varchar(100);not null"`
	Quantity          int       `json:"quantity" gorm:"column:quantity;not null"`
	Status            string    `json:"status" gorm:"column:status;type:varchar(20);not null;index"`
	CreatedAt         time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt         time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (StockReservation) TableName() string {
	return "stock_reservations"
}
