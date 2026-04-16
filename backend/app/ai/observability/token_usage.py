# ruff: noqa: N815
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Dict, Iterable, Mapping, Optional

from litellm import get_model_info
from pydantic import BaseModel, ConfigDict, NonNegativeFloat, NonNegativeInt

logger = logging.getLogger(__name__)


class CostUSD(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    inputUSD: NonNegativeFloat = 0.0
    outputUSD: NonNegativeFloat = 0.0
    cacheReadUSD: NonNegativeFloat = 0.0
    reasoningUSD: NonNegativeFloat = 0.0
    totalUSD: NonNegativeFloat = 0.0

    def __add__(self, other: "CostUSD") -> "CostUSD":
        input_usd = self.inputUSD + other.inputUSD
        output_usd = self.outputUSD + other.outputUSD
        cache_usd = self.cacheReadUSD + other.cacheReadUSD
        reasoning_usd = self.reasoningUSD + other.reasoningUSD

        return CostUSD(
            inputUSD=input_usd,
            outputUSD=output_usd,
            cacheReadUSD=cache_usd,
            reasoningUSD=reasoning_usd,
            totalUSD=input_usd + output_usd + cache_usd + reasoning_usd,
        )


class ContextLimits(BaseModel):
    model_config = ConfigDict(extra="forbid")

    outputMax: NonNegativeInt = 0
    combinedMax: NonNegativeInt = 0
    totalMax: NonNegativeInt = 0
    maxOutput: NonNegativeInt = 0
    maxTotal: NonNegativeInt = 0

    def __add__(self, other: "ContextLimits") -> "ContextLimits":
        # merge limits by max, not sum
        return ContextLimits(
            outputMax=max(self.outputMax, other.outputMax),
            combinedMax=max(self.combinedMax, other.combinedMax),
            totalMax=max(self.totalMax, other.totalMax),
            maxOutput=max(self.maxOutput, other.maxOutput),
            maxTotal=max(self.maxTotal, other.maxTotal),
        )


class DataUsageData(BaseModel):
    model_config = ConfigDict(extra="forbid")

    inputTokens: NonNegativeInt
    outputTokens: NonNegativeInt
    totalTokens: NonNegativeInt
    reasoningTokens: NonNegativeInt = 0
    cachedInputTokens: NonNegativeInt = 0

    context: ContextLimits
    costUSD: CostUSD
    modelId: str

    def __add__(self, other: "DataUsageData") -> "DataUsageData":
        # When models differ (e.g. routing model + chat model), combine IDs and
        # sum tokens/costs.  Costs are pre-computed per-model before accumulation
        # so the summed costUSD is still accurate despite the model mismatch.
        # Use an ordered-dict trick to deduplicate while preserving insertion order,
        # so repeated additions of the same model don't grow the string unboundedly.
        if self.modelId != other.modelId:
            seen: dict[str, None] = dict.fromkeys(
                self.modelId.split(" + ") + other.modelId.split(" + ")
            )
            combined_id = " + ".join(seen)
        else:
            combined_id = self.modelId

        return DataUsageData(
            inputTokens=self.inputTokens + other.inputTokens,
            outputTokens=self.outputTokens + other.outputTokens,
            totalTokens=self.totalTokens + other.totalTokens,
            reasoningTokens=self.reasoningTokens + other.reasoningTokens,
            cachedInputTokens=self.cachedInputTokens + other.cachedInputTokens,
            context=self.context + other.context,
            costUSD=self.costUSD + other.costUSD,
            modelId=combined_id,
        )


class DataUsageEvent(BaseModel):
    model_config = ConfigDict(extra="forbid")
    type: str = "data-usage"
    data: DataUsageData

    def __add__(self, other: "DataUsageEvent") -> "DataUsageEvent":
        return DataUsageEvent(
            type=self.type,
            data=self.data + other.data,
        )


# --- tiny helpers ------------------------------------------------------------


def at(obj: Any, *path: str, default: Any = None) -> Any:
    """
    Safe nested getter for dict-like or attribute-like objects.
    Example: at(resp, "usage", "prompt_tokens_details", "cached_tokens", default=0)
    """
    cur = obj
    for key in path:
        if cur is None:
            return default
        if isinstance(cur, dict):
            cur = cur.get(key)
        else:
            cur = getattr(cur, key, None)
    return default if cur is None else cur


def pick(d: Dict[str, Any], keys: Iterable[str], default: Any = None) -> Any:
    """Return first non-None value for keys."""
    for k in keys:
        v = d.get(k)
        if v is not None:
            return v
    return default


# --- model metadata extraction ----------------------------------------------

_CONTEXT_KEYS = ("max_input_tokens", "max_tokens", "context_window", "max_context_length")
_MAX_OUTPUT_KEYS = (
    "max_output_tokens",
    "max_tokens_to_sample",
    "max_completion_tokens",
    "max_output",
)

_PRICE_KEYS = {
    "input": ("input_cost_per_token", "prompt_cost_per_token", "input_cost"),
    "output": ("output_cost_per_token", "completion_cost_per_token", "output_cost"),
    "cache_read": (
        "cache_read_input_token_cost",
        "cache_read_input_token_cost_per_token",
        "cache_read_cost_per_token",
    ),
}


@dataclass(frozen=True)
class Usage:
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cached_tokens: int
    reasoning_tokens: int


@dataclass(frozen=True)
class Prices:
    input_per_token: float
    output_per_token: float
    cache_read_per_token: float  # may fallback to input_per_token


def _int_or_zero(val: Any) -> int:
    """Coerce to int; use 0 for None or invalid."""
    if val is None:
        return 0
    try:
        return int(val)
    except (TypeError, ValueError):
        return 0


def extract_usage(resp: Any) -> Usage:
    """
    Extract token usage from a completion response (full chunk or usage object).
    Supports both OpenAI-style (prompt_tokens, completion_tokens) and Azure-style
    (input_tokens, output_tokens) field names for compatibility with LiteLLM + Azure.
    """
    usage = at(resp, "usage", default={})
    if usage is None:
        usage = {}

    # Prefer OpenAI names; fall back to Azure/OpenAI Responses API names
    prompt = _int_or_zero(
        at(usage, "prompt_tokens", default=None) or at(usage, "input_tokens", default=0)
    )
    completion = _int_or_zero(
        at(usage, "completion_tokens", default=None) or at(usage, "output_tokens", default=0)
    )
    total = _int_or_zero(at(usage, "total_tokens", default=prompt + completion))

    cached = _int_or_zero(at(usage, "prompt_tokens_details", "cached_tokens", default=0))
    reasoning = _int_or_zero(at(usage, "completion_tokens_details", "reasoning_tokens", default=0))

    return Usage(
        prompt_tokens=prompt,
        completion_tokens=completion,
        total_tokens=total,
        cached_tokens=cached,
        reasoning_tokens=reasoning,
    )


def extract_context(model_info: Dict[str, Any]) -> Dict[str, int]:
    cw = int(pick(model_info, _CONTEXT_KEYS, default=0) or 0)
    mo = int(pick(model_info, _MAX_OUTPUT_KEYS, default=0) or 0)

    # Keep your exact output shape
    return {
        "outputMax": mo,
        "maxOutput": mo,
        "combinedMax": cw,
        "totalMax": cw,
        "maxTotal": cw,
    }


def extract_prices(model_info: Dict[str, Any]) -> Prices:
    input_pt = float(pick(model_info, _PRICE_KEYS["input"], default=0.0) or 0.0)
    output_pt = float(pick(model_info, _PRICE_KEYS["output"], default=0.0) or 0.0)

    cache_pt = pick(model_info, _PRICE_KEYS["cache_read"], default=None)
    cache_pt_f = float(cache_pt) if cache_pt is not None else input_pt  # fallback

    return Prices(
        input_per_token=input_pt, output_per_token=output_pt, cache_read_per_token=cache_pt_f
    )


def normalize_model_id(model: str, resp: Any) -> str:
    return str(at(resp, "model", default=model) or model)


def _safe_get_model_info(model_id: str, provider_prefix: str = "azure/") -> Dict[str, Any]:
    """
    Get LiteLLM model info; try with and without provider prefix (Azure deployment names
    often don't include the prefix). Never raises; returns {} on failure.
    """
    candidates = [model_id]
    if provider_prefix and "/" not in model_id:
        candidates.append(f"{provider_prefix}{model_id}")
    for candidate in candidates:
        if not candidate:
            continue
        try:
            info = get_model_info(model=candidate)
            if info:
                return info
        except Exception as e:
            logger.debug("get_model_info(%r) failed: %s", candidate, e)
    return {}


def build_data_usage_event_from_usage_only(
    *,
    model: str,
    completion_response: Any,
) -> DataUsageEvent:
    """
    Build a minimal DataUsageEvent from token counts only (no cost/context).
    Use when build_data_usage_event fails (e.g. get_model_info unavailable for Azure).
    """
    u = extract_usage(completion_response)
    model_id = normalize_model_id(model, completion_response)
    return DataUsageEvent(
        type="data-usage",
        data=DataUsageData(
            inputTokens=u.prompt_tokens,
            outputTokens=u.completion_tokens,
            totalTokens=u.total_tokens,
            reasoningTokens=u.reasoning_tokens,
            cachedInputTokens=u.cached_tokens,
            context=ContextLimits(),
            costUSD=CostUSD(),
            modelId=model_id,
        ),
    )


def _usage_mapping_to_dict(meta: Any) -> dict[str, Any] | None:
    """Turn LangChain ``UsageMetadata`` (or similar) into a plain dict."""
    if meta is None:
        return None
    if isinstance(meta, dict):
        out = {k: v for k, v in meta.items() if v is not None}
        return out if out else None
    if hasattr(meta, "model_dump"):
        dumped = meta.model_dump(exclude_none=True)
        return dumped if dumped else None
    return None


def usage_dict_is_nonzero(usage_fragment: Mapping[str, Any]) -> bool:
    """True if the fragment carries any countable tokens (for skipping empty stream chunks)."""
    u = extract_usage({"usage": dict(usage_fragment)})
    return (u.total_tokens > 0) or (u.prompt_tokens > 0) or (u.completion_tokens > 0)


def usage_dict_from_langchain_message(msg: Any) -> dict[str, Any] | None:
    """Extract a usage fragment suitable for :func:`extract_usage` (nested under ``usage``).

    Prefers ``AIMessage.usage_metadata``; falls back to LiteLLM-style fields inside
    ``response_metadata`` (``token_usage``, ``usage``).

    LangChain stores cache/reasoning detail under ``input_token_details.cache_read``
    and ``output_token_details.reasoning`` — different from the raw OpenAI API shape
    that ``extract_usage`` was written for.  We normalise them here into the nested
    keys ``extract_usage`` already knows (``prompt_tokens_details.cached_tokens`` and
    ``completion_tokens_details.reasoning_tokens``) so the rest of the pipeline just
    works without needing a second code path.
    """
    if msg is None:
        return None

    um = getattr(msg, "usage_metadata", None)
    flat = _usage_mapping_to_dict(um)
    if flat and usage_dict_is_nonzero(flat):
        # Translate LangChain detail dicts → OpenAI-style nested keys so
        # extract_usage can find cached and reasoning token counts.
        in_details = flat.get("input_token_details")
        out_details = flat.get("output_token_details")
        if isinstance(in_details, dict):
            cache_read = _int_or_zero(in_details.get("cache_read"))
            if cache_read:
                flat.setdefault("prompt_tokens_details", {})["cached_tokens"] = cache_read
        if isinstance(out_details, dict):
            reasoning = _int_or_zero(out_details.get("reasoning"))
            if reasoning:
                flat.setdefault("completion_tokens_details", {})["reasoning_tokens"] = reasoning
        return flat

    rm = getattr(msg, "response_metadata", None)
    if isinstance(rm, dict):
        for key in ("token_usage", "usage"):
            nested = rm.get(key)
            if isinstance(nested, dict):
                cand = {k: v for k, v in nested.items() if v is not None}
                if cand and usage_dict_is_nonzero(cand):
                    return cand
    return None


def usage_dict_from_openai_completion_usage(usage_obj: Any) -> dict[str, Any] | None:
    """Normalize OpenAI SDK ``response.usage`` to a dict for :func:`extract_usage`."""
    if usage_obj is None:
        return None
    if hasattr(usage_obj, "model_dump"):
        d = usage_obj.model_dump(exclude_none=True)
    elif isinstance(usage_obj, dict):
        d = dict(usage_obj)
    else:
        return None
    return d if d and usage_dict_is_nonzero(d) else None


class UsageFallbackBucket:
    """Mutable holder attached to graph input so nodes can append usage if SSE events miss it."""

    __slots__ = ("parts",)

    def __init__(self) -> None:
        self.parts: list[dict[str, Any]] = []
        # Each entry: {"node": str, "raw": dict}


def append_llm_usage_fallback(bucket: Any, msg: Any, *, node: str = "") -> None:
    """Append non-empty usage from an ``AIMessage`` into a :class:`UsageFallbackBucket`."""
    if bucket is None or not hasattr(bucket, "parts"):
        return
    raw = usage_dict_from_langchain_message(msg)
    if raw and usage_dict_is_nonzero(raw):
        bucket.parts.append({"node": node, "raw": raw})


def coerce_graph_final_usage_to_data_usage(raw: Dict[str, Any], *, model: str) -> DataUsageData:
    """Normalize LangGraph/SSE ``final_usage`` dict to :class:`DataUsageData`.

    LangChain stores ``AIMessage.usage_metadata`` as a flat dict (``input_tokens``,
    ``output_tokens``, …). The API persistence layer expects the camelCase
    :class:`DataUsageData` shape (including nested ``context`` and ``costUSD``).

    If ``raw`` is already a serialized :class:`DataUsageData` (e.g. from
    ``model_dump()``), it is validated and returned as-is.
    """
    if "modelId" in raw and "inputTokens" in raw:
        return DataUsageData.model_validate(raw)
    try:
        return build_data_usage_event(
            model=model,
            completion_response={"usage": raw, "model": model},
        ).data
    except Exception as exc:
        logger.debug("build_data_usage_event failed for raw usage, minimal fallback: %s", exc)
        return build_data_usage_event_from_usage_only(
            model=model,
            completion_response={"usage": raw},
        ).data


# --- main API ----------------------------------------------------------------


def build_data_usage_event(
    *,
    model: str,
    completion_response: Any,
    model_info: Optional[Dict[str, Any]] = None,
    provider_prefix: str = "azure/",
) -> DataUsageEvent:
    u = extract_usage(completion_response)
    model_id = normalize_model_id(model, completion_response)

    if model_info is not None:
        mi = model_info
    else:
        mi = _safe_get_model_info(model_id, provider_prefix=provider_prefix)
    ctx = extract_context(mi)
    p = extract_prices(mi)

    cache_miss_tokens = max(u.prompt_tokens - u.cached_tokens, 0)

    input_usd = cache_miss_tokens * p.input_per_token
    output_usd = u.completion_tokens * p.output_per_token
    cache_read_usd = u.cached_tokens * p.cache_read_per_token
    # Reasoning tokens are a subset of completion_tokens; price at the output rate.
    # LiteLLM doesn't expose a dedicated reasoning_cost_per_token yet, so this is
    # the best available approximation.
    reasoning_usd = u.reasoning_tokens * p.output_per_token
    total_usd = input_usd + output_usd + cache_read_usd

    return DataUsageEvent(
        type="data-usage",
        data=DataUsageData(
            inputTokens=u.prompt_tokens,
            outputTokens=u.completion_tokens,
            totalTokens=u.total_tokens,
            reasoningTokens=u.reasoning_tokens,
            cachedInputTokens=u.cached_tokens,
            context=ctx,
            costUSD=CostUSD(
                inputUSD=input_usd,
                outputUSD=output_usd,
                cacheReadUSD=cache_read_usd,
                reasoningUSD=reasoning_usd,
                totalUSD=total_usd,
            ),
            modelId=model_id,
        ),
    )
