// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js')

const firebaseConfig = {
  apiKey: "AIzaSyDECkcAsb6vfsOVg2-P08wLAQxrFs9TPls",
  authDomain: "yarverse-ai-app.firebaseapp.com",
  databaseURL: "https://yarverse-ai-app-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "yarverse-ai-app",
  storageBucket: "yarverse-ai-app.firebasestorage.app",
  messagingSenderId: "392795755966",
  appId: "1:392795755966:web:4c0035a6ffa4c119cb15ef",
  measurementId: "G-PSNKN7QBMF"
}

firebase.initializeApp(firebaseConfig)

const messaging = firebase.messaging()

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || 'SkillCame'
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/skillcame-app-faveicon.webp',
    badge: '/skillcame-app-faveicon.webp',
    image: payload.notification?.image,
    data: payload.data,
    tag: payload.data?.tag || 'skillcame-notification',
    requireInteraction: payload.data?.requireInteraction || false,
    vibrate: payload.data?.vibrate || [200, 100, 200],
    sound: payload.notification?.sound || '/notification-sound.mp3',
    actions: payload.data?.actions || []
  }

  return self.registration.showNotification(notificationTitle, notificationOptions)
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window/tab open with the target URL
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  // Track notification dismissal if needed
  console.log('Notification closed:', event.notification.tag)
})

