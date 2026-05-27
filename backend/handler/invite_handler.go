package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/pkg/apperror"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/itdiagonals/website/backend/pkg/response"
	"github.com/itdiagonals/website/backend/service"
)

type InviteHandler struct {
	inviteService *service.InviteService
}

type InviteRequest struct {
	Email string `json:"email" binding:"required,email"`
}

type InviteCheckResponse struct {
	Email       string `json:"email"`
	UserExists  bool   `json:"user_exists"`
}

func NewInviteHandler(inviteService *service.InviteService) *InviteHandler {
	return &InviteHandler{inviteService: inviteService}
}

// InviteAdmin godoc
// @Summary      Invite admin
// @Description  Invite a user to become an admin. If the user already exists, they are promoted immediately. Otherwise, an invite email is sent.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        body  body      InviteRequest  true  "Invite request"
// @Success      200   {object}  response.Response[map[string]string]
// @Failure      400   {object}  response.Response[any]
// @Failure      500   {object}  response.Response[any]
// @Router       /api/v1/users/invite [post]
func (h *InviteHandler) InviteAdmin(c *gin.Context) {
	var req InviteRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.invite.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}

	inviterName, _ := c.Get("name")
	inviterNameStr, _ := inviterName.(string)
	if inviterNameStr == "" {
		inviterNameStr = "An admin"
	}

	token, err := h.inviteService.InviteAdmin(c.Request.Context(), req.Email, inviterNameStr)
	if err != nil {
		if err == service.ErrInviteAlreadyAdmin {
			response.Error(c, http.StatusConflict, apperror.CodeValidation, "user is already an admin")
			return
		}
		logger.Error("handler.invite.failed", "error", err.Error())
		response.Error(c, http.StatusInternalServerError, apperror.CodeInternal, err.Error())
		return
	}

	if token == "" {
		response.OK(c, gin.H{"message": "user promoted to admin immediately"})
		return
	}

	response.OK(c, gin.H{"message": "invite sent", "token": token})
}

// CheckInviteToken godoc
// @Summary      Check invite token
// @Description  Check if an invite token is valid and whether the user already exists.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        token  query     string  true  "Invite token"
// @Success      200    {object}  response.Response[InviteCheckResponse]
// @Failure      400    {object}  response.Response[any]
// @Failure      500    {object}  response.Response[any]
// @Router       /api/v1/users/invite-check [get]
func (h *InviteHandler) CheckInviteToken(c *gin.Context) {
	token := strings.TrimSpace(c.Query("token"))
	if token == "" {
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, "token is required")
		return
	}

	email, userExists, err := h.inviteService.CheckInviteToken(c.Request.Context(), token)
	if err != nil {
		if err == service.ErrInviteTokenInvalid {
			response.Error(c, http.StatusBadRequest, apperror.CodeValidation, "invalid or expired invite token")
			return
		}
		logger.Error("handler.invite.check_failed", "error", err.Error())
		response.Error(c, http.StatusInternalServerError, apperror.CodeInternal, err.Error())
		return
	}

	response.OK(c, InviteCheckResponse{Email: email, UserExists: userExists})
}

// RedeemInviteToken godoc
// @Summary      Redeem invite token
// @Description  Redeem an invite token to promote the associated user to admin.
// @Tags         Users
// @Accept       json
// @Produce      json
// @Param        body  body      map[string]string  true  "Invite token payload"
// @Success      200   {object}  response.Response[map[string]string]
// @Failure      400   {object}  response.Response[any]
// @Failure      500   {object}  response.Response[any]
// @Router       /api/v1/users/invite-redeem [post]
func (h *InviteHandler) RedeemInviteToken(c *gin.Context) {
	var payload struct {
		Token string `json:"token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}

	if err := h.inviteService.RedeemInviteToken(c.Request.Context(), payload.Token); err != nil {
		if err == service.ErrInviteTokenInvalid {
			response.Error(c, http.StatusBadRequest, apperror.CodeValidation, "invalid or expired invite token")
			return
		}
		logger.Error("handler.invite.redeem_failed", "error", err.Error())
		response.Error(c, http.StatusInternalServerError, apperror.CodeInternal, err.Error())
		return
	}

	response.OK(c, gin.H{"message": "invitation redeemed successfully"})
}
