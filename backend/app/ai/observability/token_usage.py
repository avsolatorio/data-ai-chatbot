# ruff: noqa: N815
from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, Optional

from litellm import get_model_info
from pydantic import BaseModel, ConfigDict, NonNegativeFloat, NonNegativeInt


class CostUSD(BaseModel):
    model_config = ConfigDict(extra="forbid")

    inputUSD: NonNegativeFloat = 0.0
    outputUSD: NonNegativeFloat = 0.0
    cacheReadUSD: NonNegativeFloat = 0.0

    # keep aliases if you truly need them; otherwise consider dropping them
    inputTokenUSD: NonNegativeFloat = 0.0
    outputTokenUSD: NonNegativeFloat = 0.0
    cacheReadsUSD: NonNegativeFloat = 0.0

    totalUSD: NonNegativeFloat = 0.0

    def __add__(self, other: "CostUSD") -> "CostUSD":
        input_usd = self.inputUSD + other.inputUSD
        output_usd = self.outputUSD + other.outputUSD
        cache_usd = self.cacheReadUSD + other.cacheReadUSD

        return CostUSD(
            inputUSD=input_usd,
            outputUSD=output_usd,
            cacheReadUSD=cache_usd,
            totalUSD=input_usd + output_usd + cache_usd,
            inputTokenUSD=self.inputTokenUSD + other.inputTokenUSD,
            outputTokenUSD=self.outputTokenUSD + other.outputTokenUSD,
            cacheReadsUSD=self.cacheReadsUSD + other.cacheReadsUSD,
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
        if self.modelId != other.modelId:
            raise ValueError(f"Cannot add usage across models: {self.modelId} vs {other.modelId}")

        return DataUsageData(
            inputTokens=self.inputTokens + other.inputTokens,
            outputTokens=self.outputTokens + other.outputTokens,
            totalTokens=self.totalTokens + other.totalTokens,
            reasoningTokens=self.reasoningTokens + other.reasoningTokens,
            cachedInputTokens=self.cachedInputTokens + other.cachedInputTokens,
            context=self.context + other.context,
            costUSD=self.costUSD + other.costUSD,
            modelId=self.modelId,
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


def extract_usage(resp: Any) -> Usage:
    usage = at(resp, "usage", default={})

    prompt = int(at(usage, "prompt_tokens", default=0))
    completion = int(at(usage, "completion_tokens", default=0))
    total = int(at(usage, "total_tokens", default=prompt + completion))

    cached = int(at(usage, "prompt_tokens_details", "cached_tokens", default=0))
    reasoning = int(at(usage, "completion_tokens_details", "reasoning_tokens", default=0))

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


# --- main API ----------------------------------------------------------------


def build_data_usage_event(
    *,
    model: str,
    completion_response: Any,
    model_info: Optional[Dict[str, Any]] = None,
) -> DataUsageEvent:
    u = extract_usage(completion_response)
    model_id = normalize_model_id(model, completion_response)

    mi = model_info or get_model_info(model=model_id)
    ctx = extract_context(mi)
    p = extract_prices(mi)

    cache_miss_tokens = max(u.prompt_tokens - u.cached_tokens, 0)

    input_usd = cache_miss_tokens * p.input_per_token
    output_usd = u.completion_tokens * p.output_per_token
    cache_read_usd = u.cached_tokens * p.cache_read_per_token
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
                totalUSD=total_usd,
                # aliases
                inputTokenUSD=input_usd,
                outputTokenUSD=output_usd,
                cacheReadsUSD=cache_read_usd,
            ),
            modelId=model_id,
        ),
    )
