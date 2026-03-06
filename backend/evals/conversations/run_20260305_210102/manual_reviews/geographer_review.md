# Geographer Persona -- Manual Review

**Run ID:** 20260305_210102
**Reviewer:** Automated (pending human sign-off)
**Date:** 2026-03-05

---

## Summary

Dr. Okonkwo is a geography professor requesting urban/rural population data for
Nigeria, Ghana, and South Africa. The conversation spanned 4 turns covering data
retrieval, cross-country comparison, trend visualization, and API URL access. The
chatbot scored 13/14 metrics passing, with a single failure in Claim Tagging (0.26)
that is attributable to a judge error and an eval config gap, not a chatbot defect.

---

## Findings

### 1. Claim Tagging Penalized on API URL Response With No Numeric Data

**Category:** Judge Error / Eval Config Gap

**Turns affected:** Turn 4

**Per-turn Claim Tagging scores:**
- Turn 1: 1.00 -- all values (`86,148,256` and `128,043,517`) correctly tagged
- Turn 2: 1.00 -- all 6 values correctly tagged, claim_ids reused from Turn 1
- Turn 3: N/A -- pre-filtered (chart-only response)
- **Turn 4: 0.26** -- this turn dragged the overall score to 0.26 via `min`

**What the user asked:**

> "Please provide the direct API URLs where I can download the raw urban and rural
> population data for Nigeria, Ghana, and South Africa from 2000 to 2024."

**What the chatbot did:**

The chatbot called `data360_get_data_api_url` twice (one for rural, one for urban)
and returned two valid Data360 API URLs, along with example Python code and
metadata. **No numeric population values were presented inline.** The response
contained only URLs, code, and descriptive text.

**What the judge scored and why:**

> "The response provides API URLs and metadata but does not include any numeric
> population values wrapped in `<claim>` tags with claim_id and policy attributes
> as required. No claim_ids are referenced or reused from prior turns, failing the
> key evaluation steps for tagging and claim verification."

Score: 0.26

**Why this is incorrect:**

The `<claim>` tag system exists to wrap inline numeric values with their provenance.
When a response contains no numeric values (only URLs and code), there is nothing
to tag. The pre-filter correctly marked Turn 3 (charts) as N/A, but failed to do
the same for Turn 4 (API URLs). The root cause is that `requires: "tool_data"`
triggers on any turn where a Data360 tool was called, but `data360_get_data_api_url`
returns a URL string -- not observation data with `claim_id` fields.

> **Recommendation:** Refine the pre-filtering logic for the Claim Tagging metric.
> It should check whether the tool output actually contains `claim_id` fields, not
> just whether any Data360 tool was called. Turns where tools return only
> URLs/metadata (no `claim_id` in output) should be excluded.

### 2. Inconsistent Table vs. Bullet Point Formatting

**Category:** Chatbot Behavior

**Turns affected:** Turn 1

Turn 1 presented two population values (urban and rural) as bullet points. Turn 2
presented six values (3 countries x 2 indicators) in a markdown table. The judge
noted this inconsistency:

> "Despite having multiple values (urban and rural populations), the data is
> presented as bullet points rather than in a markdown table, which is a formatting
> shortcoming given the rubric."

Data Formatting scored 0.67 on Turn 1 vs. 1.00 on Turn 2. Since `min` is used,
the overall Data Formatting score was dragged to 0.67 (still passing, threshold
is 0.4).

> **Recommendation:** Low priority. Consider adding a system prompt hint: "When
> presenting 2 or more structured data values, prefer markdown tables." This is a
> minor formatting preference, not a functional issue.

---

## Metric Results

| Metric | Score | Status | Root Cause |
|---|---|---|---|
| Conversation Completeness | 1.00 | PASS | -- |
| Visualization & API URLs | 1.00 | PASS | -- |
| Data Accuracy | 0.99 | PASS | -- |
| Claim Tagging & PCN | 0.26 | FAIL | Judge expected tags on API URL turn with no numeric data (Turn 4) |
| Context Retention | 0.90 | PASS | -- |
| Data Gap Handling | 1.00 | PASS | -- |
| Comparability Warnings | 1.00 | PASS | -- |
| Content Structure | 0.90 | PASS | -- |
| Follow-up Suggestions | 0.91 | PASS | -- |
| Latest Data Note | 1.00 | PASS | -- |
| Source Citation | 0.93 | PASS | -- |
| Data Formatting | 0.67 | PASS | Bullet points instead of table in Turn 1 |
| Inline Explanations | 0.90 | PASS | -- |
| Progressive Disclosure | 0.92 | PASS | -- |

---

## Next Steps

1. **Refine Claim Tagging pre-filter** -- check for `claim_id` in tool output,
   not just presence of any tool call. This is a systemic issue that likely affects
   other API-URL-only turns across personas.

2. **Table formatting hint (low priority)** -- consider a system prompt nudge for
   consistent table usage when 2+ structured values are presented.
