const CACHE_NAME = 'buildops-lite-cache-v1'
const urlsToCache = [
  '/',
  '/manifest.webmanifest',
  '/icon.svg',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache)
      })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached response if found
        if (response) {
          return response
        }
        // Else fetch from network
        return fetch(event.request).catch(() => {
          // If network fetch fails (offline) and it's a navigation request
          if (event.request.mode === 'navigate') {
             // Return fallback page or root if needed
             // Let's just catch and fail gracefully for now.
             return caches.match('/')
          }
        })
      })
  )
})

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME]
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})
