import { evaluateAchievements, getAchievements } from "../core/achievements.js";
import { getCourseProgress } from "../core/content.js";
import { getCurrentStreak, getCurrentXP } from "../core/progress.js";
import { state as appState } from "../core/state.js";
import { saveState } from "../core/storage.js";
import { CARLOS_FALLBACK_ONERROR, getCarlosAsset } from "../data/carlosAssets.js";

const ACTIVITY_KEY = "habla_activity_stats_v1";
const STAMP_CELEBRATIONS_KEY = "habla_stamp_celebrations_v1";

if (typeof window !== "undefined") {
  window.hablaJourney = {
    openPassport(button) {
      const shell = button?.closest("[data-passport-hero]");
      if (!shell) return;
      shell.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      shell.querySelector(".passport-spread")?.focus({ preventScroll: true });
    },
    closePassport(button) {
      const shell = button?.closest("[data-passport-hero]");
      if (!shell) return;
      shell.classList.remove("is-open");
      shell.querySelector(".passport-cover-button")?.setAttribute("aria-expanded", "false");
    },
    beginStampCeremony(overlay) {
      if (!overlay || overlay.dataset.started === "true") return;
      overlay.dataset.started = "true";
      const major = overlay.dataset.major === "true";
      try { window.navigator?.vibrate?.(major ? [24, 45, 36] : 18); } catch { /* Haptics are optional. */ }
      if (!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
        overlay._dismissTimer = window.setTimeout(() => window.hablaJourney.dismissStampCeremony(overlay), 2800);
      }
    },
    dismissStampCeremony(target) {
      const overlay = target?.closest?.("[data-stamp-ceremony]") || target;
      if (!overlay || overlay.dataset.dismissing === "true") return;
      overlay.dataset.dismissing = "true";
      window.clearTimeout(overlay._dismissTimer);
      overlay.classList.add("is-leaving");
      consumeStampCelebration(overlay.dataset.stampId);
      const passport = document.querySelector("[data-passport-hero]");
      passport?.classList.remove("is-open");
      passport?.querySelector(".passport-cover-button")?.setAttribute("aria-expanded", "false");
      window.setTimeout(() => overlay.remove(), 300);
    },
    showCollection() {
      document.querySelector("[data-passport-main]")?.setAttribute("hidden", "");
      const collection = document.querySelector("[data-passport-collection]");
      collection?.removeAttribute("hidden");
      collection?.classList.remove("is-entering");
      requestAnimationFrame(() => collection?.classList.add("is-entering"));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    showPassport() {
      document.querySelector("[data-passport-collection]")?.setAttribute("hidden", "");
      document.querySelector("[data-passport-main]")?.removeAttribute("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    filter(filter, button) {
      document.querySelectorAll("[data-journey-filter]").forEach(item => {
        const active = item.dataset.journeyFilter === filter;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      document.querySelectorAll("[data-achievement-state]").forEach(card => {
        const states = card.dataset.achievementState?.split(" ") || [];
        card.hidden = filter !== "all" && !states.includes(filter);
      });
      document.querySelectorAll("[data-stamp-group]").forEach(group => {
        const hasVisibleStamp = [...group.querySelectorAll("[data-achievement-state]")].some(card => !card.hidden);
        group.hidden = !hasVisibleStamp;
        if (hasVisibleStamp && filter !== "all") group.open = true;
      });
      button?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    },
    openStampDetails(card) {
      if (!card || card.classList.contains("locked")) return;
      const detail = document.querySelector("[data-stamp-detail]");
      if (!detail) return;
      const setText = (selector, value) => { const node = detail.querySelector(selector); if (node) node.textContent = value || ""; };
      setText("[data-detail-city]", card.dataset.stampCity);
      setText("[data-detail-title]", card.dataset.stampTitle);
      setText("[data-detail-date]", card.dataset.stampDate);
      setText("[data-detail-category]", card.dataset.stampCategory);
      setText("[data-detail-rarity]", `${card.dataset.stampRarity} stamp`);
      setText("[data-detail-story]", card.dataset.stampStory);
      const detailMark = detail.querySelector("[data-detail-mark]");
      const cardMark = card.querySelector(".collection-stamp-mark");
      if (detailMark && cardMark) detailMark.replaceChildren(...[...cardMark.children].map(child => child.cloneNode(true)));
      detail._trigger = card;
      detail.hidden = false;
      detail.classList.remove("is-closing");
      document.documentElement.classList.add("passport-detail-open");
      requestAnimationFrame(() => detail.classList.add("is-open"));
      detail.querySelector(".stamp-detail-close")?.focus({ preventScroll: true });
      try { window.navigator?.vibrate?.(10); } catch { /* Haptics are optional. */ }
    },
    closeStampDetails(target) {
      const detail = target?.closest?.("[data-stamp-detail]") || target;
      if (!detail || detail.hidden) return;
      detail.classList.add("is-closing");
      detail.classList.remove("is-open");
      document.documentElement.classList.remove("passport-detail-open");
      window.setTimeout(() => {
        detail.hidden = true;
        detail.classList.remove("is-closing");
        detail._trigger?.focus?.({ preventScroll: true });
      }, 260);
    },
    openWordPicker(trigger) {
      const picker = document.querySelector("[data-word-picker]");
      if (!picker) return;
      picker._trigger = trigger;
      picker.hidden = false;
      document.documentElement.classList.add("word-picker-open");
      requestAnimationFrame(() => picker.classList.add("is-open"));
      picker.querySelector("[data-word-picker-search]")?.focus({ preventScroll: true });
    },
    closeWordPicker(target) {
      const picker = target?.closest?.("[data-word-picker]") || document.querySelector("[data-word-picker]");
      if (!picker || picker.hidden) return;
      picker.classList.remove("is-open");
      document.documentElement.classList.remove("word-picker-open");
      window.setTimeout(() => {
        picker.hidden = true;
        picker._trigger?.focus?.({ preventScroll: true });
      }, 200);
    },
    filterWords(input) {
      const query = normalizeWordSearch(input?.value);
      const picker = input?.closest?.("[data-word-picker]");
      if (!picker) return;
      let visible = 0;
      picker.querySelectorAll("[data-favorite-word-option]").forEach(option => {
        const matches = !query || normalizeWordSearch(option.dataset.wordSearch).includes(query);
        option.hidden = !matches;
        if (matches) visible += 1;
      });
      const empty = picker.querySelector("[data-word-picker-empty]");
      if (empty) empty.hidden = visible > 0;
    },
    selectFavoriteWord(option) {
      if (!option) return;
      const favorite = { spanish: option.dataset.spanish || "", english: option.dataset.english || "" };
      if (!favorite.spanish) return;
      appState.vocabulary = { ...(appState.vocabulary || {}), favorite };
      saveState(appState);

      const entry = document.querySelector("[data-favorite-word-entry]");
      const value = entry?.querySelector("[data-favorite-word-value]");
      const detail = entry?.querySelector("[data-favorite-word-detail]");
      const action = entry?.querySelector("[data-favorite-word-action]");
      if (value) value.textContent = favorite.spanish;
      if (detail) detail.textContent = favorite.english;
      if (action) action.firstChild.textContent = "Tap to change ";
      if (entry) entry.setAttribute("aria-label", `Favorite Word: ${favorite.spanish}. Open word picker to change.`);

      option.closest("[data-word-picker]")?.querySelectorAll("[data-favorite-word-option]").forEach(item => item.classList.toggle("selected", item === option));
      try { window.navigator?.vibrate?.(10); } catch { /* Haptics are optional. */ }
      window.hablaJourney.closeWordPicker(option);
    },
  };
}

export function renderJourney(state = {}) {
  const course = getCourseProgress();
  const activity = readJSON(ACTIVITY_KEY) || {};
  const savedProgress = readJSON("habla_progress_v1") || {};
  const xp = Number(getCurrentXP() || 0);
  const streak = Number(getCurrentStreak() || 0);
  const completedLessons = Number(course.completedCount || 0);
  const metrics = {
    xp,
    streak,
    completedMissionsCount: Number(activity.completedMissionsCount || savedProgress.completedMissions?.length || 0),
    vocabularyReviewedCount: Number(activity.vocabularyReviewedCount || state.vocabulary?.learned?.length || 0),
    quizzesCompletedCount: Number(activity.quizzesCompletedCount || 0),
    pronunciationAttempts: Number(activity.pronunciationAttempts || 0),
    carlosConversationsCount: Number(activity.carlosConversationsCount || 0),
    completedLessonsCount: completedLessons,
    familyMission: 0,
  };

  evaluateAchievements({ completedLessonsCount: completedLessons });
  const achievements = getAchievements().map(achievement => ({ ...achievement, current: getMetricValue(achievement, metrics) }));
  const unlocked = achievements.filter(achievement => achievement.unlocked);
  const completion = achievements.length ? Math.round((unlocked.length / achievements.length) * 100) : 0;
  const level = getJourneyLevel(xp);
  const recent = [...unlocked].sort((a, b) => new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0))[0];
  const nextAchievement = achievements.filter(item => !item.unlocked).sort((a, b) => progressRatio(b) - progressRatio(a))[0];
  const featured = [...unlocked].sort((a, b) => new Date(b.unlockedAt || 0) - new Date(a.unlockedAt || 0))
    .concat(achievements.filter(item => !item.unlocked).sort((a, b) => progressRatio(b) - progressRatio(a)))
    .slice(0, 4);
  const pendingStamp = readPendingStampCelebration();

  return `
    <section class="journey-screen" aria-label="Your Spanish passport">
      ${renderStampCeremony(pendingStamp)}
      <div data-passport-main>
        ${renderPassportHero(state, level, xp, completion)}
        ${renderRecentAchievement(recent, nextAchievement)}
        ${renderFeaturedStamps(featured, unlocked.length, achievements.length)}
        ${renderMilestones(achievements)}
        ${renderMemoryShelf(state, course, metrics)}
        ${renderCarlosMotivation(completedLessons, level)}
      </div>

      <div class="passport-collection-view" data-passport-collection hidden>
        ${renderPassportHeader("Passport Stamps", "Your collected moments, places, and progress.", "passport")}
        ${renderCollectionSummary(unlocked.length, achievements.length, completion, nextAchievement)}
        ${renderCollectionFeatured(featured.slice(0, 3))}
        ${renderStampBook(achievements)}
        ${renderStampDetail()}
      </div>
    </section>
  `;
}

function renderPassportHeader(title, subtitle, backTarget) {
  const back = backTarget === "passport"
    ? `onclick="hablaJourney.showPassport()"`
    : `data-page="${backTarget}"`;
  return `<header class="journey-header">
    <button type="button" ${back} aria-label="${backTarget === "passport" ? "Back to passport" : "Back to Learn"}">${journeyIcon("back")}</button>
    <div><small>Habla Passport</small><h1>${escapeHTML(title)}</h1><p>${escapeHTML(subtitle)}</p></div>
  </header>`;
}

function renderStampCeremony(stamp) {
  if (!stamp) return "";
  const major = ["platinum", "legendary"].includes(stamp.rarity) || ["a1_complete", "streak_7", "ten_lessons"].includes(stamp.id);
  return `<aside class="stamp-ceremony rarity-${escapeHTML(stamp.rarity)}" data-stamp-ceremony data-stamp-id="${escapeHTML(stamp.id)}" data-major="${major}" aria-live="polite" aria-label="New passport stamp" onanimationstart="hablaJourney.beginStampCeremony(this)">
    <div class="stamp-ceremony-card">
      <small>Stamp Added</small>
      <div class="stamp-ceremony-mark" aria-hidden="true"><span>${journeyIcon(getAchievementIcon(stamp))}</span><i>${journeyIcon("check")}</i></div>
      <strong>${escapeHTML(getStampDestination(stamp))}</strong>
      <p>${escapeHTML(stamp.title)}</p>
      <blockquote><b>Carlos says</b>&ldquo;¡Excelente! Another moment in your Spanish journey.&rdquo;</blockquote>
      <button type="button" onclick="hablaJourney.dismissStampCeremony(this)">Add to Passport ${journeyIcon("passport")}</button>
    </div>
  </aside>`;
}

function renderPassportHero(state, level, xp, completion) {
  const name = state.user?.name || "Habla Learner";
  const passportNumber = createPassportNumber(name, level.name);
  return `<section class="passport-hero" data-passport-hero>
    <button class="passport-page-back" type="button" data-page="learn" aria-label="Back to Learn">${journeyIcon("back")}</button>
    <button class="passport-cover-button" type="button" aria-expanded="false" onclick="hablaJourney.openPassport(this)">
      <span class="passport-cover-shine" aria-hidden="true"></span>
      <span class="passport-cover-logo" aria-hidden="true">${journeyIcon("habla")}</span>
      <small>Habla</small>
      <strong>Spanish<br>Passport</strong>
      <i aria-hidden="true"></i>
      <span class="passport-cover-issued">Issued to<br><b>${escapeHTML(name)}</b></span>
      <span class="passport-cover-carlos">Issued by Carlos</span>
      <em>Tap to open ${journeyIcon("open")}</em>
    </button>

    <div class="passport-turn-page" aria-hidden="true"><span>${journeyIcon("habla")}</span><i></i></div>

    <div class="passport-spread" tabindex="-1" aria-label="Open Spanish passport">
      <button class="passport-close" type="button" onclick="hablaJourney.closePassport(this)" aria-label="Close passport">${journeyIcon("close")}</button>
      <section class="passport-page passport-photo-page">
        <div class="passport-page-watermark" aria-hidden="true">${journeyIcon("habla")}</div>
        <small>Habla Spanish Passport</small>
        <div class="passport-photo"><span>${escapeHTML(getInitials(name))}</span><i aria-hidden="true"></i></div>
        <dl>
          <div><dt>Issued To</dt><dd>${escapeHTML(name)}</dd></div>
          <div><dt>Destination</dt><dd>Madrid, Spain</dd></div>
          <div><dt>Passport No.</dt><dd>${passportNumber}</dd></div>
          <div><dt>Issued By</dt><dd class="passport-signature">Carlos</dd></div>
        </dl>
      </section>
      <section class="passport-page passport-progress-page">
        <small>Current Journey</small>
        <div class="passport-entry-stamp" aria-hidden="true"><span>España</span><b>${level.name.split(" ")[0]}</b></div>
        <h2>${escapeHTML(level.name)}</h2>
        <strong>Level ${level.number}</strong>
        <div class="passport-spread-ring" style="--passport-progress:${completion * 3.6}deg"><span>${completion}%</span></div>
        <div class="passport-xp-line"><span>${formatNumber(xp)} XP</span><b>${formatNumber(level.nextXP)} XP</b></div>
        <i class="passport-xp-progress" aria-hidden="true"><b style="width:${level.percent}%"></b></i>
        <p><small>Next Destination</small>${escapeHTML(level.nextName)}</p>
      </section>
    </div>
  </section>`;
}

function renderRecentAchievement(recent, nextAchievement) {
  const achievement = recent || nextAchievement;
  if (!achievement) return "";
  const unlocked = Boolean(recent);
  const celebrate = unlocked && shouldCelebrateAchievement(achievement.id);
  return `<section class="passport-recent ${unlocked ? "is-unlocked" : "is-next"} ${celebrate ? "celebrate" : ""}">
    ${celebrate ? `<div class="passport-sparkles" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>` : ""}
    <div class="passport-recent-icon" aria-hidden="true">${journeyIcon(getAchievementIcon(achievement))}</div>
    <div><small>${unlocked ? "Recently Unlocked" : "Your Next Stamp"}</small><h2>${escapeHTML(achievement.title)}</h2><p>${unlocked ? `Unlocked ${formatUnlockedDate(achievement.unlockedAt)}` : escapeHTML(achievement.description)}</p></div>
    <span>${getRarityTheme(achievement.rarity)}</span>
  </section>`;
}

function renderFeaturedStamps(featured, unlockedCount, totalCount) {
  return `<section class="passport-section passport-featured">
    <div class="passport-section-head"><div><small>Passport Stamps</small><h2>Collected Stamps</h2></div><strong>${unlockedCount} / ${totalCount}</strong></div>
    <div class="passport-stamp-row">${featured.map(renderFeaturedStamp).join("")}</div>
    <button class="passport-see-all" type="button" onclick="hablaJourney.showCollection()">View All Passport Stamps ${journeyIcon("arrow")}</button>
  </section>`;
}

function renderFeaturedStamp(achievement) {
  const destination = getStampDestination(achievement);
  const stampDate = achievement.unlocked ? formatStampDate(achievement.unlockedAt) : "Awaiting stamp";
  return `<article class="passport-stamp ${achievement.unlocked ? "unlocked" : "locked"} rarity-${achievement.rarity}">
    <div aria-hidden="true">${journeyIcon(getAchievementIcon(achievement))}</div>
    <small>${escapeHTML(destination)}</small>
    <strong>${escapeHTML(achievement.title)}</strong>
    <time>${escapeHTML(stampDate)}</time>
    <em>${achievement.unlocked ? getRarityTheme(achievement.rarity) : `${Math.round(progressRatio(achievement) * 100)}% complete`}</em>
  </article>`;
}

function renderMilestones(achievements) {
  const ids = ["first_lesson", "hundred_xp", "streak_7", "vocab_builder", "conversation_regular", "a1_complete"];
  const milestones = ids.map(id => achievements.find(item => item.id === id)).filter(Boolean);
  return `<section class="passport-section passport-milestones">
    <div class="passport-section-head"><div><small>Milestones</small><h2>The road ahead</h2></div></div>
    <div class="passport-timeline">${milestones.map((item, index) => `<article class="${item.unlocked ? "complete" : "locked"}">
      <div class="passport-timeline-mark"><span>${item.unlocked ? journeyIcon("check") : journeyIcon("lock")}</span>${index < milestones.length - 1 ? "<i></i>" : ""}</div>
      <div><strong>${escapeHTML(item.title)}</strong><small>${escapeHTML(item.description)}</small></div>
      <em>${item.unlocked ? "Mastered" : formatMilestoneProgress(item)}</em>
    </article>`).join("")}</div>
  </section>`;
}

function renderMemoryShelf(state, course, metrics) {
  const latestLesson = course.completedLessons?.[course.completedLessons.length - 1];
  const favoriteWord = state.vocabulary?.favorite || state.vocabulary?.favorites?.[0] || null;
  const favoriteLabel = typeof favoriteWord === "string" ? favoriteWord : favoriteWord?.spanish || "Hola";
  const favoriteDetail = typeof favoriteWord === "object" ? favoriteWord?.english || favoriteWord?.meaning || favoriteWord?.example || favoriteWord?.exampleSpanish || "Hello" : "Hello";
  const lessonLabel = latestLesson ? getMemoryLessonLabel(latestLesson) : "Your first lesson awaits";
  const lessonNumber = latestLesson ? getMemoryLessonNumber(latestLesson) : null;
  return `<section class="passport-section passport-memory">
    <div class="passport-section-head"><div><small>Learning Journal</small><h2>Your Spanish story</h2></div><time>${formatJournalDate(new Date())}</time></div>
    <div class="passport-story-journal">
      <div class="passport-journal-binding" aria-hidden="true"></div>
      ${memoryJournalRow("heart", "Favorite Word", favoriteLabel, favoriteDetail, "favorite", "word-picker")}
      ${memoryJournalRow("passport", "Today I learned...", lessonLabel, lessonNumber ? `Lesson ${lessonNumber}` : "Your journey starts here", "lesson", "", latestLesson ? "Muy bien!" : "Your first page is waiting")}
      ${memoryJournalRow("fire", "Current Streak", formatNumber(metrics.streak), `${metrics.streak === 1 ? "day" : "days"} · ${metrics.streak ? "Keep it alive!" : "Begin today"}`, "streak")}
      ${memoryJournalRow("chat", "Conversations", formatNumber(metrics.carlosConversationsCount), "Chats with Carlos", "conversation", "", metrics.carlosConversationsCount ? "Vamos!" : "Say hola to Carlos")}
    </div>
    ${renderFavoriteWordPicker(course, state, favoriteLabel)}
  </section>`;
}

function memoryJournalRow(icon, label, value, detail, className, page = "", note = "") {
  const tag = page ? "button" : "article";
  const attributes = page === "word-picker"
    ? `type="button" data-favorite-word-entry onclick="hablaJourney.openWordPicker(this)" aria-label="${escapeHTML(`${label}: ${value}. Open word picker to change.`)}"`
    : page ? `type="button" data-page="${page}" aria-label="${escapeHTML(`${label}: ${value}. Open Practice to change.`)}"` : "";
  const rowNote = note || (className === "streak" ? (Number(value) ? "Keep going!" : "Begin today") : "");
  const rowDetail = className === "streak" ? String(detail).split(/\s/)[0] : detail;
  return `<${tag} class="passport-journal-entry ${className}" ${attributes}>
    <span aria-hidden="true">${journeyIcon(icon)}</span>
    <div><small>${escapeHTML(label)}</small><strong ${className === "favorite" ? "data-favorite-word-value" : ""}>${escapeHTML(value)}</strong><p ${className === "favorite" ? "data-favorite-word-detail" : ""}>${escapeHTML(rowDetail)}</p></div>
    ${rowNote ? `<mark>${escapeHTML(rowNote)}</mark>` : ""}
    ${page ? `<em ${className === "favorite" ? "data-favorite-word-action" : ""}>${favoriteWordAction(value)} ${journeyIcon("arrow")}</em>` : ""}
  </${tag}>`;
}

function favoriteWordAction(value) {
  return String(value).toLocaleLowerCase() === "hola" ? "Tap to choose another" : "Tap to change";
}

function renderFavoriteWordPicker(course, state, selectedWord) {
  const words = getFavoriteWordOptions(course, state);
  return `<div class="favorite-word-picker" data-word-picker hidden>
    <button class="favorite-word-picker-backdrop" type="button" aria-label="Close favorite word picker" onclick="hablaJourney.closeWordPicker(this)"></button>
    <section class="favorite-word-sheet" role="dialog" aria-modal="true" aria-labelledby="favorite-word-title" onkeydown="if(event.key==='Escape') hablaJourney.closeWordPicker(this)">
      <header><div><small>Learning Journal</small><h3 id="favorite-word-title">Choose a favorite word</h3><p>Pick a word from the lessons you&rsquo;ve reached.</p></div><button type="button" aria-label="Close" onclick="hablaJourney.closeWordPicker(this)">${journeyIcon("close")}</button></header>
      <label class="favorite-word-search">${journeyIcon("search")}<input type="search" placeholder="Search Spanish or English" autocomplete="off" data-word-picker-search oninput="hablaJourney.filterWords(this)"></label>
      <div class="favorite-word-options">${words.map(word => renderFavoriteWordOption(word, selectedWord)).join("")}</div>
      <p class="favorite-word-empty" data-word-picker-empty hidden>No matching words yet.</p>
    </section>
  </div>`;
}

function renderFavoriteWordOption(word, selectedWord) {
  const selected = normalizeWordSearch(word.spanish) === normalizeWordSearch(selectedWord);
  const search = `${word.spanish} ${word.english}`;
  return `<button type="button" class="${selected ? "selected" : ""}" data-favorite-word-option data-spanish="${escapeHTML(word.spanish)}" data-english="${escapeHTML(word.english)}" data-word-search="${escapeHTML(search)}" onclick="hablaJourney.selectFavoriteWord(this)"><span>${escapeHTML(word.spanish)}</span><small>${escapeHTML(word.english)}</small><i aria-hidden="true">${journeyIcon("check")}</i></button>`;
}

function getFavoriteWordOptions(course, state) {
  const lessons = [...(course.completedLessons || [])];
  if (course.currentLesson && !lessons.some(lesson => lesson.id === course.currentLesson.id)) lessons.push(course.currentLesson);
  const lessonWords = lessons.flatMap(lesson => lesson.vocabulary || []);
  const learnedWords = Array.isArray(state.vocabulary?.learned) ? state.vocabulary.learned : [];
  const candidates = [...lessonWords, ...learnedWords.map(item => {
    if (typeof item === "object") return item;
    return lessonWords.find(word => normalizeWordSearch(word.spanish) === normalizeWordSearch(item)) || null;
  })].filter(Boolean);
  const seen = new Set();
  const words = candidates.map(word => ({
    spanish: String(word.spanish || word.es || "").trim(),
    english: String(word.english || word.en || word.meaning || "").trim(),
  })).filter(word => {
    const spanish = String(word.spanish || word.es || "").trim();
    const english = String(word.english || word.en || word.meaning || "").trim();
    const key = normalizeWordSearch(spanish);
    if (!spanish || !english || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return words.length ? words : [{ spanish: "Hola", english: "Hello" }];
}

function normalizeWordSearch(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase().trim();
}

function renderCarlosMotivation(completedLessons, level) {
  const remaining = Math.max(10 - completedLessons, 0);
  return `<section class="passport-carlos">
    <img src="${getCarlosAsset("thinking")}" alt="Carlos encouraging your Spanish journey" onerror="${CARLOS_FALLBACK_ONERROR}">
    <div><small>Carlos&rsquo; note</small><p>${remaining ? `You&rsquo;re only <strong>${remaining} ${remaining === 1 ? "lesson" : "lessons"}</strong> away from your next course milestone.` : `You reached this milestone. <strong>${escapeHTML(level.nextName)}</strong> is waiting.`}</p><span>Keep going&mdash;you&rsquo;ve already built great momentum.</span></div>
    <button type="button" data-page="learn">Continue Learning ${journeyIcon("arrow")}</button>
  </section>`;
}

function renderCollectionSummary(unlockedCount, totalCount, completion, nextAchievement) {
  return `<section class="stamp-collection-summary" aria-label="Stamp collection progress">
    <div class="stamp-summary-copy"><small>Collection Progress</small><h2>${unlockedCount} of ${totalCount} collected</h2><p>${completion}% complete</p></div>
    <div class="stamp-summary-ring" style="--stamp-progress:${completion * 3.6}deg"><strong>${completion}%</strong></div>
    <i class="stamp-summary-progress" aria-hidden="true"><b style="width:${completion}%"></b></i>
    ${nextAchievement ? `<div class="stamp-next"><span aria-hidden="true">${journeyIcon(getAchievementIcon(nextAchievement))}</span><div><small>Next Stamp</small><strong>${escapeHTML(nextAchievement.title)}</strong><em>${Math.round(progressRatio(nextAchievement) * 100)}% complete</em></div></div>` : `<div class="stamp-next complete"><span aria-hidden="true">${journeyIcon("check")}</span><div><small>Passport Complete</small><strong>Every stamp collected</strong></div></div>`}
  </section>`;
}

function renderCollectionFeatured(achievements) {
  if (!achievements.length) return "";
  return `<section class="collection-featured passport-section">
    <div class="passport-section-head"><div><small>Highlights</small><h2>Featured stamps</h2></div><span>Tap an earned stamp to open its memory</span></div>
    <div class="collection-featured-grid">${achievements.map((achievement, index) => renderCollectionStamp(achievement, { featured: true, major: index === 0 })).join("")}</div>
  </section>`;
}

function renderStampBook(achievements) {
  const filters = [
    ["all", "All"], ["unlocked", "Unlocked"], ["conversation", "Conversation"],
    ["vocabulary", "Vocabulary"], ["travel", "Travel"], ["voice", "Voice"], ["rare", "Rare"],
  ];
  const groups = [
    ["conversation", "Conversation", "Moments when Spanish became a real exchange."],
    ["grammar", "Grammar", "Patterns and quizzes that built your foundation."],
    ["vocabulary", "Vocabulary", "Words collected and made your own."],
    ["voice", "Voice", "The moments you found your Spanish voice."],
    ["travel", "Travel", "Lessons and destinations along your course path."],
    ["consistency", "Consistency", "The steady habits that keep you moving."],
  ];

  return `<section class="passport-stamp-book" aria-label="Browse passport stamps">
    <div class="journey-filters" aria-label="Filter passport stamps">
      ${filters.map(([filter, label], index) => `<button type="button" class="${index === 0 ? "active" : ""}" data-journey-filter="${filter}" aria-pressed="${index === 0}" onclick="hablaJourney.filter('${filter}', this)">${label}</button>`).join("")}
    </div>
    <div class="stamp-book-heading"><small>Visa Pages</small><h2>Browse your collections</h2><p>Open a section, then tap an earned stamp to read its story.</p></div>
    <div class="stamp-groups">${groups.map(([category, label, description]) => renderStampGroup(category, label, description, achievements)).join("")}</div>
  </section>`;
}

function renderStampGroup(category, label, description, achievements) {
  const items = achievements.filter(achievement => getCollectionCategory(achievement) === category);
  if (!items.length) return "";
  const unlockedCount = items.filter(item => item.unlocked).length;
  const complete = unlockedCount === items.length;
  return `<details class="stamp-group ${complete ? "complete" : ""}" data-stamp-group open>
    <summary><span aria-hidden="true">${journeyIcon(getCollectionIcon(category))}</span><span class="stamp-group-copy"><strong>${label}</strong><small>${description}</small></span><em>${unlockedCount} / ${items.length} collected</em>${complete ? "<b>Collection complete</b>" : ""}<i aria-hidden="true"></i></summary>
    <div class="stamp-collection-grid">${items.map(item => renderCollectionStamp(item, { major: isMajorStamp(item) })).join("")}</div>
  </details>`;
}

function renderCollectionStamp(achievement, options = {}) {
  const recent = achievement.unlockedAt && Date.now() - new Date(achievement.unlockedAt).getTime() < 7 * 86400000;
  const rare = ["platinum", "legendary"].includes(achievement.rarity);
  const category = getCollectionCategory(achievement);
  const states = [achievement.unlocked ? "unlocked" : "locked", category, recent ? "recent" : "", rare ? "rare" : ""].filter(Boolean).join(" ");
  const classes = [achievement.unlocked ? "unlocked" : "locked", `rarity-${achievement.rarity}`, options.featured ? "featured" : "", options.major ? "major" : ""].filter(Boolean).join(" ");
  const title = achievement.unlocked ? achievement.title : "Hidden Stamp";
  const stampLabel = achievement.unlocked ? `View ${achievement.title} stamp details` : "Hidden stamp. Unlock it to reveal its story.";
  const city = achievement.unlocked ? getStampDestination(achievement) : "";
  const categoryLabel = getCollectionLabel(category);
  const earnedDate = achievement.unlocked ? formatLongStampDate(achievement.unlockedAt) : "";
  const story = achievement.unlocked ? getStampStory(achievement) : "";
  return `<button type="button" class="collection-stamp ${classes}" ${options.featured ? "" : `data-achievement-state="${states}"`} data-stamp-city="${escapeHTML(city)}" data-stamp-title="${escapeHTML(achievement.unlocked ? achievement.title : "")}" data-stamp-date="${escapeHTML(earnedDate)}" data-stamp-category="${escapeHTML(categoryLabel)}" data-stamp-rarity="${escapeHTML(getRarityTheme(achievement.rarity))}" data-stamp-story="${escapeHTML(story)}" aria-label="${escapeHTML(stampLabel)}" onclick="hablaJourney.openStampDetails(this)" ${achievement.unlocked ? "" : "disabled"}>
    <span class="collection-stamp-inner">
      <span class="collection-stamp-face collection-stamp-front">
        <span class="collection-stamp-mark" aria-hidden="true">${achievement.unlocked ? journeyIcon(getAchievementIcon(achievement)) : "<b>?</b>"}</span>
        <small>${achievement.unlocked ? escapeHTML(city) : "Unknown destination"}</small>
        <strong>${escapeHTML(title)}</strong>
        ${achievement.unlocked ? `<time>${escapeHTML(formatPassportInkDate(achievement.unlockedAt))}</time>` : ""}
        <em>${achievement.unlocked ? escapeHTML(getRarityTheme(achievement.rarity)) : "Unlock to reveal"}</em>
        <i aria-hidden="true">${achievement.unlocked ? journeyIcon("habla") : journeyIcon("lock")}</i>
      </span>
    </span>
  </button>`;
}

function renderStampDetail() {
  return `<aside class="stamp-detail" data-stamp-detail hidden role="dialog" aria-modal="true" aria-labelledby="stamp-detail-title" onclick="if(event.target===this) hablaJourney.closeStampDetails(this)" onkeydown="if(event.key==='Escape') hablaJourney.closeStampDetails(this)">
    <article class="stamp-detail-page">
      <button class="stamp-detail-close" type="button" aria-label="Close stamp memory" onclick="hablaJourney.closeStampDetails(this)">${journeyIcon("close")}</button>
      <small>Habla Passport Memory</small>
      <div class="stamp-detail-mark" data-detail-mark aria-hidden="true"></div>
      <p class="stamp-detail-city" data-detail-city></p>
      <h2 id="stamp-detail-title" data-detail-title></h2>
      <dl>
        <div><dt>Earned</dt><dd data-detail-date></dd></div>
        <div><dt>Category</dt><dd data-detail-category></dd></div>
        <div><dt>Passport Class</dt><dd data-detail-rarity></dd></div>
      </dl>
      <blockquote><small>Carlos says</small><p data-detail-story></p><span>Every fluent speaker started with a moment like this.</span></blockquote>
      <div class="stamp-detail-seal" aria-hidden="true">${journeyIcon("habla")}<span>Recorded</span></div>
    </article>
  </aside>`;
}

function getJourneyLevel(xp) {
  const levels = [
    { name: "A1 Explorer", nextName: "A2 Traveler", min: 0, next: 3000 },
    { name: "A2 Traveler", nextName: "B1 Local", min: 3000, next: 6000 },
    { name: "B1 Local", nextName: "B2 Adventurer", min: 6000, next: 9000 },
    { name: "B2 Adventurer", nextName: "C1 Insider", min: 9000, next: 12000 },
    { name: "C1 Insider", nextName: "C2 Fluent", min: 12000, next: 15000 },
    { name: "C2 Fluent", nextName: "Journey Complete", min: 15000, next: 15000 },
  ];
  const index = levels.reduce((current, candidate, candidateIndex) => xp >= candidate.min ? candidateIndex : current, 0);
  const current = levels[index];
  const range = current.next - current.min;
  const percent = range > 0 ? Math.min(100, Math.round(((xp - current.min) / range) * 100)) : 100;
  return { ...current, number: index + 1, nextXP: current.next, percent };
}

function getMetricValue(achievement, metrics) { return achievement.unlocked && achievement.metric === "familyMission" ? 1 : Number(metrics[achievement.metric] || 0); }
function progressRatio(achievement) { return achievement.unlocked ? 1 : Math.max(0, Math.min(1, Number(achievement.current || 0) / Math.max(1, Number(achievement.target || 1)))); }
function getRarityTheme(rarity) { return ({ bronze: "Traveler", silver: "Explorer", gold: "Local", platinum: "Conversational", legendary: "Master" })[rarity] || "Traveler"; }
function getStampDestination(achievement) { return ({ conversation: "Madrid", grammar: "Seville", pronunciation: "Barcelona", vocabulary: "Mexico City", consistency: "Valencia", culture: "Granada" })[achievement.category] || "España"; }
function formatStampDate(value) { if (!value) return "Stamped"; return new Intl.DateTimeFormat([], { month: "short", year: "numeric" }).format(new Date(value)).toUpperCase(); }
function formatLongStampDate(value) { if (!value) return "Recently"; return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(value)); }
function formatPassportInkDate(value) { if (!value) return "STAMPED"; return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)).toUpperCase(); }
function getCollectionCategory(achievement) { return ({ pronunciation: "voice", culture: "travel" })[achievement.category] || achievement.category; }
function getCollectionLabel(category) { return ({ conversation: "Conversation", grammar: "Grammar", vocabulary: "Vocabulary", voice: "Voice", travel: "Travel", consistency: "Consistency" })[category] || capitalize(category); }
function getCollectionIcon(category) { return ({ conversation: "chat", grammar: "grammar", vocabulary: "book", voice: "voice", travel: "travel", consistency: "fire" })[category] || "star"; }
function isMajorStamp(achievement) { return ["a1_complete", "conversation_regular", "vocab_builder", "streak_7", "ten_lessons"].includes(achievement.id); }
function getStampStory(achievement) {
  return ({
    first_steps: "Your Spanish journey began with its first point of progress.",
    hundred_xp: "Small sessions became real momentum on your journey.",
    mission_complete: "You answered the day's challenge and kept moving.",
    vocab_starter: "The first new words entered your Spanish vocabulary.",
    vocab_builder: "One hundred practiced words made Spanish feel more familiar.",
    quiz_rookie: "You tested what you knew and learned from the result.",
    quiz_regular: "Ten quizzes turned practice into a dependable learning habit.",
    pronunciation_start: "You used your voice and made Spanish audible.",
    first_conversation: "You started a real Spanish exchange with Carlos.",
    conversation_regular: "Ten conversations made speaking feel more natural.",
    on_fire: "You returned for three days and protected your momentum.",
    streak_7: "A full week of Spanish became part of your routine.",
    first_lesson: "You completed the first chapter of your Spanish journey.",
    ten_lessons: "Ten completed lessons opened a much wider Spanish world.",
    a1_complete: "You completed A1 and became ready for Madrid.",
    family_ready: "You practiced the Spanish that brings family closer.",
  })[achievement.id] || achievement.description;
}
function formatMilestoneProgress(item) { const current = Math.min(Number(item.current || 0), Number(item.target || 0)); if (item.metric === "streak") return `Day ${current} / ${item.target}`; if (item.metric === "xp") return `${current} / ${item.target} XP`; if (item.metric === "vocabularyReviewedCount") return `${current} of ${item.target} words`; if (item.metric === "carlosConversationsCount") return `${current} of ${item.target} chats`; if (item.metric === "completedLessonsCount") return `${current} of ${item.target} lessons`; return `${current} of ${item.target}`; }
function shouldCelebrateAchievement(id) { if (!id) return false; const key = "habla_last_celebrated_achievement_v1"; try { if (localStorage.getItem(key) === id) return false; localStorage.setItem(key, id); return true; } catch { return false; } }
function readPendingStampCelebration() { const queue = readJSON(STAMP_CELEBRATIONS_KEY); return Array.isArray(queue) ? queue[0] || null : null; }
function consumeStampCelebration(id) { try { const queue = readJSON(STAMP_CELEBRATIONS_KEY); if (!Array.isArray(queue)) return; localStorage.setItem(STAMP_CELEBRATIONS_KEY, JSON.stringify(queue.filter(item => item?.id !== id))); } catch { /* Celebration persistence is optional. */ } }
function getAchievementIcon(achievement) {
  return ({ first_steps: "footsteps", hundred_xp: "star", mission_complete: "target", vocab_starter: "book", vocab_builder: "book", quiz_rookie: "grammar", quiz_regular: "grammar", pronunciation_start: "voice", first_conversation: "chat", conversation_regular: "chat", on_fire: "fire", streak_7: "fire", first_lesson: "passport", ten_lessons: "passport", a1_complete: "travel", family_ready: "people" })[achievement.id] || "star";
}

function journeyIcon(name) {
  const paths = {
    back: `<path d="m15 18-6-6 6-6"/>`, arrow: `<path d="M5 12h14M14 7l5 5-5 5"/>`,
    open: `<path d="M4 6.5c3.2-.9 5.9-.2 8 2.1v11.9c-2.1-2.3-4.8-3-8-2.1V6.5ZM20 6.5c-3.2-.9-5.9-.2-8 2.1v11.9c2.1-2.3 4.8-3 8-2.1V6.5Z"/>`,
    close: `<path d="m6 6 12 12M18 6 6 18"/>`, search: `<circle cx="11" cy="11" r="7"/><path d="m16 16 4 4"/>`,
    habla: `<path d="M20 11.5a8 8 0 0 1-8 8H8l-4 2 1.2-4A8 8 0 1 1 20 11.5Z"/><path d="M8 10v3M10.7 8.5v6M13.3 7v9M16 9.5v4"/>`,
    passport: `<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="11" r="4"/><path d="M8 11h8M12 7c1.2 1.1 1.8 2.4 1.8 4S13.2 13.9 12 15M12 7c-1.2 1.1-1.8 2.4-1.8 4s.6 2.9 1.8 4"/>`,
    star: `<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z"/>`,
    target: `<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m14.5 9.5 5-5M16 4.5h3.5V8"/>`,
    book: `<path d="M4 5c3-1 5.7-.3 8 2v14c-2.3-2.3-5-3-8-2V5ZM20 5c-3-1-5.7-.3-8 2v14c2.3-2.3 5-3 8-2V5Z"/>`,
    grammar: `<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h8M8 15h5"/>`,
    voice: `<path d="M5 10v4M8.5 7v10M12 4v16M15.5 8v8M19 10v4"/>`,
    chat: `<path d="M4 5h16v12H9l-5 4V5Z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/>`,
    fire: `<path d="M12 22c4.4 0 7-3 7-7.1 0-3.3-1.7-6.4-5.2-9.4.2 2.4-.8 4-2.3 5.1.1-3.6-1.7-6.2-4.1-8.6.1 4.1-2.4 6.3-2.4 10.7C5 18 8 22 12 22Z"/>`,
    people: `<circle cx="9" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M14 14.5c3.6-.5 5.7 1.3 6.1 5.5"/>`,
    globe: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.4 2.5 3.5 5.5 3.5 9S14.4 18.5 12 21M12 3C9.6 5.5 8.5 8.5 8.5 12s1.1 6.5 3.5 9"/>`,
    travel: `<path d="m3 12 18-8-6 16-3.5-6.5L3 12Z"/><path d="m11.5 13.5 4-4"/>`,
    footsteps: `<path d="M8 13c-2.2 0-4-1.5-4-3.5S5.4 6 7.4 6s3.1 1.5 3.1 3.4S10 13 8 13ZM16 21c-2.2 0-4-1.5-4-3.5s1.4-3.5 3.4-3.5 3.1 1.5 3.1 3.4S18 21 16 21Z"/>`,
    check: `<path d="m5 12 4 4L19 6"/>`, lock: `<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>`,
    heart: `<path d="M20.8 5.8a5.4 5.4 0 0 0-7.6 0L12 7l-1.2-1.2a5.4 5.4 0 1 0-7.6 7.6L12 22l8.8-8.6a5.4 5.4 0 0 0 0-7.6Z"/>`,
  };
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || paths.star}</svg>`;
}

function shortLessonTitle(title) { return String(title || "").replace(/^[^:]+:\s*/, ""); }
function getMemoryLessonLabel(lesson) { const title = String(lesson?.title || "").replace(/^(?:lesson\s*)?\d+\s*[:.\-–—|]\s*/i, "").trim(); const concise = title.split(/[:—–]/)[0].trim() || title; return concise.length > 34 ? `${concise.slice(0, 31).trim()}…` : concise; }
function getMemoryLessonNumber(lesson) { const match = String(lesson?.id || lesson?.title || "").match(/(?:lesson[-\s]*)?(\d+)/i); return match ? Number(match[1]) : null; }
function formatJournalDate(value) { return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short" }).format(value).toUpperCase(); }
function getInitials(name) { return String(name || "H").trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join("") || "H"; }
function createPassportNumber(name, level) { const source = `${name}:${level}`; let hash = 0; for (let index = 0; index < source.length; index += 1) hash = ((hash << 5) - hash + source.charCodeAt(index)) | 0; return `${String(level).match(/[A-C][1-2]/)?.[0] || "A1"}-${String(Math.abs(hash) % 1000000).padStart(6, "0")}`; }
function formatUnlockedDate(value) { if (!value) return "recently"; const date = new Date(value); const elapsed = Math.max(0, Date.now() - date.getTime()); if (elapsed < 60000) return "just now"; if (elapsed < 3600000) return `${Math.floor(elapsed / 60000)} min ago`; if (elapsed < 86400000) return `${Math.floor(elapsed / 3600000)} hr ago`; return new Intl.DateTimeFormat([], { month: "short", day: "numeric" }).format(date); }
function formatNumber(value) { return Number(value || 0).toLocaleString(); }
function capitalize(value) { return String(value || "").replace(/^./, character => character.toUpperCase()); }
function escapeHTML(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function readJSON(key) { try { return JSON.parse(localStorage.getItem(key) || "null"); } catch { return null; } }
