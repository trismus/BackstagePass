/**
 * Version and build information utilities
 */

// Version from package.json (set at build time)
export const APP_VERSION = process.env.npm_package_version || '0.1.0'

// Git commit hash (set via environment variable in Vercel or CI)
export const COMMIT_HASH = process.env.VERCEL_GIT_COMMIT_SHA || process.env.COMMIT_SHA || null

// Build timestamp
export const BUILD_TIME = process.env.BUILD_TIME || null

// Environment
export const ENVIRONMENT = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development'

export interface VersionInfo {
  version: string
  commitHash: string | null
  buildTime: string | null
  environment: string
}

export function getVersionInfo(): VersionInfo {
  return {
    version: APP_VERSION,
    commitHash: COMMIT_HASH,
    buildTime: BUILD_TIME,
    environment: ENVIRONMENT,
  }
}
