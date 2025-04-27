/** @type {import('next').NextConfig} */
// next.config.js
nextConfig = {
    images: {
        domains: ['vsvueqtgulraaczqnnvh.supabase.co'],
    },
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'https://cronitor.io/api/:path*', // Proxy to external API
            },
        ];
    },
};


module.exports = nextConfig
