package handler

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/service"
)

type CustomerAddressHandler struct {
	customerAddressService service.CustomerAddressService
}

type AddAddressRequest struct {
	Title                string   `json:"title" binding:"required"`
	RecipientName        string   `json:"recipient_name" binding:"required"`
	PhoneNumber          string   `json:"phone_number" binding:"required"`
	Province             string   `json:"province" binding:"required"`
	City                 string   `json:"city" binding:"required"`
	District             string   `json:"district" binding:"required"`
	Village              string   `json:"village" binding:"required"`
	PostalCode           string   `json:"postal_code" binding:"required"`
	FullAddress          string   `json:"full_address" binding:"required"`
	Latitude             *float64 `json:"latitude"`
	Longitude            *float64 `json:"longitude"`
	PlaceID              string   `json:"place_id"`
	MapProvider          string   `json:"map_provider"`
	LocationSource       string   `json:"location_source"`
	DestinationAreaID    string   `json:"destination_area_id"`
	DestinationAreaLabel string   `json:"destination_area_label"`
	IsPrimary            bool     `json:"is_primary"`
}

type UpdateAddressRequest struct {
	Title                string   `json:"title" binding:"required"`
	RecipientName        string   `json:"recipient_name" binding:"required"`
	PhoneNumber          string   `json:"phone_number" binding:"required"`
	Province             string   `json:"province" binding:"required"`
	City                 string   `json:"city" binding:"required"`
	District             string   `json:"district" binding:"required"`
	Village              string   `json:"village" binding:"required"`
	PostalCode           string   `json:"postal_code" binding:"required"`
	FullAddress          string   `json:"full_address" binding:"required"`
	Latitude             *float64 `json:"latitude"`
	Longitude            *float64 `json:"longitude"`
	PlaceID              string   `json:"place_id"`
	MapProvider          string   `json:"map_provider"`
	LocationSource       string   `json:"location_source"`
	DestinationAreaID    string   `json:"destination_area_id"`
	DestinationAreaLabel string   `json:"destination_area_label"`
	IsPrimary            bool     `json:"is_primary"`
}

type CustomerAddressResponse struct {
	Data domain.CustomerAddress `json:"data"`
}

type CustomerAddressListResponse struct {
	Data []domain.CustomerAddress `json:"data"`
}

func NewCustomerAddressHandler(customerAddressService service.CustomerAddressService) *CustomerAddressHandler {
	return &CustomerAddressHandler{customerAddressService: customerAddressService}
}

// AddAddress godoc
// @Summary Add customer address
// @Description Add a detailed shipping address for the authenticated customer, including administrative regions, street details, and optional map pin metadata (latitude/longitude)
// @Tags Addresses
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param payload body handler.AddAddressRequest true "Customer address payload"
// @Success 201 {object} handler.CustomerAddressResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/addresses [post]
func (handler *CustomerAddressHandler) AddAddress(context *gin.Context) {
	customerID, ok := getCurrentCustomerID(context)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	var request AddAddressRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		return
	}

	address, err := handler.customerAddressService.AddAddress(context.Request.Context(), customerID, service.AddCustomerAddressInput{
		Title:                request.Title,
		RecipientName:        request.RecipientName,
		PhoneNumber:          request.PhoneNumber,
		Province:             request.Province,
		City:                 request.City,
		District:             request.District,
		Village:              request.Village,
		PostalCode:           request.PostalCode,
		FullAddress:          request.FullAddress,
		Latitude:             request.Latitude,
		Longitude:            request.Longitude,
		PlaceID:              request.PlaceID,
		MapProvider:          request.MapProvider,
		LocationSource:       request.LocationSource,
		DestinationAreaID:    request.DestinationAreaID,
		DestinationAreaLabel: request.DestinationAreaLabel,
		IsPrimary:            request.IsPrimary,
	})
	if err != nil {
		if errors.Is(err, service.ErrInvalidCustomerAddress) {
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
			return
		}

		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	context.JSON(http.StatusCreated, CustomerAddressResponse{Data: *address})
}

// UpdateAddress godoc
// @Summary Update customer address
// @Description Update an existing shipping address for the authenticated customer, including administrative regions, street details, and optional map pin metadata (latitude/longitude)
// @Tags Addresses
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Address ID"
// @Param payload body handler.UpdateAddressRequest true "Customer address payload"
// @Success 200 {object} handler.CustomerAddressResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 404 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/addresses/{id} [put]
func (handler *CustomerAddressHandler) UpdateAddress(context *gin.Context) {
	customerID, ok := getCurrentCustomerID(context)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	addressIDValue, err := strconv.ParseUint(context.Param("id"), 10, 64)
	if err != nil || addressIDValue == 0 {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: "invalid address id"})
		return
	}

	var request UpdateAddressRequest
	if err := context.ShouldBindJSON(&request); err != nil {
		context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
		return
	}

	address, err := handler.customerAddressService.UpdateAddress(context.Request.Context(), customerID, uint(addressIDValue), service.AddCustomerAddressInput{
		Title:                request.Title,
		RecipientName:        request.RecipientName,
		PhoneNumber:          request.PhoneNumber,
		Province:             request.Province,
		City:                 request.City,
		District:             request.District,
		Village:              request.Village,
		PostalCode:           request.PostalCode,
		FullAddress:          request.FullAddress,
		Latitude:             request.Latitude,
		Longitude:            request.Longitude,
		PlaceID:              request.PlaceID,
		MapProvider:          request.MapProvider,
		LocationSource:       request.LocationSource,
		DestinationAreaID:    request.DestinationAreaID,
		DestinationAreaLabel: request.DestinationAreaLabel,
		IsPrimary:            request.IsPrimary,
	})
	if err != nil {
		switch {
		case errors.Is(err, service.ErrInvalidCustomerAddress):
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
			return
		case errors.Is(err, service.ErrCustomerAddressNotFound):
			context.JSON(http.StatusNotFound, ErrorResponse{Message: err.Error()})
			return
		default:
			context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
			return
		}
	}

	context.JSON(http.StatusOK, CustomerAddressResponse{Data: *address})
}

// GetMyAddresses godoc
// @Summary Get my addresses
// @Description Get all detailed shipping addresses for the authenticated customer ordered by primary status first
// @Tags Addresses
// @Security BearerAuth
// @Accept json
// @Produce json
// @Success 200 {object} handler.CustomerAddressListResponse
// @Failure 400 {object} handler.ErrorResponse
// @Failure 401 {object} handler.ErrorResponse
// @Failure 500 {object} handler.ErrorResponse
// @Router /api/v1/addresses [get]
func (handler *CustomerAddressHandler) GetMyAddresses(context *gin.Context) {
	customerID, ok := getCurrentCustomerID(context)
	if !ok {
		context.JSON(http.StatusUnauthorized, ErrorResponse{Message: "unauthorized"})
		return
	}

	addresses, err := handler.customerAddressService.GetMyAddresses(context.Request.Context(), customerID)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCustomerAddress) {
			context.JSON(http.StatusBadRequest, ErrorResponse{Message: err.Error()})
			return
		}

		context.JSON(http.StatusInternalServerError, ErrorResponse{Message: err.Error()})
		return
	}

	context.JSON(http.StatusOK, CustomerAddressListResponse{Data: addresses})
}

func getCurrentCustomerID(context *gin.Context) (uint, bool) {
	customerIDValue, ok := context.Get("customer_id")
	if !ok {
		return 0, false
	}

	customerID, ok := customerIDValue.(uint)
	if !ok || customerID == 0 {
		return 0, false
	}

	return customerID, true
}
