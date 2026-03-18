package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/service"
)

type WilayahHandler struct {
	wilayahService service.WilayahService
}

type WilayahListResponse struct {
	Data []domain.Wilayah `json:"data"`
}

func NewWilayahHandler(wilayahService service.WilayahService) *WilayahHandler {
	return &WilayahHandler{wilayahService: wilayahService}
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

	wilayah, err := handler.wilayahService.Search(context.Request.Context(), service.SearchWilayahInput{
		Level:      context.Query("level"),
		ParentCode: context.Query("parent_code"),
		Query:      context.Query("query"),
		Limit:      limit,
	})
	if err != nil {
		if errors.Is(err, service.ErrInvalidWilayahSearch) {
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
			return
		}

		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	context.JSON(http.StatusOK, WilayahListResponse{Data: wilayah})
}
