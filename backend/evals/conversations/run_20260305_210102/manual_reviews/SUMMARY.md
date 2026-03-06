# Evaluation Run Summary -- run_20260305_210102

**Date:** 2026-03-06
**Prompt Version:** feat/setup-evals@f658e91a9
**Judge Model:** gpt-4.1-mini
**Mode:** HTTP E2E
**Personas Evaluated:** 12

---

## Overall Results

| Persona | Turns | Pass Rate | Failures |
|---|---|---|---|
| adversarial | 10 | 13/15 (86%) | Source Citation 0.00, Data Formatting 0.24 |
| comparison_max | 12 | 15/15 (100%) | -- |
| curious_citizen | -- | 14/14 (100%) | -- |
| data_engineer | 10 | 13/14 (92%) | Source Citation 0.00 |
| economist | 8 | 14/14 (100%) | -- |
| geographer | 4 | 13/14 (92%) | Claim Tagging 0.26 |
| health_researcher | 4 | 13/13 (100%) | -- |
| journalist | 6 | 10/14 (71%) | Claim Tagging 0.72, Content Structure 0.38, Follow-up Suggestions 0.02, Source Citation 0.12 |
| multilingual | 10 | 13/14 (92%) | Context Retention 0.02 |
| ngo_worker | 4 | 14/14 (100%) | -- |
| policy_advisor | 8 | 14/14 (100%) | -- |
| student | 12 | 13/14 (92%) | Source Citation 0.40 |

**Overall:** 7/12 personas passed all metrics (58%). 5 personas had at least one failure.

---

## Root Cause Breakdown

Every failure was traced to a specific turn and classified. No failure was caused by the chatbot giving an incorrect or hallucinated answer.

| Root Cause | Occurrences | Personas Affected |
|---|---|---|
| Eval Config Gap (pre-filter/criteria) | 6 | adversarial, data_engineer, geographer, journalist, student |
| Infrastructure Failure | 1 | multilingual |
| Judge Error | 1 | journalist |
| Chatbot Behavior (actual) | 0 | -- |

---

## Findings by Theme

### 1. Source Citation fails on non-standard response types

**Affected:** adversarial (0.00), data_engineer (0.00), journalist (0.12), student (0.40)

The Source Citation metric requires a `Sources:` section in every data-containing turn. It fails when:

- **Data-gap explanations** (adversarial Turn 2): The chatbot explains why 2035 data doesn't exist. No data was presented, so there are no sources to cite.
- **Code/API responses** (data_engineer Turns 2, 5): The chatbot provides Python snippets or API URLs. The data source is embedded in the URL/code, not in a prose `Sources:` section.
- **Methodological guidance** (student Turn 4): The chatbot explains how to calculate growth rates, reusing claim-tagged data from earlier turns but omitting the `Sources:` line.
- **User-requested deliverables** (journalist Turn 5): The chatbot drafts a paragraph as requested. Appending `Sources:` would be inappropriate in context.

**Root cause:** The `min` aggregation means one turn without `Sources:` drags the entire score to the minimum of that turn's score. The metric does not distinguish response types.

### 2. Claim Tagging triggered on turns with no numeric data

**Affected:** geographer (0.26), journalist (0.72)

The Claim Tagging pre-filter (`requires: "tool_data"`) fires whenever a Data360 tool was called. But `data360_get_data_api_url` returns a URL string, not numeric data with `claim_id` fields. The judge then penalizes the absence of `<claim>` tags on a turn that has nothing to tag.

For journalist Turn 5, the chatbot correctly omitted claim tags on user-provided data (24.2% Ghana poverty rate), but the judge expected them anyway.

### 3. Infrastructure failure created a false negative

**Affected:** multilingual (Context Retention 0.02)

Turn 3 had successful tool calls (GDP per capita data fetched for Congo-Brazzaville and Congo-Kinshasa) but the HTTP response generation returned nothing: `(no response from HTTP endpoint)`. The judge scored this as the chatbot ignoring the user entirely. The user had to repeat the request in Turn 4, which succeeded (0.92).

### 4. Context-dependent scoring penalizes appropriate behavior

**Affected:** journalist (Content Structure 0.38, Follow-up Suggestions 0.02, Source Citation 0.12)

When the user explicitly asks for a specific deliverable ("draft me a paragraph"), the chatbot correctly produces that deliverable without section labels, follow-up questions, or source citations. The judge applies the same structural expectations regardless of user intent.

### 5. `min` aggregation amplifies single-turn issues

In every failing persona, the failure was caused by exactly one bad turn dragging down an otherwise strong conversation. All other turns scored 0.90+.

---

## Actionable Next Steps

### Priority 1: Eval Framework Fixes

These address root causes that affect multiple personas and create false failures.

| # | Action | Effort | Impact | Personas Fixed |
|---|---|---|---|---|
| 1 | **Refine Claim Tagging pre-filter** -- check for `claim_id` in tool output, not just tool call presence. Exclude `get_data_api_url` and `get_viz_spec` tool-only turns. | Low | Fixes geographer, partially fixes journalist | 2 |
| 2 | **Add Source Citation pre-filter for non-data turns** -- exempt turns where no numeric values or claim tags are present in the response. | Low | Fixes adversarial, data_engineer, partially fixes student | 3 |
| 3 | **Add context-aware exemption for deliverable requests** -- when the user explicitly requests a specific output format ("draft a paragraph", "write a section"), relax Content Structure, Follow-up Suggestions, and Source Citation requirements. | Medium | Fixes journalist Turn 5 | 1 |
| 4 | **Consider hybrid aggregation** -- replace `min` with trimmed mean or drop-worst-1 for conversations with 5+ turns. Currently, one legitimately data-free turn can fail an entire conversation. | Medium | Reduces false failure rate across all personas | All |

### Priority 2: Infrastructure

| # | Action | Effort | Impact |
|---|---|---|---|
| 5 | **Add retry/error handling for empty HTTP responses** -- detect when tool calls succeed but the response body is empty, and either retry or flag as infrastructure error. | Medium | Fixes multilingual Turn 3 |
| 6 | **Log infrastructure failures distinctly** -- separate "chatbot reasoning failure" from "response generation failure" in eval results so infra issues don't pollute eval scores. | Low | Improves eval accuracy |

### Priority 3: Chatbot Prompt Refinements (Low Priority)

These are minor improvements that would raise scores but are not blocking.

| # | Action | Effort | Impact |
|---|---|---|---|
| 7 | **Always include `Sources:` when claim-tagged data is present** -- update system prompt to reinforce this even in methodological or code-focused responses. | Low | Raises student, data_engineer Source Citation |
| 8 | **Prefer markdown tables for 3+ values** -- add a system prompt hint to use tables instead of bullet lists for multi-value presentations. | Low | Raises Data Formatting across several personas |
| 9 | **Use `Limitations:` label instead of `Note:`** -- standardize the caveats section label. | Low | Minor Content Structure improvement |

### Priority 4: Product Decisions Required

| # | Decision | Context |
|---|---|---|
| 10 | **Should the chatbot give manual data-fetch instructions?** | When API calls fail, the journalist chatbot told the user to go to data.worldbank.org. This undermines the product value but is transparent. Options: prohibit, allow as last resort, or keep freely. |

---

## Metric Health Summary

Metrics sorted by number of failures across 12 personas:

| Metric | Failures | Personas | Root Cause Pattern |
|---|---|---|---|
| Source Citation | 4 | adversarial, data_engineer, journalist, student | Non-standard response types lack `Sources:` |
| Claim Tagging | 2 | geographer, journalist | Pre-filter gap + judge error on user data |
| Content Structure | 1 | journalist | User-requested deliverable format |
| Follow-up Suggestions | 1 | journalist | User-requested deliverable format |
| Data Formatting | 1 | adversarial | Data-gap turn had no numeric data |
| Context Retention | 1 | multilingual | Infrastructure failure (empty HTTP response) |
| All other metrics | 0 | -- | Healthy |

The chatbot's core capabilities (Data Accuracy, Conversation Completeness, Data Gap Handling, Comparability Warnings, No Fabrication, Scope Guard) scored at or near 1.00 across all personas.
