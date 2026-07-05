import { getCurrentXP, getCurrentStreak, awardAchievement as recordProgressAchievement } from "./progress.js";

const ACHIEVEMENTS_KEY = "habla_achievements_v1";
const MISSIONS_KEY = "habla_daily_mission_v1";
const PROGRESS_KEY = "habla_progress_v1";
const ACTIVITY_KEY = "habla_activity_stats_v1";

const ACHIEVEMENTS = [
  {
    id: "first_steps",
    title: "First Steps",
    description: "Earn your first XP.",
    isEligible: ({ xp }) => xp > 0,
  },
  {
    id: "mission_complete",
    title: "Mission Complete",
    description: "Complete your first daily mission.",
    isEligible: ({ completedMissionsCount }) => completedMissionsCount >= 1,
  },
  {
    id: "vocab_starter",
    title: "Vocab Starter",
    description: "Review your first vocabulary cards.",
    isEligible: ({ vocabularyReviewedCount }) => vocabularyReviewedCount >= 5,
  },
  {
    id: "quiz_rookie",
    title: "Quiz Rookie",
    description: "Complete your first quiz.",
    isEligible: ({ quizzesCompletedCount }) => quizzesCompletedCount >= 1,
  },
  {
    id: "pronunciation_start",
    title: "First Words",
    description: "Try pronunciation practice.",
    isEligible: ({ pronunciationAttempts }) => pronunciationAttempts >= 1,
  },
  {
    id: "on_fire",
    title: "On Fire",
    description: "Build a 3-day streak.",
    isEligible: ({ streak }) => streak >= 3,
  },
  {
    id: "family_ready",
    title: "Family Ready",
    description: "Complete a family-related mission.",
    isEligible: ({ completedMissions, todaysMission }) => {
      return completedMissions.some(isFamilyMission) || isFamilyMission(todaysMission);
    },
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
  }

  return createEvent("achievements:reset");
}

function buildContext(stats) {
  const progress = readJSON(PROGRESS_KEY) || {};
  const activity = readJSON(ACTIVITY_KEY) || {};
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
  };
}

function createEvent(type, detail = {}) {
  return {
    type,
    detail,
    timestamp: new Date().toISOString(),
  };
}
