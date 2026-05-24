package storage

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

type MinioStorage struct {
	client     *minio.Client
	bucketName string
	publicURL  string
}

func NewMinioStorage() (*MinioStorage, error) {
	endpoint := os.Getenv("S3_ENDPOINT")
	accessKey := os.Getenv("S3_ACCESS_KEY")
	secretKey := os.Getenv("S3_SECRET_KEY")
	bucket := os.Getenv("S3_BUCKET")
	useSSL := false
	region := os.Getenv("S3_REGION")

	// Preserve scheme for public URL, strip for minio client (v7 expects host:port only)
	scheme := "http://"
	if strings.HasPrefix(endpoint, "https://") {
		scheme = "https://"
		useSSL = true
	}
	endpoint = strings.TrimPrefix(strings.TrimPrefix(endpoint, "https://"), "http://")

	if endpoint == "" || accessKey == "" || secretKey == "" || bucket == "" {
		return nil, fmt.Errorf("missing MinIO configuration: S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET must be set")
	}

	if region == "" {
		region = "us-east-1"
	}

	client, err := minio.New(endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(accessKey, secretKey, ""),
		Secure: useSSL,
		Region: region,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create MinIO client: %w", err)
	}

	ctx := context.Background()

	exists, err := client.BucketExists(ctx, bucket)
	if err != nil {
		return nil, fmt.Errorf("failed to check MinIO bucket: %w", err)
	}
	if !exists {
		if err := client.MakeBucket(ctx, bucket, minio.MakeBucketOptions{Region: region}); err != nil {
			return nil, fmt.Errorf("failed to create MinIO bucket: %w", err)
		}
	}

	policy := fmt.Sprintf(`{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"AWS":["*"]},"Action":["s3:GetObject"],"Resource":["arn:aws:s3:::%s/*"]}]}`, bucket)
	if err := client.SetBucketPolicy(ctx, bucket, policy); err != nil {
		return nil, fmt.Errorf("failed to set MinIO bucket policy: %w", err)
	}

	publicURL := fmt.Sprintf("%s%s/%s", scheme, endpoint, bucket)

	return &MinioStorage{
		client:     client,
		bucketName: bucket,
		publicURL:  publicURL,
	}, nil
}

func (s *MinioStorage) Put(ctx context.Context, objectKey string, reader io.Reader, size int64, contentType string) (UploadResult, error) {
	opts := minio.PutObjectOptions{
		ContentType: contentType,
	}
	if size >= 0 {
		opts.PartSize = 0
	}

	info, err := s.client.PutObject(ctx, s.bucketName, objectKey, reader, size, opts)
	if err != nil {
		return UploadResult{}, fmt.Errorf("minio put object failed: %w", err)
	}

	url := fmt.Sprintf("%s/%s", s.publicURL, objectKey)
	return UploadResult{
		URL:      url,
		Size:     info.Size,
		MimeType: contentType,
	}, nil
}

func (s *MinioStorage) PutBytes(ctx context.Context, objectKey string, data []byte, contentType string) (UploadResult, error) {
	return s.Put(ctx, objectKey, bytes.NewReader(data), int64(len(data)), contentType)
}

func (s *MinioStorage) Delete(ctx context.Context, objectKey string) error {
	err := s.client.RemoveObject(ctx, s.bucketName, objectKey, minio.RemoveObjectOptions{})
	if err != nil {
		if minio.ToErrorResponse(err).Code == "NoSuchKey" {
			return nil
		}
		return fmt.Errorf("minio delete object failed: %w", err)
	}
	return nil
}
