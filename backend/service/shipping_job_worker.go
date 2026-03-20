package service

import (
	"context"
	"errors"
	"log"
	"strings"
	"time"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/repository"
)

type ShippingJobWorker interface {
	Start(ctx context.Context)
}

type shippingJobWorker struct {
	jobRepository  repository.ShippingJobRepository
	bookingService ShippingBookingService
	pollInterval   time.Duration
	baseRetryDelay time.Duration
	maxRetryDelay  time.Duration
}

func NewShippingJobWorker(jobRepository repository.ShippingJobRepository, bookingService ShippingBookingService) ShippingJobWorker {
	return &shippingJobWorker{
		jobRepository:  jobRepository,
		bookingService: bookingService,
		pollInterval:   2 * time.Second,
		baseRetryDelay: 5 * time.Second,
		maxRetryDelay:  5 * time.Minute,
	}
}

func (worker *shippingJobWorker) Start(ctx context.Context) {
	ticker := time.NewTicker(worker.pollInterval)
	defer ticker.Stop()

	for {
		if err := worker.processAvailable(ctx); err != nil {
			log.Printf("shipping job worker process error: %v", err)
		}

		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
	}
}

func (worker *shippingJobWorker) processAvailable(ctx context.Context) error {
	for {
		job, err := worker.jobRepository.ClaimNext(ctx)
		if err != nil {
			return err
		}
		if job == nil {
			return nil
		}

		if err := worker.handleJob(ctx, job); err != nil {
			log.Printf("shipping job worker handle error id=%d order_id=%s: %v", job.ID, job.OrderID, err)
		}
	}
}

func (worker *shippingJobWorker) handleJob(ctx context.Context, job *domain.ShippingJob) error {
	if job == nil {
		return nil
	}
	if worker.bookingService == nil {
		return worker.jobRepository.MarkFailed(ctx, job.ID, "booking service unavailable")
	}

	if strings.TrimSpace(job.JobType) != repository.ShippingJobTypeBookShipment {
		return worker.jobRepository.MarkFailed(ctx, job.ID, "unsupported job type")
	}

	err := worker.bookingService.BookShipmentForOrder(ctx, strings.TrimSpace(job.OrderID))
	if err == nil {
		return worker.jobRepository.MarkSucceeded(ctx, job.ID)
	}

	if isShippingJobPermanentError(err) || job.Attempts+1 >= job.MaxAttempts {
		return worker.jobRepository.MarkFailed(ctx, job.ID, err.Error())
	}

	nextRunAt := time.Now().UTC().Add(worker.retryDelay(job.Attempts + 1))
	return worker.jobRepository.MarkRetry(ctx, job.ID, nextRunAt, err.Error())
}

func (worker *shippingJobWorker) retryDelay(attempt int) time.Duration {
	if attempt <= 1 {
		return worker.baseRetryDelay
	}

	delay := worker.baseRetryDelay * time.Duration(1<<(attempt-1))
	if delay > worker.maxRetryDelay {
		return worker.maxRetryDelay
	}

	return delay
}

func isShippingJobPermanentError(err error) bool {
	if err == nil {
		return false
	}

	return errors.Is(err, ErrMidtransInvalidPayload) ||
		errors.Is(err, ErrMidtransOrderNotFound)
}
