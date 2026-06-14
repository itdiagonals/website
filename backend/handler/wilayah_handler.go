package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/service"
)

type WilayahHandler struct {
	wilayahService service.WilayahService
	cache          *service.CatalogCache
}

type WilayahListResponse struct {
	Data []domain.Wilayah `json:"data"`
}

func NewWilayahHandler(wilayahService service.WilayahService, cache *service.CatalogCache) *WilayahHandler {
	return &WilayahHandler{wilayahService: wilayahService, cache: cache}
}

// Search godoc
// @Summary Search wilayah master data
// @Description Search wilayah master data for province, city, district, or village with optional parent filtering for cascading address forms
// @Tags Wilayah
// @Accept json
// @Produce json
// @Param level query string false "Wilayah level: province, city, district, village"
// @Param parent_code query string false "Parent wilayah code for cascading search"
// @Param query query string false "Search keyword"
// @Param limit query int false "Maximum result count, default 50, max 100"
// @Success 200 {object} handler.WilayahListResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/wilayah/search [get]
func (handler *WilayahHandler) Search(context *gin.Context) {
	limit := 50
	if limitValue := context.Query("limit"); limitValue != "" {
		parsedLimit, err := strconv.Atoi(limitValue)
		if err != nil {
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: "invalid limit"})
			return
		}
		limit = parsedLimit
	}

	input := service.SearchWilayahInput{
		Level:      context.Query("level"),
		ParentCode: context.Query("parent_code"),
		Query:      context.Query("query"),
		Limit:      limit,
	}

	cacheKey := buildWilayahCacheKey(input)
	if cacheKey != "" && handler.cache != nil {
		var cachedResponse WilayahListResponse
		cacheHit, cacheErr := handler.cache.Get(context.Request.Context(), cacheKey, &cachedResponse)
		if cacheErr == nil && cacheHit {
			context.JSON(http.StatusOK, cachedResponse)
			return
		}
	}

	wilayah, err := handler.wilayahService.Search(context.Request.Context(), input)
	if err != nil {
		if errors.Is(err, service.ErrInvalidWilayahSearch) {
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
			return
		}

		internalError(context, "handler.wilayah.search", err)
		return
	}

	response := WilayahListResponse{Data: wilayah}
	if cacheKey != "" && handler.cache != nil {
		_ = handler.cache.Set(context.Request.Context(), cacheKey, response)
	}

	context.JSON(http.StatusOK, response)
}

func buildWilayahCacheKey(input service.SearchWilayahInput) string {
	normalized := map[string]string{
		"level":       normalizeWilayahCacheValue(input.Level),
		"parent_code": normalizeWilayahCacheValue(input.ParentCode),
		"query":       normalizeWilayahCacheValue(input.Query),
	}

	payload, err := json.Marshal(normalized)
	if err != nil {
		return ""
	}

	return fmt.Sprintf("catalog:wilayah:search:%s:limit=%d", strings.ToLower(string(payload)), input.Limit)
}

func normalizeWilayahCacheValue(value string) string {
	return strings.TrimSpace(strings.ToLower(value))
}
