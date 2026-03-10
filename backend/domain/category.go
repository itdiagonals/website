package domain

type Category struct {
	ID   int    `json:"id" gorm:"column:id;primaryKey"`
	Name string `json:"name" gorm:"column:name"`
	Slug string `json:"slug" gorm:"column:slug"`
}

func (Category) TableName() string {
	return "categories"
}
