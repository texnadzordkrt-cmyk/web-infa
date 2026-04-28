const CACHE_VERSION = 'v6';
const CACHE_NAME = `infa-cache-${CACHE_VERSION}`;

// Исправленные пути с учётом подпапки testSV
const urlsToCache = [
  '/testSV/',
  '/testSV/index.html',
  '/testSV/favicon-32x32.png',
  '/testSV/favicon-16x16.png',
  '/testSV/apple-touch-icon.png',
  '/testSV/android-chrome-192x192.png',
  '/testSV/android-chrome-512x512.png',
  '/testSV/logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request).then(fetchResponse => {
          if (!fetchResponse || fetchResponse.status !== 200) return fetchResponse;
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return fetchResponse;
        });
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) return caches.delete(name);
        })
      );
    }).then(() => self.clients.claim())
  );
});
