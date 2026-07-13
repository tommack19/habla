import { getTodaysMission } from "../core/missions.js";
import { getCourseProgress, getCurrentLesson } from "../core/content.js";

export function renderHome(state) {
  const mission = getTodaysMission();
  const currentLesson = getCurrentLesson();
  const courseProgress = getCourseProgress();
  const stats = getHomeStats(state, courseProgress);

  return `
    ${renderHomeHeader(state)}
    <section class="home-carlos-dashboard" aria-label="Carlos practice dashboard">
      ${renderCarlosHero(state, stats)}
      ${renderConversationCard(currentLesson, mission)}
      ${renderPracticeCategories()}
      ${renderCarlosProgress(stats)}
      ${renderCarlosTip()}
      ${renderCarlosAskBar()}
    </section>
  `;
}

function renderHomeHeader(state) {
  return `
    <section class="home-topbar h-section">
      <div class="home-header-main">
        <button class="home-brand" type="button" data-page="home" aria-label="Go to home">
          <div>
            <div class="home-brand-name">Habla<span>.</span></div>
            <p>Speak Spanish. Live Confidently.</p>
          </div>
        </button>
        <button class="home-level-pill" type="button">${state.user.level || "A1 Beginner"} <span aria-hidden="true">&#8964;</span></button>
      </div>
    </section>
  `;
}

function renderCarlosHero(state, stats) {
  const name = escapeHtml((state.user && state.user.name) || "Tom").split(" ")[0];
  const streak = Number(stats.streak || 0);

  return `
    <section class="home-carlos-hero">
      <div class="home-hero-copy">
        <h1>&iexcl;Hola ${name}!</h1>
        <h2>${getTimeGreeting()}!</h2>
        <p>You&rsquo;re one step closer to speaking Spanish confidently with your wife&rsquo;s family.</p>
        <span class="home-hero-stroke" aria-hidden="true"></span>
        <div class="home-hero-stats">
          <div><span class="home-stat-icon fire" aria-hidden="true"></span><strong>${streak}</strong><small>Day Streak</small></div>
          <div><span class="home-stat-icon star" aria-hidden="true"></span><strong>${formatNumber(stats.xp)}</strong><small>Total XP</small></div>
        </div>
        <div class="home-hero-pills">
          <span class="home-status-chip"><span></span>Carlos is here to help</span>
        </div>
      </div>
      <img class="home-carlos-portrait" src="assets/images/carlos-home.png" alt="Carlos, your Spanish tutor" loading="lazy">
      <div class="home-speech-bubble">Let&rsquo;s practice together!</div>
    </section>
  `;
}

function renderConversationCard(lesson, mission) {
  const title = getConversationTitle(lesson, mission);
  const subtitle = lesson?.objective || lesson?.objectives?.[0] || "Learn how to order like a local";
  const minutes = Number(lesson?.estimatedMinutes || lesson?.durationMinutes || 10);
  const image = lesson?.image || lesson?.imagePath || "assets/images/lessons/lesson-06-food-drinks.png";

  return `
    <section class="conversation-card">
      <div class="conversation-copy">
        <p class="home-kicker">Today&rsquo;s Lesson</p>
        <h2>${escapeHtml(title)}</h2>
        <p class="lesson-subtitle">${escapeHtml(subtitle)}</p>
        <div class="lesson-meta-row">
          <span><i class="icon-clock" aria-hidden="true"></i>${minutes} min</span>
          <span><i class="icon-bars" aria-hidden="true"></i>Easy</span>
        </div>
      </div>
      <div class="conversation-art-shell" aria-hidden="true">
        <img src="${escapeAttr(image)}" alt="" loading="lazy">
      </div>
      <button class="conversation-action" type="button" data-page="learn" ${lesson?.id ? `data-lesson-id="${escapeAttr(lesson.id)}"` : ""}>Start Lesson <span aria-hidden="true">&rsaquo;</span></button>
    </section>
  `;
}

function renderPracticeCategories() {
  const categories = [
    ["Greetings", "8 conversations", "cat-greetings", "greetings"],
    ["Family", "10 conversations", "cat-family", "family"],
    ["Restaurants", "12 conversations", "cat-restaurants", "food-restaurants"],
    ["Travel", "14 conversations", "cat-travel", "travel"],
    ["Shopping", "9 conversations", "cat-shopping", "shopping"],
    ["Work", "8 conversations", "cat-work", "work"],
    ["Small Talk", "11 conversations", "cat-smalltalk", "phrases"],
    ["Free Chat", "Unlimited", "cat-freechat", "conversation"]
  ];

  return `
    <section class="practice-categories">
      <div class="home-section-head">
        <h2>Practice Categories</h2>
        <button type="button" data-page="learn">View all <span aria-hidden="true">&rsaquo;</span></button>
      </div>
      <div class="category-grid">
        ${categories.map(([title, detail, iconClass, topic]) => `
          <button class="category-tile" type="button" data-page="${title === "Free Chat" ? "carlos" : "practice"}" data-practice-topic="${escapeAttr(topic)}">
            <span class="category-icon ${iconClass}" aria-hidden="true">${renderTopicSvg(iconClass)}</span>
            <strong>${title}</strong>
            <small>${detail}</small>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderTopicSvg(iconClass) {
  const icons = {
    "cat-greetings": `<svg viewBox="0 0 48 48"><path d="M8 23c0-8 7-14 16-14s16 6 16 14-7 14-16 14c-2.5 0-5-.5-7-1.5L9 40l2.2-8C9.2 29.5 8 26.4 8 23Z"/><circle cx="18" cy="23" r="2.3"/><circle cx="24" cy="23" r="2.3"/><circle cx="30" cy="23" r="2.3"/></svg>`,
    "cat-family": `<svg viewBox="0 0 48 48"><circle cx="18" cy="16" r="6"/><circle cx="31" cy="16" r="6"/><path d="M8 37c1.5-8 6-12 12-12s10.5 4 12 12H8Z"/><path d="M24 37c1.2-7 5-11 10-11 4.5 0 8 3.6 9 11H24Z"/></svg>`,
    "cat-restaurants": `<svg viewBox="0 0 48 48"><path d="M14 7v17M20 7v17M11 7v10c0 5 12 5 12 0V7M17 24v17"/><path d="M34 7c-4 4-6 9-6 15h8v19"/></svg>`,
    "cat-travel": `<svg viewBox="0 0 48 48"><path d="M4 28 43 9c1.4-.7 2.8.8 2 2.2L25 44l-5-16-16 0Z"/><path d="M20 28 43 10"/></svg>`,
    "cat-shopping": `<svg viewBox="0 0 48 48"><path d="M12 18h24l3 24H9l3-24Z"/><path d="M18 18c0-6 12-6 12 0"/></svg>`,
    "cat-work": `<svg viewBox="0 0 48 48"><path d="M16 15v-5h16v5"/><rect x="8" y="15" width="32" height="25" rx="4"/><path d="M8 26h32M21 26h6"/></svg>`,
    "cat-smalltalk": `<svg viewBox="0 0 48 48"><path d="M8 23c0-8 7-14 16-14s16 6 16 14-7 14-16 14c-2.5 0-5-.5-7-1.5L9 40l2.2-8C9.2 29.5 8 26.4 8 23Z"/><circle cx="18" cy="23" r="2.3"/><circle cx="24" cy="23" r="2.3"/><circle cx="30" cy="23" r="2.3"/></svg>`,
    "cat-freechat": `<svg viewBox="0 0 48 48"><rect x="18" y="6" width="12" height="24" rx="6"/><path d="M11 22c0 8 5 13 13 13s13-5 13-13M24 35v7M18 42h12"/></svg>`
  };
  return icons[iconClass] || "";
}

function renderCarlosProgress(stats) {
  return `
    <section class="carlos-progress-section">
      <h2>Your Progress</h2>
      <div class="carlos-progress-strip">
        ${renderProgressMetric("progress-chat", "Conversations Completed", stats.conversations)}
        ${renderProgressMetric("progress-time", "Speaking Time", formatMinutes(stats.speakingMinutes))}
        ${renderProgressMetric("progress-book", "Words Practiced", stats.words)}
        ${renderProgressMetric("progress-star", "Pronunciation Score", `${stats.pronunciationScore}%`)}
      </div>
    </section>
  `;
}

function renderProgressMetric(iconClass, label, value) {
  return `
    <article>
      <span class="progress-icon ${iconClass}" aria-hidden="true"></span>
      <p>${label}</p>
      <strong>${escapeHtml(String(value))}</strong>
    </article>
  `;
}

function renderCarlosTip() {
  return `
    <section class="carlos-tip-card">
      <img src="assets/images/carlos-home.png" alt="" loading="lazy">
      <div>
        <p>Carlos' Tip of the Day</p>
        <h2>Spanish speakers often greet each other warmly. Don't be afraid to smile!</h2>
        <span class="tip-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      </div>
      <span class="quote-mark" aria-hidden="true">&rdquo;</span>
    </section>
  `;
}

function renderCarlosAskBar() {
  return `
    <section class="carlos-ask-bar" aria-label="Ask Carlos">
      <button class="ask-avatar" type="button" data-page="carlos" aria-label="Open Carlos chat">
        <img src="assets/images/carlos-home.png" alt="">
        <span></span>
      </button>
      <button class="ask-input" type="button" data-page="carlos">Ask Carlos anything...</button>
      <button class="ask-mic" type="button" data-page="carlos" aria-label="Practice speaking"></button>
      <button class="ask-keyboard" type="button" data-page="carlos" aria-label="Type to Carlos"></button>
    </section>
  `;
}

function getHomeStats(state, courseProgress) {
  const progress = readJson("habla_progress_v1") || {};
  const activity = readJson("habla_activity_stats_v1") || {};
  const vocab = state.vocabulary && Array.isArray(state.vocabulary.learned) ? state.vocabulary.learned.length : 0;

  return {
    streak: Number(progress.currentStreak || state.user?.streak || 0),
    xp: Number(progress.xp ?? state.user?.xp ?? 0),
    conversations: Number(activity.carlosConversationsCount || courseProgress?.completedCount || 0),
    speakingMinutes: Number(activity.speakingMinutes || 0),
    words: Number(activity.vocabularyReviewedCount || vocab || 0),
    pronunciationScore: Number(activity.pronunciationScore || 0)
  };
}

function getConversationTitle(lesson, mission) {
  if (lesson?.title) return lesson.title.replace(/^[^:]+:\s*/, "");
  return mission?.title || "Ordering coffee";
}

function getConversationPhrase(lesson) {
  const challenge = lesson?.speakingChallenge?.[0] || lesson?.speakingChallenges?.[0];
  if (typeof challenge === "string") return challenge;
  if (challenge?.prompt) return challenge.prompt;
  if (lesson?.realLifeMission?.mission) return lesson.realLifeMission.mission;
  return "Un cafe, por favor.";
}

function formatMinutes(minutes) {
  const total = Number(minutes || 0);
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch (error) {
    return null;
  }
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}
