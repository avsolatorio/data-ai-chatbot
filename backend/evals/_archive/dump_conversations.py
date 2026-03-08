"""Dump conversation results to individual persona .md files with insights."""

import glob
import json
import os
import re
import sys

PERSONA_CONTEXT = {
    "student": "University student writing a thesis on economic growth in East Africa",
    "geographer": "Spatial analysis researcher studying regional population and urbanization",
    "economist": "Senior economist at a think tank doing cross-country macro comparisons",
    "journalist": "Data journalist fact-checking a poverty rate story",
    "policy_advisor": "Government policy advisor analyzing education spending vs outcomes",
    "data_engineer": "Data engineer building a dashboard, needs API URLs and programmatic access",
    "ngo_worker": "NGO field officer requesting subnational child mortality data",
    "curious_citizen": "Non-technical user exploring development data with vague questions",
    "adversarial": "QA tester trying to break the system with out-of-scope requests",
    "multilingual": "French-speaking analyst using non-English country names",
    "comparison_max": "Analyst comparing 10+ countries in a single request",
}

THRESHOLD = 0.5


def analyze_conversation(persona, turns, metrics):
    """Generate insights section based on metrics and conversation content."""
    lines = []
    lines.append("## Insights\n")

    scores = {}
    failures = {}
    strengths = {}
    for name, info in metrics.items():
        if isinstance(info, dict):
            score = info.get("score", 0)
            passed = info.get("passed", False)
            scores[name] = score
            if not passed:
                failures[name] = score
            elif score >= 0.95:
                strengths[name] = score

    # --- Strengths ---
    lines.append("### Strengths\n")
    if strengths:
        perfect = {k: v for k, v in strengths.items() if v >= 1.0}
        near_perfect = {k: v for k, v in strengths.items() if 0.95 <= v < 1.0}
        if perfect:
            names = ", ".join(f"**{k.split('[')[0].strip()}**" for k in sorted(perfect.keys()))
            lines.append(f"- **Perfect scores (1.00):** {names}")
        if near_perfect:
            for k, v in sorted(near_perfect.items()):
                clean = k.split("[")[0].strip()
                lines.append(f"- **{clean}** ({v:.2f}): Near-perfect — minor deductions only")
    else:
        lines.append("- No metrics scored above 0.95")

    all_assistant = " ".join(t["content"] for t in turns if t["role"] == "assistant")

    content_strengths = []
    if "<claim" in all_assistant:
        content_strengths.append(
            "Properly used `<claim>` tags with PCN protocol for data traceability"
        )
    if "Sources:" in all_assistant or "Source:" in all_assistant:
        content_strengths.append("Included source citations with database and indicator references")
    if "follow-up" in all_assistant.lower() or "suggested" in all_assistant.lower():
        content_strengths.append(
            "Provided actionable follow-up suggestions to guide the conversation"
        )
    if "|" in all_assistant and "---" in all_assistant:
        content_strengths.append("Used markdown tables for structured data presentation")
    if "View Chart" in all_assistant or "viz_specs" in all_assistant:
        content_strengths.append(
            "Generated visualizations via `get_viz_spec` with clickable chart links"
        )
    if persona == "data_engineer" and (
        "api" in all_assistant.lower() or "requests" in all_assistant.lower()
    ):
        content_strengths.append("Provided direct API URLs with Python code examples as requested")
    if "Note:" in all_assistant or "Limitations:" in all_assistant:
        content_strengths.append("Added contextual notes and limitations for data transparency")

    if content_strengths:
        lines.append("")
        lines.append("**Conversation highlights:**")
        for s in content_strengths:
            lines.append(f"- {s}")
    lines.append("")

    # --- Failures ---
    lines.append("### Failures & Weaknesses\n")
    if failures:
        for name, score in sorted(failures.items(), key=lambda x: x[1]):
            clean = name.split("[")[0].strip()
            explanation = _get_failure_explanation(name)
            lines.append(f"- **{clean}** ({score:.2f}): {explanation}")
            lines.append("")
    else:
        lines.append("No metrics failed — all scores above the 0.50 threshold.\n")

    # --- Next Steps ---
    lines.append("### Recommended Next Steps\n")
    next_steps = _get_next_steps(failures, scores)
    for i, step in enumerate(next_steps, 1):
        lines.append(f"{i}. {step}")
    lines.append("")
    return lines


def _get_failure_explanation(name):
    explanations = {
        "Scope Guard": (
            "The chatbot complied with out-of-scope requests "
            "(e.g., creative writing, fictional entities) instead of "
            "refusing. This is a prompt-level issue — the model is too "
            "helpful and needs explicit refusal instructions in `prompts.py`."
        ),
        "Guided Discovery": (
            "The chatbot dumped data on vague queries instead of "
            "asking a clarifying question first. The prompt says to ask "
            '"ONE short, focused CLARIFYING QUESTION" but the model '
            "biases toward answering over asking."
        ),
        "Completeness": (
            "Not all user requests were fully addressed. This may "
            "be due to conversation complexity exceeding the turn limit, "
            "or the chatbot losing track of multi-part requests."
        ),
        "Context Retention": (
            "The chatbot re-searched data it had already retrieved "
            "in prior turns instead of reusing cached results. This wastes "
            "tool calls and slows the conversation."
        ),
        "Tool Call Appropriateness": (
            "The chatbot made unnecessary or incorrect tool calls. "
            "The 8-step workflow was not followed correctly — some required "
            "steps were skipped or optional steps were treated as required."
        ),
        "Tool Argument Quality": (
            "Tool arguments were incorrect — possibly raw country "
            "names instead of ISO codes, or indicators not from search results. "
            "The chatbot should use `find_codelist_value` for country codes and "
            "`search_indicators` before `get_data`."
        ),
        "Latest Data Note": (
            'The chatbot added "(using latest available data)" '
            "even when the user specified a year, or omitted it when no "
            "specific year was requested."
        ),
        "Claim Tagging": (
            "Claim tags were missing, malformed, or had missing "
            "`policy` attributes on some data values."
        ),
        "PCN": ("Claim tags were missing `policy` attributes or had untraceable claim_ids."),
    }
    for key, explanation in explanations.items():
        if key in name:
            return explanation
    return "Score below threshold (0.50). Review the conversation for specific issues."


def _get_next_steps(failures, scores):
    next_steps = []
    failure_keys = " ".join(failures.keys())

    if "Scope Guard" in failure_keys:
        next_steps.append(
            "Add explicit creative content refusal to `prompts.py` scope guard: "
            '"NEVER generate poems, haikus, stories, songs, jokes, or other creative content"'
        )
    if "Guided Discovery" in failure_keys:
        next_steps.append(
            "Strengthen planner disambiguation trigger: prioritize "
            "asking ONE clarifying question over answering when the query is vague "
            "(no specific country, indicator, or time period mentioned)"
        )
    if "Completeness" in failure_keys:
        next_steps.append(
            "Consider increasing the turn limit for complex personas, or improve "
            "the chatbot's ability to track multi-part requests across turns"
        )
    if "Context Retention" in failure_keys:
        next_steps.append(
            "Review planner prompt for data reuse: ensure the chatbot checks "
            "conversation history before making duplicate tool calls"
        )
    if any("Tool" in k for k in failures.keys()):
        next_steps.append(
            "Reinforce the 8-step tool workflow in the planner prompt, especially "
            "the REQUIRED steps and the use of `find_codelist_value` for country codes"
        )
    if "Latest Data Note" in failure_keys:
        next_steps.append(
            'Clarify the Latest Data Note rule: only add "(using latest available data)" '
            "when the user did NOT specify a year"
        )

    if not next_steps:
        if all(v >= 0.90 for v in scores.values()):
            next_steps.append("All metrics healthy — continue monitoring in future eval runs")
        else:
            lowest = min(scores.items(), key=lambda x: x[1])
            clean = lowest[0].split("[")[0].strip()
            next_steps.append(
                f"Monitor **{clean}** ({lowest[1]:.2f}) — "
                "lowest score, may drift below threshold in future runs"
            )
    return next_steps


def dump_conversations(eval_file, conv_file, output_dir):
    """Dump conversations and metrics to per-persona markdown files."""
    os.makedirs(output_dir, exist_ok=True)

    convs = json.load(open(conv_file))
    conv_by_persona = {c["persona"]: c["turns"] for c in convs}

    evals = json.load(open(eval_file))
    results = evals.get("results", {})

    for persona, metrics in results.items():
        turns = conv_by_persona.get(persona, [])
        lines = []
        lines.append(f"# {persona.upper()} — Conversation & Evaluation\n")
        lines.append(f"**Timestamp:** {evals.get('timestamp', 'N/A')}")
        ctx = PERSONA_CONTEXT.get(persona, "")
        if ctx:
            lines.append(f"**Persona:** {ctx}")
        lines.append(f"**Turns:** {len(turns)}\n")

        # --- Metrics ---
        lines.append("## Evaluation Results\n")
        lines.append("| Metric | Score | Status |")
        lines.append("|---|---|---|")
        pass_count = fail_count = 0
        for name, info in metrics.items():
            if isinstance(info, dict):
                score = info.get("score", 0)
                passed = info.get("passed", False)
                status = "✅ PASS" if passed else "❌ FAIL"
                if passed:
                    pass_count += 1
                else:
                    fail_count += 1
                lines.append(f"| {name} | {score:.2f} | {status} |")
        total = pass_count + fail_count
        pct = (100 * pass_count / total) if total else 0
        lines.append(f"\n**Pass Rate:** {pass_count}/{total} ({pct:.0f}%)\n")

        # --- Insights ---
        lines.extend(analyze_conversation(persona, turns, metrics))

        # --- Conversation ---
        lines.append("---\n")
        lines.append("## Conversation\n")
        for i, turn in enumerate(turns):
            role = turn["role"]
            content = turn["content"]
            if role == "assistant":
                # Transform <claim> tags into visible HTML for markdown preview
                content = re.sub(
                    r'<claim\s+id="[^"]*"\s+policy="[^"]*">([^<]*)</claim>',
                    r'<span title="verified claim">✅ \1</span>',
                    content,
                )
                # Wrap legacy tool call / planner sections in <details>
                if "<details>" not in content:
                    content = re.sub(
                        r"(---\n)(📋 \*\*Tool Calls\*\*.*?)(\n---\n🧠|\n### |\Z)",
                        r"\1<details>\n<summary>📋 <b>Tool Calls</b> (click to expand)</summary>\n\n\2\n</details>\n\3",
                        content,
                        flags=re.DOTALL,
                    )
                    content = re.sub(
                        r"(---\n)(🧠 \*\*Planner Reasoning\*\*.*?)(\n### |\Z)",
                        r"\1<details>\n<summary>🧠 <b>Planner Reasoning</b> (click to expand)</summary>\n\n\2\n</details>\n\3",
                        content,
                        flags=re.DOTALL,
                    )
            if role == "user":
                lines.append(f"### 👤 User (Turn {i // 2 + 1})\n")
            else:
                lines.append("### 🤖 Assistant\n")
            lines.append(content)
            lines.append("")

        filepath = os.path.join(output_dir, f"{persona}.md")
        with open(filepath, "w") as f:
            f.write("\n".join(lines))
        print(f"  Written: {filepath}")


if __name__ == "__main__":
    results_dir = os.path.join(os.path.dirname(__file__), ".results")
    eval_files = sorted(glob.glob(os.path.join(results_dir, "conversation_eval_*.json")))
    conv_files = sorted(glob.glob(os.path.join(results_dir, "conversations_*.json")))

    if not eval_files or not conv_files:
        print("No results found in .results/")
        sys.exit(1)

    if len(sys.argv) >= 3:
        eval_file = sys.argv[1]
        conv_file = sys.argv[2]
    else:
        eval_file = eval_files[-1]
        conv_file = conv_files[-1]

    output_dir = os.path.join(os.path.dirname(__file__), "conversations")
    print(f"Eval: {os.path.basename(eval_file)}")
    print(f"Conv: {os.path.basename(conv_file)}")
    print(f"Output: {output_dir}/\n")

    dump_conversations(eval_file, conv_file, output_dir)
    print("\nDone!")
