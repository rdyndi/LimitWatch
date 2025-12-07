importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Inisialisasi Firebase di dalam Service Worker
const firebaseConfig = {
  apiKey: "AIzaSyALzhraAqiH0_50nOOIQUY1WZd9tStajB8",
  authDomain: "dompetcerdas-4490e.firebaseapp.com",
  projectId: "dompetcerdas-4490e",
  storageBucket: "dompetcerdas-4490e.firebasestorage.app",
  messagingSenderId: "720070434008",
  appId: "1:720070434008:web:f5b001e1455374e0798bad",
  measurementId: "G-Z6MRN5Z18X"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handler notifikasi background
messaging.onBackgroundMessage((payload) => {
  console.log('[service-worker.js] Received background message ', payload);
  
  const notificationTitle = payload.notification ? payload.notification.title : 'Notifikasi LimitWatch';
  const notificationOptions = {
    body: payload.notification ? payload.notification.body : 'Pesan baru masuk.',
    icon: '/favicon.ico', // Pastikan icon tersedia
    badge: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- Logika PWA Caching ---

const CACHE_NAME = "limitwatch-cache-v2";
// Menggunakan path relatif agar sesuai dengan origin
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
      return cache.addAll(urlsToCache).catch((err) => {
         console.warn("Pre-fetch cache failed", err);
      });
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
      }).catch(() => {
          // Fallback if network fails
      });
    })
  );
});