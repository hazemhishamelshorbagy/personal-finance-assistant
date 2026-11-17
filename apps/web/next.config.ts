import type { NextConfig } from "next";

// إعدادات البناء والتوجيه التجريبي الخاصة بتطبيق الويب.
const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // تمرير ملفات CSS عبر محمل Tailwind أثناء البناء باستخدام Turbopack.
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
