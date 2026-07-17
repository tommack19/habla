import { awardXP, getCurrentXP, getCurrentLevel, getCurrentStreak } from "../core/progress.js";
import { evaluateAchievements, getAchievements, resetAchievements } from "../core/achievements.js";
import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";
import { CARLOS_FALLBACK_ONERROR, getCarlosAsset } from "../data/carlosAssets.js";
import { getCourseProgress } from "../core/content.js";

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
    toggleAchievements(button) {
      const grid = document.querySelector(".achievement-grid");
      if (!grid) return;
      const expanded = grid.classList.toggle("expanded");
      button?.setAttribute("aria-expanded", String(expanded));
      const label = button?.querySelector("span:first-child");
      if (label) label.textContent = expanded ? "Show less" : "View all";
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
  const courseProgress = getCourseProgress();
  const completedLessons = Number(courseProgress.completedCount || 0);
  const milestoneProgress = Math.min(100, (completedLessons / 10) * 100);
  const user = appState.user || {};
  const initials = getInitials(user.name || "Habla Learner");
  const nextLevel = getNextLevel(xp);

  return `
    <section class="profile-screen" aria-label="Profile">
      ${renderProfileHeader(currentLevel)}
      <section class="profile-card user-card">
        <div class="profile-avatar-wrap">
          <span class="profile-user-avatar" role="img" aria-label="${escapeHTML(user.name || "Habla learner")} profile">${escapeHTML(initials)}</span>
          <button type="button" aria-label="Edit profile" onclick="document.querySelector('.tools-settings-card button')?.focus()">${profileIcon("edit")}</button>
        </div>
        <div class="profile-user-copy">
          <h2>${escapeHTML(user.name || "Tom")}</h2>
          <p>&iexcl;Vamos a lograrlo!</p>
          <span class="profile-location">${profileIcon("dialect")}${escapeHTML(user.dialect || "Spanish learner")}</span>
          <span class="profile-calendar">${profileIcon("daily")}${escapeHTML(`${user.dailyTargetMinutes || 15}-minute daily goal`)}</span>
        </div>
        <div class="profile-milestone">
          <strong><span class="profile-fire" aria-hidden="true">${profileIcon("fire")}</span>${streak}</strong>
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
          ${statTile("target", "Lessons Completed", completedLessons, `${courseProgress.percent || 0}% of A1`)}
          ${statTile("star", "Total XP", formatNumber(xp), nextLevel ? `${formatNumber(nextLevel.minXP - xp)} to ${nextLevel.name.split(" ")[0]}` : "Top level reached")}
          ${statTile("time", "Study Time", formatMinutes(stats.studyMinutes), "Recorded activity")}
          ${statTile("book", "Words Practiced", formatNumber(stats.vocabularyReviewedCount), "Reviewed vocabulary")}
        </div>
      </section>

      <section class="profile-achievements-section">
        <div class="profile-section-head">
          <h2>Achievements</h2>
          <button type="button" aria-expanded="false" onclick="hablaProfile.toggleAchievements(this)"><span>View all</span> <i aria-hidden="true">&rsaquo;</i></button>
        </div>
        <div class="achievement-grid">
          ${renderProfileAchievements(achievements)}
        </div>
      </section>

      <section class="profile-card preferences-card">
        <h2>Learning Preferences</h2>
        ${preferenceRow("goal", "Learning Goal", "Why you're learning", user.goal || "Not set")}
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
        <img src="${getCarlosAsset("speaking")}" alt="Carlos offering help with your Spanish" onerror="${CARLOS_FALLBACK_ONERROR}">
        <div>
          <h2>Carlos is here to help</h2>
          <p>Have questions or need help? Chat with Carlos anytime.</p>
        </div>
        <button type="button" data-page="carlos">${profileIcon("chat")}Chat with Carlos <span aria-hidden="true">&rsaquo;</span></button>
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
      <span class="profile-stat-icon ${icon}" aria-hidden="true">${profileIcon(icon)}</span>
      <strong>${escapeHTML(value)}</strong>
      <em>${escapeHTML(label)}</em>
      <small>${escapeHTML(detail)}</small>
    </div>
  `;
}

function renderProfileAchievements(achievements) {
  return (achievements || []).map((achievement, index) => renderAchievement(achievement, index)).join("");
}

function renderAchievement(achievement, index) {
  return `
    <article class="achievement ${achievement.unlocked ? "unlocked" : "locked"} ${index >= 5 ? "is-extra" : ""}">
      <div class="achievement-icon">${profileIcon(getAchievementIcon(achievement.id))}</div>
      <h3>${escapeHTML(achievement.title)}</h3>
      <p>${escapeHTML(achievement.description)}</p>
      <small>${achievement.unlocked ? `${profileIcon("check")} Unlocked` : `${profileIcon("lock")} Locked`}</small>
    </article>
  `;
}

function preferenceRow(icon, title, subtitle, value) {
  return `
    <button class="profile-list-row" type="button" onclick="document.getElementById('profile-goal')?.focus()">
      <span class="row-icon ${icon}" aria-hidden="true">${profileIcon(icon)}</span>
      <strong>${escapeHTML(title)}<small>${escapeHTML(subtitle)}</small></strong>
      <em>${escapeHTML(value)}</em>
      <i aria-hidden="true">&rsaquo;</i>
    </button>
  `;
}

function settingsRow(icon, title, action) {
  return `
    <button class="profile-list-row" type="button" onclick="${action}">
      <span class="row-icon ${icon}" aria-hidden="true">${profileIcon(icon)}</span>
      <strong>${escapeHTML(title)}</strong>
      <i aria-hidden="true">&rsaquo;</i>
    </button>
  `;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatMinutes(minutes) {
  const total = Number(minutes || 0);
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const remainder = total % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

function getInitials(name) {
  return String(name || "H")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("") || "H";
}

function getAchievementIcon(id) {
  if (id === "on_fire") return "fire";
  if (id === "vocab_starter" || id === "pronunciation_start") return "book";
  if (id === "quiz_rookie") return "target";
  if (id === "family_ready") return "chat";
  if (id === "mission_complete") return "star";
  return "trophy";
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
    studyMinutes: Number(activity.studyMinutes || activity.learningMinutes || activity.speakingMinutes || 0),
  };
}

function profileIcon(name) {
  const icons = {
    target: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/><path d="m14.5 9.5 6-6M16 3.5h4.5V8"/>`,
    star: `<path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z"/>`,
    time: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>`,
    book: `<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23V5.5Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23V5.5Z"/>`,
    fire: `<path d="M13.5 2.5c.8 4-2.4 5-1.5 8.2 1-1.2 2.2-2 3.8-2.5 1.5 1.7 2.2 3.7 2.2 5.8a6 6 0 1 1-12 0c0-3.3 2-6.3 5.8-9.2-.2 2.5.5 3.5 1.7 4.3.8-2 .5-4.2 0-6.6Z"/>`,
    edit: `<path d="m4 20 4.4-1 10.9-10.9a2.2 2.2 0 0 0-3.1-3.1L5.3 15.9 4 20Z"/><path d="m14.8 6.4 3.1 3.1"/>`,
    dialect: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>`,
    daily: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
    goal: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/><path d="M12 3V1M21 12h2M12 21v2M3 12H1"/>`,
    reminders: `<path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z"/><path d="M10 21h4"/>`,
    account: `<path d="M4 20v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2"/><circle cx="12" cy="7" r="4"/>`,
    notifications: `<path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9Z"/><path d="M10 21h4"/>`,
    support: `<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4.2 2.3c-1.2.7-1.7 1.2-1.7 2.7M12 17h.01"/>`,
    chat: `<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/>`,
    trophy: `<path d="M8 4h8v4a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 12v5M8 21h8M9 17h6"/>`,
    check: `<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16.5 8"/>`,
    lock: `<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>`,
  };
  return `<svg class="profile-svg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.star}</svg>`;
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
