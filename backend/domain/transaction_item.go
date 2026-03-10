package domain

import "time"

type TransactionItem struct {
	ID            uint      `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	TransactionID uint      `json:"transaction_id" gorm:"column:transaction_id;not null;index"`
	ProductID     int       `json:"product_id" gorm:"column:product_id;not null;index"`
	Quantity      int       `json:"quantity" gorm:"column:quantity;not null"`
	Price         float64   `json:"price" gorm:"column:price;type:numeric(15,2);not null"`
	CreatedAt     time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`

	Transaction Transaction `json:"transaction,omitempty" gorm:"foreignKey:TransactionID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (TransactionItem) TableName() string {
	return "transaction_items"
}
