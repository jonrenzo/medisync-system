/** @type {import('next').NextConfig} */
const nextConfig = {
    eslint: {
        // ✅ Ignore ESLint errors during production builds
        ignoreDuringBuilds: true,
    },
    typescript: {
        // ✅ Skip type checking during production builds
        ignoreBuildErrors: true,
    },
}

module.exports = nextConfig
