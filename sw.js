const CACHE_NAME = 'shopx-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './cart.html',
  './checkout.html',
  './product.html',
  './orders.html',
  './styles/main.css',
  './styles/main.min.css',
  './scripts/app.js',
  './scripts/auth.js',
  './scripts/firebase-config.js'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching essential assets');
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Network First, fallback to Cache)
self.addEventListener('fetch', (e) => {
  // Ignore external API endpoints like Firebase or Unsplash
  if (e.request.url.includes('images.unsplash.com') || 
      e.request.url.includes('wsrv.nl') || 
      e.request.url.includes('firestore.googleapis.com')) {
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, resClone);
        });
        return res;
      })
      .catch(() => caches.match(e.request).then((res) => res))
  );
});
