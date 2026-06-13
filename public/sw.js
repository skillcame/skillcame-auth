// ======================================================
// SkillCame PWA Service Worker - PRODUCTION READY (HYBRID REDIRECT RESOLVER)
// Version: 2.3.0 (Fixed All Route Crashes & Offline Fallback)
// ======================================================

const APP_NAME = 'SkillCame'

// Cache versions
const STATIC_CACHE = `${APP_NAME.toLowerCase()}-static-v2.3.0`
const DYNAMIC_CACHE = `${APP_NAME.toLowerCase()}-dynamic-v2.3.0`
const IMAGE_CACHE = `${APP_NAME.toLowerCase()}-images-v2.3.0`
const API_CACHE = `${APP_NAME.toLowerCase()}-api-v2.3.0`

const OFFLINE_PAGE = '/offline.html'

// ==============================
// SAFE PRECACHE LIST (including SPA shell)
// ==============================
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json'
]

// ==============================
// ROUTES
// ==============================
const LMS_ROUTES = [
  /^\/user\/courses/,
  /^\/user\/lessons/,
  /^\/user\/dashboard/,
  /^\/ai-chat/,
  /^\/user\/marketplace/,
  /^\/dashboard/,
  /^\/profile/
]

// ==============================
// SAFE REQUEST CHECK
// ==============================
const isValidRequest = (request) => {
  try {
    const url = request.url
    return (
      request.method === 'GET' &&
      url.startsWith('http') &&
      !url.startsWith('chrome-extension') &&
      !url.startsWith('moz-extension') &&
      !url.startsWith('edge-extension')
    )
  } catch {
    return false
  }
}

// ======================================================
// INSTALL (Never Fails)
// ======================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...')
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset)
          console.log(`[SW] Cached: ${asset}`)
        } catch (err) {
          console.warn(`[SW] Could not cache ${asset}:`, err)
        }
      }
    }).then(() => self.skipWaiting())
  )
})

// ======================================================
// ACTIVATE
// ======================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...')
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (![STATIC_CACHE, DYNAMIC_CACHE, IMAGE_CACHE, API_CACHE].includes(key)) {
            console.log('[SW] Deleted old cache:', key)
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// ======================================================
// FETCH (with safe handlers)
// ======================================================
self.addEventListener('fetch', (event) => {
  const request = event.request
  if (!isValidRequest(request)) return

  const url = new URL(request.url)

  // Images
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE))
    return
  }

  // API / Firebase
  if (url.pathname.startsWith('/api/') || 
      url.hostname.includes('firebase') || 
      url.hostname.includes('supabase')) {
    event.respondWith(networkFirst(request, API_CACHE))
    return
  }

  // Static assets (JS, CSS, fonts)
  if (['script', 'style', 'font'].includes(request.destination)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE))
    return
  }

  // Navigation (pages) - check first to ensure SPA reloads always fallback to index.html shell
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request))
    return
  }

  // LMS internal routes
  if (LMS_ROUTES.some(r => r.test(url.pathname))) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE))
    return
  }
})

// ======================================================
// HANDLERS (FULLY SAFE & HEALED OF REDIRECTS)
// ======================================================

async function cleanResponse(response) {
  if (!response) {
    return response
  }
  if (!response.redirected) {
    return response
  }
  try {
    const blob = await response.blob()
    return new Response(blob, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    })
  } catch (err) {
    console.warn('[SW] Fallback cleaning of redirected response:', err)
    return response
  }
}

async function navigationHandler(request) {
  // Client-Side SPA Routing Rule:
  // For any page navigation request, always serve the cached /index.html SPA master shell.
  // This allows React Router to load and take over routing natively in the browser without network latency or 404s.
  try {
    const staticCache = await caches.open(STATIC_CACHE)
    const cachedShell = await staticCache.match('/index.html') || await staticCache.match('/')
    if (cachedShell) {
      return await cleanResponse(cachedShell)
    }
  } catch (err) {
    console.warn('[SW] Navigation shell matches failed, fallback to network:', err)
  }

  // Fallback: If not in cache, fetch /index.html from the network
  try {
    const response = await fetch('/')
    if (response && response.ok) {
      const safeResponse = await cleanResponse(response)
      try {
        const cache = await caches.open(STATIC_CACHE)
        cache.put('/index.html', safeResponse.clone())
      } catch (cpErr) {
        console.warn('[SW] Failed to cache freshly fetched shell:', cpErr)
      }
      return safeResponse
    }
  } catch (err) {
    console.warn('[SW] Fetching index shell failed:', err)
  }

  // Dynamic backup rescue shell
  return new Response(
    `<!DOCTYPE html>
     <html lang="en">
       <head>
         <meta charset="UTF-8">
         <title>SkillCame</title>
       </head>
       <body style="background-color:#050505;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
         <div style="text-align:center;">
           <h3 style="color:#ffffff;margin-bottom:8px;">SkillCame</h3>
           <p style="margin-bottom:15px;color:#a3a3a3;">Initializing platform shell...</p>
           <script>
             window.location.href = "/";
           </script>
         </div>
       </body>
     </html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
}

async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)
    if (cached) {
      return await cleanResponse(cached)
    }

    const response = await fetch(request)
    if (response && response.ok) {
      const safeResponse = await cleanResponse(response)
      cache.put(request, safeResponse.clone())
      return safeResponse
    }
    return response
  } catch {
    return new Response('', { status: 404 })
  }
}

async function networkFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName)
    const response = await fetch(request)
    if (response && response.ok) {
      const safeResponse = await cleanResponse(response)
      cache.put(request, safeResponse.clone())
      return safeResponse
    }
    throw new Error('Network failed')
  } catch {
    const cache = await caches.open(cacheName)
    const cached = await cache.match(request)
    if (cached) {
      return await cleanResponse(cached)
    }
    return new Response(
      JSON.stringify({ success: false, offline: true, message: 'You are offline' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  const fetchPromise = fetch(request).then(async (res) => {
    if (res && res.ok) {
      const safeResponse = await cleanResponse(res)
      cache.put(request, safeResponse.clone())
      return safeResponse
    }
    return res
  }).catch(() => null)

  if (cached) {
    return await cleanResponse(cached)
  }
  return fetchPromise
}

// ======================================================
// PUSH NOTIFICATIONS
// ======================================================
self.addEventListener('push', (event) => {
  let data = {
    title: 'SkillCame',
    body: 'New update available!',
    icon: '/skillcame-app-faveicon.webp',
    badge: '/skillcame-app-faveicon.webp',
    data: { url: '/' }
  }
  try {
    if (event.data) {
      const json = event.data.json()
      data = { ...data, ...json }
    }
  } catch {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: 'skillcame',
      data: data.data
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))))
  }
})

// ======================================================
// INTEGRATED FIREBASE MESSAGING BACKGROUND SERVICE WORKER
// ======================================================
try {
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
    console.log('[SW] Background notification received:', payload)
    const notificationTitle = payload.notification?.title || 'SkillCame'
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new learning update',
      icon: '/skillcame-app-faveicon.webp',
      badge: '/skillcame-app-faveicon.webp',
      image: payload.notification?.image || '/skillcame.webp',
      data: payload.data,
      tag: payload.data?.tag || 'skillcame-notification',
      requireInteraction: payload.data?.requireInteraction === 'true' || payload.data?.requireInteraction === true,
      vibrate: [200, 100, 200],
      actions: payload.data?.actions || []
    }

    return self.registration.showNotification(notificationTitle, notificationOptions)
  })

  // Handle background notification clicks
  self.addEventListener('notificationclick', (event) => {
    event.notification.close()
    const urlToOpen = event.notification.data?.url || '/'
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Focus existing open window with the matching URL if possible
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i]
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus()
          }
        }
        // Fallback: Open a brand new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      })
    )
  })
} catch (err) {
  console.warn('[SW] Firebase messaging SDK script import or initialization skipped in offline mode:', err)
}

