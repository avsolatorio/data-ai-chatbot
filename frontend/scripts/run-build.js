/**
 * Runs the full build for a given environment. Sets env vars and runs the build chain.
 * Cross-platform; no cross-env needed in package.json.
 *
 * Usage: node scripts/run-build.js <env>
 *   env: local | dev | qa | uat | prod
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");

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
const run = (cmd, args, opts = {}) => {
  const r = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: projectRoot,
    env: { ...buildEnv, ...opts.env },
    ...opts,
  });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

run("node", ["scripts/copy-env.js"], { env: buildEnv });
run("node", ["scripts/ensure-streamdown-for-tailwind.js"]);
run("pnpm", ["exec", "next", "build"], { env: buildEnv });
run("node", ["scripts/postbuild.js"]);
