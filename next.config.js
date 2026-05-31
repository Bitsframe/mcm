/** @type {import('next').NextConfig} */
// next.config.js
nextConfig = {
    images: {
        domains: [
            'vsvueqtgulraaczqnnvh.supabase.co', // Production domain
            'yktnfcrxtujyoabjtdff.supabase.co',  // Staging domain
            'kxtbfmlatysaxjzppmti.supabase.co',   // Child database domain
            'lmoyyrzgdezwywxeariq.supabase.co'    // Current project Supabase storage
        ],
    },
    async rewrites() {
        return [
            {
                source: '/cronitor-api/:path*',
                destination: 'https://cronitor.io/api/:path*', // Proxy to external API
            },
        ];
    },
};

module.exports = nextConfig
