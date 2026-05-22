"""OpenTelemetry setup: Azure Monitor (deployed), OTLP/console (local), httpx outbound spans."""

from __future__ import annotations

import logging
import os
from typing import TYPE_CHECKING, Any, cast
from urllib.parse import urlparse

if TYPE_CHECKING:
    from app.config import Settings

_logger = logging.getLogger(__name__)

_HTTPX_INSTRUMENTED = False
_TRACING_ACTIVE = False
_MIN_TRANSPORT_PARTS_FOR_URL = 2

_LOCAL_ENVIRONMENTS = frozenset({"development", "local", "dev"})


def is_tracing_enabled() -> bool:
    """True when a tracer provider was configured (Azure Monitor, OTLP, or console)."""
    return _TRACING_ACTIVE


def _is_local_environment(environment: str) -> bool:
    return (environment or "").strip().lower() in _LOCAL_ENVIRONMENTS


def chatbot_operation_from_url(url: str | None) -> str:  # noqa: PLR0911
    """Derive a stable operation label from an outbound URL path (no query logged)."""
    if not url:
        return "http"
    try:
        path = urlparse(url).path.lower()
        host = urlparse(url).netloc.lower()
    except Exception:
        return "http"
    if "/mcp" in path or path.rstrip("/").endswith("/mcp"):
        return "mcp"
    if "openai.azure" in host or "/openai/" in path or "chat/completions" in path:
        return "azure_openai"
    if "/charts" in path or "/chart" in path:
        return "charts"
    if "searchv2" in path:
        return "search"
    if "metadata" in path:
        return "metadata"
    if path.rstrip("/").endswith("/data") or "/data360/data" in path:
        return "data"
    return "http"


def _httpx_request_hook(span: object, request: object) -> None:
    """Attach chatbot-specific attributes; never log bodies or secrets."""
    try:
        if span is None:
            return
        is_recording = getattr(span, "is_recording", None)
        if callable(is_recording) and not is_recording():
            return
        url_str: str | None = None
        if isinstance(request, tuple) and len(request) >= _MIN_TRANSPORT_PARTS_FOR_URL:
            url_str = str(request[1])
        else:
            req_any = cast("Any", request)
            url_attr = getattr(req_any, "url", None)
            if url_attr is not None:
                url_str = str(url_attr)
        op = chatbot_operation_from_url(url_str)
        cast("Any", span).set_attribute("chatbot.operation", op)
        if url_str:
            try:
                parsed = urlparse(url_str)
                netloc = parsed.netloc.split("@")[-1]
                cast("Any", span).set_attribute("server.address", netloc.split(":")[0])
            except Exception:
                pass
    except Exception:
        pass


def _httpx_response_hook(span: object, request: object, response: object) -> None:
    """Record HTTP status; avoid logging bodies."""
    try:
        if span is None:
            return
        is_recording = getattr(span, "is_recording", None)
        if callable(is_recording) and not is_recording():
            return
        status = getattr(response, "status_code", None)
        if status is not None:
            cast("Any", span).set_attribute("http.response.status_code", int(status))
    except Exception:
        pass


def configure_open_telemetry(settings: Settings) -> None:
    """Configure trace export: Azure Monitor when deployed; OTLP or console when local."""
    global _TRACING_ACTIVE  # noqa: PLW0603

    connection_string = (
        settings.APPLICATIONINSIGHTS_CONNECTION_STRING or ""
    ).strip() or os.environ.get("APPLICATIONINSIGHTS_CONNECTION_STRING", "").strip()
    environment = (settings.ENVIRONMENT or "").strip().lower()

    if not _is_local_environment(environment) and connection_string:
        try:
            from azure.monitor.opentelemetry import (  # type: ignore[import-untyped]  # noqa: PLC0415
                configure_azure_monitor,
            )

            # Disable distro FastAPI auto-instrument so we can call instrument_app with
            # exclude_spans (avoids noisy per-chunk http receive/send on SSE /api/chat).
            configure_azure_monitor(
                connection_string=connection_string,
                instrumentation_options={"fastapi": {"enabled": False}},
            )
            _TRACING_ACTIVE = True
            _logger.info("Azure Monitor OpenTelemetry configured.")
        except ImportError:
            _logger.warning("azure-monitor-opentelemetry not available.")
        return

    endpoint = os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT") or os.environ.get(
        "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"
    )
    console = os.environ.get("CHATBOT_OTEL_CONSOLE", "").lower() in ("1", "true", "yes")

    if not endpoint and not console:
        _logger.debug(
            "Local telemetry: no OTLP endpoint and CHATBOT_OTEL_CONSOLE unset; "
            "traces use noop unless OTEL_* env configures a provider elsewhere."
        )
        return

    from opentelemetry import trace  # noqa: PLC0415
    from opentelemetry.sdk.resources import SERVICE_NAME, Resource  # noqa: PLC0415
    from opentelemetry.sdk.trace import TracerProvider  # noqa: PLC0415
    from opentelemetry.sdk.trace.export import BatchSpanProcessor  # noqa: PLC0415

    service_name = os.environ.get("OTEL_SERVICE_NAME", "ai-chatbot-backend")
    resource = Resource.create({SERVICE_NAME: service_name})
    provider = TracerProvider(resource=resource)

    if console:
        from opentelemetry.sdk.trace.export import ConsoleSpanExporter  # noqa: PLC0415

        provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
        _logger.info("OpenTelemetry console span export enabled (CHATBOT_OTEL_CONSOLE).")

    if endpoint:
        try:
            use_http = endpoint.startswith(("http://", "https://"))
            proto = os.environ.get("OTEL_EXPORTER_OTLP_PROTOCOL", "").lower()
            if proto in ("http/protobuf", "http/json"):
                use_http = True
            if use_http:
                from opentelemetry.exporter.otlp.proto.http.trace_exporter import (  # noqa: PLC0415
                    OTLPSpanExporter,
                )
            else:
                from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (  # noqa: PLC0415
                    OTLPSpanExporter,
                )

            exporter = OTLPSpanExporter()
            provider.add_span_processor(BatchSpanProcessor(exporter))
            _logger.info(
                "OpenTelemetry OTLP trace export enabled (endpoint from OTEL_EXPORTER_OTLP_*)."
            )
        except Exception:
            _logger.exception("Failed to configure OTLP trace exporter; traces may be incomplete.")

    trace.set_tracer_provider(provider)
    _TRACING_ACTIVE = True


def instrument_httpx_outbound() -> None:
    """Patch httpx so all AsyncClient/Client requests emit dependency spans."""
    global _HTTPX_INSTRUMENTED  # noqa: PLW0603
    if _HTTPX_INSTRUMENTED:
        return
    try:
        from opentelemetry.instrumentation.httpx import (  # noqa: PLC0415
            HTTPXClientInstrumentor,
        )

        HTTPXClientInstrumentor().instrument(
            request_hook=_httpx_request_hook,
            response_hook=_httpx_response_hook,
        )
        _HTTPX_INSTRUMENTED = True
        _logger.info("HTTPX OpenTelemetry instrumentation enabled.")
    except ImportError:
        _logger.warning("opentelemetry-instrumentation-httpx not installed.")


def instrument_fastapi_app(app: object) -> None:
    """Instrument incoming HTTP when tracing is active."""
    if not _TRACING_ACTIVE:
        return
    try:
        from opentelemetry.instrumentation.fastapi import (  # noqa: PLC0415
            FastAPIInstrumentor,
        )

        FastAPIInstrumentor.instrument_app(
            app,
            exclude_spans=["receive", "send"],
        )
        _logger.info(
            "FastAPI OpenTelemetry instrumentation enabled "
            "(ASGI http receive/send internal spans excluded)."
        )
    except ImportError:
        _logger.warning("opentelemetry-instrumentation-fastapi not available.")


def record_error_on_span(error_id: str) -> None:
    """Attach support reference ID to the current span when recording."""
    if not error_id:
        return
    try:
        from opentelemetry import trace  # noqa: PLC0415

        span = trace.get_current_span()
        if span is None:
            return
        is_recording = getattr(span, "is_recording", None)
        if callable(is_recording) and not is_recording():
            return
        span.set_attribute("chatbot.error_id", error_id)
    except Exception:
        pass
