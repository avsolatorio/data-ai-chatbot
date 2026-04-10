# Third-Party Licenses

This document lists the open-source third-party software used by this project,
organized by component. All licenses are compatible with the project's Apache-2.0 license
and World Bank IGO Rider.

> **How to regenerate this file:**
> - Frontend: `cd frontend && pnpm licenses list --prod`
> - Backend: `cd backend && uv run pip-licenses --format=markdown --order=license`

---

## Frontend (Next.js / Node.js)

The frontend is located in `frontend/` and uses [pnpm](https://pnpm.io/) for package management.

### Apache-2.0

| Package | Description |
|---------|-------------|
| `ai` | Vercel AI SDK |
| `@ai-sdk/gateway` | AI SDK Gateway |
| `@ai-sdk/openai-compatible` | AI SDK OpenAI-compatible provider |
| `@ai-sdk/provider` | AI SDK provider primitives |
| `@ai-sdk/provider-utils` | AI SDK provider utilities |
| `@ai-sdk/react` | AI SDK React hooks |
| `@ai-sdk/xai` | AI SDK xAI provider |
| `@chevrotain/cst-dts-gen` | Chevrotain CST DTS generator |
| `@chevrotain/gast` | Chevrotain GAST |
| `@chevrotain/regexp-to-ast` | Chevrotain RegExp to AST |
| `@chevrotain/types` | Chevrotain type definitions |
| `@chevrotain/utils` | Chevrotain utilities |
| `@img/sharp-darwin-arm64` | Sharp image processor (macOS ARM64) |
| `@opentelemetry/api` | OpenTelemetry API |
| `@opentelemetry/api-logs` | OpenTelemetry Logs API |
| `@opentelemetry/core` | OpenTelemetry Core |
| `@opentelemetry/instrumentation` | OpenTelemetry Instrumentation |
| `@opentelemetry/resources` | OpenTelemetry Resources |
| `@opentelemetry/sdk-logs` | OpenTelemetry SDK Logs |
| `@opentelemetry/sdk-metrics` | OpenTelemetry SDK Metrics |
| `@opentelemetry/sdk-trace-base` | OpenTelemetry SDK Trace |
| `@opentelemetry/semantic-conventions` | OpenTelemetry Semantic Conventions |
| `@pcn-js/core` | Proof-Carrying Numbers core |
| `@pcn-js/data360` | Proof-Carrying Numbers Data360 integration |
| `@pcn-js/ui` | Proof-Carrying Numbers UI components |
| `@playwright/test` | Playwright testing framework |
| `@swc/helpers` | SWC JavaScript helpers |
| `@vercel/blob` | Vercel Blob storage |
| `@vercel/functions` | Vercel Functions |
| `@vercel/oidc` | Vercel OIDC |
| `chevrotain` | Parser toolkit |
| `class-variance-authority` | Class variance authority for UI variants |
| `cluster-key-slot` | Redis cluster key slot |
| `detect-libc` | Detect Linux libc |
| `diff-match-patch` | Diff/match/patch algorithms |
| `ecdsa-sig-formatter` | ECDSA signature formatter |
| `import-in-the-middle` | Module import hooking |
| `playwright` | Browser automation |
| `playwright-core` | Playwright core |
| `sharp` | High-performance image processing |
| `streamdown` | Streaming markdown renderer |

### BSD-2-Clause

| Package | Description |
|---------|-------------|
| `cheerio-select` | CSS selector engine |
| `css-select` | CSS selector compiler |
| `css-what` | CSS selector parser |
| `domelementtype` | DOM element types |
| `domhandler` | DOM handler |
| `domutils` | DOM utilities |
| `dotenv` | Environment variable loader |
| `entities` | HTML/XML entity encoder/decoder |
| `nth-check` | CSS nth-check |
| `shimmer` | Function wrapping utility |
| `webidl-conversions` | Web IDL type conversions |

### BSD-3-Clause

| Package | Description |
|---------|-------------|
| `buffer-equal-constant-time` | Timing-safe buffer comparison |
| `d3-array` | D3 array utilities |
| `d3-ease` | D3 easing functions |
| `d3-path` | D3 path serializer |
| `d3-sankey` | D3 Sankey diagrams |
| `d3-shape` | D3 shape generators |
| `highlight.js` | Syntax highlighting |
| `rw` | Read/write utilities |
| `source-map-js` | Source map support |
| `vega` | Vega visualization grammar |
| `vega-canvas` | Vega canvas renderer |
| `vega-crossfilter` | Vega crossfilter transform |
| `vega-dataflow` | Vega dataflow |
| `vega-embed` | Vega embed |
| `vega-encode` | Vega encode |
| `vega-event-selector` | Vega event selector |
| `vega-expression` | Vega expression language |
| `vega-force` | Vega force layout |
| `vega-format` | Vega formatters |
| `vega-functions` | Vega functions |
| `vega-geo` | Vega geo transforms |
| `vega-hierarchy` | Vega hierarchy layout |
| `vega-interpreter` | Vega expression interpreter |
| `vega-label` | Vega label placement |
| `vega-lite` | Vega-Lite high-level grammar |
| `vega-loader` | Vega data loader |
| `vega-parser` | Vega specification parser |
| `vega-projection` | Vega cartographic projections |
| `vega-regression` | Vega regression transforms |
| `vega-runtime` | Vega runtime |
| `vega-scale` | Vega scales |
| `vega-scenegraph` | Vega scenegraph |
| `vega-schema-url-parser` | Vega schema URL parser |
| `vega-selections` | Vega selection utilities |
| `vega-statistics` | Vega statistical transforms |
| `vega-themes` | Vega themes |
| `vega-time` | Vega time utilities |
| `vega-tooltip` | Vega tooltip handler |
| `vega-transforms` | Vega data transforms |
| `vega-typings` | Vega TypeScript definitions |
| `vega-util` | Vega utilities |
| `vega-view` | Vega view component |
| `vega-view-transforms` | Vega view transforms |
| `vega-voronoi` | Vega Voronoi diagram |
| `vega-wordcloud` | Vega word cloud |

### MIT

| Package | Description |
|---------|-------------|
| `@azure/msal-browser` | MSAL browser authentication |
| `@azure/msal-react` | MSAL React integration |
| `@codemirror/lang-javascript` | CodeMirror JavaScript language |
| `@codemirror/lang-python` | CodeMirror Python language |
| `@codemirror/state` | CodeMirror editor state |
| `@codemirror/theme-one-dark` | CodeMirror One Dark theme |
| `@codemirror/view` | CodeMirror editor view |
| `@icons-pack/react-simple-icons` | React Simple Icons |
| `@radix-ui/react-collapsible` | Radix collapsible component |
| `@radix-ui/react-icons` | Radix UI icons |
| `@radix-ui/react-select` | Radix select component |
| `@radix-ui/react-use-controllable-state` | Radix controllable state |
| `@radix-ui/react-visually-hidden` | Radix visually hidden |
| `@tanstack/react-virtual` | Virtual list rendering |
| `@vercel/analytics` | Vercel Analytics (MPL-2.0 — see note) |
| `@vercel/otel` | Vercel OpenTelemetry |
| `bcrypt-ts` | bcrypt in TypeScript |
| `classnames` | CSS class names utility |
| `clsx` | Class name utility |
| `codemirror` | Code editor component |
| `date-fns` | Date utility library |
| `embla-carousel-react` | Embla Carousel React |
| `fast-deep-equal` | Fast deep equality check |
| `framer-motion` | Animation library |
| `geist` | Geist typeface (SIL OFL — see note) |
| `jsonwebtoken` | JSON Web Token implementation |
| `katex` | Math typesetting |
| `lucide-react` | Lucide icon set for React |
| `marked` | Markdown parser |
| `mermaid` | Diagramming and charting |
| `nanoid` | Unique ID generator |
| `next` | Next.js framework |
| `next-auth` | Authentication for Next.js |
| `next-themes` | Theme management for Next.js |
| `orderedmap` | Ordered map data structure |
| `papaparse` | CSV parser |
| `prosemirror-example-setup` | ProseMirror example setup |
| `prosemirror-inputrules` | ProseMirror input rules |
| `prosemirror-markdown` | ProseMirror Markdown |
| `prosemirror-model` | ProseMirror document model |
| `prosemirror-schema-basic` | ProseMirror basic schema |
| `prosemirror-schema-list` | ProseMirror list schema |
| `prosemirror-state` | ProseMirror editor state |
| `prosemirror-view` | ProseMirror editor view |
| `radix-ui` | Radix UI primitives |
| `react` | React UI library |
| `react-data-grid` | Data grid component |
| `react-dom` | React DOM renderer |
| `react-is` | React type checking |
| `react-markdown` | Markdown renderer for React |
| `react-resizable-panels` | Resizable panel layouts |
| `react-syntax-highlighter` | Syntax highlighter for React |
| `recharts` | Recharts charting library |
| `redis` | Redis client |
| `rehype-sanitize` | Rehype HTML sanitizer |
| `remark-breaks` | Remark line breaks |
| `remark-gfm` | Remark GitHub Flavored Markdown |
| `resumable-stream` | Resumable stream utility |
| `server-only` | Server-only module guard |
| `shiki` | Syntax highlighter |
| `sonner` | Toast notification component |
| `swr` | Data fetching library |
| `tailwind-merge` | Tailwind CSS class merging |
| `tailwindcss-animate` | Tailwind CSS animations |
| `tokenlens` | Token counting utility |
| `use-stick-to-bottom` | Scroll-to-bottom React hook |
| `usehooks-ts` | React hooks collection |
| `zod` | TypeScript-first schema validation |

### Other Licenses

| Package | License | Notes |
|---------|---------|-------|
| `@vercel/analytics` | MPL-2.0 | Mozilla Public License 2.0 |
| `dompurify` | MPL-2.0 OR Apache-2.0 | Either MPL-2.0 or Apache-2.0 |
| `json-schema` | AFL-2.1 OR BSD-3-Clause | Either AFL-2.1 or BSD-3-Clause |
| `tslib` | 0BSD | Zero-clause BSD |
| `geist` | SIL OFL 1.1 | Open Font License |
| `argparse` | Python-2.0 | Python Software Foundation License 2.0 |
| `victory-vendor` | MIT AND ISC | Dual MIT and ISC |
| `robust-predicates` | Unlicense | Public domain |
| `khroma` | Unknown | Color manipulation library |

---

## Backend (Python / FastAPI)

The backend is located in `backend/` and uses [uv](https://docs.astral.sh/uv/) for package management.

### MIT

| Package | Version | Description |
|---------|---------|-------------|
| `alembic` | 1.17.2 | Database migrations |
| `annotated-doc` | 0.0.4 | Annotated document utilities |
| `annotated-types` | 0.7.0 | Annotated type support |
| `anyio` | 4.12.0 | Async I/O library |
| `attrs` | 25.4.0 | Python class utilities |
| `azure-core` | 1.38.0 | Azure SDK core |
| `azure-identity` | 1.25.1 | Azure identity authentication |
| `beartype` | 0.22.8 | Runtime type checking |
| `cachetools` | 6.2.2 | Caching utilities |
| `cffi` | 2.0.0 | C foreign function interface |
| `cfgv` | 3.5.0 | Config file validation |
| `charset-normalizer` | 3.4.4 | Charset normalization |
| `docstring-parser` | 0.17.0 | Docstring parsing |
| `ecdsa` | 0.19.1 | ECDSA cryptography |
| `exceptiongroup` | 1.3.1 | Exception group support |
| `fastapi` | 0.122.0 | Fast API framework |
| `fastapi-cli` | 0.0.16 | FastAPI CLI |
| `fastar` | 0.8.0 | Fast AR library |
| `greenlet` | 3.2.4 | Micro-threads (MIT AND Python-2.0) |
| `h11` | 0.16.0 | HTTP/1.1 protocol |
| `hiredis` | 3.3.0 | Redis C extension |
| `httpcore` | 1.0.9 | HTTP core library |
| `httptools` | 0.7.1 | HTTP tools |
| `httpx` | 0.28.1 | HTTP client |
| `httpx-sse` | 0.4.3 | SSE support for httpx |
| `identify` | 2.6.15 | File identification |
| `iniconfig` | 2.3.0 | INI file configuration |
| `itsdangerous` | 2.2.0 | Cryptographic signing |
| `jiter` | 0.12.0 | JSON iterator |
| `Jinja2` | 3.1.6 | Templating engine |
| `jsonschema` | 4.25.1 | JSON schema validation |
| `jsonschema-specifications` | 2025.9.1 | JSON schema specifications |
| `litellm` | 1.80.9 | LLM abstraction layer |
| `Mako` | 1.3.10 | Template library |
| `markdown-it-py` | 4.0.0 | Markdown parser |
| `MarkupSafe` | 3.0.3 | Safe markup strings |
| `mcp` | 1.22.0 | Model Context Protocol SDK |
| `mdurl` | 0.1.2 | URL normalization for Markdown |
| `msal` | 1.34.0 | MSAL authentication |
| `msal-extensions` | 1.3.1 | MSAL extensions |
| `openapi-pydantic` | 0.5.1 | OpenAPI schema models |
| `pathvalidate` | 3.3.1 | Path name validation |
| `platformdirs` | 4.5.0 | Platform-specific directories |
| `pluggy` | 1.6.0 | Plugin system |
| `pre-commit` | 4.5.0 | Pre-commit hooks |
| `pydantic` | 2.12.5 | Data validation |
| `pydantic-extra-types` | 2.10.6 | Extra Pydantic types |
| `pydantic-settings` | 2.12.0 | Pydantic settings management |
| `pydantic-core` | 2.41.5 | Pydantic core |
| `PyJWT` | 2.10.1 | JSON Web Token |
| `pyodbc` | 5.3.0 | ODBC database connectivity |
| `pytest` | 9.0.1 | Testing framework |
| `pytest-asyncio` | 1.3.0 | Async test support |
| `PyYAML` | 6.0.3 | YAML parser |
| `redis` | 7.1.0 | Redis client |
| `referencing` | 0.36.2 | JSON schema referencing |
| `rich` | 14.2.0 | Rich text formatting |
| `rpds-py` | 0.30.0 | Persistent data structures |
| `ruff` | 0.14.7 | Fast Python linter |
| `six` | 1.17.0 | Python 2/3 compatibility |
| `SQLAlchemy` | 2.0.44 | SQL toolkit and ORM |
| `tiktoken` | 0.12.0 | OpenAI tokenizer |
| `typer` | 0.20.0 | CLI builder |
| `typer-slim` | 0.20.0 | Lightweight Typer |
| `typing-inspection` | 0.4.2 | Runtime typing inspection |
| `urllib3` | 2.5.0 | HTTP library |
| `virtualenv` | 20.35.4 | Virtual environment creator |
| `watchfiles` | 1.1.1 | File watching |
| `zipp` | 3.23.0 | Zipfile extension |

### Apache-2.0

| Package | Version | Description |
|---------|---------|-------------|
| `aioodbc` | 0.5.0 | Async ODBC |
| `aiohttp` | 3.13.2 | Async HTTP client/server |
| `aiosignal` | 1.4.0 | Async signal handling |
| `asyncpg` | 0.31.0 | Async PostgreSQL client |
| `bcrypt` | 4.3.0 | bcrypt password hashing |
| `cyclopts` | 4.3.0 | CLI argument parser |
| `diskcache` | 5.6.3 | Disk-backed cache |
| `distro` | 1.9.0 | Linux distribution detection |
| `fastmcp` | 2.13.3 | Fast MCP server framework |
| `frozenlist` | 1.8.0 | Frozen list data structure |
| `grpcio` | 1.67.1 | gRPC framework |
| `hf-xet` | 1.2.0 | Hugging Face Xet storage |
| `huggingface-hub` | 1.2.2 | Hugging Face Hub client |
| `importlib-metadata` | 8.7.0 | Import metadata |
| `json5` | 0.12.1 | JSON5 parser |
| `jsonschema-path` | 0.3.4 | JSONSchema path utilities |
| `multidict` | 6.7.0 | Multi-value dictionary |
| `openai` | 2.9.0 | OpenAI Python SDK |
| `packaging` | 25.0 | Python package utilities |
| `pathable` | 0.4.4 | Path-like object utilities |
| `propcache` | 0.4.1 | Property caching |
| `py-key-value-aio` | 0.3.0 | Async key-value store |
| `py-key-value-shared` | 0.3.0 | Shared key-value utilities |
| `python-dateutil` | 2.9.0 | Date utilities |
| `python-multipart` | 0.0.20 | Multipart form data parser |
| `regex` | 2025.11.3 | Advanced regex (Apache-2.0 AND CNRI-Python) |
| `requests` | 2.32.5 | HTTP library |
| `rsa` | 4.9.1 | RSA cryptography |
| `sniffio` | 1.3.1 | Async library sniffer |
| `tokenizers` | 0.22.1 | Fast tokenizers |
| `uvloop` | 0.22.1 | Fast event loop |
| `yarl` | 1.22.0 | URL library |

### BSD-3-Clause

| Package | Version | Description |
|---------|---------|-------------|
| `Authlib` | 1.6.5 | OAuth and OIDC library |
| `click` | 8.3.1 | CLI creation toolkit |
| `cryptography` | 46.0.3 | Cryptographic primitives (Apache-2.0 OR BSD-3-Clause) |
| `docutils` | 0.22.3 | Documentation utilities |
| `fastuuid` | 0.14.0 | Fast UUID generation |
| `fsspec` | 2025.12.0 | Filesystem abstraction |
| `httpcore` | 1.0.9 | HTTP core |
| `idna` | 3.11 | Internationalized domain names |
| `Jinja2` | 3.1.6 | Templating engine |
| `nodeenv` | 1.9.1 | Node.js virtual environments |
| `passlib` | 1.7.4 | Password hashing |
| `pyasn1` | 0.6.1 | ASN.1 types and codecs |
| `pycparser` | 2.23 | C parser |
| `Pygments` | 2.19.2 | Syntax highlighting |
| `pyperclip` | 1.11.0 | Clipboard utilities |
| `python-dotenv` | 1.2.1 | .env file loading |
| `sentry-sdk` | 2.46.0 | Sentry error tracking |
| `sse-starlette` | 3.0.3 | Server-Sent Events for Starlette |
| `starlette` | 0.50.0 | ASGI framework |
| `uvicorn` | 0.38.0 | ASGI server |
| `websockets` | 15.0.1 | WebSocket library |

### ISC

| Package | Version | Description |
|---------|---------|-------------|
| `dnspython` | 2.8.0 | DNS toolkit |
| `shellingham` | 1.5.4 | Shell detection |

### Other Licenses

| Package | Version | License | Notes |
|---------|---------|---------|-------|
| `orjson` | 3.11.4 | Apache-2.0 OR MIT | Fast JSON library |
| `python-jose` | 3.5.0 | MIT | JOSE implementation |
| `greenlet` | 3.2.4 | MIT AND Python-2.0 | Micro-threads |

---

*This list was generated on 2026-03-16. Dependency versions may change; re-run the commands at
the top of this file to generate an up-to-date list.*
