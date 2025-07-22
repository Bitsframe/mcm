/** @type {import('next').NextConfig} */
// next.config.js
nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // Ignore ESLint errors during build
  },
  typescript: {
    // ⚠  Danger zone
    // Build will succeed even when TypeScript errors exist.
    ignoreBuildErrors: true,
  },
  images: {
    domains: ["vsvueqtgulraaczqnnvh.supabase.co"],
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://cronitor.io/api/:path*", // Proxy to external API
      },
    ];
  },
};

module.exports = nextConfig;