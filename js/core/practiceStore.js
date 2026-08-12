const STORAGE_KEY = "habla_practice_state_v1";

const EMPTY_STATE = Object.freeze({
  version: 1,
  cards: {},
  weakSpots: {},
  gameScores: {},
  history: [],
});

export function readPracticeState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return normalizeState(parsed);
  } catch {
    return normalizeState();
  }
}

export function getCardSchedule(cardKey) {
  return readPracticeState().cards[cardKey] || null;
}

export function ratePracticeCard(cardKey, rating) {
  const state = readPracticeState();
  const previous = state.cards[cardKey] || {};
  const now = new Date();
  const oldInterval = Math.max(0, Number(previous.intervalDays || 0));
  const intervalDays = rating === "again" ? 0.007
    : rating === "hard" ? Math.max(0.5, oldInterval * 1.35 || 1)
      : Math.max(2, oldInterval * 2.4 || 3);
  const previousMastery = Math.max(0, Math.min(100, Number(previous.mastery || 0)));
  const mastery = rating === "again" ? Math.max(0, previousMastery - 12)
    : rating === "hard" ? Math.min(100, previousMastery + 4)
      : Math.min(100, previousMastery + 14);
  state.cards[cardKey] = {
    ...previous,
    rating,
    intervalDays,
    mastery,
    difficulty: rating,
    dueAt: new Date(now.getTime() + intervalDays * 86400000).toISOString(),
    lastReviewedAt: now.toISOString(),
    reviewCount: Number(previous.reviewCount || 0) + 1,
    correctStreak: rating === "got-it" ? Number(previous.correctStreak || 0) + 1 : 0,
  };
  writePracticeState(state);
  return state.cards[cardKey];
}

export function isCardDue(cardKey, now = Date.now()) {
  const schedule = getCardSchedule(cardKey);
  return !schedule?.dueAt || Date.parse(schedule.dueAt) <= now;
}

export function recordPracticeResult({ mode, answered = 0, correct = 0, missed = 0, topic = "" }) {
  const state = readPracticeState();
  state.history.unshift({ id: `${Date.now()}-${mode}`, mode, topic, answered, correct, missed, completedAt: new Date().toISOString() });
  state.history = state.history.slice(0, 60);
  writePracticeState(state);
}

export function recordWeakSpot(id, title, correct) {
  const state = readPracticeState();
  const current = state.weakSpots[id] || { id, title, attempts: 0, correct: 0 };
  current.title = title || current.title;
  current.attempts += 1;
  if (correct) current.correct += 1;
  current.updatedAt = new Date().toISOString();
  state.weakSpots[id] = current;
  writePracticeState(state);
}

export function saveGameScore(gameId, score, metadata = {}) {
  const state = readPracticeState();
  const previous = state.gameScores[gameId] || { best: 0, plays: 0 };
  const elapsedSeconds = Number(metadata.elapsedSeconds || 0);
  state.gameScores[gameId] = {
    ...previous,
    best: Math.max(previous.best, Number(score || 0)),
    bestStreak: Math.max(Number(previous.bestStreak || 0), Number(metadata.streak || 0)),
    bestTime: elapsedSeconds > 0
      ? (!previous.bestTime ? elapsedSeconds : Math.min(Number(previous.bestTime), elapsedSeconds))
      : previous.bestTime || null,
    plays: previous.plays + 1,
    lastPlayedAt: new Date().toISOString(),
  };
  writePracticeState(state);
  return state.gameScores[gameId];
}

export function getPracticeStreak(state = readPracticeState()) {
  const days = new Set(state.history.map(item => String(item.completedAt || "").slice(0, 10)).filter(Boolean));
  let streak = 0;
  const cursor = new Date();
  while (days.has(toLocalDate(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function normalizeState(value = {}) {
  return {
    ...EMPTY_STATE,
    ...(value && typeof value === "object" ? value : {}),
    cards: value?.cards && typeof value.cards === "object" ? value.cards : {},
    weakSpots: value?.weakSpots && typeof value.weakSpots === "object" ? value.weakSpots : {},
    gameScores: value?.gameScores && typeof value.gameScores === "object" ? value.gameScores : {},
    history: Array.isArray(value?.history) ? value.history : [],
  };
}

function writePracticeState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  window.dispatchEvent(new CustomEvent("habla:practice-state", { detail: state }));
}

function toLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
