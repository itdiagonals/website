package service

type ShippingRate struct {
	CourierName              string   `json:"courier_name"`
	CourierCode              string   `json:"courier_code"`
	ServiceName              string   `json:"service_name"`
	ServiceCode              string   `json:"service_code"`
	Price                    float64  `json:"price"`
	EstimatedDays            string   `json:"estimated_days,omitempty"`
	EstimatedRange           string   `json:"estimated_range,omitempty"`
	AvailableCollectionTypes []string `json:"available_collection_types,omitempty"`
	ShippingFee              float64  `json:"shipping_fee,omitempty"`
	InsuranceFee             float64  `json:"insurance_fee,omitempty"`
	CashOnDeliveryFee        float64  `json:"cash_on_delivery_fee,omitempty"`
}

type ShippingRatesResponse struct {
	Rates []ShippingRate `json:"rates"`
}

type ShippingDestination struct {
	ID    string `json:"id"`
	Label string `json:"label"`
}

type ShippingRateItem struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Value       int64  `json:"value"`
	Length      int    `json:"length"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	Weight      int    `json:"weight"`
	Quantity    int    `json:"quantity"`
}
