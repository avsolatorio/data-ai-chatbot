# STUDENT_EDUCATION_ACCESS_SOUTH_ASIA_ADVERSARIAL_DISAMBIGUATION — Manual Review

**Run ID:** 20260316_001358 (re-run, 3 runs: r1, r2, r3)
**Reviewer:** Antigravity
**Date:** 2026-03-16

---

## Summary

Student persona (Lina, 21yo undergraduate) exploring education access in Bangladesh with
adversarial disambiguation — asking about a place name ("Chittagong") across 10 turns.
The overnight regression run hit infra errors; this re-run ran cleanly. Source Citation
was the only failure, scoring 0.00 (min across 5 evaluated turns). The chatbot handled
the disambiguation correctly (scope guard engaged), correctly redirected to national
data, and provided good data quality on all other metrics.

---

## Findings

### 1. Source Citation — Hardest Miss in the Suite (Score 0.00)

**Turns affected:** Turns 3 and 4

Turn 3 explains why subnational data for Chittagong is unavailable and provides
alternative data sources (BANBEIS, DHS, MICS). No `Sources:` section is included.
Turn 4 presents national enrollment data but also omits `Sources:`.
Turn 5 finally includes a `Sources:` section (scoring high there), but the judge uses
min aggregation — Turn 3 or 4 scoring 0.00 pulls the overall to 0.00.

> Judge (Turn 3): "The response provides detailed information and suggestions but does
> not include a 'Sources:' section or any citations, which is required by the rubric
> for any score above 3." — Score: 0.00
>
> Judge (Turn 4): "The response presents data and analysis but does not include a
> 'Sources:' section, which is required by the rubric to award any points for citation
> completeness or format." — Score: 0.00

**Root cause:** The writer reliably includes `Sources:` when it has clean data to
present (Turn 5), but drops it on turns that are primarily explaining a data gap or
offering alternatives. This is the most severe manifestation of the F1 bug because
the chatbot makes multiple tool calls (searching for indicators, finding codelist values)
but then writes a guidance response without citing what it searched.

The pattern: **tool calls are made but the response style is advisory rather than
data-presenting → Sources: is omitted**.

> **Recommendation:** Writer prompt fix — require `Sources:` whenever any tool call was
> made in a turn, regardless of whether numeric data is in the response. The citation
> in this case would reference the Data360 tool and its result (e.g., "Data360:
> searched school enrollment indicators for Bangladesh — no subnational breakdown
> available").

### 2. Data Formatting — Marginal Pass (0.57)

**Turns affected:** Turns 4 and 5

The chatbot presents multiple ratio values in bullet lists instead of markdown tables
when there are 3+ values. The judge noted this is suboptimal but still above the 0.4
threshold. This is a recurring stylistic issue across several personas.

> Judge (Turn 4): "The response includes units (%) for enrollment rates... However,
> it presents multiple values in a bulleted list rather than a markdown table, despite
> having more than three values."

> **Recommendation:** Low priority. Add a formatting reminder in the writer prompt:
> "When presenting 3 or more numerical values of the same indicator across countries
> or years, use a markdown table."

---

## Metric Results

| Metric | Score | Status | Root Cause |
|---|---|---|---|
| Source Citation | 0.00 | FAIL | Missing `Sources:` on Turns 3–4 (advisory/gap-explanation turns) |
| Data Formatting | 0.57 | PASS (marginal) | Bullet lists instead of tables for 3+ values |
| All others | 0.90–1.00 | PASS | — |

---

## Next Steps

1. **[P1] Writer prompt fix:** Enforce `Sources:` on any turn that includes tool calls,
   including advisory turns explaining data gaps.
2. **[P3] Formatting reminder:** Add table preference rule for 3+ numeric values.
