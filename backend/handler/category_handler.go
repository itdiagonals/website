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

type CategoryHandler struct {
	service *service.CategoryService
}

func NewCategoryHandler(service *service.CategoryService) *CategoryHandler {
	return &CategoryHandler{service: service}
}

// GetAllCategories godoc
// @Summary      Get all categories
// @Description  Retrieve a list of all product categories
// @Tags         Categories
// @Accept       json
// @Produce      json
// @Success      200  {object}  response.ListResponse[domain.Category]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/categories [get]
func (h *CategoryHandler) GetAllCategories(c *gin.Context) {
	logger.Info("handler.categories.get_all")
	categories, err := h.service.GetAllCategories(c.Request.Context())
	if err != nil {
		logger.Error("handler.categories.get_all_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.List(c, categories, 1, len(categories), len(categories))
}

// GetCategoryByID godoc
// @Summary      Get category by ID
// @Description  Retrieve a single category by ID
// @Tags         Categories
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Category ID"
// @Success      200  {object}  response.Response[domain.Category]
// @Failure      400  {object}  response.Response[any]
// @Failure      404  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/categories/{id} [get]
func (h *CategoryHandler) GetCategoryByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.categories.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid category id")
		return
	}

	logger.Info("handler.categories.get_by_id", "id", id)
	category, err := h.service.GetCategoryByID(c.Request.Context(), id)
	if err != nil {
		logger.Error("handler.categories.get_by_id_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, category)
}

// GetCategoryBySlug godoc
// @Summary      Get category by slug
// @Description  Retrieve a single category by slug
// @Tags         Categories
// @Accept       json
// @Produce      json
// @Param        slug   path      string  true  "Category slug"
// @Success      200    {object}  response.Response[domain.Category]
// @Failure      404    {object}  response.Response[any]
// @Failure      500    {object}  response.Response[any]
// @Router       /api/v1/categories/slug/{slug} [get]
func (h *CategoryHandler) GetCategoryBySlug(c *gin.Context) {
	slug := c.Param("slug")
	logger.Info("handler.categories.get_by_slug", "slug", slug)
	category, err := h.service.GetCategoryBySlug(c.Request.Context(), slug)
	if err != nil {
		logger.Error("handler.categories.get_by_slug_failed", "slug", slug, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, category)
}

// CreateCategory godoc
// @Summary      Create category
// @Description  Create a new product category
// @Tags         Categories
// @Accept       json
// @Produce      json
// @Param        category  body      domain.CreateCategoryRequest  true  "Category payload"
// @Success      201       {object}  response.Response[domain.Category]
// @Failure      400       {object}  response.Response[any]
// @Failure      409       {object}  response.Response[any]
// @Failure      500       {object}  response.Response[any]
// @Router       /api/v1/categories [post]
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	var req domain.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.categories.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}

	category := req.ToCategory()

	logger.Info("handler.categories.create", "name", category.Name)
	if err := h.service.CreateCategory(c.Request.Context(), &category); err != nil {
		logger.Error("handler.categories.create_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.Created(c, category)
}

// UpdateCategory godoc
// @Summary      Update category
// @Description  Update an existing product category
// @Tags         Categories
// @Accept       json
// @Produce      json
// @Param        id        path      int                            true  "Category ID"
// @Param        category  body      domain.UpdateCategoryRequest   true  "Category payload"
// @Success      200       {object}  response.Response[domain.Category]
// @Failure      400       {object}  response.Response[any]
// @Failure      404       {object}  response.Response[any]
// @Failure      500       {object}  response.Response[any]
// @Router       /api/v1/categories/{id} [put]
func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.categories.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid category id")
		return
	}

	var req domain.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.categories.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}
	category := req.ToCategory(id)

	logger.Info("handler.categories.update", "id", id)
	if err := h.service.UpdateCategory(c.Request.Context(), &category); err != nil {
		logger.Error("handler.categories.update_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, category)
}

// DeleteCategory godoc
// @Summary      Delete category
// @Description  Delete a product category by ID
// @Tags         Categories
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Category ID"
// @Success      204
// @Failure      400  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/categories/{id} [delete]
func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.categories.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid category id")
		return
	}

	logger.Info("handler.categories.delete", "id", id)
	if err := h.service.DeleteCategory(c.Request.Context(), id); err != nil {
		logger.Error("handler.categories.delete_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.NoContent(c)
}
