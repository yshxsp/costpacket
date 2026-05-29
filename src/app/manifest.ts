import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CostPacket',
    short_name: 'CostPacket',
    description: 'Job-costed expense packets for small contractors',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#d97757',
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
