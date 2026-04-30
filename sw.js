// Doula Field Guide — Service Worker
// Cache-first strategy for offline access in the field

const CACHE_NAME = 'doula-field-guide-v1';

// Core assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json'
];

// Module URLs to cache on first visit
const MODULE_PATTERN = /\/modules\/m\d{2}-.*\.html$/;
const ESSAY_PATTERN = /\/essays\/.*\.html$/;

// Install: pre-cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first for modules/essays/styles, network-first for others
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Cache-first for modules, essays, styles, and cached assets
  if (
    MODULE_PATTERN.test(url.pathname) ||
    ESSAY_PATTERN.test(url.pathname) ||
    url.pathname.endsWith('.css') ||
    url.pathname === '/' ||
    url.pathname === '/index.html'
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
