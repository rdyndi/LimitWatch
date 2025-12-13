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

try {
  firebase.initializeApp(firebaseConfig);
} catch(e) {
  // Ignore if already initialized
}

const messaging = firebase.messaging();

// Handler notifikasi background
messaging.onBackgroundMessage((payload) => {
  console.log('[service-worker.js] Received background message ', payload);
  
  const notificationTitle = payload.notification ? payload.notification.title : 'Notifikasi LimitWatch';
  const notificationOptions = {
    body: payload.notification ? payload.notification.body : 'Pesan baru masuk.',
    icon: '/favicon.ico', 
    badge: '/favicon.ico'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// --- Logika PWA Caching ---

const CACHE_NAME = "limitwatch-cache-v3"; 
// Menggunakan path relatif agar aman di berbagai struktur URL
const urlsToCache = [
  "./",
  "./index.html",
  "./manifest.json"
];

// Install Service Worker
self.addEventListener("install", (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((err) => {
        console.warn("Pre-fetch cache failed, continuing...", err);
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
  self.clients.claim(); 
});

// Fetch Strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Network Only untuk API
  if (
    url.hostname.includes("firebase") ||
    url.hostname.includes("googleapis.com") ||
    url.hostname.includes("googleusercontent.com") ||
    url.hostname.includes("identitytoolkit")
  ) {
    return; 
  }

  // Stale-While-Revalidate untuk aset
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (networkResponse.type === "basic" || networkResponse.type === "cors")
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
         // Network failed
      });

      return cachedResponse || fetchPromise;
    })
  );
});