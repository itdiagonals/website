package storage

import (
	"fmt"
	"os"
	"strings"
)

func PublicURLPrefix() string {
	publicURL := strings.TrimSpace(os.Getenv("S3_PUBLIC_URL"))
	bucket := strings.TrimSpace(os.Getenv("S3_BUCKET"))

	if publicURL == "" {
		publicURL = strings.TrimSpace(os.Getenv("S3_ENDPOINT"))
	}

	publicURL = strings.TrimRight(publicURL, "/")
	bucket = strings.Trim(bucket, "/")

	if publicURL == "" {
		return ""
	}

	if bucket == "" {
		return publicURL
	}

	return fmt.Sprintf("%s/%s", publicURL, bucket)
}

func PublicObjectURL(objectKey string) string {
	base := PublicURLPrefix()
	if base == "" {
		return strings.TrimLeft(objectKey, "/")
	}

	return fmt.Sprintf("%s/%s", strings.TrimRight(base, "/"), strings.TrimLeft(objectKey, "/"))
}
