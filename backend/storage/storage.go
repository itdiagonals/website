package storage

import (
	"context"
	"io"
	"time"
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

	// PresignedPutURL generates a presigned URL that allows a client to upload an object directly.
	PresignedPutURL(ctx context.Context, objectKey string, expiry time.Duration) (string, error)

	// MoveObject copies an object from srcKey to dstKey and removes the source.
	MoveObject(ctx context.Context, srcKey, dstKey string) error

	// ObjectExists checks whether an object exists in the bucket.
	ObjectExists(ctx context.Context, objectKey string) (bool, error)
}
