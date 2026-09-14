import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Rewrites /api/* to the backend so we avoid CORS in browser during local dev
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
