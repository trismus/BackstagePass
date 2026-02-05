import type { NextConfig } from 'next'

// Security Headers for DSGVO & OWASP compliance
const securityHeaders = [
  {
    // Prevent clickjacking attacks
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    // Prevent MIME type sniffing
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    // Enable XSS filter in older browsers
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    // Control referrer information
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // HTTP Strict Transport Security (HSTS)
    // max-age: 1 year, includeSubDomains, preload
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    // Permissions Policy (formerly Feature-Policy)
    // Restrict access to sensitive browser features
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    // Content Security Policy
    // Note: Adjust as needed for your specific requirements
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
      "style-src 'self' 'unsafe-inline'", // Required for Tailwind
      "img-src 'self' data: blob: https://*.supabase.co",
      "font-src 'self'",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  // Aktiviere strikte React-Checks
  reactStrictMode: true,

  // Experimentelle Features fuer Next.js 15
  experimental: {
    // Type-safe Server Actions
    typedRoutes: true,
  },

  // Security Headers fuer alle Routen
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },

  // Bilder von Supabase Storage erlauben
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
