/**
 * Runs the full build for a given environment. Sets env vars and runs the build chain.
 * Cross-platform; no cross-env needed in package.json.
 *
 * Usage: node scripts/run-build.js <env>
 *   env: local | dev | qa | uat | prod
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const log = (msg) => process.stdout.write(`[run-build] ${msg}\n`);
const logErr = (msg) => process.stderr.write(`[run-build] ${msg}\n`);

const envArg = process.argv[2];
const validEnvs = ["local", "dev", "qa", "uat", "prod"];
if (!envArg || !validEnvs.includes(envArg)) {
  process.stderr.write(
    `Usage: node scripts/run-build.js <env>\n  env: ${validEnvs.join(" | ")}\n`,
  );
  process.exit(1);
}

// NEXT_PUBLIC_APP_ENV for "local" is "dev" (local uses dev app config)
const nextPublicAppEnv = envArg === "local" ? "dev" : envArg;
const buildEnv = {
  ...process.env,
  APP_ENV: envArg,
  PHASE: envArg,
  NEXT_PUBLIC_APP_ENV: nextPublicAppEnv,
};

const projectRoot = path.dirname(path.dirname(__filename));
log(`Environment: ${envArg} (APP_ENV=${envArg}, PHASE=${envArg}, NEXT_PUBLIC_APP_ENV=${nextPublicAppEnv})`);
log(`Project root: ${projectRoot}`);

const run = (step, cmd, args, opts = {}) => {
  log(`Running: ${step}...`);
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: projectRoot,
    env: { ...buildEnv, ...opts.env },
    ...opts,
  });
  if (r.status !== 0) {
    logErr(`FAILED: ${step} (exit code ${r.status ?? r.signal ?? "unknown"})`);
    process.exit(r.status ?? 1);
  }
  log(`Done: ${step}`);
};

// Resolve next binary from project node_modules (works with npm or pnpm)
const nextBin = require.resolve("next/dist/bin/next", {
  paths: [path.join(projectRoot, "node_modules")],
});

run("copy-env", "node", ["scripts/copy-env.js"], { env: buildEnv });
run("ensure-streamdown", "node", ["scripts/ensure-streamdown-for-tailwind.js"]);
run("next build", "node", [nextBin, "build"], { env: buildEnv });
run("postbuild", "node", ["scripts/postbuild.js"]);

log("Build completed successfully.");
