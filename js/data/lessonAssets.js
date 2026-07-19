const LESSON_ARTWORK = Object.freeze({
  1: "assets/images/lessons/lesson-01-greetings.png.png",
  2: "assets/images/lessons/lesson-02-introductions.png.png",
  3: "assets/images/lessons/lesson-03-family.png.png",
  4: "assets/images/lessons/lesson-04-numbers-time.png.png",
  5: "assets/images/lessons/lesson-05-shopping.png.png",
  6: "assets/images/lessons/lesson-06-food-drinks.png.png",
  7: "assets/images/lessons/lesson-07-travel.png.png",
  8: "assets/images/lessons/lesson-08-vacation.png.png",
  9: "assets/images/lessons/lesson-08-vacation.png.png",
  10: "assets/images/lessons/lesson-07-travel.png.png",
});

const preloadedArtwork = new Set();

export const LESSON_ARTWORK_ONERROR = "this.onerror=null;this.hidden=true;this.parentElement.classList.add('is-artwork-missing')";

export function getLessonArtwork(lesson) {
  const number = getLessonNumber(lesson);
  if (LESSON_ARTWORK[number]) return LESSON_ARTWORK[number];
  return normalizeArtworkPath(lesson?.image || lesson?.imagePath || lesson?.meta?.imagePath || "");
}

export function preloadLessonArtwork(lesson) {
  const src = getLessonArtwork(lesson);
  if (!src || preloadedArtwork.has(src) || typeof Image === "undefined") return src;
  const image = new Image();
  image.decoding = "async";
  image.src = src;
  preloadedArtwork.add(src);
  return src;
}

export function getLessonNumber(lesson) {
  const match = String(lesson?.id || "").match(/lesson-(\d+)/);
  return Number(match?.[1] || 0);
}

function normalizeArtworkPath(path) {
  if (!path) return "";
  if (/assets\/images\/lessons\/lesson-0[1-7]-[^/]+\.png$/i.test(path)) return `${path}.png`;
  return path;
}
