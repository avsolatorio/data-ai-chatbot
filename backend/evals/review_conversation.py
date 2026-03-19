"""Post-hoc LLM-powered conversation review -- independent of DeepEval.

Loads a saved conversation from .results/ and feeds it to an LLM with a
structured review prompt. Produces a detailed quality review with checks
and an overall score.

Usage:
    cd backend
    PYTHONPATH=. .venv/bin/python -m evals.review_conversation --persona health_researcher
    PYTHONPATH=. .venv/bin/python -m evals.review_conversation --file .results/conversations_20260301_180454.json
    PYTHONPATH=. .venv/bin/python -m evals.review_conversation --file .results/conversations_20260301_180454.json --all
"""

import argparse
import json
import logging
import os
import re
from datetime import datetime
from pathlib import Path

from openai import OpenAI

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s", datefmt="%H:%M:%S"
)
logger = logging.getLogger("review_conversation")

EVALS_DIR = Path(__file__).parent
RESULTS_DIR = EVALS_DIR / ".results"
REVIEWS_DIR = EVALS_DIR / "reviews"
REVIEW_MODEL = os.getenv("REVIEW_MODEL", "gpt-4.1-mini")

REVIEW_SYSTEM_PROMPT = """You are a senior QA engineer reviewing conversations between a simulated user and the Data360 Chatbot -- an MCP-powered assistant that retrieves World Bank development data, generates visualizations, and provides analysis.

Your job is to produce a STRUCTURED, HONEST quality review. You are not trying to pass or fail the conversation -- you are identifying what went well and what could be improved.

## What the Chatbot Should Do

1. **Data retrieval**: Use MCP tools (search_indicators, get_data, get_viz_spec, find_codelist_value) to fetch real data
2. **Claim tags**: Wrap every numeric data value in <claim id="..." policy="auto">value</claim> tags, with claim_ids matching the tool output
3. **Source citations**: Include a "Sources:" section citing database, indicator name, and methodology
4. **Follow-up suggestions**: End with "Suggested follow-ups:" containing 2-3 user-phrased questions
5. **Data formatting**: Units on values, markdown tables for 3+ items, no scientific notation
6. **Content structure**: Label sections with Data:, Analysis:, Note:, Limitations:
7. **Latest data note**: When user did not specify a year, mention "latest available data"
8. **Visualizations**: When asked for charts, call get_viz_spec and provide clickable markdown links
9. **API URLs**: When asked for programmatic access, provide direct API URLs

## Your Review Format

You MUST output EXACTLY this JSON structure (no markdown fencing, just raw JSON):

{
  "persona": "<persona name>",
  "overall_score": <0.0-1.0>,
  "overall_assessment": "<2-3 sentence summary>",
  "checks": [
    {
      "category": "<category name>",
      "score": <0.0-1.0>,
      "status": "PASS|FAIL|PARTIAL|N/A",
      "finding": "<1-2 sentence finding>",
      "evidence": "<specific quote or reference from conversation>"
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "issues": [
    {
      "severity": "critical|important|minor",
      "description": "<what went wrong>",
      "turn": <turn number where it occurred>,
      "recommendation": "<how to fix>"
    }
  ],
  "conversation_flow": "<assessment of how natural the conversation felt>"
}

## Review Categories (check each one)

1. **Data Traceability**: Do claim_ids in the response text match claim_ids in the Tool Calls section? Cross-reference at least 3 values.
2. **Data Accuracy**: Do the numeric values in the response match OBS_VALUE from tool output? Check country codes, years, and values.
3. **Tool Workflow**: Did the chatbot follow the correct workflow? (search -> get_data -> present). Were there unnecessary duplicate calls?
4. **Claim Tag Coverage**: Are ALL numeric data values wrapped in claim tags? Any naked numbers?
5. **Source Citations**: Does every data-containing turn have a "Sources:" section with database name and indicator?
6. **Follow-up Quality**: Are suggested follow-ups relevant, user-phrased, and progressive (building on the conversation)?
7. **Content Structure**: Are responses well-organized with Data/Analysis/Note/Limitations labels?
8. **Cross-Turn Consistency**: Does data remain consistent across turns? Does the chatbot contradict itself?
9. **Expected Outcome Coverage**: How many of the persona expected_outcome sub-goals were actually satisfied?
10. **Conversation Naturalness**: Did the simulated user ask realistic questions? Did the chatbot respond proportionately?

## Rules

- Be SPECIFIC -- cite exact values, claim_ids, and turn numbers
- If a check is not applicable (e.g., no visualization requested), mark it N/A with score 1.0
- overall_score should be the WEIGHTED average: Data Traceability and Accuracy are 2x weight
- Be critical but fair -- a "PARTIAL" is better than a charitable "PASS"
"""


def _find_latest_conversation_file(persona=None):
    """Find the most recent conversations JSON file."""
    files = sorted(RESULTS_DIR.glob("conversations_*.json"), reverse=True)
    if not files:
        return None
    if persona:
        for f in files:
            with open(f) as fh:
                data = json.load(fh)
            for item in data:
                if item.get("persona") == persona:
                    return f
        return None
    return files[0]


def _extract_conversation_for_review(conversation):
    """Extract a clean conversation representation for the LLM reviewer."""
    turns = conversation.get("turns", [])
    formatted = []
    for i, turn in enumerate(turns):
        role = turn.get("role", "unknown")
        content = turn.get("content", "")
        turn_num = (i // 2) + 1
        if role == "user":
            formatted.append("=== USER (Turn %d) ===\n%s" % (turn_num, content))
        else:
            formatted.append("=== ASSISTANT (Turn %d) ===\n%s" % (turn_num, content))
    return "\n\n".join(formatted)


def _run_review(client, conversation, model):
    """Send conversation to LLM for review and parse the response."""
    persona = conversation.get("persona", "unknown")
    scenario = conversation.get("scenario", "")
    expected_outcome = conversation.get("expected_outcome", "")
    num_turns = conversation.get("num_turns", 0)
    conversation_text = _extract_conversation_for_review(conversation)

    if len(conversation_text) > 100000:
        conversation_text = conversation_text[:100000] + "\n\n[TRUNCATED]"

    user_prompt = (
        "Review this conversation:\n\n"
        "**Persona:** %s\n"
        "**Scenario:** %s\n"
        "**Expected Outcome:** %s\n"
        "**Total messages:** %d\n\n"
        "--- CONVERSATION START ---\n\n"
        "%s\n\n"
        "--- CONVERSATION END ---\n\n"
        "Produce your structured JSON review now. Output ONLY the JSON, no markdown fencing."
    ) % (persona, scenario, expected_outcome, num_turns, conversation_text)

    logger.info("Sending %d chars to %s for review...", len(user_prompt), model)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": REVIEW_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.3,
        max_tokens=4000,
    )

    content = response.choices[0].message.content.strip()
    content = re.sub(r"^```json?\s*\n", "", content)
    content = re.sub(r"\n```\s*$", "", content)

    try:
        review = json.loads(content)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse review JSON: %s", e)
        logger.error("Raw response:\n%s", content[:500])
        review = {
            "persona": persona,
            "overall_score": 0,
            "overall_assessment": "Review failed -- LLM did not return valid JSON",
            "raw_response": content,
            "checks": [],
            "strengths": [],
            "issues": [],
        }
    return review


def _format_review_markdown(review):
    """Format review JSON as a readable markdown document."""
    lines = []
    persona = review.get("persona", "unknown")
    score = review.get("overall_score", 0)
    assessment = review.get("overall_assessment", "")

    lines.append("# Conversation Review: %s" % persona.upper())
    lines.append("")
    lines.append("**Reviewed:** %s" % datetime.now().strftime("%Y-%m-%d %H:%M"))
    lines.append("**Model:** %s" % REVIEW_MODEL)
    lines.append(
        "**Overall Score:** %.2f / 1.00 %s"
        % (score, "[PASS]" if score >= 0.8 else "[MARGINAL]" if score >= 0.6 else "[FAIL]")
    )
    lines.append("")
    lines.append("> %s" % assessment)
    lines.append("")

    checks = review.get("checks", [])
    if checks:
        lines.append("## Detailed Checks")
        lines.append("")
        lines.append("| # | Category | Score | Status | Finding |")
        lines.append("|---|---|---|---|---|")
        for i, check in enumerate(checks, 1):
            status = check.get("status", "?")
            lines.append(
                "| %d | %s | %.2f | %s | %s |"
                % (
                    i,
                    check.get("category", ""),
                    check.get("score", 0),
                    status,
                    check.get("finding", ""),
                )
            )
        lines.append("")

    if checks:
        lines.append("### Evidence Details")
        lines.append("")
        for i, check in enumerate(checks, 1):
            evidence = check.get("evidence", "")
            if evidence and check.get("status") != "N/A":
                lines.append("**%d. %s:**" % (i, check.get("category", "")))
                lines.append("> %s" % evidence)
                lines.append("")

    strengths = review.get("strengths", [])
    if strengths:
        lines.append("## Strengths")
        lines.append("")
        for s in strengths:
            lines.append("- %s" % s)
        lines.append("")

    issues = review.get("issues", [])
    if issues:
        lines.append("## Issues")
        lines.append("")
        for issue in issues:
            severity = issue.get("severity", "minor")
            lines.append("- **[%s]** %s" % (severity.upper(), issue.get("description", "")))
            if issue.get("turn"):
                lines.append("  - Turn: %s" % issue["turn"])
            if issue.get("recommendation"):
                lines.append("  - Fix: %s" % issue["recommendation"])
        lines.append("")
    else:
        lines.append("## No Issues Found")
        lines.append("")

    flow = review.get("conversation_flow", "")
    if flow:
        lines.append("## Conversation Flow")
        lines.append("")
        lines.append(flow)
        lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(description="Post-hoc LLM review of saved conversations")
    parser.add_argument(
        "--persona", type=str, default=None, help="Persona to review (finds latest conversation)"
    )
    parser.add_argument(
        "--file", type=str, default=None, help="Path to specific conversations JSON file"
    )
    parser.add_argument(
        "--all", action="store_true", dest="review_all", help="Review all personas in the file"
    )
    parser.add_argument(
        "--model", type=str, default=None, help="Model for review (default: %s)" % REVIEW_MODEL
    )
    args = parser.parse_args()

    if not args.persona and not args.file:
        parser.error("Must specify --persona or --file")

    review_model = args.model or REVIEW_MODEL

    if args.file:
        conv_path = Path(args.file)
        if not conv_path.is_absolute():
            conv_path = EVALS_DIR / conv_path
    else:
        conv_path = _find_latest_conversation_file(args.persona)

    if not conv_path or not conv_path.exists():
        logger.error("Conversation file not found")
        return

    logger.info("Loading conversations from: %s", conv_path.name)
    with open(conv_path) as f:
        conversations = json.load(f)

    if args.persona and not args.review_all:
        conversations = [c for c in conversations if c.get("persona") == args.persona]
        if not conversations:
            logger.error("Persona '%s' not found in %s", args.persona, conv_path.name)
            return

    client = OpenAI()
    REVIEWS_DIR.mkdir(parents=True, exist_ok=True)

    all_reviews = []
    for conv in conversations:
        persona = conv.get("persona", "unknown")
        logger.info("Reviewing: %s (%d messages)", persona, conv.get("num_turns", 0))

        review = _run_review(client, conv, review_model)
        all_reviews.append(review)

        review_md = _format_review_markdown(review)
        out_path = REVIEWS_DIR / ("%s_review.md" % persona)
        out_path.write_text(review_md + "\n")
        logger.info("  Saved: %s", out_path.name)

        json_path = REVIEWS_DIR / ("%s_review.json" % persona)
        with open(json_path, "w") as f:
            json.dump(review, f, indent=2)

        score = review.get("overall_score", 0)
        status = "PASS" if score >= 0.8 else "MARGINAL" if score >= 0.6 else "FAIL"
        num_issues = len(review.get("issues", []))
        icon = {"PASS": "PASS", "MARGINAL": "WARN", "FAIL": "FAIL"}[status]
        print("  [%s] %s: %.2f  (%d issues)" % (icon, persona, score, num_issues))

    print("")
    print("=" * 60)
    print("  Reviewed: %d conversations" % len(all_reviews))
    if all_reviews:
        avg_score = sum(r.get("overall_score", 0) for r in all_reviews) / len(all_reviews)
        print("  Average score: %.2f" % avg_score)
    print("  Reviews saved to: %s/" % REVIEWS_DIR)
    print("=" * 60)


if __name__ == "__main__":
    main()
