import { awardXP } from "./progress.js";

const CURRENT_LESSON_ID = "a1-lesson-01-greetings";
const PROGRESS_KEY = "habla_lesson_progress_v1";
const LESSON_PATHS = {
  [CURRENT_LESSON_ID]: "../../content/A1/lesson-01-greetings.json",
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
  return getLessonById(CURRENT_LESSON_ID);
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
  writeProgress(progress);

  const xpEvent = lesson.xpReward ? awardXP(lesson.xpReward, `Completed lesson: ${lesson.title}`) : null;
  const event = { type: "lesson:completed", id, lesson, progress: lessonProgress, xpEvent };
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
    return {
      lessons: parsed.lessons || {},
      completedLessonIds: Array.isArray(parsed.completedLessonIds) ? parsed.completedLessonIds : [],
      lastCompletedLessonId: parsed.lastCompletedLessonId || null,
      updatedAt: parsed.updatedAt || null,
    };
  } catch (error) {
    console.error("Could not load lesson progress:", error);
    return createProgress();
  }
}

function writeProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function createProgress() {
  return {
    lessons: {},
    completedLessonIds: [],
    lastCompletedLessonId: null,
    updatedAt: null,
  };
}
