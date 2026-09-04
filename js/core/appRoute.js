const ROUTED_PAGES = new Set(["home", "learn", "practice", "carlos", "profile", "journey"]);

export function readAppRoute(hash = window.location.hash) {
  const value = String(hash || "").replace(/^#\/?/, "");
  if (!value) return { page: "home", lessonId: null };
  const [page, encodedLessonId] = value.split("/");
  if (page === "lesson" && encodedLessonId) {
    try {
      return { page: "lesson", lessonId: decodeURIComponent(encodedLessonId) };
    } catch {
      return { page: "home", lessonId: null };
    }
  }
  return ROUTED_PAGES.has(page)
    ? { page, lessonId: null }
    : { page: "home", lessonId: null };
}

export function writeAppRoute(page, lessonId = null, { replace = false } = {}) {
  const hash = page === "lesson" && lessonId
    ? `#lesson/${encodeURIComponent(lessonId)}`
    : page === "home" ? "#home" : `#${page}`;
  const method = replace ? "replaceState" : "pushState";
  if (window.location.hash === hash) return;
  window.history[method]({}, "", hash);
}
