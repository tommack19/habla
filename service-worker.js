const CACHE_NAME = "habla-v3-chapter-art";
const ARTWORK_CACHE_NAME = "habla-artwork-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "./",
        "./index.html",
        "./css/styles.css",
        "./js/app.js",
        "./js/core/audio.js",
        "./manifest.json"
      ]);
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names
        .filter((name) => name !== CACHE_NAME && name !== ARTWORK_CACHE_NAME)
        .map((name) => caches.delete(name))
    ))
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isLocalDevelopment = url.hostname === "127.0.0.1" || url.hostname === "localhost";
  const isArtwork = event.request.destination === "image"
    && url.origin === self.location.origin
    && url.pathname.includes("/assets/images/");

  if (isArtwork && !isLocalDevelopment) {
    event.respondWith(
      caches.open(ARTWORK_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        const refresh = fetch(event.request).then((response) => {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        });
        if (cached) {
          event.waitUntil(refresh);
          return cached;
        }
        return refresh;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
