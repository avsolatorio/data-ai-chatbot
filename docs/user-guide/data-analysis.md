# Data analysis (Data360)

On **Data360 Chat**, the assistant can use **Data360 MCP tools** to search indicators, read metadata, pull time series, work with codelists and disaggregations, and build **chart specifications** (often rendered as **Vega / Vega-Lite**). This page describes what to expect and how to read **Proof-Carrying Numbers (PCN)**.

---

## What the assistant can do (typical tools)

Depending on your server configuration, tool names and coverage may vary. Common capabilities include:

| Capability | Example user intent |
|------------|---------------------|
| **Search indicators** | “Find indicators about rural water in East Africa.” |
| **Metadata** | “What does this indicator code mean? Who publishes it?” |
| **Time series** | “GDP per capita for Colombia, annual, last 20 years.” |
| **Disaggregation / codelists** | “Break this down by gender” or “map this country code.” |
| **Chart specs** | “Line chart comparing three countries for one indicator.” |

The model chooses whether to call tools. **Clear, data-oriented questions** get better tool use than purely general knowledge prompts.

---

## Suggested question patterns

- **Discovery** — “List indicators related to [topic] for [region or country].”
- **Definition** — “Define indicator [code or name] and name the source.”
- **Comparison** — “Compare [indicator] for [country A] and [country B] from [year] to [year].”
- **Visualization** — “Show a bar chart of …” or “Plot … over time.”
- **Follow-up** — “Narrow that to urban only” or “Use constant US dollars if available.”

---

## How a data turn usually flows

1. You ask in natural language.
2. The assistant may emit short **reasoning** or **tool** segments (search → fetch → chart).
3. **Numbers and tables** from tools appear in the reply.
4. **Charts** may appear **inline** in the chat and/or in the **artifact panel** for larger specs.
5. You can ask **follow-ups** to refine geography, years, or chart type.

---

## Charts (Vega / Vega-Lite)

- Charts are **interactive** in many browsers (hover, zoom—depends on spec).
- If a chart fails to render, try **refreshing** the page once; persistent failures may mean a spec error or blocked resource—report to your admin with the chat link if allowed.

---

## Proof-Carrying Numbers (PCN)

**PCN** adds **verification badges** next to numeric values in the assistant’s message when the UI supports it.

| Badge / state | Meaning (typical) |
|---------------|-------------------|
| **Verified** (or similar) | The value is **grounded** in a tool result you can trace (e.g. same number came back from a data call). |
| **Unverified** | The model **stated** the number **without** a matching tool trace for that value—treat with extra care. |

!!! warning "PCN is not legal or audit sign-off"

    PCN helps you **see provenance at a glance**. It does not replace **your** judgment, **methodology** review, or **official** statistics workflows.

### Tips when reading numbers

- Prefer **verified** figures when making decisions or slides.
- Ask: “**Which tool result** is this number from?” if something looks surprising.
- For **rates of change** or **derived** metrics, confirm definitions with **metadata** questions.

---

## When the assistant does not use data tools

Possible reasons:

- The question read as **general knowledge** (no data need).
- **MCP** or Data360 is **unavailable** (timeout, maintenance).
- The deployment **restricts** tools for certain users or routes.

**Try:** Rephrase with explicit data intent: “Search Data360 for …”, “Plot from official series …”, or name a **country and indicator family**.

---

## See also

- [Chat features](chat-features.md) — Streaming, stop, tool display  
- [Documents & spreadsheets](documents-spreadsheets.md) — Chart artifacts in the panel  
- [FAQ](faq.md) — Charts not loading, slow queries  
