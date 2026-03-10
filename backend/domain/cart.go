package domain

type CartItem struct {
	ProductID         int     `json:"product_id"`
	ProductName       string  `json:"product_name"`
	Gender            string  `json:"gender"`
	ImageURL          string  `json:"image_url"`
	BasePrice         float64 `json:"base_price"`
	AvailableStock    int     `json:"available_stock"`
	StockSufficient   bool    `json:"stock_sufficient"`
	StockMessage      string  `json:"stock_message,omitempty"`
	Quantity          int     `json:"quantity"`
	Subtotal          float64 `json:"subtotal"`
	SelectedSize      string  `json:"selected_size"`
	SelectedColorName string  `json:"selected_color_name"`
	SelectedColorHex  string  `json:"selected_color_hex"`
}

type Cart struct {
	CustomerID uint       `json:"customer_id"`
	Items      []CartItem `json:"items"`
}
