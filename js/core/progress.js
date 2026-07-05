const PROGRESS_KEY = "habla_progress_v1";

const LEVELS = [
  { id: "a1", name: "A1 Beginner", minXP: 0 },
  { id: "a2", name: "A2 Elementary", minXP: 500 },
  { id: "b1", name: "B1 Intermediate", minXP: 1500 },
  { id: "b2", name: "B2 Upper Intermediate", minXP: 3500 },
  { id: "c1", name: "C1 Advanced", minXP: 7000 },
];

let appState = null;
let onProgressChange = null;
let progress = createDefaultProgress();

export function initializeProgressEngine(state, options = {}) {
  appState = state;
  onProgressChange = options.onProgressChange || null;
  progress = loadProgress(state);
  syncState();

  return createEvent("progress:initialized", {
    xp: progress.xp,
    level: getCurrentLevel(),
    streak: progress.streak,
  });
}

export function awardXP(amount, reason = "XP awarded") {
  const xpAmount = Number(amount);
  if (!Number.isFinite(xpAmount) || xpAmount <= 0) {
    return createEvent("xp:ignored", { amount, reason });
  }

  const previousXP = progress.xp;
  const previousLevel = getCurrentLevel();
  const streakEvent = touchToday();

  progress.xp += Math.round(xpAmount);
  const currentLevel = getCurrentLevel();
  const events = [
    createEvent("xp:awarded", {
      amount: Math.round(xpAmount),
      reason,
      previousXP,
      currentXP: progress.xp,
    }),
  ];

  if (streakEvent) events.push(streakEvent);

  if (currentLevel !== previousLevel) {
    events.push(createEvent("level:changed", {
      previousLevel,
      currentLevel,
    }));
  }

  persistAndNotify(events);
  return events;
}

export function getCurrentXP() {
  return progress.xp;
}

export function getCurrentLevel() {
  return getCurrentLevelRecord().name;
}

function getCurrentLevelRecord() {
  return LEVELS.reduce((current, level) => (
    progress.xp >= level.minXP ? level : current
  ), LEVELS[0]);
}

export function getCurrentStreak() {
  return progress.streak;
}

export function awardAchievement(id) {
  if (!id) return createEvent("achievement:ignored", { id });

  if (progress.achievements.includes(id)) {
    return createEvent("achievement:duplicate", { id });
  }

  const streakEvent = touchToday();
  progress.achievements.push(id);

  const events = [
    createEvent("achievement:awarded", { id }),
  ];

  if (streakEvent) events.push(streakEvent);
  persistAndNotify(events);
  return events;
}

export function completeMission(id) {
  if (!id) return createEvent("mission:ignored", { id });

  if (progress.completedMissions.includes(id)) {
    return createEvent("mission:duplicate", { id });
  }

  const streakEvent = touchToday();
  progress.completedMissions.push(id);

  const events = [
    createEvent("mission:completed", { id }),
  ];

  if (streakEvent) events.push(streakEvent);
  persistAndNotify(events);
  return events;
}

function createDefaultProgress() {
  return {
    xp: 0,
    streak: 0,
    lastActiveDate: null,
    achievements: [],
    completedMissions: [],
  };
}

function loadProgress(state) {
  const saved = readProgress();
  const fallbackXP = Number(state?.user?.xp || 0);
  const fallbackStreak = Number(state?.user?.streak || 0);

  return {
    ...createDefaultProgress(),
    ...saved,
    xp: Number(saved?.xp ?? fallbackXP),
    streak: Number(saved?.streak ?? fallbackStreak),
    achievements: Array.isArray(saved?.achievements) ? saved.achievements : [],
    completedMissions: Array.isArray(saved?.completedMissions) ? saved.completedMissions : [],
  };
}

function readProgress() {
  if (typeof localStorage === "undefined") return null;

  try {
    const saved = localStorage.getItem(PROGRESS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Could not load Habla progress:", error);
    return null;
  }
}

function writeProgress() {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function persistAndNotify(events) {
  syncState();
  writeProgress();

  const progressEvent = createEvent("progress:changed", {
    xp: progress.xp,
    level: getCurrentLevel(),
    streak: progress.streak,
    events,
  });

  if (typeof onProgressChange === "function") {
    onProgressChange(progressEvent);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("habla:progress", { detail: progressEvent }));
  }
}

function syncState() {
  if (!appState?.user) return;

  appState.user.xp = progress.xp;
  appState.user.level = getCurrentLevel();
  appState.user.streak = progress.streak;
}

function touchToday() {
  const today = getTodayKey();
  if (progress.lastActiveDate === today) return null;

  const yesterday = getOffsetDateKey(-1);
  const previousStreak = progress.streak;
  progress.streak = progress.lastActiveDate === yesterday ? progress.streak + 1 : 1;
  progress.lastActiveDate = today;

  return createEvent("streak:changed", {
    previousStreak,
    currentStreak: progress.streak,
  });
}

function getTodayKey() {
  return getOffsetDateKey(0);
}

function getOffsetDateKey(offsetDays) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

function createEvent(type, detail = {}) {
  return {
    type,
    detail,
    timestamp: new Date().toISOString(),
  };
}
