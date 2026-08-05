const CACHE_NAME = "habla-v18-lesson-layout-cleanup";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "./",
        "./index.html",
        "./css/styles.css",
        "./js/app.js",
        "./manifest.json"
        "./css/lesson-final-polish.css",
        "./js/lesson-content-fixes.js",
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
