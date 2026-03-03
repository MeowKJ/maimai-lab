import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // All pages are 'use client' SPAs — no SSR needed for pages
  // Route Handlers (image proxy) run on Edge Runtime
  images: {
    // Game assets are served via our own /assets route handler
    // next/image is only for local UI assets
    remotePatterns: [],
  },
}

export default nextConfig
