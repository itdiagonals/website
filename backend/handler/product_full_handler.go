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

type ProductFullHandler struct {
	service *service.ProductFullService
}

func NewProductFullHandler(service *service.ProductFullService) *ProductFullHandler {
	return &ProductFullHandler{service: service}
}

// GetAllProducts godoc
// @Summary      Get all products
// @Description  Retrieve a list of all products, optionally filtered by category slug
// @Tags         Products
// @Accept       json
// @Produce      json
// @Param        category  query     string  false  "Category slug"
// @Param        page      query     int     false  "Page number"
// @Param        limit     query     int     false  "Page size"
// @Success      200       {object}  response.ListResponse[domain.Product]
// @Failure      500       {object}  response.Response[any]
// @Router       /api/v1/products [get]
func (h *ProductFullHandler) GetAllProducts(c *gin.Context) {
	categorySlug := c.Query("category")
	isLookbook := c.Query("is_lookbook") == "true"
	logger.Info("handler.products.get_all", "category", categorySlug, "is_lookbook", isLookbook)
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
	products, total, err := h.service.GetAllProducts(c.Request.Context(), categorySlug, isLookbook, page, limit)
	if err != nil {
		logger.Error("handler.products.get_all_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.List(c, products, page, limit, int(total))
}

// GetProductByID godoc
// @Summary      Get product by ID
// @Description  Retrieve a single product by ID with all relations
// @Tags         Products
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Product ID"
// @Success      200  {object}  response.Response[domain.Product]
// @Failure      400  {object}  response.Response[any]
// @Failure      404  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/products/{id} [get]
func (h *ProductFullHandler) GetProductByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.products.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid product id")
		return
	}

	logger.Info("handler.products.get_by_id", "id", id)
	product, err := h.service.GetProductByID(c.Request.Context(), id)
	if err != nil {
		logger.Error("handler.products.get_by_id_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, product)
}

// GetProductBySlug godoc
// @Summary      Get product by slug
// @Description  Retrieve a single product by slug with all relations
// @Tags         Products
// @Accept       json
// @Produce      json
// @Param        slug   path      string  true  "Product slug"
// @Success      200    {object}  response.Response[domain.Product]
// @Failure      404    {object}  response.Response[any]
// @Failure      500    {object}  response.Response[any]
// @Router       /api/v1/products/slug/{slug} [get]
func (h *ProductFullHandler) GetProductBySlug(c *gin.Context) {
	slug := c.Param("slug")
	logger.Info("handler.products.get_by_slug", "slug", slug)
	product, err := h.service.GetProductBySlug(c.Request.Context(), slug)
	if err != nil {
		logger.Error("handler.products.get_by_slug_failed", "slug", slug, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, product)
}

// GetSimilarProducts godoc
// @Summary      Get similar products
// @Description  Retrieve products in the same category excluding the given product
// @Tags         Products
// @Accept       json
// @Produce      json
// @Param        id     path      int  true  "Product ID"
// @Param        limit  query     int  false "Limit"
// @Success      200    {object}  response.Response[[]domain.Product]
// @Failure      400    {object}  response.Response[any]
// @Failure      500    {object}  response.Response[any]
// @Router       /api/v1/products/{id}/similar [get]
func (h *ProductFullHandler) GetSimilarProducts(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.products.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid product id")
		return
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "4"))
	if limit < 1 {
		limit = 4
	}
	if limit > 20 {
		limit = 20
	}

	product, err := h.service.GetProductByID(c.Request.Context(), id)
	if err != nil {
		logger.Error("handler.products.get_similar_not_found", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}

	logger.Info("handler.products.get_similar", "id", id, "season_id", product.SeasonID, "category_id", product.CategoryID, "limit", limit)
	products, err := h.service.GetSimilarProducts(c.Request.Context(), id, product.SeasonID, product.CategoryID, limit)
	if err != nil {
		logger.Error("handler.products.get_similar_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, products)
}

// CreateProduct godoc
// @Summary      Create product
// @Description  Create a new product with variants, colors, sizes, and gallery
// @Tags         Products
// @Accept       json
// @Produce      json
// @Param        product  body      domain.CreateProductRequest  true  "Product payload"
// @Success      201      {object}  response.Response[domain.Product]
// @Failure      400      {object}  response.Response[any]
// @Failure      409      {object}  response.Response[any]
// @Failure      500      {object}  response.Response[any]
// @Router       /api/v1/products [post]
func (h *ProductFullHandler) CreateProduct(c *gin.Context) {
	var req domain.CreateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.products.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}

	product := req.ToProduct()

	logger.Info("handler.products.create", "name", product.Name)
	if err := h.service.CreateProduct(c.Request.Context(), &product, req.DraftID); err != nil {
		logger.Error("handler.products.create_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.Created(c, product)
}

// UpdateProduct godoc
// @Summary      Update product
// @Description  Update an existing product with variants, colors, sizes, and gallery
// @Tags         Products
// @Accept       json
// @Produce      json
// @Param        id       path      int                          true  "Product ID"
// @Param        product  body      domain.UpdateProductRequest  true  "Product payload"
// @Success      200      {object}  response.Response[domain.Product]
// @Failure      400      {object}  response.Response[any]
// @Failure      404      {object}  response.Response[any]
// @Failure      500      {object}  response.Response[any]
// @Router       /api/v1/products/{id} [put]
func (h *ProductFullHandler) UpdateProduct(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.products.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid product id")
		return
	}

	var req domain.UpdateProductRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.products.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}
	product := req.ToProduct(id)

	logger.Info("handler.products.update", "id", id)
	if err := h.service.UpdateProduct(c.Request.Context(), &product); err != nil {
		logger.Error("handler.products.update_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, product)
}

// DeleteProduct godoc
// @Summary      Delete product
// @Description  Delete a product by ID
// @Tags         Products
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Product ID"
// @Success      204
// @Failure      400  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/products/{id} [delete]
func (h *ProductFullHandler) DeleteProduct(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.products.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid product id")
		return
	}

	logger.Info("handler.products.delete", "id", id)
	if err := h.service.DeleteProduct(c.Request.Context(), id); err != nil {
		logger.Error("handler.products.delete_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.NoContent(c)
}
