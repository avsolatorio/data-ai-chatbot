import path from "node:path";
import type { NextConfig } from "next";

/** When set (e.g. "/app"), the app is served under that path. Must match NEXT_PUBLIC_BASE_PATH for client fetches. Trailing slash is stripped (Next.js rejects it). */
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  basePath: basePath || undefined,
  output: "standalone",
  async redirects() {
    const redirects: Array<{
      source: string;
      destination: string;
      basePath?: false;
      permanent: boolean;
    }> = [];
    if (basePath) {
      const basePathSegment = basePath.replace(/^\/+/, "");
      // Redirect / and unknown paths to basePath. Exclude known app routes (chat, api, etc.)
      // so that when an external proxy strips the path prefix, /chat/:id and /api/* still work.
      const excludeAppRoutes =
        "(?!chat/)(?!api/)(?!login)(?!register)(?!maintenance)(?!ping)(?!images/)(?!json/)(?!_next/)";
      redirects.push(
        { source: "/", destination: basePath, basePath: false, permanent: false },
        {
          source: `/:path((?!${basePathSegment}(?:/|$))${excludeAppRoutes}.*)*`,
          destination: basePath,
          basePath: false,
          permanent: false,
        },
      );
    }
    return redirects;
  },
  cacheComponents: true,
  async headers() {
    // Note: Full CSP with script-src (nonce-based) is set by proxy.ts for document routes.
    // Static assets get this minimal CSP; proxy adds script-src, style-src, etc. for pages.
    // CSP disabled by default. Set CSP_ENABLED=true or 1 to enable (proxy + config).
    const cspEnabled =
      process.env.CSP_ENABLED === "true" || process.env.CSP_ENABLED === "1";
    const securityHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      ...(cspEnabled
        ? [
            {
              key: "Content-Security-Policy",
              value: [
                "frame-ancestors 'none'",
                "form-action 'self'",
                "base-uri 'self'",
              ].join("; "),
            },
          ]
        : []),
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    ];
    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains; preload",
      });
    }

    // Cache-prevention for pages/API only (form caching mitigation)
    const cachePreventionHeaders = [
      { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, max-age=0" },
      { key: "Pragma", value: "no-cache" },
      { key: "Expires", value: "0" },
    ];

    return [
      // Static assets: security headers only; allow browser cache (better performance)
      { source: "/_next/static/:path*", headers: securityHeaders },
      // All other routes (pages, API, etc.): security + cache-prevention
      { source: "/:path*", headers: [...securityHeaders, ...cachePreventionHeaders] },
    ];
  },
  transpilePackages: [
    "@pcn-js/core",
    "@pcn-js/ui",
    "@pcn-js/data360",
    "streamdown",
  ],
  // Avoid embedding absolute build paths in client source maps (standalone output)
  productionBrowserSourceMaps: false,
  // Prevent path segments (e.g. WBG from /Users/.../WBG/...) from becoming folders in .next/standalone.
  outputFileTracingRoot: path.resolve(process.cwd()),
  images: {
    remotePatterns: [
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
