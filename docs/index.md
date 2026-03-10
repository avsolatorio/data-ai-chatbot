# Data360 Chat Documentation

Welcome to the **Data360 Chat** (Data Chatbot) documentation. This site provides comprehensive guides for end users, developers, operations staff, and administrators.

---

## For End Users

Get started with Data360 Chat and learn how to use its features effectively.

- [**Getting Started**](user-guide/getting-started.md) — Sign up, log in, and send your first message
- [**Chat Features**](user-guide/chat-features.md) — Streaming, thinking stages, stop, regenerate
- [**Documents & Spreadsheets**](user-guide/documents-spreadsheets.md) — Create and edit text, code, and spreadsheets
- [**Data Analysis**](user-guide/data-analysis.md) — Search indicators, view charts, explore development data
- [**FAQ**](user-guide/faq.md) — Common questions and troubleshooting

---

## For Developers

Understand the architecture and build or extend the application.

- [**Architecture Overview**](architecture/overview.md) — Purpose, scope, and technology stack
- [**System Context**](architecture/system-context.md) — Boundaries, actors, external systems
- [**Backend**](architecture/backend.md) — FastAPI structure, middleware, API routers
- [**Frontend**](architecture/frontend.md) — Next.js App Router, components, state management
- [**Infrastructure**](infrastructure/index.md) — Components, network topology, data flow

---

## For Operations & DevOps

Deploy, configure, and operate the application.

- [**Local Development**](deployment/local-development.md) — Run the app locally
- [**Docker**](deployment/docker.md) — Docker Compose for development
- [**Production Deployment**](deployment/production.md) — Azure, env vars, CORS, migrations
- [**Environment Variables**](operations/environment-variables.md) — Full reference
- [**Troubleshooting**](operations/troubleshooting.md) — Common issues and fixes
- [**Runbooks**](operations/runbooks.md) — Operational procedures

---

## For Administrators

Manage feedback, maintenance mode, and user access.

- [**Feedback Review**](admin-guide/feedback-review.md) — Review user feedback
- [**Maintenance Mode**](admin-guide/maintenance-mode.md) — Enable maintenance page

---

## Security

- [**Security Overview**](security/overview.md) — Auth, CSRF, rate limiting, cookies
- [**Risk Assessment**](security/risk-assessment.md) — Identified risks and mitigations

---

## API Reference

The backend exposes interactive API documentation when running:

- **Swagger UI** — `{BACKEND_URL}/docs`
- **ReDoc** — `{BACKEND_URL}/redoc`

See [API](api/index.md) for details.
