import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Штатный редирект Next на несовпадение trailing slash всегда отдаёт 308.
  // Отключаем его и делаем то же самое в middleware.ts честным 301.
  skipTrailingSlashRedirect: true,
}

export default nextConfig
