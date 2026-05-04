package storage

import (
	"context"
	"io"
)

// UploadResult holds metadata returned after a successful upload.
type UploadResult struct {
	URL      string
	Size     int64
	MimeType string
}

// Storage abstracts object storage operations.
type Storage interface {
	// Put uploads an object and returns its public URL, byte size, and content type.
	Put(ctx context.Context, objectKey string, reader io.Reader, size int64, contentType string) (UploadResult, error)

	// Delete removes an object. Returns nil if the object does not exist.
	Delete(ctx context.Context, objectKey string) error
}
