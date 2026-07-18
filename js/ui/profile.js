import { awardXP, getCurrentXP, getCurrentStreak } from "../core/progress.js";
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
    openSettings(panel) {
      const dialog = document.getElementById("profile-settings-dialog");
      if (!dialog) return;
      dialog.querySelectorAll("[data-profile-panel]").forEach(section => { section.hidden = section.dataset.profilePanel !== panel; });
      dialog.dataset.activePanel = panel;
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      window.setTimeout(() => dialog.querySelector("[data-profile-panel]:not([hidden]) input, [data-profile-panel]:not([hidden]) textarea, [data-profile-panel]:not([hidden]) select, [data-profile-panel]:not([hidden]) button")?.focus(), 0);
    },
    closeSettings() {
      const dialog = document.getElementById("profile-settings-dialog");
      if (!dialog) return;
      if (typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    },
    saveSettings(panel) {
      state.user ||= {};
      if (panel === "goal") state.user.goal = document.getElementById("profile-setting-goal")?.value.trim() || state.user.goal;
      if (panel === "daily") state.user.dailyTargetMinutes = Number(document.getElementById("profile-setting-daily")?.value || state.user.dailyTargetMinutes || 15);
      if (panel === "edit") {
        state.user.name = document.getElementById("profile-setting-name")?.value.trim() || state.user.name;
        state.user.goal = document.getElementById("profile-setting-edit-goal")?.value.trim() || state.user.goal;
      }
      if (panel === "account") state.user.name = document.getElementById("profile-setting-account-name")?.value.trim() || state.user.name;
      if (panel === "notifications") {
        state.user.notifications = {
          dailyReminder: Boolean(document.getElementById("profile-notify-daily")?.checked),
          achievements: Boolean(document.getElementById("profile-notify-achievements")?.checked),
          lessonUpdates: Boolean(document.getElementById("profile-notify-lessons")?.checked),
        };
      }
      saveState(state);
      window.hablaProfile.closeSettings();
      refreshProfile();
    },
  };
}

export function renderProfile(appState) {
  const xp = getCurrentXP();
  const streak = getCurrentStreak();
  const stats = getActivityStats();
  const achievements = getAchievements();
  const courseProgress = getCourseProgress();
  const completedLessons = Number(courseProgress.completedCount || 0);
  const milestoneProgress = Math.min(100, (completedLessons / 10) * 100);
  const user = appState.user || {};
  const initials = getInitials(user.name || "Habla Learner");
  const nextLevel = getNextLevel(xp);
  const journeyLevel = getJourneyLevelName(xp);
  const lessonsRemaining = Math.max(0, 10 - completedLessons);

  return `
    <section class="profile-screen" aria-label="Profile">
      ${renderProfileHeader()}
      <section class="profile-card user-card">
        <div class="profile-avatar-wrap">
          <span class="profile-user-avatar" role="img" aria-label="${escapeHTML(user.name || "Habla learner")} profile">${escapeHTML(initials)}</span>
          <button type="button" aria-label="Edit profile" onclick="hablaProfile.openSettings('edit')">${profileIcon("edit")}</button>
        </div>
        <div class="profile-user-copy">
          <h2>${escapeHTML(user.name || "Tom")}</h2>
          <p>${escapeHTML(journeyLevel)}</p>
          <span class="profile-streak-chip">${profileIcon("fire")} ${streak} day streak</span>
          <span class="profile-calendar">${profileIcon("daily")}${escapeHTML(`${user.dailyTargetMinutes || 15}-minute daily goal`)}</span>
        </div>
        <div class="profile-milestone">
          <em>Next milestone</em>
          <strong>${lessonsRemaining ? `${lessonsRemaining} lesson${lessonsRemaining === 1 ? "" : "s"} until Level 2` : "Level 2 is ready"}</strong>
          <i><b style="width:${milestoneProgress}%"></b></i>
          <small>${Math.min(completedLessons, 10)} / 10</small>
        </div>
      </section>

      <section class="profile-card stats-card">
        <h2>Your Stats</h2>
        <div class="profile-stat-list">
          ${statTile("target", "Lessons Completed", completedLessons, `${courseProgress.percent || 0}% of A1`)}
          ${statTile("star", "Total XP", formatNumber(xp), nextLevel ? `${formatNumber(nextLevel.minXP - xp)} to ${nextLevel.name.split(" ")[0]}` : "Top level reached")}
          ${statTile("time", "Recorded Study", formatMinutes(stats.studyMinutes), "Saved sessions")}
          ${statTile("book", "Words Practiced", formatNumber(stats.vocabularyReviewedCount), "Reviewed vocabulary")}
        </div>
      </section>

      <section class="profile-card learning-skills-card">
        <div class="learning-skills-head">
          <div><small>Learning Journey</small><h2>Your Route</h2></div>
          <span>${completedLessons} lessons completed</span>
        </div>
        ${renderJourneyRoute(completedLessons)}
        <h3 class="learning-skills-title">Skills you are building</h3>
        <div class="learning-skills-list">
          ${learningSkillRow("chat", "Conversation", stats.carlosConversationsCount, 10, "conversations")}
          ${learningSkillRow("book", "Vocabulary", stats.vocabularyReviewedCount, 100, "words")}
          ${learningSkillRow("grammar", "Grammar", stats.quizzesCompletedCount, 10, "quizzes")}
          ${learningSkillRow("voice", "Pronunciation", stats.pronunciationAttempts, 10, "attempts")}
        </div>
      </section>

      <section class="profile-achievements-section">
        <div class="profile-section-head">
          <h2>Latest Stamps</h2>
          <button type="button" data-page="journey"><span>Open passport</span> <i aria-hidden="true">&rsaquo;</i></button>
        </div>
        <div class="achievement-grid">
          ${renderProfileAchievements(achievements)}
        </div>
      </section>

      <section class="profile-card preferences-card">
        <h2>Learning</h2>
        ${preferenceRow("goal", "Learning Goal", "Why you're learning", user.goal || "Not set")}
        ${preferenceRow("daily", "Daily Goal", "Your daily study target", `${user.dailyTargetMinutes || 15} minutes`)}
      </section>

      <section class="profile-card tools-settings-card">
        <h2>Tools &amp; Settings</h2>
        ${settingsRow("edit", "Edit Profile", "hablaProfile.openSettings('edit')")}
        ${settingsRow("account", "Account Settings", "hablaProfile.openSettings('account')")}
        ${settingsRow("notifications", "Notifications", "hablaProfile.openSettings('notifications')")}
        ${settingsRow("support", "Help & Support", "hablaProfile.openSettings('support')")}
      </section>

      <section class="profile-card profile-carlos-help">
        <img src="${getCarlosAsset("speaking")}" alt="Carlos offering help with your Spanish" onerror="${CARLOS_FALLBACK_ONERROR}">
        <div>
          <h2>Need a hand?</h2>
          <p>Carlos is always available. Ask him anything about your Spanish.</p>
        </div>
        <button type="button" data-page="carlos">${profileIcon("chat")}Chat with Carlos <span aria-hidden="true">&rsaquo;</span></button>
      </section>

      ${renderProfileSettingsDialog(user, journeyLevel)}
    </section>
  `;
}

function renderProfileHeader() {
  return `
    <header class="profile-header">
      <div class="profile-title-row">
        <div>
          <h1>My Journey</h1>
          <p>Your Spanish story, all in one place.</p>
        </div>
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

function learningSkillRow(icon, label, current, target, unit) {
  const value = Math.max(0, Number(current || 0));
  const percent = Math.min(100, Math.round((value / Math.max(1, target)) * 100));
  return `<article class="learning-skill ${icon}">
    <span aria-hidden="true">${profileIcon(icon)}</span>
    <div><strong>${escapeHTML(label)}</strong><small>${formatNumber(value)} ${escapeHTML(unit)} &middot; ${skillProgressLabel(percent)}</small><i aria-hidden="true"><b style="width:${percent}%"></b></i></div>
    <em>${percent}%</em>
  </article>`;
}

function renderProfileAchievements(achievements) {
  const ordered = [...(achievements || [])].sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    return new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0);
  });
  return ordered.slice(0, 5).map((achievement, index) => renderAchievement(achievement, index)).join("");
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
    <button class="profile-list-row" type="button" onclick="hablaProfile.openSettings('${escapeHTML(icon)}')">
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

function renderProfileSettingsDialog(user, journeyLevel) {
  const notifications = user.notifications || {};
  const field = (label, control, hint = "") => `<label class="profile-setting-field"><span>${escapeHTML(label)}</span>${control}${hint ? `<small>${escapeHTML(hint)}</small>` : ""}</label>`;
  const saveButton = panel => `<button class="profile-settings-save" type="button" onclick="hablaProfile.saveSettings('${panel}')">Save changes</button>`;
  return `<dialog class="profile-settings-dialog" id="profile-settings-dialog" aria-label="Profile settings" onclick="if(event.target===this) hablaProfile.closeSettings()">
    <div class="profile-settings-sheet">
      <button class="profile-settings-close" type="button" onclick="hablaProfile.closeSettings()" aria-label="Close settings">&times;</button>
      <section data-profile-panel="goal" hidden><small>Learning preference</small><h2>Learning Goal</h2><p>Tell Habla what you want Spanish to help you accomplish.</p>
        ${field("Your goal", `<textarea id="profile-setting-goal" rows="4" maxlength="180">${escapeHTML(user.goal || "")}</textarea>`, "Carlos can use this to make practice more relevant.")}${saveButton("goal")}
      </section>
      <section data-profile-panel="daily" hidden><small>Learning preference</small><h2>Daily Goal</h2><p>Set a target that feels realistic enough to maintain.</p>
        ${field("Daily study target", `<select id="profile-setting-daily">${[5, 10, 15, 20, 30, 45].map(minutes => `<option value="${minutes}" ${Number(user.dailyTargetMinutes || 15) === minutes ? "selected" : ""}>${minutes} minutes</option>`).join("")}</select>`)}${saveButton("daily")}
      </section>
      <section data-profile-panel="edit" hidden><small>Your profile</small><h2>Edit Profile</h2><p>Update how your name and learning purpose appear throughout Habla.</p>
        ${field("Display name", `<input id="profile-setting-name" type="text" maxlength="50" value="${escapeHTML(user.name || "")}">`)}
        ${field("Learning goal", `<textarea id="profile-setting-edit-goal" rows="3" maxlength="180">${escapeHTML(user.goal || "")}</textarea>`)}${saveButton("edit")}
      </section>
      <section data-profile-panel="account" hidden><small>Account</small><h2>Account Settings</h2><p>Your Habla progress is currently saved on this device.</p>
        ${field("Display name", `<input id="profile-setting-account-name" type="text" maxlength="50" value="${escapeHTML(user.name || "")}">`)}
        <div class="profile-account-summary"><span>Current level</span><strong>${escapeHTML(journeyLevel)}</strong><span>Progress storage</span><strong>Saved locally</strong></div>${saveButton("account")}
      </section>
      <section data-profile-panel="notifications" hidden><small>Preferences</small><h2>Notifications</h2><p>Choose which learning reminders you want to receive.</p>
        ${notificationToggle("profile-notify-daily", "Daily practice reminder", "A gentle prompt to keep your streak moving.", notifications.dailyReminder ?? true)}
        ${notificationToggle("profile-notify-achievements", "Stamp celebrations", "Celebrate newly unlocked passport stamps.", notifications.achievements ?? true)}
        ${notificationToggle("profile-notify-lessons", "Lesson updates", "Hear when new Habla lessons are available.", notifications.lessonUpdates ?? false)}
        ${saveButton("notifications")}
      </section>
      <section data-profile-panel="support" hidden><small>Support</small><h2>Help &amp; Support</h2><p>Get help with learning, audio, progress, or your Habla settings.</p>
        <details class="profile-support-item"><summary>Why is a lesson locked?</summary><p>Complete the lesson before it in your journey to unlock the next one.</p></details>
        <details class="profile-support-item"><summary>Where is my progress saved?</summary><p>Your current Habla progress is stored locally on this device.</p></details>
        <button class="profile-settings-save" type="button" data-page="carlos" onclick="hablaProfile.closeSettings()">Ask Carlos for help</button>
      </section>
    </div>
  </dialog>`;
}

function notificationToggle(id, title, copy, checked) {
  return `<label class="profile-toggle-row"><span><strong>${escapeHTML(title)}</strong><small>${escapeHTML(copy)}</small></span><input id="${escapeHTML(id)}" type="checkbox" ${checked ? "checked" : ""}><i aria-hidden="true"></i></label>`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function skillProgressLabel(percent) {
  if (percent >= 75) return "Strong";
  if (percent >= 40) return "Growing";
  if (percent > 0) return "Building";
  return "Just started";
}

function renderJourneyRoute(completedLessons) {
  const cities = [
    { name: "Madrid", start: 0, end: 10 },
    { name: "Valencia", start: 10, end: 20 },
    { name: "Barcelona", start: 20, end: 30 },
  ];
  return `<div class="profile-route" aria-label="Spanish course route">${cities.map(city => {
    const complete = completedLessons >= city.end;
    const current = completedLessons >= city.start && completedLessons < city.end;
    return `<div class="${complete ? "complete" : current ? "current" : "locked"}"><span>${complete ? profileIcon("check") : current ? profileIcon("dialect") : profileIcon("lock")}</span><strong>${city.name}</strong><small>${complete ? "Visited" : current ? "Current destination" : "Ahead"}</small></div>`;
  }).join("")}</div>`;
}

function getJourneyLevelName(xp) {
  const level = LEVELS.reduce((current, candidate) => xp >= candidate.minXP ? candidate : current, LEVELS[0]);
  const journeyNames = {
    "A1 Beginner": "A1 Explorer",
    "A2 Elementary": "A2 Traveler",
    "B1 Intermediate": "B1 Local",
    "B2 Upper Intermediate": "B2 Adventurer",
    "C1 Advanced": "C1 Insider",
  };
  return journeyNames[level.name] || level.name;
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
    carlosConversationsCount: Number(activity.carlosConversationsCount ?? 0),
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
    grammar: `<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>`,
    voice: `<path d="M5 10v4M8.5 7v10M12 4v16M15.5 8v8M19 10v4"/>`,
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
  const headerAvatar = document.getElementById("header-avatar");
  if (headerAvatar) headerAvatar.textContent = getInitials(state.user?.name || "Habla Learner");
}
