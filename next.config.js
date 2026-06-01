module.exports = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https:spiko-dev.apponward.com/routes/api/:path*', 
      },
    ]
  },
}


/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // ESLint checks ko ignore kar dega build aur dev ke time
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
