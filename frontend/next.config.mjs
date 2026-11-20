/** @type {import('next').NextConfig} */
const apiInternal = process.env.API_INTERNAL_URL || 'http://localhost:8088';

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8088',
        pathname: '/uploads/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiInternal}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiInternal}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
