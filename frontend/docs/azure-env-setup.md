# Azure App Service Environment Setup

Configure environment variables for the Next.js frontend deployed to Azure App Service.

## Overview

- **Application settings** per slot (Production, Staging)
- **Slot-specific vars** – differ per deployment (QA, UAT, Prod)
- **Shared vars** – same across slots (feature flags, common config)

## Slot-Specific Variables

Set these per deployment slot. Values differ per environment.

| Variable | QA | UAT | Prod |
|----------|----|----|------|
| `NEXT_PUBLIC_APP_ENV` | `qa` | `uat` | `prod` |
| `SERVER_API_URL` | QA API URL | UAT API URL | Prod API URL |
| `NEXT_PUBLIC_API_URL` | QA API URL | UAT API URL | Prod API URL |
| `NEXT_PUBLIC_APP_URL` | QA app URL | UAT app URL | Prod app URL |
| `NEXT_PUBLIC_BASE_URL` | QA base URL | UAT base URL | Prod base URL |
| `INTERNAL_API_SECRET` | — | — | — | Optional; only when FastAPI makes internal calls to Next.js |

## Shared Variables

Set once; same across slots. Use "All" or "Production + Staging" scope when configuring.

| Variable | Example |
|----------|---------|
| `NEXT_PUBLIC_APPLICATION_STATUS` | `alpha`, `beta` |
| `NEXT_PUBLIC_SHOW_REASONING_PART_TYPE` | `false` |
| `CSP_ENABLED` | `true` |
| `CSP_REPORT_ENABLED` | `true` |
| `NEXT_PUBLIC_BASE_PATH` | `/app` (if subpath deployed) |

## How to Set Variables

### Azure Portal

1. Open your App Service
2. **Configuration** → **Application settings**
3. **+ New application setting** for each variable
4. Use **Slot setting** to make a var slot-specific (staging vs production)

### Azure CLI

```bash
az webapp config appsettings set \
  --resource-group <resource-group> \
  --name <app-name> \
  --settings \
    NEXT_PUBLIC_APP_ENV=prod \
    SERVER_API_URL=https://api.example.com \
    NEXT_PUBLIC_API_URL=https://api.example.com \
    NEXT_PUBLIC_APP_URL=https://app.example.com
```

### Key Vault References

For secrets (e.g. `INTERNAL_API_SECRET` if used), use Key Vault references. Note: `POSTGRES_URL` is no longer required for the frontend.

```
@Microsoft.KeyVault(SecretUri=https://<vault>.vault.azure.net/secrets/<secret-name>/)
```

1. Enable managed identity for the App Service
2. Grant the identity access to the Key Vault (Get secret)
3. Set the app setting value to the reference format above

## Presets

When `NEXT_PUBLIC_APP_ENV` is set and URL vars are empty, the app uses presets from `lib/env/presets.ts`. For QA, presets are defined. For UAT and Prod, set the URLs explicitly in the slot or use presets.

## Validation

The app validates env on startup. If required vars are missing in production, the app will not start. Check:

- **Application logs** for validation errors
- **Health endpoint** (e.g. `/ping`) to confirm the app is running

## Backend (FastAPI) telemetry

The Python API (separate App Service or container) exports OpenTelemetry traces to Application Insights when deployed. On the **backend** slot, set:

| Variable | Notes |
|----------|--------|
| `ENVIRONMENT` | `production`, `qa`, or `uat` (not `development`) |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | From the Application Insights resource |

Details: [OpenTelemetry (backend)](../../../docs/operations/telemetry.md).

## See Also

- [Environment variables reference](env-variables.md)
- [OpenTelemetry (backend)](../../../docs/operations/telemetry.md)
- [Azure App Service configuration](https://learn.microsoft.com/en-us/azure/app-service/configure-common)
