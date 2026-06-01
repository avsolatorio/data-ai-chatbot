import fs from "node:fs/promises";
import path from "node:path";

export type NextStaticHealth = {
  ok: boolean;
  buildId?: string;
  detail?: string;
};

async function readFirstByte(filePath: string): Promise<void> {
  await fs.access(filePath, fs.constants.R_OK);
  const handle = await fs.open(filePath, "r");
  try {
    const buf = Buffer.alloc(1);
    await handle.read(buf, 0, 1, 0);
  } finally {
    await handle.close();
  }
}

/** Read one .js file from a directory (proves chunks/media are not empty or EACCES). */
async function sampleJsFromDir(dir: string): Promise<string> {
  await fs.access(dir, fs.constants.R_OK | fs.constants.X_OK);
  const entries = await fs.readdir(dir);
  const jsFile = entries.find((name) => name.endsWith(".js"));
  if (!jsFile) {
    throw new Error(`no .js files in ${dir}`);
  }
  const filePath = path.join(dir, jsFile);
  await readFirstByte(filePath);
  return jsFile;
}

/**
 * Verify compiled Next static output is present and readable on disk.
 * Catches incidents where the Node process is up but `.next/static` is missing or EACCES.
 * Skipped outside production (e.g. `next dev` layout differs).
 *
 * Layout (Next 16): `.next/static/{buildId}/` has manifests; JS chunks live in
 * `.next/static/chunks/` (not under the build id folder).
 */
export async function checkNextStaticHealth(): Promise<NextStaticHealth> {
  if (process.env.NODE_ENV !== "production") {
    return { ok: true, detail: "skipped (non-production)" };
  }

  const nextDir = path.join(process.cwd(), ".next");
  const buildIdPath = path.join(nextDir, "BUILD_ID");

  try {
    const buildId = (await fs.readFile(buildIdPath, "utf8")).trim();
    if (!buildId) {
      return { ok: false, detail: "BUILD_ID is empty" };
    }

    const staticDir = path.join(nextDir, "static");
    const buildDir = path.join(staticDir, buildId);
    await fs.access(buildDir, fs.constants.R_OK | fs.constants.X_OK);

    await readFirstByte(path.join(buildDir, "_buildManifest.js"));

    const chunksUnderBuildId = path.join(buildDir, "chunks");
    const chunksAtStaticRoot = path.join(staticDir, "chunks");
    try {
      await sampleJsFromDir(chunksUnderBuildId);
    } catch {
      await sampleJsFromDir(chunksAtStaticRoot);
    }

    return { ok: true, buildId };
  } catch (error) {
    return {
      ok: false,
      detail:
        error instanceof Error
          ? error.message
          : ".next static assets unreadable",
    };
  }
}
