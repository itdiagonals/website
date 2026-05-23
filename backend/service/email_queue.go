package service

import (
	"context"
	"fmt"
	"sync"

	"github.com/itdiagonals/website/backend/domain"
	"github.com/itdiagonals/website/backend/pkg/logger"
)

// EmailQueue is the abstraction for email queuing systems.
// The in-memory implementation is suitable for moderate volume.
// For high volume or distributed systems, replace with a RabbitMQ/Redis implementation.
type EmailQueue interface {
	Enqueue(ctx context.Context, msg domain.EmailMessage) error
	Dequeue(ctx context.Context) (domain.EmailMessage, error)
	Close() error
}

// InMemoryEmailQueue implements EmailQueue using Go channels.
// This is production-ready for single-instance deployments with moderate email volume.
type InMemoryEmailQueue struct {
	ch     chan domain.EmailMessage
	closed bool
	mu     sync.RWMutex
}

// NewInMemoryEmailQueue creates a new in-memory email queue with the specified buffer size.
func NewInMemoryEmailQueue(bufferSize int) *InMemoryEmailQueue {
	return &InMemoryEmailQueue{
		ch: make(chan domain.EmailMessage, bufferSize),
	}
}

// Send implements EmailSender by enqueuing the email.
func (q *InMemoryEmailQueue) Send(ctx context.Context, msg domain.EmailMessage) error {
	return q.Enqueue(ctx, msg)
}

func (q *InMemoryEmailQueue) Enqueue(ctx context.Context, msg domain.EmailMessage) error {
	q.mu.RLock()
	if q.closed {
		q.mu.RUnlock()
		return fmt.Errorf("queue is closed")
	}
	q.mu.RUnlock()

	select {
	case q.ch <- msg:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

func (q *InMemoryEmailQueue) Dequeue(ctx context.Context) (domain.EmailMessage, error) {
	select {
	case msg, ok := <-q.ch:
		if !ok {
			return domain.EmailMessage{}, fmt.Errorf("queue is closed")
		}
		return msg, nil
	case <-ctx.Done():
		return domain.EmailMessage{}, ctx.Err()
	}
}

func (q *InMemoryEmailQueue) Close() error {
	q.mu.Lock()
	defer q.mu.Unlock()

	if q.closed {
		return nil
	}

	q.closed = true
	close(q.ch)
	return nil
}

// EmailWorker processes emails from the queue and sends them via the provider.
type EmailWorker struct {
	queue    EmailQueue
	provider EmailProvider
	wg       sync.WaitGroup
	stopCh   chan struct{}
	workers  int
}

// NewEmailWorker creates a new email worker pool.
func NewEmailWorker(queue EmailQueue, provider EmailProvider, workerCount int) *EmailWorker {
	return &EmailWorker{
		queue:    queue,
		provider: provider,
		stopCh:   make(chan struct{}),
		workers:  workerCount,
	}
}

// Start begins processing emails from the queue.
func (w *EmailWorker) Start(ctx context.Context) {
	for i := 0; i < w.workers; i++ {
		w.wg.Add(1)
		go w.run(ctx, i)
	}
	logger.Info("email.worker.started", "workers", w.workers)
}

// Stop gracefully shuts down the worker pool.
func (w *EmailWorker) Stop() {
	close(w.stopCh)
	w.wg.Wait()
	logger.Info("email.worker.stopped")
}

func (w *EmailWorker) run(ctx context.Context, id int) {
	defer w.wg.Done()

	for {
		select {
		case <-w.stopCh:
			return
		default:
		}

		msg, err := w.queue.Dequeue(ctx)
		if err != nil {
			if ctx.Err() != nil {
				return
			}
			logger.Warn("email.worker.dequeue.failed", "worker", id, "error", err.Error())
			continue
		}

		if err := w.provider.Send(ctx, msg); err != nil {
			logger.Error("email.worker.send.failed", "worker", id, "error", err.Error(), "to", msg.To[0].Email)
			continue
		}

		logger.Info("email.worker.sent", "worker", id, "to", msg.To[0].Email, "subject", msg.Subject)
	}
}
