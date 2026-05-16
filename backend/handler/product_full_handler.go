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
// @Success      200       {object}  response.ListResponse[domain.Product]
// @Failure      500       {object}  response.Response[any]
// @Router       /api/v1/products [get]
func (h *ProductFullHandler) GetAllProducts(c *gin.Context) {
	categorySlug := c.Query("category")
	logger.Info("handler.products.get_all", "category", categorySlug)
	products, err := h.service.GetAllProducts(c.Request.Context(), categorySlug)
	if err != nil {
		logger.Error("handler.products.get_all_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.List(c, products, 1, len(products), len(products))
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
	if err := h.service.CreateProduct(c.Request.Context(), &product); err != nil {
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
