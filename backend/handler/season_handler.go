package handler

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/pkg/apperror"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/itdiagonals/website/backend/pkg/response"
	"github.com/itdiagonals/website/backend/service"
)

type SeasonHandler struct {
	service *service.SeasonService
}

func NewSeasonHandler(service *service.SeasonService) *SeasonHandler {
	return &SeasonHandler{service: service}
}

// GetAllSeasons godoc
// @Summary      Get all seasons
// @Description  Retrieve a list of all product seasons
// @Tags         Seasons
// @Accept       json
// @Produce      json
// @Success      200  {object}  response.ListResponse[domain.Season]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/seasons [get]
func (h *SeasonHandler) GetAllSeasons(c *gin.Context) {
	logger.Info("handler.seasons.get_all")
	seasons, err := h.service.GetAllSeasons(c.Request.Context())
	if err != nil {
		logger.Error("handler.seasons.get_all_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.List(c, seasons, 1, len(seasons), len(seasons))
}

// GetSeasonByID godoc
// @Summary      Get season by ID
// @Description  Retrieve a single season by ID
// @Tags         Seasons
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Season ID"
// @Success      200  {object}  response.Response[domain.Season]
// @Failure      400  {object}  response.Response[any]
// @Failure      404  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/seasons/{id} [get]
func (h *SeasonHandler) GetSeasonByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.seasons.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid season id")
		return
	}

	logger.Info("handler.seasons.get_by_id", "id", id)
	season, err := h.service.GetSeasonByID(c.Request.Context(), id)
	if err != nil {
		logger.Error("handler.seasons.get_by_id_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, season)
}

// GetSeasonBySlug godoc
// @Summary      Get season by slug
// @Description  Retrieve a single season by slug
// @Tags         Seasons
// @Accept       json
// @Produce      json
// @Param        slug   path      string  true  "Season slug"
// @Success      200    {object}  response.Response[domain.Season]
// @Failure      404    {object}  response.Response[any]
// @Failure      500    {object}  response.Response[any]
// @Router       /api/v1/seasons/slug/{slug} [get]
func (h *SeasonHandler) GetSeasonBySlug(c *gin.Context) {
	slug := c.Param("slug")
	logger.Info("handler.seasons.get_by_slug", "slug", slug)
	season, err := h.service.GetSeasonBySlug(c.Request.Context(), slug)
	if err != nil {
		logger.Error("handler.seasons.get_by_slug_failed", "slug", slug, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, season)
}

// CreateSeason godoc
// @Summary      Create season
// @Description  Create a new product season
// @Tags         Seasons
// @Accept       json
// @Produce      json
// @Param        season  body      domain.CreateSeasonRequest  true  "Season payload"
// @Success      201     {object}  response.Response[domain.Season]
// @Failure      400     {object}  response.Response[any]
// @Failure      409     {object}  response.Response[any]
// @Failure      500     {object}  response.Response[any]
// @Router       /api/v1/seasons [post]
func (h *SeasonHandler) CreateSeason(c *gin.Context) {
	var req domain.CreateSeasonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.seasons.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}

	season := req.ToSeason()

	logger.Info("handler.seasons.create", "name", season.Name)
	if err := h.service.CreateSeason(c.Request.Context(), &season); err != nil {
		logger.Error("handler.seasons.create_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.Created(c, season)
}

// UpdateSeason godoc
// @Summary      Update season
// @Description  Update an existing product season
// @Tags         Seasons
// @Accept       json
// @Produce      json
// @Param        id     path      int                          true  "Season ID"
// @Param        season body      domain.UpdateSeasonRequest   true  "Season payload"
// @Success      200    {object}  response.Response[domain.Season]
// @Failure      400    {object}  response.Response[any]
// @Failure      404    {object}  response.Response[any]
// @Failure      500    {object}  response.Response[any]
// @Router       /api/v1/seasons/{id} [put]
func (h *SeasonHandler) UpdateSeason(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.seasons.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid season id")
		return
	}

	var req domain.UpdateSeasonRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.seasons.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}
	season := req.ToSeason(id)

	logger.Info("handler.seasons.update", "id", id)
	if err := h.service.UpdateSeason(c.Request.Context(), &season); err != nil {
		logger.Error("handler.seasons.update_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, season)
}

// DeleteSeason godoc
// @Summary      Delete season
// @Description  Delete a product season by ID
// @Tags         Seasons
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Season ID"
// @Success      204
// @Failure      400  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/seasons/{id} [delete]
func (h *SeasonHandler) DeleteSeason(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.seasons.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid season id")
		return
	}

	logger.Info("handler.seasons.delete", "id", id)
	if err := h.service.DeleteSeason(c.Request.Context(), id); err != nil {
		logger.Error("handler.seasons.delete_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.NoContent(c)
}
