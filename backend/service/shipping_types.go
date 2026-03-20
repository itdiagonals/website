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

type ShippingOrderItem struct {
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	Value       int64  `json:"value"`
	Length      int    `json:"length"`
	Width       int    `json:"width"`
	Height      int    `json:"height"`
	Weight      int    `json:"weight"`
	Quantity    int    `json:"quantity"`
}

type CreateShippingOrderRequest struct {
	ReferenceID             string              `json:"reference_id"`
	CourierCompany          string              `json:"courier_company"`
	CourierType             string              `json:"courier_type"`
	DestinationContactName  string              `json:"destination_contact_name"`
	DestinationContactPhone string              `json:"destination_contact_phone"`
	DestinationAddress      string              `json:"destination_address"`
	DestinationPostalCode   string              `json:"destination_postal_code"`
	DestinationAreaID       string              `json:"destination_area_id,omitempty"`
	OrderNote               string              `json:"order_note,omitempty"`
	Items                   []ShippingOrderItem `json:"items"`
}

type CreateShippingOrderResponse struct {
	OrderID        string `json:"order_id"`
	ReferenceID    string `json:"reference_id,omitempty"`
	TrackingNumber string `json:"tracking_number,omitempty"`
	ShippingStatus string `json:"shipping_status,omitempty"`
	CourierCompany string `json:"courier_company,omitempty"`
	CourierType    string `json:"courier_type,omitempty"`
}

type ShippingTrackingEvent struct {
	Status      string `json:"status"`
	Description string `json:"description,omitempty"`
	UpdatedAt   string `json:"updated_at,omitempty"`
}

type ShippingTrackingResponse struct {
	TrackingNumber string                  `json:"tracking_number,omitempty"`
	ShippingStatus string                  `json:"shipping_status,omitempty"`
	RawStatus      string                  `json:"raw_status,omitempty"`
	Events         []ShippingTrackingEvent `json:"events,omitempty"`
}

type ShippingOrderResponse struct {
	OrderID        string `json:"order_id,omitempty"`
	ReferenceID    string `json:"reference_id,omitempty"`
	TrackingNumber string `json:"tracking_number,omitempty"`
	ShippingStatus string `json:"shipping_status,omitempty"`
	RawStatus      string `json:"raw_status,omitempty"`
	CourierCompany string `json:"courier_company,omitempty"`
	CourierType    string `json:"courier_type,omitempty"`
}
