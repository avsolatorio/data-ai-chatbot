#!/bin/bash
# Docker entrypoint script for the backend service
# Handles database migrations and starts the application

set -e

echo "=== Backend Container Starting ==="

# Wait for database to be ready (in addition to Docker health check)
echo "Waiting for database to be ready..."
uv run python -c "
import asyncio
import asyncpg
import os
import time

async def wait_for_db():
    url = os.environ.get('POSTGRES_URL', '')
    # Convert async URL to sync format for connection test
    url = url.replace('postgresql+asyncpg://', 'postgresql://')
    
    max_retries = 30
    retry_interval = 2
    
    for i in range(max_retries):
        try:
            conn = await asyncpg.connect(url)
            await conn.close()
            print('Database is ready!')
            return True
        except Exception as e:
            print(f'Waiting for database... ({i+1}/{max_retries})')
            time.sleep(retry_interval)
    
    raise Exception('Database not available after maximum retries')

asyncio.run(wait_for_db())
"

# Run Alembic migrations
echo "Running database migrations..."
uv run alembic upgrade head

echo "Migrations complete!"

# Start the application
echo "Starting FastAPI application..."
exec "$@"
