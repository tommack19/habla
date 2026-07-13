import {
  getCourseProgress,
  getCurrentLesson,
  getActiveLesson,
  getLessonById,
  getLessonProgress,
  getUnlockedLessons,
  setActiveLesson,
} from "../core/content.js";
import { getCurrentStreak } from "../core/progress.js";

const LEARN_STEPS = [
  "Vocabulary",
  "Grammar",
  "Dialogue",
  "Listening",
  "Pronunciation",
  "Speaking",
  "Culture",
];

if (typeof window !== "undefined") {
  window.hablaLearn = {
    selectLesson(id) {
      const card = [...document.querySelectorAll(".learn-path-card")]
        .find(pathCard => pathCard.dataset.lessonId === id);
      if (card?.classList.contains("locked")) return;

      const lesson = getLessonById(id);
      const target = document.getElementById("learn-lesson-detail");
      if (!lesson || !target) return;
      setActiveLesson(id);

      document.querySelectorAll(".learn-path-card").forEach(card => {
        card.classList.toggle("selected", card.dataset.lessonId === id);
      });

      target.innerHTML = renderTodayLessonCard(lesson);

      const grammarTarget = document.getElementById("learn-grammar-detail");
      const cultureTarget = document.getElementById("learn-culture-detail");
      if (grammarTarget) grammarTarget.innerHTML = renderGrammarPanel(lesson);
      if (cultureTarget) cultureTarget.innerHTML = renderCulturePanel(lesson);
    },
  };
}

export function renderLearn(state = {}) {
  const courseProgress = getCourseProgress();
  const lessons = courseProgress.loadedLessons || [];
  const currentLesson = getCurrentLesson();
  const selectedLesson = getActiveLesson() || currentLesson || lessons[0];
  const unlockedIds = new Set(getUnlockedLessons().map(lesson => lesson.id));
  const streak = getCurrentStreak();
  const stats = getLearnStats(state, courseProgress, streak);

  return `
    <section class="learn-screen" aria-label="Learn">
      <input class="learn-tab-input" type="radio" name="learn-view" id="learn-tab-lessons" checked>
      <input class="learn-tab-input" type="radio" name="learn-view" id="learn-tab-grammar">
      <input class="learn-tab-input" type="radio" name="learn-view" id="learn-tab-culture">

      ${renderLearnHeader(stats.level)}

      <nav class="learn-top-tabs" aria-label="Learn sections">
        <label class="learn-top-tab lessons" for="learn-tab-lessons">
          <span class="learn-tab-icon learn-tab-icon-book" aria-hidden="true"></span>
          Lessons
        </label>
        <label class="learn-top-tab grammar" for="learn-tab-grammar">
          <span class="learn-tab-icon learn-tab-icon-grammar" aria-hidden="true"></span>
          Grammar
        </label>
        <label class="learn-top-tab culture" for="learn-tab-culture">
          <span class="learn-tab-icon learn-tab-icon-culture" aria-hidden="true"></span>
          Culture
        </label>
      </nav>

      <section class="learn-current-shell" id="learn-lesson-detail" aria-label="Current lesson">
        ${renderTodayLessonCard(selectedLesson)}
      </section>

      <section class="learn-course-shell">
        <div class="learn-tab-panels">
          <div class="learn-lessons-panel">
            <section class="learn-path-panel">
              <div class="learn-section-title"><h2>All Lessons</h2></div>
              <div class="learn-path-list" aria-label="A1 lesson list">
                ${lessons.map((lesson, index) => renderLessonListCard(lesson, index, selectedLesson, currentLesson, unlockedIds)).join("")}
              </div>
              <button class="learn-view-all" type="button">
                <span><i class="learn-view-icon" aria-hidden="true"></i>View All Lessons</span>
                <span class="learn-arrow" aria-hidden="true"></span>
              </button>
            </section>

            ${renderLearnSideRail(stats)}
          </div>

          <section class="learn-support-panel learn-grammar-panel" id="learn-grammar-detail" aria-label="Grammar">
            ${renderGrammarPanel(selectedLesson)}
          </section>

          <section class="learn-support-panel learn-culture-panel" id="learn-culture-detail" aria-label="Culture">
            ${renderCulturePanel(selectedLesson)}
          </section>
        </div>
      </section>
    </section>
  `;
}

function renderLearnHeader(level) {
  return `
    <header class="learn-hero">
      <div class="learn-title-row">
        <div class="learn-hero-copy">
          <h1>Learn</h1>
          <p>Build your Spanish skills step by step.</p>
        </div>
        <button class="learn-level-badge" type="button">${escapeHtml(level)} <span aria-hidden="true">&rsaquo;</span></button>
      </div>
    </header>
  `;
}

function renderLessonListCard(lesson, index, selectedLesson, currentLesson, unlockedIds) {
  const progress = getLessonProgress(lesson.id);
  const completed = Boolean(progress.completed);
  const selected = selectedLesson?.id === lesson.id;
  const locked = !unlockedIds.has(lesson.id) && !completed;
  const current = currentLesson?.id === lesson.id && !completed;
  const percent = completed ? 100 : index === 0 ? 40 : index === 1 ? 20 : 0;
  const copy = getLessonSubtitle(index);

  return `
    <button
      class="learn-path-card ${selected ? "selected" : ""} ${completed ? "completed" : ""} ${current ? "current" : ""} ${locked ? "locked" : ""}"
      type="button"
      data-lesson-id="${escapeAttr(lesson.id)}"
      onclick="hablaLearn.selectLesson('${escapeAttr(lesson.id)}')"
      ${locked ? "aria-disabled=\"true\"" : ""}
    >
      <span class="learn-lesson-number">${index + 1}</span>
      <span class="learn-lesson-copy">
        <strong>${escapeHtml(shortLessonTitle(lesson.title))}</strong>
        <em>${escapeHtml(copy)}</em>
      </span>
      <span class="learn-lesson-reward">${percent}%<i><b style="width:${percent}%"></b></i></span>
      ${renderLessonStateIcon({ completed, current, locked, percent })}
    </button>
  `;
}

function renderLessonStateIcon({ completed, current, locked, percent }) {
  if (completed) {
    return `<span class="learn-state-icon complete" aria-label="Completed"></span>`;
  }

  if (current) {
    return `<span class="learn-state-icon progress" style="--lesson-progress:${percent}" aria-label="${percent}% complete"><i>${percent}%</i></span>`;
  }

  if (locked) {
    return `<span class="learn-state-icon locked" aria-label="Locked"></span>`;
  }

  return `<span class="learn-state-icon ready" aria-label="Ready"></span>`;
}

function renderTodayLessonCard(lesson) {
  if (!lesson) {
    return `
      <article class="learn-today-card">
        <span class="learn-current-badge">Current Lesson</span>
        <h2>Loading lesson...</h2>
        <p>Your next Habla lesson is being prepared.</p>
      </article>
    `;
  }

  const progress = getLessonProgress(lesson.id);
  const completed = Boolean(progress.completed);
  const percent = completed ? 100 : 40;
  const lessonNumber = getLessonNumber(lesson);
  const title = shortLessonTitle(lesson.title);
  const objective = lesson.objective || lesson.objectives?.[0] || "Learn real Spanish for everyday conversations.";
  const wordCount = lesson.vocabulary?.length || 25;
  const phraseCount = countLessonItems(lesson.dialogue || lesson.dialogues) || 15;
  const minutes = lesson.estimatedMinutes || 10;

  return `
    <article class="learn-today-card">
      <div class="learn-current-copy">
        <span class="learn-current-badge">Current Lesson</span>
        <em>Lesson ${lessonNumber}</em>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(objective)}</p>
        <div class="learn-lesson-meta">
          <span><i class="meta-book"></i>${wordCount} Words</span>
          <span><i class="meta-card"></i>${phraseCount} Phrases</span>
          <span><i class="meta-clock"></i>${minutes} Min</span>
        </div>
        <button class="learn-continue h-btn h-btn--primary" type="button" data-page="practice" data-lesson-id="${escapeAttr(lesson.id)}">
          Continue Lesson
          <span class="learn-arrow" aria-hidden="true"></span>
        </button>
      </div>
      <div class="learn-current-art" aria-hidden="true">
        <span class="learn-girl"></span>
        <img src="assets/images/carlos-home.png" alt="">
        <em class="learn-bubble-green">&iexcl;Hola!<small>Hello!</small></em>
        <em class="learn-bubble-gold">Mucho gusto.<small>Nice to meet you.</small></em>
        <div class="learn-current-progress">
          <span>Your Progress</span>
          <i><b style="width:${percent}%"></b></i>
          <strong>${percent}%</strong>
        </div>
      </div>
    </article>
  `;
}

function renderLearnSideRail(stats) {
  return `
    <aside class="learn-side-rail">
      <section class="learn-stats-card">
        <h2>Your Stats</h2>
        ${sideStat("fire", stats.streak, "Day Streak")}
        ${sideStat("star", formatNumber(stats.xp), "Total XP")}
        ${sideStat("target", stats.completedLessons, "Lessons Completed")}
        ${sideStat("time", formatMinutes(stats.studyMinutes), "Study Time")}
      </section>
      <section class="learn-milestone-card">
        <h2>Next Milestone</h2>
        <strong>10</strong>
        <p>Complete 10 lessons to unlock Level 2!</p>
        <i><b style="width:40%"></b></i>
        <span>4 / 10</span>
      </section>
      <section class="learn-tip-card">
        <h2>Carlos&rsquo; Tip</h2>
        <div>
          <img src="assets/images/carlos-home.png" alt="">
          <p>Consistency is the key! A little every day goes a long way.</p>
        </div>
        <span class="learn-tip-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      </section>
    </aside>
  `;
}

function sideStat(icon, value, label) {
  return `
    <div class="learn-side-stat">
      <span class="${icon}" aria-hidden="true"></span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(label)}</small>
    </div>
  `;
}

function getLearnStats(state, courseProgress, streak) {
  const progress = readJSON("habla_progress_v1") || {};
  const activity = readJSON("habla_activity_stats_v1") || {};
  return {
    level: state.user?.level || "A1 Beginner",
    streak,
    xp: Number(progress.xp ?? state.user?.xp ?? 0),
    completedLessons: Number(courseProgress.completedCount || 0),
    studyMinutes: Number(activity.speakingMinutes || 0)
  };
}

function getLessonSubtitle(index) {
  const subtitles = [
    "Say hello, goodbye and introduce yourself.",
    "Everyday phrases for daily conversations.",
    "Count, tell time and use dates.",
    "Talk about your family and friends.",
    "Order food and talk about what you like.",
    "Routine, activities and daily tasks.",
    "Ask for and give directions with confidence.",
    "Buy what you need and ask questions.",
  ];
  return subtitles[index] || "Build your Spanish step by step.";
}

function getLessonNumber(lesson) {
  const match = String(lesson?.id || "").match(/lesson-(\d+)/);
  return match ? Number(match[1]) : 1;
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatMinutes(minutes) {
  const total = Number(minutes || 0);
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
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

function renderLearnFeatureTiles(lesson) {
  const tiles = [
    ["Vocabulary", `${lesson.vocabulary?.length || 0} words`],
    ["Grammar", lesson.grammar?.topic || "Core pattern"],
    ["Dialogue", `${countLessonItems(lesson.dialogue || lesson.dialogues)} scenes`],
    ["Listening", `${countLessonItems(lesson.listeningPhrases || lesson.listening)} phrases`],
    ["Pronunciation", `${countLessonItems(lesson.pronunciationExercises || lesson.pronunciation?.exercises || lesson.pronunciation)} drills`],
    ["Speaking", `${countLessonItems(lesson.speakingChallenges || lesson.speakingChallenge)} prompts`],
    ["Culture", lesson.culture?.title || "Real-world Spanish"],
  ];

  return tiles.map(([title, detail]) => `
    <div class="learn-feature-tile">
      <span>${escapeHtml(title)}</span>
      <strong>${escapeHtml(detail)}</strong>
    </div>
  `).join("");
}

function renderLearnChecklist(lesson) {
  const items = [
    lesson.vocabulary?.length ? `${lesson.module || "Lesson"} vocabulary` : "Vocabulary",
    lesson.grammar?.topic || "Core grammar pattern",
    "Talking about real situations",
    "Listening and pronunciation practice",
  ];

  return items.map((item, index) => `
    <li>
      <span class="learn-mini-check ${index === 0 ? "complete" : ""}" aria-hidden="true"></span>
      ${escapeHtml(item)}
    </li>
  `).join("");
}

function renderLessonStep(step, index, completed, lesson) {
  const stepNumber = index + 1;
  const isDone = completed;
  const isCurrent = !completed && index === 0;
  const isLocked = !completed && index > 0;
  const detail = getLessonStepDetail(step, lesson);

  return `
    <div class="learn-step ${isDone ? "done" : ""} ${isCurrent ? "active" : ""} ${isLocked ? "locked" : ""}">
      <span class="learn-step-marker">${isDone ? "" : stepNumber}</span>
      <div>
        <strong>${escapeHtml(step)}</strong>
        <small>${escapeHtml(detail.label)}</small>
      </div>
      <span class="learn-step-time">${escapeHtml(detail.time)}</span>
      ${isDone ? `<button type="button" data-page="learn">Review</button>` : ""}
      ${isCurrent ? `<span class="learn-step-arrow" aria-hidden="true"></span>` : ""}
      ${isLocked ? `<span class="learn-step-lock" aria-hidden="true"></span>` : ""}
    </div>
  `;
}

function getLessonMissionText(lesson) {
  return lesson.realLifeMission?.mission
    || lesson.realLifeMission?.description
    || lesson.objective
    || lesson.objectives?.[0]
    || "Complete today's lesson with Carlos.";
}

function getLessonStepDetail(step, lesson) {
  const details = {
    Vocabulary: {
      label: `${lesson.vocabulary?.length || 0} words`,
      time: "4 min",
    },
    Grammar: {
      label: lesson.grammar?.topic || "Core pattern",
      time: "6 min",
    },
    Dialogue: {
      label: `${countLessonItems(lesson.dialogue || lesson.dialogues)} conversations`,
      time: "5 min",
    },
    Listening: {
      label: `${countLessonItems(lesson.listeningPhrases || lesson.listening)} phrases`,
      time: "4 min",
    },
    Pronunciation: {
      label: `${countLessonItems(lesson.pronunciationExercises || lesson.pronunciation?.exercises || lesson.pronunciation)} drills`,
      time: "4 min",
    },
    Speaking: {
      label: "Carlos mission",
      time: "6 min",
    },
    Culture: {
      label: lesson.culture?.title || "Real-world note",
      time: "3 min",
    },
  };

  return details[step] || { label: "Lesson step", time: "4 min" };
}

function countLessonItems(value) {
  if (Array.isArray(value)) return value.length;
  if (value && Array.isArray(value.items)) return value.items.length;
  if (value && Array.isArray(value.exercises)) return value.exercises.length;
  if (value && Array.isArray(value.phrases)) return value.phrases.length;
  if (value && Array.isArray(value.challenges)) return value.challenges.length;
  return value ? 1 : 0;
}

function renderGrammarPanel(lesson) {
  const grammar = lesson?.grammar;
  const examples = grammar?.examples || [];

  if (!lesson || (!grammar?.topic && !grammar?.explanation && examples.length === 0)) {
    return renderLearnEmptyState(
      "Grammar",
      "No grammar notes yet",
      "This lesson does not have a grammar section yet. Continue with the lesson, or choose another lesson from the Lessons tab."
    );
  }

  return `
    <div class="learn-panel-heading">
      <span>Grammar</span>
      <p>Study the pattern from today's lesson, then continue into practice when you're ready.</p>
    </div>
    <div class="learn-support-card">
      <span class="learn-current-badge">Today's Pattern</span>
      <h2>${escapeHtml(grammar?.topic || "Spanish sentence patterns")}</h2>
      <p>${escapeHtml(grammar?.explanation || "Grammar notes will appear when a lesson is selected.")}</p>
      <div class="learn-example-list">
        ${examples.map(example => `
          <div>
            <strong>${escapeHtml(example.spanish)}</strong>
            <span>${escapeHtml(example.english)}</span>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderCulturePanel(lesson) {
  const culture = lesson?.culture;
  const nativeNotes = lesson?.nativeSpeech?.notes || [];

  if (!lesson || (!culture?.title && !culture?.text && nativeNotes.length === 0)) {
    return renderLearnEmptyState(
      "Culture",
      "No culture notes yet",
      "This lesson does not have culture notes yet. Carlos will add more real-world context as the course grows."
    );
  }

  return `
    <div class="learn-panel-heading">
      <span>Culture</span>
      <p>Build confidence by learning how the Spanish is used in real life.</p>
    </div>
    <div class="learn-support-card">
      <span class="learn-current-badge">Real World Spanish</span>
      <h2>${escapeHtml(culture?.title || "Culture Note")}</h2>
      <p>${escapeHtml(culture?.text || "Culture notes will appear when a lesson is selected.")}</p>
      <div class="learn-example-list">
        ${nativeNotes.map(note => `<div><strong>${escapeHtml(note)}</strong></div>`).join("")}
      </div>
    </div>
  `;
}

function renderVocabularyPanel(lesson) {
  const words = lesson?.vocabulary?.slice(0, 24) || [];

  if (!lesson || words.length === 0) {
    return renderLearnEmptyState(
      "Vocabulary",
      "No vocabulary cards yet",
      "This lesson does not have vocabulary cards yet. Choose another lesson or continue with the current lesson."
    );
  }

  return `
    <div class="learn-panel-heading">
      <span>Vocabulary</span>
      <p>Preview the words and phrases for the selected lesson before you move into practice.</p>
    </div>
    <div class="learn-support-card">
      <span class="learn-current-badge">${escapeHtml(lesson?.module || "Lesson Words")}</span>
      <h2>${words.length || 0} words and phrases</h2>
      <p>${escapeHtml(lesson?.objective || lesson?.objectives?.[0] || "Build the vocabulary for today's conversation.")}</p>
      <div class="learn-vocab-preview-grid">
        ${words.map(word => `
          <article class="learn-vocab-preview">
            <strong>${escapeHtml(word.spanish || word.term || word.text || "")}</strong>
            <span>${escapeHtml(word.english || word.meaning || word.translation || "")}</span>
            <small>${escapeHtml(word.category || word.partOfSpeech || word.partOfSpeechCategory || "Vocabulary")}</small>
          </article>
        `).join("")}
      </div>
    </div>
  `;
}

function renderLearnEmptyState(kicker, title, copy) {
  return `
    <div class="learn-panel-heading">
      <span>${escapeHtml(kicker)}</span>
      <p>Selected lesson content will appear here.</p>
    </div>
    <div class="learn-support-card learn-empty-state">
      <span class="learn-current-badge">${escapeHtml(kicker)}</span>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(copy)}</p>
    </div>
  `;
}

function shortLessonTitle(title) {
  return String(title || "Lesson").replace(/^.*?:\s*/, match => match.length > 18 ? "" : match);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}
