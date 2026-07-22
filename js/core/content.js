import { awardXP } from "./progress.js";

const FIRST_LESSON_ID = "a1-lesson-01-greetings";
const PROGRESS_KEY = "habla_lesson_progress_v1";
const ACTIVE_LESSON_KEY = "habla_active_lesson_id_v1";
const LESSON_PATHS = {
  [FIRST_LESSON_ID]: "../../content/A1/lesson-01-greetings.json",
  "a1-lesson-02-introductions": "../../content/A1/lesson-02-introductions.json",
  "lesson-03-family": "../../content/A1/lesson-03-family.json",
  "lesson-04-numbers-time": "../../content/A1/lesson-04-numbers-time.json",
  "lesson-05-shopping": "../../content/A1/lesson-05-shopping.json",
  "lesson-06-food-drinks": "../../content/A1/lesson-06-food-drinks.json",
  "lesson-07-travel-basics": "../../content/A1/lesson-07-travel-basics.json",
  "lesson-08-vacation": "../../content/A1/lesson-08-vacation.json",
  "lesson-09-around-the-house": "../../content/A1/lesson-09-around-the-house.json",
  "lesson-10-daily-routine": "../../content/A1/lesson-10-daily-routine.json",
  "lesson-11-weather": "../../content/A1/lesson-11-weather.json",
  "lesson-12-clothing": "../../content/A1/lesson-12-clothing.json",
  "lesson-13-school": "../../content/A1/lesson-13-school.json",
  "lesson-14-work": "../../content/A1/lesson-14-work.json",
  "lesson-15-hobbies": "../../content/A1/lesson-15-hobbies.json",
  "lesson-16-sports": "../../content/A1/lesson-16-sports.json",
  "lesson-17-health": "../../content/A1/lesson-17-health.json",
  "lesson-18-body-parts": "../../content/A1/lesson-18-body-parts.json",
  "lesson-19-emotions": "../../content/A1/lesson-19-emotions.json",
  "lesson-20-everyday-life-review": "../../content/A1/lesson-20-everyday-life-review.json",
  "lesson-21-directions": "../../content/A1/lesson-21-directions.json",
  "lesson-22-transportation": "../../content/A1/lesson-22-transportation.json",
  "lesson-23-asking-for-help": "../../content/A1/lesson-23-asking-for-help.json",
  "lesson-24-emergencies": "../../content/A1/lesson-24-emergencies.json",
  "lesson-25-phone-conversations": "../../content/A1/lesson-25-phone-conversations.json",
  "lesson-26-banking": "../../content/A1/lesson-26-banking.json",
  "lesson-27-hotels": "../../content/A1/lesson-27-hotels.json",
  "lesson-28-airport": "../../content/A1/lesson-28-airport.json",
  "lesson-29-travel-review": "../../content/A1/lesson-29-travel-review.json",
  "lesson-30-a1-final-challenge": "../../content/A1/lesson-30-a1-final-challenge.json",
};
const LESSON_ORDER = Object.keys(LESSON_PATHS);
const LESSON_ID_ALIASES = {
  "lesson-21-a1-checkpoint": "lesson-21-directions",
};

const lessonCache = new Map();

export const contentReady = loadLessons();

async function loadLessons() {
  const entries = await Promise.all(
    Object.entries(LESSON_PATHS).map(async ([id, path]) => {
      const response = await fetch(new URL(path, import.meta.url));
      if (!response.ok) {
        throw new Error(`Could not load lesson content: ${id}`);
      }
      return [id, await response.json()];
    })
  );

  entries.forEach(([id, lesson]) => lessonCache.set(id, lesson));
  window.dispatchEvent(new CustomEvent("habla:content-ready", { detail: { lessonIds: entries.map(([id]) => id) } }));
  return entries.map(([, lesson]) => lesson);
}

export function getCurrentLesson() {
  const progress = readProgress();
  const unlockedLoadedIds = progress.unlockedLessonIds.filter(id => getLessonById(id));
  const currentId = unlockedLoadedIds.find(id => !progress.lessons[id]?.completed);
  return getLessonById(currentId || unlockedLoadedIds[unlockedLoadedIds.length - 1] || FIRST_LESSON_ID);
}

export function getActiveLesson() {
  const activeId = readActiveLessonId();
  return getLessonById(activeId) || getCurrentLesson();
}

export function setActiveLesson(id) {
  const lesson = getLessonById(id);
  if (!lesson) return null;
  localStorage.setItem(ACTIVE_LESSON_KEY, lesson.id);
  return lesson;
}

export function getNextLesson() {
  const currentLesson = getCurrentLesson();
  if (!currentLesson?.nextLesson) return null;
  return getLessonById(currentLesson.nextLesson) || null;
}

export function getNextAvailableLessonStatus() {
  const progress = readProgress();
  const currentLesson = getCurrentLesson();

  if (!currentLesson) {
    return { type: "no-current-lesson" };
  }

  const currentProgress = progress.lessons[currentLesson.id] || {};
  const nextLessonId = currentLesson.nextLesson || null;
  const nextLesson = nextLessonId ? getLessonById(nextLessonId) : null;
  const nextCanonicalId = canonicalLessonId(nextLessonId);
  const nextUnlocked = nextCanonicalId ? progress.unlockedLessonIds.includes(nextCanonicalId) : false;
  const loadedLessons = LESSON_ORDER.map(id => getLessonById(id)).filter(Boolean);
  const allLoadedLessonsCompleted = loadedLessons.length > 0
    && loadedLessons.every(lesson => progress.lessons[lesson.id]?.completed);

  if (allLoadedLessonsCompleted) {
    return {
      type: "course-completed-a1",
      currentLesson,
      currentProgress,
      nextLesson,
      nextLessonId,
      nextLessonTitle: nextLesson ? nextLesson.title : formatLessonTitle(nextLessonId),
      message: nextLesson
        ? "A1 complete. Your next course is ready."
        : "A1 complete. You're caught up.",
    };
  }

  if (nextLesson) {
    return {
      type: nextUnlocked ? "next-lesson-available" : "next-lesson-locked",
      currentLesson,
      currentProgress,
      nextLesson,
      nextLessonId,
      nextLessonTitle: nextLesson.title,
    };
  }

  if (currentProgress.completed && nextLessonId && nextUnlocked) {
    return {
      type: "next-lesson-missing",
      currentLesson,
      currentProgress,
      nextLesson: null,
      nextLessonId,
      nextLessonTitle: formatLessonTitle(nextLessonId),
      message: `Next lesson coming soon: ${formatLessonTitle(nextLessonId)}`,
    };
  }

  if (currentProgress.completed && !nextLessonId) {
    return {
      type: "course-caught-up",
      currentLesson,
      currentProgress,
      nextLesson: null,
      nextLessonId: null,
      nextLessonTitle: null,
      message: "You're caught up.",
    };
  }

  return {
    type: "current-lesson-active",
    currentLesson,
    currentProgress,
    nextLesson: null,
    nextLessonId,
    nextLessonTitle: nextLessonId ? formatLessonTitle(nextLessonId) : null,
  };
}

export function unlockNextLesson() {
  const currentLesson = getCurrentLesson();
  if (!currentLesson) {
    return { type: "lesson:missing-current" };
  }

  return unlockLessonById(currentLesson.nextLesson, currentLesson.id);
}

export function getUnlockedLessons() {
  const progress = readProgress();
  return progress.unlockedLessonIds
    .map(id => getLessonById(id))
    .filter(Boolean);
}

export function getCourseProgress() {
  const progress = readProgress();
  const loadedLessons = LESSON_ORDER
    .map(id => getLessonById(id))
    .filter(Boolean);
  const currentLesson = getCurrentLesson();
  const currentIndex = Math.max(loadedLessons.findIndex(lesson => lesson.id === currentLesson?.id), 0);
  const completedLessons = loadedLessons.filter(lesson => progress.lessons[lesson.id]?.completed);
  const totalLoadedLessons = loadedLessons.length;
  const completedCount = completedLessons.length;
  const percent = totalLoadedLessons ? Math.round((completedCount / totalLoadedLessons) * 100) : 0;

  return {
    currentLesson,
    currentLessonNumber: totalLoadedLessons ? currentIndex + 1 : 0,
    totalLoadedLessons,
    completedCount,
    percent,
    loadedLessons,
    completedLessons,
    nextLessonStatus: getNextAvailableLessonStatus(),
  };
}

export function getLessonById(id) {
  return lessonCache.get(canonicalLessonId(id)) || null;
}

export function getLessonCompletionXP(lesson) {
  return Number(lesson?.rewards?.lessonCompletionXp ?? lesson?.xpReward ?? 0);
}

export function completeLesson(id) {
  const lesson = getLessonById(id);
  if (!lesson) {
    return { type: "lesson:missing", id };
  }

  const progress = readProgress();
  const previous = progress.lessons[id] || {};

  if (previous.completed) {
    return { type: "lesson:already-completed", id, lesson, progress: previous };
  }

  const completedAt = new Date().toISOString();
  const completionXP = getLessonCompletionXP(lesson);
  const lessonProgress = {
    ...previous,
    completed: true,
    completedAt,
    xpAwarded: completionXP,
  };

  progress.lessons[id] = lessonProgress;
  progress.completedLessonIds = Array.from(new Set([...progress.completedLessonIds, id]));
  progress.lastCompletedLessonId = id;
  progress.updatedAt = completedAt;

  const unlockEvent = unlockLessonInProgress(progress, lesson.nextLesson, id);
  writeProgress(progress);

  const xpEvent = completionXP ? awardXP(completionXP, `Completed lesson: ${lesson.title}`) : null;
  const event = { type: "lesson:completed", id, lesson, progress: lessonProgress, xpEvent, unlockEvent };
  window.dispatchEvent(new CustomEvent("habla:lesson-completed", { detail: event }));
  return event;
}

export function getLessonProgress(id) {
  const progress = readProgress();
  return progress.lessons[id] || {
    completed: false,
    completedAt: null,
    xpAwarded: 0,
  };
}

export function updateLessonProgress(id, patch = {}) {
  const lesson = getLessonById(id);
  if (!lesson) return { type: "lesson:missing", id };

  const progress = readProgress();
  const previous = progress.lessons[id] || {};
  const updatedAt = new Date().toISOString();
  const lessonProgress = {
    ...previous,
    ...patch,
    updatedAt,
  };

  progress.lessons[id] = lessonProgress;
  progress.updatedAt = updatedAt;
  writeProgress(progress);

  const event = { type: "lesson:progress", id, lesson, progress: lessonProgress };
  window.dispatchEvent(new CustomEvent("habla:lesson-progress", { detail: event }));
  return event;
}

function readProgress() {
  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    if (!saved) return createProgress();

    const parsed = JSON.parse(saved);
    return normalizeProgress({
      lessons: parsed.lessons || {},
      completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
      unlockedLessonIds: Array.isArray(parsed.unlockedLessonIds) ? parsed.unlockedLessonIds : [],
      lastCompletedLessonId: parsed.lastCompletedLessonId || null,
      updatedAt: parsed.updatedAt || null,
    });
  } catch (error) {
    console.error("Could not load lesson progress:", error);
    return createProgress();
  }
}

function readActiveLessonId() {
  try {
    return canonicalLessonId(localStorage.getItem(ACTIVE_LESSON_KEY) || "");
  } catch {
    return "";
  }
}

function writeProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function createProgress() {
  return normalizeProgress({
    lessons: {},
    completedLessonIds: [],
    unlockedLessonIds: [FIRST_LESSON_ID],
    lastCompletedLessonId: null,
    updatedAt: null,
  });
}

function normalizeProgress(progress) {
  const unlockedLessonIds = Array.from(new Set([FIRST_LESSON_ID, ...(progress.unlockedLessonIds || [])]));
  const completedLessonIds = Array.from(new Set(progress.completedLessonIds || []));
  const lessons = Object.entries(progress.lessons || {}).reduce((normalizedLessons, [id, lessonProgress]) => {
    const canonicalId = canonicalLessonId(id);
    normalizedLessons[canonicalId] = {
      ...(normalizedLessons[canonicalId] || {}),
      ...lessonProgress,
    };
    return normalizedLessons;
  }, {});

  for (const id of completedLessonIds.map(canonicalLessonId)) {
    const lesson = lessonCache.get(id);
    if (lesson?.nextLesson) unlockedLessonIds.push(lesson.nextLesson);
  }

  return {
    lessons,
    completedLessonIds: completedLessonIds.map(canonicalLessonId),
    unlockedLessonIds: sortLessonIds(Array.from(new Set(unlockedLessonIds.map(canonicalLessonId)))),
    lastCompletedLessonId: progress.lastCompletedLessonId || null,
    updatedAt: progress.updatedAt || null,
  };
}

function unlockLessonById(id, unlockedBy = null) {
  const progress = readProgress();
  const event = unlockLessonInProgress(progress, id, unlockedBy);
  if (event.type === "lesson:unlocked") {
    writeProgress(progress);
    window.dispatchEvent(new CustomEvent("habla:lesson-unlocked", { detail: event }));
  }
  return event;
}

function unlockLessonInProgress(progress, id, unlockedBy = null) {
  if (!id) {
    return { type: "lesson:no-next-lesson", id: null, unlockedBy };
  }

  id = canonicalLessonId(id);

  if (progress.unlockedLessonIds.includes(id)) {
    return { type: "lesson:already-unlocked", id, lesson: getLessonById(id), unlockedBy };
  }

  progress.unlockedLessonIds = sortLessonIds([...progress.unlockedLessonIds, id]);
  progress.updatedAt = new Date().toISOString();

  return { type: "lesson:unlocked", id, lesson: getLessonById(id), unlockedBy };
}

function canonicalLessonId(id) {
  return LESSON_ID_ALIASES[id] || id;
}

function sortLessonIds(ids) {
  return ids.sort((a, b) => {
    const aIndex = LESSON_ORDER.indexOf(a);
    const bIndex = LESSON_ORDER.indexOf(b);

    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

function formatLessonTitle(id) {
  if (!id) return "Next lesson";

  const match = id.match(/lesson-(\d+)-(.+)$/);
  if (!match) return titleCase(id.replace(/^a\d-/, "").replace(/-/g, " "));

  return titleCase(match[2].replace(/-/g, " "));
}

function titleCase(value) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
