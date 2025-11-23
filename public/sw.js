const CACHE_NAME = "stockswift-v1"
const URLS_TO_CACHE = ["/", "/index.html", "/offline.html"]

// Instalar Service Worker e cachear arquivos
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Cacheando arquivos...")
        return cache.addAll(URLS_TO_CACHE).catch((err) => {
          console.log("[Service Worker] Erro ao cachear:", err)
        })
      })
      .then(() => self.skipWaiting()),
  )
})

// Ativar Service Worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("[Service Worker] Removendo cache antigo:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => self.clients.claim()),
  )
})

// Estratégia: Network First, fallback para Cache
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip chrome extensions e dados base64
  if (url.protocol === "chrome-extension:" || request.url.includes("blob:")) {
    return
  }

  // Para requisições GET
  if (request.method === "GET") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache válido apenas se status 200
          if (response.status === 200) {
            const cache = caches.open(CACHE_NAME)
            cache.then((c) => c.put(request, response.clone()))
          }
          return response
        })
        .catch(() => {
          // Se falhar, tenta cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Se não tiver cache, retorna página offline
            if (request.destination === "document") {
              return caches.match("/offline.html")
            }
          })
        }),
    )
  }
})

// Sincronizar dados quando voltar online
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-data") {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SYNC_ONLINE",
            online: navigator.onLine,
          })
        })
      }),
    )
  }
})
