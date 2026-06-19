import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Mounted under the unified portfolio domain at this sub-path (multi-zones).
  // Must stay in sync with BASE_PATH in src/lib/base.ts.
  basePath: "/live/signaldesk",
  // Pin the Turbopack root to this project so a stray parent lockfile doesn't
  // get picked up as the workspace root.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
