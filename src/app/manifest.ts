import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CostPacket',
    short_name: 'CostPacket',
    description: 'Job-costed expense packets for small contractors',
    start_url: '/',
    display: 'standalone',
    background_color: '#f1ece1',
    theme_color: '#1b1a16',
    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
