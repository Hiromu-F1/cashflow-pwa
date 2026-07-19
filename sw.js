// Service Worker for 資金通帳 PWA
// ★ デプロイ時はこのバージョンを上げること (CLAUDE.md 参照)
const CACHE = "cashflow-v7";

// プリキャッシュ対象 (cache-first で提供するアセット)
const STATIC_ASSETS = [
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon.svg"
];

// Install: 静的アセットをプリキャッシュし、即時アクティベート
self.addEventListener("install", ev => {
  ev.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate: 古いキャッシュを全削除し、即時クライアントを制御
self.addEventListener("activate", ev => {
  ev.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: HTML は network-first、その他は cache-first
self.addEventListener("fetch", ev => {
  if (ev.request.method !== "GET") return;
  const url = new URL(ev.request.url);
  if (url.origin !== self.location.origin) return;

  const isHTML = ev.request.destination === "document"
    || url.pathname.endsWith(".html")
    || url.pathname === "/"
    || url.pathname.endsWith("/");

  if (isHTML) {
    // Network-first: 常に最新 HTML を取得、オフライン時のみキャッシュにフォールバック
    ev.respondWith(
      fetch(ev.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(ev.request, clone));
          return res;
        })
        .catch(() => caches.match(ev.request))
    );
  } else {
    // Cache-first: キャッシュ優先、なければネットワーク取得してキャッシュに追加
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
});
