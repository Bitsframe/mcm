/** @type {import('next').NextConfig} */
const { codeInspectorPlugin } = require("code-inspector-plugin");
// next.config.js
nextConfig = {
  webpack: (config, { dev, isServer }) => {
    // Only enable in development mode
    if (dev) {
      config.plugins.push(
        codeInspectorPlugin({
          bundler: "webpack", // Next.js uses webpack
        }),
      );
    }
    return config;
  },
  images: {
    domains: [
      "vsvueqtgulraaczqnnvh.supabase.co", // Production domain
      "yktnfcrxtujyoabjtdff.supabase.co", // Staging domain
      "kxtbfmlatysaxjzppmti.supabase.co", // Child database domain
    ],
  },
  async rewrites() {
    return [
      {
        source: "/cronitor-api/:path*",
        destination: "https://cronitor.io/api/:path*", // Proxy to external API
      },
    ];
  },
};

module.exports = nextConfig;
