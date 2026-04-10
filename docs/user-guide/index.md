# User guide

This guide is written for **people using the chat** day to day. It focuses on **Data360 Chat** — the World Bank deployment that connects to **Data360** through MCP. The same app can target other data backends when your administrator configures a different MCP server.

---

## Who this is for

| You want to… | Start here |
|--------------|------------|
| Sign in and send your first question | [Getting started](getting-started.md) |
| Understand streaming, stop, regenerate, votes, follow-ups | [Chat features](chat-features.md) |
| Ask about indicators, charts, and trust labels on numbers | [Data analysis](data-analysis.md) |
| Use the side panel for text, code, sheets, or charts | [Documents & spreadsheets](documents-spreadsheets.md) |
| Attach an image (or other allowed file) | [File attachments](file-attachments.md) |
| Control who can see a conversation | [Chat visibility](chat-visibility.md) |
| Fix common problems | [FAQ](faq.md) |

---

## What you can expect from Data360 Chat

1. **Natural language** — Ask in plain English (or your supported language); you do not need indicator codes.
2. **Grounded data** — For many answers, the assistant calls **Data360 tools** (search, metadata, time series, chart specs). You may see short **thinking** or **tool** steps while that runs.
3. **Trust cues** — **Proof-Carrying Numbers (PCN)** mark whether a numeric value in the reply lines up with a tool result. See [Data analysis](data-analysis.md#proof-carrying-numbers-pcn).
4. **Artifacts** — Long-form outputs can open in a **side panel** (documents, code, tables, charts).
5. **Your organization’s rules** — Sign-in options, sharing, uploads, and models depend on **how your deployment is configured**.

---

## Related documentation

- **Operators and developers** — Architecture, deployment, and env vars live under other sections of this site (see the top navigation).
- **Repository** — [README](https://github.com/worldbank/data-ai-chatbot) on GitHub for clone-and-run instructions.
