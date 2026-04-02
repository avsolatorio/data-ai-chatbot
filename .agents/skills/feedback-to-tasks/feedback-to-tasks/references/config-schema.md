# Config Schema

Each repo that participates in this task system has a `TODO/tasks.json` file.
This file is the only config the skill needs — no agent-specific paths, no hardcoded directories.

---

## Schema

```json
{
  "name": "data-ai-chatbot",
  "domains": ["FE", "BE", "DESIGN"],
  "github_repo": "org/data-ai-chatbot",
  "cross_repo_canonical": true,
  "peers": {
    "data360-mcp": "${DATA360_MCP_PATH}",
    "pcn": "${PCN_PATH}"
  }
}
```

### Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | yes | Canonical repo name (used in cross-repo graph labels) |
| `domains` | yes | Domain prefixes this repo owns (e.g. `["FE", "BE", "DESIGN"]`) |
| `github_repo` | no | `org/repo` slug for GitHub Issues sync |
| `cross_repo_canonical` | no | If `true`, this repo hosts the authoritative `CROSS-REPO-GRAPH.md`. Only one repo should have this. |
| `peers` | no | Map of peer repo names → paths. Paths may use env vars (`${VAR}`) or `~`. Required if tasks reference other repos. |

---

## Path resolution

Resolve paths in this order:

1. **Environment variables** — `${VAR_NAME}` or `$VAR_NAME` → `os.environ['VAR_NAME']`
2. **Tilde expansion** — `~/foo` → `/home/user/foo`
3. **Absolute paths** — used as-is

If an env var is missing, warn the user: *"Peer repo `data360-mcp` path uses `${DATA360_MCP_PATH}` but that variable isn't set. Set it in your shell or `.env` file."*

Don't fail the whole operation — continue with the repos that are resolvable, but note which cross-repo links couldn't be verified.

---

## Discovery

When the skill is invoked, find the config by:

1. Check `{cwd}/TODO/tasks.json`
2. Walk up parent directories, checking `TODO/tasks.json` at each level
3. Stop at filesystem root

If found, read it. If peers are defined, resolve their paths and read their `tasks.json` files too.

---

## First-run setup

If no `tasks.json` is found anywhere in the directory tree, guide the user through creating one.

Ask:
1. What is this repo called? (suggest the current directory name)
2. What domain prefixes will tasks use here? (e.g. `FE`, `BE`, `DESIGN`)
3. Do you have peer repos that tasks will reference? If so, what are their names and how should the paths be referenced? (suggest env var names based on repo name, e.g. `${DATA360_MCP_PATH}`)
4. Is this the repo that should host the canonical cross-repo dependency graph? (suggest `true` if it's the "main" or "frontend" repo)
5. Do you have a GitHub repo slug for issue sync? (optional)

Then write `TODO/tasks.json` and create `TODO/` if it doesn't exist.
Also write a starter `TODO/README.md` using the template in `references/task-format.md`.

---

## Adding a new domain

When a new domain prefix is encountered (e.g. `API-001`), check all repos' `tasks.json` for that domain.
If not found:
- Ask: *"Domain `API` isn't registered anywhere. Which repo should own it?"*
- Add it to that repo's `domains` array and save `tasks.json`
- The new domain is now valid

---

## Example: multi-repo setup

```
data-ai-chatbot/TODO/tasks.json  (local dir may be named differently, e.g. vercel-ai-chatbot):
{
  "name": "data-ai-chatbot",
  "domains": ["FE", "BE", "DESIGN"],
  "github_repo": "myorg/data-ai-chatbot",
  "cross_repo_canonical": true,
  "peers": {
    "data360-mcp": "${DATA360_MCP_PATH}",
    "pcn": "${PCN_PATH}"
  }
}

data360-mcp/TODO/tasks.json:
{
  "name": "data360-mcp",
  "domains": ["MCP"],
  "github_repo": "myorg/data360-mcp",
  "peers": {
    "data-ai-chatbot": "${DATA_AI_CHATBOT_PATH}"
  }
}

pcn/TODO/tasks.json:
{
  "name": "pcn",
  "domains": ["PCN"],
  "github_repo": "myorg/pcn",
  "peers": {
    "data-ai-chatbot": "${DATA_AI_CHATBOT_PATH}"
  }
}
```

Note: the `name` field is the canonical repo name and does not need to match the local directory name. The path is resolved via the env var, so you can have `DATA_AI_CHATBOT_PATH=/home/dev/vercel-ai-chatbot` even if the canonical name is `data-ai-chatbot`.

Each repo only needs to know about the repos it directly depends on. The canonical repo's cross-repo graph aggregates the full picture.
