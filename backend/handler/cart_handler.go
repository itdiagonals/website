package handler

import (
	"errors"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/service"
)

type CartHandler struct {
	cartService service.CartService
}

type AddToCartRequest struct {
	ProductID         int    `json:"product_id" binding:"required"`
	Quantity          int    `json:"quantity" binding:"required"`
	SelectedSize      string `json:"selected_size" binding:"required"`
	SelectedColorName string `json:"selected_color_name" binding:"required"`
	SelectedColorHex  string `json:"selected_color_hex"`
}

type RemoveFromCartRequest struct {
	CartItemID uint `json:"cart_item_id" binding:"required,gt=0"`
}

type UpdateCartQuantityRequest struct {
	CartItemID uint `json:"cart_item_id" binding:"required,gt=0"`
	Quantity   int  `json:"quantity" binding:"required,gt=0"`
}

type CartResponse struct {
	Data domain.Cart `json:"data"`
}

func NewCartHandler(cartService service.CartService) *CartHandler {
	return &CartHandler{cartService: cartService}
}

// AddToCart godoc
// @Summary Add item to cart
// @Description Add a product to the authenticated customer's Redis-backed shopping cart
// @Tags Cart
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body handler.AddToCartRequest true "Cart item payload"
// @Success 200 {object} handler.CartResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 409 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/cart/add [post]
func (handler *CartHandler) AddToCart(context *gin.Context) {
	customerID, ok := context.Get("customer_id")
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	typedCustomerID, ok := customerID.(uint)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "invalid customer context"})
		return
	}

	var request AddToCartRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		return
	}

	cart, err := handler.cartService.AddToCart(context.Request.Context(), typedCustomerID, domain.CartItem{
		ProductID:         request.ProductID,
		Quantity:          request.Quantity,
		SelectedSize:      request.SelectedSize,
		SelectedColorName: request.SelectedColorName,
		SelectedColorHex:  request.SelectedColorHex,
	})
	if err != nil {
		var insufficientStockError *service.InsufficientStockError
		if errors.As(err, &insufficientStockError) {
			context.JSON(http.StatusConflict, ErrorResponse{Message: err.Error()})
			return
		}

		if err == service.ErrInvalidCartItem || err == service.ErrCartProductNotFound {
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
			return
		}

		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	context.JSON(http.StatusOK, CartResponse{Data: *cart})
}

// RemoveFromCart godoc
// @Summary Remove item from cart
// @Description Remove a specific cart item from the authenticated customer's Redis-backed shopping cart by cart item id
// @Tags Cart
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body handler.RemoveFromCartRequest true "Cart item removal payload"
// @Success 200 {object} handler.CartResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 404 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/cart/remove [delete]
func (handler *CartHandler) RemoveFromCart(context *gin.Context) {
	customerID, ok := context.Get("customer_id")
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	typedCustomerID, ok := customerID.(uint)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "invalid customer context"})
		return
	}

	var request RemoveFromCartRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		return
	}

	cart, err := handler.cartService.RemoveFromCartByID(context.Request.Context(), typedCustomerID, request.CartItemID)

	if err != nil {
		switch err {
		case service.ErrInvalidCartItem:
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		case service.ErrCartItemNotFound:
			context.JSON(http.StatusNotFound, ErrorResponse{Message: err.Error()})
		default:
			context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		}
		return
	}

	context.JSON(http.StatusOK, CartResponse{Data: *cart})
}

// UpdateQuantity godoc
// @Summary Update cart item quantity
// @Description Update the quantity of a specific cart item in the authenticated customer's cart by cart item id
// @Tags Cart
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body handler.UpdateCartQuantityRequest true "Cart quantity update payload"
// @Success 200 {object} handler.CartResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 404 {object} handler.ErrorResponse
// @Failure 409 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/cart/quantity [patch]
func (handler *CartHandler) UpdateQuantity(context *gin.Context) {
	customerID, ok := context.Get("customer_id")
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	typedCustomerID, ok := customerID.(uint)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "invalid customer context"})
		return
	}

	var request UpdateCartQuantityRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		return
	}

	cart, err := handler.cartService.UpdateQuantityByID(context.Request.Context(), typedCustomerID, request.CartItemID, request.Quantity)

	if err != nil {
		var insufficientStockError *service.InsufficientStockError
		if errors.As(err, &insufficientStockError) {
			context.JSON(http.StatusConflict, ErrorResponse{Message: err.Error()})
			return
		}

		switch err {
		case service.ErrInvalidCartItem:
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		case service.ErrCartItemNotFound:
			context.JSON(http.StatusNotFound, ErrorResponse{Message: err.Error()})
		default:
			context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		}
		return
	}

	context.JSON(http.StatusOK, CartResponse{Data: *cart})
}

// GetCart godoc
// @Summary Get my cart
// @Description Get the authenticated customer's Redis-backed shopping cart
// @Tags Cart
// @Security BearerAuth
// @Accept json
// @Produce json
// @Success 200 {object} handler.CartResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/cart [get]
func (handler *CartHandler) GetCart(context *gin.Context) {
	customerID, ok := context.Get("customer_id")
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	typedCustomerID, ok := customerID.(uint)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "invalid customer context"})
		return
	}

	cart, err := handler.cartService.GetMyCart(context.Request.Context(), typedCustomerID)
	if err != nil {
		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	context.JSON(http.StatusOK, CartResponse{Data: *cart})
}
