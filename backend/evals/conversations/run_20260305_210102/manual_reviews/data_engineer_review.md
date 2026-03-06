# Data Engineer Persona -- Manual Review

**Run ID:** 20260305_210102
**Reviewer:** Antigravity (AI-assisted)
**Date:** 2026-03-06

---

## Summary

The data engineer persona simulates a technical user (Kofi, 28, health NGO) who
requests API URLs, Python code snippets, and direct download links for life expectancy
data. The chatbot excelled at providing accurate technical responses with proper
claim tagging and context retention. The only failure was Source Citation, which
scored 0.00 because code-focused responses omitted a formal `Sources:` section.

---

## Findings

### 1. Source Citation Failure on Code-Focused Responses

**Turns affected:** Turn 2, Turn 5

**Turn 2:** The user asked for a Python snippet to fetch life expectancy data for
individual Sub-Saharan African countries. The chatbot provided a correct, well-
structured snippet with proper country codes and API parameters. The judge scored
Source Citation 0.00:

> *"The response provides a detailed Python snippet with data but does not include a
> 'Sources:' section as required by the evaluation steps, resulting in no citation
> present."*

**Turn 5:** The user asked for a Python snippet to load JSON into a pandas DataFrame.
Again, the chatbot provided correct code but omitted Sources. Score: 0.20:

> *"The response provides a complete Python snippet with data loading and processing
> but does not include a 'Sources:' section as required by the rubric."*

**This is a mixed finding.** The chatbot could reasonably include a brief `Sources:`
line even in code-focused responses (e.g., "Sources: World Bank WDI - Life expectancy
at birth, total (years)"). However, the judge is applying the same structural
expectations to a code snippet as it would to a data presentation, which is somewhat
rigid.

> **Recommendation:** Two options:
> 1. **Chatbot behavior:** Update the system prompt or few-shot examples to always
>    append a brief `Sources:` line even in code/API responses, since the data origin
>    is still relevant.
> 2. **Eval criteria:** Add guidance to the Source Citation metric that code/API
>    responses embedding the data source in the URL or code comments should receive
>    partial credit rather than 0.

### 2. Strong Technical Response Quality

**Turns affected:** All turns

The chatbot consistently provided accurate API URLs, well-structured Python code,
and correct indicator/country codes. Visualization & API URLs scored 0.99, Data
Accuracy scored 1.00, and Claim Tagging scored 0.95. The data engineer persona
validated the chatbot's ability to serve highly technical users effectively.

> **Recommendation:** No action needed. This demonstrates strong technical output.

---

## Metric Results

| Metric | Score | Status | Root Cause |
|---|---|---|---|
| Conversation Completeness | 1.00 | PASS | -- |
| Visualization & API URLs | 0.99 | PASS | -- |
| Data Accuracy | 1.00 | PASS | -- |
| Claim Tagging & PCN | 0.95 | PASS | -- |
| Context Retention | 0.90 | PASS | -- |
| Data Gap Handling | 1.00 | PASS | -- |
| Comparability Warnings | 1.00 | PASS | -- |
| Content Structure | 0.67 | PASS | Code snippets lack section labels |
| Follow-up Suggestions | 0.92 | PASS | -- |
| Latest Data Note | 0.68 | PASS | Code doesn't specify year explicitly |
| Source Citation | 0.00 | FAIL | Code responses omitted Sources section |
| Data Formatting | 0.92 | PASS | -- |
| Inline Explanations | 0.91 | PASS | -- |
| Progressive Disclosure | 0.96 | PASS | -- |

---

## Next Steps

1. **Source Citation in code responses:** Decide whether the chatbot should always
   append `Sources:` even in code-focused replies, or whether the eval criteria
   should grant partial credit when the source is embedded in the API URL or code
   comments.

2. **Content Structure for technical users:** The data engineer persona naturally
   elicits code-heavy responses that lack traditional section labels. Consider
   whether Content Structure criteria should be adapted for technical response types,
   or if the chatbot should wrap code in light structural scaffolding.
