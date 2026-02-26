const CACHE_NAME = "plantguard-v2"; // 👈 schimbă versiunea când faci update
const ASSETS = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.webmanifest",
  "./favicon.png",
  "./favicon.svg",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting(); // 👈 activează noul SW imediat
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
      await self.clients.claim(); // 👈 preia controlul imediat peste pagini
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  const isLocalDevice =
    url.hostname === "192.168.4.1" ||
    url.hostname.startsWith("192.168.") ||
    url.pathname === "/data" ||
    url.pathname === "/scan" ||
    url.pathname === "/save";

  // Pentru ESP/local: network only (fără cache)
  if (isLocalDevice) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Restul: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});