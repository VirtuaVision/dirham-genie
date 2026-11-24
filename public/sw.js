const CACHE_NAME = "dirham-genie-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Basic network-first strategy — always try the real network first (so
// deals/prices stay fresh), only falling back to cache if totally offline.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Never touch API calls (coupon codes, products, etc.) — they're live data
  // and must always come straight from the server, never from a saved copy.
  if (new URL(event.request.url).pathname.startsWith("/api/")) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
