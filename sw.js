const CACHE_NAME = "plantguard-v1";
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
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

  // Pentru ESP/local: network only (fără cache) ca să nu strice provisioning
  if (isLocalDevice) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Restul: cache-first (cum ai tu)
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});