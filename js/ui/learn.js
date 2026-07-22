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
import { getAchievements } from "../core/achievements.js";
import { CARLOS_FALLBACK_ONERROR, getCarlosAsset } from "../data/carlosAssets.js";
import { renderLessonCover } from "../components/lessonCover.js";

const LEARN_STEPS = [
  "Vocabulary",
  "Grammar",
  "Dialogue",
  "Listening",
  "Pronunciation",
  "Speaking",
  "Culture",
];
const A1_LESSON_TOTAL = 30;

if (typeof window !== "undefined") {
  window.hablaLearn = {
    selectLesson(id) {
      const card = [...document.querySelectorAll(".learn-path-card")]
        .find(pathCard => pathCard.dataset.lessonId === id);

      const lesson = getLessonById(id);
      const target = document.getElementById("learn-lesson-detail");
      if (!lesson || !target) return;

      if (card?.classList.contains("locked")) {
        document.querySelectorAll(".learn-path-card").forEach(pathCard => {
          pathCard.classList.toggle("selected", pathCard.dataset.lessonId === id);
        });
        target.innerHTML = renderLockedLessonCard(lesson);
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      setActiveLesson(id);

      document.querySelectorAll(".learn-path-card").forEach(card => {
        card.classList.toggle("selected", card.dataset.lessonId === id);
      });

      target.innerHTML = renderTodayLessonCard(lesson);

    },
    toggleAllLessons(button) {
      const list = document.querySelector(".learn-path-list");
      if (!list) return;
      const expanded = list.classList.toggle("expanded");
      button?.setAttribute("aria-expanded", String(expanded));
      const label = button?.querySelector("[data-learn-view-label]");
      if (label) label.textContent = expanded ? "Show Less" : "View Full Curriculum";
    },
  };
}

export function renderLearn(state = {}) {
  const courseProgress = getCourseProgress();
  const lessons = courseProgress.loadedLessons || [];
  const currentLesson = getCurrentLesson();
  const activeLesson = getActiveLesson();
  const activeProgress = activeLesson ? getLessonProgress(activeLesson.id) : null;
  const selectedLesson = activeLesson && !activeProgress?.completed
    ? activeLesson
    : currentLesson || activeLesson || lessons[0];
  const unlockedIds = new Set(getUnlockedLessons().map(lesson => lesson.id));
  const streak = getCurrentStreak();
  const stats = getLearnStats(state, courseProgress, streak);
  const currentIndex = Math.max(lessons.findIndex(lesson => lesson.id === currentLesson?.id), 0);

  return `
    <section class="learn-screen" aria-label="Learn">
      <input class="learn-tab-input" type="radio" name="learn-view" id="learn-tab-lessons" checked>
      <input class="learn-tab-input" type="radio" name="learn-view" id="learn-tab-roadmap">

      ${renderLearnHeader()}

      <nav class="learn-top-tabs" aria-label="Learn sections">
        <label class="learn-top-tab lessons" for="learn-tab-lessons">
          <span class="learn-tab-icon" aria-hidden="true">${renderLearnIcon("book")}</span>
          Lessons
        </label>
        <button class="learn-top-tab grammar" type="button" data-page="practice" data-practice-library="true">
          <span class="learn-tab-icon" aria-hidden="true">${renderLearnIcon("grammar")}</span>
          Grammar
        </button>
        <label class="learn-top-tab roadmap" for="learn-tab-roadmap">
          <span class="learn-tab-icon" aria-hidden="true">${renderLearnIcon("roadmap")}</span>
          Journey
        </label>
      </nav>

      <section class="learn-current-shell" id="learn-lesson-detail" aria-label="Current lesson">
        ${renderTodayLessonCard(selectedLesson)}
      </section>

      <section class="learn-course-shell">
        <div class="learn-tab-panels">
          <div class="learn-lessons-panel">
            <section class="learn-path-panel">
              <div class="learn-section-title"><h2>Your Lesson Path</h2></div>
              <div class="learn-path-list" aria-label="A1 lesson list">
                ${lessons.map((lesson, index) => renderLessonListCard(lesson, index, selectedLesson, currentLesson, unlockedIds, currentIndex)).join("")}
              </div>
              <button class="learn-view-all" type="button" aria-expanded="false" onclick="hablaLearn.toggleAllLessons(this)">
                <span>${renderLearnIcon("roadmap")}<b data-learn-view-label>View Full Curriculum</b></span>
                <span class="learn-arrow" aria-hidden="true"></span>
              </button>
            </section>

            ${renderLearnSideRail(stats)}
          </div>

          <section class="learn-support-panel learn-roadmap-panel" aria-label="A1 Journey">
            ${renderRoadmapPanel(lessons, currentLesson, unlockedIds)}
          </section>
        </div>
      </section>
    </section>
  `;
}

function renderLearnHeader() {
  return `
    <header class="learn-hero">
      <div class="learn-title-row">
        <div class="learn-hero-copy">
          <h1>Learn</h1>
          <p>Build your Spanish skills step by step.</p>
        </div>
      </div>
    </header>
  `;
}

function renderLessonListCard(lesson, index, selectedLesson, currentLesson, unlockedIds, currentIndex) {
  const progress = getLessonProgress(lesson.id);
  const completed = Boolean(progress.completed);
  const selected = selectedLesson?.id === lesson.id;
  const locked = !unlockedIds.has(lesson.id) && !completed;
  const current = currentLesson?.id === lesson.id && !completed;
  const percent = getLessonCompletionPercent(progress);
  const copy = getLessonSubtitle(lesson, index);
  const visibleCompleted = completed && index >= Math.max(0, currentIndex - 3);
  const visibleUpcoming = !completed && index <= currentIndex + 2;
  const remaining = !(visibleCompleted || visibleUpcoming || selected || current);

  return `
    <button
      class="learn-path-card ${selected ? "selected" : ""} ${completed ? "completed" : ""} ${current ? "current" : ""} ${locked ? "locked" : ""} ${remaining ? "is-remaining" : ""}"
      type="button"
      data-lesson-id="${escapeAttr(lesson.id)}"
      onclick="hablaLearn.selectLesson('${escapeAttr(lesson.id)}')"
      aria-label="${escapeAttr(locked ? `${shortLessonTitle(lesson.title)} is locked. View unlock requirement.` : shortLessonTitle(lesson.title))}"
    >
      <span class="learn-lesson-number">${index + 1}</span>
      <span class="learn-path-category-icon" aria-hidden="true">${renderLearnIcon(getLessonIconName(lesson, index))}</span>
      <span class="learn-lesson-copy">
        <strong>${escapeHtml(shortLessonTitle(lesson.title))}</strong>
        <em>${escapeHtml(copy)}</em>
      </span>
      ${renderLessonStateIcon({ completed, current, locked, percent })}
    </button>
  `;
}

function renderLessonStateIcon({ completed, current, locked, percent }) {
  if (completed) {
    return `<span class="learn-state-icon complete" aria-label="Completed"></span>`;
  }

  if (current) {
    return `<span class="learn-state-icon progress" style="--lesson-progress:${percent}" aria-label="Current lesson, ${percent}% complete"><i>${percent}</i></span>`;
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
  const percent = getLessonCompletionPercent(progress);
  const lessonNumber = getLessonNumber(lesson);
  const title = shortLessonTitle(lesson.title);
  const objective = lesson.objective || lesson.objectives?.[0] || "Learn real Spanish for everyday conversations.";
  const wordCount = lesson.vocabulary?.length || 25;
  const phraseCount = countLessonItems(lesson.dialogue || lesson.dialogues) || 15;
  const minutes = lesson.estimatedMinutes || 10;
  return renderLessonCover({
    variant: "learn",
    lesson,
    artworkAlt: `Artwork for ${title}`,
    eyebrow: "Current Lesson",
    overline: `Lesson ${lessonNumber}`,
    title,
    description: objective,
    meta: [
      { text: `${wordCount} Words` },
      { text: `${phraseCount} Phrases` },
      { text: `${minutes} Min` },
    ],
    action: {
      label: "Continue Lesson",
      subLabel: `Lesson ${lessonNumber} of ${A1_LESSON_TOTAL}`,
      attributes: `data-page="lesson" data-lesson-id="${escapeAttr(lesson.id)}"`,
    },
    footerHtml: `<span>Lesson Progress</span><i><b style="width:${percent}%"></b></i><strong>${completed ? "Complete" : `${percent}%`}</strong>`,
  });
}

function renderLockedLessonCard(lesson) {
  const lessons = getCourseProgress().loadedLessons || [];
  const lessonIndex = lessons.findIndex(item => item.id === lesson.id);
  const prerequisite = lessons[Math.max(lessonIndex - 1, 0)];
  const current = getCurrentLesson() || prerequisite;
  const prerequisiteNumber = getLessonNumber(prerequisite);
  const prerequisiteTitle = shortLessonTitle(prerequisite?.title || "Current Lesson");

  return `
    <article class="learn-locked-preview">
      <span class="learn-locked-icon" aria-hidden="true">${renderLearnIcon("lock")}</span>
      <small>Chapter locked</small>
      <h2>${escapeHtml(shortLessonTitle(lesson.title))}</h2>
      <p>Complete <strong>Lesson ${prerequisiteNumber} &middot; ${escapeHtml(prerequisiteTitle)}</strong> before continuing.</p>
      <button class="learn-locked-return h-btn h-btn--primary" type="button" data-page="lesson" ${current?.id ? `data-lesson-id="${escapeAttr(current.id)}"` : ""}>
        Return to Current Lesson <span class="learn-arrow" aria-hidden="true"></span>
      </button>
    </article>
  `;
}

function renderLearnSideRail(stats) {
  const milestoneGoal = 10;
  const milestoneProgress = Math.min(stats.completedLessons, milestoneGoal);
  const milestonePercent = Math.round((milestoneProgress / milestoneGoal) * 100);
  const lessonsRemaining = Math.max(milestoneGoal - milestoneProgress, 0);
  const achievements = getAchievements();
  return `
    <aside class="learn-side-rail">
      <section class="learn-stats-card">
        <h2>Your Progress</h2>
        ${sideStat("fire", stats.streak, "Day Streak")}
        ${sideStat("star", formatNumber(stats.xp), "Total XP")}
        ${sideStat("target", stats.completedLessons, "Lessons Completed")}
        ${sideStat("book", formatNumber(stats.wordsLearned), "Words Learned")}
      </section>
      <section class="learn-coach-card">
        <img src="${getCarlosAsset("thinking")}" alt="Carlos, your Spanish coach" onerror="${CARLOS_FALLBACK_ONERROR}">
        <div><small>Carlos&rsquo; Coach Tip</small><strong>${escapeHtml(getCarlosCoachMessage(stats))}</strong><em>${lessonsRemaining ? `${lessonsRemaining} ${lessonsRemaining === 1 ? "lesson" : "lessons"} to Level 2` : "Level 2 milestone reached"}</em></div>
        <i aria-hidden="true"><b style="width:${milestonePercent}%"></b></i>
        <span>${milestoneProgress} / ${milestoneGoal}</span>
      </section>
      ${renderPassportPreview(achievements, stats)}
    </aside>
  `;
}

function renderPassportPreview(achievements, stats) {
  const unlocked = achievements
    .filter(achievement => achievement.unlocked)
    .sort((a, b) => new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0));
  const next = achievements
    .filter(achievement => !achievement.unlocked)
    .sort((a, b) => getLearnAchievementProgress(b, stats) - getLearnAchievementProgress(a, stats))[0];
  const recent = unlocked.slice(0, 3).reverse();
  const completion = achievements.length ? Math.round((unlocked.length / achievements.length) * 100) : 0;

  return `<section class="learn-passport-preview">
    <header>
      <div><small>Your Passport</small><h2>Journey Highlights</h2></div>
      <span>${unlocked.length} / ${achievements.length}</span>
    </header>
    <div class="learn-passport-timeline" aria-label="Recent passport stamps">
      ${recent.length ? recent.map(renderLearnStamp).join("") : `<article class="learn-stamp-empty"><span aria-hidden="true">${renderLearnIcon("passport")}</span><div><small>Your first stamp</small><strong>Complete an activity to begin</strong></div></article>`}
      ${renderNextLearnStamp(next, stats)}
    </div>
    <div class="learn-passport-momentum">
      <div><strong>${unlocked.length} ${unlocked.length === 1 ? "stamp" : "stamps"} collected</strong><small>${next ? `Next: ${escapeHtml(next.title)}` : "Passport collection complete"}</small></div>
      <span>${completion}%</span>
      <i aria-hidden="true"><b style="width:${completion}%"></b></i>
    </div>
    <button class="learn-passport-action" type="button" data-page="journey">View Passport <span aria-hidden="true">&rarr;</span></button>
  </section>`;
}

function renderLearnStamp(achievement) {
  return `<article class="learn-passport-stamp unlocked">
    <span aria-hidden="true">${renderLearnIcon(getAchievementIconName(achievement.id))}</span>
    <div><small>${escapeHtml(getLearnStampDestination(achievement))}</small><strong>${escapeHtml(achievement.title)}</strong><time>${formatLearnStampDate(achievement.unlockedAt)}</time></div>
    <i aria-label="Unlocked"></i>
  </article>`;
}

function renderNextLearnStamp(achievement, stats) {
  if (!achievement) return `<article class="learn-passport-stamp complete"><span aria-hidden="true">${renderLearnIcon("passport")}</span><div><small>Passport Complete</small><strong>Every stamp collected</strong></div><i aria-label="Complete"></i></article>`;
  return `<article class="learn-passport-stamp next">
    <span aria-hidden="true">${renderLearnIcon("lock")}</span>
    <div><small>Next Stamp</small><strong>${escapeHtml(achievement.title)}</strong><time>${Math.round(getLearnAchievementProgress(achievement, stats) * 100)}% complete</time></div>
    <i aria-label="Locked"></i>
  </article>`;
}

function sideStat(icon, value, label) {
  return `
    <div class="learn-side-stat">
      <span class="learn-side-icon ${icon}" aria-hidden="true">${renderLearnIcon(icon)}</span>
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
    studyMinutes: Number(activity.studyMinutes || activity.learningMinutes || activity.speakingMinutes || 0),
    wordsLearned: Number(activity.vocabularyReviewedCount ?? state.vocabulary?.learned?.length ?? 0),
    completedMissionsCount: Number(activity.completedMissionsCount || progress.completedMissions?.length || 0),
    quizzesCompletedCount: Number(activity.quizzesCompletedCount || 0),
    pronunciationAttempts: Number(activity.pronunciationAttempts || 0),
    carlosConversationsCount: Number(activity.carlosConversationsCount || 0),
    currentLessonTitle: shortLessonTitle(courseProgress.currentLesson?.title || "your next lesson"),
  };
}

function getLessonCompletionPercent(progress = {}) {
  if (progress.completed) return 100;
  const explicit = Number(progress.percent ?? progress.completionPercent ?? progress.progress ?? 0);
  return Math.max(0, Math.min(100, Number.isFinite(explicit) ? Math.round(explicit) : 0));
}

function getDailyLearnTip() {
  const tips = [
    "A few focused minutes every day will take you further than one long session each week.",
    "Say each new phrase aloud. Your voice helps your memory hold onto it.",
    "Build complete phrases instead of memorizing isolated words.",
    "Review one older lesson before starting something new.",
    "Mistakes are useful—they show you exactly what to practice next.",
    "Listen once for the main idea, then again for the details.",
  ];
  const dayKey = Math.floor(new Date().setHours(0, 0, 0, 0) / 86400000);
  return tips[((dayKey % tips.length) + tips.length) % tips.length];
}

function getCarlosCoachMessage(stats) {
  if (!stats.completedLessons) {
    return `Let’s begin with ${stats.currentLessonTitle}. A few focused minutes is enough to make progress today.`;
  }
  return `Great work—you’ve completed ${stats.completedLessons} ${stats.completedLessons === 1 ? "lesson" : "lessons"}. Next, keep building with ${stats.currentLessonTitle}.`;
}

function getAchievementIconName(id) {
  return ({
    first_steps: "star", hundred_xp: "star", mission_complete: "target",
    vocab_starter: "book", vocab_builder: "book", quiz_rookie: "target",
    quiz_regular: "grammar", pronunciation_start: "voice",
    first_conversation: "conversation", conversation_regular: "conversation",
    on_fire: "fire", streak_7: "fire", first_lesson: "passport",
    ten_lessons: "passport", a1_complete: "travel", family_ready: "family",
  })[id] || "star";
}

function getLearnAchievementProgress(achievement, stats = {}) {
  if (achievement?.unlocked) return 1;
  const metricValues = {
    xp: stats.xp,
    streak: stats.streak,
    completedMissionsCount: stats.completedMissionsCount,
    vocabularyReviewedCount: stats.wordsLearned,
    quizzesCompletedCount: stats.quizzesCompletedCount,
    pronunciationAttempts: stats.pronunciationAttempts,
    carlosConversationsCount: stats.carlosConversationsCount,
    completedLessonsCount: stats.completedLessons,
    familyMission: 0,
  };
  return Math.max(0, Math.min(1, Number(metricValues[achievement?.metric] || 0) / Math.max(1, Number(achievement?.target || 1))));
}

function getLearnStampDestination(achievement) {
  return ({ conversation: "Madrid", grammar: "Seville", pronunciation: "Barcelona", vocabulary: "Mexico City", consistency: "Valencia", culture: "Granada" })[achievement?.category] || "España";
}

function formatLearnStampDate(value) {
  if (!value) return "Recently";
  return new Intl.DateTimeFormat([], { month: "short", day: "numeric" }).format(new Date(value));
}

function getLessonIconName(lesson, index) {
  const iconByLesson = [
    "conversation", "person", "family", "calendar", "shopping", "restaurant", "travel", "travel",
    "home", "time", "weather", "shopping", "book", "work", "star", "target", "health", "person",
    "conversation", "target", "roadmap", "travel", "conversation", "health", "conversation", "work",
    "home", "travel", "roadmap", "star",
  ];
  return iconByLesson[index] || (lesson?.module ? "book" : "roadmap");
}

function renderRoadmapPanel(lessons, currentLesson, unlockedIds) {
  const chapters = [
    { chapter: "Chapter 1", city: "Madrid", subtitle: "Build your foundation", image: "assets/images/lessons/lesson-01-greetings.png", lessons: lessons.slice(0, 10) },
    { chapter: "Chapter 2", city: "Valencia", subtitle: "Spanish for everyday life", image: "assets/images/lessons/lesson-06-food-drinks.png", lessons: lessons.slice(10, 20) },
    { chapter: "Chapter 3", city: "Barcelona", subtitle: "Speak with confidence", image: "assets/images/lessons/lesson-07-travel.png", lessons: lessons.slice(20, 30) },
  ];
  const totalMinutes = lessons.reduce((total, lesson) => total + Number(lesson.estimatedMinutes || 0), 0);

  return `<div class="learn-roadmap-intro"><small>A1 Spanish Journey</small><h2>From your first &ldquo;Hola&rdquo; to navigating Spain with confidence.</h2><p>Three cities. Thirty guided lessons. One complete A1 journey with Carlos.</p>
      <div class="learn-roadmap-stats">
        <span><strong>${lessons.length}</strong><small>Lessons</small></span>
        <span><strong>${chapters.length}</strong><small>Cities</small></span>
        <span><strong>${formatRoadmapHours(totalMinutes)}</strong><small>Hours</small></span>
        <span><strong>1</strong><small>Final Challenge</small></span>
      </div>
    </div>
    <div class="learn-roadmap-chapters">${chapters.map((chapter, chapterIndex) => {
      const completedCount = chapter.lessons.filter(lesson => getLessonProgress(lesson.id).completed).length;
      const chapterPercent = chapter.lessons.length ? Math.round((completedCount / chapter.lessons.length) * 100) : 0;
      const chapterMinutes = chapter.lessons.reduce((total, lesson) => total + Number(lesson.estimatedMinutes || 0), 0);
      return `
      <article class="learn-roadmap-chapter" style="--chapter-accent:${["#f4be58", "#29d66e", "#8d61e8"][chapterIndex]}">
        <header class="learn-roadmap-cover" style="--chapter-image:url('${chapter.image}')">
          <div><small>${renderLearnIcon("pin")}${chapter.chapter}</small><h3>${chapter.city}</h3><p>${chapter.subtitle}</p><span>${chapter.lessons.length} lessons &middot; ${formatRoadmapHours(chapterMinutes)} hr</span></div>
        </header>
        <div class="learn-chapter-progress"><span>${completedCount} of ${chapter.lessons.length} lessons</span><strong>${chapterPercent}%</strong><i aria-hidden="true"><b style="width:${chapterPercent}%"></b></i></div>
        <ol>${chapter.lessons.map(lesson => {
          const progress = getLessonProgress(lesson.id);
          const current = currentLesson?.id === lesson.id && !progress.completed;
          const unlocked = unlockedIds.has(lesson.id) || progress.completed;
          const state = progress.completed ? "complete" : current ? "current" : unlocked ? "available" : "locked";
          const finalChallenge = getLessonNumber(lesson) === 30;
          const nodeIcon = progress.completed ? "check" : current ? "play" : finalChallenge ? "star" : unlocked ? "roadmap" : "lock";
          return `<li class="${state} ${finalChallenge ? "final-challenge" : ""}"><i class="learn-route-node" aria-hidden="true">${renderLearnIcon(nodeIcon)}</i><span><b>${finalChallenge ? "Graduation Challenge" : `Lesson ${getLessonNumber(lesson)}`}</b><strong>${escapeHtml(shortLessonTitle(lesson.title))}</strong></span>${progress.completed ? `<em>Mastered</em>` : current ? `<em>Continue</em>` : unlocked ? `<em>Next</em>` : `<em aria-label="Locked">${renderLearnIcon("lock")}</em>`}</li>`;
        }).join("")}</ol>
      </article>`;
    }).join("")}</div>`;
}

function formatRoadmapHours(minutes) {
  if (!minutes) return "—";
  const hours = minutes / 60;
  return Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(".0", "");
}

function renderLearnIcon(name) {
  const paths = {
    book: `<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23V5.5Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23V5.5Z"/>`,
    grammar: `<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h5M8 16h7"/>`,
    culture: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>`,
    roadmap: `<path d="M5 3v18M5 6h9l-2.5 3L14 12H5"/><circle cx="5" cy="20" r="1.5"/>`,
    conversation: `<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/>`,
    person: `<circle cx="12" cy="7" r="4"/><path d="M4.5 21c.6-5 3.1-7.5 7.5-7.5s6.9 2.5 7.5 7.5"/>`,
    family: `<circle cx="8" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M2.5 21c.5-4.5 2.3-6.7 5.5-6.7s5 2.2 5.5 6.7M13 15c1-.9 2.3-1.4 4-1.4 2.7 0 4.3 2 4.7 6"/>`,
    calendar: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18M8 14h2M14 14h2M8 17h2"/>`,
    shopping: `<path d="M5 8h14l1.5 13h-17L5 8Z"/><path d="M8.5 9V6.5a3.5 3.5 0 0 1 7 0V9"/>`,
    restaurant: `<path d="M6 3v8M9 3v8M4 3v5c0 2 1 3 3 3s3-1 3-3V3M7 11v10M16 3c-2 2-3 5-3 8h4v10"/>`,
    travel: `<path d="m3 13 18-9-7.5 16-2.8-6.2L3 13Z"/><path d="m10.7 13.8 10-9.3"/>`,
    home: `<path d="m3 11 9-8 9 8v10H3V11Z"/><path d="M9 21v-6h6v6"/>`,
    work: `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 12h18"/>`,
    health: `<path d="M12 20S4 15.5 4 9.5A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 8 3.5C20 15.5 12 20 12 20Z"/><path d="M8 12h2l1-3 2 6 1-3h2"/>`,
    weather: `<path d="M7 18h10a4 4 0 1 0-.8-7.9A6 6 0 0 0 5 13a3 3 0 0 0 2 5Z"/><path d="M8 5V3M3.8 7.2 2.4 5.8M12.2 7.2l1.4-1.4"/>`,
    fire: `<path d="M13.5 2.5c.8 4-2.4 5-1.5 8.2 1-1.2 2.2-2 3.8-2.5 1.5 1.7 2.2 3.7 2.2 5.8a6 6 0 1 1-12 0c0-3.3 2-6.3 5.8-9.2-.2 2.5.5 3.5 1.7 4.3.8-2 .5-4.2 0-6.6Z"/>`,
    star: `<path d="m12 2.5 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5-5.8-3.1-5.8 3.1 1.1-6.5-4.7-4.6 6.5-.9L12 2.5Z"/>`,
    target: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/><path d="m14.5 9.5 6-6M16 3.5h4.5V8"/>`,
    time: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>`,
    voice: `<path d="M5 10v4M8.5 7v10M12 4v16M15.5 8v8M19 10v4"/>`,
    passport: `<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="11" r="4"/><path d="M8 11h8M12 7c1.2 1.1 1.8 2.4 1.8 4S13.2 13.9 12 15M12 7c-1.2 1.1-1.8 2.4-1.8 4s.6 2.9 1.8 4"/>`,
    lock: `<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>`,
    pin: `<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>`,
    check: `<path d="m5 12 4 4L19 6"/>`,
    play: `<path d="m9 7 8 5-8 5V7Z"/>`,
  };
  return `<svg viewBox="0 0 24 24" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ""}</svg>`;
}

function getLessonSubtitle(lesson, index) {
  const lessonObjective = lesson?.objective || lesson?.objectives?.[0];
  if (lessonObjective) return lessonObjective;
  const subtitles = [
    "Say hello, goodbye and introduce yourself.",
    "Share your name, origin and first questions.",
    "Talk about your family and friends.",
    "Count, tell time and use dates.",
    "Buy what you need and ask questions.",
    "Order food and drinks with confidence.",
    "Use essential Spanish while travelling.",
    "Talk about holidays and vacation plans.",
    "Routine, activities and daily tasks.",
    "Ask for and give directions with confidence.",
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
