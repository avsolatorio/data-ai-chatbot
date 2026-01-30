import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  cacheComponents: true,
  // Avoid embedding absolute build paths in client source maps (standalone output)
  productionBrowserSourceMaps: false,
  // Prevent path segments (e.g. WBG from /Users/.../WBG/...) from becoming folders in .next/standalone.
  // Run `pnpm build` from the frontend directory so cwd is the project root.
  outputFileTracingRoot: path.resolve(process.cwd()),
  images: {
    remotePatterns: [
      {
        hostname: "avatar.vercel.sh",
      },
      {
        protocol: "https",
        //https://nextjs.org/docs/messages/next-image-unconfigured-host
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
  // Allow build to continue even if Google Fonts are unreachable (e.g., in Docker behind firewall)
  // Fonts will fall back to system fonts if fetch fails
  experimental: {
    optimizePackageImports: ["next/font/google"],
  },
};

export default nextConfig;
