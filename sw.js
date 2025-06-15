const CACHE_NAME = 'ai-school-v1.0.0';
const urlsToCache = [
  '/',
  '/styles/main.css',
  '/styles/components.css',
  '/scripts/main.js',
  '/scripts/storage.js',
  '/scripts/lesson-manager.js',
  '/scripts/ui-manager.js',
  '/scripts/video-player.js',
  '/scripts/utils.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        return response || fetch(event.request);
      })
  );
});