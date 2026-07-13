import { awardXP, getCurrentXP, getCurrentLevel, getCurrentStreak } from "../core/progress.js";
import { evaluateAchievements, getAchievements, resetAchievements } from "../core/achievements.js";
import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";

const LEVELS = [
  { name: "A1 Beginner", minXP: 0 },
  { name: "A2 Elementary", minXP: 500 },
  { name: "B1 Intermediate", minXP: 1500 },
  { name: "B2 Upper Intermediate", minXP: 3500 },
  { name: "C1 Advanced", minXP: 7000 },
];

const DIALECT_OPTIONS = [
  "Mexican Spanish",
  "Spain Spanish",
  "Colombian Spanish",
  "Caribbean Spanish",
  "Argentinian Spanish",
  "General Latin American Spanish",
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
    saveProfile() {
      const goalInput = document.getElementById("profile-goal");
      const dialectInput = document.getElementById("profile-dialect");
      if (!goalInput || !dialectInput) return;

      state.user.goal = goalInput.value.trim() || state.user.goal;
      state.user.dialect = dialectInput.value;
      saveState(state);
      refreshProfile();
    },
  };
}

export function renderProfile(appState) {
  const xp = getCurrentXP();
  const currentLevel = getCurrentLevel();
  const streak = getCurrentStreak();
  const stats = getActivityStats();
  const achievements = getAchievements();
  const completedLessons = Number(stats.completedMissionsCount || 14);
  const milestoneProgress = Math.min(100, (completedLessons / 10) * 100);
  const user = appState.user || {};

  return `
    <section class="profile-screen" aria-label="Profile">
      ${renderProfileHeader(currentLevel)}
      <section class="profile-card user-card">
        <div class="profile-avatar-wrap">
          <img src="assets/images/carlos-home.png" alt="">
          <button type="button" aria-label="Edit profile" onclick="document.querySelector('.tools-settings-card button')?.focus()"></button>
        </div>
        <div class="profile-user-copy">
          <h2>${escapeHTML(user.name || "Tom")}</h2>
          <p>&iexcl;Vamos a lograrlo! &#128170;</p>
          <span class="profile-location">Winnipeg, Canada</span>
          <span class="profile-calendar">Member since May 2024</span>
        </div>
        <div class="profile-milestone">
          <strong><span class="profile-fire" aria-hidden="true"></span>${streak}</strong>
          <p>Day Streak</p>
          <em>Next Milestone</em>
          <span>Complete 10 lessons<br>to unlock Level 2!</span>
          <i><b style="width:${milestoneProgress}%"></b></i>
          <small>${Math.min(completedLessons, 10)} / 10</small>
        </div>
      </section>

      <section class="profile-card stats-card">
        <h2>Your Stats</h2>
        <div class="profile-stat-list">
          ${statTile("target", "Lessons Completed", completedLessons, "Keep going!")}
          ${statTile("star", "Total XP", formatNumber(xp), "Nice work!")}
          ${statTile("time", "Study Time", "4h 18m", "This week")}
          ${statTile("book", "Words Practiced", stats.vocabularyReviewedCount || 742, "Keep it up!")}
        </div>
      </section>

      <section class="profile-achievements-section">
        <div class="profile-section-head">
          <h2>Achievements</h2>
          <button type="button" onclick="hablaProfile.evaluate()">View all <span aria-hidden="true">&rsaquo;</span></button>
        </div>
        <div class="achievement-grid">
          ${renderProfileAchievements(achievements)}
        </div>
      </section>

      <section class="profile-card preferences-card">
        <h2>Learning Preferences</h2>
        ${preferenceRow("goal", "Learning Goal", "Why you're learning", user.goal || "Speak with my wife's family")}
        ${preferenceRow("dialect", "Spanish Dialect", "Your preferred Spanish", user.dialect || "Neutral")}
        ${preferenceRow("daily", "Daily Goal", "Your daily study target", `${user.dailyTargetMinutes || 15} minutes`)}
        ${preferenceRow("reminders", "Reminders", "Stay on track", "On")}
      </section>

      <section class="profile-card tools-settings-card">
        <h2>Tools &amp; Settings</h2>
        ${settingsRow("edit", "Edit Profile", "hablaProfile.saveProfile()")}
        ${settingsRow("account", "Account Settings", "hablaProfile.evaluate()")}
        ${settingsRow("notifications", "Notifications", "hablaProfile.evaluate()")}
        ${settingsRow("support", "Help & Support", "hablaProfile.evaluate()")}
      </section>

      <section class="profile-card profile-carlos-help">
        <img src="assets/images/carlos-home.png" alt="">
        <div>
          <h2>Carlos is here to help</h2>
          <p>Have questions or need help? Chat with Carlos anytime.</p>
        </div>
        <button type="button" data-page="carlos">Chat with Carlos <span aria-hidden="true">&rsaquo;</span></button>
      </section>

      <div class="profile-hidden-fields" aria-hidden="true">
        <textarea id="profile-goal">${escapeHTML(user.goal || "")}</textarea>
        <select id="profile-dialect">
          ${DIALECT_OPTIONS.map(option => `
            <option value="${escapeHTML(option)}" ${user.dialect === option ? "selected" : ""}>${escapeHTML(option)}</option>
          `).join("")}
        </select>
      </div>
    </section>
  `;
}

function renderProfileHeader(level) {
  return `
    <header class="profile-header">
      <div class="profile-title-row">
        <div>
          <h1>Profile</h1>
          <p>Your journey, your progress.</p>
        </div>
        <button class="profile-level-pill" type="button">${escapeHTML(level)} <span aria-hidden="true">&rsaquo;</span></button>
      </div>
    </header>
  `;
}

function statTile(icon, label, value, detail) {
  return `
    <div class="profile-stat">
      <span class="profile-stat-icon ${icon}" aria-hidden="true"></span>
      <strong>${escapeHTML(value)}</strong>
      <em>${escapeHTML(label)}</em>
      <small>${escapeHTML(detail)}</small>
    </div>
  `;
}

function renderProfileAchievements(achievements) {
  const fallback = [
    { title: "7 Day Streak", description: "Keep it going!", unlocked: true },
    { title: "First Steps", description: "Complete 1 lesson", unlocked: true },
    { title: "Conversation Starter", description: "Have 10 chats", unlocked: true },
    { title: "Word Explorer", description: "Practice 500 words", unlocked: true },
    { title: "Dedicated Learner", description: "30 day streak", unlocked: false },
  ];
  const list = achievements?.length ? achievements.slice(0, 5) : fallback;
  return list.map(renderAchievement).join("");
}

function renderAchievement(achievement) {
  return `
    <article class="achievement ${achievement.unlocked ? "unlocked" : "locked"}">
      <div class="achievement-icon">${achievement.unlocked ? "&#10003;" : "&#9671;"}</div>
      <h3>${escapeHTML(achievement.title)}</h3>
      <p>${escapeHTML(achievement.description)}</p>
      <small>${achievement.unlocked ? "&#10003;" : "7 / 30"}</small>
    </article>
  `;
}

function preferenceRow(icon, title, subtitle, value) {
  return `
    <button class="profile-list-row" type="button" onclick="document.getElementById('profile-goal')?.focus()">
      <span class="row-icon ${icon}" aria-hidden="true"></span>
      <strong>${escapeHTML(title)}<small>${escapeHTML(subtitle)}</small></strong>
      <em>${escapeHTML(value)}</em>
      <i aria-hidden="true">&rsaquo;</i>
    </button>
  `;
}

function settingsRow(icon, title, action) {
  return `
    <button class="profile-list-row" type="button" onclick="${action}">
      <span class="row-icon ${icon}" aria-hidden="true"></span>
      <strong>${escapeHTML(title)}</strong>
      <i aria-hidden="true">&rsaquo;</i>
    </button>
  `;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
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

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function refreshProfile() {
  const profileButton = document.querySelector('[data-page="profile"]');
  if (profileButton) profileButton.click();
}
