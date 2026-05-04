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

type MediaHandler struct {
	service *service.MediaService
}

func NewMediaHandler(service *service.MediaService) *MediaHandler {
	return &MediaHandler{service: service}
}

// GetAllMedia godoc
// @Summary      Get all media
// @Description  Retrieve a list of all media files
// @Tags         Media
// @Accept       json
// @Produce      json
// @Success      200  {object}  response.ListResponse[domain.Media]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/media [get]
func (h *MediaHandler) GetAllMedia(c *gin.Context) {
	logger.Info("handler.media.get_all")
	media, err := h.service.GetAllMedia(c.Request.Context())
	if err != nil {
		logger.Error("handler.media.get_all_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.List(c, media, 1, len(media), len(media))
}

// GetMediaByID godoc
// @Summary      Get media by ID
// @Description  Retrieve a single media file by ID
// @Tags         Media
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Media ID"
// @Success      200  {object}  response.Response[domain.Media]
// @Failure      400  {object}  response.Response[any]
// @Failure      404  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/media/{id} [get]
func (h *MediaHandler) GetMediaByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.media.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid media id")
		return
	}

	logger.Info("handler.media.get_by_id", "id", id)
	m, err := h.service.GetMediaByID(c.Request.Context(), id)
	if err != nil {
		logger.Error("handler.media.get_by_id_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, m)
}

// CreateMedia godoc
// @Summary      Create media
// @Description  Create a new media file record
// @Tags         Media
// @Accept       json
// @Produce      json
// @Param        media  body      domain.Media  true  "Media payload"
// @Success      201    {object}  response.Response[domain.Media]
// @Failure      400    {object}  response.Response[any]
// @Failure      500    {object}  response.Response[any]
// @Router       /api/v1/media [post]
func (h *MediaHandler) CreateMedia(c *gin.Context) {
	var media domain.Media
	if err := c.ShouldBindJSON(&media); err != nil {
		logger.Warn("handler.media.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}

	logger.Info("handler.media.create", "filename", media.Filename)
	if err := h.service.CreateMedia(c.Request.Context(), &media); err != nil {
		logger.Error("handler.media.create_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.Created(c, media)
}

// UpdateMedia godoc
// @Summary      Update media
// @Description  Update an existing media file record
// @Tags         Media
// @Accept       json
// @Produce      json
// @Param        id     path      int           true  "Media ID"
// @Param        media  body      domain.Media  true  "Media payload"
// @Success      200    {object}  response.Response[domain.Media]
// @Failure      400    {object}  response.Response[any]
// @Failure      404    {object}  response.Response[any]
// @Failure      500    {object}  response.Response[any]
// @Router       /api/v1/media/{id} [put]
func (h *MediaHandler) UpdateMedia(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.media.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid media id")
		return
	}

	var media domain.Media
	if err := c.ShouldBindJSON(&media); err != nil {
		logger.Warn("handler.media.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}
	media.ID = id

	logger.Info("handler.media.update", "id", id)
	if err := h.service.UpdateMedia(c.Request.Context(), &media); err != nil {
		logger.Error("handler.media.update_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, media)
}

// DeleteMedia godoc
// @Summary      Delete media
// @Description  Delete a media file record by ID
// @Tags         Media
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Media ID"
// @Success      204
// @Failure      400  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/media/{id} [delete]
func (h *MediaHandler) DeleteMedia(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.media.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid media id")
		return
	}

	logger.Info("handler.media.delete", "id", id)
	if err := h.service.DeleteMedia(c.Request.Context(), id); err != nil {
		logger.Error("handler.media.delete_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.NoContent(c)
}
