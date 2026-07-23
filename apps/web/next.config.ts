import type { NextConfig } from "next";

const config: NextConfig = {
  // The workspace packages ship TypeScript source rather than a build step.
  transpilePackages: ["@brs/core", "@brs/db"],
};

export default config;
