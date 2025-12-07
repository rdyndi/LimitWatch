
// Mengimpor script Firebase versi Compat agar bisa berjalan di Worker Context via CDN
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

// Konfigurasi Firebase Anda (Sama seperti di services/firebase.ts)
const firebaseConfig = {
  apiKey: "AIzaSyALzhraAqiH0_50nOOIQUY1WZd9tStajB8",
  authDomain: "dompetcerdas-4490e.firebaseapp.com",
  projectId: "dompetcerdas-4490e",
  storageBucket: "dompetcerdas-4490e.firebasestorage.app",
  messagingSenderId: "720070434008",
  appId: "1:720070434008:web:f5b001e1455374e0798bad",
  measurementId: "G-Z6MRN5Z18X"
};

// Initialize Firebase dalam Service Worker
firebase.initializeApp(firebaseConfig);

// Initialize Messaging
const messaging = firebase.messaging();

// Handler untuk pesan yang diterima saat aplikasi sedang di background atau tertutup
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Customisasi judul dan body notifikasi jika payload data tersedia
  // Namun, jika mengirim via "Notifications" di Firebase Console, SDK otomatis menampilkannya
  // Handler ini berguna jika Anda mengirim "Data Messages"
  const notificationTitle = payload.notification ? payload.notification.title : 'Notifikasi LimitWatch';
  const notificationOptions = {
    body: payload.notification ? payload.notification.body : 'Anda memiliki pesan baru.',
    icon: './icon-192x192.png', // Pastikan icon tersedia, atau gunakan default
    badge: './icon-192x192.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
