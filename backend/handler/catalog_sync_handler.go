package handler

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/config"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/service"
)

const catalogSyncMaxSkew = 5 * time.Minute

type CatalogSyncHandler struct {
	service service.CatalogSyncService
}

func NewCatalogSyncHandler(service service.CatalogSyncService) *CatalogSyncHandler {
	return &CatalogSyncHandler{service: service}
}

func (handler *CatalogSyncHandler) Handle(context *gin.Context) {
	config.LoadEnv()

	secret := strings.TrimSpace(os.Getenv("CATALOG_SYNC_SECRET"))
	if secret == "" {
		context.JSON(http.StatusInternalServerError, gin.H{"message": "catalog sync secret is not configured"})
		return
	}

	rawBody, err := io.ReadAll(context.Request.Body)
	if err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "failed to read request body"})
		return
	}

	timestamp := context.GetHeader("X-Catalog-Sync-Timestamp")
	signature := context.GetHeader("X-Catalog-Sync-Signature")
	if err := verifyCatalogSyncSignature(secret, timestamp, signature, rawBody); err != nil {
		context.JSON(http.StatusUnauthorized, gin.H{"message": err.Error()})
		return
	}

	var event domain.CatalogSyncEvent
	if err := json.Unmarshal(rawBody, &event); err != nil {
		context.JSON(http.StatusBadRequest, gin.H{"message": "invalid catalog sync payload"})
		return
	}

	if err := handler.service.ApplyEvent(context.Request.Context(), event); err != nil {
		status := http.StatusInternalServerError
		if errors.Is(err, service.ErrInvalidCatalogSyncEvent) {
			status = http.StatusBadRequest
		}

		context.JSON(status, gin.H{"message": err.Error()})
		return
	}

	context.JSON(http.StatusOK, gin.H{"status": "ok"})
}

func verifyCatalogSyncSignature(secret string, timestamp string, signature string, body []byte) error {
	if strings.TrimSpace(timestamp) == "" || strings.TrimSpace(signature) == "" {
		return errors.New("missing catalog sync signature headers")
	}

	unixTimestamp, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil {
		return errors.New("invalid catalog sync timestamp")
	}

	if math.Abs(time.Since(time.Unix(unixTimestamp, 0)).Seconds()) > catalogSyncMaxSkew.Seconds() {
		return errors.New("catalog sync request expired")
	}

	mac := hmac.New(sha256.New, []byte(secret))
	_, _ = mac.Write([]byte(timestamp))
	_, _ = mac.Write([]byte("."))
	_, _ = mac.Write(body)
	expected := fmt.Sprintf("sha256=%s", hex.EncodeToString(mac.Sum(nil)))

	if subtle.ConstantTimeCompare([]byte(expected), []byte(signature)) != 1 {
		return errors.New("invalid catalog sync signature")
	}

	return nil
}
