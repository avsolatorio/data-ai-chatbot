---
hide:
  - toc
---

# Data AI Chatbot

**Data AI Chatbot** is a self-hostable **data chatbot**: you connect it to your APIs and databases through **[MCP](https://modelcontextprotocol.io/)** (Model Context Protocol), chat in plain language, and open charts and documents in a side panel. Optionally, **Proof-Carrying Numbers (PCN)** show which numeric answers came from tool results versus the model alone.

**Data360 Chat** is the **World Bank reference customization**: it ships pre-configured for the **[Data360 MCP Server](https://github.com/worldbank/data360-mcp)** and World Bank development indicators—the setup this documentation describes. Other teams can reuse the same app with a different MCP server via **`MCP_SERVER_URL`**.

> *Maintained by the World Bank **AI for Data — Data for AI** team. On Data360 Chat, live indicators and metadata flow through Data360 MCP; PCN helps readers tell verified statistics from model guesses at a glance.*

<!-- Screenshot: add docs/img/chat-preview.png when an image is available. -->

---

## What you can do

!!! success "Chat with data, not with spreadsheets"

    Ask in everyday language—for example *“GDP per capita for Kenya and Tanzania since 2010”* on **Data360 Chat**. The assistant calls **MCP tools** your server exposes (by default, Data360 tools to search indicators, load time series, and explain results) so users don’t memorize database codes.

!!! info "See which numbers you can trust"

    **Proof-Carrying Numbers (PCN)** labels values in the reply. A verified badge means the number came from a tool result you can trace; unverified means the model answered without that grounding. No more guessing whether a statistic is “real.”

!!! tip "Charts, documents, and code—side by side"

    The **artifact panel** opens next to the chat for **interactive charts** (Vega / Vega-Lite), **editable documents**, **spreadsheets**, and **syntax-highlighted code**. Build a mini report while you talk.

!!! note "Work the way your organization logs you in"

    Use **guest** try-out mode, **email/password**, **Microsoft (MSAL)**, or (for Data360 portal embedding) **Data360** sign-in—depending on how your deployment is configured—so the same stack fits pilots and enterprise.

---

## Highlights at a glance

| | |
|:---|:---|
| **Streaming answers** | Replies appear as they are generated; long answers can be **paused**, **resumed**, and (where enabled) you can follow extended **reasoning** steps. |
| **Rich messages** | **Markdown**, **math (KaTeX)**, **code highlighting**, and **image attachments** (where allowed). |
| **History & feedback** | Past chats, **vote** on answers, and **feedback** so teams can improve the experience. |
| **Multiple AI providers** | Powered by **LiteLLM**—Azure OpenAI, OpenAI, Anthropic, Google, and more, depending on your setup. |

---

## Choose your path

=== "I’m using the app"

    **Start here**

    - [**Getting started**](user-guide/getting-started.md) — Sign in (or try as guest) and send your first question  
    - [**Chat features**](user-guide/chat-features.md) — Streaming, stop, regenerate, thinking display  
    - [**Data analysis**](user-guide/data-analysis.md) — Indicators, charts, and exploring development data  
    - [**Documents & spreadsheets**](user-guide/documents-spreadsheets.md) — Artifacts next to the conversation  
    - [**File attachments**](user-guide/file-attachments.md) — Images and limits  
    - [**FAQ**](user-guide/faq.md) — Common questions  

=== "I’m building or extending it"

    Detailed architecture and integration docs will live in this site over time. For now, use the repository:

    - [**Architecture**](https://github.com/avsolatorio/vercel-ai-chatbot/blob/main/README.md#architecture) — stack and system diagram  
    - [**Getting started (manual)**](https://github.com/avsolatorio/vercel-ai-chatbot/blob/main/README.md#getting-started) — local setup  
    - [**Development**](https://github.com/avsolatorio/vercel-ai-chatbot/blob/main/README.md#development) — tests and tooling  
    - [**DEVELOPER.md**](https://github.com/avsolatorio/vercel-ai-chatbot/blob/main/DEVELOPER.md) — contributor notes  

=== "I’m deploying or operating it"

    - [**Docker setup (detailed)**](docker-setup.md) — compose-oriented walkthrough  
    - [**Getting started — Docker**](https://github.com/avsolatorio/vercel-ai-chatbot/blob/main/README.md#getting-started) — quick path in the README  
    - [**Deployment**](https://github.com/avsolatorio/vercel-ai-chatbot/blob/main/README.md#deployment) — hosting options  
    - [**Configuration**](https://github.com/avsolatorio/vercel-ai-chatbot/blob/main/README.md#configuration) — environment variables overview  

=== "I’m administering it"

    - [**Authentication**](https://github.com/avsolatorio/vercel-ai-chatbot/blob/main/README.md#authentication) — sign-in modes and MSAL notes  
    - [**Deployment**](https://github.com/avsolatorio/vercel-ai-chatbot/blob/main/README.md#deployment) — production concerns  
    - **Feedback and maintenance** — see [**Contributing**](https://github.com/avsolatorio/vercel-ai-chatbot/blob/main/README.md#contributing) and repository settings for your fork or org  

---

## Security & API

- [**Authentication**](https://github.com/avsolatorio/vercel-ai-chatbot/blob/main/README.md#authentication) — how sign-in and sessions relate to the stack (see also **Configuration** in the README for cookies and URLs)  
- **Live API docs** (when the backend is running): Swagger at `{BACKEND_URL}/docs` and ReDoc at `{BACKEND_URL}/redoc`  

---

## Open source

This project is **open source** (Apache-2.0 with the World Bank IGO Rider). Upstream credit to the [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) template is in the repository **NOTICE** file.

**Questions or ideas?** Use the repository issue tracker or contact the **AI for Data — Data for AI** team (see the main [README](https://github.com/worldbank/data-ai-chatbot) on GitHub).
