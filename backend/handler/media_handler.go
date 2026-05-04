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
	"github.com/ryanbekhen/go-webp"
)

const (
	maxUploadSize = 10 << 20
	storagePrefix = "media"
)

var allowedMimeTypes = map[string]bool{
	"image/jpeg": true,
	"image/png":  true,
	"image/webp": true,
	"image/gif":  true,
}

type MediaHandler struct {
	service *service.MediaService
	store   storage.Storage
}

type UploadMediaRequest struct {
	Alt string `form:"alt" binding:"required"`
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
// @Success      200  {object}  response.ListResponse[domain.Media]
// @Failure      500  {object}  response.Response[any]
// @Router       /api/v1/media [get]
func (h *MediaHandler) GetAllMedia(c *gin.Context) {
	logger.Info("handler.media.get_all")
	media, err := h.service.GetAllMedia(c.Request.Context())
	if err != nil {
		logger.Error("handler.media.get_all_failed", "error", err.Error())
		response.FromError(c, err)
		return
	}
	response.List(c, media, 1, len(media), len(media))
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

// UploadMedia godoc
// @Summary      Upload media file
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

	storedName := ensureWebPFilename(buildStoredMediaFilename(fileHeader.Filename))
	objectKey := storagePrefix + "/" + storedName

	uploadResult, imgWidth, imgHeight, err := convertAndUploadToStorage(
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

func ensureWebPFilename(storedName string) string {
	extension := strings.ToLower(filepath.Ext(storedName))
	if extension == ".webp" {
		return storedName
	}

	baseName := strings.TrimSuffix(storedName, extension)
	if baseName == "" {
		baseName = storedName
	}

	return baseName + ".webp"
}

func convertAndUploadToStorage(
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

	imgWidth, imgHeight, err := validateUploadedImage(fileHeader.Filename, contentType, sourceData)
	if err != nil {
		return storage.UploadResult{}, 0, 0, err
	}

	if isWebPUpload(fileHeader.Filename, contentType, sourceData) {
		result, err := store.Put(ctx, objectKey, bytes.NewReader(sourceData), int64(len(sourceData)), "image/webp")
		if err != nil {
			return storage.UploadResult{}, 0, 0, fmt.Errorf("upload webp to storage failed: %w", err)
		}
		return result, imgWidth, imgHeight, nil
	}

	webpData, err := convertImageToWebP(sourceData)
	if err != nil {
		return storage.UploadResult{}, 0, 0, err
	}

	result, err := store.Put(ctx, objectKey, bytes.NewReader(webpData), int64(len(webpData)), "image/webp")
	if err != nil {
		return storage.UploadResult{}, 0, 0, fmt.Errorf("upload converted webp to storage failed: %w", err)
	}
	return result, imgWidth, imgHeight, nil
}

func validateUploadedImage(filename, contentType string, data []byte) (int, int, error) {
	normalizedMime := strings.ToLower(strings.TrimSpace(contentType))
	if normalizedMime != "" && !allowedMimeTypes[normalizedMime] {
		return 0, 0, fmt.Errorf("unsupported media type: %s", normalizedMime)
	}

	extension := strings.ToLower(filepath.Ext(filename))
	if extension != "" {
		mimeFromExt := mimeByExtension(extension)
		if mimeFromExt != "" && !allowedMimeTypes[mimeFromExt] {
			return 0, 0, fmt.Errorf("unsupported file extension: %s", extension)
		}
	}

	config, format, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return 0, 0, fmt.Errorf("invalid or unsupported image: %w", err)
	}

	formatMime := "image/" + format
	if !allowedMimeTypes[formatMime] {
		return 0, 0, fmt.Errorf("unsupported image format: %s", format)
	}

	return config.Width, config.Height, nil
}

func mimeByExtension(ext string) string {
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".gif":
		return "image/gif"
	default:
		return ""
	}
}

func convertImageToWebP(sourceData []byte) ([]byte, error) {
	img, _, err := image.Decode(bytes.NewReader(sourceData))
	if err != nil {
		return nil, fmt.Errorf("failed to decode image for conversion: %w", err)
	}

	var buf bytes.Buffer
	if err := webp.Encode(img, 75, &buf); err != nil {
		return nil, fmt.Errorf("webp conversion failed: %w", err)
	}

	return buf.Bytes(), nil
}

func isWebPUpload(filename string, contentType string, sourceData []byte) bool {
	extension := strings.ToLower(filepath.Ext(filename))
	if extension == ".webp" {
		return true
	}

	if strings.EqualFold(strings.TrimSpace(contentType), "image/webp") {
		return true
	}

	return len(sourceData) >= 12 && string(sourceData[:4]) == "RIFF" && string(sourceData[8:12]) == "WEBP"
}
