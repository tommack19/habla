import { awardXP } from "./progress.js";

const FIRST_LESSON_ID = "a1-lesson-01-greetings";
const PROGRESS_KEY = "habla_lesson_progress_v1";
const LESSON_PATHS = {
  [FIRST_LESSON_ID]: "../../content/A1/lesson-01-greetings.json",
  "a1-lesson-02-introductions": "../../content/A1/lesson-02-introductions.json",
  "lesson-03-family": "../../content/A1/lesson-03-family.json",
};
const LESSON_ORDER = Object.keys(LESSON_PATHS);

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
  const nextUnlocked = nextLessonId ? progress.unlockedLessonIds.includes(nextLessonId) : false;

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
  return lessonCache.get(id) || null;
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
  const lessonProgress = {
    ...previous,
    completed: true,
    completedAt,
    xpAwarded: lesson.xpReward || 0,
  };

  progress.lessons[id] = lessonProgress;
  progress.completedLessonIds = Array.from(new Set([...progress.completedLessonIds, id]));
  progress.lastCompletedLessonId = id;
  progress.updatedAt = completedAt;

  const unlockEvent = unlockLessonInProgress(progress, lesson.nextLesson, id);
  writeProgress(progress);

  const xpEvent = lesson.xpReward ? awardXP(lesson.xpReward, `Completed lesson: ${lesson.title}`) : null;
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

  for (const id of completedLessonIds) {
    const lesson = lessonCache.get(id);
    if (lesson?.nextLesson) unlockedLessonIds.push(lesson.nextLesson);
  }

  return {
    lessons: progress.lessons || {},
    completedLessonIds,
    unlockedLessonIds: sortLessonIds(Array.from(new Set(unlockedLessonIds))),
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

  if (progress.unlockedLessonIds.includes(id)) {
    return { type: "lesson:already-unlocked", id, lesson: getLessonById(id), unlockedBy };
  }

  progress.unlockedLessonIds = sortLessonIds([...progress.unlockedLessonIds, id]);
  progress.updatedAt = new Date().toISOString();

  return { type: "lesson:unlocked", id, lesson: getLessonById(id), unlockedBy };
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
