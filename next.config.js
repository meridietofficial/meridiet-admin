/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://api.meridiet.com/api/v1/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
