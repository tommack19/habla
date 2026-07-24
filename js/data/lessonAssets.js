const CHAPTER_ONE_ROOT = "assets/images/episodes/chapter-01";
const LANDMARK_ROOT = "assets/images/landmarks";

const EPISODE_SLUGS = Object.freeze({
  1: "episode-01-first-coffee",
  2: "episode-02-a-new-friend",
  3: "episode-03-family-dinner",
  4: "episode-04-see-you-at-ten",
  5: "episode-05-fresh-fruit-and-fresh-spanish",
  6: "episode-06-coffee-break",
  7: "episode-07-walking-through-madrid",
  8: "episode-08-an-afternoon-at-home",
  9: "episode-09-a-typical-day",
  10: "episode-10-weekend-adventure",
});

const EPISODE_IDS = Object.freeze({
  1: "a1-lesson-01-greetings",
  2: "a1-lesson-02-introductions",
  3: "lesson-03-family",
  4: "lesson-04-numbers-time",
  5: "lesson-05-shopping",
  6: "lesson-06-food-drinks",
  7: "lesson-07-travel-basics",
  8: "lesson-08-vacation",
  9: "lesson-09-around-the-house",
  10: "lesson-10-daily-routine",
});

const EPISODE_LANDMARKS = Object.freeze({
  1: "cafe",
  2: "madrid",
  3: "apartment",
  4: "madrid",
  5: "mercado",
  6: "cafe",
  7: "plaza-mayor",
  8: "apartment",
  9: "apartment",
  10: "granada",
});

const HERO_ARTWORK = Object.freeze({
  1: "assets/images/lessons/lesson-01-greetings.png",
  2: "assets/images/lessons/lesson-02-introductions.png",
  3: "assets/images/lessons/lesson-03-family.png",
  4: "assets/images/lessons/lesson-04-numbers-time.png",
  5: "assets/images/lessons/lesson-05-shopping.png",
  6: "assets/images/lessons/lesson-06-food-drinks.png",
  7: "assets/images/lessons/lesson-07-travel.png",
  8: "assets/images/lessons/lesson-08-home.png",
  9: "assets/images/lessons/lesson-09-routine.png",
  10: "assets/images/lessons/lesson-10-finale.png",
});

const EPISODE_ALT_TEXT = Object.freeze({
  1: "Carlos holding a coffee in a Madrid café",
  2: "Carlos greeting a new friend in Madrid",
  3: "Carlos and his family sharing dinner",
  4: "Carlos making Saturday plans beside a clock and calendar",
  5: "Carlos shopping for fresh produce at Mercado de San Miguel",
  6: "Carlos holding an espresso beside a café machine",
  7: "Carlos walking through Plaza Mayor",
  8: "Carlos welcoming a guest into his Madrid apartment",
  9: "Carlos writing his daily routine at the kitchen table",
  10: "Carlos and a friend overlooking Granada at sunset",
});

export const CHAPTER_ARTWORK = Object.freeze({
  chapterId: "chapter-01",
  landmarks: Object.freeze({
    madrid: landmarkSet("madrid", "madrid-primary", ["madrid-street", "madrid-evening", "madrid-skyline"]),
    mercado: landmarkSet("mercado-san-miguel", "mercado-primary", ["mercado-entrance", "mercado-stalls", "mercado-interior"]),
    "plaza-mayor": landmarkSet("plaza-mayor", "plaza-mayor-primary", ["plaza-mayor-day", "plaza-mayor-cafe", "plaza-mayor-evening"]),
    cafe: landmarkSet("cafe", "cafe-primary", ["cafe-exterior", "cafe-counter", "cafe-table"]),
    apartment: landmarkSet("apartment", "apartment-primary", ["apartment-living-room", "apartment-kitchen", "apartment-balcony"]),
    granada: landmarkSet("granada", "granada-primary", ["granada-alhambra", "granada-street", "granada-sunset"]),
  }),
  episodes: Object.freeze(Object.fromEntries(
    Object.entries(EPISODE_SLUGS).map(([number, slug]) => [
      EPISODE_IDS[number],
      Object.freeze({
        lessonId: EPISODE_IDS[number],
        number: Number(number),
        landmark: EPISODE_LANDMARKS[number],
        hero: HERO_ARTWORK[number],
        thumbnail: `${CHAPTER_ONE_ROOT}/thumbnails/${slug}.webp`,
        cover: `${CHAPTER_ONE_ROOT}/covers/${slug}.webp`,
        alt: EPISODE_ALT_TEXT[number],
      }),
    ]),
  )),
});

const preloadedArtwork = new Set();

export const LESSON_ARTWORK_ONERROR = "this.onerror=null;this.hidden=true;this.parentElement.classList.add('is-artwork-missing')";

export function getEpisodeArtwork(lesson, role = "hero") {
  const number = getLessonNumber(lesson);
  const episode = CHAPTER_ARTWORK.episodes[lesson?.id] || CHAPTER_ARTWORK.episodes[EPISODE_IDS[number]];
  if (episode?.[role]) return episode[role];
  if (role !== "hero" && episode?.hero) return episode.hero;
  return normalizeArtworkPath(lesson?.image || lesson?.imagePath || lesson?.meta?.imagePath || "");
}

export function preloadEpisodeArtwork(lesson, role = "hero") {
  return preloadPath(getEpisodeArtwork(lesson, role));
}

export function getEpisodeArtworkAlt(lesson) {
  const number = getLessonNumber(lesson);
  return (CHAPTER_ARTWORK.episodes[lesson?.id] || CHAPTER_ARTWORK.episodes[EPISODE_IDS[number]])?.alt
    || `Artwork for ${lesson?.title || "Spanish episode"}`;
}

export function getLandmarkArtwork(location, variation = "primary") {
  const landmark = CHAPTER_ARTWORK.landmarks[location];
  if (!landmark) return "";
  if (variation === "primary") return landmark.primary;
  return landmark.variations.find((path) => path.endsWith(`/${variation}.webp`)) || landmark.primary;
}

export function getLessonLandmarkArtwork(lesson, variation = "primary") {
  const number = getLessonNumber(lesson);
  const episode = CHAPTER_ARTWORK.episodes[lesson?.id] || CHAPTER_ARTWORK.episodes[EPISODE_IDS[number]];
  return episode?.landmark ? getLandmarkArtwork(episode.landmark, variation) : "";
}

// Backwards-compatible hero helpers used by lesson surfaces outside Home and Learn.
export function getLessonArtwork(lesson) {
  return getEpisodeArtwork(lesson, "hero");
}

export function preloadLessonArtwork(lesson) {
  return preloadEpisodeArtwork(lesson, "hero");
}

export function getLessonNumber(lesson) {
  const match = String(lesson?.id || "").match(/lesson-(\d+)/);
  return Number(match?.[1] || 0);
}

function landmarkSet(directory, primary, variations) {
  return Object.freeze({
    primary: `${LANDMARK_ROOT}/${directory}/${primary}.webp`,
    variations: Object.freeze(variations.map((name) => `${LANDMARK_ROOT}/${directory}/${name}.webp`)),
  });
}

function preloadPath(src) {
  if (!src || preloadedArtwork.has(src) || typeof Image === "undefined") return src;
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  preloadedArtwork.add(src);
  return src;
}

function normalizeArtworkPath(path) {
  return String(path || "").replace(/\.png\.png$/i, ".png");
}
