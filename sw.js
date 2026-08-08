/* BOZHEMAN ≡ PROTOCOL - Service Worker v1.0 */

const CACHE_NAME = 'bozheman-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './games.html',
  './roulet.html',
  './refer.html',
  './doubleindex.html',
  './grower_manual.html',
  './css/main.css',
  './css/neon.css',
  './css/games.css',
  './css/roulet.css',
  './css/refer.css',
  './css/doubleindex.css',
  './js/index.js',
  './js/games.js',
  './js/roulette.js',
  './js/refer.js',
  './js/doubleindex.js',
  './js/matrix.js',
  './js/i18n.js',
  './js/state.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch fresh copy in background
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
