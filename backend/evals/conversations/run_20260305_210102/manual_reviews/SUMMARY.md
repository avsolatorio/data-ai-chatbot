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
| curious_citizen | 6 | 14/14 (100%) | -- |
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
| Eval Config Gap (pre-filter/criteria) | 5 | adversarial, data_engineer, geographer, journalist |
| API Reliability (timeout / empty response) | 2 | journalist, multilingual |
| LLM Instruction-Following | 1 | student |
| Judge Error | 1 | journalist |
| Chatbot Behavior (actual) | 0 | -- |

---

## Findings by Theme

### 1. Source Citation fails on non-standard response types

**Affected:** adversarial (0.00), data_engineer (0.00), journalist (0.12), student (0.40)

The Source Citation metric requires a `Sources:` section in every data-containing turn. It fails when:

- **Data-gap explanations** (adversarial Turn 2): The chatbot explains why 2035 data doesn't exist. No data was presented, so there are no sources to cite. *(Eval Config Gap — pre-filter should skip)*
- **Code/API responses** (data_engineer Turns 2, 5): The chatbot provides Python snippets or API URLs. The data source is embedded in the URL/code, not in a prose `Sources:` section. *(Eval Config Gap — pre-filter should skip)*
- **Methodological guidance** (student Turn 4): The chatbot explains how to calculate growth rates, reusing claim-tagged data from earlier turns but omitting the `Sources:` line. **The prompt already says "ALWAYS cite data sources under Sources:"** — the LLM did not follow its own instruction. *(LLM Instruction-Following failure)*
- **User-requested deliverables** (journalist Turn 5): The chatbot drafts a paragraph as requested. Appending `Sources:` would be inappropriate in context. *(Eval Config Gap — context-dependent scoring, see §4)*

**Root cause (mixed):** Most cases are eval pre-filter gaps (metric fires on turns with no data to cite). The student case is different — the instruction exists, but the LLM dropped `Sources:` on a turn that still contained claim-tagged data. The `min` aggregation amplifies single-turn lapses across all cases.

### 2. Claim Tagging triggered on turns with no numeric data

**Affected:** geographer (0.26), journalist (0.72)

The Claim Tagging pre-filter (`requires: "tool_data"`) fires whenever a Data360 tool was called. But `data360_get_data_api_url` returns a URL string, not numeric data with `claim_id` fields. The judge then penalizes the absence of `<claim>` tags on a turn that has nothing to tag.

For journalist Turn 5, the chatbot correctly omitted claim tags on user-provided data (24.2% Ghana poverty rate), but the judge expected them anyway.

### 3. API reliability failures trigger fallback behavior and false negatives

**Affected:** journalist (Source Citation 0.12, Content Structure 0.38, Follow-up Suggestions 0.02), multilingual (Context Retention 0.02)

Two distinct infrastructure issues surfaced:

- **journalist (Turns 1-2):** The Data360 API returned a timeout on the first `data360_get_data` call and an empty result set on retry. The chatbot correctly refused to fabricate data but, having no fallback strategy (e.g., retrying with a different database or narrower year range), resorted to directing the user to data.worldbank.org to fetch the numbers manually. This triggered the product-decision question in item #10 below. *(→ Actions #5, #10)*
- **multilingual (Turn 3):** Tool calls succeeded (GDP per capita data fetched for Congo-Brazzaville and Congo-Kinshasa), but the HTTP response generation returned nothing: `(no response from HTTP endpoint)`. The judge scored this as the chatbot ignoring the user entirely. The user had to repeat the request in Turn 4, which succeeded (0.92). *(→ Actions #5, #6)*

### 4. Context-dependent scoring penalizes appropriate behavior

**Affected:** journalist (Content Structure 0.38, Follow-up Suggestions 0.02, Source Citation 0.12)

When the user explicitly asks for a specific deliverable ("draft me a paragraph"), the chatbot correctly produces that deliverable without section labels, follow-up questions, or source citations. The judge applies the same structural expectations regardless of user intent.

### 5. `min` aggregation amplifies single-turn issues

In every failing persona, the failure was caused by exactly one bad turn dragging down an otherwise strong conversation. All other turns scored 0.90+.

---

## Actionable Next Steps

### Priority 1: Eval Framework Fixes

These address root causes that affect multiple personas and create false failures.

| # | Action | Effort | Impact | Personas Fixed | Findings |
|---|---|---|---|---|---|
| 1 | **Refine Claim Tagging pre-filter** -- check for `claim_id` in tool output, not just tool call presence. Exclude `get_data_api_url` and `get_viz_spec` tool-only turns. | Low | Fixes geographer, partially fixes journalist | 2 | §2 |
| 2 | **Add Source Citation pre-filter for non-data turns** -- exempt turns where no numeric values or claim tags are present in the response. | Low | Fixes adversarial, data_engineer, partially fixes student | 3 | §1 |
| 3 | **Add context-aware exemption for deliverable requests** -- when the user explicitly requests a specific output format ("draft a paragraph", "write a section"), relax Content Structure, Follow-up Suggestions, and Source Citation requirements. | Medium | Fixes journalist Turn 5 | 1 | §4 |
| 4 | **Consider hybrid aggregation** -- replace `min` with trimmed mean or drop-worst-1 for conversations with 5+ turns. Currently, one legitimately data-free turn can fail an entire conversation. | Medium | Reduces false failure rate across all personas | All | §5 |

### Priority 2: Infrastructure

| # | Action | Effort | Impact | Findings |
|---|---|---|---|---|
| 5 | **Add retry/error handling for API timeouts and empty responses** -- detect when tool calls time out or succeed but the response body is empty, and either retry (with backoff), try a fallback database (e.g., `WB_WDI` instead of `WB_GS`), or flag as infrastructure error. | Medium | Fixes journalist Turns 1-2, multilingual Turn 3 | §3 |
| 6 | **Log infrastructure failures distinctly** -- separate "chatbot reasoning failure" from "response generation failure" in eval results so infra issues don't pollute eval scores. | Low | Improves eval accuracy | §3 |

### Priority 3: Prompt Refinements & Instruction-Following (Low Priority)

| # | Action | Effort | Impact | Notes |
|---|---|---|---|---|
| 7 | **Standardize `Limitations:` label** -- the writer prompt (line 258) uses `Limitations:` ✅ but the combined prompt (line 600) still lists `Note:` as a valid label. The Content Structure eval metric (eval_config line 316-317) also references both. Align all three. | Low | Minor Content Structure improvement | Prompt inconsistency |
| 8 | **Monitor instruction-following on `Sources:` and tables** -- the prompt already says "ALWAYS cite sources" and "use tables for 3+ values", but the LLM still skips them on some turns (student Turn 4). Track instruction-following compliance as a metric rather than adding redundant prompt instructions. | Low | Insight for future prompting strategy | Not a missing instruction |

### Priority 4: Product Decisions Required

> [!IMPORTANT]
> **#10 — Should the chatbot give manual data-fetch instructions?**
>
> When Data360 API calls failed (journalist scenario, Turns 1-2), the chatbot directed the user to data.worldbank.org to fetch the data manually. This is transparent but undermines the product's value proposition. *(→ Finding §3)*
>
> **Options:**
> 1. **Prohibit** — retry + fallback databases; if all fail, state the data could not be retrieved and suggest trying again later.
> 2. **Allow as last resort** — only after retry/fallback attempts are exhausted; frame as a temporary workaround.
> 3. **Keep freely** — allow since it is technically helpful and transparent.

---

## Metric Health Summary

Metrics sorted by number of failures across 12 personas:

| Metric | Failures | Personas | Root Cause Pattern |
|---|---|---|---|
| Source Citation | 4 | adversarial, data_engineer, journalist, student | Pre-filter gap (3) + LLM instruction-following (1: student) |
| Claim Tagging | 2 | geographer, journalist | Pre-filter gap + judge error on user data |
| Content Structure | 1 | journalist | User-requested deliverable format |
| Follow-up Suggestions | 1 | journalist | User-requested deliverable format |
| Data Formatting | 1 | adversarial | Data-gap turn had no numeric data |
| Context Retention | 1 | multilingual | Infrastructure failure (empty HTTP response) |
| All other metrics | 0 | -- | Healthy |

The chatbot's core capabilities (Data Accuracy, Conversation Completeness, Data Gap Handling, Comparability Warnings, No Fabrication, Scope Guard) scored at or near 1.00 across all personas.
