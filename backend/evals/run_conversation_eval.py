"""
Persona-based conversation simulation for Data360 Chat evaluation.

Uses DeepEval's ConversationSimulator to generate realistic multi-turn
conversations between simulated personas and the chatbot, then evaluates
them with conversational metrics.

All settings (metrics, thresholds, hyperparameters) are loaded from
evals/eval_config.yaml.

Usage:
    MCP_SERVER_URL=http://localhost:8021/mcp \\
    python -m evals.run_conversation_eval

    # Custom model / turn count
    python -m evals.run_conversation_eval --turns 4

    # Run only one persona
    python -m evals.run_conversation_eval --persona student

    # Use HTTP callback against running chatbot (true E2E)
    python -m evals.run_conversation_eval --http

    # Load generated goldens from file
    python -m evals.run_conversation_eval --goldens-file evals/goldens/generated.json
"""

from __future__ import annotations

import argparse
import hashlib
import json
import logging
import os
import re
import subprocess
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("conversation_eval")

import yaml

RESULTS_DIR = Path(__file__).parent / ".results"
PERSONAS_DIR = Path(__file__).parent / "personas"
CONFIG_PATH = Path(__file__).parent / "eval_config.yaml"


# ---------------------------------------------------------------------------
# Configuration loading
# ---------------------------------------------------------------------------

def _get_git_branch() -> str:
    """Get the current git branch name for prompt_version tracking."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True, timeout=5,
            cwd=Path(__file__).parent.parent,
        )
        return result.stdout.strip() if result.returncode == 0 else "unknown"
    except Exception:
        return "unknown"


def _get_git_short_hash() -> str:
    """Get the git short commit hash for reproducibility."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, timeout=5,
            cwd=Path(__file__).parent.parent,
        )
        return result.stdout.strip() if result.returncode == 0 else "unknown"
    except Exception:
        return "unknown"


def _get_system_prompt_hash() -> str:
    """Hash the current system prompt for tracking changes."""
    try:
        from app.ai.prompts import get_combined_system_prompt
        from app.config import ModelType
        prompt = get_combined_system_prompt(ModelType.CHAT_MODEL)
        return hashlib.sha256(prompt.encode()).hexdigest()[:12]
    except Exception:
        return "unknown"


def _load_config(config_path: str | Path | None = None) -> dict:
    """Load eval config from YAML file with env var overrides.

    Config resolution order:
    1. YAML file values
    2. Environment variable overrides (DEEPEVAL_JUDGE_MODEL, CHATBOT_URL)
    3. Auto-detected values (prompt_version from git branch)
    """
    path = Path(config_path) if config_path else CONFIG_PATH
    if not path.exists():
        raise FileNotFoundError(
            f"Eval config not found: {path}\n"
            "Create evals/eval_config.yaml or specify --config path."
        )

    config = yaml.safe_load(path.read_text())

    # Environment variable overrides
    if env_judge := os.getenv("DEEPEVAL_JUDGE_MODEL"):
        config["judge_model"] = env_judge

    if env_url := os.getenv("CHATBOT_URL"):
        config["chatbot_url"] = env_url

    if env_api := os.getenv("CHATBOT_API_BASE"):
        config["chatbot_api_base"] = env_api

    # Auto-populate prompt_version from git branch
    hyper = config.get("hyperparameters", {})
    if hyper.get("prompt_version") == "auto":
        branch = _get_git_branch()
        commit = _get_git_short_hash()
        hyper["prompt_version"] = f"{branch}@{commit}"
    config["hyperparameters"] = hyper

    # Add system prompt hash
    hyper["system_prompt_hash"] = _get_system_prompt_hash()

    logger.info(
        "Config loaded: judge_model=%s, prompt_version=%s, use_http=%s",
        config.get("judge_model"),
        hyper.get("prompt_version"),
        config.get("use_http_callback", False),
    )
    return config


# ---------------------------------------------------------------------------
# Exhaustive conversation data tracking
# ---------------------------------------------------------------------------

@dataclass
class TurnData:
    """Structured data for a single conversation turn."""
    role: str
    content: str
    turn_index: int
    # Pipeline result data (assistant turns only)
    routing_intent: str = ""
    routing_reasoning: str = ""
    planner_output: str = ""
    writer_output: str = ""
    tool_calls: list[dict[str, Any]] = field(default_factory=list)
    model: str = ""
    turns_used: int = 0
    error: str | None = None


# Global turn data store, keyed by thread_id
_turn_data_store: dict[str, list[TurnData]] = {}


def _store_turn_data(thread_id: str, data: TurnData):
    """Store structured turn data for later saving."""
    _turn_data_store.setdefault(thread_id, []).append(data)


def _get_turn_data(thread_id: str) -> list[TurnData]:
    """Get all stored turn data for a thread."""
    return _turn_data_store.get(thread_id, [])


def _clear_turn_data():
    """Clear all stored turn data."""
    _turn_data_store.clear()


# ---------------------------------------------------------------------------
# Persona loading
# ---------------------------------------------------------------------------

def _load_personas() -> dict:
    """Load persona definitions from YAML files in evals/personas/.

    Each YAML file must have: scenario, user_description, expected_outcome.
    The filename (without .yaml) becomes the persona key.
    """
    personas = {}
    for yaml_file in sorted(PERSONAS_DIR.glob("*.yaml")):
        key = yaml_file.stem
        with open(yaml_file) as f:
            data = yaml.safe_load(f)
        for field_name in ("scenario", "user_description", "expected_outcome"):
            if field_name not in data:
                raise ValueError(
                    f"Persona '{key}' missing required field: {field_name}"
                )
        personas[key] = data
    if not personas:
        raise FileNotFoundError(
            f"No persona YAML files found in {PERSONAS_DIR}"
        )
    logger.info("Loaded %d personas from %s", len(personas), PERSONAS_DIR)
    return personas


PERSONAS = _load_personas()


# ---------------------------------------------------------------------------
# Model callback — in-process pipeline (default)
# ---------------------------------------------------------------------------

async def _pipeline_model_callback(
    input,  # noqa: A002
    turns=None,
    thread_id="",
    config=None,
):
    """Wrap the eval pipeline as a ConversationSimulator model_callback.

    The simulator calls this for each user turn. We:
    1. Build conversation_history from prior turns
    2. Run our pipeline (with MCP tools)
    3. Return a Turn with the assistant response
    4. Store exhaustive turn data for later saving
    """
    from deepeval.test_case import Turn

    from evals.pipeline_runner import run_eval_pipeline

    # Build conversation history from prior turns
    conversation_history = []
    if turns:
        for t in turns:
            conversation_history.append({
                "role": t.role,
                "content": t.content,
            })

    # Store the user turn data
    turn_index = (len(conversation_history) // 2) + 1
    user_data = TurnData(
        role="user",
        content=input,
        turn_index=turn_index,
    )
    _store_turn_data(thread_id, user_data)

    logger.info(
        "[%s] User: %s (history: %d turns)",
        thread_id[:8] if thread_id else "?",
        input[:80],
        len(conversation_history),
    )

    try:
        result = await run_eval_pipeline(
            input_text=input,
            skip_routing=False,
            max_tool_turns=5,
            conversation_history=conversation_history,
        )

        # Build enriched content: writer output + tool calls + planner
        content = result.final_output or "(no response)"

        # Transform <claim> tags into visible HTML for markdown preview
        content = re.sub(
            r'<claim\s+id="[^"]*"\s+policy="[^"]*">([^<]*)</claim>',
            r'<span title="verified claim">\u2705 \\1</span>',
            content,
        )

        # Append tool calls so the judge can cross-reference data
        if result.tool_calls:
            content += "\n\n---\n"
            content += "<details>\n<summary>\U0001f4cb <b>Tool Calls</b> (click to expand)</summary>\n\n"
            for i, tc in enumerate(result.tool_calls, 1):
                content += f"**{i}. {tc['tool']}**\n"
                args_str = json.dumps(tc["arguments"], indent=2)
                content += f"```json\n{args_str}\n```\n"
                result_str = (
                    json.dumps(tc["result"], indent=2)
                    if not isinstance(tc["result"], str)
                    else tc["result"]
                )
                content += f"**Result:**\n```json\n{result_str}\n```\n\n"
            content += "</details>\n"

        # Append planner reasoning for context
        if result.planner_output:
            content += (
                "\n---\n"
                "<details>\n<summary>\U0001f9e0 <b>Planner Reasoning</b> "
                "(click to expand)</summary>\n\n"
            )
            content += result.planner_output + "\n"
            content += "\n</details>\n"

        # Store exhaustive assistant turn data
        assistant_data = TurnData(
            role="assistant",
            content=content,
            turn_index=turn_index,
            routing_intent=result.routing_intent,
            routing_reasoning=result.routing_reasoning,
            planner_output=result.planner_output,
            writer_output=result.final_output,
            tool_calls=result.tool_calls,
            model=result.model,
            turns_used=result.turns_used,
            error=result.error,
        )
        _store_turn_data(thread_id, assistant_data)

        tools = [tc["tool"] for tc in result.tool_calls]
        logger.info(
            "[%s] Assistant: %d chars, route=%s, tools=%s",
            thread_id[:8] if thread_id else "?",
            len(content),
            result.routing_intent,
            tools or "(none)",
        )

        return Turn(role="assistant", content=content)

    except Exception as e:
        logger.error("[%s] Pipeline error: %s", thread_id[:8], e)
        error_data = TurnData(
            role="assistant",
            content=f"I encountered an error processing your request: {e}",
            turn_index=turn_index,
            error=str(e),
        )
        _store_turn_data(thread_id, error_data)
        return Turn(
            role="assistant",
            content=f"I encountered an error processing your request: {e}",
        )


# ---------------------------------------------------------------------------
# Model callback — HTTP-based E2E (hits the running chatbot)
# ---------------------------------------------------------------------------

async def _http_model_callback(
    input,  # noqa: A002
    turns=None,
    thread_id="",
    config=None,
):
    """HTTP-based model_callback that hits the live chatbot API.

    This provides true end-to-end testing through the full stack:
    FastAPI -> streaming -> LLM -> tools -> response assembly.

    Requires the chatbot to be running (docker-compose up).
    """
    import httpx
    from deepeval.test_case import Turn

    config = config or {}
    api_base = config.get("chatbot_api_base", "http://localhost:8000")
    turn_index = (len(turns) // 2 + 1) if turns else 1

    # Store user turn data
    user_data = TurnData(role="user", content=input, turn_index=turn_index)
    _store_turn_data(thread_id, user_data)

    logger.info(
        "[%s] HTTP User: %s (turn %d)",
        thread_id[:8] if thread_id else "?",
        input[:80],
        turn_index,
    )

    try:
        # First, get a guest auth token
        async with httpx.AsyncClient(base_url=api_base, timeout=120.0) as client:
            auth_resp = await client.post("/api/auth/guest")
            auth_resp.raise_for_status()
            token = auth_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Build message history in the format the API expects
            from uuid import uuid4
            existing_messages = []
            if turns:
                for t in turns:
                    existing_messages.append({
                        "id": str(uuid4()),
                        "role": t.role,
                        "parts": [{"type": "text", "text": t.content}],
                        "attachments": [],
                        "createdAt": datetime.utcnow().isoformat(),
                    })

            chat_id = thread_id or str(uuid4())
            request_body = {
                "id": chat_id,
                "message": {
                    "id": str(uuid4()),
                    "role": "user",
                    "parts": [{"type": "text", "text": input}],
                },
                "selectedChatModel": "chat-model",
                "selectedVisibilityType": "private",
                "existingMessages": existing_messages,
            }

            # Call the stream endpoint
            response = await client.post(
                "/api/v1/chat/stream",
                json=request_body,
                headers=headers,
            )
            response.raise_for_status()

            # Parse SSE response — collect all text chunks
            full_content = ""
            for line in response.text.split("\n"):
                if line.startswith("data: "):
                    try:
                        event_data = json.loads(line[6:])
                        if isinstance(event_data, dict):
                            if "text" in event_data:
                                full_content += event_data["text"]
                            elif "content" in event_data:
                                full_content += event_data["content"]
                        elif isinstance(event_data, str):
                            full_content += event_data
                    except json.JSONDecodeError:
                        pass

            content = full_content or "(no response from HTTP endpoint)"

        # Store assistant turn data (HTTP mode has less pipeline detail)
        assistant_data = TurnData(
            role="assistant",
            content=content,
            turn_index=turn_index,
            routing_intent="(via HTTP)",
            model=config.get("hyperparameters", {}).get("model", "unknown"),
        )
        _store_turn_data(thread_id, assistant_data)

        logger.info(
            "[%s] HTTP Assistant: %d chars",
            thread_id[:8] if thread_id else "?",
            len(content),
        )

        return Turn(role="assistant", content=content)

    except Exception as e:
        logger.error("[%s] HTTP callback error: %s", thread_id[:8], e, exc_info=True)
        error_data = TurnData(
            role="assistant",
            content=f"HTTP callback error: {e}",
            turn_index=turn_index,
            error=str(e),
        )
        _store_turn_data(thread_id, error_data)
        return Turn(
            role="assistant",
            content=f"I encountered an error processing your request: {e}",
        )


# ---------------------------------------------------------------------------
# Conversational metrics — built from config
# ---------------------------------------------------------------------------

_BUILTIN_METRIC_CLASSES = None


def _get_builtin_metric_classes():
    """Lazily import builtin metric classes."""
    global _BUILTIN_METRIC_CLASSES
    if _BUILTIN_METRIC_CLASSES is None:
        from deepeval.metrics import (
            ConversationCompletenessMetric,
            ConversationalGEval,
            TurnFaithfulnessMetric,
            TurnRelevancyMetric,
        )
        _BUILTIN_METRIC_CLASSES = {
            "ConversationCompletenessMetric": ConversationCompletenessMetric,
            "TurnFaithfulnessMetric": TurnFaithfulnessMetric,
            "TurnRelevancyMetric": TurnRelevancyMetric,
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
        return ConversationalGEval(
            name=metric_def["name"],
            criteria=metric_def["criteria"],
            evaluation_steps=metric_def.get("evaluation_steps", []),
            threshold=metric_def.get("threshold", 0.5),
            model=judge_model,
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


def _build_edge_case_metrics(persona_key, config):
    """Return additional metrics for edge-case personas, from config.

    These run IN ADDITION to the base metrics, targeting behaviors
    that the standard metrics don't properly evaluate.
    """
    judge_model = config.get("judge_model", "gpt-4.1-mini")
    extra = []

    # Persona-specific edge case metrics
    edge_defs = config.get("edge_case_metrics", {})
    if persona_key in edge_defs:
        for metric_def in edge_defs[persona_key]:
            try:
                metric = _build_metric_from_config(metric_def, judge_model)
                extra.append(metric)
            except Exception as e:
                logger.error(
                    "Failed to build edge metric '%s' for %s: %s",
                    metric_def.get("name"), persona_key, e,
                )

    # Viz & API URLs — only for specified personas
    viz_personas = set(config.get("viz_personas", []))
    if persona_key in viz_personas:
        viz_def = config.get("viz_metric")
        if viz_def:
            try:
                metric = _build_metric_from_config(viz_def, judge_model)
                extra.append(metric)
            except Exception as e:
                logger.error("Failed to build viz metric: %s", e)

    return extra


def _get_threshold_map(config, persona_key):
    """Build metric name -> threshold mapping from config.

    Single source of truth — no more hardcoded threshold duplication.
    """
    thresholds = {}

    # Base metrics
    for m in config.get("base_metrics", []):
        name = m.get("name") or m.get("class", "").replace("Metric", "")
        # Insert spaces before capitals for class names
        if m["type"] == "builtin" and not m.get("name"):
            name = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", name)
        thresholds[name] = m.get("threshold", 0.5)

    # Edge case metrics for this persona
    edge_defs = config.get("edge_case_metrics", {})
    if persona_key in edge_defs:
        for m in edge_defs[persona_key]:
            thresholds[m["name"]] = m.get("threshold", 0.5)

    # Viz metric
    viz_personas = set(config.get("viz_personas", []))
    if persona_key in viz_personas:
        viz_def = config.get("viz_metric")
        if viz_def:
            thresholds[viz_def["name"]] = viz_def.get("threshold", 0.5)

    return thresholds


# ---------------------------------------------------------------------------
# Main (synchronous — simulator handles async internally)
# ---------------------------------------------------------------------------

def parse_args():
    parser = argparse.ArgumentParser(
        description="Run persona-based conversation simulations"
    )
    parser.add_argument(
        "--turns",
        type=int,
        default=None,
        help="Max user-assistant turn cycles per persona "
             "(default: from config or 5)",
    )
    parser.add_argument(
        "--persona",
        choices=list(PERSONAS.keys()) + ["all"],
        default="all",
        help="Which persona to simulate (default: all)",
    )
    parser.add_argument(
        "--no-eval",
        action="store_true",
        help="Skip evaluation, just run simulations",
    )
    parser.add_argument(
        "--runs",
        type=int,
        default=1,
        help="Number of independent runs per persona (default: 1). "
             "Reports mean +/- std when N > 1.",
    )
    parser.add_argument(
        "--replay",
        type=str,
        default=None,
        help="Timestamp of a prior run to replay (e.g., 20260227_144407). "
             "Skips simulation and re-evaluates saved conversations.",
    )
    parser.add_argument(
        "--config",
        type=str,
        default=None,
        help="Path to eval config YAML (default: evals/eval_config.yaml)",
    )
    parser.add_argument(
        "--http",
        action="store_true",
        help="Use HTTP callback (hit the running chatbot API for true E2E).",
    )
    parser.add_argument(
        "--goldens-file",
        type=str,
        default=None,
        help="Path to JSON file with pre-generated ConversationalGoldens "
             "(from generate_goldens.py).",
    )
    return parser.parse_args()


# ---------------------------------------------------------------------------
# Helpers — simulation, evaluation, reporting
# ---------------------------------------------------------------------------

def _simulate(persona_keys, max_turns, config):
    """Run conversation simulation and return test cases + raw data."""
    from deepeval.dataset import ConversationalGolden
    from deepeval.simulator import ConversationSimulator

    use_http = config.get("use_http_callback", False)
    judge_model = config.get("judge_model", "gpt-4.1-mini")

    # Clear global turn data store before simulation
    _clear_turn_data()

    goldens = []
    for key in persona_keys:
        p = PERSONAS[key]
        golden = ConversationalGolden(
            scenario=p["scenario"],
            user_description=p["user_description"],
            expected_outcome=p["expected_outcome"],
        )
        goldens.append(golden)
        logger.info("  Persona: %s -- %s", key, p["scenario"][:60])

    # Select callback based on config
    if use_http:
        logger.info("Using HTTP-based model callback (true E2E)")

        async def callback(input, turns=None, thread_id=""):
            return await _http_model_callback(
                input, turns, thread_id, config=config,
            )
    else:
        logger.info("Using in-process pipeline callback")

        async def callback(input, turns=None, thread_id=""):
            return await _pipeline_model_callback(
                input, turns, thread_id, config=config,
            )

    simulator = ConversationSimulator(
        model_callback=callback,
        simulator_model=judge_model,
        async_mode=True,
        max_concurrent=1,  # Sequential — MCP server is shared
    )

    logger.info("Starting simulation...")
    test_cases = simulator.simulate(
        conversational_goldens=goldens,
        max_user_simulations=max_turns,
    )
    return test_cases


def _load_goldens_file(goldens_path):
    """Load pre-generated ConversationalGoldens from a JSON file."""
    from deepeval.dataset import ConversationalGolden

    path = Path(goldens_path)
    if not path.exists():
        raise FileNotFoundError(f"Goldens file not found: {path}")

    data = json.loads(path.read_text())
    goldens = []
    keys = []
    for item in data:
        golden = ConversationalGolden(
            scenario=item.get("scenario", ""),
            user_description=item.get("user_description", ""),
            expected_outcome=item.get("expected_outcome", ""),
        )
        goldens.append(golden)
        keys.append(item.get("key", f"golden_{len(keys)}"))

    logger.info("Loaded %d goldens from %s", len(goldens), path)
    return goldens, keys


def _load_replay(timestamp, persona_keys):
    """Load saved conversations and rebuild ConversationalTestCase objects."""
    from deepeval.test_case import ConversationalTestCase, Turn

    conv_file = RESULTS_DIR / f"conversations_{timestamp}.json"
    if not conv_file.exists():
        raise FileNotFoundError(
            f"No conversation file found: {conv_file}\n"
            f"Available: {sorted(RESULTS_DIR.glob('conversations_*.json'))}"
        )

    conversations = json.loads(conv_file.read_text())
    conv_by_persona = {c["persona"]: c for c in conversations}

    test_cases = []
    loaded_keys = []
    for key in persona_keys:
        if key not in conv_by_persona:
            logger.warning("Persona '%s' not found in replay file, skipping", key)
            continue
        conv_data = conv_by_persona[key]
        turn_list = conv_data.get("turns", [])
        turns = [
            Turn(role=t["role"], content=t["content"])
            for t in turn_list
        ]
        tc = ConversationalTestCase(turns=turns)
        test_cases.append(tc)
        loaded_keys.append(key)

    logger.info("Loaded %d persona(s) from %s", len(loaded_keys), conv_file.name)
    return test_cases, loaded_keys


def _evaluate_single_run(test_cases, persona_keys, config):
    """Evaluate one set of conversations, return per-persona metric data.

    Returns:
        dict: persona_key -> {
            metric_name: {
                "score": float,
                "threshold": float,
                "passed": bool,
                "reason": str,
                "evaluation_model": str,
            }
        }
    """
    from deepeval import evaluate
    from deepeval.evaluate import DisplayConfig, ErrorConfig

    base_metrics = _build_conversational_metrics(config)
    hyperparams = config.get("hyperparameters", {})
    all_scores = {}

    for tc, key in zip(test_cases, persona_keys):
        edge_metrics = _build_edge_case_metrics(key, config)
        combined = base_metrics + edge_metrics
        if edge_metrics:
            logger.info(
                "  [%s] +%d edge-case metric(s): %s",
                key, len(edge_metrics),
                [m.name if hasattr(m, 'name') else type(m).__name__
                 for m in edge_metrics],
            )

        try:
            results = evaluate(
                test_cases=[tc],
                metrics=combined,
                hyperparameters=hyperparams,
                display_config=DisplayConfig(
                    print_results=False, verbose_mode=False
                ),
                error_config=ErrorConfig(
                    skip_on_missing_params=True, ignore_errors=True
                ),
            )
            if results and results.test_results:
                # Extract exhaustive metric data including judge reasoning
                all_scores[key] = {}
                for md in results.test_results[0].metrics_data:
                    all_scores[key][md.name] = {
                        "score": md.score if md.score is not None else 0.0,
                        "threshold": md.threshold if hasattr(md, "threshold") else 0.5,
                        "passed": md.success if hasattr(md, "success") else (
                            (md.score or 0) >= (md.threshold if hasattr(md, "threshold") else 0.5)
                        ),
                        "reason": md.reason if hasattr(md, "reason") else "",
                        "evaluation_model": md.evaluation_model if hasattr(md, "evaluation_model") else "",
                    }
            else:
                all_scores[key] = {}
        except Exception as e:
            logger.error(
                "Evaluation failed for %s: %s", key, e, exc_info=True
            )
            all_scores[key] = {}

    return all_scores


def _print_and_save_results(
    all_run_scores,
    persona_keys,
    timestamp,
    max_turns,
    num_runs,
    config,
):
    """Print evaluation results and save to JSON with exhaustive data.

    Args:
        all_run_scores: list of dicts, one per run.
            Each dict: {persona -> {metric_name -> {score, threshold, passed, reason, ...}}}
        persona_keys: list of persona keys
        timestamp: str timestamp for file naming
        max_turns: int max turns used
        num_runs: int number of runs completed
        config: eval config dict
    """
    import statistics

    is_multi = num_runs > 1

    # Aggregate scores across runs
    agg = {}  # persona -> metric -> {scores: [...], reasons: [...], ...}
    for key in persona_keys:
        agg[key] = {}
        for run_scores in all_run_scores:
            metric_data = run_scores.get(key, {})
            for metric, data in metric_data.items():
                if metric not in agg[key]:
                    agg[key][metric] = {
                        "scores": [],
                        "reasons": [],
                        "threshold": data.get("threshold", 0.5),
                        "evaluation_model": data.get("evaluation_model", ""),
                    }
                agg[key][metric]["scores"].append(data.get("score", 0.0))
                reason = data.get("reason", "")
                if reason:
                    agg[key][metric]["reasons"].append(reason)

    # Print
    print("\n--- Conversational Metrics ---\n")
    for key in persona_keys:
        if is_multi:
            print(f"  [{key.upper()}] ({num_runs} runs)")
        else:
            print(f"  [{key.upper()}]")

        for metric, data in agg[key].items():
            scores = data["scores"]
            threshold = data["threshold"]
            mean = statistics.mean(scores) if scores else 0.0
            if is_multi and len(scores) > 1:
                std = statistics.stdev(scores)
                flaky = " FLAKY" if std > 0.15 else ""
                status = "PASS" if mean >= threshold else "FAIL"
                print(f"    {status} {metric}: {mean:.2f} +/- {std:.2f}{flaky}")
            else:
                score = scores[0] if scores else 0.0
                status = "PASS" if score >= threshold else "FAIL"
                print(f"    {status} {metric}: {score:.2f}")
        print()

    # Save results JSON with exhaustive data
    eval_file = RESULTS_DIR / f"conversation_eval_{timestamp}.json"
    eval_data = {
        "timestamp": timestamp,
        "personas": persona_keys,
        "max_turns": max_turns,
        "num_runs": num_runs,
        "config": {
            "judge_model": config.get("judge_model"),
            "use_http_callback": config.get("use_http_callback", False),
            "hyperparameters": config.get("hyperparameters", {}),
        },
        "results": {},
    }

    for key in persona_keys:
        eval_data["results"][key] = {}
        for metric, data in agg[key].items():
            scores = data["scores"]
            mean = statistics.mean(scores) if scores else 0.0
            threshold = data["threshold"]
            entry = {
                "score": round(mean, 4),
                "threshold": threshold,
                "passed": mean >= threshold,
                "reason": data["reasons"][-1] if data["reasons"] else "",
                "evaluation_model": data["evaluation_model"],
            }
            if is_multi and len(scores) > 1:
                std = statistics.stdev(scores)
                entry["std"] = round(std, 4)
                entry["scores"] = [round(s, 4) for s in scores]
                entry["flaky"] = std > 0.15
                entry["all_reasons"] = data["reasons"]
            eval_data["results"][key][metric] = entry

    eval_file.write_text(json.dumps(eval_data, indent=2))
    logger.info("Evaluation results saved to: %s", eval_file)
    return eval_file


def _save_conversations_exhaustive(
    test_cases,
    persona_keys,
    timestamp,
    config,
):
    """Save exhaustive conversation data including pipeline details.

    Saves: routing intent/reasoning, planner output, writer output,
    structured tool calls + results, model used, system prompt hash.
    """
    conversations_file = RESULTS_DIR / f"conversations_{timestamp}.json"
    hyper = config.get("hyperparameters", {})

    conversations_data = []
    for tc, key in zip(test_cases, persona_keys):
        # Try to find matching turn data from the store
        stored_data = {}
        for thread_id, turns_list in _turn_data_store.items():
            if tc.turns and turns_list:
                first_user = next((t for t in tc.turns if t.role == "user"), None)
                first_stored = next((t for t in turns_list if t.role == "user"), None)
                if first_user and first_stored and first_user.content == first_stored.content:
                    stored_data = {
                        (t.role, t.turn_index): t for t in turns_list
                    }
                    break

        turns_data = []
        turn_num = 0
        for turn in tc.turns:
            if turn.role == "user":
                turn_num += 1

            # Find matching stored data
            matching_data = stored_data.get((turn.role, turn_num))

            turn_entry = {
                "role": turn.role,
                "content": turn.content,
                "turn_index": turn_num,
            }

            # Add pipeline details for assistant turns
            if turn.role == "assistant" and matching_data:
                turn_entry["pipeline_result"] = {
                    "routing_intent": matching_data.routing_intent,
                    "routing_reasoning": matching_data.routing_reasoning,
                    "planner_output": matching_data.planner_output,
                    "writer_output": matching_data.writer_output,
                    "tool_calls": matching_data.tool_calls,
                    "model": matching_data.model,
                    "turns_used": matching_data.turns_used,
                    "error": matching_data.error,
                }

            turns_data.append(turn_entry)

        conversations_data.append({
            "persona": key,
            "scenario": PERSONAS[key]["scenario"],
            "expected_outcome": PERSONAS[key]["expected_outcome"],
            "num_turns": len(tc.turns),
            "model": hyper.get("model", config.get("judge_model", "")),
            "prompt_version": hyper.get("prompt_version", ""),
            "system_prompt_hash": hyper.get("system_prompt_hash", ""),
            "use_http_callback": config.get("use_http_callback", False),
            "turns": turns_data,
        })

    conversations_file.write_text(json.dumps(conversations_data, indent=2))
    logger.info("Exhaustive conversations saved to: %s", conversations_file)
    return conversations_file


def _save_conversation_markdown(
    test_cases,
    persona_keys,
    all_run_scores,
    timestamp,
    config,
    run_label=None,
):
    """Generate per-persona conversation markdown files in evals/conversations/.

    Each file contains: evaluation results table, insights section,
    and the full conversation transcript.

    Args:
        run_label: Optional label (e.g. "r1", "r2") for per-run files.
                   When set, files are named <persona>_<run_label>.md.
                   When None, files are named <persona>.md (aggregated).
    """
    import statistics

    convos_dir = Path(__file__).parent / "conversations"
    convos_dir.mkdir(parents=True, exist_ok=True)

    num_runs = len(all_run_scores) if all_run_scores else 0

    # Build aggregated scores
    agg = {}
    for key in persona_keys:
        agg[key] = {}
        for run_scores in all_run_scores:
            metric_data = run_scores.get(key, {})
            for metric, data in metric_data.items():
                if metric not in agg[key]:
                    agg[key][metric] = {"scores": [], "threshold": data.get("threshold", 0.5)}
                agg[key][metric]["scores"].append(data.get("score", 0.0))

    for tc, key in zip(test_cases, persona_keys):
        persona_info = PERSONAS[key]
        hyper = config.get("hyperparameters", {})
        lines = []

        # Header
        run_title = f" (Run {run_label})" if run_label else ""
        lines.append(f"# {key.upper()} -- Conversation & Evaluation{run_title}\n")
        lines.append(f"**Timestamp:** {timestamp}")
        lines.append(f"**Run:** {run_label or 'single'}")
        lines.append(f"**Prompt Version:** {hyper.get('prompt_version', 'N/A')}")
        lines.append(f"**Judge Model:** {config.get('judge_model', 'N/A')}")
        lines.append(f"**Mode:** {'HTTP E2E' if config.get('use_http_callback') else 'In-Process'}")
        lines.append(
            f"**Persona:** {persona_info['user_description'][:100]}..."
        )
        lines.append(f"**Turns:** {len(tc.turns)}\n")

        # Evaluation results table
        if agg.get(key):
            lines.append("## Evaluation Results\n")
            lines.append("| Metric | Score | Threshold | Status |")
            lines.append("|---|---|---|---|")

            # Get thresholds from config
            threshold_map = _get_threshold_map(config, key)

            pass_count = 0
            fail_count = 0
            perfect_metrics = []
            near_perfect = []
            failed_metrics = []

            for metric, data in agg[key].items():
                scores = data["scores"]
                mean = statistics.mean(scores) if scores else 0.0
                threshold = data.get("threshold", threshold_map.get(metric, 0.5))
                passed = mean >= threshold
                status = "PASS" if passed else "FAIL"

                if passed:
                    pass_count += 1
                else:
                    fail_count += 1

                if mean >= 0.95:
                    perfect_metrics.append((metric, mean))
                elif mean >= 0.8:
                    near_perfect.append((metric, mean))

                if not passed:
                    failed_metrics.append((metric, mean, threshold))

                if num_runs > 1 and len(scores) > 1:
                    std = statistics.stdev(scores)
                    flaky = " !!" if std > 0.15 else ""
                    lines.append(
                        f"| {metric} | {mean:.2f} +/- {std:.2f}{flaky} "
                        f"| {threshold} | {status} |"
                    )
                else:
                    lines.append(
                        f"| {metric} | {mean:.2f} | {threshold} | {status} |"
                    )

            total = pass_count + fail_count
            lines.append(
                f"\n**Pass Rate:** {pass_count}/{total} "
                f"({pass_count * 100 // total if total else 0}%)\n"
            )

            # Insights section
            lines.append("## Insights\n")
            lines.append("### Strengths\n")

            if perfect_metrics:
                names = ", ".join(
                    f"**{m}**" for m, _ in sorted(perfect_metrics)
                )
                lines.append(
                    f"- **Perfect/near-perfect scores (>=0.95):** {names}"
                )

            if near_perfect:
                for m, s in sorted(near_perfect):
                    lines.append(f"- **{m}** ({s:.2f}): Strong performance")

            if not perfect_metrics and not near_perfect:
                lines.append("- No metrics scored above 0.80")

            lines.append("")

            if failed_metrics:
                lines.append("### Failures & Weaknesses\n")
                for m, s, t in sorted(failed_metrics, key=lambda x: x[1]):
                    # Include judge reasoning if available
                    reason = ""
                    if all_run_scores:
                        last_run = all_run_scores[-1]
                        metric_info = last_run.get(key, {}).get(m, {})
                        reason = metric_info.get("reason", "")
                    reason_text = f"\n  > Judge: _{reason[:200]}_" if reason else ""
                    lines.append(
                        f"- **{m}** ({s:.2f}, threshold={t}): "
                        f"Failed -- needs investigation{reason_text}"
                    )
                lines.append("")

                lines.append("### Recommended Next Steps\n")
                for i, (m, s, t) in enumerate(
                    sorted(failed_metrics, key=lambda x: x[1]), 1
                ):
                    lines.append(
                        f"{i}. Investigate **{m}** failure "
                        f"(scored {s:.2f}, needs >={t})"
                    )
                lines.append("")
            else:
                lines.append("### No Failures!\n")
                lines.append("All metrics passed their thresholds.\n")

        # Full conversation transcript
        lines.append("---\n")
        lines.append("## Conversation\n")
        turn_num = 0
        for turn in tc.turns:
            if turn.role == "user":
                turn_num += 1
                lines.append(f"### User (Turn {turn_num})\n")
            else:
                lines.append("### Assistant\n")
            lines.append(turn.content)
            lines.append("")

        # Write file -- include run label in filename for multi-run
        suffix = f"_{run_label}" if run_label else ""
        md_file = convos_dir / f"{key}{suffix}.md"
        md_file.write_text("\n".join(lines))
        logger.info("Conversation markdown saved: %s", md_file)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = parse_args()

    # Load config
    config = _load_config(args.config)

    # Apply CLI overrides
    if args.http:
        config["use_http_callback"] = True

    max_turns = args.turns or config.get("default_max_turns", 5)

    if args.replay and args.runs > 1:
        print("ERROR: --replay and --runs > 1 cannot be used together.")
        print("Replay re-evaluates a fixed conversation -- multiple runs "
              "would produce identical results.")
        return

    # Select personas
    if args.persona == "all":
        persona_keys = list(PERSONAS.keys())
    else:
        persona_keys = [args.persona]

    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    # Print config summary
    hyper = config.get("hyperparameters", {})
    print(f"\n  Config: judge={config.get('judge_model')}, "
          f"prompt={hyper.get('prompt_version')}, "
          f"http={config.get('use_http_callback', False)}")

    # -- Replay mode -------------------------------------------------------
    if args.replay:
        print("\n")
        print("=" * 72)
        print("            REPLAY MODE")
        print(f"            Replaying: {args.replay}")
        print(f"            Personas: {', '.join(persona_keys)}")
        print("=" * 72)

        test_cases, loaded_keys = _load_replay(args.replay, persona_keys)
        persona_keys = loaded_keys

        if not args.no_eval:
            run_scores = _evaluate_single_run(test_cases, persona_keys, config)
            _print_and_save_results(
                [run_scores], persona_keys, timestamp, max_turns, 1, config,
            )
            _save_conversation_markdown(
                test_cases, persona_keys, [run_scores], timestamp, config,
            )

        print("\n" + "=" * 72)
        print("  Done! (replay)")
        print("=" * 72)
        return

    # -- Simulation mode ---------------------------------------------------
    all_run_scores = []
    all_run_test_cases = []  # Store test_cases from each run

    for run_idx in range(args.runs):
        if args.runs > 1:
            print(f"\n{'#' * 72}")
            print(f"  RUN {run_idx + 1}/{args.runs}")
            print(f"{'#' * 72}")

        logger.info(
            "Running conversation simulation (run %d/%d): personas=%s, "
            "max_turns=%d",
            run_idx + 1, args.runs, persona_keys, max_turns,
        )

        test_cases = _simulate(persona_keys, max_turns, config)
        all_run_test_cases.append(test_cases)

        # Print conversation summaries
        print("\n")
        print("=" * 72)
        print("            CONVERSATION SIMULATION RESULTS")
        print(f"            {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"            Personas: {', '.join(persona_keys)}")
        print(f"            Max turns: {max_turns}")
        if args.runs > 1:
            print(f"            Run: {run_idx + 1}/{args.runs}")
        print("=" * 72)

        for tc, key in zip(test_cases, persona_keys):
            print(
                f"\n--- Persona: {key.upper()} "
                f"({len(tc.turns)} turns) ---\n"
            )
            for turn in tc.turns:
                role_icon = (
                    "User" if turn.role == "user" else "Asst"
                )
                content_preview = turn.content[:200].replace("\n", " ")
                print(f"  {role_icon}: {content_preview}...")
                print()

        # Save exhaustive conversations (per-run timestamp for multi-run)
        run_ts = (
            f"{timestamp}_r{run_idx + 1}" if args.runs > 1 else timestamp
        )
        _save_conversations_exhaustive(
            test_cases, persona_keys, run_ts, config,
        )

        # Evaluate this run
        if not args.no_eval:
            logger.info("Running evaluation (run %d)...", run_idx + 1)
            run_scores = _evaluate_single_run(test_cases, persona_keys, config)
            all_run_scores.append(run_scores)

            # Save per-run markdown (each run gets its own files)
            if args.runs > 1:
                run_label = f"r{run_idx + 1}"
                _save_conversation_markdown(
                    test_cases, persona_keys, [run_scores],
                    timestamp, config, run_label=run_label,
                )

    # Print and save aggregated results
    if not args.no_eval and all_run_scores:
        _print_and_save_results(
            all_run_scores, persona_keys, timestamp,
            max_turns, len(all_run_scores), config,
        )
        # Save aggregated markdown (uses last run's conversations)
        # Single run: <persona>.md
        # Multi-run: <persona>.md (aggregated) + <persona>_r1.md, _r2.md, ...
        _save_conversation_markdown(
            all_run_test_cases[-1], persona_keys,
            all_run_scores, timestamp, config,
        )

    print("\n" + "=" * 72)
    print("  Done!")
    print("=" * 72)


if __name__ == "__main__":
    main()
