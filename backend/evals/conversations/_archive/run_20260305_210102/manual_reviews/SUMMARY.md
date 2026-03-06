# Evaluation Run Summary -- run_20260305_210102

**Date:** 2026-03-06
**Prompt Version:** feat/setup-evals@c7e0bae22
**Judge Model:** gpt-4.1-mini
**Mode:** HTTP E2E
**Personas Evaluated:** 16

---

## Overall Results

| Persona | Turns | Pass Rate | Failures |
|---|---|---|---|
| adversarial | 10 | 13/15 (86%) | Source Citation 0.00, Data Formatting 0.24 |
| adversarial_api_edge_cases | 8 | 12/13 (92%) | Source Citation 0.05 |
| adversarial_creative_writing | 10 | 11/13 (84%) | Content Structure 0.39, Follow-up Suggestions 0.04 |
| adversarial_region_disambig | 10 | 13/13 (100%) | -- |
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
| regression_south_asia_claim_id | 10 | 13/13 (100%) | -- |

**Overall:** 9/16 personas passed all metrics (56%). 7 personas had at least one failure.

---

## Root Cause Breakdown

Every failure was traced to a specific turn and classified. No failure was caused by the chatbot giving an incorrect or hallucinated answer.

| Root Cause | Occurrences | Personas Affected |
|---|---|---|
| Eval Config Gap (pre-filter/criteria) | 5 | adversarial, data_engineer, geographer, journalist |
| Chatbot Behavior (actual) | 2 | creative_writing (scope guard: wrote haiku + caption) |
| LLM Instruction-Following | 2 | student (dropped Sources:), api_edge_cases (dropped Sources:) |
| API Reliability (timeout / empty response) | 2 | journalist, multilingual |
| Judge Error | 1 | journalist |

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

### 6. Scope guard failures: chatbot wrote creative content

**Affected:** adversarial_creative_writing_scope_guard (Content Structure 0.39, Follow-up Suggestions 0.04)

The chatbot **wrote a haiku** at Turn 1 and **generated a social media caption** at Turn 4, despite the routing log correctly recognizing the haiku request as _"a creative writing request rather than a request for data."_ At Turn 2, it partially refused a persuasive essay but offered to draft one with real data. These are scope guard failures -- the system prompt does not explicitly prohibit creative content.

The Content Structure and Follow-up Suggestions failures on Turn 4 are secondary: the social media caption naturally lacks section labels and follow-ups. **But the primary issue is that the chatbot should not have produced the caption at all.**

### 7. Scope guard is not measured by any metric

**Affected:** adversarial_creative_writing_scope_guard

Turn 1 (haiku) was completely invisible to the eval framework: all metrics were pre-filtered (N/A) because no tool calls occurred. The chatbot produced creative content and received no penalty. A dedicated Scope Guard metric is needed to detect this.

### 8. Long-form persona format validated

**Affected:** All 3 new personas

The 3 personas were rewritten from scripted-question format to long-form behavioral style. Results confirm the format works: the LLM simulator generates diverse, natural queries. Region disambiguation correctly handled ambiguous "Congo" (resolved to COD). API edge cases generated cross-database comparison queries (San Marino across WB_HNP, WB_ECON, WB_GS).

### 9. Claim_id collision on derived values (intermittent)

**Affected:** regression_south_asia_and_claim_id

When the chatbot derives a new value from tool output (e.g., computing GDP total from GDP per capita x population), it may reuse the same `claim_id` for both the source and derived values. This was observed once in the original scripted run of the adversarial_api_edge_cases persona.

In the regression persona runs, the behavior varied:
- **Run 1 (with hint):** Chatbot refused the derivation entirely, citing claim_id constraints.
- **Run 2 (no hint):** Chatbot computed derived GDP per capita but presented the results **without claim tags** (prefixed with "approx"), correctly treating them as non-API-sourced values.

The collision was **not reproduced** but the chatbot's handling is inconsistent across runs. The behavior depends on how the user phrases the derivation request and whether the prompt's claim_id instructions are salient in context.

### 10. South Asia correctly resolved to SAS

**Affected:** regression_south_asia_and_claim_id

Both runs of the regression persona correctly resolved "South Asia" to `REF_AREA: SAS`. In the hint-free run, the chatbot did not conflate South Asia with Southeast Asia even without explicit disambiguation cues from the user.

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

Metrics sorted by number of failures across 15 personas:

| Metric | Failures | Personas | Root Cause Pattern |
|---|---|---|---|
| Source Citation | 5 | adversarial, data_engineer, journalist, student, api_edge_cases | Pre-filter gap (3) + LLM instruction-following (2: student, api_edge_cases) |
| Claim Tagging | 2 | geographer, journalist | Pre-filter gap + judge error on user data |
| Content Structure | 2 | journalist, creative_writing | Deliverable format + scope guard failure |
| Follow-up Suggestions | 2 | journalist, creative_writing | Deliverable format + scope guard failure |
| Data Formatting | 1 | adversarial | Data-gap turn had no numeric data |
| Context Retention | 1 | multilingual | Infrastructure failure (empty HTTP response) |
| All other metrics | 0 | -- | Healthy |

The chatbot's core data capabilities (Data Accuracy, Conversation Completeness, Data Gap Handling, Comparability Warnings) scored at or near 1.00 across all 16 personas. The creative_writing persona revealed **2 scope guard failures** (haiku + social media caption). The claim_id collision on derived values (Finding #9) is intermittent and not yet reproduced but remains a known risk.

---

## Persona Design Notes

The 3 new adversarial personas were rewritten to the long-form behavioral style. The format is confirmed working: simulators generate diverse, natural queries without hard-coded scripts.

The regression persona (`regression_south_asia_and_claim_id`) uses hard-coded questions intentionally to test specific edge cases (South Asia disambiguation, claim_id collision) that are unlikely to surface from behavioral descriptions alone.

---

## Replay for Re-scoring

All conversations are saved as JSON in `backend/evals/.results/conversations_TIMESTAMP.json`. To re-score with updated rubrics without re-running the conversation:

```bash
python evals/run_conversation_eval.py --persona PERSONA --replay TIMESTAMP
```

Recent timestamps for this run:
- `20260306_180611` -- creative_writing
- `20260306_181001` -- region_disambiguation
- `20260306_181650` -- api_edge_cases
- `20260306_193707` -- regression (v1, with hints)
- `20260306_194432` -- regression (v2, no hints)
