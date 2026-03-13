"""Metric construction from eval_config.yaml definitions.

Builds conversational, edge-case, and per-turn GEval metrics from the
config dicts. Extracted from run_conversation_eval.py for clarity.
"""

from __future__ import annotations

import logging
import re

logger = logging.getLogger("conversation_eval")

_BUILTIN_METRIC_CLASSES = None


def _get_builtin_metric_classes():
    """Lazily import builtin metric classes."""
    global _BUILTIN_METRIC_CLASSES
    if _BUILTIN_METRIC_CLASSES is None:
        from deepeval.metrics import ConversationalGEval

        _BUILTIN_METRIC_CLASSES = {
            "ConversationalGEval": ConversationalGEval,
        }
    return _BUILTIN_METRIC_CLASSES


def _build_metric_from_config(metric_def: dict, judge_model: str):
    """Build a single DeepEval metric from a config dict entry."""
    classes = _get_builtin_metric_classes()

    if metric_def["type"] == "builtin":
        cls = classes.get(metric_def["class"])
        if cls is None:
            raise ValueError(
                f"Unknown builtin metric class: {metric_def['class']}. "
                f"Available: {list(classes.keys())}"
            )
        return cls(
            threshold=metric_def.get("threshold", 0.5),
            model=judge_model,
        )
    elif metric_def["type"] == "geval":
        from deepeval.metrics import ConversationalGEval
        from deepeval.metrics.g_eval.utils import Rubric

        rubric = None
        if metric_def.get("rubric"):
            rubric = [
                Rubric(
                    score_range=tuple(r["score_range"]),
                    expected_outcome=r["expected_outcome"],
                )
                for r in metric_def["rubric"]
            ]

        return ConversationalGEval(
            name=metric_def["name"],
            criteria=metric_def["criteria"],
            evaluation_steps=metric_def.get("evaluation_steps", []),
            threshold=metric_def.get("threshold", 0.5),
            model=judge_model,
            rubric=rubric,
        )
    else:
        raise ValueError(f"Unknown metric type: {metric_def['type']}")


def _build_conversational_metrics(config):
    """Build base metrics from config.

    Args:
        config: Loaded eval config dict with 'base_metrics' list.

    Returns:
        List of DeepEval metric objects.
    """
    judge_model = config.get("judge_model", "gpt-4.1-mini")
    base_defs = config.get("base_metrics", [])

    if not base_defs:
        raise ValueError("No 'base_metrics' defined in eval config")

    metrics = []
    for metric_def in base_defs:
        try:
            metric = _build_metric_from_config(metric_def, judge_model)
            metrics.append(metric)
        except Exception as e:
            logger.error("Failed to build metric '%s': %s", metric_def.get("name"), e)
            raise

    logger.info("Built %d base metrics from config", len(metrics))
    return metrics


def _get_threshold_map(config):
    """Build metric name -> threshold mapping from config.

    Single source of truth -- no more hardcoded threshold duplication.
    """
    thresholds = {}

    for m in config.get("base_metrics", []):
        name = m.get("name") or m.get("class", "").replace("Metric", "")
        if m["type"] == "builtin" and not m.get("name"):
            name = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", name)
        thresholds[name] = m.get("threshold", 0.5)

    return thresholds
