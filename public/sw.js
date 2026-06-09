const CACHE_NAME = "angy-v2";

self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(clients.claim());
});

self.addEventListener("fetch", e => {
  // Ne pas intercepter les requêtes Supabase
  if(e.request.url.includes("supabase.co")) return;
  
  e.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return fetch(e.request)
        .then(response => {
          // Sauvegarder dans le cache
          if(response.ok) {
            cache.put(e.request, response.clone());
          }
          return response;
        })
        .catch(() => {
          // Hors ligne → utiliser le cache
          return cache.match(e.request).then(cached => {
            return cached || cache.match("/");
          });
        });
    })
  );
});
