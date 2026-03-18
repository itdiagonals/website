package domain

type Wilayah struct {
	Code       string  `json:"code" gorm:"column:kode;primaryKey;type:varchar(13)"`
	Name       string  `json:"name" gorm:"column:nama;type:varchar(255);not null;index"`
	Level      string  `json:"level" gorm:"column:level;type:varchar(20);not null;index"`
	ParentCode *string `json:"parent_code,omitempty" gorm:"column:parent_code;type:varchar(13);index"`
}

func (Wilayah) TableName() string {
	return "wilayah"
}
