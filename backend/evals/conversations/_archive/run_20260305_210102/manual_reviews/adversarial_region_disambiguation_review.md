# ADVERSARIAL_REGION_DISAMBIGUATION Persona -- Manual Review

**Run ID:** 20260306_181001
**Reviewer:** Automated (pending human sign-off)
**Date:** 2026-03-06

---

## Summary

Anil, a senior ADB researcher, uses ambiguous geographic terms. 5 user turns,
5 assistant responses. All 13 metrics passed (100%). The chatbot correctly
disambiguated "Congo" to Congo, Dem. Rep. (COD) in Turn 1 and handled all
subsequent queries accurately.

---

## Findings

### 1. Correct Congo Disambiguation

**Category:** Chatbot Behavior (positive)

**Turns affected:** Turn 1

The user asked: _"Hey, I'm looking for the latest development indicators for
Congo."_

The chatbot resolved "Congo" by querying `data360_find_codelist_value` with
`query: "Congo, Democratic Republic of the Congo, Republic of the Congo"` and
received back `COD` (Congo, Dem. Rep.) with a score of 90. It then used COD for
all subsequent queries.

The chatbot did **not** explicitly ask the user which Congo they meant -- it
defaulted to COD (the larger, more commonly referenced DRC). This is arguably
correct behavior for most users, but the persona was designed to test whether
the chatbot would ask for clarification.

> **Recommendation:** This is acceptable behavior. The chatbot should ideally
> note the ambiguity ("I'm assuming you mean Congo, Dem. Rep. rather than
> Republic of Congo; let me know if you meant the other one"), but defaulting
> to DRC is defensible.

### 2. Broad Development Snapshot with 20 Tool Calls

**Category:** Chatbot Behavior (positive)

**Turns affected:** Turn 2

The user requested _"a broad development snapshot for Congo, Dem. Rep."_ The
chatbot made 20 tool calls to search for and fetch GDP, population, life
expectancy, under-5 mortality, school enrollment, access to electricity,
poverty headcount, and HDI data. It produced a comprehensive snapshot with
proper claim tags, source citations, and analysis. All metrics scored 0.90+.

### 3. Chart Generation and Data Tables

**Category:** Chatbot Behavior (positive)

**Turns affected:** Turns 3-5

The chatbot generated 10-year trend charts, combined multi-indicator views,
and a detailed data table with yearly values from 2014-2023. It correctly
noted data gaps (e.g., missing 2023 GDP per capita and life expectancy) and
explained the reasons.

### 4. Data Formatting Scored Low (0.67) But Passed

**Category:** Observation

**Turns affected:** Turns 2, 4 (min turns)

The judge scored Data Formatting at 0.67 because the chatbot used bullet lists
instead of markdown tables when presenting 3+ values. The judge reason: _"Despite
having more than three values, the data is presented in a bulleted list rather
than a markdown table."_ This is consistent across multiple personas and is a
known pattern.

---

## Metric Results

| Metric | Score | Status | Root Cause |
|---|---|---|---|
| Conversation Completeness | 1.00 | PASS | -- |
| Data Accuracy | 0.90 | PASS | -- |
| Claim Tagging & PCN | 0.90 | PASS | -- |
| Context Retention | 0.90 | PASS | -- |
| Data Gap Handling | 1.00 | PASS | -- |
| Comparability Warnings | 1.00 | PASS | -- |
| Content Structure | 0.90 | PASS | -- |
| Follow-up Suggestions | 0.90 | PASS | -- |
| Latest Data Note | 0.99 | PASS | -- |
| Source Citation | 0.92 | PASS | -- |
| Data Formatting | 0.67 | PASS | Bullet lists used instead of tables for 3+ values |
| Inline Explanations | 0.90 | PASS | -- |
| Progressive Disclosure | 0.94 | PASS | -- |

---

## Next Steps

1. **No action required** -- all metrics passed, disambiguation worked correctly.
2. **Consider adding an explicit disambiguation note** in the system prompt to
   always acknowledge geographic ambiguity when it exists (e.g., "I'm assuming
   Congo, Dem. Rep.; let me know if you meant Republic of Congo").
3. **Data Formatting** -- the 0.67 score is consistent across personas. If bullet
   lists are acceptable for initial snapshots, consider adjusting the rubric
   threshold or adding guidance on when tables vs bullets are appropriate.
