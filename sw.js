// Автоматическое определение базового пути

const basePath = self.location.pathname.replace('sw.js', '');
const CACHE_VERSION = 'v.30.04';  // Измените версию при обновлении
const CACHE_NAME = `infa-cache-${CACHE_VERSION}`;

// Файлы для кеширования
const urlsToCache = [
  basePath,
  basePath + 'index.html',
  basePath + 'favicon-32x32.png',
  basePath + 'favicon-16x16.png',
  basePath + 'apple-touch-icon.png',
  basePath + 'android-chrome-192x192.png',
  basePath + 'android-chrome-512x512.png',
  basePath + 'logo.png'
];

// INSTALL - кешируем файлы
self.addEventListener('install', event => {
  console.log('[SW] Installing new version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Добавляем каждый файл индивидуально, чтобы один неудачный не ломал всё
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(e => console.warn(`[SW] Failed to cache ${url}:`, e))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// FETCH - стратегия: для HTML - network first, для остального - cache first
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Для HTML-страниц - сначала сеть, потом кеш (чтобы всегда видеть свежие данные)
  if (url.pathname === basePath || url.pathname === basePath + 'index.html') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Кешируем свежую версию
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  
  // Для статических файлов - сначала кеш, потом сеть
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(fetchResponse => {
          if (!fetchResponse || fetchResponse.status !== 200) {
            return fetchResponse;
          }
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return fetchResponse;
        });
      })
  );
});

// ACTIVATE - удаляем старые кеши
self.addEventListener('activate', event => {
  console.log('[SW] Activating new version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});
