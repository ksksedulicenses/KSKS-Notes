// KSKS-Notes Service Worker - Offline Caching

const CACHE_NAME = "ksks-notes-cache-v1";
const urlsToCache = [
  "/index.html",
  "/style.css",
  "/app.js",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// --- Install ---
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("[ServiceWorker] Caching files");
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// --- Activate ---
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// --- Fetch ---
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).catch(() => {
        // Fallback offline
        if (event.request.mode === "navigate") {
          return caches.match("/index.html");
        }
      });
    })
  );
});
