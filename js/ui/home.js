import { buildHomeViewModel } from "../core/homeViewModel.js";
import { getLessonById, setActiveLesson } from "../core/content.js";
import { CARLOS_FALLBACK_ONERROR, getCarlosAsset } from "../data/carlosAssets.js";
import {
  LESSON_ARTWORK_ONERROR,
  getEpisodeArtworkAlt,
  getLessonNumber,
  getLandmarkArtwork,
  preloadEpisodeArtwork,
  preloadLessonArtwork,
} from "../data/lessonAssets.js";

const GRANADA_ARTWORK = getLandmarkArtwork("granada", "granada-sunset");

const EPISODE_LABELS = Object.freeze({
  "a1-lesson-01-greetings": "Met Carlos",
  "a1-lesson-02-introductions": "A New Friend",
  "lesson-03-family": "Family Dinner",
  "lesson-04-numbers-time": "See You at Ten",
  "lesson-05-shopping": "Mercado de San Miguel",
  "lesson-06-food-drinks": "Coffee Break",
  "lesson-07-travel-basics": "Plaza Mayor",
  "lesson-08-vacation": "Mi Casa",
  "lesson-09-around-the-house": "A Typical Day",
  "lesson-10-daily-routine": "Weekend Adventure",
});

const FEATURED_STAMP_TITLES = Object.freeze(["Madrid Navigator", "Mi Casa", "Café Regular"]);

export function renderHome(state) {
  const model = buildHomeViewModel(state);

  return `
    <div class="home-chapter-dashboard">
      ${renderChapterHero(model)}
      ${renderCarlosCard(model)}
      ${renderJourney(model)}
      ${renderPracticeShortcuts(model)}
      ${renderRecentMemories(model)}
      ${renderChapterComplete(model)}
    </div>
  `;
}

function renderChapterHero(model) {
  if (model.selectedEntry || !model.chapterTwoUnlocked) {
    return renderCurrentEpisodeHero(model);
  }

  return `
    <section class="home-chapter-hero is-unlocked" aria-labelledby="home-chapter-title">
      <img class="home-chapter-hero__scenery" src="${GRANADA_ARTWORK}" alt="The Alhambra and Granada at sunset" fetchpriority="high" decoding="async" onerror="${LESSON_ARTWORK_ONERROR}">
      <img class="home-chapter-hero__carlos" src="${getCarlosAsset("home")}" alt="Carlos smiling and welcoming you to Granada" fetchpriority="high" decoding="async" onerror="${CARLOS_FALLBACK_ONERROR}">
      <span class="home-chapter-hero__overlay" aria-hidden="true"></span>
      <div class="home-chapter-hero__content">
        <p class="home-eyebrow">Chapter 2 · Granada</p>
        <h1 id="home-chapter-title">A New Invitation</h1>
        <p>Carlos and Javier are waiting to show you a different side of Spain.</p>
        <div class="home-chapter-hero__actions">
          <button class="home-button home-button--primary" type="button" ${routeAttributes(model.routes.chapterTwo)} aria-label="Begin Chapter 2 in Granada">
            <span>Begin Chapter 2</span>${icon("arrow")}
          </button>
          <button class="home-button home-button--secondary" type="button" ${routeAttributes(model.routes.reviewMadrid)} aria-label="Review Chapter 1 in Madrid">
            ${icon("book")}<span>Review Madrid</span>
          </button>
        </div>
      </div>
    </section>
  `;
}

function renderCurrentEpisodeHero(model) {
  const entry = model.selectedEntry || model.activeEntry;
  const lesson = entry?.lesson || model.currentOrNextEpisode;
  if (!lesson) return "";

  const episodeNumber = Number(entry?.number || getLessonNumber(lesson) || 1);
  const title = lesson.title || EPISODE_LABELS[lesson.id] || `Episode ${episodeNumber}`;
  const description = lesson.story?.mission
    || lesson.realLifeMission?.mission
    || lesson.objectives?.[0]
    || "Continue your Spanish journey with Carlos.";
  const hero = preloadEpisodeArtwork(lesson, "hero");
  const heroAlt = getEpisodeArtworkAlt(lesson);
  const destination = { page: "lesson", lessonId: lesson.id };

  return `
    <section class="home-chapter-hero is-current-episode" aria-labelledby="home-chapter-title">
      <img class="home-chapter-hero__scenery" src="${escapeAttr(hero)}" alt="${escapeAttr(heroAlt)}" width="1536" height="864" fetchpriority="high" decoding="async" onerror="${LESSON_ARTWORK_ONERROR}">
      <span class="home-chapter-hero__overlay" aria-hidden="true"></span>
      <div class="home-chapter-hero__content">
        <p class="home-eyebrow">Chapter 1 · Episode ${episodeNumber}</p>
        <h1 id="home-chapter-title">${escapeHtml(title)}</h1>
        <p>${escapeHtml(description)}</p>
        <div class="home-chapter-hero__actions">
          <button class="home-button home-button--primary" type="button" ${routeAttributes(destination)} aria-label="Continue Episode ${episodeNumber}: ${escapeAttr(title)}">
            <span>Continue Episode</span>${icon("arrow")}
          </button>
          <button class="home-button home-button--secondary" type="button" ${routeAttributes(model.routes.journey)} aria-label="View your Madrid journey">
            ${icon("book")}<span>View Journey</span>
          </button>
        </div>
      </div>
    </section>
  `;
}

function renderCarlosCard(model) {
  return `
    <section class="home-carlos-card" aria-labelledby="home-carlos-title">
      <div class="home-carlos-card__portrait">
        <img src="${getCarlosAsset("home")}" alt="Carlos, your Spanish travel companion" loading="lazy" onerror="${CARLOS_FALLBACK_ONERROR}">
      </div>
      <div class="home-carlos-card__copy">
        <p class="home-eyebrow">Carlos</p>
        <h2 id="home-carlos-title">Hola, ${escapeHtml(model.learnerName)}.</h2>
        <p>You spent a full day speaking Spanish with me in Madrid. Before we travel to Granada, let’s keep a few important phrases fresh.</p>
      </div>
      <button class="home-carlos-card__action" type="button" ${routeAttributes(model.routes.carlos)} aria-label="Talk with Carlos">
        ${icon("chat")}<span>Talk with Carlos</span>
      </button>
    </section>
  `;
}

function renderJourney(model) {
  const featuredStamps = selectFeaturedStamps(model.earnedStamps);
  const progressLabel = `${model.completedCount} ${model.completedCount === 1 ? "episode" : "episodes"} completed`;

  return `
    <section class="home-panel home-journey" aria-labelledby="home-journey-title">
      <header class="home-section-header">
        <div>
          <p class="home-eyebrow">Your Journey</p>
          <h2 id="home-journey-title">Madrid · Chapter 1</h2>
          <p class="home-journey__progress">${progressLabel}</p>
        </div>
        <button class="home-outline-action" type="button" ${routeAttributes(model.routes.journey)}>View all ${icon("arrow")}</button>
      </header>
      ${featuredStamps.length ? `
        <ul class="home-stamp-pills" aria-label="Earned Madrid passport stamps">
          ${featuredStamps.map((stamp) => `<li>${stampIcon(stamp.title)}<span>${escapeHtml(stamp.title)}</span></li>`).join("")}
        </ul>
      ` : ""}
      <div class="home-carousel home-journey__scroll" tabindex="0" role="region" aria-label="Madrid Chapter 1 episode timeline">
        <div class="home-journey__track progress-${model.completedCount}">
          ${model.entries.map((entry) => renderEpisode(entry, model.activeEntry, model.selectedEntry)).join("")}
          ${renderGranadaDestination(model.chapterTwoUnlocked)}
        </div>
      </div>
    </section>
  `;
}

function renderEpisode(entry, activeEntry, selectedEntry) {
  const completed = Boolean(entry.progress.completed);
  const current = !completed && activeEntry?.lesson?.id === entry.lesson.id;
  const selected = selectedEntry?.lesson?.id === entry.lesson.id;
  const status = completed ? "completed" : current ? "current" : "locked";
  const label = EPISODE_LABELS[entry.lesson.id] || entry.lesson.title;
  const artwork = preloadEpisodeArtwork(entry.lesson, "thumbnail");
  const artworkAlt = getEpisodeArtworkAlt(entry.lesson);

  return `
    <button class="home-episode is-${status}${selected ? " is-selected" : ""}" type="button" data-home-episode-select="${escapeAttr(entry.lesson.id)}" data-episode-number="${entry.number}" data-episode-status="${status}" aria-pressed="${selected ? "true" : "false"}" ${status === "locked" ? "disabled" : ""} aria-label="Show Episode ${entry.number}: ${escapeAttr(label)} in the Home hero, ${status}">
      <span class="home-episode__thumb">
        <img src="${escapeAttr(artwork)}" alt="${escapeAttr(artworkAlt)}" width="1024" height="1024" loading="lazy" decoding="async" onerror="${LESSON_ARTWORK_ONERROR}">
        ${completed ? `<i aria-hidden="true">${icon("check")}</i>` : current ? `<i aria-hidden="true">${entry.number}</i>` : `<i aria-hidden="true">${icon("lock")}</i>`}
      </span>
      <small>${entry.number}</small>
      <strong>${escapeHtml(label)}</strong>
    </button>
  `;
}

function renderGranadaDestination(unlocked) {
  return `
    <div class="home-episode home-episode--destination ${unlocked ? "is-current" : "is-locked"}" aria-label="Next stop Granada${unlocked ? ", unlocked" : ", locked"}">
      <span class="home-episode__thumb"><img src="${getLandmarkArtwork("granada", "granada-alhambra")}" alt="" width="1536" height="864" loading="lazy" decoding="async" onerror="${LESSON_ARTWORK_ONERROR}">${icon("landmark")}</span>
      <small>Next Stop</small>
      <strong>Granada</strong>
    </div>
  `;
}

function renderPracticeShortcuts(model) {
  const actions = [
    {
      tone: "green",
      icon: "speak",
      title: "Speak",
      copy: "Practice a conversation with Carlos.",
      route: model.routes.carlos,
    },
    {
      tone: "gold",
      icon: "book",
      title: "Review",
      copy: "Refresh vocabulary from Madrid.",
      route: model.routes.reviewMadrid,
    },
  ];

  return `
    <section class="home-panel home-practice" aria-labelledby="home-practice-title">
      <p class="home-eyebrow" id="home-practice-title">Keep Your Spanish Moving</p>
      <div class="home-carousel home-practice__row" tabindex="0" role="region" aria-label="Spanish practice shortcuts">
        ${actions.map((action) => `
          <button class="home-practice-card is-${action.tone}" type="button" ${routeAttributes(action.route)}>
            <span class="home-practice-card__icon">${icon(action.icon)}</span>
            <span><strong>${action.title}</strong><small>${action.copy}</small></span>
            ${icon("arrow")}
          </button>
        `).join("")}
        <button class="home-practice-card is-blue is-disabled" type="button" disabled aria-disabled="true" aria-label="Replay Chapter 1 conversations, coming soon">
          <span class="home-practice-card__icon">${icon("listen")}</span>
          <span><strong>Listen</strong><small>Replay conversations from Chapter 1.</small><em>Coming soon</em></span>
        </button>
      </div>
    </section>
  `;
}

function renderRecentMemories(model) {
  const memories = model.recentMemories;

  return `
    <section class="home-panel home-memories" aria-labelledby="home-memories-title">
      <header class="home-section-header home-section-header--compact">
        <p class="home-eyebrow" id="home-memories-title">Recent Memories</p>
        <button class="home-outline-action" type="button" ${routeAttributes(model.routes.travelJournal)}>View Travel Journal ${icon("arrow")}</button>
      </header>
      ${memories.length ? `
        <div class="home-carousel home-memories__row" tabindex="0" role="region" aria-label="Recently collected Travel Journal memories">
          ${memories.map(renderMemory).join("")}
        </div>
      ` : renderMemoryEmptyState()}
    </section>
  `;
}

function renderMemory(memory) {
  const discovery = (memory.lesson?.livingWorldInteractions || []).find((item) => item.id === memory.id);
  const artwork = memory.image || discovery?.image || preloadLessonArtwork(memory.lesson);
  const title = memory.title || discovery?.title || "Madrid memory";
  const source = memory.lesson?.title || `Lesson ${memory.lessonNumber}`;

  return `
    <button class="home-memory" type="button" data-page="journey" aria-label="Open Travel Journal memory: ${escapeAttr(title)}">
      <span class="home-memory__art">
        <img src="${escapeAttr(artwork)}" alt="${escapeAttr(title)} Travel Journal memory" loading="lazy" onerror="${LESSON_ARTWORK_ONERROR}">
        ${icon("star")}
      </span>
      <strong>${escapeHtml(title)}</strong>
      <small>Lesson ${Number(memory.lessonNumber || 0)} · ${escapeHtml(source)}</small>
    </button>
  `;
}

function renderMemoryEmptyState() {
  return `
    <div class="home-memory-empty">
      <span class="home-memory-empty__keepsakes" aria-hidden="true">
        <i class="is-postcard">Madrid</i>
        <i class="is-polaroid">${icon("landmark")}</i>
        <i class="is-stamp">M</i>
      </span>
      <div><strong>Your travel journal is waiting.</strong><p>Hidden memories will appear as you explore Madrid.</p></div>
    </div>
  `;
}

function renderChapterComplete(model) {
  const stampCount = model.earnedStamps.length;
  const title = model.chapterComplete ? "Madrid Chapter Complete" : "Your Madrid Chapter";
  const copy = model.chapterComplete
    ? "You arrived knowing a few words. You left Madrid able to greet people, find your way, order, shop, describe a home, and tell the story of your day."
    : "Every completed episode adds another place, conversation, and memory to your Spanish journey.";

  return `
    <section class="home-panel home-chapter-complete ${model.chapterComplete ? "is-complete" : "is-progress"}" aria-labelledby="home-complete-title">
      <div class="home-madrid-passport" aria-hidden="true">
        <span>Madrid</span>${icon("passport")}<small>España</small>
      </div>
      <div class="home-chapter-complete__body">
        <h2 id="home-complete-title">${title}</h2>
        <div class="home-chapter-metrics">
          ${renderMetric(model.completedCount, "Episodes", "Completed", "check")}
          ${renderMetric(stampCount, "Passport", "Stamps", "stamp")}
          ${renderMetric(model.memoryCount, "Memories", "Collected", "bookmark")}
          ${renderMetric("Countless", "Conversations", "Shared", "people")}
        </div>
        <p>${copy}</p>
      </div>
    </section>
  `;
}

function renderMetric(value, label, detail, iconName) {
  return `<span>${icon(iconName)}<b>${escapeHtml(value)}</b><small>${label}<br>${detail}</small></span>`;
}

function selectHomeEpisode(button) {
  const lessonId = button?.dataset?.homeEpisodeSelect;
  const entryStatus = button?.dataset?.episodeStatus || "locked";
  if (!lessonId || entryStatus === "locked" || typeof document === "undefined") return;

  const lesson = getLessonById(lessonId);
  if (!lesson || !setActiveLesson(lessonId)) return;

  document.querySelectorAll("[data-home-episode-select]").forEach((episode) => {
    const selected = episode === button;
    episode.classList.toggle("is-selected", selected);
    episode.setAttribute("aria-pressed", selected ? "true" : "false");
  });

  const model = buildHomeViewModel();
  const currentHero = document.querySelector(".home-chapter-hero");
  if (!currentHero) return;
  currentHero.outerHTML = renderChapterHero(model);

  const updatedHero = document.querySelector(".home-chapter-hero");
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  updatedHero?.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start",
  });
}

function selectFeaturedStamps(stamps) {
  const featured = FEATURED_STAMP_TITLES
    .map((title) => stamps.find((stamp) => normalizeText(stamp.title) === normalizeText(title)))
    .filter(Boolean);
  const used = new Set(featured.map((stamp) => stamp.lessonId));
  return featured.concat(stamps.filter((stamp) => !used.has(stamp.lessonId)).slice(-3).reverse()).slice(0, 3);
}

function stampIcon(title) {
  const normalized = normalizeText(title);
  if (normalized.includes("cafe")) return icon("coffee");
  if (normalized.includes("casa")) return icon("home");
  return icon("pin");
}

function routeAttributes(route) {
  if (!route?.page) return "";
  const lesson = route.lessonId ? ` data-lesson-id="${escapeAttr(route.lessonId)}"` : "";
  const learnView = route.view ? ` data-home-learn-view="${escapeAttr(route.view)}"` : "";
  return `data-page="${escapeAttr(route.page)}"${lesson}${learnView}`;
}

function icon(name) {
  const paths = {
    arrow: `<path d="m9 5 7 7-7 7"/>`,
    book: `<path d="M3.5 5.5A3.5 3.5 0 0 1 7 3h4.5v17H7a3.5 3.5 0 0 0-3.5 2V5.5Zm17 0A3.5 3.5 0 0 0 17 3h-4.5v17H17a3.5 3.5 0 0 1 3.5 2V5.5Z"/>`,
    chat: `<path d="M4 5.5h16v11H9l-5 3v-14Z"/><path d="M8 10h1m3 0h1m3 0h1"/>`,
    check: `<path d="m6 12 4 4 8-9"/>`,
    lock: `<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>`,
    landmark: `<path d="M3 20h18M5 17h14M6 17V9m4 8V9m4 8V9m4 8V9M4 9h16L12 4 4 9Z"/>`,
    speak: `<circle cx="9" cy="8" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3 20c.5-5 2.5-7 6-7s5.5 2 6 7m0-5c3.5-.5 5.5 1 6 4"/>`,
    listen: `<path d="M4 14v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="13" width="4" height="7" rx="2"/><rect x="17" y="13" width="4" height="7" rx="2"/>`,
    bookmark: `<path d="M7 4h10v16l-5-3-5 3V4Z"/>`,
    passport: `<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="11" r="4"/><path d="M8 11h8m-4-4c1.4 1.4 1.4 6.6 0 8m0-8c-1.4 1.4-1.4 6.6 0 8"/>`,
    stamp: `<path d="M8 14V9a4 4 0 0 1 8 0v5l2 2v2H6v-2l2-2Z"/><path d="M8 21h8M9 18v3m6-3v3"/>`,
    people: `<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 20c.5-5 2.3-7 5.5-7s5 2 5.5 7m1-6c3.5-.4 5.7 1.4 6 5.5"/>`,
    star: `<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>`,
    pin: `<path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>`,
    home: `<path d="m4 11 8-7 8 7v9H4v-9Z"/><path d="M9 20v-6h6v6"/>`,
    coffee: `<path d="M5 8h11v8a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z"/><path d="M16 10h2a3 3 0 0 1 0 6h-2M8 4c0 1 1 1 1 2m3-2c0 1 1 1 1 2"/>`,
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || ""}</svg>`;
}

function normalizeText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

if (typeof document !== "undefined") {
  document.addEventListener("click", (event) => {
    const episode = event.target.closest?.("[data-home-episode-select]");
    if (episode) {
      selectHomeEpisode(episode);
    }
  });
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character]));
}
