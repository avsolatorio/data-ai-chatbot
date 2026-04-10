# Documents, code, spreadsheets, and charts (artifact panel)

The **artifact panel** (side panel) shows structured work the assistant produces **alongside** the main chat. It updates as the model edits content so you can **read, copy, or tweak** without losing the conversation thread.

---

## What can appear in the panel

| Type | Typical use |
|------|-------------|
| **Text / document** | Drafts, summaries, memos, long explanations with rich formatting |
| **Code** | Scripts, SQL snippets, small utilities—often with **syntax highlighting** |
| **Spreadsheet** | Tables of numbers or categories you can scan and copy |
| **Chart** | **Vega / Vega-Lite** visualizations that may be larger or more interactive than inline chat charts |

Not every reply opens the panel—only when the assistant creates or updates an **artifact** for that turn.

---

## Opening and resizing

- The panel may **open automatically** when an artifact is created.
- Use the layout controls your UI provides to **widen**, **narrow**, or **hide** the panel so you can focus on chat or on the document.
- On small screens, the panel may **stack** or **overlay**; use your device’s usual gestures to scroll.

---

## Creating content

You do not usually “create a blank document” first. Instead, **ask in chat**, for example:

- “Draft a one-page summary of the indicators we just discussed for my team.”
- “Put this series into a small table with columns Year and Value.”
- “Write a Python snippet that reads the CSV shape I described.”
- “Save this chart as a Vega-Lite spec in the panel.”

The assistant **streams** updates into the artifact as it works.

---

## Editing and iterating

Refine by **follow-up messages** in the chat:

- “Add a paragraph on data limitations.”
- “Change the chart to a stacked bar.”
- “Fix the column headers to match ISO country codes.”

The panel should **reflect the latest version** after each update.

---

## Copying and reuse

- Select text or code and **copy** with your browser or OS shortcut.
- For **tables**, you may copy tab-separated values depending on the widget.
- **Charts** may support export or open-in-new-tab depending on deployment—if unsure, take a **screenshot** for slides (check your org’s data policy).

---

## Relationship to chat messages

- The **chat** remains the **record of the dialogue** (questions, reasoning, tool summaries).
- The **panel** holds the **deliverable** (doc, code, sheet, chart spec).
- **PCN badges** apply to numbers **in chat**; artifact numbers are still subject to the same **data hygiene**—confirm critical figures against tool output when needed.

---

## See also

- [Data analysis](data-analysis.md) — Indicators, charts, PCN  
- [Chat features](chat-features.md) — Streaming and side-by-side layout  
- [File attachments](file-attachments.md) — Bringing your own files into the thread  
