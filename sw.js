const CACHE_NAME = 'things-tracker-v14-local'; // Bump on every release so phones pick up the new index.html
const urlsToCache = [
    './',
    'index.html', // Explicitly cache index.html
    'manifest.json', // Cache the manifest file
    'https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.0/papaparse.min.js'
    // Firebase SDK URLs removed as data will be stored locally
];

self.addEventListener('install', function(event) {
    console.log('[Service Worker] Installing...');
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

self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches.match(event.request)
            .then(function(response) {
                if (response) {
                    return response; // Return cached asset
                }
                return fetch(event.request) // Fetch from network if not in cache
                    .then(function(response) {
                        // Optional: Cache new responses
                        return caches.open(CACHE_NAME).then(function(cache) {
                            cache.put(event.request, response.clone());
                            return response;
                        });
                    })
                    .catch(function(error) {
                        console.error('[Service Worker] Fetch failed:', error);
                        // You could return an offline page here
                        // return caches.match('/offline.html');
                    });
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
        })
    );
});
