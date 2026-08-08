/* BOZHEMAN ≡ PROTOCOL - Service Worker v2.0 */

const CACHE_NAME = 'bozheman-cache-v2';
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
  './js/firebase-config.js',
  './js/manual_full.js',
  './js/engine/audio.js',
  './js/engine/constants.js',
  './js/engine/particles.js',
  './js/engine/reel.js',
  './manifest.json',
  './assets/images/gg.png',
  './assets/images/avatar.png',
  './assets/images/BNB.jpg',
  './assets/images/BTC.jpg',
  './assets/images/ETH.jpg',
  './assets/images/USDT.jpg',
  './assets/images/DM-LOGO.svg',
  './assets/images/CSGOEMPIRE-LOGO.svg',
  './assets/images/SWAPGG-LOGO.svg',
  './assets/audio/omega.m4a',
  './assets/audio/omega2.m4a'
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
