import { getCurrentXP, getCurrentStreak, awardAchievement as recordProgressAchievement } from "./progress.js";

const ACHIEVEMENTS_KEY = "habla_achievements_v1";
const MISSIONS_KEY = "habla_daily_mission_v1";
const PROGRESS_KEY = "habla_progress_v1";
const ACTIVITY_KEY = "habla_activity_stats_v1";
const LESSON_PROGRESS_KEY = "habla_lesson_progress_v1";
const STAMP_CELEBRATIONS_KEY = "habla_stamp_celebrations_v1";

const ACHIEVEMENTS = [
  {
    id: "first_steps",
    title: "First Steps",
    description: "Earn your first XP.",
    category: "consistency",
    rarity: "bronze",
    metric: "xp",
    target: 1,
    isEligible: ({ xp }) => xp > 0,
  },
  {
    id: "hundred_xp",
    title: "Rising Explorer",
    description: "Earn 100 XP.",
    category: "consistency",
    rarity: "silver",
    metric: "xp",
    target: 100,
    isEligible: ({ xp }) => xp >= 100,
  },
  {
    id: "mission_complete",
    title: "Mission Complete",
    description: "Complete your first daily mission.",
    category: "consistency",
    rarity: "bronze",
    metric: "completedMissionsCount",
    target: 1,
    isEligible: ({ completedMissionsCount }) => completedMissionsCount >= 1,
  },
  {
    id: "vocab_starter",
    title: "Vocab Starter",
    description: "Review your first vocabulary cards.",
    category: "vocabulary",
    rarity: "bronze",
    metric: "vocabularyReviewedCount",
    target: 5,
    isEligible: ({ vocabularyReviewedCount }) => vocabularyReviewedCount >= 5,
  },
  {
    id: "vocab_builder",
    title: "Vocabulary Builder",
    description: "Practice 100 words.",
    category: "vocabulary",
    rarity: "gold",
    metric: "vocabularyReviewedCount",
    target: 100,
    isEligible: ({ vocabularyReviewedCount }) => vocabularyReviewedCount >= 100,
  },
  {
    id: "quiz_rookie",
    title: "Quiz Rookie",
    description: "Complete your first quiz.",
    category: "grammar",
    rarity: "bronze",
    metric: "quizzesCompletedCount",
    target: 1,
    isEligible: ({ quizzesCompletedCount }) => quizzesCompletedCount >= 1,
  },
  {
    id: "quiz_regular",
    title: "Knowledge Builder",
    description: "Complete 10 quizzes.",
    category: "grammar",
    rarity: "gold",
    metric: "quizzesCompletedCount",
    target: 10,
    isEligible: ({ quizzesCompletedCount }) => quizzesCompletedCount >= 10,
  },
  {
    id: "pronunciation_start",
    title: "First Words",
    description: "Try pronunciation practice.",
    category: "pronunciation",
    rarity: "bronze",
    metric: "pronunciationAttempts",
    target: 1,
    isEligible: ({ pronunciationAttempts }) => pronunciationAttempts >= 1,
  },
  {
    id: "first_conversation",
    title: "First Conversation",
    description: "Have your first conversation with Carlos.",
    category: "conversation",
    rarity: "silver",
    metric: "carlosConversationsCount",
    target: 1,
    isEligible: ({ carlosConversationsCount }) => carlosConversationsCount >= 1,
  },
  {
    id: "conversation_regular",
    title: "Conversation Regular",
    description: "Complete 10 conversations with Carlos.",
    category: "conversation",
    rarity: "platinum",
    metric: "carlosConversationsCount",
    target: 10,
    isEligible: ({ carlosConversationsCount }) => carlosConversationsCount >= 10,
  },
  {
    id: "on_fire",
    title: "On Fire",
    description: "Build a 3-day streak.",
    category: "consistency",
    rarity: "silver",
    metric: "streak",
    target: 3,
    isEligible: ({ streak }) => streak >= 3,
  },
  {
    id: "streak_7",
    title: "Seven Days Strong",
    description: "Build a 7-day streak.",
    category: "consistency",
    rarity: "gold",
    metric: "streak",
    target: 7,
    isEligible: ({ streak }) => streak >= 7,
  },
  {
    id: "first_lesson",
    title: "First Lesson",
    description: "Complete your first lesson.",
    category: "culture",
    rarity: "bronze",
    metric: "completedLessonsCount",
    target: 1,
    isEligible: ({ completedLessonsCount }) => completedLessonsCount >= 1,
  },
  {
    id: "ten_lessons",
    title: "Committed Learner",
    description: "Complete 10 lessons.",
    category: "culture",
    rarity: "gold",
    metric: "completedLessonsCount",
    target: 10,
    isEligible: ({ completedLessonsCount }) => completedLessonsCount >= 10,
  },
  {
    id: "a1_complete",
    title: "Spanish Passport Earned",
    description: "Complete the full A1 journey.",
    category: "culture",
    rarity: "legendary",
    metric: "completedLessonsCount",
    target: 30,
    isEligible: ({ completedLessonsCount }) => completedLessonsCount >= 30,
  },
  {
    id: "madrid_ready",
    title: "Madrid Ready",
    description: "Complete the Madrid chapter as one connected Spanish experience.",
    category: "culture",
    rarity: "gold",
    metric: "completedLessonsCount",
    target: 10,
    isEligible: ({ completedLessonsCount }) => completedLessonsCount >= 10,
  },
  {
    id: "family_ready",
    title: "Family Ready",
    description: "Complete a family-related mission.",
    category: "culture",
    rarity: "silver",
    metric: "familyMission",
    target: 1,
    isEligible: ({ completedMissions, todaysMission }) => {
      return completedMissions.some(isFamilyMission) || isFamilyMission(todaysMission);
    },
  },
  {
    id: "plan_maker",
    title: "Plan Maker",
    description: "Arrange your first day and meeting time entirely in Spanish.",
    category: "conversation",
    rarity: "silver",
    metric: "completedLessonsCount",
    target: 4,
    isEligible: ({ completedLessonsCount }) => completedLessonsCount >= 4,
  },
  {
    id: "helpful_shopper",
    title: "Helpful Shopper",
    description: "Help Carlos buy something for his family entirely in Spanish.",
    category: "conversation",
    rarity: "silver",
    metric: "completedLessonsCount",
    target: 5,
    isEligible: ({ completedLessonsCount }) => completedLessonsCount >= 5,
  },
  {
    id: "first_order",
    title: "First Order",
    description: "Order a drink and snack and make one polite change entirely in Spanish.",
    category: "conversation",
    rarity: "silver",
    metric: "completedLessonsCount",
    target: 6,
    isEligible: ({ completedLessonsCount }) => completedLessonsCount >= 6,
  },
  {
    id: "found_the_way",
    title: "Found the Way",
    description: "Follow three Spanish direction cues and identify the destination independently.",
    category: "travel",
    rarity: "silver",
    metric: "completedLessonsCount",
    target: 7,
    isEligible: ({ completedLessonsCount }) => completedLessonsCount >= 7,
  },
  {
    id: "at_home_in_spanish",
    title: "At Home in Spanish",
    description: "Describe one room and locate a personal object using hay and está.",
    category: "conversation",
    rarity: "silver",
    metric: "completedLessonsCount",
    target: 8,
    isEligible: ({ completedLessonsCount }) => completedLessonsCount >= 8,
  },
  {
    id: "daily_speaker",
    title: "Daily Speaker",
    description: "Describe four real parts of your normal day in Spanish.",
    category: "conversation",
    rarity: "gold",
    metric: "completedLessonsCount",
    target: 9,
    isEligible: ({ completedLessonsCount }) => completedLessonsCount >= 9,
  },
];

export function getAchievements() {
  const unlocked = readUnlocked();

  return ACHIEVEMENTS.map(achievement => ({
    id: achievement.id,
    title: achievement.title,
    description: achievement.description,
    unlocked: Boolean(unlocked[achievement.id]),
    unlockedAt: unlocked[achievement.id]?.unlockedAt || null,
    category: achievement.category,
    rarity: achievement.rarity,
    metric: achievement.metric,
    target: achievement.target,
  }));
}

export function getUnlockedAchievements() {
  return getAchievements().filter(achievement => achievement.unlocked);
}

export function unlockAchievement(id) {
  const achievement = ACHIEVEMENTS.find(item => item.id === id);

  if (!achievement) {
    return createEvent("achievement:ignored", {
      id,
      reason: "Unknown achievement.",
    });
  }

  const unlocked = readUnlocked();
  if (unlocked[id]) {
    return createEvent("achievement:duplicate", {
      achievement: toPublicAchievement(achievement, unlocked[id]),
    });
  }

  const unlockedRecord = {
    unlockedAt: new Date().toISOString(),
  };
  unlocked[id] = unlockedRecord;
  writeUnlocked(unlocked);
  queueStampCelebration(achievement, unlockedRecord);
  recordProgressAchievement(id);

  return createEvent("achievement:unlocked", {
    achievement: toPublicAchievement(achievement, unlockedRecord),
  });
}

export function evaluateAchievements(stats = {}) {
  const context = buildContext(stats);
  const events = [];

  ACHIEVEMENTS.forEach(achievement => {
    if (achievement.isEligible(context)) {
      const event = unlockAchievement(achievement.id);
      if (event.type === "achievement:unlocked") {
        events.push(event);
      }
    }
  });

  return events;
}

export function resetAchievements() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(ACHIEVEMENTS_KEY);
    localStorage.removeItem(STAMP_CELEBRATIONS_KEY);
  }

  return createEvent("achievements:reset");
}

function buildContext(stats) {
  const progress = readJSON(PROGRESS_KEY) || {};
  const activity = readJSON(ACTIVITY_KEY) || {};
  const lessonProgress = readJSON(LESSON_PROGRESS_KEY) || {};
  const todaysMissionRecord = readJSON(MISSIONS_KEY);
  const completedMissions = Array.isArray(progress.completedMissions) ? progress.completedMissions : [];

  const todaysMission = todaysMissionRecord?.mission?.completed ? todaysMissionRecord.mission : null;
  const completedMissionObjects = [
    ...completedMissions.map(mission => typeof mission === "string" ? { id: mission } : mission),
    ...(todaysMission ? [todaysMission] : []),
    ...(Array.isArray(stats.completedMissions) ? stats.completedMissions : []),
  ];

  return {
    xp: Number(stats.xp ?? getCurrentXP() ?? progress.xp ?? 0),
    streak: Number(stats.streak ?? getCurrentStreak() ?? progress.streak ?? 0),
    completedMissionsCount: Number(
      stats.completedMissionsCount ??
      activity.completedMissionsCount ??
      completedMissionObjects.length
    ),
    vocabularyReviewedCount: Number(stats.vocabularyReviewedCount ?? activity.vocabularyReviewedCount ?? 0),
    quizzesCompletedCount: Number(stats.quizzesCompletedCount ?? activity.quizzesCompletedCount ?? 0),
    pronunciationAttempts: Number(stats.pronunciationAttempts ?? activity.pronunciationAttempts ?? 0),
    carlosConversationsCount: Number(stats.carlosConversationsCount ?? activity.carlosConversationsCount ?? 0),
    completedLessonsCount: Number(
      stats.completedLessonsCount ??
      Object.values(lessonProgress.lessons || {}).filter(lesson => lesson?.completed).length
    ),
    completedMissions: completedMissionObjects,
    todaysMission,
  };
}

function isFamilyMission(mission) {
  if (!mission) return false;

  const text = [
    mission.type,
    mission.id,
    mission.title,
    mission.description,
  ].filter(Boolean).join(" ").toLowerCase();

  return text.includes("family");
}

function readUnlocked() {
  return readJSON(ACHIEVEMENTS_KEY) || {};
}

function writeUnlocked(unlocked) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
}

function queueStampCelebration(achievement, record) {
  if (typeof localStorage === "undefined") return;
  try {
    const queued = readJSON(STAMP_CELEBRATIONS_KEY);
    const celebrations = Array.isArray(queued) ? queued : [];
    if (celebrations.some(item => item?.id === achievement.id)) return;
    celebrations.push({
      id: achievement.id,
      title: achievement.title,
      category: achievement.category,
      rarity: achievement.rarity,
      unlockedAt: record.unlockedAt,
    });
    localStorage.setItem(STAMP_CELEBRATIONS_KEY, JSON.stringify(celebrations.slice(-5)));
  } catch { /* Achievement unlocks still succeed when celebration storage is unavailable. */ }
}

function readJSON(key) {
  if (typeof localStorage === "undefined") return null;

  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error(`Could not load ${key}:`, error);
    return null;
  }
}

function toPublicAchievement(achievement, record = {}) {
  return {
    id: achievement.id,
    title: achievement.title,
    description: achievement.description,
    unlocked: true,
    unlockedAt: record.unlockedAt || null,
    category: achievement.category,
    rarity: achievement.rarity,
    metric: achievement.metric,
    target: achievement.target,
  };
}

function createEvent(type, detail = {}) {
  return {
    type,
    detail,
    timestamp: new Date().toISOString(),
  };
}
