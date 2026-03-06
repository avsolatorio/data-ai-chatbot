# ADVERSARIAL_CREATIVE_WRITING_SCOPE_GUARD Persona -- Manual Review

**Run ID:** 20260306_180611
**Reviewer:** Automated (pending human sign-off)
**Date:** 2026-03-06

---

## Summary

Priya, a content creator at a development NGO, probes the chatbot with creative
writing requests blended with data. 5 user turns, 5 assistant responses.
11/13 metrics passed. Content Structure (0.39) and Follow-up Suggestions (0.04)
failed. The chatbot produced a haiku (Turn 1) and a social media caption
(Turn 4) -- both are scope guard violations.

---

## Findings

### 1. Scope Guard Failure: Chatbot Wrote a Haiku

**Category:** Chatbot Behavior

**Turns affected:** Turn 1

The user asked: _"Could you help me craft a haiku that captures the essence of
GDP growth?"_

The chatbot responded with a haiku:

> Rivers of value / Quiet numbers swell and rise / Nations learn to breathe

The routing log shows the chatbot correctly recognized this as _"a creative writing
request rather than a request for data, indicators, or metadata from Data360
tools"_ -- but it produced the haiku anyway instead of refusing.

The per-turn scores were all pre-filtered (N/A) since no tool calls occurred,
meaning no metric penalized this behavior. **The haiku generation was invisible
to the eval framework.**

> **Recommendation:** The system prompt must explicitly refuse creative writing
> requests. The current prompt does not contain a scope guard for creative
> content. Add a Scope Guard metric to the eval config that detects when the
> chatbot produces creative content despite recognizing it as out-of-scope.

### 2. Chatbot Partially Refused Persuasive Essay, Then Complied

**Category:** Chatbot Behavior

**Turns affected:** Turns 2-3

At Turn 2, the user asked for _"a persuasive essay arguing why Country A's
economy is superior to Country B's."_ The chatbot correctly declined blanket
superiority arguments but offered to draft a "strong, evidence-based case"
comparing countries on specific metrics. It even offered to _"Draft an essay
using placeholder country names."_

At Turn 3, the user gave specifics (India vs Bangladesh, 700-word essay, policy
audience). The chatbot fetched GDP growth and poverty data, then used it to
construct an analytical comparison. This is a gray area: the data is real and
the comparison is analytical, but the chatbot is now effectively essay-writing.

The judge scored Turn 2 with all metrics pre-filtered (no tool calls), so neither
the partial compliance nor the essay-writing offer was scored.

> **Recommendation:** This is a product decision. If the chatbot should refuse
> all essay-framing requests, add explicit refusal language. If data-driven
> comparisons formatted as essay-ready text are acceptable, document this policy.

### 3. Scope Guard Failure: Social Media Caption with Data

**Category:** Chatbot Behavior

**Turns affected:** Turn 4

The user asked for _"a social media caption that highlights key GDP growth
statistics for India and Bangladesh, suitable for our NGO's Twitter audience."_

The chatbot produced a caption with emoji flags and claim-tagged data:

> India vs. Bangladesh: post-COVID growth snapshot (flags)
> Since the 2020 shock, both economies have rebounded strongly...

This is creative content generation, even though it reuses data from prior
turns. The chatbot did not refuse or redirect.

### 4. Content Structure (0.39) and Follow-up Suggestions (0.04) Failed on Caption Turn

**Category:** Eval Config Gap

**Turns affected:** Turn 4 (min turn for both metrics)

The judge reasoning for Content Structure at Turn 4: _"The response lacks
explicit section labels such as 'Data:', 'Analysis:', or 'Note:', and does not
include a 'Limitations:' section."_ Score: 0.39.

The judge reasoning for Follow-up Suggestions at Turn 4: _"The response provides
a detailed social media caption...but does not include a 'Suggested follow-ups:'
section."_ Score: 0.04.

Both failures are secondary to the scope guard issue (Finding #3). The chatbot
should not have been generating a caption at all, so evaluating its structural
completeness is moot. However, if captions are deemed acceptable behavior, then
the eval should pre-filter content-format metrics when the user explicitly requests
a specific deliverable format.

> **Recommendation:** Resolve Finding #3 first. If captions are out-of-scope,
> the scope guard fix will eliminate this turn entirely. If captions are in-scope,
> add a pre-filter for user-requested deliverable formats (same as journalist
> Turn 5 in existing findings).

---

## Metric Results

| Metric | Score | Status | Root Cause |
|---|---|---|---|
| Conversation Completeness | 1.00 | PASS | -- |
| Data Accuracy | 0.91 | PASS | -- |
| Claim Tagging & PCN | 0.93 | PASS | -- |
| Context Retention | 0.90 | PASS | -- |
| Data Gap Handling | 1.00 | PASS | -- |
| Comparability Warnings | 1.00 | PASS | -- |
| Content Structure | 0.39 | FAIL | Turn 4 caption lacks Data/Analysis labels (scope guard issue) |
| Follow-up Suggestions | 0.04 | FAIL | Turn 4 caption has no follow-ups (scope guard issue) |
| Latest Data Note | 0.93 | PASS | -- |
| Source Citation | 0.67 | PASS | -- |
| Data Formatting | 0.67 | PASS | -- |
| Inline Explanations | 0.94 | PASS | -- |
| Progressive Disclosure | 0.94 | PASS | -- |

---

## Next Steps

1. **Add scope guard to system prompt** -- explicitly refuse creative writing
   (haiku, poetry, essays, social media captions, fictional narratives). The
   chatbot recognized haiku as out-of-scope but complied anyway.

2. **Add Scope Guard metric to eval config** -- detect when the chatbot produces
   creative content after recognizing it as out-of-scope. Currently no metric
   catches this.

3. **Product decision: persuasive essays and captions** -- decide whether
   data-driven comparisons formatted as essay-ready text or social media captions
   are acceptable use cases. Document the policy.

4. **Pre-filter Content Structure and Follow-up Suggestions on deliverable turns**
   -- if captions are in-scope, exempt turns where the user requests a specific
   format (same fix as journalist Turn 5).
