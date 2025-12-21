#!/bin/sh
# Docker entrypoint script for the frontend service
# Handles .next directory ownership, builds if needed, and starts the Next.js server
# Runs as root initially to fix ownership/build, then switches to node user

set -e

echo "=== Frontend Container Starting ==="

# All root operations (ownership fixes, builds) happen here
# Then we re-execute this script as node user
if [ "$(id -u)" = "0" ]; then
  # Fix ownership of .next if it exists (from anonymous volume or previous build)
  if [ -d /app/.next ]; then
    echo "Fixing ownership of .next directory (from root to node)..."
    chown -R node:node /app/.next
    echo ".next ownership fixed"
  fi

  # Build Next.js app at runtime if production mode and build doesn't exist
  # This is needed because volume mount .:/app overwrites the build from Docker image
  if [ "$NODE_ENV" = "production" ] && [ ! -f /app/.next/BUILD_ID ]; then
    echo "Production build not found, building now..."
    su node -c "cd /app && pnpm build"
    echo "Build complete"
  fi

  # Switch to non-root user by re-executing this script as node user
  # The script will skip this block and proceed to command execution
  echo "Switching to non-root user (node) for application execution..."
  exec su node -s /bin/sh "$0" "$@"
fi

# From here on, we're running as node user (or already were non-root)
# Determine which command to run based on NODE_ENV
if [ "$NODE_ENV" = "production" ]; then
  echo "Running in production mode"
  RUN_CMD="pnpm start --port 3001"
else
  echo "Running in development mode"
  RUN_CMD="pnpm dev --port 3001"
fi

# Execute the appropriate command
cd /app
exec sh -c "$RUN_CMD"
