# ADVERSARIAL_API_EDGE_CASES Persona -- Manual Review

**Run ID:** 20260306_181650
**Reviewer:** Automated (pending human sign-off)
**Date:** 2026-03-06

---

## Summary

Tomoko, a World Bank data quality analyst, tests API edge cases with targeted
queries. 4 user turns, 4 assistant responses. 12/13 metrics passed. Source
Citation failed at 0.05 due to a missing `Sources:` section on Turn 2 despite
data and claim tags being present.

---

## Findings

### 1. Source Citation Failure: Missing Sources Section on Data Turn

**Category:** Chatbot Behavior

**Turns affected:** Turn 2

The user asked: _"Can you help me compare the GDP per capita data for San Marino
from the WB_HNP database versus the WB_ECON database to identify any
discrepancies?"_

The chatbot made 6 tool calls, correctly identified that GDP per capita for
San Marino exists only in WB_GS (not WB_HNP or WB_ECON), and provided data
with claim tags (3 values: 54,982.5, 45,321.5, 47,287.4). However, the
response included a `Suggested follow-ups:` section but **no `Sources:` section**.

The judge reasoning: _"The response provides detailed data and analysis but does
not include a 'Sources:' section as required by the evaluation steps."_ Score: 0.05.

This is a legitimate chatbot behavior issue. The system prompt says: _"ALWAYS cite
data sources under Sources:"_ The chatbot provided data with claim tags from
WB_GS but did not include the sources section. The `min` aggregation then dragged
the conversation score to 0.05 despite all other turns scoring 0.79-0.97.

> **Recommendation:** This is a real instruction-following failure, same pattern
> as student Turn 4 in the existing SUMMARY.md. The chatbot knows to cite sources
> but occasionally drops the section. Monitor frequency and consider adding a
> fail-safe check in the writer prompt.

### 2. Cross-Database Comparison Handled Correctly

**Category:** Chatbot Behavior (positive)

**Turns affected:** Turn 2

The chatbot correctly tested WB_HNP, WB_ECON, and WB_GS databases for GDP per
capita data for San Marino. It discovered:
- WB_HNP: indicator exists but no data for San Marino
- WB_ECON: indicator ID is invalid (not a real database in Data360)
- WB_GS: data available (2019-2021)

It reported these findings clearly, explaining that the user should treat "no
metadata" as "indicator not available in this database." This is exactly the
edge case behavior the persona was designed to test.

### 3. PPP vs Current US$ Comparison

**Category:** Chatbot Behavior (positive)

**Turns affected:** Turn 3

The chatbot compared GDP per capita for San Marino between WB_GS (current US$)
and WB_SSGD (PPP, constant 2017 international $). It correctly surfaced the
methodological differences and explained why the values differ. Sources were
cited properly on this turn (0.97).

### 4. Data Accuracy 1.00 Across All Turns

**Category:** Chatbot Behavior (positive)

All 4 turns scored 1.00 on Data Accuracy. The chatbot did not fabricate any
values, correctly reported data gaps, and maintained consistent claim_ids.

---

## Metric Results

| Metric | Score | Status | Root Cause |
|---|---|---|---|
| Conversation Completeness | 1.00 | PASS | -- |
| Data Accuracy | 1.00 | PASS | -- |
| Claim Tagging & PCN | 0.98 | PASS | -- |
| Context Retention | 0.96 | PASS | -- |
| Data Gap Handling | 1.00 | PASS | -- |
| Comparability Warnings | 1.00 | PASS | -- |
| Content Structure | 0.90 | PASS | -- |
| Follow-up Suggestions | 0.91 | PASS | -- |
| Latest Data Note | 0.91 | PASS | -- |
| Source Citation | 0.05 | FAIL | Turn 2: data present with claim tags, no Sources: section |
| Data Formatting | 0.90 | PASS | -- |
| Inline Explanations | 0.93 | PASS | -- |
| Progressive Disclosure | 0.91 | PASS | -- |

---

## Next Steps

1. **Track Source Citation instruction-following** -- this is the same pattern as
   student Turn 4. The chatbot drops `Sources:` despite explicit prompt
   instructions. Consider adding a fail-safe reminder in the writer stage or
   implementing a post-generation check.

2. **The cross-database comparison behavior is strong** -- the chatbot correctly
   identifies which databases have data and which don't, which is exactly what
   a data quality analyst needs.
