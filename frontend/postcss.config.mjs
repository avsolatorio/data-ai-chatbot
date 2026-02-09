import path from "node:path";

// Resolve plugin from project root (cwd). Do not use import.meta.url: when
// Turbopack runs this config it executes a copy under .next/, so __dirname
// would point to .next/ and the plugin path would be wrong.
const pluginPath = path.resolve(process.cwd(), "postcss-source-resolve.mjs");

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    [pluginPath]: {},
    "@tailwindcss/postcss": {},
  },
};

export default config;
