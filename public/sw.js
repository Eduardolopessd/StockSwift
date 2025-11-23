const CACHE_NAME = "stockswift-v1"
const URLS_TO_CACHE = ["/", "/manifest.json", "/offline.html"]

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing...")
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching core files")
        // Tenta cachear, mas não falha se algum arquivo não existir
        return Promise.allSettled([cache.add("/"), cache.add("/manifest.json")])
      })
      .then(() => {
        console.log("[Service Worker] Installed")
        return self.skipWaiting()
      }),
  )
})

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating...")
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => {
              console.log("[Service Worker] Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }),
        )
      })
      .then(() => {
        console.log("[Service Worker] Activated")
        return self.clients.claim()
      }),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignora extensões e dados
  if (url.protocol === "chrome-extension:" || request.url.includes("blob:")) {
    return
  }

  if (request.method === "GET") {
    event.respondWith(
      // Tenta cache primeiro
      caches
        .match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            console.log("[Service Worker] Served from cache:", request.url)
            return cachedResponse
          }

          // Se não tem cache, tenta fetch da rede
          return fetch(request)
            .then((response) => {
              // Se conseguiu fetch e é válido, cacheia
              if (!response || response.status !== 200 || response.type === "error") {
                return response
              }

              const responseToCache = response.clone()
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseToCache)
                console.log("[Service Worker] Cached:", request.url)
              })

              return response
            })
            .catch((error) => {
              console.log("[Service Worker] Fetch failed, returning cached version:", error)
              // Se falhar a rede e não tiver cache, retorna página offline
              return caches.match(request).catch(() => {
                if (request.destination === "document") {
                  return (
                    caches.match("/") ||
                    new Response("Offline - Por favor, recarregue quando tiver conexão", {
                      status: 503,
                      statusText: "Service Unavailable",
                    })
                  )
                }
              })
            })
        }),
    )
  }
})

// Sincroniza quando volta online
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SYNC_ONLINE",
            online: true,
          })
        })
      }),
    )
  }
})
