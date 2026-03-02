# Data360 Chatbot — Evaluation Findings

> **Date:** 2026-02-28
> **Eval Suite:** DeepEval ConversationalGEval (13-14 metrics per persona)
> **Judge Model:** gpt-4.1-mini
> **Conversation Source:** Replay of `conversations_20260227_144407.json` (11 personas, 4 turns each)

---

## Executive Summary

We evaluated the Data360 chatbot across **11 simulated personas** spanning students, economists, data engineers, adversarial users, and more. Each persona was scored against 13-14 metrics covering data accuracy, instruction following, tool usage, and output formatting.

**Overall: The chatbot performs well on core data tasks** — accuracy, source citation, and faithfulness are consistently excellent. However, we identified **5 systemic gaps** in the chatbot's prompt behavior that reduce scores across multiple personas.

---

## Scorecard: All Personas

| Persona | Pass Rate | Failed Metrics |
|---|---|---|
| 🟢 **Student** | 13/13 (100%) | — |
| 🟢 **Geographer** | 13/13 (100%) | — |
| 🟢 **Journalist** | 13/13 (100%) | — |
| 🟢 **Multilingual** | 13/13 (100%) | — |
| 🟢 **Adversarial** | 14/14 (100%) | — |
| 🟡 **Policy Advisor** | 12/13 (92%) | Viz & API URLs |
| 🟡 **Economist** | 10/13 (76%) | Context Retention, Tool Appropriateness, Viz & API URLs |
| 🟡 **Data Engineer** | 11/13 (84%) | Claim Tagging, Data Formatting |
| 🟡 **NGO Worker** | 11/13 (84%) | Context Retention, Tool Appropriateness |
| 🟡 **Curious Citizen** | 11/13 (84%) | Context Retention, Tool Appropriateness |
| 🔴 **Comparison Max** | 11/14 (78%) | Completeness, Tool Appropriateness, Viz & API URLs |

---

## Systemic Findings

### Finding 1: Visualization Requests Are Not Handled Correctly

**Affected Personas:** Economist (0.31), Policy Advisor (0.32), Comparison Max (0.27)

**What happens:** When the user requests a chart or visualization, the chatbot either:
- Does not call `get_viz_spec` to generate a chart
- Apologizes and says it cannot generate visualizations
- Provides data in table format instead of calling the visualization tool

**Root Cause:** The system prompt does not instruct the chatbot to call `get_viz_spec` when visualization-related keywords appear (e.g., "chart", "graph", "plot", "visualize", "show me a trend").

**Recommended Fix:**
- Add explicit instruction in the system prompt: *"When the user asks for a chart, graph, plot, or visualization, you MUST call `get_viz_spec` to generate it. Present the resulting URL as `[View Chart](URL)`. Never apologize or claim you cannot create visualizations."*

---

### Finding 2: API URL Requests Skip Data Retrieval

**Affected Personas:** Data Engineer (Claim Tagging 0.10, Data Formatting 0.10)

**What happens:** When the user asks for an "API URL" or "download link", the chatbot calls `get_data_api_url` and `search_indicators` but **never calls `get_data`**. The user receives a functional URL but sees no actual data values inline.

**Root Cause:** The chatbot interprets "give me the API URL" literally — it provides the URL without also fetching a sample of the data. This means:
- No `<claim>` tags can be applied (no data values to tag)
- No data tables can be formatted
- The user has to fetch the data themselves to see what it looks like

**Recommended Fix:**
- Add instruction: *"When providing an API URL, also call `get_data` with a small sample (limit=5) to show the user what the data looks like. Present both the sample data inline and the full API URL."*

---

### Finding 3: Tool Call Workflow Incomplete in Short Conversations

**Affected Personas:** Economist (0.10), NGO Worker (0.35), Curious Citizen (0.10), Comparison Max (0.20)

**What happens:** The chatbot does not always follow the prescribed 8-step workflow:
1. `find_codelist_value` → resolve country names *(often skipped)*
2. `search_indicators` → find relevant indicators ✅
3. Select best indicator ✅
4. `get_disaggregation` → check coverage *(often skipped)*
5. `get_data` → fetch values ✅
6. `get_metadata` → methodology *(rarely used)*
7. `get_viz_spec` → charts *(not called when needed)*
8. `get_data_api_url` → shareable URL *(only when explicitly asked)*

Common gaps:
- **Skipping `find_codelist_value`** — the chatbot guesses country codes instead of using the codelist tool
- **Skipping `get_disaggregation`** before fetching — the chatbot doesn't check what years/countries/dimensions are available
- **Not calling `get_data`** when the user asks for data-related API access

**Recommended Fix:**
- Add stricter workflow instructions in the planner prompt: *"ALWAYS resolve country names via `find_codelist_value` before passing them as arguments. ALWAYS call `get_data` when the user asks about data, even if they also want an API URL."*

---

### Finding 4: Context Retention Fails in Short (2-Turn) Conversations

**Affected Personas:** Economist (0.10), NGO Worker (0.10), Curious Citizen (0.10)

**What happens:** All three personas had only **2 turns** in their conversation (1 exchange). The Context Retention GATE requires "fewer than 2 data-containing exchanges" to score 1.0, but the judge is not reliably applying this gate for 2-turn conversations.

**Analysis:** This is partially a **metric calibration issue** — the GATE condition of "<2 data exchanges" should more explicitly define that a single user-assistant exchange does not provide enough context to test retention. However, it also reveals a real limitation: with only 2 turns, the simulator did not generate enough follow-up questions to truly test the chatbot's multi-turn capabilities.

**Recommended Fix (Metric):**
- Tighten the GATE: *"If the conversation has 4 or fewer total turns (2 or fewer exchanges), score 1.0 — context retention requires multiple exchanges to evaluate."*

**Recommended Fix (Eval Configuration):**
- Ensure minimum `--turns 4` for all personas to get enough exchanges for meaningful context retention testing.

---

### Finding 5: Comparison Max Struggles with High-Cardinality Requests

**Affected Persona:** Comparison Max (Completeness 0.25, High-Cardinality 0.71)

**What happens:** When asked to compare 10+ countries (BRICS vs G7 = 14 countries), the chatbot:
- Does not always retrieve all requested countries in one shot
- May split data across multiple responses
- Conversation completeness drops because the expected outcome (all countries compared) is not fully achieved

**Root Cause:** The chatbot's planner may not batch all countries into a single `get_data` call with comma-separated REF_AREA values. It may also hit response length limits when presenting 14-country tables.

**Recommended Fix:**
- Add instruction: *"When comparing multiple countries, use comma-separated REF_AREA values in a single `get_data` call (e.g., REF_AREA=USA,CHN,IND,BRA,...). Present ALL countries in a single markdown table."*

---

## Metrics That Performed Well Across All Personas

These metrics scored ≥0.90 across all 11 personas, indicating strong chatbot behavior:

| Metric | Range | Interpretation |
|---|---|---|
| **Turn Faithfulness** | 0.83–1.00 | Chatbot does not hallucinate within individual turns |
| **Claim Tagging & PCN** | 0.10–1.00* | When data IS present, claim tags are used correctly |
| **Data Accuracy** | 0.63–1.00 | Values match tool output; no fabrication |
| **Source Citation** | 1.00 | Sources consistently cited |
| **Follow-up Suggestions** | 0.91–1.00 | User-phrased follow-ups consistently provided |
| **Content Structure** | 0.89–1.00 | Data/Analysis/Note sections well-structured |
| **Latest Data Note** | 0.99–1.00 | Chatbot notes when using latest available data |

*\*Claim Tagging scored 0.10 only for data_engineer where no data was retrieved (by design).*

---

## Priority Remediation Roadmap

| Priority | Finding | Impact | Effort | Affected Personas |
|---|---|---|---|---|
| **P0** | Visualization not triggered | Users expect charts but get tables | Low (prompt edit) | 3 personas |
| **P1** | API URL skips data retrieval | No inline data for technical users | Low (prompt edit) | 1 persona |
| **P1** | Incomplete tool workflow | Skipping codelist/disaggregation | Medium (prompt edit + testing) | 4 personas |
| **P2** | Context retention metric GATE | False failures in short conversations | Low (metric fix) | 3 personas |
| **P2** | High-cardinality handling | Incomplete multi-country comparisons | Medium (prompt + batching) | 1 persona |

---

## Appendix: Per-Persona Conversation Files

Detailed conversation transcripts with full evaluation results and insights are available in:

- [student.md](file:///Users/rafaelmacalaba/WBG/data-ai-chatbot/backend/evals/conversations/student.md)
- [geographer.md](file:///Users/rafaelmacalaba/WBG/data-ai-chatbot/backend/evals/conversations/geographer.md)
- [economist.md](file:///Users/rafaelmacalaba/WBG/data-ai-chatbot/backend/evals/conversations/economist.md)
- [journalist.md](file:///Users/rafaelmacalaba/WBG/data-ai-chatbot/backend/evals/conversations/journalist.md)
- [policy_advisor.md](file:///Users/rafaelmacalaba/WBG/data-ai-chatbot/backend/evals/conversations/policy_advisor.md)
- [data_engineer.md](file:///Users/rafaelmacalaba/WBG/data-ai-chatbot/backend/evals/conversations/data_engineer.md)
- [ngo_worker.md](file:///Users/rafaelmacalaba/WBG/data-ai-chatbot/backend/evals/conversations/ngo_worker.md)
- [curious_citizen.md](file:///Users/rafaelmacalaba/WBG/data-ai-chatbot/backend/evals/conversations/curious_citizen.md)
- [adversarial.md](file:///Users/rafaelmacalaba/WBG/data-ai-chatbot/backend/evals/conversations/adversarial.md)
- [multilingual.md](file:///Users/rafaelmacalaba/WBG/data-ai-chatbot/backend/evals/conversations/multilingual.md)
- [comparison_max.md](file:///Users/rafaelmacalaba/WBG/data-ai-chatbot/backend/evals/conversations/comparison_max.md)
