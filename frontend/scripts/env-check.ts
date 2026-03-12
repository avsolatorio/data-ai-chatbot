/**
 * Validate environment variables. Run before build in CI.
 * Usage: pnpm run env:check
 */

import { validateEnv } from "../lib/env";

try {
  validateEnv();
  process.exit(0);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`env:check failed: ${message}\n`);
  process.exit(1);
}
