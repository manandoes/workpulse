import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the workspace root. Without this, Next walks up past the project and
    // picks up an unrelated lockfile outside the repository.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
