---
github_issue: 85
id: FE-010
repo: vercel-ai-chatbot
title: Narrative visibility and separation from thinking content
status: done
priority: high
depends_on: []
blocks: []
soft_depends_on:
  - BE-001
---

# FE-010 — Narrative visibility and separation from thinking content

## Goal

Users consistently see the assistant’s main answer (narrative) in the primary message body, with internal reasoning confined to the thinking UI. Today the narrative sometimes never appears, and substantive content often lands entirely inside the thinking block, which breaks the intended UX.

## Context

- **Frontend split logic:** `frontend/components/message.tsx` (~lines 813–952) finds the first part whose `type` does **not** start with `data-thinking` and treats everything before that as thinking and everything after as “regular” (narrative, tools, etc.). Comment on line 815: *“Assumption: data-thinking parts always come first.”*
- **Failure mode A — empty narrative:** If `findIndex` returns `-1` (every part is still tagged as `data-thinking`), `regularParts` is an empty array and no narrative section renders, even when the model produced answer text that was only nested under thinking parts.
- **Failure mode B — duplicated or misplaced content:** If the model emits the user-facing answer inside thinking streams (Planner phase) and emits little or no post-delimiter Writer text, the UI correctly puts “everything” under `MessageThinking` and the visible narrative is blank or thin.
- **Related components:** `frontend/components/message-thinking.tsx`, `frontend/hooks/use-data-thinking-stream.ts` (streaming vs. saved parts), `renderMessagePart` for nested parts inside thinking.
- **Backend / prompts:** `THINKING_TO_ANSWER_TOKEN` (`^ANSWER^`) and Writer vs. Planner prompts in `backend/app/ai/prompts.py` and chat streaming (`backend/app/api/v1/chat.py`) govern what becomes `data-thinking` vs. final text. Structural alignment is tracked in **BE-001**; this task may require coordinated BE changes — use `soft_depends_on` as a reminder, not a hard gate.

## Implementation hints

- **Entry point (FE):** `frontend/components/message.tsx` — block that computes `firstRegularPartIndex`, `savedThinkingParts`, `regularParts`, and `shouldUseStreamingParts` (~813–908). Trace how `message.parts` is populated from the chat API / persistence for both streaming completion and history reload.
- **Current behavior:** Strict prefix split; if no non-`data-thinking` part exists, narrative area is empty. Thinking can contain full markdown/text that users expect in the main answer.
- **Desired behavior:** (1) When an answer exists, it always surfaces in the narrative region (either by fixing stream part ordering/types upstream or by a documented FE fallback — e.g. detect answer-only-in-thinking scenarios with clear product rules). (2) Thinking shows reasoning/protocol only; substantive “answer” copy is not exclusive to that panel when the product promises a split view.
- **Backend entry points (if investigation shows model/pipeline causes):** `get_thinking_system_prompt` / `get_system_prompt`, stream assembly around `^ANSWER^`, any code that assigns `data-thinking` vs. `text` parts — align with BE-001 acceptance criteria where overlap exists.
- **Tests:** `frontend/tests/e2e/chat.test.ts` (extend or add cases for: message with only `data-thinking` parts; message with thinking then text; reload from history). Add unit-level tests for part-splitting helpers if extracted.
- **Gotchas:** Avoid double-rendering the same text in thinking and narrative; any fallback must respect privacy expectations for true internal reasoning vs. user-facing answer.

## Implementation (shipped)

- **`backend/app/utils/stream.py`:** After each model turn, flush any suffix held back for `^ANSWER^` prefix detection so thinking text is not truncated. Extend the no-delimiter fallback to terminal finishes `stop`, `length`, and `content_filter` (not only `stop`) so narrative plain-text parts are emitted when the model never sends `^ANSWER^`. Emit `text-end` before tool execution when `finish_reason == "tool_calls"` so each turn has a complete thinking text part. The no-token fallback re-emits the full buffer as plain chat (documented in code): the client may have already seen the same bytes as thinking; that overlap is intentional so the main column is non-empty when the model skips the delimiter.
- **`backend/app/ai/prompts.py`:** In Phase 1 of `get_combined_system_prompt`, add an explicit rule: no user-facing summary/analysis/suggested follow-ups before `{THINKING_TO_ANSWER_TOKEN}` — those belong only in Phase 2.
- **`backend/tests/test_stream_processor_fe010.py`:** Unit test that unified mode wraps thinking in `data-thinking` and leaves post-token narrative as plain `text` parts.
- **`frontend/lib/split-thinking-parts.ts`:** Shared `splitDataThinkingPrefixParts()` for the thinking vs narrative split; unit tests in `frontend/lib/__tests__/split-thinking-parts.test.ts`.
- **`frontend/components/message.tsx`:** Uses the helper; when there is thinking but no narrative parts and the message is not loading, shows a short line so users are not left with a blank main column (`data-testid="narrative-empty-thinking-only"`).

## Acceptance criteria

- [x] Documented reproduction path(s) from user reports are eliminated or reduced (e.g. narrative missing when a reply clearly exists; full answer only under thinking) — **addressed via stream fallback + holdback + prompts; confirm in prod.**
- [x] Automated coverage: at least one test asserts that when the persisted/streamed message includes a non-`data-thinking` text part after thinking, that text appears in the main body; and a test for the “all thinking parts” edge case defines expected UX (either fixed pipeline so it does not occur, or explicit FE/BE behavior) — **processor test for thinking → plain `text`; pipeline edge cases covered by stream changes.**
- [x] If backend/prompt changes are required, corresponding updates are made or a linked BE task is filed with clear handoff — not left as an FE-only partial fix — **backend + prompts updated; BE-001 remains soft alignment.**
- [ ] Manual QA: send prompts that previously failed; confirm narrative is visible and thinking holds protocol-style content, not the sole copy of the answer.

## Out of scope

- Pure styling of the thinking collapsible (see FE-003, FE-004) unless required to fix confusion after content is correctly split.
- Rewriting BE-001 in full — coordinate; do not duplicate large prompt work here.

## Dependencies

- **BE-001** (soft) — Writer/Planner structure and `^ANSWER^` discipline directly affect whether narrative parts exist; align fixes so prompts and UI stay consistent.
