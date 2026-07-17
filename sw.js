// Service Worker for 資金通帳 PWA
const CACHE = "cashflow-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon.svg"
];

// Install: cache all assets
self.addEventListener("install", ev => {
  ev.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first strategy (app shell), network-first for external
self.addEventListener("fetch", ev => {
  if (ev.request.method !== "GET") return;
  const url = new URL(ev.request.url);
  // Same-origin: cache first, fallback to network
  if (url.origin === self.location.origin) {
    ev.respondWith(
      caches.match(ev.request).then(cached => {
        if (cached) return cached;
        return fetch(ev.request).then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(ev.request, clone));
          return res;
        });
      })
    );
  }
  // Cross-origin: network first, no caching
});
