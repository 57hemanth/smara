import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages runtime configuration
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Environment variables for Cloudflare Pages
  env: {
    CF_PAGES: process.env.CF_PAGES,
  },
};

export default nextConfig;
