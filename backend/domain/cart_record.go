package domain

import "time"

type CartRecord struct {
	ID         uint             `gorm:"column:id;primaryKey;autoIncrement"`
	CustomerID uint             `gorm:"column:customer_id;not null;uniqueIndex"`
	CreatedAt  time.Time        `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt  time.Time        `gorm:"column:updated_at;autoUpdateTime"`
	Items      []CartItemRecord `gorm:"foreignKey:CartID;references:ID"`
}

func (CartRecord) TableName() string {
	return "carts"
}

type CartItemRecord struct {
	ID                uint      `gorm:"column:id;primaryKey;autoIncrement"`
	CartID            uint      `gorm:"column:cart_id;not null;index"`
	ProductID         int       `gorm:"column:product_id;not null;index"`
	ProductName       string    `gorm:"column:product_name_snapshot;type:varchar(255);not null"`
	Gender            string    `gorm:"column:gender_snapshot;type:varchar(50)"`
	ImageURL          string    `gorm:"column:image_url_snapshot;type:text"`
	BasePrice         float64   `gorm:"column:base_price_snapshot;type:numeric(15,2);not null"`
	Quantity          int       `gorm:"column:quantity;not null"`
	SelectedSize      string    `gorm:"column:selected_size;type:varchar(100);not null"`
	SelectedColorName string    `gorm:"column:selected_color_name;type:varchar(100);not null"`
	SelectedColorHex  string    `gorm:"column:selected_color_hex;type:varchar(20)"`
	CreatedAt         time.Time `gorm:"column:created_at;autoCreateTime"`
	UpdatedAt         time.Time `gorm:"column:updated_at;autoUpdateTime"`
}

func (CartItemRecord) TableName() string {
	return "cart_items"
}
