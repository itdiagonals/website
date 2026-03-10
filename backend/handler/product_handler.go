package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/service"
)

type ProductHandler struct {
	productService service.ProductService
}

type ProductListResponse struct {
	Data []domain.Product `json:"data"`
}

type ProductDetailResponse struct {
	Data domain.ProductDetail `json:"data"`
}

type ErrorResponse struct {
	Message string `json:"message"`
}

func NewProductHandler(productService service.ProductService) *ProductHandler {
	return &ProductHandler{productService: productService}
}

// GetAll godoc
// @Summary Get all products
// @Description Get all products from the backend-owned catalog read model, optionally filtered by category slug
// @Tags Products
// @Accept json
// @Produce json
// @Param category query string false "Category slug"
// @Success 200 {object} handler.ProductListResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/products [get]
func (handler *ProductHandler) GetAll(context *gin.Context) {
	categorySlug := context.Query("category")

	products, err := handler.productService.GetAllProducts(context.Request.Context(), categorySlug)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	context.JSON(http.StatusOK, gin.H{"data": products})
}

// GetBySlug godoc
// @Summary Get product by slug
// @Description Get a single product with available size and color options from the backend-owned catalog read model by slug
// @Tags Products
// @Accept json
// @Produce json
// @Param slug path string true "Product slug"
// @Success 200 {object} handler.ProductDetailResponse
// @Failure 404 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/products/{slug} [get]
func (handler *ProductHandler) GetBySlug(context *gin.Context) {
	slug := context.Param("slug")

	product, err := handler.productService.GetProductBySlug(context.Request.Context(), slug)
	if err != nil {
		if errors.Is(err, service.ErrProductNotFound) {
			context.JSON(http.StatusNotFound, gin.H{"message": err.Error()})
			return
		}

		context.JSON(http.StatusInternalServerError, gin.H{"message": err.Error()})
		return
	}

	context.JSON(http.StatusOK, gin.H{"data": product})
}
