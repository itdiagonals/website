package domain

import "time"

type BiteshipWebhookEvent struct {
	ID         uint      `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	EventKey   string    `json:"event_key" gorm:"column:event_key;type:varchar(80);not null;uniqueIndex"`
	EventType  string    `json:"event_type" gorm:"column:event_type;type:varchar(80);not null;index"`
	OrderID    string    `json:"order_id" gorm:"column:order_id;type:varchar(120);index"`
	Status     string    `json:"status" gorm:"column:status;type:varchar(80)"`
	WaybillID  string    `json:"waybill_id" gorm:"column:waybill_id;type:varchar(120)"`
	ReceivedAt time.Time `json:"received_at" gorm:"column:received_at;autoCreateTime"`
}

func (BiteshipWebhookEvent) TableName() string {
	return "biteship_webhook_events"
}
