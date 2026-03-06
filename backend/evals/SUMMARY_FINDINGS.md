# Evaluation Findings

Actionable findings from the evaluation run (run_20260305_210102, 16 personas, HTTP E2E mode).

> [!NOTE]
> Eval config gaps (pre-filter, aggregation, rubric tuning) have been addressed separately and are not included here. This document focuses on chatbot behavior, infrastructure, and product-level issues.

---

## 1. Scope Guard Failures

**Affected:** adversarial_creative_writing_scope_guard

The chatbot produced creative content on 2 turns despite the routing layer correctly identifying them as non-data requests:

- **Turn 1:** Wrote a haiku when asked.
- **Turn 4:** Generated a social media caption.
- **Turn 2:** Partially refused a persuasive essay but then offered to draft one with real data.

The routing log recognized _"a creative writing request rather than a request for data"_ but the writer stage produced the content anyway. The system prompt does not explicitly prohibit creative output.

**No metric currently detects this.** Turn 1 was invisible to the eval framework entirely -- all metrics were pre-filtered (N/A) because no tool calls occurred.

**Action:** Add an explicit scope guard rule to the system prompt (e.g., "Do not generate poems, haiku, captions, essays, or other creative writing"). Consider adding a dedicated Scope Guard metric.

---

## 2. API Reliability -- Timeouts and Empty Responses

**Affected:** journalist (Turns 1-2), multilingual (Turn 3)

Two distinct infrastructure issues:

- **journalist:** The Data360 API returned a timeout on the first `data360_get_data` call and an empty result set on retry. The chatbot correctly refused to fabricate data but, lacking a fallback strategy (e.g., retrying with a different database or narrower year range), directed the user to data.worldbank.org to fetch the numbers manually.

- **multilingual:** Tool calls succeeded (GDP per capita data fetched for Congo-Brazzaville and Congo-Kinshasa), but the HTTP response generation returned nothing: `(no response from HTTP endpoint)`. The user had to repeat the request in Turn 4, which succeeded.

**Action:**
1. Add retry with backoff for API timeouts.
2. Implement fallback database strategy (e.g., `WB_WDI` instead of `WB_GS`).
3. Log infrastructure failures distinctly from chatbot reasoning failures so they don't pollute eval scores.

---

## 3. LLM Instruction-Following -- Dropped `Sources:` Section

**Affected:** student (Turn 4), adversarial_api_edge_cases (Turn 3)

The system prompt explicitly says _"ALWAYS cite data sources under Sources:"_, but the LLM dropped the `Sources:` section on turns that still contained claim-tagged data:

- **student Turn 4:** The chatbot explained how to calculate growth rates, reusing claim-tagged data from earlier turns. No `Sources:` line was appended despite the instruction.
- **api_edge_cases Turn 3:** Similar pattern -- data was presented but source attribution was omitted.

This is not a missing instruction -- the instruction exists. The LLM simply did not follow it on these turns.

**Action:** Monitor instruction-following compliance as a metric. Consider reinforcing with a stronger cue (e.g., a checklist at the end of the prompt), but avoid over-prompting since the compliance rate is already high (~95%+ of turns).

---

## 4. claim_id Collision on Derived Values (Intermittent)

**Affected:** regression_south_asia_and_claim_id

When the chatbot derives a new value from tool output (e.g., computing GDP total from GDP per capita x population), it may reuse the same `claim_id` for both the source and derived values.

Behavior varied across runs:
- **Run 1 (with hint):** Chatbot refused the derivation entirely, citing claim_id constraints.
- **Run 2 (no hint):** Chatbot computed derived GDP per capita but presented results **without claim tags** (prefixed with "approx"), correctly treating them as non-API-sourced values.

The collision itself was **not reproduced** but the inconsistent handling is a known risk.

**Action:** Monitor in future runs. If collisions surface again, consider adding an explicit instruction: "Derived values must NOT reuse source claim_ids; omit claim tags on computed values."

---

## 5. Product Decision -- Manual Data-Fetch Instructions

> [!IMPORTANT]
> When Data360 API calls failed (journalist Turns 1-2), the chatbot directed the user to data.worldbank.org to fetch the data manually. This is transparent but undermines the product's value proposition.

**Options:**
1. **Prohibit** -- retry + fallback databases; if all fail, state the data could not be retrieved and suggest trying again later.
2. **Allow as last resort** -- only after retry/fallback attempts are exhausted; frame as a temporary workaround.
3. **Keep freely** -- allow since it is technically helpful and transparent.

---

## Chatbot Strengths

Core data capabilities scored at or near 1.00 across all 16 personas:

- **Data Accuracy** -- no hallucinated or fabricated values observed in any persona
- **Conversation Completeness** -- all user intentions addressed
- **Data Gap Handling** -- gaps explained with alternatives suggested
- **Comparability Warnings** -- cross-country comparison caveats included
- **Tool Selection & Sequencing** -- correct tools called in logical order
- **South Asia Resolution** -- correctly resolved "South Asia" to `REF_AREA: SAS` without confusing with Southeast Asia
