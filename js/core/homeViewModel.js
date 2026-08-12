import {
  getActiveLesson,
  getLessonById,
  getLessonProgress,
  getUnlockedLessons,
} from "./content.js";
import { getCurrentXP } from "./progress.js";
import { getLearnerMemoryProfile, getLessonDiscoveries } from "./lessonMemory.js";
import { resolveLessonFlow } from "./lessonFlow.js";

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
export const GRANADA_LESSON_IDS = Object.freeze([
  "lesson-11-weather",
  "lesson-12-clothing",
  "lesson-13-school",
  "lesson-14-work",
  "lesson-15-hobbies",
  "lesson-16-sports",
  "lesson-17-health",
  "lesson-18-body-parts",
  "lesson-19-emotions",
  "lesson-20-everyday-life-review",
]);

const NEXT_CHAPTER_ENTRY_LESSON_ID = "lesson-21-directions";

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
    }))
    .map((entry) => ({
      ...entry,
      episodeState: getHomeEpisodeState(entry.lesson, entry.progress),
    }));
  const completedEntries = entries.filter(({ progress }) => progress.completed);
  const activeEntry = entries.find(({ progress }) => !progress.completed) || entries.at(-1) || null;
  const chapterComplete = entries.length === MADRID_LESSON_IDS.length
    && completedEntries.length === MADRID_LESSON_IDS.length;
  const unlockedIds = new Set(getUnlockedLessons().map((lesson) => lesson.id));
  const selectedLesson = getActiveLesson();
  const selectedEntry = entries.find(({ lesson }) => (
    lesson.id === selectedLesson?.id && unlockedIds.has(lesson.id)
  )) || null;
  const chapterTwoUnlocked = chapterComplete && unlockedIds.has(GRANADA_ENTRY_LESSON_ID);
  const granadaLesson = getLessonById(GRANADA_ENTRY_LESSON_ID);
  const granadaEntries = GRANADA_LESSON_IDS
    .map((id) => getLessonById(id))
    .filter(Boolean)
    .map((lesson) => ({ lesson, progress: getLessonProgress(lesson.id) }));
  const activeGranadaEntry = granadaEntries.find(({ progress }) => !progress.completed) || granadaEntries.at(-1) || null;
  const chapterTwoStarted = granadaEntries.some(({ progress }) => isLessonStarted(progress));
  const chapterTwoComplete = granadaEntries.length === GRANADA_LESSON_IDS.length
    && granadaEntries.every(({ progress }) => progress.completed);
  const nextChapterLesson = getLessonById(NEXT_CHAPTER_ENTRY_LESSON_ID);
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
  const learnerName = getFirstName(state?.user?.name);
  const carlosConversationsCount = getCarlosConversationsCount(state);
  const completionPercent = MADRID_LESSON_IDS.length
    ? Math.round((completedEntries.length / MADRID_LESSON_IDS.length) * 100)
    : 0;
  const heroPrimaryAction = getHomeHeroPrimaryAction({
    chapterComplete,
    chapterTwoStarted,
    chapterTwoComplete,
    activeEntry,
    activeGranadaEntry,
    granadaLesson,
    nextChapterLesson,
    unlockedIds,
  });

  return {
    learnerName,
    level,
    currentChapter: chapterTwoUnlocked ? 2 : 1,
    nextChapter: chapterTwoUnlocked ? 3 : 2,
    chapterComplete,
    chapterTwoUnlocked,
    chapterTwoStarted,
    chapterTwoComplete,
    heroPrimaryAction,
    entries,
    completedEntries,
    completedCount: completedEntries.length,
    completionPercent,
    activeEntry,
    selectedEntry,
    currentOrNextEpisode: selectedEntry?.lesson
      || (chapterTwoUnlocked ? granadaLesson : activeEntry?.lesson)
      || null,
    granadaLesson,
    earnedStamps,
    recentMemories: memories.slice(0, 4),
    memoryCount: memories.length,
    learnerMemory: getLearnerMemoryProfile(),
    carlosConversationsCount,
    carlosMessage: getHomeCarlosMessage({
      chapterComplete,
      completedEntries,
      learnerName,
      activeLesson: activeEntry?.lesson,
    }),
    routes: {
      chapterTwo: heroPrimaryAction.route,
      reviewMadrid: { page: "practice" },
      journey: { page: "learn", view: "roadmap" },
      carlos: { page: "carlos" },
      travelJournal: { page: "journey" },
    },
  };
}

export function getHomeHeroPrimaryAction({
  chapterComplete,
  chapterTwoStarted,
  chapterTwoComplete,
  activeEntry,
  activeGranadaEntry,
  granadaLesson,
  nextChapterLesson,
  unlockedIds,
}) {
  if (!chapterComplete) {
    return {
      label: "Continue Madrid",
      ariaLabel: "Continue your current Madrid episode",
      route: activeEntry?.lesson ? { page: "lesson", lessonId: activeEntry.lesson.id } : { page: "learn" },
    };
  }

  if (!chapterTwoStarted) {
    return {
      label: "Begin Chapter 2",
      ariaLabel: "Begin Chapter 2 in Granada",
      route: granadaLesson ? { page: "lesson", lessonId: granadaLesson.id } : { page: "learn", view: "roadmap" },
    };
  }

  if (!chapterTwoComplete) {
    return {
      label: "Continue Granada",
      ariaLabel: "Continue your current Granada episode",
      route: activeGranadaEntry?.lesson
        ? { page: "lesson", lessonId: activeGranadaEntry.lesson.id }
        : { page: "learn", view: "roadmap" },
    };
  }

  return {
    label: "Continue Journey",
    ariaLabel: "Continue your Spanish journey after Granada",
    route: nextChapterLesson && unlockedIds.has(nextChapterLesson.id)
      ? { page: "lesson", lessonId: nextChapterLesson.id }
      : { page: "learn", view: "roadmap" },
  };
}

function isLessonStarted(progress = {}) {
  return Boolean(
    progress.completed
    || Number(progress.rendererStep || 0) > 0
    || progress.updatedAt
    || progress.completedSections?.length
  );
}

function getHomeEpisodeState(lesson, progress = {}) {
  if (progress.completed) {
    return { status: "completed", action: "Replay Episode", context: "Episode complete", percent: 100, stepLabel: "Complete" };
  }

  const flow = resolveLessonFlow(lesson, progress);
  const { steps, index, percent } = flow;
  const started = index > 0 || Boolean(progress.updatedAt || progress.completedSections?.length);
  const stepLabel = steps[index]?.label || "Episode Opening";

  return started
    ? { status: "progress", action: "Continue Episode", context: `${percent}% complete · Continue from ${stepLabel}`, percent, stepLabel }
    : { status: "not-started", action: "Begin Episode", context: "Ready to begin", percent: 0, stepLabel };
}

function getHomeCarlosMessage({ chapterComplete, completedEntries, learnerName, activeLesson }) {
  if (chapterComplete) {
    return {
      title: `Hola, ${learnerName}.`,
      body: "You spent a full day speaking Spanish with me in Madrid. Before we travel to Granada, let’s keep a few important phrases fresh.",
    };
  }
  if (!completedEntries.length) {
    return {
      title: `Hola, ${learnerName}.`,
      body: "I’m waiting outside the café. Let’s have your first conversation in Spanish.",
    };
  }

  const previousLesson = completedEntries.at(-1)?.lesson;
  const handoff = previousLesson?.microCliffhanger?.english;
  if (completedEntries.length === 1) {
    return {
      title: `Nice work, ${learnerName}.`,
      body: handoff || "Tomorrow you’ll meet my friend Ana.",
    };
  }
  return {
    title: `Ready for Episode ${completedEntries.length + 1}?`,
    body: handoff || activeLesson?.story?.openingCarlosMessage || `Let’s continue with ${activeLesson?.title || "our next adventure"}.`,
  };
}

function getCarlosConversationsCount(state) {
  const fromState = Number(state?.activity?.carlosConversationsCount);
  if (Number.isFinite(fromState)) return Math.max(0, fromState);
  if (typeof localStorage === "undefined") return 0;
  try {
    const activity = JSON.parse(localStorage.getItem("habla_activity_stats_v1") || "{}");
    return Math.max(0, Number(activity.carlosConversationsCount || 0));
  } catch {
    return 0;
  }
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
