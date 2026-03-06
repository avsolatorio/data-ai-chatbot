# Journalist Persona -- Manual Review

**Run ID:** 20260305_210102
**Reviewer:** Rafael Macalaba
**Date:** 2026-03-05

---

## Summary

The journalist persona simulates a data journalist (Amara, Lagos-based) who needs
publication-ready poverty figures for Nigeria, Ghana, and Cameroon. The conversation
surfaced three distinct issues: an API reliability problem, a chatbot behavior
question around assistive instructions, and a judge scoring error around
user-provided data.

---

## Findings

### 1. Data360 API Timeout -- No Retry or Failover

**Turns affected:** Turn 1, Turn 2

The chatbot searched for the correct indicator (`WB_GS_SI_POV_DDAY` -- Poverty
headcount ratio at $2.15/day) and attempted to fetch data for Nigeria, Ghana, and
Cameroon. Both attempts failed:

- **Turn 1:** The API returned `"error": "Timeout fetching data: "` with `count: 0`.
- **Turn 2:** The API returned an empty `data: []` array with no error message, but
  still zero rows.

The chatbot correctly refused to fabricate data. However, it did **not retry the
request** or attempt a fallback strategy (e.g., trying a different database like
`WB_WDI` instead of `WB_GS`, or narrowing the year range). It accepted the failure
on the first attempt and moved to manual guidance.

> **Recommendation:** Implement retry logic for Data360 API timeouts. Consider
> adding a system prompt hint or tool-use guideline instructing the LLM to retry
> once on timeout before falling back to manual instructions. A failover strategy
> (e.g., try `WB_WDI` if `WB_GS` times out) should also be explored.

### 2. Chatbot Gives Instructions to Manually Fetch Data

**Turns affected:** Turn 1, Turn 2

Because the API calls failed, the chatbot provided step-by-step instructions
directing the user to the World Bank Data website to pull the numbers themselves.
While this is assistive and transparent, it raises a product question:

> **Should the chatbot be allowed to instruct users on how to fetch data manually?**

The chatbot's core function is to serve as the data access layer. If it cannot
retrieve data, telling the user "go to data.worldbank.org and look it up yourself"
undermines the value proposition. On the other hand, this is arguably better than
saying nothing or fabricating data.

> **Recommendation:** This is a product decision that needs discussion. Options:
>
> 1. **Prohibit manual fetch instructions** -- the chatbot should retry, use
>    fallback databases, and if all else fails, clearly state the data could not be
>    retrieved and suggest trying again later.
> 2. **Allow with caveats** -- permit manual fetch instructions only as a last
>    resort after retry/fallback attempts are exhausted, and frame it as a
>    temporary workaround.
> 3. **Keep current behavior** -- allow it freely since it is technically helpful
>    and transparent.

### 3. Judge Misevaluation of User-Provided Data (Claim Tagging)

**Turns affected:** Turn 5

After the chatbot could not retrieve Ghana's national poverty rate, the user
provided it themselves in Turn 5:

> "I have Ghana's national poverty rate now: 24.2% in 2022. Can you help me draft
> that comparison paragraph?"

The chatbot correctly used this value **without** wrapping it in `<claim>` tags
(since it did not come from a Data360 tool call and has no `claim_id`). However,
the LLM judge penalized this:

> *"The Ghana value (24.2%) is presented without claim tags, despite being a key
> numeric value in the comparison. This omission reduces completeness."*
> -- Claim Tagging score: 0.72

**This is a judge error.** The `<claim>` tag system is specifically for
machine-verifiable provenance of Data360 tool-retrieved values. User-provided data
has no `claim_id` and should not be wrapped in claim tags -- doing so would
actually be worse, as it would imply official source provenance for an unverified
user assertion.

> **Recommendation:** Update the Claim Tagging metric criteria to explicitly state:
> "Values provided by the user (not from tool calls) should NOT have claim tags.
> Only tool-retrieved values require claim tagging. Do not penalize the absence of
> claim tags on user-supplied data."

Additionally, Turn 5 also failed on:
- **Content Structure (0.38):** The chatbot drafted a single paragraph (as the user
  requested), so it naturally lacked `Data:` / `Analysis:` section labels. The judge
  penalized this, but the user explicitly asked for a paragraph, not a structured
  data report.
- **Follow-up Suggestions (0.02):** The drafted paragraph did not include a
  `Suggested follow-ups:` section. Again, the user asked for a specific deliverable
  (a paragraph), and appending follow-up questions would be inappropriate in that
  context.
- **Source Citation (0.12):** No `Sources:` section was included. This is borderline
  -- the chatbot could have appended a citation line, but the user asked for a
  paragraph to paste into an article, not a full chatbot response.

> **Recommendation:** These Turn 5 failures are context-dependent. The judge does
> not account for the fact that the user explicitly requested a specific output
> format (a paragraph). Consider adding eval logic or criteria guidance that
> recognizes when the user requests a specific deliverable, the structural
> requirements (sections, follow-ups, citations) may not all apply.

---

## Metric Results

| Metric | Score | Status | Root Cause |
|---|---|---|---|
| Conversation Completeness | 1.00 | PASS | -- |
| Visualization & API URLs | 1.00 | PASS | -- |
| Data Accuracy | 0.91 | PASS | -- |
| Claim Tagging & PCN | 0.72 | FAIL | Judge penalized missing tags on user-provided data |
| Context Retention | 0.90 | PASS | -- |
| Data Gap Handling | 1.00 | PASS | -- |
| Comparability Warnings | 1.00 | PASS | -- |
| Content Structure | 0.38 | FAIL | User asked for paragraph; judge expected sections |
| Follow-up Suggestions | 0.02 | FAIL | User asked for paragraph; judge expected follow-ups |
| Latest Data Note | 0.91 | PASS | -- |
| Source Citation | 0.12 | FAIL | User asked for paragraph; judge expected Sources |
| Data Formatting | 0.86 | PASS | -- |
| Inline Explanations | 0.92 | PASS | -- |
| Progressive Disclosure | 0.95 | PASS | -- |

---

## Next Steps

1. **API Reliability:** Add retry logic (1-2 retries with backoff) for Data360 API
   timeouts in the chatbot's tool-calling layer. Investigate fallback to alternative
   databases (e.g., `WB_WDI` as fallback for `WB_GS`).

2. **Manual Fetch Instructions:** Decide product policy on whether the chatbot
   should instruct users to manually fetch data from external sites. Document the
   decision and update the system prompt accordingly.

3. **Claim Tagging Criteria:** Update the `Per-Turn Claim Consistency` metric
   criteria in `eval_config.yaml` to clarify that user-provided values should not
   have claim tags.

4. **Context-Dependent Scoring:** Explore whether per-turn metrics should be
   conditionally relaxed when the user explicitly requests a specific output format
   (e.g., "draft me a paragraph") rather than a standard data response. This could
   be a pre-filtering signal similar to `requires: "tool_data"`.
