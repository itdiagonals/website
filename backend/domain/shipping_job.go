package domain

import "time"

type ShippingJob struct {
	ID          uint       `json:"id" gorm:"column:id;primaryKey;autoIncrement"`
	JobType     string     `json:"job_type" gorm:"column:job_type;type:varchar(50);not null"`
	OrderID     string     `json:"order_id" gorm:"column:order_id;type:varchar(120);not null"`
	Status      string     `json:"status" gorm:"column:status;type:varchar(30);not null;index"`
	Attempts    int        `json:"attempts" gorm:"column:attempts;not null;default:0"`
	MaxAttempts int        `json:"max_attempts" gorm:"column:max_attempts;not null;default:8"`
	NextRunAt   time.Time  `json:"next_run_at" gorm:"column:next_run_at;not null;index"`
	LockedAt    *time.Time `json:"locked_at" gorm:"column:locked_at"`
	LastError   string     `json:"last_error" gorm:"column:last_error;type:text"`
	CreatedAt   time.Time  `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	UpdatedAt   time.Time  `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
}

func (ShippingJob) TableName() string {
	return "shipping_jobs"
}
