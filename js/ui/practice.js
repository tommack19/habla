import { getLessonById, getLessonProgress, getUnlockedLessons } from "../core/content.js";
import { PRACTICE_LIBRARY_CATEGORIES, findPracticeLibraryCategory, findPracticeLibraryCollection, findPracticeLibraryItem } from "../data/practiceLibrary.js";

const TOPIC_KEY = "habla_selected_practice_topic_v1";
const SESSION_KEY = "habla_practice_session_v2";
const LIBRARY_PROGRESS_KEY = "habla_practice_library_progress_v1";
const MODES = ["quiz", "flashcards", "pronunciation", "conversation"];
const PRIMARY_TOPIC_IDS = ["greetings", "family", "food-restaurants", "travel", "shopping", "work", "phrases", "numbers"];
const TOPICS = {
  greetings: { title: "Greetings", icon: "greetings", lessons: ["a1-lesson-01-greetings", "a1-lesson-02-introductions"] },
  family: { title: "Family", icon: "family", lessons: ["lesson-03-family"] },
  "food-restaurants": { title: "Restaurants", icon: "restaurants", lessons: ["lesson-06-food-drinks"] },
  travel: { title: "Travel", icon: "travel", lessons: ["lesson-07-travel-basics", "lesson-08-vacation"] },
  shopping: { title: "Shopping", icon: "shopping", lessons: ["lesson-05-shopping"] },
  work: { title: "Work", icon: "work", lessons: ["lesson-14-work"] },
  phrases: { title: "Small Talk", icon: "phrases", lessons: ["a1-lesson-02-introductions"] },
  numbers: { title: "Numbers", icon: "numbers", lessons: ["lesson-04-numbers-time"] },
  time: { title: "Time", icon: "time", lessons: ["lesson-04-numbers-time"] },
  weather: { title: "Weather", icon: "weather", lessons: ["lesson-11-weather"] },
  directions: { title: "Directions", icon: "directions", lessons: ["lesson-21-directions"] },
  health: { title: "Health", icon: "health", lessons: ["lesson-17-health"] },
  hobbies: { title: "Hobbies", icon: "hobbies", lessons: ["lesson-15-hobbies"] },
  school: { title: "School", icon: "school", lessons: ["lesson-13-school"] },
  "phone-calls": { title: "Phone Calls", icon: "phone-calls", lessons: ["lesson-25-phone-conversations"] },
  airport: { title: "Airport", icon: "airport", lessons: ["lesson-28-airport"] },
  hotel: { title: "Hotel", icon: "hotel", lessons: ["lesson-27-hotels"] },
  emergency: { title: "Emergency", icon: "emergency", lessons: ["lesson-24-emergencies"] },
};

let recorder = null;
let recordingStream = null;
let recordingChunks = [];
let playbackUrl = "";

export function renderPractice(appState = {}) {
  const session = readSession();

  if (session.view === "library") return renderPracticeLibrary(appState);
  if (session.view === "library-category") return renderLibraryCategory(session, appState);
  if (session.view === "library-collection") return renderLibraryCollection(session, appState);
  if (session.view === "library-item") return renderLibraryItemLauncher(session, appState);
  if (session.view === "library-study") return renderLibraryStudy(session, appState);

  const libraryResult = session.returnView === "library-item" ? findPracticeLibraryItem(session.libraryCategoryId, session.libraryItemId, session.libraryCollectionId) : null;
  const libraryLesson = libraryResult ? buildLibraryLesson(libraryResult) : null;
  const topic = libraryResult ? { title: libraryResult.item.title, icon: libraryResult.category.icon } : (TOPICS[session.topic] || TOPICS.greetings);
  const lesson = libraryLesson || getLessonForTopic(session.topic);

  if (session.view === "activity") {
    if (!lesson && session.mode !== "conversation") return renderLockedActivity(session, topic);
    if (lesson && getModeCount(session.mode, lesson) === 0) return renderNoDataActivity(session, topic, lesson);
    if (session.mode === "quiz") return renderQuizActivity(session, topic, lesson);
    if (session.mode === "flashcards") return renderFlashcardActivity(session, topic, lesson);
    if (session.mode === "pronunciation") return renderPronunciationActivity(session, topic, lesson);
  }

  if (session.view === "results") return renderResults(session, topic, lesson);
  return renderLauncher(session, topic, lesson, appState);
}

function renderLauncher(session, topic, lesson, appState) {
  return `
    <section class="practice-shell practice-launcher" aria-label="Practice launcher">
      <header class="practice-launcher-head">
        <div><h1>Practice</h1><p>Practice speaking, listening and more.</p></div>
      </header>
      <div class="practice-mode-tabs" role="tablist" aria-label="Practice mode">
        ${modeTab("quiz", "Quiz", session.mode)}
        ${modeTab("flashcards", "Flashcards", session.mode)}
        ${modeTab("pronunciation", "Pronunciation", session.mode)}
        ${modeTab("conversation", "Conversation", session.mode)}
      </div>
      ${renderSummary(session.mode, topic, lesson)}
      <section class="practice-topic-section">
        <div class="practice-section-title"><h2>Practice by Topic</h2><button class="practice-view-all" type="button" onclick="hablaPractice.openLibrary()">View All ${iconSvg("arrow-right")}</button></div>
        <div class="practice-topic-grid">
          ${PRIMARY_TOPIC_IDS.map(slug => [slug, TOPICS[slug]]).map(([slug, item]) => {
            const availableLesson = getLessonForTopic(slug);
            const count = availableLesson ? getModeCount(session.mode, availableLesson) : 0;
            return `<button class="practice-topic ${session.topic === slug ? "selected" : ""} ${availableLesson ? "" : "locked"}" type="button" onclick="hablaPractice.selectTopic('${slug}')" aria-pressed="${session.topic === slug}">
              <span class="practice-topic-icon topic-${item.icon}" aria-hidden="true">${iconSvg(item.icon)}</span>
              <strong>${item.title}</strong><small>${availableLesson ? `${count} ${unitForMode(session.mode, count)}` : "Locked"}</small>
            </button>`;
          }).join("")}
        </div>
      </section>
      <section class="practice-weekly-card">
        <div><span>Weekly Goal</span><strong>${Math.min(Number(appState?.user?.streak || 0), 7)} of 7</strong><small>Active study days</small></div>
        <div class="practice-week-dots" aria-label="Current streak">
          ${Array.from({ length: 7 }, (_, index) => `<i class="${index < Math.min(Number(appState?.user?.streak || 0), 7) ? "done" : ""}"></i>`).join("")}
        </div>
      </section>
      <section class="practice-recent">
        <div class="practice-section-title"><h2>Recent Activity</h2></div>
        <div class="practice-empty-row"><span aria-hidden="true">${iconSvg("activity")}</span><div><strong>Your practice history starts here</strong><small>Complete a focused session to build your review habit.</small></div></div>
      </section>
    </section>`;
}

function renderPracticeLibrary(appState) {
  return `<section class="practice-shell practice-library" aria-label="Practice Library">
    ${renderLibraryHeader("Practice Library", "Browse every way to practice in Habla.", "launcher")}
    <div class="practice-library-categories">
      ${PRACTICE_LIBRARY_CATEGORIES.map(category => {
        const stats = getLibraryCategoryStats(category, appState);
        return `<button class="practice-library-category accent-${category.accent}" type="button" onclick="hablaPractice.openLibraryCategory('${category.id}')">
          <span class="library-category-icon" aria-hidden="true">${iconSvg(category.icon)}</span>
          <span class="library-category-copy"><small>Practice collection</small><strong>${escapeHtml(category.title)}</strong><em>${escapeHtml(category.description)}</em><b>${stats.available} available · ${stats.total} ${stats.total === 1 ? "item" : "items"}</b></span>
          <span class="library-card-arrow" aria-hidden="true">${iconSvg("arrow-right")}</span>
        </button>`;
      }).join("")}
    </div>
  </section>`;
}

function renderLibraryCategory(session, appState) {
  const category = findPracticeLibraryCategory(session.libraryCategoryId);
  if (!category) return renderPracticeLibrary(appState);

  return `<section class="practice-shell practice-library accent-${category.accent}" aria-label="${escapeAttr(category.title)}">
    ${renderLibraryHeader(category.title, category.description, "library")}
    ${category.featured ? renderLibraryFeatured(category) : ""}
    ${category.collections ? `<section class="library-shelf">
      <div class="library-shelf-heading"><h2>Browse the course</h2><span>${category.collections.length} collections</span></div>
      <div class="library-collection-grid">${category.collections.map(entry => renderLibraryCollectionCard(category, entry, appState)).join("")}</div>
    </section>` : (category.sections || []).map(group => `<section class="library-shelf">
      <div class="library-shelf-heading"><h2>${escapeHtml(group.title)}</h2><span>${group.items.length} items</span></div>
      <div class="library-item-grid">
        ${group.items.map(entry => renderLibraryItemCard(category, entry, appState)).join("")}
      </div>
    </section>`).join("")}
  </section>`;
}

function renderLibraryFeatured(category) {
  const featured = category.featured;
  const action = featured.itemId
    ? `hablaPractice.openLibraryItem('${category.id}','${featured.itemId}','${featured.collectionId}')`
    : `hablaPractice.openLibraryCollection('${category.id}','${featured.collectionId}')`;
  return `<button class="library-featured-card" type="button" onclick="${action}">
    <span class="library-featured-icon" aria-hidden="true">${iconSvg("star")}</span>
    <span><small>${escapeHtml(featured.eyebrow)}</small><strong>${escapeHtml(featured.title)}</strong><em>${escapeHtml(featured.description)}</em><b>Start ${iconSvg("arrow-right")}</b></span>
  </button>`;
}

function renderLibraryCollectionCard(category, entry, appState) {
  const stats = getLibraryCollectionStats(entry, appState);
  const count = entry.plannedCount || entry.items.length;
  const countLabel = entry.locked ? entry.level || "Locked" : entry.plannedCount > entry.items.length ? `${entry.items.length} of ${entry.plannedCount} ${entry.unit}` : `${count} ${count === 1 ? entry.unit.replace(/s$/, "") : entry.unit}`;
  return `<button class="library-collection-card${entry.locked ? " locked" : ""}" type="button" onclick="hablaPractice.openLibraryCollection('${category.id}','${entry.id}')">
    <span class="library-collection-icon" aria-hidden="true">${iconSvg(entry.locked ? "lock" : category.icon)}</span>
    <span class="library-collection-copy"><small>${escapeHtml(countLabel)}</small><strong>${escapeHtml(entry.title)}</strong>
      <span class="library-stars" aria-label="${stats.stars} of 5 mastery stars">${renderMasteryStars(stats.stars)}</span>
      <em>${stats.mastered} mastered</em><b>${stats.completion}%</b>
    </span>
    <span class="library-card-arrow" aria-hidden="true">${iconSvg("arrow-right")}</span>
    <span class="library-collection-progress"><i style="width:${stats.completion}%"></i></span>
  </button>`;
}

function renderLibraryCollection(session, appState) {
  const result = findPracticeLibraryCollection(session.libraryCategoryId, session.libraryCollectionId);
  if (!result) return renderPracticeLibrary(appState);
  const { category, collection: entry } = result;
  const stats = getLibraryCollectionStats(entry, appState);
  const count = entry.plannedCount || entry.items.length;
  const availability = entry.plannedCount > entry.items.length ? `${entry.items.length} available · ${entry.plannedCount} planned` : `${count} ${entry.unit}`;
  if (category.id === "verbs" && !entry.locked && entry.items.length) return renderVerbCollection(category, entry, stats, appState, availability);
  return `<section class="practice-shell practice-library accent-${category.accent}" aria-label="${escapeAttr(entry.title)}">
    ${renderLibraryHeader(entry.title, `${availability} · ${stats.completion}% complete`, "library-category")}
    <section class="library-collection-hero">
      <small>${escapeHtml(category.shortTitle || category.title)}</small><h2>${escapeHtml(entry.title)}</h2>
      <div class="library-collection-summary"><span>${renderMasteryStars(stats.stars)}</span><b>${stats.mastered} mastered</b><em>${stats.completion}%</em></div>
      <span class="library-item-progress" aria-label="${stats.completion}% complete"><b style="width:${stats.completion}%"></b></span>
    </section>
    ${entry.locked ? `<div class="library-empty-state"><span aria-hidden="true">${iconSvg("lock")}</span><p>This advanced collection unlocks later in the course.</p></div>` : entry.items.length ? `<section class="library-shelf"><div class="library-shelf-heading"><h2>${category.id === "verbs" ? "Choose a verb" : "Choose a lesson"}</h2><span>${entry.items.length} items</span></div><div class="library-item-grid">${entry.items.map(item => renderLibraryItemCard(category, item, appState, entry.id)).join("")}</div></section>` : `<div class="library-empty-state"><span aria-hidden="true">${iconSvg("activity")}</span><p>The course path is ready. Individual lessons will appear here as real content is added.</p></div>`}
  </section>`;
}

function renderVerbCollection(category, entry, stats, appState, availability) {
  const totals = entry.items.reduce((sum, item) => {
    const status = getLibraryItemStatus(item, appState);
    sum.cards += status.cards;
    sum.questions += status.questions;
    return sum;
  }, { cards: 0, questions: 0 });
  const minutes = Math.max(5, Math.ceil((totals.cards * .25) + (totals.questions * .5)));
  const itemLabel = entry.items.length === 1 ? entry.unit.replace(/s$/, "") : entry.unit;
  const chooserLabel = entry.unit === "verbs" ? "Choose a verb" : "Choose a lesson";
  return `<section class="practice-shell practice-library library-verb-collection accent-${category.accent}" aria-label="${escapeAttr(entry.title)}">
    ${renderLibraryHeader(entry.title, `${availability} · ${stats.completion}% complete`, "library-category")}
    <section class="verb-collection-hero">
      <div class="verb-collection-ring" style="--progress:${stats.completion * 3.6}deg"><span>${iconSvg("verbs")}</span></div>
      <div class="verb-collection-copy"><small>Verbs</small><h2>${escapeHtml(entry.title)}</h2><p>${escapeHtml(getVerbCollectionDescription(entry))}</p></div>
      <div class="verb-collection-art" aria-hidden="true">${verbAcademyIllustration()}</div>
      <div class="verb-collection-progress"><span><b>${stats.mastered} mastered</b><strong>${stats.completion}%</strong></span><i><b style="width:${stats.completion}%"></b></i></div>
    </section>
    <section class="verb-collection-stats" aria-label="Collection statistics">
      ${verbCollectionStat("star", entry.items.length, itemLabel)}
      ${verbCollectionStat("flashcards", totals.cards, "cards")}
      ${verbCollectionStat("quiz", totals.questions, "questions")}
      ${verbCollectionStat("time", `~${minutes}`, "min total")}
    </section>
    <section class="library-shelf verb-collection-shelf"><div class="library-shelf-heading"><h2>${chooserLabel}</h2><span>${entry.items.length} ${itemLabel}</span></div><div class="library-verb-item-grid">${entry.items.map(item => renderVerbCollectionItem(category, entry, item, appState)).join("")}</div></section>
  </section>`;
}

function renderVerbCollectionItem(category, collection, entry, appState) {
  const status = getLibraryItemStatus(entry, appState);
  const meaning = entry.libraryContent?.english || "Verb lesson";
  return `<button class="library-verb-item" type="button" onclick="hablaPractice.openLibraryItem('${category.id}','${entry.id}','${collection.id}')">
    <span class="library-verb-item-icon" aria-hidden="true">${iconSvg("verbs")}</span>
    <span class="library-verb-item-copy"><strong>${escapeHtml(entry.title)}</strong><small>${escapeHtml(meaning)}</small></span>
    <b>${status.completion}%</b><span class="library-verb-item-arrow" aria-hidden="true">${iconSvg("arrow-right")}</span>
    <i aria-label="${status.completion}% complete"><span style="width:${status.completion}%"></span></i>
  </button>`;
}

function verbCollectionStat(icon, value, label) {
  return `<div><span aria-hidden="true">${iconSvg(icon)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(label)}</small></div>`;
}

function getVerbCollectionDescription(entry) {
  return ({
    "core-verbs": "Master the 10 most important verbs you’ll use every day.",
    "regular-ar": "Build confidence with the most useful regular -AR verbs.",
    "regular-er": "Learn the repeatable pattern behind everyday -ER verbs.",
    "regular-ir": "Practice common -IR verbs and their predictable forms.",
    "irregular-verbs": "Learn the high-value verbs that break the usual patterns.",
    "past-tense": "Talk about completed actions with essential past-tense forms.",
    "future-tense": "Make plans and describe what will happen next.",
  })[entry.id] || `Build confidence with ${entry.title.toLowerCase()}.`;
}

function verbAcademyIllustration() {
  return `<svg viewBox="0 0 180 170" role="presentation" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <path d="M77 50h56M84 43h42l7 7H77l7-7ZM87 50v62M123 50v62M96 53v56M114 53v56M80 112h50M75 120h60"/>
    <path d="M18 139c22-14 43-14 65 0v20c-22-14-43-14-65 0v-20ZM148 139c-22-14-43-14-65 0v20c22-14 43-14 65 0v-20ZM83 139v20"/>
    <path d="M40 132c-12-15-16-33-11-52M126 130c14-15 20-34 17-54M30 98l-11-8M31 113l-13-2M137 97l12-10M134 113l14-3"/>
    <path d="m153 34 2 5 5 2-5 2-2 5-2-5-5-2 5-2 2-5ZM59 35l1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"/>
  </svg>`;
}

function renderLibraryItemCard(category, entry, appState, collectionId = "") {
  const status = getLibraryItemStatus(entry, appState);
  const countLabel = entry.smartKey
    ? `${status.dynamicCount} ready`
    : status.hasLessonContent
      ? `${status.cards} cards · ${status.questions} questions`
      : "Practice structure ready";
  return `<button class="library-item-card ${status.state}" type="button" onclick="hablaPractice.openLibraryItem('${category.id}','${entry.id}','${collectionId}')">
    <span class="library-item-top"><i aria-hidden="true">${iconSvg(entry.practiceTopic || category.icon)}</i><em>${status.state === "unlocked" ? `${status.completion}%` : status.state === "locked" ? "Locked" : collectionId ? "0%" : entry.level || "Planned"}</em></span>
    <strong>${escapeHtml(entry.title)}</strong>
    <small>${collectionId ? "Not started" : escapeHtml(countLabel)}</small>
    <span class="library-item-progress" aria-label="${status.completion}% complete"><b style="width:${status.completion}%"></b></span>
  </button>`;
}

function renderLibraryItemLauncher(session, appState) {
  const result = findPracticeLibraryItem(session.libraryCategoryId, session.libraryItemId, session.libraryCollectionId);
  if (!result) return renderPracticeLibrary(appState);
  const { category, item: entry } = result;
  const status = getLibraryItemStatus(entry, appState);
  const available = status.state === "unlocked" && Boolean(entry.practiceTopic || entry.libraryContent || entry.sourceLessonIds?.length);
  const isVerb = category.id === "verbs" && entry.libraryContent?.kind === "verb";

  return `<section class="practice-shell practice-library library-item-launcher accent-${category.accent}" aria-label="${escapeAttr(entry.title)} practice">
    ${renderLibraryHeader(entry.title, category.description, session.libraryCollectionId ? "library-collection" : "library-category")}
    ${isVerb ? renderVerbLauncherHero(category, entry) : `<section class="library-item-hero"><span class="library-item-hero-icon" aria-hidden="true">${iconSvg(entry.practiceTopic || category.icon)}</span><div><small>${escapeHtml(category.title)}</small><h2>${escapeHtml(entry.title)}</h2><p>${renderLibraryItemAvailability(status, entry)}</p></div></section>`}
    ${category.capabilities ? `<div class="library-capabilities" aria-label="Future expression features">${category.capabilities.map(capability => `<span>${escapeHtml(capability)}</span>`).join("")}</div>` : ""}
    <section class="library-mode-launcher">
      <div class="library-shelf-heading"><h2>${isVerb ? "Continue Learning" : "Learn & Practice"}</h2></div>
      ${isVerb ? renderVerbLearningPath(category, entry, available) : `<div class="library-mode-grid">${(category.launcherActions || MODES).map(mode => `<button class="library-mode-button mode-${mode}" type="button" ${available ? "" : "disabled"} onclick="hablaPractice.launchLibraryItem('${category.id}','${entry.id}','${mode}')"><span aria-hidden="true">${iconSvg(mode)}</span><strong>${libraryActionLabel(mode)}</strong><small>${available ? libraryModeMeta(entry, mode) : status.state === "locked" ? "Unlock through Learn" : "Content coming soon"}</small></button>`).join("")}</div>`}
    </section>
    ${available ? "" : `<div class="library-empty-state"><span aria-hidden="true">${iconSvg(status.state === "locked" ? "lock" : "activity")}</span><p>${status.state === "locked" ? "Continue through Learn to unlock this real lesson content." : entry.smartKey ? "This review shelf will fill automatically as you practice." : "The catalog structure is ready. Dedicated practice content has not been added yet."}</p></div>`}
  </section>`;
}

function renderVerbLauncherHero(category, entry) {
  const progress = getLibraryItemProgress(category.id, entry.id);
  const uses = getVerbUses(entry.id);
  return `<section class="library-item-hero library-verb-hero">
    <span class="library-item-hero-icon" aria-hidden="true">${iconSvg("verbs")}</span>
    <div class="library-verb-summary"><small>${escapeHtml(category.title)}</small><h2>${escapeHtml(entry.title)}</h2>
      <dl><div><dt>Meaning</dt><dd>${escapeHtml(entry.libraryContent.english)}</dd></div><div><dt>Used for</dt><dd>${uses.map(use => `<span>${escapeHtml(use)}</span>`).join("")}</dd></div></dl>
      <div class="library-verb-progress"><span><small>Progress</small><b>${progress.overall}%</b></span><i><b style="width:${progress.overall}%"></b></i></div>
    </div>
  </section>`;
}

function renderVerbLearningPath(category, entry, available) {
  const order = ["mini-lessons", "flashcards", "quiz", "conjugation"];
  const progress = getLibraryItemProgress(category.id, entry.id);
  const recommended = order.find(mode => progress.modes[mode] < 100) || "mini-lessons";
  const recommendedLabel = progress.modes[recommended] > 0 ? "Continue" : "Start";
  const launch = mode => `hablaPractice.launchLibraryItem('${category.id}','${entry.id}','${mode}')`;
  return `<div class="library-learning-path">
    <button class="library-recommended-mode mode-${recommended}" type="button" ${available ? "" : "disabled"} onclick="${launch(recommended)}">
      <span class="library-recommended-icon" aria-hidden="true">${iconSvg(recommended)}</span>
      <span class="library-recommended-copy"><small>Today’s Recommendation</small><strong>${recommendedLabel} ${libraryActionLabel(recommended)}</strong><em>${libraryModeMeta(entry, recommended, progress.modes[recommended])} · ${progress.modes[recommended]}% complete</em><i><b style="width:${progress.modes[recommended]}%"></b></i><span>${recommendedLabel} ${iconSvg("arrow-right")}</span></span>
    </button>
    <div class="library-path-list">${order.filter(mode => mode !== recommended).map(mode => `<button class="library-path-mode mode-${mode}" type="button" ${available ? "" : "disabled"} onclick="${launch(mode)}"><span aria-hidden="true">${iconSvg(mode)}</span><strong>${libraryActionLabel(mode)}</strong><small>${libraryModeMeta(entry, mode, progress.modes[mode])}</small><b>${progress.modes[mode]}%</b>${iconSvg("arrow-right")}</button>`).join("")}</div>
  </div>`;
}

function libraryModeMeta(entry, mode, progress = 0) {
  const content = entry.libraryContent;
  if (progress >= 100) return "Complete · Review anytime";
  if (mode === "mini-lessons" || mode === "mini-lesson") return progress ? "Lesson in progress" : "3 guided steps · Lesson 1 of 3";
  if (mode === "flashcards") return `${1 + (content?.examples?.length || 0)} cards`;
  if (mode === "quiz") return `3 questions · about 2 min`;
  if (mode === "conjugation") return `${content?.forms?.length || 0} forms · Reference`;
  return progress ? "In progress" : "Ready to begin";
}

function getVerbUses(id) {
  return ({
    ser: ["Identity", "Origin", "Profession", "Characteristics"], estar: ["Location", "Conditions", "Feelings"], tener: ["Possession", "Age", "Needs"], ir: ["Movement", "Destinations", "Future plans"], hacer: ["Actions", "Making things", "Weather"], poder: ["Ability", "Permission", "Requests"], querer: ["Wants", "Preferences", "Affection"], venir: ["Coming", "Origin", "Arrival"], decir: ["Speaking", "Telling", "Reported words"], dar: ["Giving", "Requests", "Expressions"],
  })[id] || ["Everyday actions", "Useful statements"];
}

function renderLibraryStudy(session, appState) {
  const result = findPracticeLibraryItem(session.libraryCategoryId, session.libraryItemId, session.libraryCollectionId);
  if (!result) return renderPracticeLibrary(appState);
  const lesson = buildLibraryLesson(result);
  const mode = session.libraryStudyMode || "examples";
  const content = result.item.libraryContent;
  const examples = content?.examples?.length ? content.examples : (lesson?.grammar?.examples || lesson?.vocabulary?.slice(0, 6).map(card => ({ spanish: card.exampleSpanish || card.spanish, english: card.exampleEnglish || card.english })) || []);
  const forms = content?.forms || [];
  const mistakes = content?.commonMistake ? [content.commonMistake] : (lesson?.commonMistakes || []).map(entry => typeof entry === "string" ? entry : `${entry.mistake} → ${entry.correction}. ${entry.explanation || ""}`);
  const title = libraryActionLabel(mode);
  const guidance = content?.kind === "verb" ? getVerbGuidance(result.item, content) : null;
  const studyHero = guidance ? `${result.item.title} (${guidance.tense} Tense)` : (lesson?.grammar?.topic || result.item.title);
  const isMiniLesson = mode === "mini-lessons" || mode === "mini-lesson";
  return `<section class="practice-shell practice-library library-study accent-${result.category.accent}" aria-label="${escapeAttr(title)}">
    ${isMiniLesson ? renderStudyBackControl() : renderLibraryHeader(title, result.item.title, "library-item")}
    <section class="library-item-hero"><span class="library-item-hero-icon" aria-hidden="true">${iconSvg(mode)}</span><div><small>${escapeHtml(result.category.title)}</small><h2>${escapeHtml(result.item.title)}</h2><p>${escapeHtml(content?.explanation || lesson?.grammar?.explanation || "Review this pattern in clear, practical Spanish.")}</p></div></section>
    ${mode === "conjugation" ? `<section class="library-direction-card"><small>3 Simple Steps</small><ol><li><b>Choose the subject</b><span>Who is doing the action?</span></li><li><b>Find its form</b><span>Match that subject to the verb below.</span></li><li><b>Say a full sentence</b><span>Tap the form, repeat it, then add a detail.</span></li></ol></section>
      <section class="library-study-card library-conjugation-card"><div class="library-study-heading"><div><small>${escapeHtml(guidance.tense)} tense</small><h2>${escapeHtml(result.item.title)}</h2></div><span>${escapeHtml(content.english)}</span></div>
        <div class="library-pattern"><small>${guidance.isRegular ? "Build the form" : "Remember the pattern"}</small><strong>${guidance.patternHtml}</strong><p>${escapeHtml(guidance.rule)}</p></div>
        <div class="library-conjugation-grid">${guidance.subjects.map((subject, index) => `<button type="button" data-phrase="${escapeAttr(forms[index] || "")}" onclick="hablaPractice.speakForm(this)" aria-label="Hear ${escapeAttr(subject.spanish)}: ${escapeAttr(forms[index] || "verb form")}"><small>${escapeHtml(subject.spanish)} <em>${escapeHtml(subject.english)}</em></small><strong>${escapeHtml(forms[index] || "—")}</strong>${iconSvg("volume")}</button>`).join("")}</div>
      </section>
      <section class="library-try-card"><small>Your turn</small><h2>Make one sentence</h2><p>Start with <strong>${escapeHtml(guidance.tryForm)}</strong>, then add your own detail.</p><em>Example: ${escapeHtml(examples[0]?.spanish || guidance.tryForm)}</em><button class="practice-primary" type="button" onclick="hablaPractice.completeLibraryStudy('quiz')"><span class="button-label">Check What You Learned</span>${iconSvg("arrow-right", "button-icon")}</button></section>` : ""}
    ${mode === "examples" ? `<section class="library-study-card"><h2>Examples</h2><div class="library-example-list">${examples.map(example => `<article><button type="button" data-phrase="${escapeAttr(example.spanish)}" onclick="hablaPractice.speak(this.dataset.phrase)" aria-label="Hear example">${iconSvg("volume")}</button><div><strong>${escapeHtml(example.spanish)}</strong><p>${escapeHtml(example.english || "")}</p></div></article>`).join("")}</div></section>` : ""}
    ${isMiniLesson ? `<section class="library-lesson-progress" aria-label="Mini lesson progress"><div><small>Mini Lesson</small><strong>Lesson 1 of 3</strong></div><span class="active"></span><span></span><span></span></section>
      <section class="library-study-card library-mini-lesson"><div class="library-step-heading"><small>Step 1</small><strong>Learn the Rule</strong><h2>${escapeHtml(studyHero)}</h2></div><p>${escapeHtml(content?.explanation || lesson?.grammar?.explanation || "Study the examples, then say one of your own.")}</p>${guidance ? `${renderVerbChangeExplanation(result.item, content, guidance)}<div class="library-pattern"><small>The pattern</small><strong>${guidance.patternHtml}</strong><p>${escapeHtml(guidance.rule)}</p></div>` : ""}</section>
      <section class="library-study-card library-mini-lesson"><div class="library-step-heading"><small>Step 2</small><strong>Notice It in Context</strong><h2>Spanish in Real Life</h2></div><p>Listen once, then repeat the full Spanish sentence aloud.</p>${guidance ? renderVerbFormGuide(result.item, content, guidance, examples) : ""}${examples.slice(0, 3).map(example => `<blockquote><button type="button" data-phrase="${escapeAttr(example.spanish)}" onclick="hablaPractice.speak(this.dataset.phrase)" aria-label="Hear example">${iconSvg("volume")}</button><span><small>Spanish</small><strong>${escapeHtml(example.spanish)}</strong><small>English</small><em>${escapeHtml(example.english || "")}</em></span></blockquote>`).join("")}</section>
      <section class="library-try-card library-challenge-card"><div class="library-challenge-heading"><span aria-hidden="true">${iconSvg("target")}</span><div><small>Step 3</small><strong>Your Challenge</strong><h2>Build Your Own Sentence</h2></div></div><p>Create a sentence using:</p><b class="library-challenge-starter">${escapeHtml(guidance?.tryForm || result.item.title)}</b><div class="library-challenge-examples"><small>Examples</small>${examples.slice(0, 3).map(example => `<span>${iconSvg("quiz")}<b>${escapeHtml(example.spanish)}</b></span>`).join("")}</div><p class="library-carlos-note">Say it in your own words. Carlos will help you continue the conversation.</p><button class="practice-primary" type="button" onclick="hablaPractice.completeLibraryStudy('conversation')"><span class="button-label">Practice with Carlos</span>${iconSvg("arrow-right", "button-icon")}</button></section>` : ""}
    ${mode === "common-mistakes" ? `<section class="library-study-card"><h2>Common mistakes</h2><div class="library-mistake-list">${(mistakes.length ? mistakes : ["No special exception is needed at this level. Focus on the forms and examples above."]).map(text => `<p>${iconSvg("common-mistakes")}<span>${escapeHtml(text)}</span></p>`).join("")}</div></section>` : ""}
  </section>`;
}

function getVerbGuidance(entry, content) {
  const subjects = [
    { spanish: "yo", english: "I" }, { spanish: "tú", english: "you" }, { spanish: "él / ella", english: "he / she" },
    { spanish: "nosotros", english: "we" }, { spanish: "ellos / ellas", english: "they" },
  ];
  const infinitive = entry.title.split(" · ")[0].toLowerCase();
  const ending = infinitive.slice(-2);
  const stem = infinitive.slice(0, -2);
  const isRegular = ["ar", "er", "ir"].includes(ending) && content.forms.every(form => form.startsWith(stem));
  const tense = entry.title.includes("Preterite") ? "Preterite" : entry.title.includes("Future") ? "Future" : entry.id === "ir-a-infinitive" ? "Near future" : "Present";
  const patternBase = tense === "Future" ? infinitive : stem;
  const patternHtml = isRegular
    ? `<span>${escapeHtml(infinitive)}</span><i>→</i><span>${escapeHtml(patternBase)}</span><b> + ending</b>`
    : `<span>${escapeHtml(infinitive)}</span><i>→</i><span>${escapeHtml(content.forms.slice(0, 3).join(" · "))}</span>`;
  return {
    subjects, isRegular, tense, patternHtml,
    rule: isRegular ? (tense === "Future" ? `Keep the full infinitive “${infinitive}” and add the future ending that matches the subject.` : `Remove -${ending.toUpperCase()}, keep the stem “${stem},” and add the ending that matches the subject.`) : "This verb changes form. Match each subject with its form, then learn it inside a short sentence.",
    tryForm: `Yo ${content.forms[0] || infinitive}…`,
  };
}

function renderStudyBackControl() {
  return `<div class="library-study-back"><button type="button" onclick="hablaPractice.libraryBack('library-item')" aria-label="Go back">${iconSvg("arrow-left")}</button></div>`;
}

function renderVerbChangeExplanation(entry, content, guidance) {
  const infinitive = entry.title.split(" · ")[0].toLowerCase();
  return `<section class="library-verb-change">
    <small>Why it changes</small>
    <h3>The verb matches the subject</h3>
    <p><strong>${escapeHtml(infinitive)}</strong> is the infinitive&mdash;the dictionary form. In a sentence, Spanish changes the verb to show who the sentence is about. This is called conjugation.</p>
    <p class="library-verb-change-note">Use <strong>${escapeHtml(infinitive)}</strong> when naming the verb. In a full sentence, use the form that matches the subject: <strong>${escapeHtml(guidance.subjects[0].spanish)} &rarr; ${escapeHtml(content.forms[0] || infinitive)}</strong>, <strong>${escapeHtml(guidance.subjects[1].spanish)} &rarr; ${escapeHtml(content.forms[1] || infinitive)}</strong>.</p>
  </section>`;
}

function renderVerbFormGuide(entry, content, guidance, examples) {
  const infinitive = entry.title.split(" · ")[0].toLowerCase();
  const meanings = ["ser", "estar"].includes(entry.id)
    ? ["I am", "You are", "He/she is", "We are", "They are"]
    : [];
  const rows = guidance.subjects.map((subject, index) => `<span><small>${escapeHtml(subject.spanish)} <em>${escapeHtml(subject.english)}</em></small><b>${escapeHtml(content.forms[index] || infinitive)}</b>${meanings[index] ? `<i>${escapeHtml(meanings[index])}</i>` : ""}</span>`).join("");
  const groupForm = content.forms[3] || "";
  const groupExample = examples.find(example => String(example.spanish || "").toLowerCase().includes(String(groupForm).toLowerCase()));
  return `<section class="library-context-form-guide">
    <header><div><small>Quick form guide</small><h3>${escapeHtml(entry.title)} means ${escapeHtml(content.english)}</h3></div><span>Present tense</span></header>
    <div>${rows}</div>
    ${groupForm && groupExample ? `<p><strong>${escapeHtml(groupExample.spanish)}</strong> means <strong>${escapeHtml(groupExample.english)}</strong> Use <b>${escapeHtml(groupForm)}</b> with <b>${escapeHtml(guidance.subjects[3].spanish)}</b>&mdash;a group that includes you.</p>` : ""}
  </section>`;
}

function buildLibraryLesson(result) {
  const entry = result?.item;
  if (!entry) return null;
  if (entry.libraryContent?.kind === "verb") {
    const content = entry.libraryContent;
    const guidance = getVerbGuidance(entry, content);
    const labels = ["I", "you", "he / she", "we", "they"];
    const vocabulary = [{ spanish: entry.title.toLowerCase(), english: content.english, exampleSpanish: content.examples[0]?.spanish, exampleEnglish: content.examples[0]?.english, tip: content.explanation }, ...content.examples.map(example => ({ spanish: example.spanish, english: example.english }))];
    const formOptions = content.forms.slice(0, 4);
    return {
      id: `library-${entry.id}`, title: entry.title, vocabulary,
      grammar: { topic: `${entry.title}: ${guidance.tense.toLowerCase()} tense`, explanation: content.explanation, examples: content.examples },
      commonMistakes: [{ mistake: content.commonMistake, correction: content.explanation, explanation: "Review the pattern and examples." }],
      pronunciation: { items: [{ text: entry.title.toLowerCase(), english: content.english }, ...content.examples.map(example => ({ text: example.spanish, english: example.english }))] },
      quiz: [
        { prompt: `What does “${entry.title.toLowerCase()}” mean?`, options: uniqueQuizOptions(content.english, ["to speak", "to eat", "to live", "to write"]), answer: content.english },
        { prompt: `Which is the yo form of ${entry.title.toLowerCase()}?`, options: formOptions, answer: content.forms[0] },
        { prompt: `Which form matches “${labels[1]}”?`, options: formOptions, answer: content.forms[1] },
      ],
    };
  }
  const sources = (entry.sourceLessonIds || []).map(id => getLessonById(id)).filter(Boolean);
  if (!sources.length) return null;
  const grammar = sources.find(source => source.grammar)?.grammar || {};
  return {
    id: `library-${entry.id}`, title: entry.title,
    vocabulary: sources.flatMap(source => source.vocabulary || []).slice(0, 30),
    quiz: sources.flatMap(source => source.quiz || []).filter(question => question?.prompt && question?.options?.length && question?.answer).slice(0, 15),
    pronunciation: { items: sources.flatMap(source => source.pronunciation?.items || []).slice(0, 15) },
    grammar,
    commonMistakes: sources.flatMap(source => source.commonMistakes || []).slice(0, 6),
  };
}

function uniqueQuizOptions(answer, alternatives) {
  return [answer, ...alternatives.filter(option => option !== answer)].slice(0, 4);
}

function renderLibraryHeader(title, description, backView) {
  return `<header class="practice-library-header"><button type="button" onclick="hablaPractice.libraryBack('${backView}')" aria-label="Go back">${iconSvg("arrow-left")}</button><div><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></div></header>`;
}

function renderLibraryItemAvailability(status, entry) {
  if (entry.smartKey) return `${status.dynamicCount} items currently available from saved progress.`;
  if (status.state === "unlocked") return `${status.cards} cards and ${status.questions} questions from your unlocked lesson · ${status.completion}% complete.`;
  if (status.state === "locked") return "Real lesson content is available but still locked in your course progression.";
  return "This practice collection is planned and waiting for dedicated content.";
}

function getLibraryCategoryStats(category, appState) {
  if (category.collections) return {
    total: category.collections.length,
    available: category.collections.filter(entry => !entry.locked).length,
  };
  const groups = category.sections || category.collections || [];
  const items = groups.flatMap(group => group.items);
  return {
    total: category.collections?.length || items.length,
    available: items.filter(entry => {
      const status = getLibraryItemStatus(entry, appState);
      return status.state === "unlocked" || (entry.smartKey && status.dynamicCount > 0);
    }).length,
  };
}

function getLibraryCollectionStats(entry, appState) {
  const statuses = entry.items.map(item => getLibraryItemStatus(item, appState));
  const mastered = statuses.filter(status => status.completion === 100).length;
  const denominator = entry.plannedCount || entry.items.length;
  const completion = denominator ? Math.round(statuses.reduce((sum, status) => sum + status.completion, 0) / denominator) : 0;
  return { mastered, completion, stars: Math.round(completion / 20) };
}

function renderMasteryStars(count) {
  return Array.from({ length: 5 }, (_, index) => `<i class="${index < count ? "active" : ""}">${iconSvg("star")}</i>`).join("");
}

function libraryActionLabel(mode) {
  return ({ quiz: "Quiz", flashcards: "Flashcards", pronunciation: "Pronunciation", conversation: "Conversation", "mini-lessons": "Mini Lesson", "mini-lesson": "Mini Lesson", conjugation: "Conjugation", examples: "Examples", "common-mistakes": "Common Mistakes" })[mode] || mode;
}

function getLibraryItemStatus(entry, appState) {
  if (entry.smartKey) {
    const dynamicCount = getSmartReviewCount(entry.smartKey, appState);
    return { state: dynamicCount > 0 ? "ready" : "planned", completion: 0, cards: 0, questions: 0, dynamicCount, hasLessonContent: false };
  }

  if (entry.libraryContent || entry.sourceLessonIds?.length) {
    const lesson = buildLibraryLesson({ item: entry });
    const completion = entry.libraryContent?.kind === "verb" ? getLibraryItemProgress("verbs", entry.id).overall : 0;
    return { state: "unlocked", completion, cards: lesson?.vocabulary?.length || 0, questions: lesson?.quiz?.length || 0, dynamicCount: 0, hasLessonContent: true };
  }

  const lessonIds = Array.isArray(entry.lessonIds) ? entry.lessonIds : [];
  const lessons = lessonIds.map(id => getLessonById(id)).filter(Boolean);
  if (!lessons.length) return { state: "planned", completion: 0, cards: 0, questions: 0, dynamicCount: 0, hasLessonContent: false };

  const unlockedIds = new Set(getUnlockedLessons().map(lesson => lesson.id));
  const unlockedLessons = lessons.filter(lesson => unlockedIds.has(lesson.id));
  const cards = lessons.reduce((total, lesson) => total + (lesson.vocabulary?.length || 0), 0);
  const questions = lessons.reduce((total, lesson) => total + (lesson.quiz?.length || 0), 0);
  const completed = lessons.filter(lesson => getLessonProgress(lesson.id).completed).length;
  return {
    state: unlockedLessons.length ? "unlocked" : "locked",
    completion: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
    cards,
    questions,
    dynamicCount: 0,
    hasLessonContent: true,
  };
}

function getSmartReviewCount(key, appState) {
  const weakWords = Array.isArray(appState?.vocabulary?.weakWords) ? appState.vocabulary.weakWords.length : 0;
  const learned = Array.isArray(appState?.vocabulary?.learned) ? appState.vocabulary.learned.length : 0;
  const counts = {
    dueToday: 0,
    weakWords,
    recentlyMissed: 0,
    favorites: 0,
    recentlyPracticed: 0,
    dailyReview: weakWords,
    difficultVerbs: 0,
    difficultExpressions: 0,
  };
  return Number(counts[key] ?? (key === "learned" ? learned : 0));
}

function modeTab(mode, label, selected) {
  return `<button class="practice-mode-tab mode-${mode} ${selected === mode ? "selected" : ""}" type="button" role="tab" aria-label="${label}" aria-selected="${selected === mode}" onclick="hablaPractice.selectMode('${mode}')"><span aria-hidden="true">${iconSvg(mode)}</span><small>${label}</small></button>`;
}

function renderSummary(mode, topic, lesson) {
  const definitions = {
    quiz: ["Quiz Practice", "Test your knowledge with multiple choice.", "Start Quiz"],
    flashcards: ["Flashcards", "Review vocabulary from your available lesson.", "Start Flashcards"],
    pronunciation: ["Pronunciation Practice", "Listen, record, and repeat useful phrases.", "Start Speaking"],
    conversation: ["Speak with Carlos", "Use this topic as context for a focused conversation.", "Start Conversation"],
  };
  const [title, description, action] = definitions[mode];
  const count = lesson ? getModeCount(mode, lesson) : 0;
  const meta = mode === "conversation" ? "Topic context ready" : lesson ? `${count} ${unitForMode(mode, count)} · ${estimateMinutes(mode, count)} min` : "Complete earlier lessons to unlock";
  return `<section class="practice-summary mode-${mode}">
    <div class="practice-summary-copy"><span class="practice-summary-label">${title}</span><h2>${topic.title}</h2><p>${lesson || mode === "conversation" ? description : "This topic is not available in your unlocked lessons yet."}</p><small>${meta}</small></div>
    <div class="practice-summary-mark" aria-hidden="true">${iconSvg(mode)}</div>
    <button class="practice-primary" type="button" onclick="hablaPractice.start()"><span class="button-label">${action}</span>${iconSvg("arrow-right", "button-icon")}</button>
  </section>`;
}

function renderActivityHeader(title) {
  return `<header class="practice-activity-head"><button type="button" onclick="hablaPractice.back()" aria-label="Back to Practice">${iconSvg("arrow-left")}</button><h1>${title}</h1><span></span></header>`;
}

function renderTopicSummary(topic, lesson, current, total, mode) {
  const percent = total ? Math.round((current / total) * 100) : 0;
  return `<section class="practice-activity-summary mode-${mode}">
    <span class="practice-topic-icon topic-${topic.icon}" aria-hidden="true">${iconSvg(topic.icon)}</span>
    <div><strong>${topic.title}</strong><small>${lesson ? shortLessonTitle(lesson.title) : "Practice"}</small></div>
    <div class="practice-summary-progress"><b>${current} / ${total}</b><i><span style="width:${percent}%"></span></i></div>
  </section>`;
}

function renderQuizActivity(session, topic, lesson) {
  ensureQuizSession(session, lesson);
  const question = session.quiz.questions[session.quiz.index];
  const total = session.quiz.questions.length;
  const selected = session.quiz.selected;
  return `<section class="practice-shell practice-activity quiz-activity">
    ${renderActivityHeader("Quiz")}
    ${renderTopicSummary(topic, lesson, session.quiz.index + 1, total, "quiz")}
    <article class="practice-question-card">
      <div class="practice-question-step"><span>Question ${session.quiz.index + 1} of ${total}</span><i><b style="width:${((session.quiz.index + 1) / total) * 100}%"></b></i></div>
      <h2>${escapeHtml(question.prompt)}</h2>
      <div class="practice-answer-list">${question.options.map((option, index) => {
        const isCorrect = selected && option === question.answer;
        const isWrong = selected === option && option !== question.answer;
        return `<button type="button" class="practice-answer ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}" ${selected ? "disabled" : ""} onclick="hablaPractice.answer(${index})"><span>${String.fromCharCode(65 + index)}</span>${escapeHtml(option)}</button>`;
      }).join("")}</div>
    </article>
    ${selected ? `<section class="practice-feedback ${selected === question.answer ? "correct" : "wrong"}"><strong>${selected === question.answer ? "Correct!" : "Keep going"}</strong><p>${selected === question.answer ? `“${escapeHtml(question.answer)}” is the right answer.` : `The correct answer is “${escapeHtml(question.answer)}”.`}</p></section>` : ""}
    <button class="practice-primary practice-next" type="button" ${selected ? "" : "disabled"} onclick="hablaPractice.nextQuiz()"><span class="button-label">${session.quiz.index + 1 === total ? "See Results" : "Next Question"}</span>${iconSvg("arrow-right", "button-icon")}</button>
  </section>`;
}

function renderFlashcardActivity(session, topic, lesson) {
  ensureFlashSession(session, lesson);
  const cards = getCards(lesson);
  const orderedCards = session.flash.order.map(index => cards[index]).filter(Boolean);
  const card = orderedCards[session.flash.index];
  const total = orderedCards.length;
  return `<section class="practice-shell practice-activity flash-activity">
    ${renderActivityHeader("Flashcards")}
    ${renderTopicSummary(topic, lesson, session.flash.index + 1, total, "flashcards")}
    <article class="practice-flashcard ${session.flash.flipped ? "flipped" : ""}" role="button" tabindex="0" onclick="hablaPractice.flip()" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();hablaPractice.flip()}" aria-label="Flip flashcard">
      <span class="flash-star" aria-hidden="true">${iconSvg("star")}</span>
      <button class="flash-audio" type="button" tabindex="${session.flash.flipped ? "-1" : "0"}" data-phrase="${escapeAttr(card.spanish)}" onclick="event.stopPropagation();hablaPractice.speakCard(this)" onkeydown="event.stopPropagation()" aria-label="Hear pronunciation" title="Hear pronunciation">${iconSvg("volume")}</button>
      <span class="flash-front" aria-hidden="${session.flash.flipped}"><strong>${escapeHtml(card.spanish)}</strong><span class="flash-hear-label">Tap to hear pronunciation</span><small>Tap card to flip</small></span>
      <span class="flash-back" aria-hidden="${!session.flash.flipped}">
        <strong class="flash-meaning">${escapeHtml(card.english)}</strong>
        <span class="flash-term">${escapeHtml(card.spanish)}</span>
        ${card.exampleSpanish ? `<i class="flash-divider" aria-hidden="true"></i><span class="flash-example-head"><em class="flash-example-label">Example</em><button class="flash-example-audio" type="button" tabindex="${session.flash.flipped ? "0" : "-1"}" data-phrase="${escapeAttr(card.exampleSpanish)}" onclick="event.stopPropagation();hablaPractice.speakExample(this)" onkeydown="event.stopPropagation()" aria-label="Hear example sentence" title="Hear example sentence">${iconSvg("volume")}</button></span><p class="flash-example-spanish">${escapeHtml(card.exampleSpanish)}</p><p class="flash-example-english">${escapeHtml(card.exampleEnglish || "")}</p>` : ""}
        ${card.tip ? `<small>${escapeHtml(card.tip)}</small>` : ""}
      </span>
    </article>
    <div class="practice-card-nav"><button type="button" onclick="hablaPractice.prevCard()" aria-label="Previous card">${iconSvg("arrow-left")}</button><strong>${session.flash.index + 1} / ${total}</strong><button type="button" onclick="hablaPractice.nextCard()" aria-label="Next card">${iconSvg("arrow-right")}</button></div>
    <button class="practice-secondary" type="button" onclick="hablaPractice.shuffleCards()">${iconSvg("shuffle", "button-icon")}<span class="button-label">Shuffle Cards</span></button>
  </section>`;
}

function renderPronunciationActivity(session, topic, lesson) {
  ensurePronunciationSession(session, lesson);
  const exercises = getPronunciation(lesson);
  const item = exercises[session.pronunciation.index];
  const total = exercises.length;
  return `<section class="practice-shell practice-activity pronunciation-activity">
    ${renderActivityHeader("Pronunciation")}
    ${renderTopicSummary(topic, lesson, session.pronunciation.index + 1, total, "pronunciation")}
    <div class="pronunciation-stage">
      <span>Listen and repeat</span><h2>${escapeHtml(item.text)}</h2>
      ${item.english ? `<p>${escapeHtml(item.english)}</p>` : ""}
      <button class="pron-listen" type="button" data-phrase="${escapeAttr(item.text)}" onclick="hablaPractice.speak(this.dataset.phrase)" aria-label="Listen to phrase">${iconSvg("volume")}</button>
      <button class="pron-mic ${session.pronunciation.recording ? "recording" : ""}" type="button" onclick="hablaPractice.toggleRecording()"><span>${iconSvg("pronunciation")}</span><small>${session.pronunciation.recording ? "Tap to stop" : "Tap to record"}</small></button>
      <div class="pron-status" aria-live="polite">${escapeHtml(session.pronunciation.message || "Speak now when you’re ready.")}</div>
      <audio class="pron-playback" controls ${playbackUrl ? `src="${escapeAttr(playbackUrl)}"` : "hidden"}></audio>
      <div class="pron-wave" aria-hidden="true">${Array.from({length: 26}, (_, i) => `<i style="height:${8 + ((i * 11) % 27)}px"></i>`).join("")}</div>
      ${item.note ? `<small class="pron-note">${escapeHtml(item.note)}</small>` : ""}
    </div>
    <div class="pron-actions"><button type="button" data-phrase="${escapeAttr(item.text)}" onclick="hablaPractice.speak(this.dataset.phrase)">${iconSvg("replay", "button-icon")}<span>Listen Again</span></button><button type="button" onclick="hablaPractice.nextPronunciation()"><span>${session.pronunciation.index + 1 === total ? "Finish" : "Next"}</span>${iconSvg("arrow-right", "button-icon")}</button></div>
  </section>`;
}

function renderLockedActivity(session, topic) {
  return `<section class="practice-shell practice-activity">${renderActivityHeader(modeTitle(session.mode))}<div class="practice-locked-state"><span>${iconSvg("lock")}</span><h2>${topic.title} practice is still locked</h2><p>Continue your lessons to unlock real ${topic.title.toLowerCase()} vocabulary and exercises.</p><button class="practice-primary" onclick="hablaPractice.back()"><span class="button-label">Back to Practice</span>${iconSvg("arrow-right", "button-icon")}</button></div></section>`;
}

function renderNoDataActivity(session, topic, lesson) {
  return `<section class="practice-shell practice-activity">${renderActivityHeader(modeTitle(session.mode))}<div class="practice-locked-state"><span>${iconSvg("lock")}</span><h2>No ${modeTitle(session.mode).toLowerCase()} material yet</h2><p>${escapeHtml(shortLessonTitle(lesson.title))} does not include this practice type. Nothing unrelated has been substituted.</p><button class="practice-primary" onclick="hablaPractice.back()"><span class="button-label">Back to Practice</span>${iconSvg("arrow-right", "button-icon")}</button></div></section>`;
}

function renderResults(session, topic, lesson) {
  const total = session.quiz?.questions?.length || 0;
  const score = session.quiz?.score || 0;
  const percent = total ? Math.round((score / total) * 100) : 0;
  return `<section class="practice-shell practice-activity practice-results">${renderActivityHeader("Results")}<div class="results-card"><span>Session complete</span><strong>${percent}%</strong><h2>${topic.title} Quiz</h2><p>${score} of ${total} correct</p><button class="practice-primary" onclick="hablaPractice.restartQuiz()"><span class="button-label">Practice Again</span>${iconSvg("replay", "button-icon")}</button><button class="practice-secondary" onclick="hablaPractice.back()">${iconSvg("arrow-left", "button-icon")}<span class="button-label">Back to Practice</span></button></div></section>`;
}

function getLessonForTopic(slug) {
  const topic = TOPICS[slug] || TOPICS.greetings;
  const unlocked = getUnlockedLessons();
  return topic.lessons.map(id => unlocked.find(lesson => lesson.id === id)).find(Boolean) || null;
}

function getCards(lesson) {
  const seen = new Set();
  return (lesson?.vocabulary || []).filter(item => item?.spanish && item?.english && !seen.has(item.spanish.toLowerCase()) && seen.add(item.spanish.toLowerCase())).map(item => ({ spanish: item.spanish, english: item.english, exampleSpanish: item.exampleSpanish, exampleEnglish: item.exampleEnglish, tip: item.tip }));
}

function getPronunciation(lesson) {
  const vocab = lesson?.vocabulary || [];
  const listening = lesson?.listeningPhrases || [];
  return (lesson?.pronunciation?.items || []).map(raw => {
    const item = typeof raw === "string" ? { text: raw, note: "" } : raw;
    const normalized = normalize(item.text);
    const word = vocab.find(entry => normalize(entry.spanish) === normalized);
    const phrase = listening.find(entry => normalize(entry.spanish) === normalized);
    return { text: item.text, note: item.note || "", english: word?.english || phrase?.english || "" };
  }).filter(item => item.text);
}

function getModeCount(mode, lesson) {
  if (mode === "flashcards") return getCards(lesson).length;
  if (mode === "pronunciation") return getPronunciation(lesson).length;
  if (mode === "conversation") return 1;
  return (lesson?.quiz || []).length;
}

function unitForMode(mode, count) {
  if (mode === "flashcards") return count === 1 ? "card" : "cards";
  if (mode === "pronunciation") return count === 1 ? "exercise" : "exercises";
  if (mode === "conversation") return "conversation";
  return count === 1 ? "question" : "questions";
}

function estimateMinutes(mode, count) { return Math.max(2, Math.ceil(count * (mode === "pronunciation" ? .7 : .45))); }

function ensureQuizSession(session, lesson, force = false) {
  if (!force && session.quiz?.lessonId === lesson.id && session.quiz.questions?.length) return;
  const questions = (lesson.quiz || []).map((question, index, all) => {
    let options = Array.isArray(question.options) ? [...question.options] : [];
    options = [question.answer, ...options.filter(option => option !== question.answer)];
    const pool = [...all.map(item => item.answer), ...getCards(lesson).map(item => item.english)].filter(Boolean);
    for (const option of shuffle(pool)) if (options.length < 4 && !options.includes(option)) options.push(option);
    return { prompt: question.prompt || "Choose the correct answer.", answer: question.answer, options: shuffle(options.slice(0, 4)) };
  });
  session.quiz = { lessonId: lesson.id, questions: shuffle(questions), index: 0, score: 0, selected: "" };
  writeSession(session);
}

function ensureFlashSession(session, lesson, force = false) {
  const cards = getCards(lesson);
  if (!force && session.flash?.lessonId === lesson.id && session.flash.order?.length === cards.length) return;
  session.flash = { lessonId: lesson.id, order: cards.map((_, index) => index), index: 0, flipped: false };
  writeSession(session);
}

function ensurePronunciationSession(session, lesson) {
  if (session.pronunciation?.lessonId === lesson.id) return;
  session.pronunciation = { lessonId: lesson.id, index: 0, recording: false, message: "" };
  writeSession(session);
}

function readLibraryProgress() {
  try { return JSON.parse(localStorage.getItem(LIBRARY_PROGRESS_KEY) || "{}"); } catch { return {}; }
}

function getLibraryItemProgress(categoryId, itemId) {
  const saved = readLibraryProgress()[`${categoryId}:${itemId}`] || {};
  const modes = {
    "mini-lessons": Number(saved["mini-lessons"] || 0),
    flashcards: Number(saved.flashcards || 0),
    quiz: Number(saved.quiz || 0),
    conjugation: Number(saved.conjugation || 0),
  };
  const overall = Math.round(Object.values(modes).reduce((sum, value) => sum + value, 0) / Object.keys(modes).length);
  return { modes, overall };
}

function saveLibraryModeProgress(categoryId, itemId, mode, value) {
  if (!categoryId || !itemId) return;
  const normalizedMode = mode === "mini-lesson" ? "mini-lessons" : mode;
  if (!["mini-lessons", "flashcards", "quiz", "conjugation"].includes(normalizedMode)) return;
  const progress = readLibraryProgress();
  const key = `${categoryId}:${itemId}`;
  progress[key] = { ...(progress[key] || {}), [normalizedMode]: Math.max(Number(progress[key]?.[normalizedMode] || 0), Math.min(100, value)) };
  localStorage.setItem(LIBRARY_PROGRESS_KEY, JSON.stringify(progress));
}

function readSession() {
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}"); } catch {}
  let suppliedTopic = "";
  try { suppliedTopic = localStorage.getItem(TOPIC_KEY) || ""; } catch {}
  const topic = TOPICS[suppliedTopic] ? suppliedTopic : (TOPICS[saved.topic] ? saved.topic : "greetings");
  return { ...saved, mode: MODES.includes(saved.mode) ? saved.mode : "quiz", topic, view: ["launcher", "activity", "results", "library", "library-category", "library-collection", "library-item", "library-study"].includes(saved.view) ? saved.view : "launcher" };
}

function writeSession(session) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
function rerender() { window.dispatchEvent(new CustomEvent("habla:practice-render")); }

function stopRecordingResources() {
  if (recordingStream) recordingStream.getTracks().forEach(track => track.stop());
  recordingStream = null;
  recorder = null;
}

window.hablaPractice = {
  selectMode(mode) { const session = readSession(); session.mode = MODES.includes(mode) ? mode : "quiz"; session.view = "launcher"; clearLibraryContext(session); writeSession(session); rerender(); },
  selectTopic(topic) { const session = readSession(); session.topic = TOPICS[topic] ? topic : "greetings"; localStorage.setItem(TOPIC_KEY, session.topic); session.view = "launcher"; clearLibraryContext(session); writeSession(session); rerender(); },
  start() { const session = readSession(); delete session.returnView; if (session.mode === "conversation") { window.dispatchEvent(new CustomEvent("habla:practice-conversation", { detail: { topic: session.topic, title: TOPICS[session.topic].title } })); return; } session.view = "activity"; writeSession(session); rerender(); },
  back() { stopRecordingResources(); const session = readSession(); session.view = session.returnView || "launcher"; delete session.returnView; if (session.pronunciation) session.pronunciation.recording = false; writeSession(session); rerender(); },
  openLibrary() { const session = readSession(); session.view = "library"; delete session.libraryCategoryId; delete session.libraryCollectionId; delete session.libraryItemId; delete session.returnView; writeSession(session); rerender(); },
  openLibraryCategory(categoryId) { if (!findPracticeLibraryCategory(categoryId)) return; const session = readSession(); session.view = "library-category"; session.libraryCategoryId = categoryId; delete session.libraryCollectionId; delete session.libraryItemId; writeSession(session); rerender(); },
  openLibraryCollection(categoryId, collectionId) { if (!findPracticeLibraryCollection(categoryId, collectionId)) return; const session = readSession(); session.view = "library-collection"; session.libraryCategoryId = categoryId; session.libraryCollectionId = collectionId; delete session.libraryItemId; writeSession(session); rerender(); },
  openLibraryItem(categoryId, itemId, collectionId = "") { if (!findPracticeLibraryItem(categoryId, itemId, collectionId)) return; const session = readSession(); session.view = "library-item"; session.libraryCategoryId = categoryId; if (collectionId) session.libraryCollectionId = collectionId; else delete session.libraryCollectionId; session.libraryItemId = itemId; writeSession(session); rerender(); },
  libraryBack(target) { const session = readSession(); if (target === "library-item" && session.libraryItemId) { session.view = "library-item"; delete session.libraryStudyMode; } else if (target === "library-collection" && session.libraryCollectionId) { session.view = "library-collection"; delete session.libraryItemId; } else if (target === "library-category" && session.libraryCategoryId) { session.view = "library-category"; delete session.libraryCollectionId; delete session.libraryItemId; } else if (target === "library") { session.view = "library"; delete session.libraryCollectionId; delete session.libraryItemId; } else { session.view = "launcher"; clearLibraryContext(session); } writeSession(session); rerender(); },
  launchLibraryItem(categoryId, itemId, mode) {
    const currentSession = readSession();
    const result = findPracticeLibraryItem(categoryId, itemId, currentSession.libraryCollectionId);
    if (!result) return;
    const libraryLesson = buildLibraryLesson(result);
    const isCourseTopic = Boolean(result.item.practiceTopic && getLessonForTopic(result.item.practiceTopic));
    if (!libraryLesson && !isCourseTopic) return;
    const session = readSession();
    if (result.item.practiceTopic) session.topic = result.item.practiceTopic;
    session.libraryCategoryId = categoryId;
    session.libraryItemId = itemId;
    session.returnView = "library-item";
    saveLibraryModeProgress(categoryId, itemId, mode, 1);
    if (!MODES.includes(mode)) { session.view = "library-study"; session.libraryStudyMode = mode; writeSession(session); rerender(); return; }
    session.mode = mode;
    if (result.item.practiceTopic) localStorage.setItem(TOPIC_KEY, session.topic);
    if (mode === "conversation") {
      writeSession(session);
      window.dispatchEvent(new CustomEvent("habla:practice-conversation", { detail: { topic: session.topic, title: result.item.title } }));
      return;
    }
    session.view = "activity";
    writeSession(session);
    rerender();
  },
  completeLibraryStudy(nextMode) {
    const session = readSession();
    saveLibraryModeProgress(session.libraryCategoryId, session.libraryItemId, session.libraryStudyMode, 100);
    window.hablaPractice.launchLibraryItem(session.libraryCategoryId, session.libraryItemId, nextMode);
  },
  answer(index) { const session = readSession(); const question = session.quiz?.questions?.[session.quiz.index]; if (!question || session.quiz.selected) return; const answer = question.options[index]; session.quiz.selected = answer; if (answer === question.answer) session.quiz.score += 1; writeSession(session); rerender(); },
  nextQuiz() { const session = readSession(); if (!session.quiz?.selected) return; if (session.quiz.index + 1 >= session.quiz.questions.length) { session.view = "results"; saveLibraryModeProgress(session.libraryCategoryId, session.libraryItemId, "quiz", 100); } else { session.quiz.index += 1; session.quiz.selected = ""; } writeSession(session); rerender(); },
  restartQuiz() { const session = readSession(); const result = findPracticeLibraryItem(session.libraryCategoryId, session.libraryItemId, session.libraryCollectionId); const lesson = result ? buildLibraryLesson(result) : getLessonForTopic(session.topic); if (!lesson) return; ensureQuizSession(session, lesson, true); session.view = "activity"; writeSession(session); rerender(); },
  flip() { const session = readSession(); session.flash.flipped = !session.flash.flipped; writeSession(session); rerender(); },
  prevCard() { const session = readSession(); const total = session.flash.order.length; session.flash.index = (session.flash.index - 1 + total) % total; session.flash.flipped = false; writeSession(session); rerender(); },
  nextCard() { const session = readSession(); const completedRound = session.flash.index + 1 >= session.flash.order.length; session.flash.index = (session.flash.index + 1) % session.flash.order.length; session.flash.flipped = false; if (completedRound) saveLibraryModeProgress(session.libraryCategoryId, session.libraryItemId, "flashcards", 100); writeSession(session); rerender(); },
  shuffleCards() { const session = readSession(); session.flash.order = shuffle(session.flash.order); session.flash.index = 0; session.flash.flipped = false; writeSession(session); rerender(); },
  speak(text) { speakSpanish(text); },
  speakForm(button) {
    button?.closest(".library-conjugation-grid")?.querySelectorAll("button.active").forEach(tile => tile.classList.remove("active"));
    button?.classList.add("active");
    speakSpanish(button?.dataset.phrase || "");
  },
  speakCard(button) {
    const card = button?.closest(".practice-flashcard");
    if (card) {
      card.classList.remove("is-speaking");
      void card.offsetWidth;
      card.classList.add("is-speaking");
      window.setTimeout(() => card.classList.remove("is-speaking"), 760);
    }
    speakSpanish(button?.dataset.phrase || "");
  },
  speakExample(button) {
    const card = button?.closest(".practice-flashcard");
    if (card) {
      card.classList.remove("is-speaking-example");
      void card.offsetWidth;
      card.classList.add("is-speaking-example");
      window.setTimeout(() => card.classList.remove("is-speaking-example"), 760);
    }
    speakSpanish(button?.dataset.phrase || "");
  },
  async toggleRecording() {
    const session = readSession();
    if (recorder?.state === "recording") { recorder.stop(); return; }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") { session.pronunciation.message = "Recording isn’t supported here. You can still listen, retry, and continue."; writeSession(session); rerender(); return; }
    try {
      recordingStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingChunks = [];
      recorder = new MediaRecorder(recordingStream);
      recorder.ondataavailable = event => { if (event.data.size) recordingChunks.push(event.data); };
      recorder.onstop = () => { if (playbackUrl) URL.revokeObjectURL(playbackUrl); playbackUrl = URL.createObjectURL(new Blob(recordingChunks, { type: recorder.mimeType || "audio/webm" })); const next = readSession(); next.pronunciation.recording = false; next.pronunciation.message = "Attempt recorded. Play it back or try again."; writeSession(next); stopRecordingResources(); rerender(); };
      recorder.start(); session.pronunciation.recording = true; session.pronunciation.message = "Recording… tap again when you’re finished."; writeSession(session); rerender();
    } catch { session.pronunciation.recording = false; session.pronunciation.message = "Microphone access wasn’t available. You can still listen and continue."; writeSession(session); stopRecordingResources(); rerender(); }
  },
  nextPronunciation() { const session = readSession(); const result = findPracticeLibraryItem(session.libraryCategoryId, session.libraryItemId, session.libraryCollectionId); const lesson = result ? buildLibraryLesson(result) : getLessonForTopic(session.topic); const total = getPronunciation(lesson).length; if (session.pronunciation.index + 1 >= total) { session.view = session.returnView || "launcher"; delete session.returnView; session.pronunciation.index = 0; } else session.pronunciation.index += 1; session.pronunciation.message = ""; writeSession(session); rerender(); },
};

function clearLibraryContext(session) {
  delete session.libraryCategoryId;
  delete session.libraryCollectionId;
  delete session.libraryItemId;
  delete session.returnView;
}

function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}

function speakSpanish(text) { if (!text || !window.speechSynthesis) return; speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "es-ES"; utterance.rate = .85; speechSynthesis.speak(utterance); }
function iconSvg(name, className = "") {
  const icons = {
    quiz: `<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.2 2.2 4.8-5"/>`,
    flashcards: `<rect x="7" y="4" width="11" height="16" rx="2"/><path d="M7 7H5.8A1.8 1.8 0 0 0 4 8.8v8.4A1.8 1.8 0 0 0 5.8 19H7"/>`,
    pronunciation: `<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M6.5 11.5a5.5 5.5 0 0 0 11 0M12 17v4M9 21h6"/>`,
    conversation: `<path d="M5.5 5.5h13A2.5 2.5 0 0 1 21 8v7a2.5 2.5 0 0 1-2.5 2.5H10L5 21v-3.6A2.5 2.5 0 0 1 3 15V8a2.5 2.5 0 0 1 2.5-2.5Z"/><circle cx="8" cy="11.5" r=".7" fill="currentColor" stroke="none"/><circle cx="12" cy="11.5" r=".7" fill="currentColor" stroke="none"/><circle cx="16" cy="11.5" r=".7" fill="currentColor" stroke="none"/>`,
    "mini-lessons": `<path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H20v17H8.5A3.5 3.5 0 0 0 5 22V5.5Z"/><path d="M9 7h7M9 11h5"/>`,
    "mini-lesson": `<path d="M5 5.5A3.5 3.5 0 0 1 8.5 2H20v17H8.5A3.5 3.5 0 0 0 5 22V5.5Z"/><path d="M9 7h7M9 11h5"/>`,
    conjugation: `<path d="M5 6h14M5 12h14M5 18h14M9 3v18"/>`,
    examples: `<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h6M8 16h4"/>`,
    "common-mistakes": `<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17h.01"/>`,
    target: `<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><path d="m15.5 8.5 5-5M17.5 3.5h3v3"/>`,
    greetings: `<path d="M5 5.5h14A2.5 2.5 0 0 1 21.5 8v7A2.5 2.5 0 0 1 19 17.5h-8L5.5 21v-3.6A2.5 2.5 0 0 1 3 15V7.5A2 2 0 0 1 5 5.5Z"/><path d="M7.5 11.5h9"/>`,
    family: `<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3.5 20c.5-4.2 2.4-6.3 5.5-6.3s5 2.1 5.5 6.3M13 14.5c1-.9 2.1-1.3 3.5-1.3 2.6 0 4.2 1.9 4.6 5.6"/>`,
    restaurants: `<path d="M6 3v8M9 3v8M4 3v5c0 2 1.1 3 3 3s3-1 3-3V3M7 11v10M16 3c-2 2.1-3 5-3 8h4v10"/>`,
    travel: `<path d="m3 13 18-9-7.5 16-2.8-6.2L3 13Z"/><path d="m10.7 13.8 10-9.3"/>`,
    shopping: `<path d="M5 8h14l1.5 13h-17L5 8Z"/><path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9"/>`,
    work: `<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M8 7V4h8v3M3 12.5h18M10 12.5v2h4v-2"/>`,
    phrases: `<path d="M4.5 5h10A2.5 2.5 0 0 1 17 7.5v5a2.5 2.5 0 0 1-2.5 2.5H9l-4.5 3v-3.1A2.5 2.5 0 0 1 2 12.5v-5A2.5 2.5 0 0 1 4.5 5Z"/><path d="M17 9.5h2A2.5 2.5 0 0 1 21.5 12v3a2.5 2.5 0 0 1-2.5 2.5h-.5V20L15 17.5"/>`,
    numbers: `<path d="M5 8.5c.4-1.8 1.5-2.7 3.1-2.7 1.7 0 2.9 1 2.9 2.5 0 2.7-3.4 3.2-5.8 6.9H11M14 7c.7-.8 1.5-1.2 2.6-1.2 1.7 0 2.8.9 2.8 2.3 0 1.1-.6 1.9-1.7 2.2 1.4.3 2.1 1.1 2.1 2.4 0 1.7-1.3 2.8-3.2 2.8-1.3 0-2.4-.5-3.1-1.4"/>`,
    topics: `<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>`,
    verbs: `<path d="M5 5h14M5 12h9M5 19h11"/><path d="m16 9 3 3-3 3"/>`,
    grammar: `<path d="M5 20V7a3 3 0 0 1 3-3h11v16H8a3 3 0 0 0-3 3"/><path d="M9 8h6M9 12h7"/>`,
    expressions: `<path d="M5 5.5h14A2.5 2.5 0 0 1 21.5 8v7A2.5 2.5 0 0 1 19 17.5h-8L5.5 21v-3.6A2.5 2.5 0 0 1 3 15V7.5A2 2 0 0 1 5 5.5Z"/><path d="M8 11.5h8M8 14.5h5"/>`,
    "smart-review": `<path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m18.5 14 .8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z"/><path d="m5 13 .6 1.7 1.7.6-1.7.6L5 17.6l-.6-1.7-1.7-.6 1.7-.6L5 13Z"/>`,
    time: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
    weather: `<path d="M7 17h10a4 4 0 1 0-.8-7.9A6 6 0 0 0 5 12a3 3 0 0 0 2 5Z"/><path d="M8 4V2M3.8 6.2 2.4 4.8M12.2 6.2l1.4-1.4"/>`,
    directions: `<path d="M4 20 9 5l6 14 5-15-7 4-4-3-5 15Z"/>`,
    health: `<path d="M12 20S4 15.5 4 9.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 3.5C20 15.5 12 20 12 20Z"/><path d="M8 12h2l1-3 2 6 1-3h2"/>`,
    hobbies: `<path d="M6 6h12l2 14H4L6 6Z"/><path d="M9 6a3 3 0 0 1 6 0"/>`,
    school: `<path d="m3 9 9-5 9 5-9 5-9-5Z"/><path d="M6 11.5V17c3 2 9 2 12 0v-5.5M21 9v6"/>`,
    "phone-calls": `<path d="M8 3h3l1.5 4-2 1.5a14 14 0 0 0 5 5l1.5-2 4 1.5v3c0 2-1.5 3-3.5 3C10 18.5 5.5 14 5 6.5 5 4.5 6 3 8 3Z"/>`,
    airport: `<path d="m3 14 18-9-7 16-3-6-8-1Z"/><path d="m11 15 10-10"/>`,
    hotel: `<path d="M4 20V5h16v15M8 9h2M14 9h2M8 13h2M14 13h2M10 20v-3h4v3"/>`,
    emergency: `<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17h.01"/>`,
    activity: `<path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.5"/><path d="M4 4v4.5h4.5M12 7.5V12l3 2"/>`,
    "arrow-right": `<path d="m9 5 7 7-7 7"/>`,
    "arrow-left": `<path d="m15 5-7 7 7 7"/>`,
    star: `<path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9L12 3Z"/>`,
    volume: `<path d="M4 10h4l5-4v12l-5-4H4v-4Z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11"/>`,
    shuffle: `<path d="M4 7h3c4.5 0 5.5 10 10 10h3M17 14l3 3-3 3M4 17h3c1.8 0 3-1.6 4.2-3.5M15 7.5c.7-.3 1.3-.5 2-.5h3M17 4l3 3-3 3"/>`,
    replay: `<path d="M5.2 8A8 8 0 1 1 4 14"/><path d="M5 3v5h5"/>`,
    lock: `<rect x="5" y="10" width="14" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v3"/>`,
  };
  const body = icons[name] || icons.quiz;
  return `<svg class="practice-svg-icon${className ? ` ${className}` : ""}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
function normalize(value) { return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¿?¡!.,]/g, "").trim(); }
function shortLessonTitle(title) { return String(title || "Lesson").replace(/^.*?:\s*/, ""); }
function modeTitle(mode) { return mode === "flashcards" ? "Flashcards" : mode === "pronunciation" ? "Pronunciation" : "Quiz"; }
function escapeAttr(value) { return escapeHtml(value).replace(/`/g, "&#96;"); }
function escapeHtml(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
