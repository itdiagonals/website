package logger

import (
	"context"
	"log/slog"
	"os"
	"time"
)

var defaultLogger *slog.Logger

func init() {
	defaultLogger = slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: slog.LevelInfo,
	}))
}

// Config holds logger configuration.
type Config struct {
	Level  slog.Level
	JSON   bool
	Output *os.File
}

// Init initializes the global logger.
func Init(cfg Config) {
	opts := &slog.HandlerOptions{Level: cfg.Level}
	var handler slog.Handler
	if cfg.JSON {
		handler = slog.NewJSONHandler(cfg.Output, opts)
	} else {
		handler = slog.NewTextHandler(cfg.Output, opts)
	}
	defaultLogger = slog.New(handler)
}

// Logger returns the default logger instance.
func Logger() *slog.Logger {
	return defaultLogger
}

// Info logs an info message.
func Info(msg string, args ...any) {
	defaultLogger.Info(msg, args...)
}

// Warn logs a warning message.
func Warn(msg string, args ...any) {
	defaultLogger.Warn(msg, args...)
}

// Error logs an error message.
func Error(msg string, args ...any) {
	defaultLogger.Error(msg, args...)
}

// Debug logs a debug message.
func Debug(msg string, args ...any) {
	defaultLogger.Debug(msg, args...)
}

// Fatal logs a fatal message and exits.
func Fatal(msg string, args ...any) {
	defaultLogger.Error(msg, args...)
	os.Exit(1)
}

// WithContext returns a logger with request context fields.
func WithContext(ctx context.Context) *slog.Logger {
	if reqID, ok := ctx.Value("request_id").(string); ok && reqID != "" {
		return defaultLogger.With("request_id", reqID)
	}
	return defaultLogger
}

// Request logs an HTTP request.
func Request(method, path, clientIP string, status int, latency time.Duration, err error) {
	args := []any{
		"method", method,
		"path", path,
		"client_ip", clientIP,
		"status", status,
		"latency_ms", latency.Milliseconds(),
	}
	if err != nil {
		args = append(args, "error", err.Error())
		defaultLogger.Error("http_request", args...)
		return
	}
	defaultLogger.Info("http_request", args...)
}

// DBQuery logs a database query.
func DBQuery(operation, table string, rowsAffected int64, latency time.Duration, err error) {
	args := []any{
		"operation", operation,
		"table", table,
		"rows_affected", rowsAffected,
		"latency_ms", latency.Milliseconds(),
	}
	if err != nil {
		args = append(args, "error", err.Error())
		defaultLogger.Error("db_query", args...)
		return
	}
	defaultLogger.Debug("db_query", args...)
}

// ServiceCall logs a service layer call.
func ServiceCall(operation string, err error, args ...any) {
	allArgs := append([]any{"operation", operation}, args...)
	if err != nil {
		allArgs = append(allArgs, "error", err.Error())
		defaultLogger.Error("service_call", allArgs...)
		return
	}
	defaultLogger.Debug("service_call", allArgs...)
}
