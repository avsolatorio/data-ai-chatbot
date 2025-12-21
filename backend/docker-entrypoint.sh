#!/bin/bash
# Docker entrypoint script for the backend service
# Handles database migrations and starts the application

set -e

echo "=== Backend Container Starting ==="

if [ "$(id -u)" = "0" ]; then
  if [ -d /app/.venv ]; then
    echo "Fixing ownership of .venv directory (from root to appuser)..."
    chown -R appuser:appuser /app/.venv
    echo ".venv ownership fixed"
  else
    echo "Note: .venv directory does not exist yet (will be created by uv as appuser)"
  fi
  # Also ensure any other files in /app that might be root-owned are fixed
  # But be careful not to chown the bind mount itself (./backend:/app)
  # The anonymous volume for .venv is safe to chown
fi

# Switch to non-root user if running as root
# This improves security by running with least privilege
if [ "$(id -u)" = "0" ]; then
  echo "Switching to non-root user (appuser) for application execution..."
  # Re-execute this script as appuser using gosu
  # The script will skip this block and proceed to migrations/startup
  exec gosu appuser "$0" "$@"
fi

# From here on, we're running as appuser (or already were non-root)
# Note: Database readiness is handled by docker-compose depends_on: condition: service_healthy

echo "Running database migrations..."
uv run alembic upgrade head

echo "Migrations complete!"
echo "Starting FastAPI application..."
exec "$@"
