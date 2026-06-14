package handler

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/pkg/apperror"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/itdiagonals/website/backend/pkg/response"
	"github.com/itdiagonals/website/backend/service"
)

type UserHandler struct {
	service *service.UserService
}

func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

// GetMe godoc
// @Summary      Get current user
// @Description  Retrieve the currently authenticated user
// @Tags         Users
// @Accept       json
// @Produce      json
// @Success      200  {object}  response.Response[domain.User]
// @Failure      401  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/users/me [get]
func (h *UserHandler) GetMe(c *gin.Context) {
	userID, ok := getCurrentUserID(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, apperror.CodeUnauthorized, "unauthorized")
		return
	}

	logger.Info("handler.users.get_me", "id", userID)
	user, err := h.service.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		logger.Error("handler.users.get_me_failed", "id", userID, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, user)
}

type UpdateMeRequest struct {
	Name  string `json:"name"`
	Phone string `json:"phone"`
}

func (h *UserHandler) UpdateMe(c *gin.Context) {
	userID, ok := getCurrentUserID(c)
	if !ok {
		response.Error(c, http.StatusUnauthorized, apperror.CodeUnauthorized, "unauthorized")
		return
	}

	var req UpdateMeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}

	user, err := h.service.GetUserByID(c.Request.Context(), userID)
	if err != nil {
		response.FromError(c, err)
		return
	}

	user.Name = req.Name
	user.Phone = req.Phone

	if err := h.service.UpdateUser(c.Request.Context(), user); err != nil {
		response.FromError(c, err)
		return
	}
	response.OK(c, user)
}

// GetAllUsers godoc
// @Summary      Get all users
// @Description  Retrieve a list of all admin users
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        page   query     int  false  "Page number"
// @Param        limit  query     int  false  "Page size"
// @Success      200  {object}  response.ListResponse[domain.User]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/users [get]
func (h *UserHandler) GetAllUsers(c *gin.Context) {
	logger.Info("handler.users.get_all")
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
	users, total, err := h.service.GetAllUsers(c.Request.Context(), page, limit)
	if err != nil {
		logger.Error("handler.users.get_all_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.List(c, users, page, limit, int(total))
}

// GetUserByID godoc
// @Summary      Get user by ID
// @Description  Retrieve a single user by their ID
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "User ID"
// @Success      200  {object}  response.Response[domain.User]
// @Failure      400  {object}  response.Response[any]
// @Failure      404  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/users/{id} [get]
func (h *UserHandler) GetUserByID(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		logger.Warn("handler.users.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid user id")
		return
	}

	logger.Info("handler.users.get_by_id", "id", id)
	user, err := h.service.GetUserByID(c.Request.Context(), id)
	if err != nil {
		logger.Error("handler.users.get_by_id_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, user)
}

// CreateUser godoc
// @Summary      Create user
// @Description  Create a new admin user
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        user  body      domain.CreateUserRequest  true  "User payload"
// @Success      201   {object}  response.Response[domain.User]
// @Failure      400   {object}  response.Response[any]
// @Failure      409   {object}  response.Response[any]
// @Failure      500   {object}  response.Response[any]
// @Router       /api/v1/users [post]
func (h *UserHandler) CreateUser(c *gin.Context) {
	var req domain.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.users.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}

	user := req.ToUser()

	logger.Info("handler.users.create", "email", user.Email)
	if err := h.service.CreateUser(c.Request.Context(), &user, req.Password); err != nil {
		logger.Error("handler.users.create_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.Created(c, user)
}

// UpdateUser godoc
// @Summary      Update user
// @Description  Update an existing admin user
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        id    path      string                        true  "User ID"
// @Param        user  body      domain.UpdateUserRequest   true  "User payload"
// @Success      200   {object}  response.Response[domain.User]
// @Failure      400   {object}  response.Response[any]
// @Failure      404   {object}  response.Response[any]
// @Failure      500   {object}  response.Response[any]
// @Router       /api/v1/users/{id} [put]
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		logger.Warn("handler.users.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid user id")
		return
	}

	var req domain.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.users.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}

	existing, err := h.service.GetUserByID(c.Request.Context(), id)
	if err != nil {
		logger.Error("handler.users.update_lookup_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}

	user := req.ToUser(id, existing.Role)

	logger.Info("handler.users.update", "id", id)
	if err := h.service.UpdateUser(c.Request.Context(), &user); err != nil {
		logger.Error("handler.users.update_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}

	updated, err := h.service.GetUserByID(c.Request.Context(), id)
	if err != nil {
		logger.Error("handler.users.update_refetch_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, updated)
}

// DeleteUser godoc
// @Summary      Delete user
// @Description  Delete an admin user by ID
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        id   path      string  true  "User ID"
// @Success      204
// @Failure      400  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/users/{id} [delete]
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id := strings.TrimSpace(c.Param("id"))
	if id == "" {
		logger.Warn("handler.users.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid user id")
		return
	}

	logger.Info("handler.users.delete", "id", id)
	if err := h.service.DeleteUser(c.Request.Context(), id); err != nil {
		logger.Error("handler.users.delete_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.NoContent(c)
}
