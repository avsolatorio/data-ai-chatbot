# Backend Dockerfile for local development
# This is NOT intended for production use

FROM python:3.10-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv package manager
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

# Set working directory
WORKDIR /app

# Copy dependency files AND README.md (required by hatchling build)
COPY pyproject.toml uv.lock README.md ./

# Install dependencies
RUN uv sync --frozen

# Copy application code
COPY . .

# Copy and set up entrypoint script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose the backend port
EXPOSE 8001

# Use entrypoint script to handle migrations
ENTRYPOINT ["/docker-entrypoint.sh"]

# Run the FastAPI application in development mode
# Using uvicorn with reload for hot reloading during development
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
