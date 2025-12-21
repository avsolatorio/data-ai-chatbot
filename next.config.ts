import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
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
