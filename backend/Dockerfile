# Backend Dockerfile for local development
# This is NOT intended for production use

# FROM python:3.10-slim
# FROM ghcr.io/astral-sh/uv:python3.10-bookworm
FROM astral/uv:python3.12-bookworm-slim

# Create non-root user for security
RUN groupadd -r appuser && \
    useradd -r -g appuser -u 1000 -d /app -s /bin/bash appuser

# Install gosu for secure user switching in entrypoint script
RUN apt-get update && \
    apt-get install -y --no-install-recommends gosu && \
    rm -rf /var/lib/apt/lists/* && \
    gosu nobody true

# Set working directory
WORKDIR /app

# Copy dependency files AND README.md (required by hatchling build)
COPY --chown=appuser:appuser pyproject.toml uv.lock README.md ./

# Install dependencies as root (needed for certificate installation)
# Mount certificate as BuildKit secret during build (optional, for build-time dependencies)
# Certificate is installed into the image's CA bundle at /etc/ssl/certs/ca-certificates.crt
# Then install Python dependencies (always runs, regardless of certificate)
RUN --mount=type=secret,id=corp_cert,target=/tmp/corp-root-ca.crt \
    if [ -f /tmp/corp-root-ca.crt ]; then \
      cp /tmp/corp-root-ca.crt /usr/local/share/ca-certificates/corp-root-ca.crt && \
      update-ca-certificates; \
    fi && \
    uv sync --frozen --no-dev && \
    chown -R appuser:appuser /app

# Copy application code with proper ownership
COPY --chown=appuser:appuser . .

# Copy and set up entrypoint script
# Entrypoint runs as root to install certificates, then switches to appuser
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Expose the backend port
EXPOSE 8001

# Don't set USER here - entrypoint will handle user switching
# This allows entrypoint to run as root for certificate installation, then switch to appuser
ENTRYPOINT ["/docker-entrypoint.sh"]

# Run the FastAPI application in development mode
# Using uvicorn with reload for hot reloading during development
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001", "--reload"]
