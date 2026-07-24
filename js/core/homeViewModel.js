import {
  getLessonById,
  getLessonProgress,
  getUnlockedLessons,
} from "./content.js";
import { getCurrentXP } from "./progress.js";
import { getLearnerMemoryProfile, getLessonDiscoveries } from "./lessonMemory.js";

export const MADRID_LESSON_IDS = Object.freeze([
  "a1-lesson-01-greetings",
  "a1-lesson-02-introductions",
  "lesson-03-family",
  "lesson-04-numbers-time",
  "lesson-05-shopping",
  "lesson-06-food-drinks",
  "lesson-07-travel-basics",
  "lesson-08-vacation",
  "lesson-09-around-the-house",
  "lesson-10-daily-routine",
]);

export const GRANADA_ENTRY_LESSON_ID = "lesson-11-weather";

const JOURNEY_LEVELS = Object.freeze([
  { code: "A1", name: "Explorer", cefrLabel: "Beginner", minXP: 0, nextXP: 3000 },
  { code: "A2", name: "Traveler", cefrLabel: "Elementary", minXP: 3000, nextXP: 6000 },
  { code: "B1", name: "Local", cefrLabel: "Intermediate", minXP: 6000, nextXP: 9000 },
  { code: "B2", name: "Adventurer", cefrLabel: "Upper Intermediate", minXP: 9000, nextXP: 12000 },
  { code: "C1", name: "Insider", cefrLabel: "Advanced", minXP: 12000, nextXP: 15000 },
  { code: "C2", name: "Fluent", cefrLabel: "Proficient", minXP: 15000, nextXP: 15000 },
]);

export function buildHomeViewModel(state) {
  const entries = MADRID_LESSON_IDS
    .map((id) => getLessonById(id))
    .filter(Boolean)
    .map((lesson, index) => ({
      lesson,
      number: index + 1,
      progress: getLessonProgress(lesson.id),
    }));
  const completedEntries = entries.filter(({ progress }) => progress.completed);
  const activeEntry = entries.find(({ progress }) => !progress.completed) || entries.at(-1) || null;
  const chapterComplete = entries.length === MADRID_LESSON_IDS.length
    && completedEntries.length === MADRID_LESSON_IDS.length;
  const unlockedIds = new Set(getUnlockedLessons().map((lesson) => lesson.id));
  const chapterTwoUnlocked = chapterComplete && unlockedIds.has(GRANADA_ENTRY_LESSON_ID);
  const granadaLesson = getLessonById(GRANADA_ENTRY_LESSON_ID);
  const memories = entries
    .flatMap(({ lesson, number }) => getLessonDiscoveries(lesson.id).map((memory) => ({
      ...memory,
      lesson,
      lessonNumber: number,
    })))
    .sort((a, b) => Date.parse(b.discoveredAt || 0) - Date.parse(a.discoveredAt || 0));
  const earnedStamps = completedEntries
    .map(({ lesson, progress, number }) => lesson.passportStamp ? ({
      ...lesson.passportStamp,
      lessonId: lesson.id,
      lessonNumber: number,
      earnedAt: progress.completedAt || null,
    }) : null)
    .filter(Boolean);
  const level = getHomeJourneyLevel({ chapterTwoUnlocked, xp: getCurrentXP() });
  const completionPercent = MADRID_LESSON_IDS.length
    ? Math.round((completedEntries.length / MADRID_LESSON_IDS.length) * 100)
    : 0;

  return {
    learnerName: getFirstName(state?.user?.name),
    level,
    currentChapter: chapterTwoUnlocked ? 2 : 1,
    nextChapter: chapterTwoUnlocked ? 3 : 2,
    chapterComplete,
    chapterTwoUnlocked,
    entries,
    completedEntries,
    completedCount: completedEntries.length,
    completionPercent,
    activeEntry,
    currentOrNextEpisode: chapterTwoUnlocked ? granadaLesson : activeEntry?.lesson || null,
    granadaLesson,
    earnedStamps,
    recentMemories: memories.slice(0, 4),
    memoryCount: memories.length,
    learnerMemory: getLearnerMemoryProfile(),
    routes: {
      chapterTwo: chapterTwoUnlocked && granadaLesson
        ? { page: "lesson", lessonId: granadaLesson.id }
        : activeEntry?.lesson
          ? { page: "lesson", lessonId: activeEntry.lesson.id }
          : { page: "learn" },
      reviewMadrid: { page: "practice" },
      journey: { page: "learn", view: "roadmap" },
      carlos: { page: "carlos" },
      travelJournal: { page: "journey" },
    },
  };
}

export function getHomeJourneyLevel(options = {}) {
  const xp = Math.max(0, Number(options.xp ?? getCurrentXP() ?? 0));
  const xpIndex = JOURNEY_LEVELS.reduce((current, level, index) => xp >= level.minXP ? index : current, 0);
  const chapterIndex = options.chapterTwoUnlocked ? 1 : 0;
  const index = Math.max(xpIndex, chapterIndex);
  const level = JOURNEY_LEVELS[index];
  const nextLevel = JOURNEY_LEVELS[index + 1];
  const range = Math.max(1, level.nextXP - level.minXP);
  const percent = nextLevel ? Math.min(100, Math.max(0, Math.round(((xp - level.minXP) / range) * 100))) : 100;

  return {
    ...level,
    xp,
    percent,
    isComplete: !nextLevel,
    nextName: nextLevel?.name || level.name,
    remaining: nextLevel ? Math.max(0, level.nextXP - xp) : 0,
  };
}

function getFirstName(value) {
  return String(value || "amigo").trim().split(/\s+/)[0] || "amigo";
}
