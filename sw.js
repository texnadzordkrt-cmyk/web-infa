const CACHE_NAME = 'infa-pod-rukoi-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/apple-touch-icon.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/logo.png'
];

self.addEventListener('install', event => {
  console.log('[SW] Установка новой версии');
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
  console.log('[SW] Активация новой версии');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Удаляем старый кеш:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Отправляем сообщение о новой версии');
      // Отправляем сообщение ВСЕМ открытым вкладкам
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    }).then(clients => {
      clients.forEach(client => {
        client.postMessage({ 
          type: 'NEW_VERSION_AVAILABLE',
          version: CACHE_NAME,
          timestamp: Date.now()
        });
      });
      return self.clients.claim();
    })
  );
});
