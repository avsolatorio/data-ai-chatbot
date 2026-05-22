"""Application-wide observability (OpenTelemetry traces)."""

from app.observability.otel_setup import (
    chatbot_operation_from_url,
    configure_open_telemetry,
    instrument_fastapi_app,
    instrument_httpx_outbound,
    is_tracing_enabled,
    record_error_on_span,
)

__all__ = [
    "chatbot_operation_from_url",
    "configure_open_telemetry",
    "instrument_fastapi_app",
    "instrument_httpx_outbound",
    "is_tracing_enabled",
    "record_error_on_span",
]
