---
hide:
  - toc
---

# Data AI Chatbot

**Data AI Chatbot** is a self-hostable **data chatbot**: you connect it to your APIs and databases through **[MCP](https://modelcontextprotocol.io/)** (Model Context Protocol), chat in plain language, and open charts and documents in a side panel. Optionally, **Proof-Carrying Numbers (PCN)** show which numeric answers came from tool results versus the model alone.

**Data360 Chat** is the **World Bank reference customization**: it ships pre-configured for the **[Data360 MCP Server](https://github.com/worldbank/data360-mcp)** and World Bank development indicators—the setup this documentation describes. Other teams can reuse the same app with a different MCP server via **`MCP_SERVER_URL`**.

> *Maintained by the World Bank **AI for Data — Data for AI** team. On Data360 Chat, live indicators and metadata flow through Data360 MCP; PCN helps readers tell verified statistics from model guesses at a glance.*

![Data AI Chatbot — chat and side panel](img/chat-preview.png)

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

    - [**Architecture overview**](architecture/overview.md) — Scope and stack  
    - [**System context**](architecture/system-context.md) — Actors and external systems  
    - [**Backend**](architecture/backend.md) · [**Frontend**](architecture/frontend.md)  
    - [**Authentication**](architecture/authentication.md) — Modes and flows  
    - [**Integrations**](architecture/integrations.md) — MCP, Data360, and more  

=== "I’m deploying or operating it"

    - [**Local development**](deployment/local-development.md)  
    - [**Docker**](deployment/docker.md)  
    - [**Docker setup (detailed)**](docker-setup.md)  
    - [**Production**](deployment/production.md)  
    - [**Environment variables**](operations/environment-variables.md)  
    - [**Troubleshooting**](operations/troubleshooting.md)  

=== "I’m administering it"

    - [**Feedback review**](admin-guide/feedback-review.md)  
    - [**Maintenance mode**](admin-guide/maintenance-mode.md)  
    - [**User management**](admin-guide/user-management.md)  

---

## Security & API

- [**Security overview**](security/overview.md) — How auth, cookies, CSRF, and rate limiting fit together  
- **Live API docs** (when the backend is running): Swagger at `{BACKEND_URL}/docs` and ReDoc at `{BACKEND_URL}/redoc` — see [**API**](api/index.md)  

---

## Open source

This project is **open source** (Apache-2.0 with the World Bank IGO Rider). Upstream credit to the [Vercel AI Chatbot](https://github.com/vercel/ai-chatbot) template is in the repository **NOTICE** file.

**Questions or ideas?** Use the repository issue tracker or contact the **AI for Data — Data for AI** team (see the main [README](https://github.com/worldbank/data-ai-chatbot) on GitHub).
