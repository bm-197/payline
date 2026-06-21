import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@react-pdf/renderer"],
  // The PDF route reads bundled TTFs from disk; include them in the traced output.
  outputFileTracingIncludes: {
    "/i/[token]/pdf": ["./public/fonts/**"],
  },
};

export default nextConfig;
