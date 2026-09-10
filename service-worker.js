const CACHE_NAME = "habla-v32-chapter-one-cinematic-tutor";
const ARTWORK_CACHE_NAME = "habla-artwork-v3";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "./",
        "./index.html",
        "./css/design-system.css",
        "./css/styles.css",
        "./css/lesson.css",
        "./js/app.js",
        "./js/core/appRoute.js",
        "./js/ui/lesson.js",
        "./js/core/lessonMotion.js",
        "./js/core/audio.js",
        "./content/A1/lesson-01-greetings.json",
        "./content/A1/lesson-02-introductions.json",
        "./js/core/tutor.js",
        "./js/core/tutorVoice.js",
        "./js/ui/tutorFeedback.js",
        "./js/ui/carlos.js",
        "./css/carlos.css",
        "./content/A1/lesson-03-family.json",
        "./content/A1/lesson-04-numbers-time.json",
        "./content/A1/lesson-05-shopping.json",
        "./content/A1/lesson-06-food-drinks.json",
        "./content/A1/lesson-07-travel-basics.json",
        "./content/A1/lesson-08-vacation.json",
        "./content/A1/lesson-09-around-the-house.json",
        "./content/A1/lesson-10-daily-routine.json",
        "./manifest.json"
      ]);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names
        .filter((name) => name !== CACHE_NAME && name !== ARTWORK_CACHE_NAME)
        .map((name) => caches.delete(name))
    )).then(() => self.clients.claim())
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

  const isAppResource = url.origin === self.location.origin && (
    event.request.mode === "navigate"
    || ["document", "script", "style"].includes(event.request.destination)
    || /\.(?:json|webmanifest)$/i.test(url.pathname)
  );

  if (isAppResource) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(event.request);
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        } catch {
          return (await cache.match(event.request))
            || (event.request.mode === "navigate" ? cache.match("./index.html") : Promise.reject(new Error("Offline resource unavailable")));
        }
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
