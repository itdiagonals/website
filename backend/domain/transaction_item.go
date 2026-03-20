package domain

import "time"

type TransactionItem struct {
	ID               uint      `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	TransactionID    uint      `json:"transaction_id" gorm:"column:transaction_id;not null;index"`
	ProductID        int       `json:"product_id" gorm:"column:product_id;not null;index"`
	SelectedSize     string    `json:"selected_size" gorm:"column:selected_size;type:varchar(100);not null"`
	SelectedColor    string    `json:"selected_color_name" gorm:"column:selected_color_name;type:varchar(100);not null"`
	SelectedColorHex string    `json:"selected_color_hex" gorm:"column:selected_color_hex;type:varchar(20)"`
	Quantity         int       `json:"quantity" gorm:"column:quantity;not null"`
	Price            float64   `json:"price" gorm:"column:price;type:numeric(15,2);not null"`
	CreatedAt        time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`

	Transaction Transaction `json:"transaction,omitempty" gorm:"foreignKey:TransactionID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

func (TransactionItem) TableName() string {
	return "transaction_items"
}
