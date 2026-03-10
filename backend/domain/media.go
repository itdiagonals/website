package domain

type Media struct {
	ID       int    `json:"id" gorm:"column:id;primaryKey"`
	Alt      string `json:"alt" gorm:"column:alt"`
	Filename string `json:"filename" gorm:"column:filename"`
	URL      string `json:"url" gorm:"column:url"`
}

func (Media) TableName() string {
	return "media"
}
