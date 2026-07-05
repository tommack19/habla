import { awardXP, getCurrentXP, getCurrentLevel, getCurrentStreak } from "../core/progress.js";
import { evaluateAchievements, getAchievements, resetAchievements } from "../core/achievements.js";

const LEVELS = [
  { name: "A1 Beginner", minXP: 0 },
  { name: "A2 Elementary", minXP: 500 },
  { name: "B1 Intermediate", minXP: 1500 },
  { name: "B2 Upper Intermediate", minXP: 3500 },
  { name: "C1 Advanced", minXP: 7000 },
];

if (typeof window !== "undefined") {
  window.hablaProfile = {
    addXP() {
      awardXP(25, "Dev Tools");
      refreshProfile();
    },
    evaluate() {
      evaluateAchievements();
      refreshProfile();
    },
    resetAchievements() {
      resetAchievements();
      refreshProfile();
    },
  };
}

export function renderProfile(state) {
  const xp = getCurrentXP();
  const currentLevel = getCurrentLevel();
  const streak = getCurrentStreak();
  const nextLevel = getNextLevel(xp);
  const currentLevelFloor = getCurrentLevelFloor(xp);
  const targetXP = nextLevel ? nextLevel.minXP : xp;
  const progressPercent = nextLevel
    ? Math.min(100, Math.round(((xp - currentLevelFloor) / (nextLevel.minXP - currentLevelFloor)) * 100))
    : 100;
  const stats = getActivityStats();
  const achievements = getAchievements();

  return `
    <section class="profile-screen" aria-label="Me">
      <div class="profile-header">
        <span class="profile-eyebrow">Me</span>
        <h1>${state.user.name}</h1>
        <p>${currentLevel} · ${streak} day streak</p>
      </div>

      <section class="profile-card user-card">
        <div class="avatar-mark">${state.user.name.charAt(0).toUpperCase()}</div>
        <div class="user-details">
          ${profileRow("Name", state.user.name)}
          ${profileRow("Current level", currentLevel)}
          ${profileRow("Goal", state.user.goal)}
          ${profileRow("Dialect", state.user.dialect)}
          ${profileRow("Daily target", `${state.user.dailyTargetMinutes} minutes`)}
        </div>
      </section>

      <section class="profile-card progress-card-profile">
        <div class="section-heading">
          <span class="profile-eyebrow">Progress</span>
          <h2>Your Spanish Journey</h2>
        </div>
        <div class="progress-stat-grid">
          ${statTile("Total XP", xp)}
          ${statTile("Current Level", currentLevel)}
          ${statTile("Next Target", nextLevel ? `${nextLevel.minXP} XP` : "Max level")}
          ${statTile("Current Streak", `${streak} days`)}
        </div>
        <div class="level-progress">
          <div class="level-progress-label">
            <span>${currentLevel}</span>
            <span>${nextLevel ? nextLevel.name : "Complete"}</span>
          </div>
          <div class="level-progress-track">
            <div style="width:${progressPercent}%"></div>
          </div>
          <small>${nextLevel ? `${Math.max(0, nextLevel.minXP - xp)} XP to next level` : "You reached the top level."}</small>
        </div>
      </section>

      <section class="profile-card stats-card">
        <div class="section-heading">
          <span class="profile-eyebrow">Stats</span>
          <h2>Practice Totals</h2>
        </div>
        <div class="profile-stat-list">
          ${statTile("Missions completed", stats.completedMissionsCount)}
          ${statTile("Quizzes completed", stats.quizzesCompletedCount)}
          ${statTile("Vocabulary reviewed", stats.vocabularyReviewedCount)}
          ${statTile("Pronunciation attempts", stats.pronunciationAttempts)}
        </div>
      </section>

      <section class="profile-card achievements-card">
        <div class="section-heading">
          <span class="profile-eyebrow">Achievements</span>
          <h2>Badges</h2>
        </div>
        <div class="achievement-grid">
          ${achievements.map(renderAchievement).join("")}
        </div>
      </section>

      <section class="profile-card dev-card">
        <div>
          <span class="profile-eyebrow">Dev Tools</span>
          <p>Small test controls for progress and achievement states.</p>
        </div>
        <div class="dev-actions">
          <button type="button" onclick="hablaProfile.addXP()">Add 25 XP</button>
          <button type="button" onclick="hablaProfile.evaluate()">Evaluate achievements</button>
          <button type="button" onclick="hablaProfile.resetAchievements()">Reset achievements</button>
        </div>
      </section>
    </section>
  `;
}

function profileRow(label, value) {
  return `<div class="profile-row"><span>${label}</span><strong>${value}</strong></div>`;
}

function statTile(label, value) {
  return `<div class="profile-stat"><span>${label}</span><strong>${value}</strong></div>`;
}

function renderAchievement(achievement) {
  return `
    <article class="achievement ${achievement.unlocked ? "unlocked" : "locked"}">
      <div class="achievement-icon">${achievement.unlocked ? "*" : "-"}</div>
      <div>
        <h3>${achievement.title}</h3>
        <p>${achievement.description}</p>
        <small>${achievement.unlocked ? "Unlocked" : "Locked"}</small>
      </div>
    </article>
  `;
}

function getNextLevel(xp) {
  return LEVELS.find(level => level.minXP > xp) || null;
}

function getCurrentLevelFloor(xp) {
  return LEVELS.reduce((floor, level) => xp >= level.minXP ? level.minXP : floor, 0);
}

function getActivityStats() {
  const activity = readJSON("habla_activity_stats_v1") || {};
  const progress = readJSON("habla_progress_v1") || {};
  const missionRecord = readJSON("habla_daily_mission_v1");
  const completedMissions = Array.isArray(progress.completedMissions) ? progress.completedMissions.length : 0;
  const todaysMissionCompleted = missionRecord?.mission?.completed ? 1 : 0;

  return {
    completedMissionsCount: Number(activity.completedMissionsCount ?? completedMissions + todaysMissionCompleted),
    quizzesCompletedCount: Number(activity.quizzesCompletedCount ?? 0),
    vocabularyReviewedCount: Number(activity.vocabularyReviewedCount ?? 0),
    pronunciationAttempts: Number(activity.pronunciationAttempts ?? 0),
  };
}

function readJSON(key) {
  if (typeof localStorage === "undefined") return null;

  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function refreshProfile() {
  const profileButton = document.querySelector('[data-page="profile"]');
  if (profileButton) profileButton.click();
}
