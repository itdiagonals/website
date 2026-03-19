package domain

import "time"

type Transaction struct {
	ID                uint    `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	OrderID           string  `json:"order_id" gorm:"column:order_id;type:varchar(100);uniqueIndex;not null"`
	CustomerID        uint    `json:"customer_id" gorm:"column:customer_id;not null;index"`
	ShippingAddressID uint    `json:"shipping_address_id" gorm:"column:shipping_address_id;index"`
	TotalAmount       float64 `json:"total_amount" gorm:"column:total_amount;type:numeric(15,2);not null"`
	ShippingCost      float64 `json:"shipping_cost" gorm:"column:shipping_cost;type:numeric(15,2);not null;default:0"`
	CourierName       string  `json:"courier_name" gorm:"column:courier_name;type:varchar(100);not null"`
	CourierService    string  `json:"courier_service" gorm:"column:courier_service;type:varchar(100);not null"`
	TrackingNumber    string  `json:"tracking_number" gorm:"column:tracking_number;type:varchar(100)"`
	// Status stores the payment status, for example: pending, paid, failed.
	Status         string    `json:"status" gorm:"column:status;type:varchar(50);not null"`
	ShippingStatus string    `json:"shipping_status" gorm:"column:shipping_status;type:varchar(50);not null;default:'pending'"`
	SnapToken      string    `json:"snap_token" gorm:"column:snap_token;type:text"`
	CreatedAt      time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt      time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`

	Customer        Customer          `json:"customer,omitempty" gorm:"foreignKey:CustomerID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	ShippingAddress CustomerAddress   `json:"shipping_address,omitempty" gorm:"foreignKey:ShippingAddressID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Items           []TransactionItem `json:"items,omitempty" gorm:"foreignKey:TransactionID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (Transaction) TableName() string {
	return "transactions"
}
