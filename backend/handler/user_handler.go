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

type UserHandler struct {
	service *service.UserService
}

func NewUserHandler(service *service.UserService) *UserHandler {
	return &UserHandler{service: service}
}

// GetAllUsers godoc
// @Summary      Get all users
// @Description  Retrieve a list of all admin users
// @Tags         Users
// @Accept       json
// @Produce      json
// @Success      200  {object}  response.ListResponse[domain.User]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/users [get]
func (h *UserHandler) GetAllUsers(c *gin.Context) {
	logger.Info("handler.users.get_all")
	users, err := h.service.GetAllUsers(c.Request.Context())
	if err != nil {
		logger.Error("handler.users.get_all_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.List(c, users, 1, len(users), len(users))
}

// GetUserByID godoc
// @Summary      Get user by ID
// @Description  Retrieve a single user by their ID
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "User ID"
// @Success      200  {object}  response.Response[domain.User]
// @Failure      400  {object}  response.Response[any]
// @Failure      404  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/users/{id} [get]
func (h *UserHandler) GetUserByID(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		logger.Warn("handler.users.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid user id")
		return
	}

	logger.Info("handler.users.get_by_id", "id", id)
	user, err := h.service.GetUserByID(c.Request.Context(), uint(id))
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
	if err := h.service.CreateUser(c.Request.Context(), &user); err != nil {
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
// @Param        id    path      int                        true  "User ID"
// @Param        user  body      domain.UpdateUserRequest   true  "User payload"
// @Success      200   {object}  response.Response[domain.User]
// @Failure      400   {object}  response.Response[any]
// @Failure      404   {object}  response.Response[any]
// @Failure      500   {object}  response.Response[any]
// @Router       /api/v1/users/{id} [put]
func (h *UserHandler) UpdateUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
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
	user := req.ToUser(uint(id))

	logger.Info("handler.users.update", "id", id)
	if err := h.service.UpdateUser(c.Request.Context(), &user); err != nil {
		logger.Error("handler.users.update_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, user)
}

// DeleteUser godoc
// @Summary      Delete user
// @Description  Delete an admin user by ID
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "User ID"
// @Success      204
// @Failure      400  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/users/{id} [delete]
func (h *UserHandler) DeleteUser(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		logger.Warn("handler.users.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid user id")
		return
	}

	logger.Info("handler.users.delete", "id", id)
	if err := h.service.DeleteUser(c.Request.Context(), uint(id)); err != nil {
		logger.Error("handler.users.delete_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.NoContent(c)
}
