
const CACHE_NAME = "limitwatch-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Install Service Worker
self.addEventListener("install", (event) => {
  self.skipWaiting(); // Force waiting service worker to become active
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache critical assets
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate Service Worker
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim(); // Take control of all clients immediately
});

// Fetch Strategy: Stale-While-Revalidate for assets, Network Only for APIs
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Network Only for Firebase/Google APIs
  // Kita tidak ingin me-cache request database/auth karena harus real-time
  if (
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("googleusercontent.com") ||
    url.hostname.includes("identitytoolkit")
  ) {
    return; // Biarkan browser menangani request ini secara normal (network)
  }

  // 2. Cache First / Stale-While-Revalidate for Assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Jika ada di cache, kembalikan segera
      if (cachedResponse) {
        // (Optional) Background update: fetch new version and update cache
        // fetch(event.request).then((networkResponse) => {
        //   if(networkResponse && networkResponse.status === 200) {
        //      caches.open(CACHE_NAME).then((cache) => {
        //          cache.put(event.request, networkResponse.clone());
        //      });
        //   }
        // }).catch(() => {});
        
        return cachedResponse;
      }

      // Jika tidak ada di cache, ambil dari network
      return fetch(event.request).then((response) => {
        // Cek jika response valid
        if (
          !response ||
          response.status !== 200 ||
          (response.type !== "basic" && response.type !== "cors")
        ) {
          return response;
        }

        // Clone response karena stream hanya bisa dikonsumsi sekali
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});
