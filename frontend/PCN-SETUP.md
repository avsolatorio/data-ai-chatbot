# PCN (@pcn-js) Setup — Single Source of Truth

The frontend uses three packages from the [PCN](../../pcn) repo: `@pcn-js/core`, `@pcn-js/ui`, `@pcn-js/data360`.
**All commands below must be run from the `frontend` directory.**

**Why symlinks break:** Turbopack does not resolve symlinks that point outside the project. So for **local PCN** we **copy** the built packages into `node_modules` (use `copy:pcn` or `dev:local-pcn`). Do not use `link:pcn` for local PCN — it requires Webpack and can cause other issues (fonts, vega-canvas).

---

## 1. Use published PCN (default)

**package.json must have version specifiers** (not `file:`):

```json
"@pcn-js/core": "^0.1.1",
"@pcn-js/data360": "^0.1.1",
"@pcn-js/ui": "^0.1.1"
```

**Steps:**

```bash
cd frontend
pnpm install
pnpm dev
```

**After publishing new @pcn-js versions:** `pnpm install` does **not** re-resolve versions; the lockfile pins what was last installed. To pick up new versions that match your `^0.1.x` ranges, run:

```bash
pnpm run update:pcn
```

(or `pnpm update @pcn-js/core @pcn-js/ui @pcn-js/data360`). Then `pnpm install` and `pnpm dev` as usual.

Do **not** use `file:../../pcn/...` in package.json — it fails because PCN packages use `workspace:*` internally and pnpm cannot resolve that from outside the PCN monorepo.

---

## 2. Use local PCN (development / testing unreleased changes)

Keep package.json as above (^0.1.1). **Copy** the built PCN packages into `node_modules` (so Turbopack can resolve them; no Webpack):

```bash
cd frontend
pnpm run dev:local-pcn
```

This script runs `copy:pcn` (builds PCN and copies packages into `node_modules`), clears `.next`, and starts `pnpm dev` (Turbopack). You can also run `pnpm run copy:pcn` then `pnpm dev` yourself. After `copy:pcn`, use normal `pnpm dev` or `./run.sh`.

**Do not use `link:pcn`** for local PCN — it creates symlinks outside the project and forces Webpack, which can break next/font and vega.

**Important:** After `copy:pcn`, do **not** run `pnpm install` until you want to go back to published PCN (it would overwrite the copies). To restore published packages:

```bash
cd frontend
pnpm run unlink:pcn
```

---

## 3. If you see "Module not found: Can't resolve '@pcn-js/...'"

1. **Confirm you are in the frontend directory:**
   ```bash
   cd /path/to/vercel-ai-chatbot/frontend
   ```

2. **Check where @pcn-js packages are:**
   ```bash
   pnpm run verify-pcn
   ```
   This prints whether each package is present and whether it’s a symlink (local) or directory (registry).

3. **If packages are missing, reinstall:**
   ```bash
   pnpm run ensure-pcn
   pnpm exec rimraf .next
   pnpm dev
   ```

4. **If you use a run script**, start it so that the app runs from `frontend`:
   - From repo root: `bash frontend/run.sh` (run.sh already `cd`s into frontend)
   - From frontend: `./run.sh`

---

## Summary

| Goal              | From `frontend` directory                    |
|-------------------|----------------------------------------------|
| Use published PCN | `pnpm install` then `pnpm dev`              |
| Get new PCN versions | `pnpm run update:pcn` (then `pnpm install` / `pnpm dev`) |
| Use local PCN     | `pnpm run dev:local-pcn` (or `pnpm run copy:pcn` then `pnpm dev`)        |
| Restore published | `pnpm run unlink:pcn`                       |
| Check PCN state   | `pnpm run verify-pcn`                       |
| Fix missing PCN   | `pnpm run ensure-pcn` then `pnpm dev`       |

Always run dev (or run.sh) from the **frontend** directory so Next.js uses `frontend/node_modules`.
