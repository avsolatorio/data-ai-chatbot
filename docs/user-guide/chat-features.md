# Chat features

How the conversation **behaves** while you use Data360 Chat: streaming, tool and thinking display, stopping and retrying, feedback, follow-ups, and optional extras (tokens, math).

---

## Streaming replies

Answers usually **stream** token by token instead of appearing all at once.

- You can **start reading** immediately.
- Long answers may take several seconds; data-heavy turns can take longer because the model may call **tools** first.

---

## Tool use and “thinking”

For questions that need **Data360** (or other MCP tools), the assistant may:

1. **Plan** — Decide which tool to call (search, get data, chart spec, etc.).
2. **Show progress** — You might see **thinking** or **tool** segments (wording depends on deployment and model).
3. **Answer** — Combine tool results into a clear reply, sometimes with **tables** or **charts** inline.

!!! tip "If the answer feels slow"

    Wait for tool steps to finish. If the UI seems stuck, use **Stop** and shorten or narrow your question.

---

## Stop generation

While the assistant is still generating:

1. Click **Stop** (or the equivalent control).
2. The partial reply stays in the thread; you can **edit your last message** or send a new one.

---

## Regenerate

To ask for **another answer** to the same user message:

1. Use **Regenerate** / **Retry** on the assistant message (exact label varies).
2. The new answer may differ; it is not guaranteed to be “more correct”—rephrase if you need different data or constraints.

---

## Resume after refresh (when enabled)

If **resumable streams** are enabled and your connection drops mid-reply:

- **Reload** the page or return to the chat.
- You may be offered **resume** behavior so the stream can continue or recover.

If nothing resumes, send the question again or use **Regenerate** if available.

---

## Voting and feedback

Many deployments show **thumbs up / thumbs down** or a **feedback** control on assistant messages.

- Use them for **quality signals** (helpful, inaccurate, unsafe wording, etc.).
- They do not usually change the answer in real time; they inform **operators** and model tuning.

---

## Follow-up suggestions

Some replies end with **suggestion chips** (short follow-up questions).

- **Click** a chip to drop that text into the input (or send it—behavior depends on configuration).
- They are generated from the assistant’s text; treat them as **hints**, not official Data360 queries.

---

## Math, markdown, and code in replies

Replies often support:

- **GitHub-flavored Markdown** (headings, lists, tables, links).
- **Code blocks** with syntax highlighting.
- **Math** via KaTeX when the model emits it.

Use normal **copy** from your browser to grab code or tables.

---

## Token usage (when shown)

If your UI shows **token** or **usage** information, it reflects **approximate** consumption for that turn or session (definitions depend on your deployment). It is mainly useful for **power users** and **cost awareness**, not for precise billing unless your admin says otherwise.

---

## Model selection

Some setups let you **pick a model** from the header or settings. Options are **fixed by administrators**; if you do not see a selector, the deployment uses configured defaults.

---

## Maintenance mode

If the app shows a **maintenance** page, chat is temporarily unavailable. Try again later or contact your administrator.

---

## See also

- [Data analysis](data-analysis.md) — Charts, indicators, PCN  
- [Documents & spreadsheets](documents-spreadsheets.md) — Side panel artifacts  
- [FAQ](faq.md) — Slow responses, errors
