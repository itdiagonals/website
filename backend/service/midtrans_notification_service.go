package service

import (
	"context"
	"crypto/sha512"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/itdiagonals/website/backend/config"
	"github.com/itdiagonals/website/backend/repository"
	"gorm.io/gorm"
)

var (
	ErrMidtransInvalidSignature = errors.New("invalid midtrans signature")
	ErrMidtransInvalidPayload   = errors.New("invalid midtrans notification payload")
	ErrMidtransServerKeyMissing = errors.New("MIDTRANS_SERVER_KEY is not set")
	ErrMidtransOrderNotFound    = errors.New("transaction order not found")
	ErrMidtransUnknownStatus    = errors.New("unknown midtrans transaction status")
	ErrMidtransAmountMismatch   = errors.New("midtrans gross amount mismatch")
)

type MidtransNotification struct {
	OrderID           string
	StatusCode        string
	GrossAmount       string
	SignatureKey      string
	TransactionStatus string
	FraudStatus       string
	TransactionID     string
	PaymentType       string
}

type MidtransNotificationService interface {
	HandleNotification(ctx context.Context, payload MidtransNotification) error
}

type midtransNotificationService struct {
	transactionRepository      repository.TransactionRepository
	stockReservationRepository repository.StockReservationRepository
	productRepository          repository.ProductRepository
	serverKey                  string
}

func NewMidtransNotificationService(
	transactionRepository repository.TransactionRepository,
	stockReservationRepository repository.StockReservationRepository,
	productRepository repository.ProductRepository,
) MidtransNotificationService {
	config.LoadEnv()

	return &midtransNotificationService{
		transactionRepository:      transactionRepository,
		stockReservationRepository: stockReservationRepository,
		productRepository:          productRepository,
		serverKey:                  strings.TrimSpace(os.Getenv("MIDTRANS_SERVER_KEY")),
	}
}

func (service *midtransNotificationService) HandleNotification(ctx context.Context, payload MidtransNotification) error {
	if err := validateNotificationPayload(payload); err != nil {
		return err
	}

	if strings.TrimSpace(service.serverKey) == "" {
		return ErrMidtransServerKeyMissing
	}

	if !isValidMidtransSignature(payload, service.serverKey) {
		return ErrMidtransInvalidSignature
	}

	nextStatus, err := mapMidtransStatus(payload.TransactionStatus, payload.FraudStatus)
	if err != nil {
		return err
	}

	transaction, err := service.transactionRepository.FindByOrderID(ctx, payload.OrderID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrMidtransOrderNotFound
		}
		return err
	}

	if transaction == nil {
		return ErrMidtransOrderNotFound
	}

	if !isGrossAmountMatch(payload.GrossAmount, transaction.TotalAmount) {
		return ErrMidtransAmountMismatch
	}

	currentStatus := strings.ToLower(strings.TrimSpace(transaction.Status))
	if !shouldApplyStatusTransition(currentStatus, nextStatus) {
		if currentStatus == "failed" && nextStatus == "failed" {
			return service.releaseStockForOrder(ctx, payload.OrderID)
		}

		return nil
	}

	updated, err := service.transactionRepository.UpdateStatusByOrderIDAndCurrent(ctx, payload.OrderID, currentStatus, nextStatus)
	if err != nil {
		return err
	}

	if !updated {
		return nil
	}

	if nextStatus == "paid" {
		return service.stockReservationRepository.UpdateStatusByOrderID(ctx, payload.OrderID, stockReservationStatusReserved, stockReservationStatusConsumed)
	}

	if nextStatus == "failed" {
		return service.releaseStockForOrder(ctx, payload.OrderID)
	}

	return nil
}

func validateNotificationPayload(payload MidtransNotification) error {
	if strings.TrimSpace(payload.OrderID) == "" ||
		strings.TrimSpace(payload.StatusCode) == "" ||
		strings.TrimSpace(payload.GrossAmount) == "" ||
		strings.TrimSpace(payload.SignatureKey) == "" ||
		strings.TrimSpace(payload.TransactionStatus) == "" {
		return ErrMidtransInvalidPayload
	}

	return nil
}

func isValidMidtransSignature(payload MidtransNotification, serverKey string) bool {
	raw := fmt.Sprintf("%s%s%s%s", payload.OrderID, payload.StatusCode, payload.GrossAmount, serverKey)
	hash := sha512.Sum512([]byte(raw))
	expected := hex.EncodeToString(hash[:])
	provided := strings.ToLower(strings.TrimSpace(payload.SignatureKey))

	return subtle.ConstantTimeCompare([]byte(expected), []byte(provided)) == 1
}

func mapMidtransStatus(transactionStatus string, fraudStatus string) (string, error) {
	status := strings.ToLower(strings.TrimSpace(transactionStatus))
	fraud := strings.ToLower(strings.TrimSpace(fraudStatus))

	switch status {
	case "settlement":
		return "paid", nil
	case "capture":
		if fraud == "challenge" {
			return "pending", nil
		}
		return "paid", nil
	case "pending":
		return "pending", nil
	case "deny", "cancel", "expire", "failure":
		return "failed", nil
	case "refund", "partial_refund":
		return "refunded", nil
	default:
		return "", ErrMidtransUnknownStatus
	}
}

func isGrossAmountMatch(grossAmount string, transactionTotal float64) bool {
	parsedGrossAmount, err := strconv.ParseFloat(strings.TrimSpace(grossAmount), 64)
	if err != nil {
		return false
	}

	return toMidtransAmount(parsedGrossAmount) == toMidtransAmount(transactionTotal)
}

func (service *midtransNotificationService) releaseStockForOrder(ctx context.Context, orderID string) error {
	reservations, err := service.stockReservationRepository.FindByOrderIDAndStatus(ctx, orderID, stockReservationStatusReserved)
	if err != nil {
		return err
	}

	if len(reservations) == 0 {
		return nil
	}

	for _, reservation := range reservations {
		if err := service.productRepository.IncreaseStock(ctx, reservation.ProductID, reservation.Quantity); err != nil {
			return err
		}
	}

	reservationIDs := make([]uint, 0, len(reservations))
	for _, reservation := range reservations {
		reservationIDs = append(reservationIDs, reservation.ID)
	}

	return service.stockReservationRepository.UpdateStatusByIDs(ctx, reservationIDs, stockReservationStatusReserved, stockReservationStatusReleased)
}

func shouldApplyStatusTransition(currentStatus string, nextStatus string) bool {
	if currentStatus == "" {
		return true
	}

	if currentStatus == nextStatus {
		return false
	}

	if currentStatus == "refunded" {
		return false
	}

	if currentStatus == "paid" && nextStatus == "pending" {
		return false
	}

	if currentStatus == "paid" && nextStatus == "failed" {
		return false
	}

	if currentStatus == "failed" && nextStatus == "pending" {
		return false
	}

	return true
}
