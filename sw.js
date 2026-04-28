const CACHE_VERSION = 'v5';
const CACHE_NAME = `infa-cache-${CACHE_VERSION}`;
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/logo.png',
  '/notification.mp3'
];

self.addEventListener('install', event => {
  console.log('[SW] Установка версии:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Кэширование файлов');
        return cache.addAll(urlsToCache);
      })
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
  console.log('[SW] Активация версии:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Удаление старого кэша:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Отправка сообщения клиентам о новом кэше');
      return self.clients.matchAll();
    }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'NEW_VERSION_AVAILABLE',
          version: CACHE_VERSION,
          timestamp: Date.now()
        });
      });
      return self.clients.claim();
    })
  );
});

// Обработка сообщений от клиентов
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
