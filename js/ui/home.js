import { getTodaysMission } from "../core/missions.js";
import { getCourseProgress, getCurrentLesson } from "../core/content.js";
import { CARLOS_FALLBACK_ONERROR, getCarlosAsset } from "../data/carlosAssets.js";

export function renderHome(state) {
  const mission = getTodaysMission();
  const currentLesson = getCurrentLesson();
  const courseProgress = getCourseProgress();
  const stats = getHomeStats(state, courseProgress);

  return `
    ${renderHomeHeader(state)}
    <section class="home-carlos-dashboard" aria-label="Carlos practice dashboard">
      ${renderCarlosHero(state, currentLesson, mission, courseProgress)}
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

function renderCarlosHero(state, lesson, mission, courseProgress) {
  const name = escapeHtml(((state.user && state.user.name) || "Tom").split(" ")[0]);
  const period = getHomeHeroPeriod();
  const objective = lesson?.homeSummary || lesson?.objective || lesson?.objectives?.[0] || "Build confidence with practical Spanish.";
  const lessonNumber = Number(courseProgress?.currentLessonNumber || getLessonNumber(lesson) || 0);
  const minutes = Number(lesson?.estimatedMinutes || lesson?.durationMinutes || 10);
  const xpReward = Number(lesson?.xpReward || mission?.xpReward || 0);
  const lessonPosition = lessonNumber ? `Lesson ${lessonNumber}` : "Today&rsquo;s lesson";

  return `
    <section class="home-carlos-hero home-daily-hero time-${period.id}">
      <img class="home-hero-background" src="${escapeAttr(period.image)}" alt="Carlos in a ${period.id} Spanish city scene" loading="eager" onerror="${CARLOS_FALLBACK_ONERROR}">
      <div class="home-hero-copy">
        <h1>&iexcl;${period.greeting}, ${name}! <span aria-hidden="true">${period.symbol}</span></h1>
        <h2>Let&rsquo;s continue your<br>Spanish journey.</h2>
        <p>${escapeHtml(objective)}</p>
      </div>
      <div class="home-hero-lesson-bar">
        <div class="home-hero-lesson-metrics">
          <span><i aria-hidden="true">${renderHeroMetaIcon("lesson")}</i><b>${lessonPosition}</b></span>
          <span><i aria-hidden="true">${renderHeroMetaIcon("time")}</i><b>${minutes} min</b></span>
          ${xpReward ? `<span><i aria-hidden="true">${renderHeroMetaIcon("xp")}</i><b>+${xpReward} XP</b></span>` : ""}
        </div>
        <button class="home-hero-start" type="button" data-page="learn" ${lesson?.id ? `data-lesson-id="${escapeAttr(lesson.id)}"` : ""}>Start Lesson <span aria-hidden="true">&rsaquo;</span></button>
      </div>
    </section>
  `;
}

function renderHeroMetaIcon(type) {
  const icons = {
    lesson: `<svg viewBox="0 0 24 24"><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H20v17H7.5A3.5 3.5 0 0 0 4 22V5.5Z"/><path d="M8 7h8M8 11h5"/></svg>`,
    time: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>`,
    xp: `<svg viewBox="0 0 24 24"><path d="m12 2 1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2Z"/><path d="m19 14 .8 2.2 2.2.8-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z"/></svg>`
  };
  return icons[type] || "";
}

function renderPracticeCategories() {
  const categories = [
    ["Greetings", "cat-greetings", "greetings"],
    ["Family", "cat-family", "family"],
    ["Restaurants", "cat-restaurants", "food-restaurants"],
    ["Travel", "cat-travel", "travel"],
    ["Shopping", "cat-shopping", "shopping"],
    ["Work", "cat-work", "work"],
    ["Small Talk", "cat-smalltalk", "phrases"],
    ["Free Chat", "cat-freechat", "conversation"]
  ];

  return `
    <section class="practice-categories">
      <div class="home-section-head">
        <h2>Practice Categories</h2>
        <button type="button" data-page="learn">View all <span aria-hidden="true">&rsaquo;</span></button>
      </div>
      <div class="category-grid">
        ${categories.map(([title, iconClass, topic]) => `
          <button class="category-tile" type="button" data-page="${title === "Free Chat" ? "carlos" : "practice"}" data-practice-topic="${escapeAttr(topic)}">
            <span class="category-icon ${iconClass}" aria-hidden="true">${renderTopicSvg(iconClass)}</span>
            <strong>${title}</strong>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function renderTopicSvg(iconClass) {
  const icons = {
    "cat-greetings": `<svg viewBox="0 0 48 48"><path d="M8 23c0-8 7-14 16-14s16 6 16 14-7 14-16 14c-2.5 0-5-.5-7-1.5L9 40l2.2-8C9.2 29.5 8 26.4 8 23Z"/><circle cx="18" cy="23" r="2.3"/><circle cx="24" cy="23" r="2.3"/><circle cx="30" cy="23" r="2.3"/></svg>`,
    "cat-family": `<svg viewBox="0 0 48 48"><circle cx="16" cy="16" r="5.8"/><circle cx="31.5" cy="16.8" r="5.2"/><circle cx="24.2" cy="18.8" r="4.1"/><path d="M6.5 37c1.7-7.9 6.3-11.8 11.7-11.8S28.2 29 30 37M20.8 37c1.3-5.8 4.8-8.6 9.3-8.6 4.4 0 7.7 2.8 9 8.6M18.2 24.8c1.7-1.7 3.8-2.6 5.9-2.6s4.2.9 5.9 2.6"/></svg>`,
    "cat-restaurants": `<svg viewBox="0 0 48 48"><path d="M12 7v11M17 7v11M9.5 7v10.2c0 4.3 12 4.3 12 0V7M15.5 18v22"/><path d="M35 7c-3.7 3.4-5.7 8.1-5.7 13.8h7.5V40"/><path d="M28.3 27.5h13.2"/><circle cx="28.5" cy="12" r="1.8" fill="currentColor" stroke="none"/></svg>`,
    "cat-travel": `<svg viewBox="0 0 48 48"><path d="M24 3c-2.4 0-4 2.2-4 5v11L6 29v5l14-4v9l-5 4v2l9-2 9 2v-2l-5-4v-9l14 4v-5L28 19V8c0-2.8-1.6-5-4-5Z"/></svg>`,
    "cat-shopping": `<svg viewBox="0 0 48 48"><path d="M13 17.5h22l2.7 23H10.3l2.7-23Z"/><path d="M18 17.5c0-5.3 12-5.3 12 0"/><path d="M18 24.5h12"/><path d="M16.5 20.2h15"/></svg>`,
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
      <span class="progress-icon ${iconClass}" aria-hidden="true">${renderProgressIcon(iconClass)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      <p>${label}</p>
    </article>
  `;
}

function renderProgressIcon(iconClass) {
  const icons = {
    "progress-chat": `<svg viewBox="0 0 48 48"><path d="M8 22.5C8 14.5 15.2 8 24 8s16 6.5 16 14.5S32.8 37 24 37c-2.7 0-5.2-.6-7.4-1.6L9 40l2.2-8.2A13.7 13.7 0 0 1 8 22.5Z"/><circle cx="18" cy="23" r="1.5"/><circle cx="24" cy="23" r="1.5"/><circle cx="30" cy="23" r="1.5"/></svg>`,
    "progress-time": `<svg viewBox="0 0 48 48"><circle cx="24" cy="24" r="16"/><path d="M24 14v11l7 4"/></svg>`,
    "progress-book": `<svg viewBox="0 0 48 48"><path d="M7 11.5c6-1.5 11.7-.3 17 3.5v25c-5.3-3.8-11-5-17-3.5v-25Z"/><path d="M41 11.5c-6-1.5-11.7-.3-17 3.5v25c5.3-3.8 11-5 17-3.5v-25Z"/></svg>`,
    "progress-star": `<svg viewBox="0 0 48 48"><path d="m24 7 5.1 10.4 11.4 1.7-8.2 8 1.9 11.3L24 33l-10.2 5.4 1.9-11.3-8.2-8 11.4-1.7L24 7Z"/></svg>`
  };
  return icons[iconClass] || "";
}

function renderCarlosTip() {
  return `
    <section class="carlos-tip-card">
      <img src="${getCarlosAsset("thinking")}" alt="Carlos sharing today's Spanish tip" loading="lazy" onerror="${CARLOS_FALLBACK_ONERROR}">
      <div>
        <p>Carlos' Tip of the Day</p>
        <h2>${escapeHtml(getDailyCarlosTip())}</h2>
      </div>
      <span class="quote-mark" aria-hidden="true">&rdquo;</span>
    </section>
  `;
}

function renderCarlosAskBar() {
  return `
    <section class="carlos-ask-bar" aria-label="Ask Carlos">
      <button class="ask-avatar" type="button" data-page="carlos" aria-label="Open Carlos chat">
        <img src="${getCarlosAsset("speaking")}" alt="Carlos ready to answer your Spanish question" onerror="${CARLOS_FALLBACK_ONERROR}">
        <span></span>
      </button>
      <button class="ask-input" type="button" data-page="carlos">Ask Carlos anything...</button>
      <button class="ask-mic" type="button" data-page="carlos" aria-label="Practice speaking">${renderAskMicSvg()}</button>
      <button class="ask-keyboard" type="button" data-page="carlos" aria-label="Type to Carlos"></button>
    </section>
  `;
}

function renderAskMicSvg() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="8.2" y="4.5" width="7.6" height="10.5" rx="3.8"/><path d="M5.7 11.4c0 3.5 2.8 6.3 6.3 6.3s6.3-2.8 6.3-6.3"/><path d="M12 17.7v3.1"/><path d="M8.8 20.8h6.4"/></svg>`;
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

function getLessonNumber(lesson) {
  const explicit = Number(lesson?.metadata?.lessonNumber || lesson?.lessonNumber || 0);
  if (explicit) return explicit;
  const match = String(lesson?.id || "").match(/lesson-(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function getDailyCarlosTip() {
  const tips = [
    "Spanish speakers often greet each other warmly. Don't be afraid to smile!",
    "Learn every new noun with its article: el libro, la mesa. It makes gender easier to remember.",
    "Say new words out loud. Your mouth needs practice just as much as your memory does.",
    "Spanish vowels stay consistent. Keep a, e, i, o, and u short and clear.",
    "Use por favor and gracias often. Small courtesies make your Spanish sound natural.",
    "When you forget a word, describe it with words you already know instead of switching languages.",
    "Listen for the main idea first. You don't need to understand every word to follow a conversation.",
    "Practice complete phrases, not isolated words. They're easier to recall when you need them.",
    "Use ser for identity and defining traits; use estar for location and changing conditions.",
    "A few focused minutes every day will take you further than one long session each week.",
    "Repeat a sentence until it feels comfortable, then change one detail to make it your own.",
    "Mistakes are evidence that you're using Spanish. Keep speaking and correct them as you go."
  ];
  return tips[getDailyIndex(tips.length, "tip")];
}

function getDailyIndex(length, salt = "") {
  const now = new Date();
  const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}-${salt}`;
  return [...dayKey].reduce((sum, character) => sum + character.charCodeAt(0), 0) % length;
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

function getHomeHeroPeriod() {
  const hour = new Date().getHours();
  if (hour < 12) return { id: "morning", greeting: "Buenos d&iacute;as", symbol: "&#9728;", image: getCarlosAsset("morning") };
  if (hour < 18) return { id: "afternoon", greeting: "Buenas tardes", symbol: "&#9728;", image: getCarlosAsset("afternoon") };
  return { id: "evening", greeting: "Buenas noches", symbol: "&#9790;", image: getCarlosAsset("evening") };
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
