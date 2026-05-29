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

type CareGuideHandler struct {
	service *service.CareGuideService
}

func NewCareGuideHandler(service *service.CareGuideService) *CareGuideHandler {
	return &CareGuideHandler{service: service}
}

// GetAllCareGuides godoc
// @Summary      Get all care guides
// @Description  Retrieve a list of all care guides
// @Tags         CareGuides
// @Accept       json
// @Produce      json
// @Param        page   query     int  false  "Page number"
// @Param        limit  query     int  false  "Page size"
// @Success      200  {object}  response.ListResponse[domain.CareGuide]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/care-guides [get]
func (h *CareGuideHandler) GetAllCareGuides(c *gin.Context) {
	logger.Info("handler.care_guides.get_all")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	if limit < 1 {
		limit = 50
	}
	if limit > 200 {
		limit = 200
	}
	careGuides, total, err := h.service.GetAllCareGuides(c.Request.Context(), page, limit)
	if err != nil {
		logger.Error("handler.care_guides.get_all_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.List(c, careGuides, page, limit, int(total))
}

// GetCareGuideByID godoc
// @Summary      Get care guide by ID
// @Description  Retrieve a single care guide by ID
// @Tags         CareGuides
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Care Guide ID"
// @Success      200  {object}  response.Response[domain.CareGuide]
// @Failure      400  {object}  response.Response[any]
// @Failure      404  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/care-guides/{id} [get]
func (h *CareGuideHandler) GetCareGuideByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.care_guides.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid care guide id")
		return
	}

	logger.Info("handler.care_guides.get_by_id", "id", id)
	careGuide, err := h.service.GetCareGuideByID(c.Request.Context(), id)
	if err != nil {
		logger.Error("handler.care_guides.get_by_id_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, careGuide)
}

// CreateCareGuide godoc
// @Summary      Create care guide
// @Description  Create a new care guide
// @Tags         CareGuides
// @Accept       json
// @Produce      json
// @Param        care_guide  body      domain.CreateCareGuideRequest  true  "Care Guide payload"
// @Success      201         {object}  response.Response[domain.CareGuide]
// @Failure      400         {object}  response.Response[any]
// @Failure      500         {object}  response.Response[any]
// @Router       /api/v1/care-guides [post]
func (h *CareGuideHandler) CreateCareGuide(c *gin.Context) {
	var req domain.CreateCareGuideRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.care_guides.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}

	careGuide := req.ToCareGuide()

	logger.Info("handler.care_guides.create", "title", careGuide.Title)
	if err := h.service.CreateCareGuide(c.Request.Context(), &careGuide); err != nil {
		logger.Error("handler.care_guides.create_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.Created(c, careGuide)
}

// UpdateCareGuide godoc
// @Summary      Update care guide
// @Description  Update an existing care guide
// @Tags         CareGuides
// @Accept       json
// @Produce      json
// @Param        id          path      int                             true  "Care Guide ID"
// @Param        care_guide  body      domain.UpdateCareGuideRequest   true  "Care Guide payload"
// @Success      200         {object}  response.Response[domain.CareGuide]
// @Failure      400         {object}  response.Response[any]
// @Failure      404         {object}  response.Response[any]
// @Failure      500         {object}  response.Response[any]
// @Router       /api/v1/care-guides/{id} [put]
func (h *CareGuideHandler) UpdateCareGuide(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.care_guides.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid care guide id")
		return
	}

	var req domain.UpdateCareGuideRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.care_guides.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}
	careGuide := req.ToCareGuide(id)

	logger.Info("handler.care_guides.update", "id", id)
	if err := h.service.UpdateCareGuide(c.Request.Context(), &careGuide); err != nil {
		logger.Error("handler.care_guides.update_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, careGuide)
}

// DeleteCareGuide godoc
// @Summary      Delete care guide
// @Description  Delete a care guide by ID
// @Tags         CareGuides
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Care Guide ID"
// @Success      204
// @Failure      400  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/care-guides/{id} [delete]
func (h *CareGuideHandler) DeleteCareGuide(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.care_guides.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid care guide id")
		return
	}

	logger.Info("handler.care_guides.delete", "id", id)
	if err := h.service.DeleteCareGuide(c.Request.Context(), id); err != nil {
		logger.Error("handler.care_guides.delete_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.NoContent(c)
}
