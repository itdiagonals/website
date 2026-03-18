package repository

import (
	"context"

	"github.com/itdiagonals/website/backend/domain"
	"gorm.io/gorm"
)

type TransactionRepository interface {
	CreateWithItems(context context.Context, transaction *domain.Transaction, items []domain.TransactionItem) error
}

type transactionRepository struct {
	db *gorm.DB
}

func NewTransactionRepository(db *gorm.DB) TransactionRepository {
	return &transactionRepository{db: db}
}

func (repository *transactionRepository) CreateWithItems(context context.Context, transaction *domain.Transaction, items []domain.TransactionItem) error {
	return repository.db.WithContext(context).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(transaction).Error; err != nil {
			return err
		}

		for index := range items {
			items[index].TransactionID = transaction.ID
		}

		if len(items) == 0 {
			return nil
		}

		return tx.Create(&items).Error
	})
}
