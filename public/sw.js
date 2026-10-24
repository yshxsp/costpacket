const CACHE = 'costpacket-public-v2'
const PUBLIC = new Set(['/', '/manifest.webmanifest'])
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...PUBLIC]))))
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('costpacket-') && key !== CACHE).map(key => caches.delete(key))))))
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url)
 if (event.request.method !== 'GET' || url.origin !== self.location.origin || !PUBLIC.has(url.pathname)) return
 event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(response => response || new Response('Offline', {status:503}))))
})
