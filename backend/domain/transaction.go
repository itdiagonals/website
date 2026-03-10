package domain

import "time"

type Transaction struct {
	ID          uint      `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	OrderID     string    `json:"order_id" gorm:"column:order_id;type:varchar(100);uniqueIndex;not null"`
	CustomerID  uint      `json:"customer_id" gorm:"column:customer_id;not null;index"`
	TotalAmount float64   `json:"total_amount" gorm:"column:total_amount;type:numeric(15,2);not null"`
	Status      string    `json:"status" gorm:"column:status;type:varchar(50);not null"`
	SnapToken   string    `json:"snap_token" gorm:"column:snap_token;type:text"`
	CreatedAt   time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`

	Customer Customer `json:"customer,omitempty" gorm:"foreignKey:CustomerID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
}

func (Transaction) TableName() string {
	return "transactions"
}
