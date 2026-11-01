const CACHE_NAME = 'things-tracker-v16-local'; // Bump on every release so phones pick up the new index.html
const urlsToCache = [
    './',
    'index.html', // Explicitly cache index.html
    'manifest.json', // Cache the manifest file
    'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js'
];

self.addEventListener('install', function(event) {
    console.log('[Service Worker] Installing...');
    // Take over right away instead of waiting until every app window is closed
    // (an installed iPhone app almost never fully closes, so it would wait forever)
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('[Service Worker] Caching all content');
                return cache.addAll(urlsToCache);
            })
            .catch(function(error) {
                console.error('[Service Worker] Cache addAll failed:', error);
            })
    );
});

function cacheResponse(request, response) {
    if (response && response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
    }
    return response;
}

self.addEventListener('fetch', function(event) {
    if (event.request.method !== 'GET') return;

    // Pages: network first so a new deploy shows up immediately; cache only when offline
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request, { cache: 'no-store' })
                .then(response => cacheResponse(event.request, response))
                .catch(() => caches.match(event.request).then(cached => cached || caches.match('index.html')))
        );
        return;
    }

    // Everything else (icons, scripts): cache first, fill the cache from the network
    event.respondWith(
        caches.match(event.request)
            .then(function(cached) {
                return cached || fetch(event.request).then(response => cacheResponse(event.request, response));
            })
            .catch(function(error) {
                console.error('[Service Worker] Fetch failed:', error);
            })
    );
});

self.addEventListener('activate', function(event) {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // control already-open pages too
    );
});
