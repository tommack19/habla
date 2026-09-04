import { awardXP } from "./progress.js";

const MISSIONS_KEY = "habla_daily_mission_v1";

const MISSION_TEMPLATES = [
  {
    type: "learn-vocabulary",
    title: "Learn vocabulary",
    description: "Study 8 beginner Spanish words and say each one out loud.",
    xpReward: 25,
  },
  {
    type: "complete-quiz",
    title: "Complete quiz",
    description: "Finish one Spanish-to-English practice quiz.",
    xpReward: 35,
  },
  {
    type: "practice-pronunciation",
    title: "Practice pronunciation",
    description: "Listen to 5 Spanish phrases and repeat them with the microphone.",
    xpReward: 30,
  },
  {
    type: "speak-with-carlos",
    title: "Speak with Carlos",
    description: "Send Carlos a message and practice a short conversation.",
    xpReward: 40,
  },
  {
    type: "review-grammar",
    title: "Review grammar",
    description: "Review one grammar basics card and write your own example.",
    xpReward: 25,
  },
];

export function getTodaysMission() {
  const saved = readMission();
  const today = getTodayKey();

  if (saved?.date === today && saved?.mission) {
    return saved.mission;
  }

  return generateMission();
}

export function completeMission(id) {
  const mission = getTodaysMission();

  if (!id || mission.id !== id) {
    return createEvent("mission:ignored", {
      id,
      reason: "Mission id does not match today's mission.",
      mission,
    });
  }

  if (mission.completed) {
    return createEvent("mission:duplicate", { id, mission });
  }

  const completedMission = {
    ...mission,
    completed: true,
  };

  writeMission(completedMission);

  const xpEvents = awardXP(completedMission.xpReward, `Daily mission: ${completedMission.title}`);
  return [
    createEvent("mission:completed", { mission: completedMission }),
    ...normalizeEvents(xpEvents),
  ];
}

export function resetDailyMission() {
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(MISSIONS_KEY);
  }

  const mission = generateMission();
  return createEvent("mission:reset", { mission });
}

export function generateMission() {
  const today = getTodayKey();
  const template = MISSION_TEMPLATES[getMissionIndex(today)];
  const mission = {
    id: `${today}-${template.type}`,
    title: template.title,
    description: template.description,
    xpReward: template.xpReward,
    completed: false,
  };

  writeMission(mission, today);
  return mission;
}

function readMission() {
  if (typeof localStorage === "undefined") return null;

  try {
    const saved = localStorage.getItem(MISSIONS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error("Could not load Habla daily mission:", error);
    return null;
  }
}

function writeMission(mission, date = getTodayKey()) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(MISSIONS_KEY, JSON.stringify({ date, mission }));
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getMissionIndex(dateKey) {
  return [...dateKey].reduce((sum, char) => sum + char.charCodeAt(0), 0) % MISSION_TEMPLATES.length;
}

function normalizeEvents(events) {
  return Array.isArray(events) ? events : [events];
}

function createEvent(type, detail = {}) {
  return {
    type,
    detail,
    timestamp: new Date().toISOString(),
  };
}
