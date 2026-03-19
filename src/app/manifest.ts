import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BuildOps Lite',
    short_name: 'BuildOps',
    description: 'B2B SaaS platform for construction management',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#f97316',
    icons: [
      {
        src: '/icon.svg',
        sizes: '192x192 512x512',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  }
}
