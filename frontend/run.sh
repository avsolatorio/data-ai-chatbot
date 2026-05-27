#!/usr/bin/env bash
# cd "$(dirname "$0")" && pnpm dev --port 3001
cd "$(dirname "$0")" && pnpm install && pnpm build:local && PORT=3001 node .next/standalone/server.js
