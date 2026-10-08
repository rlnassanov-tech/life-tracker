// Service worker «Ритма». Нужен, чтобы приложение устанавливалось на телефон
// и не показывало пустой экран без сети. Данные (записи, вода…) всегда идут с сервера.
const CACHE = "ritm-v1"
const OFFLINE_URL = "/offline.html"

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)))
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  // Удаляем кэши старых версий
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return // server actions (POST) не трогаем
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Статика Next.js и иконки не меняются (в имени хэш) — сначала кэш
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone()
            caches.open(CACHE).then((cache) => cache.put(request, copy))
            return response
          })
      )
    )
    return
  }

  // Страницы — всегда из сети; без сети показываем заглушку
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
  }
})
