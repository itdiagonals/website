package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/pkg/apperror"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/itdiagonals/website/backend/pkg/response"
	"github.com/itdiagonals/website/backend/service"
)

type StatsHandler struct {
	statsService *service.StatsService
}

func NewStatsHandler(statsService *service.StatsService) *StatsHandler {
	return &StatsHandler{statsService: statsService}
}

func (h *StatsHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.statsService.GetDashboardStats(c.Request.Context())
	if err != nil {
		logger.Error("handler.stats.get_failed", "error", err.Error())
		response.Error(c, http.StatusInternalServerError, apperror.CodeInternal, err.Error())
		return
	}
	response.OK(c, stats)
}
