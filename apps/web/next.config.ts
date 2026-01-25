import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Aktiviere strikte React-Checks
  reactStrictMode: true,

  // Experimentelle Features für Next.js 15
  experimental: {
    // Type-safe Server Actions
    typedRoutes: true,
  },

  // Bilder von Supabase Storage erlauben (für später)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
