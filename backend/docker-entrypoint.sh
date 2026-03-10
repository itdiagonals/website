#!/bin/sh
set -eu

echo "Running backend database migrations..."
until /app/migrate; do
  echo "Migration failed or database not ready yet. Retrying in 2 seconds..."
  sleep 2
done

echo "Starting backend API on :8080"
exec /app/server