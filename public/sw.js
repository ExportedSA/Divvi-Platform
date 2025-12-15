/**
 * Lendit Service Worker
 * Handles offline caching for PWA functionality
 */

const CACHE_NAME = 'lendit-v1'
const OFFLINE_URL = '/offline'

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/field/today',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// API routes to cache with network-first strategy
const API_CACHE_ROUTES = [
  '/api/bookings',
  '/api/messages',
  '/api/listings',
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name)
            return caches.delete(name)
          })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  // API requests - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Static assets and pages - cache first, network fallback
  event.respondWith(cacheFirstStrategy(request))
})

// Network first strategy (for API calls)
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Try cache if network fails
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline JSON for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        offline: true,
        message: 'You are currently offline. Data shown may be outdated.' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Cache first strategy (for static assets)
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    // Return cached response and update cache in background
    fetchAndCache(request)
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match(OFFLINE_URL)
      if (offlineResponse) return offlineResponse
    }
    
    throw error
  }
}

// Background fetch and cache update
async function fetchAndCache(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
  } catch (error) {
    // Silently fail - we already have cached version
  }
}

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: data.actions || [],
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const url = event.notification.data?.url || '/'

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-bookings') {
    event.waitUntil(syncBookings())
  } else if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages())
  } else if (event.tag === 'sync-photos') {
    event.waitUntil(syncPhotos())
  }
})

// Sync pending bookings
async function syncBookings() {
  try {
    const db = await openIndexedDB()
    const pendingBookings = await db.getAll('pending-bookings')
    
    for (const booking of pendingBookings) {
      try {
        await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(booking.data),
        })
        await db.delete('pending-bookings', booking.id)
      } catch (error) {
        console.error('[SW] Failed to sync booking:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Sync bookings failed:', error)
  }
}

// Sync pending messages
async function syncMessages() {
  try {
    const db = await openIndexedDB()
    const pendingMessages = await db.getAll('pending-messages')
    
    for (const message of pendingMessages) {
      try {
        await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.data),
        })
        await db.delete('pending-messages', message.id)
      } catch (error) {
        console.error('[SW] Failed to sync message:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Sync messages failed:', error)
  }
}

// Sync pending photos
async function syncPhotos() {
  try {
    const db = await openIndexedDB()
    const pendingPhotos = await db.getAll('pending-photos')
    
    for (const photo of pendingPhotos) {
      try {
        const formData = new FormData()
        formData.append('file', photo.blob)
        formData.append('bookingId', photo.bookingId)
        formData.append('type', photo.type)
        
        await fetch('/api/upload/checklist-photo', {
          method: 'POST',
          body: formData,
        })
        await db.delete('pending-photos', photo.id)
      } catch (error) {
        console.error('[SW] Failed to sync photo:', error)
      }
    }
  } catch (error) {
    console.error('[SW] Sync photos failed:', error)
  }
}

// Simple IndexedDB wrapper
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('lendit-offline', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      const db = request.result
      resolve({
        getAll: (store) => new Promise((res, rej) => {
          const tx = db.transaction(store, 'readonly')
          const req = tx.objectStore(store).getAll()
          req.onsuccess = () => res(req.result)
          req.onerror = () => rej(req.error)
        }),
        delete: (store, key) => new Promise((res, rej) => {
          const tx = db.transaction(store, 'readwrite')
          const req = tx.objectStore(store).delete(key)
          req.onsuccess = () => res()
          req.onerror = () => rej(req.error)
        }),
      })
    }
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains('pending-bookings')) {
        db.createObjectStore('pending-bookings', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('pending-messages')) {
        db.createObjectStore('pending-messages', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('pending-photos')) {
        db.createObjectStore('pending-photos', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('cached-bookings')) {
        db.createObjectStore('cached-bookings', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('cached-messages')) {
        db.createObjectStore('cached-messages', { keyPath: 'id' })
      }
    }
  })
}
