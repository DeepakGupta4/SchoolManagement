import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NEXT_API_URL has no NEXT_PUBLIC_ prefix, so Next will not inline it into the
  // browser bundle on its own. Listing it here does that explicitly — the value
  // is read at build time, so changing it needs a rebuild, not just a restart.
  env: {
    NEXT_API_URL: process.env.NEXT_API_URL,
  },
};

export default nextConfig;
