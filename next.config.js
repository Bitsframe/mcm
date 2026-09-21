/** @type {import('next').NextConfig} */
// next.config.js
nextConfig = {
    compiler: {
        /**
         * Strip debug logging from production builds.
         *
         * This app logs patient payloads, DOB searches and API responses at
         * `console.log`. Client-side those land in the browser console, readable
         * by anyone with devtools or any installed extension; server-side they
         * land in the deployment's log stream. Neither is a place for patient
         * data.
         *
         * `error` and `warn` are kept — they carry no payloads here and are what
         * makes a production failure diagnosable at all.
         *
         * Dev builds are untouched, so local debugging still works.
         *
         * NOTE: this is honoured by **webpack only**. Next 16 defaults to
         * Turbopack, which ignores it silently — verified by building both ways
         * and grepping the output. `build` therefore passes `--webpack`.
         * Removing that flag re-exposes every remaining console.log in
         * production. The durable fix is deleting them from source, at which
         * point the flag can go.
         */
        removeConsole:
            process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
    },
    images: {
        // `domains` is deprecated: it matches a bare hostname with no scheme or
        // path constraint. `remotePatterns` pins both, so a host cannot be used
        // to serve arbitrary paths over plain HTTP.
        remotePatterns: [
            { protocol: 'https', hostname: 'vsvueqtgulraaczqnnvh.supabase.co', pathname: '/**' },  // Production domain
            { protocol: 'https', hostname: 'yktnfcrxtujyoabjtdff.supabase.co', pathname: '/**' },  // Staging domain
            { protocol: 'https', hostname: 'kxtbfmlatysaxjzppmti.supabase.co', pathname: '/**' },  // Child database domain
            { protocol: 'https', hostname: 'lmoyyrzgdezwywxeariq.supabase.co', pathname: '/**' },  // Current project Supabase storage
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
