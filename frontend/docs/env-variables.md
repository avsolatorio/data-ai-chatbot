# Environment Variables Reference

All environment variables used by the application. Values are validated at startup via `lib/env/schema.ts`.

## Quick Start

1. Copy `.env.example` to `.env.local`
2. Set required vars for your environment
3. Run `pnpm env:check` to validate before build

## Variable Reference

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NEXT_PUBLIC_APP_ENV` | enum | No | `dev` | Environment: `dev`, `qa`, `uat`, `prod`. Used for URL presets. |
| `POSTGRES_URL` | string | No | - | Deprecated. Frontend no longer connects to DB; backend owns all database operations. |
| `INTERNAL_API_SECRET` | string | No | - | Secret for FastAPI → Next.js internal requests. Optional; only needed when FastAPI makes internal calls to Next.js. |
| `NEXT_PUBLIC_BASE_URL` | string | No | `http://localhost:3001` | Base URL for the app. |
| `NEXT_PUBLIC_APP_URL` | string | No | `https://data360chat.worldbank.org` | Public app URL for redirects and metadata. When set, used for `returnTo` in auth redirects so users return to the public URL instead of the internal container hostname (required when behind a proxy). |
| `NEXT_PUBLIC_BASE_PATH` | string | No | `""` | Subpath deployment (e.g. `/app`). Must match next.config basePath. |
| `NEXT_PUBLIC_API_URL` | string | No | `http://localhost:8001` | FastAPI backend URL. |
| `SERVER_API_URL` | string | No | from preset/default | Server-side API URL; preferred for server routes. |
| `AUTH_PROXY_TIMEOUT_MS` | number | No | - | Timeout (ms) for auth proxy requests. |
| `NEXT_PUBLIC_APPLICATION_STATUS` | enum | No | - | `pre-alpha`, `alpha`, or `beta`. Shows UI banner. |
| `NEXT_PUBLIC_FEEDBACK_CONTACT_URL` | string | No | - | Feedback form redirect URL. |
| `NEXT_PUBLIC_FEEDBACK_CONTACT_LABEL` | string | No | - | Feedback button label. |
| `NEXT_PUBLIC_ARTIFACT_SCROLL_BEHAVIOR` | enum | No | `bottom` | `bottom` or `trigger`. |
| `NEXT_PUBLIC_SHOW_REASONING_PART_TYPE` | boolean | No | `false` | Show part type in reasoning stepper. |
| `NEXT_PUBLIC_DATA_HEADER_ENABLED` | boolean | No | `false` | Enable World Bank data header. |
| `NEXT_PUBLIC_DATA_HEADER_CSS_URL` | string | No | extdataportalqa QA URL | Data header CSS URL. Used when `NEXT_PUBLIC_DATA_HEADER_ENABLED` is true. |
| `NEXT_PUBLIC_DATA_HEADER_SCRIPT_URL` | string | No | extdataportalqa QA URL | Data header script URL. Used when `NEXT_PUBLIC_DATA_HEADER_ENABLED` is true. |
| `NEXT_PUBLIC_LANDING_INSIGHTS_ENABLED` | boolean | No | `false` | Show the landing page insights section ("Did you know...?") when true. |
| `MAINTENANCE_MODE` | boolean | No | `false` | Redirect to maintenance page when true. |
| `CSP_ENABLED` | boolean | No | `false` | Enable Content-Security-Policy headers. |
| `CSP_REPORT_ENABLED` | boolean | No | `true` | Enable CSP violation reporting. |
| `NEXT_PUBLIC_AUTH_PROVIDER` | enum | No | `guest` | `guest`, `user`, `msal`, or `data360`. |
| `NEXT_PUBLIC_SKIP_LOGIN_PAGE` | boolean | No | `true` | When true, skip login page in guest/MSAL modes (redirect or trigger sign-in directly). Set to `false` to show the login page. |
| `NEXT_PUBLIC_MSAL_CLIENT_ID` | string | No | - | Azure AD app (client) ID. |
| `NEXT_PUBLIC_MSAL_REDIRECT_URI` | string | No | - | MSAL redirect URI. Must match Azure AD app registration. |
| `NEXT_PUBLIC_MSAL_AUTHORITY` | string | No | - | MSAL authority URL. |
| `NEXT_PUBLIC_DATA360_AUTH_URL` | string | No | - | Data360 auth URL for redirect when unauthenticated. Required when `NEXT_PUBLIC_AUTH_PROVIDER=data360`. |
| `NEXT_PUBLIC_VEGA_CUSTOM_THEME_URL` | string | No | - | Custom Vega theme JSON URL. |
| `NEXT_PUBLIC_MAX_FILE_SIZE_BYTES` | number | No | - | Max file size for uploads. |
| `NEXT_PUBLIC_ALLOWED_IMAGE_TYPES` | string | No | - | Comma-separated MIME types for image uploads. |

## Resolution Order

For URL values (`SERVER_API_URL`, `NEXT_PUBLIC_API_URL`, etc.):

1. **process.env** – explicit value set in environment
2. **Preset** – value from `lib/env/presets.ts` for current `NEXT_PUBLIC_APP_ENV`
3. **Default** – fallback from schema

## Build-Time Inlining (NEXT_PUBLIC_*)

Next.js inlines `NEXT_PUBLIC_*` variables at **build time** for client bundles. They are **not** read at runtime in the browser.

- **Direct reference required**: Next.js only inlines when you use `process.env.NEXT_PUBLIC_X` explicitly. Spreading `{ ...process.env }` does **not** trigger inlining.
- **Set at build**: Ensure vars are set in the environment where `next build` runs (CI, local, or Azure build step).
- **Client modules**: `lib/config.ts` and `lib/auth/config.ts` use direct `process.env.NEXT_PUBLIC_*` references so values are correctly inlined when imported by client components.

## Validation

- `pnpm env:check` – validates env before build (run in CI)
- `validateEnv()` – runs on server startup via `instrumentation.ts`
- `POSTGRES_URL` is no longer required (frontend does not connect to DB)

## See Also

- [Azure App Service setup](azure-env-setup.md)
- [lib/env/schema.ts](../lib/env/schema.ts) – Zod schema
