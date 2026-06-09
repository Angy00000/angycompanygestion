const CACHE_NAME = "angy-v1";
const URLS = ["/", "/index.html", "/src/main.jsx"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(c => c.addAll(URLS))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    fetch(e.request).catch(() =>
      caches.match(e.request).then(r => r || caches.match("/"))
    )
  );
});
