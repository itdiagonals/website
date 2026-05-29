package handler

import (
	"bytes"
	"context"
	"fmt"
	"image"
	_ "image/gif"
	_ "image/jpeg"
	_ "image/png"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/pkg/apperror"
	"github.com/itdiagonals/website/backend/pkg/logger"
	"github.com/itdiagonals/website/backend/pkg/response"
	"github.com/itdiagonals/website/backend/service"
	"github.com/itdiagonals/website/backend/storage"
)

const (
	maxUploadSize = 10 << 20
	storagePrefix = "media"
)

type MediaHandler struct {
	service *service.MediaService
	store   storage.Storage
}

type UploadMediaRequest struct {
	Alt string `form:"alt" binding:"required"`
}

type PresignedURLRequest struct {
	Filename    string `json:"filename" binding:"required"`
	ContentType string `json:"content_type" binding:"required"`
}

type PresignedURLResponse struct {
	SignedURL string `json:"signed_url"`
	ObjectKey string `json:"object_key"`
	PublicURL string `json:"public_url"`
}

type ConfirmUploadRequest struct {
	ObjectKey string `json:"object_key" binding:"required"`
	Alt       string `json:"alt" binding:"required"`
	DraftID   string `json:"draft_id"`
	Width     int    `json:"width"`
	Height    int    `json:"height"`
	Filesize  int64  `json:"filesize"`
	MimeType  string `json:"mime_type"`
}

func NewMediaHandler(service *service.MediaService, store storage.Storage) *MediaHandler {
	return &MediaHandler{service: service, store: store}
}

// GetAllMedia godoc
// @Summary      Get all media
// @Description  Retrieve a list of all media files
// @Tags         Media
// @Accept       json
// @Produce      json
// @Param        page   query     int  false  "Page number"
// @Param        limit  query     int  false  "Page size"
// @Success      200  {object}  response.ListResponse[domain.Media]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/media [get]
func (h *MediaHandler) GetAllMedia(c *gin.Context) {
	logger.Info("handler.media.get_all")

	draftID := c.Query("draft_id")
	if draftID != "" {
		media, err := h.service.GetMediaByDraftID(c.Request.Context(), draftID)
		if err != nil {
			logger.Error("handler.media.get_by_draft_failed", "error", err.Error())
			response.FromError(c, err)
			return
		}
		response.List(c, media, 1, len(media), len(media))
		return
	}

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
	media, total, err := h.service.GetAllMedia(c.Request.Context(), page, limit)
	if err != nil {
		logger.Error("handler.media.get_all_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.List(c, media, page, limit, int(total))
}

// GetMediaByID godoc
// @Summary      Get media by ID
// @Description  Retrieve a single media file by ID
// @Tags         Media
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Media ID"
// @Success      200  {object}  response.Response[domain.Media]
// @Failure      400  {object}  response.Response[any]
// @Failure      404  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/media/{id} [get]
func (h *MediaHandler) GetMediaByID(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.media.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid media id")
		return
	}

	logger.Info("handler.media.get_by_id", "id", id)
	m, err := h.service.GetMediaByID(c.Request.Context(), id)
	if err != nil {
		logger.Error("handler.media.get_by_id_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, m)
}

// CreateMedia godoc
// @Summary      Create media
// @Description  Create a new media file record
// @Tags         Media
// @Accept       json
// @Produce      json
// @Param        media  body      domain.CreateMediaRequest  true  "Media payload"
// @Success      201    {object}  response.Response[domain.Media]
// @Failure      400    {object}  response.Response[any]
// @Failure      500    {object}  response.Response[any]
// @Router       /api/v1/media [post]
func (h *MediaHandler) CreateMedia(c *gin.Context) {
	var req domain.CreateMediaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.media.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}

	media := req.ToMedia()

	logger.Info("handler.media.create", "filename", media.Filename)
	if err := h.service.CreateMedia(c.Request.Context(), &media); err != nil {
		logger.Error("handler.media.create_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.Created(c, media)
}

// GetPresignedURL godoc
// @Summary      Get presigned upload URL
// @Description  Generate a presigned URL for direct client upload to object storage temp folder
// @Tags         Media
// @Accept       json
// @Produce      json
// @Param        body  body      PresignedURLRequest  true  "Presigned URL request"
// @Success      200   {object}  response.Response[PresignedURLResponse]
// @Failure      400   {object}  response.Response[any]
// @Failure      500   {object}  response.Response[any]
// @Router       /api/v1/media/presigned-url [post]
func (h *MediaHandler) GetPresignedURL(c *gin.Context) {
	var req PresignedURLRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.media.presigned_bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}

	if !strings.HasPrefix(req.ContentType, "image/") {
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, "only image uploads are allowed")
		return
	}

	storedName := buildStoredMediaFilename(req.Filename)
	objectKey := "temp/" + storedName

	signedURL, publicURL, err := h.service.GeneratePresignedURL(c.Request.Context(), objectKey)
	if err != nil {
		logger.Error("handler.media.presigned_failed", "error", err.Error())
		response.Error(c, http.StatusInternalServerError, apperror.CodeInternal, err.Error())
		return
	}

	response.OK(c, PresignedURLResponse{
		SignedURL: signedURL,
		ObjectKey: objectKey,
		PublicURL: publicURL,
	})
}

// ConfirmUpload godoc
// @Summary      Confirm upload
// @Description  Confirm a direct upload by moving object from temp to final path and creating a media record
// @Tags         Media
// @Accept       json
// @Produce      json
// @Param        body  body      ConfirmUploadRequest  true  "Confirm upload request"
// @Success      201   {object}  response.Response[domain.Media]
// @Failure      400   {object}  response.Response[any]
// @Failure      500   {object}  response.Response[any]
// @Router       /api/v1/media/confirm [post]
func (h *MediaHandler) ConfirmUpload(c *gin.Context) {
	var req ConfirmUploadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.media.confirm_bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}

	media, err := h.service.ConfirmUpload(
		c.Request.Context(),
		req.ObjectKey,
		req.Alt,
		strings.TrimSpace(req.DraftID),
		req.Width,
		req.Height,
		req.Filesize,
		req.MimeType,
	)
	if err != nil {
		logger.Error("handler.media.confirm_failed", "error", err.Error())
		response.Error(c, http.StatusInternalServerError, apperror.CodeInternal, err.Error())
		return
	}

	response.Created(c, media)
}

// UploadMedia godoc
// @Summary      Upload media file (legacy)
// @Description  Upload a media file via multipart/form-data, convert non-WebP images to WebP, upload to MinIO, and create a media record
// @Tags         Media
// @Accept       multipart/form-data
// @Produce      json
// @Param        file  formData  file    true   "Media file"
// @Param        alt   formData  string  true   "Alt text"
// @Success      201   {object}  response.Response[domain.Media]
// @Failure      400   {object}  response.Response[any]
// @Failure      500   {object}  response.Response[any]
// @Router       /api/v1/media/upload [post]
func (h *MediaHandler) UploadMedia(c *gin.Context) {
	if h.store == nil {
		logger.Error("handler.media.upload_no_storage")
		response.Error(c, http.StatusServiceUnavailable, apperror.CodeInternal, "object storage is not configured")
		return
	}

	var req UploadMediaRequest
	if err := c.ShouldBind(&req); err != nil {
		logger.Warn("handler.media.upload_bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		logger.Warn("handler.media.upload_file_missing", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, "file is required")
		return
	}

	if fileHeader.Filename == "" {
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, "file name is required")
		return
	}

	if fileHeader.Size > maxUploadSize {
		logger.Warn("handler.media.upload_too_large", "size", fileHeader.Size)
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation,
			fmt.Sprintf("file size exceeds maximum of %d bytes", maxUploadSize))
		return
	}

	storedName := buildStoredMediaFilename(fileHeader.Filename)
	objectKey := storagePrefix + "/" + storedName

	uploadResult, imgWidth, imgHeight, err := validateAndUploadToStorage(
		c.Request.Context(), h.store, fileHeader, objectKey,
	)
	if err != nil {
		logger.Error("handler.media.upload_convert_upload_failed", "error", err.Error())
		response.Error(c, http.StatusInternalServerError, apperror.CodeInternal, err.Error())
		return
	}

	media := domain.Media{
		Alt:      strings.TrimSpace(req.Alt),
		URL:      uploadResult.URL,
		Filename: storedName,
		MimeType: uploadResult.MimeType,
		Filesize: uploadResult.Size,
		Width:    imgWidth,
		Height:   imgHeight,
	}

	draftID := strings.TrimSpace(c.PostForm("draft_id"))
	if draftID != "" {
		media.DraftID = &draftID
	}

	if err := h.service.CreateMedia(c.Request.Context(), &media); err != nil {
		logger.Error("handler.media.upload_create_failed", "error", err.Error())
		_ = h.store.Delete(c.Request.Context(), objectKey)
		response.FromError(c, err)
		return
	}

	response.Created(c, media)
}

// UpdateMedia godoc
// @Summary      Update media
// @Description  Update an existing media file record
// @Tags         Media
// @Accept       json
// @Produce      json
// @Param        id     path      int                         true  "Media ID"
// @Param        media  body      domain.UpdateMediaRequest   true  "Media payload"
// @Success      200    {object}  response.Response[domain.Media]
// @Failure      400    {object}  response.Response[any]
// @Failure      404    {object}  response.Response[any]
// @Failure      500    {object}  response.Response[any]
// @Router       /api/v1/media/{id} [put]
func (h *MediaHandler) UpdateMedia(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.media.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid media id")
		return
	}

	var req domain.UpdateMediaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		logger.Warn("handler.media.bind_failed", "error", err.Error())
		response.Error(c, http.StatusBadRequest, apperror.CodeValidation, err.Error())
		return
	}
	media := req.ToMedia(id)

	logger.Info("handler.media.update", "id", id)
	if err := h.service.UpdateMedia(c.Request.Context(), &media); err != nil {
		logger.Error("handler.media.update_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.OK(c, media)
}

// DeleteMedia godoc
// @Summary      Delete media
// @Description  Delete a media file record by ID
// @Tags         Media
// @Accept       json
// @Produce      json
// @Param        id   path      int  true  "Media ID"
// @Success      204
// @Failure      400  {object}  response.Response[any]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/media/{id} [delete]
func (h *MediaHandler) DeleteMedia(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		logger.Warn("handler.media.invalid_id", "param", c.Param("id"))
		response.Error(c, http.StatusBadRequest, apperror.CodeBadRequest, "invalid media id")
		return
	}

	logger.Info("handler.media.delete", "id", id)
	if err := h.service.DeleteMedia(c.Request.Context(), id); err != nil {
		logger.Error("handler.media.delete_failed", "id", id, "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.NoContent(c)
}

func buildStoredMediaFilename(originalName string) string {
	baseName := strings.TrimSpace(filepath.Base(originalName))
	if baseName == "" {
		baseName = "media"
	}

	cleaned := strings.Map(func(r rune) rune {
		switch {
		case unicode.IsLetter(r), unicode.IsDigit(r), r == '.', r == '-', r == '_':
			return r
		default:
			return '_'
		}
	}, baseName)
	cleaned = strings.Trim(cleaned, "._-")
	if cleaned == "" {
		cleaned = "media"
	}

	return fmt.Sprintf("%d-%s", time.Now().UnixNano(), cleaned)
}

func validateAndUploadToStorage(
	ctx context.Context,
	store storage.Storage,
	fileHeader *multipart.FileHeader,
	objectKey string,
) (storage.UploadResult, int, int, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return storage.UploadResult{}, 0, 0, err
	}
	defer file.Close()

	sourceData, err := io.ReadAll(file)
	if err != nil {
		return storage.UploadResult{}, 0, 0, err
	}

	contentType := fileHeader.Header.Get("Content-Type")

	imgWidth, imgHeight, err := validateUploadedImage(contentType, sourceData)
	if err != nil {
		return storage.UploadResult{}, 0, 0, err
	}

	result, err := store.Put(ctx, objectKey, bytes.NewReader(sourceData), int64(len(sourceData)), contentType)
	if err != nil {
		return storage.UploadResult{}, 0, 0, fmt.Errorf("upload to storage failed: %w", err)
	}
	return result, imgWidth, imgHeight, nil
}

func validateUploadedImage(contentType string, data []byte) (int, int, error) {
	normalizedMime := strings.ToLower(strings.TrimSpace(contentType))
	if normalizedMime != "" && !strings.HasPrefix(normalizedMime, "image/") {
		return 0, 0, fmt.Errorf("unsupported media type: %s, only images are allowed", normalizedMime)
	}

	config, _, err := image.DecodeConfig(bytes.NewReader(data))
	if err == nil {
		return config.Width, config.Height, nil
	}
	return 0, 0, nil
}
