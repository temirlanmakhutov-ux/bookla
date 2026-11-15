import type { NextConfig } from "next";

// MVP uses the classic dynamic-rendering model (no Cache Components):
// almost every page depends on the database, the visitor's language cookie or the owner's session.
const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
