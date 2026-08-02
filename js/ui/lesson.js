import {
  completeLesson,
  getActiveLesson,
  getCourseProgress,
  getLessonById,
  getLessonCompletionXP,
  getLessonProgress,
  setActiveLesson,
  updateLessonProgress,
} from "../core/content.js";
import { evaluateAchievements } from "../core/achievements.js";
import {
  getLessonDiscoveries,
  getLessonMemory,
  rememberDiscovery,
  rememberLessonChoice,
} from "../core/lessonMemory.js";
import { CARLOS_FALLBACK_ONERROR, getCarlosAsset } from "../data/carlosAssets.js";
import {
  getEpisodeArtworkAlt,
  LESSON_ARTWORK_ONERROR,
  preloadEpisodeArtwork,
  preloadLessonArtwork,
} from "../data/lessonAssets.js";
import { personalizeText } from "../core/personalization.js";
import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";
import { isSpeechPlaying, playSpeech, playSpeechSequence, stopSpeech } from "../core/audio.js";
import { renderChoiceIcon } from "../components/choiceIcons.js";

const ICONS = {
  back: `<path d="m15 18-6-6 6-6"/>`,
  book: `<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3H4V5.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v18a3 3 0 0 1 3-3h3V5.5Z"/>`,
  sound: `<path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10"/>`,
  play: `<path d="m8 5 11 7-11 7V5Z"/>`,
  pause: `<path d="M8 5v14M16 5v14"/>`,
  refresh: `<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 8a7 7 0 0 1 11.2-2L20 9M4 15l2.7 3a7 7 0 0 0 11.2-2"/>`,
  mic: `<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 10a6 6 0 0 0 12 0M12 16v5M9 21h6"/>`,
  check: `<path d="m5 12 4 4L19 6"/>`,
  arrow: `<path d="m8 5 7 7-7 7"/>`,
  message: `<path d="M4 5h16v11H8l-4 4V5Z"/>`,
  target: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m14 10 6-6"/>`,
  star: `<path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 2.8Z"/>`,
  pin: `<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>`,
  passport: `<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="11" r="4"/><path d="M8 11h8M12 7c1.2 1.2 1.8 2.5 1.8 4S13.2 13.8 12 15M12 7c-1.2 1.2-1.8 2.5-1.8 4s.6 2.8 1.8 4"/>`,
  sofa: `<path d="M5 12V9a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 9v3"/><path d="M4 11a2 2 0 0 0-2 2v4h20v-4a2 2 0 0 0-2-2M5 17v2M19 17v2M12 7v5"/>`,
  cup: `<path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 4c0 1 1 1 1 2M12 4c0 1 1 1 1 2"/>`,
  sun: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  moon: `<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>`,
  user: `<circle cx="12" cy="8" r="4"/><path d="M4 21c.7-5 3.3-7 8-7s7.3 2 8 7"/>`,
  bookmark: `<path d="M7 4h10v16l-5-3-5 3V4Z"/>`,
  bulb: `<path d="M9 18h6M10 22h4"/><path d="M8.5 14.5A6 6 0 1 1 15.5 14.5C14.5 15.3 14 16.2 14 18h-4c0-1.8-.5-2.7-1.5-3.5Z"/>`,
  globe: `<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.2 2.4 3.3 5.4 3.3 9S14.2 18.6 12 21M12 3C9.8 5.4 8.7 8.4 8.7 12s1.1 6.6 3.3 9"/>`,
  scene: `<rect x="4" y="7" width="16" height="12" rx="2"/><path d="M4 11h16M6 7l3-4M11 7l3-4M16 7l3-4"/>`,
};

let dialoguePlaybackRate = 0.92;
let activePlaybackButton = null;
let activeRecorder = null;
let activeRecordButton = null;
let flashSwipeStartX = 0;
let flashSwipeStartY = 0;
let flashSwipeHandled = false;
const recordedLineUrls = new WeakMap();
const speakingRecordingUrls = new Map();

if (typeof window !== "undefined") {
  window.hablaLesson = {
    next: advanceLesson,
    previous: previousLessonStep,
    goTo: goToLessonStep,
    choose: chooseLessonOption,
    flipCard: flipFlashcard,
    nextCard: nextFlashcard,
    previousCard: previousFlashcard,
    rateCard: rateFlashcard,
    flashTap: handleFlashcardTap,
    flashSwipeStart: startFlashcardSwipe,
    flashSwipeEnd: endFlashcardSwipe,
    answerQuiz: answerQuizQuestion,
    submitQuiz: submitQuizAnswer,
    nextQuiz: nextQuizQuestion,
    toggleQuizReview: toggleQuizReviewQuestion,
    setListeningPass,
    answerListening: answerListeningQuestion,
    nextListening: nextListeningQuestion,
    playListening: playListeningConversation,
    playDialogue: playDialogueConversation,
    playLine: playDialogueLine,
    setDialogueRate,
    toggleTranslations,
    recordLine: toggleLineRecording,
    hearVocabulary: hearVocabularyItem,
    toggleVocabularyFavorite,
    skipSpeaking: skipSpeakingAttempt,
    replaySpeaking: replaySpeakingAttempt,
    retrySpeaking: retrySpeakingAttempt,
    startSpeakingChallenge,
    nextSpeakingChallenge,
    exitSpeakingChallenge,
    discover: discoverLivingWorldMoment,
    speak: speakSpanish,
    continueLanguageTip,
    finishCompletion: exitLessonCompletion,
  };
}

export function renderLesson() {
  const lesson = getActiveLesson();
  if (!lesson) return renderMissingLesson();

  const progress = getLessonProgress(lesson.id);
  if (progress.completed && progress.showCompletion) return renderLessonCompletion(lesson, progress);
  const steps = buildLessonSteps(lesson);
  const stepIndex = clamp(Number(progress.rendererStep || 0), 0, Math.max(steps.length - 1, 0));
  const step = steps[stepIndex];
  const visibleStepCount = steps.filter(item => !item.legacyCombined).length;
  const visibleStepIndex = Math.max(
    0,
    steps.slice(0, stepIndex + 1).filter(item => !item.legacyCombined).length - 1,
  );
  const isReplay = Boolean(progress.completed && progress.replayStartedAt && !progress.showCompletion);
  const completedStepCount = step?.type === "story" ? 0 : visibleStepIndex;
  const percent = progress.completed && !isReplay
    ? 100
    : Math.round((completedStepCount / Math.max(visibleStepCount, 1)) * 100);

  return `
    <section class="lesson-v2 emotion-${slugify(lesson.emotionalArc?.emotion || "journey")}" aria-label="${escapeAttr(lesson.title)} lesson">
      ${renderLessonHeader(lesson, step, visibleStepIndex, visibleStepCount, percent, progress)}
      <main class="lesson-stage" id="lesson-stage" tabindex="-1">
        ${renderLessonSceneBanner(lesson, step)}
        ${renderStep(step, lesson, progress)}
      </main>
      ${renderLessonControls(step, stepIndex, steps, lesson, progress)}
    </section>
  `;
}

function buildLessonSteps(lesson) {
  const steps = [{ id: "story", label: "Episode Opening", type: "story" }];
  const dialogue = normalizeDialogue(lesson.dialogue || lesson.dialogues);
  const messageThread = dialogue.find(scene => scene.presentation?.type === "messageThread");
  if (messageThread) {
    steps.push({
      id: "messages",
      label: "A Message from Carlos",
      type: "dialogue",
      data: messageThread,
      legacyCombined: true,
    });
  }
  if (lesson.learnerChoices?.options?.length) steps.push({ id: "choice", label: "Choose the Moment", type: "choice" });
  if (lesson.vocabulary?.length) steps.push({ id: "vocabulary", label: "Words You’ll Need", type: "vocabulary" });
  if (lesson.grammar) steps.push({ id: "grammar", label: "Carlos’ Advice", type: "grammar" });
  const standardDialogue = dialogue.find(scene => scene !== messageThread);
  if (standardDialogue) steps.push({ id: "dialogue", label: "Watch Carlos", type: "dialogue", data: standardDialogue });
  if (lesson.listening || lesson.listeningPhrases?.length) {
    steps.push({
      id: "listening",
      label: "Watch Carlos",
      type: "listening",
      data: standardDialogue || messageThread,
      legacyCombined: Boolean(standardDialogue),
    });
  }
  if (lesson.pronunciation || lesson.pronunciationExercises?.length) steps.push({ id: "pronunciation", label: "Say It Naturally", type: "pronunciation" });
  if (lesson.speaking || lesson.speakingChallenge?.length) steps.push({ id: "speaking", label: "Your Turn", type: "speaking" });
  if (getFlashcardItems(lesson).length) steps.push({ id: "flashcards", label: "Keep It Fresh", type: "flashcards" });
  if (lesson.quiz?.length) steps.push({ id: "quiz", label: "Can You Remember?", type: "quiz" });
  if (lesson.miniConversation || lesson.realLifeMission) steps.push({ id: "conversation", label: "Today’s Mission", type: "conversation" });
  if (lesson.culture || lesson.worldBuilding?.length || lesson.livingWorldInteractions?.length) steps.push({ id: "culture", label: "Madrid Moment", type: "culture" });
  return steps;
}

function renderLessonHeader(lesson, step, visibleStepIndex, visibleStepCount, percent, progress) {
  const isReplay = Boolean(progress.completed && progress.replayStartedAt && !progress.showCompletion);
  const progressLabel = step?.type === "complete" || (progress.completed && !isReplay)
    ? "Complete"
    : step?.type === "story"
      ? "Introduction"
      : `${percent}% complete`;
  return `
    <header class="lesson-v2-header">
      <button class="lesson-back" type="button" ${step?.type === "complete" ? `onclick="hablaLesson.finishCompletion('learn')"` : `data-page="learn"`} aria-label="Back to Learn">${icon("back")}</button>
      <div class="lesson-header-copy">
        <span>Episode ${getLessonNumber(lesson)} · ${escapeHtml(step?.label || "Episode")}</span>
        <strong>${escapeHtml(lesson.title)}</strong>
      </div>
      <span class="lesson-header-count"><strong>${progressLabel}</strong></span>
      <div class="lesson-header-progress" role="progressbar" aria-label="Lesson progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-valuetext="${percent}% complete"><i style="width:${percent}%"></i></div>
    </header>
  `;
}

function renderStep(step, lesson, progress) {
  if (!step) return renderMissingLesson();
  const renderers = {
    story: renderStory,
    messages: renderMessages,
    choice: renderChoice,
    vocabulary: renderVocabulary,
    grammar: renderGrammar,
    dialogue: renderDialogue,
    listening: renderListening,
    pronunciation: renderPronunciation,
    speaking: renderSpeaking,
    flashcards: renderFlashcards,
    quiz: renderQuiz,
    conversation: renderConversation,
    culture: renderCulture,
  };
  return (renderers[step.type] || renderMissingLesson)(lesson, progress, step.data);
}

function renderLessonSceneBanner(lesson, step) {
  if (!step || ["story", "complete", "dialogue", "listening"].includes(step.type)) return "";
  const artwork = preloadLessonArtwork(lesson);
  if (!artwork) return "";
  const labels = {
    messages: "A message from Carlos",
    choice: "Choose the moment",
    vocabulary: "Words you’ll need",
    grammar: "Carlos’ advice",
    dialogue: "Watch Carlos",
    listening: "Watch Carlos",
    pronunciation: "Say it naturally",
    speaking: "Your turn",
    flashcards: "Keep it fresh",
    quiz: "Can you remember?",
    conversation: "Today’s mission",
    culture: "Madrid moment",
  };
  const titles = {
    messages: "A message from Carlos",
    choice: "Choose what happens next",
    vocabulary: String(lesson.story?.openingMissionTitle || lesson.title || "Today’s conversation")
      .replace(/^Have\s+/i, "")
      .replace(/\.$/, ""),
    grammar: lesson.sectionIntros?.grammar?.title || "One useful pattern",
    dialogue: lesson.sectionIntros?.dialogue?.title || "Today’s conversation",
    listening: lesson.sectionIntros?.listening?.title || "Listen carefully",
    pronunciation: lesson.sectionIntros?.pronunciation?.title || "Speak naturally",
    speaking: lesson.sectionIntros?.speaking?.title || "Your turn",
    flashcards: "Keep the mission language close",
    quiz: lesson.sectionIntros?.quiz?.title || "Can you remember?",
    conversation: "Your real-life mission",
    culture: "Life in Madrid",
  };
  const sceneEyebrow = step.type === "vocabulary"
    ? `Episode ${getLessonNumber(lesson)}`
    : `Episode ${getLessonNumber(lesson)} · ${labels[step.type] || step.label}`;
  const sceneBody = step.type === "grammar"
    ? "A quick tip from Carlos before you continue the conversation."
    : "";
  return `
    <article class="lesson-scene-banner scene-${slugify(step.type)}" aria-label="Episode ${getLessonNumber(lesson)} ${escapeAttr(labels[step.type] || step.label)}">
      <img src="${escapeAttr(artwork)}" alt="" aria-hidden="true" loading="eager" decoding="async" onerror="${LESSON_ARTWORK_ONERROR}">
      <span class="lesson-scene-banner-shade"></span>
      <div>
        <small>${escapeHtml(sceneEyebrow)}</small>
        <strong>${escapeHtml(titles[step.type] || step.label)}</strong>
        ${sceneBody ? `<p>${escapeHtml(sceneBody)}</p>` : ""}
      </div>
    </article>
  `;
}

function getSectionIntro(lesson, key, fallback = {}, tokens = {}) {
  const configured = lesson.sectionIntros?.[key] || {};
  const applyTokens = value => Object.entries(tokens).reduce(
    (text, [token, replacement]) => String(text || "").replaceAll(`{{${token}}}`, String(replacement)),
    value
  );
  return {
    eyebrow: applyTokens(configured.eyebrow || fallback.eyebrow || ""),
    title: applyTokens(configured.title || fallback.title || ""),
    body: applyTokens(configured.body || fallback.body || ""),
  };
}

function renderSectionHeading(lesson, key, fallback, tokens = {}) {
  const intro = getSectionIntro(lesson, key, fallback, tokens);
  return `<section class="lesson-section-heading lesson-${slugify(key)}-heading"><span>${escapeHtml(intro.eyebrow)}</span><h1>${escapeHtml(intro.title)}</h1>${intro.body ? `<p>${escapeHtml(intro.body)}</p>` : ""}</section>`;
}

function renderCarlosTransition(lesson, key) {
  const message = lesson.sectionTransitions?.[key];
  if (!message) return "";
  return `<aside class="lesson-carlos-transition"><span>${icon("message")}</span><div><small>Carlos</small><p>${escapeHtml(message)}</p></div></aside>`;
}

function renderStory(lesson) {
  const story = lesson.story || {};
  const intro = lesson.carlosIntroduction || {};
  const artwork = preloadLessonArtwork(lesson);
  const carlosSceneArtwork = preloadEpisodeArtwork(lesson, "cover") || artwork;
  const mission = story.mission || lesson.realLifeMission?.mission || lesson.objectives?.[0];
  const introCopy = getSectionIntro(lesson, "story", {
    eyebrow: story.time || story.location || story.city || "Your Spanish journey",
    title: lesson.title,
    body: story.heroText || mission || "A new conversation with Carlos begins.",
  });
  const missionItems = getOpeningMissionItems(lesson);
  const openingMessage = story.openingCarlosMessage || intro.message || intro.text || mission;
  const openingTitle = story.openingCarlosTitle || intro.title || intro.eyebrow || "Let’s begin";
  const missionTitle = story.openingMissionTitle || mission || "Complete the conversation.";
  const chapterLabel = story.chapter ? `Chapter ${escapeHtml(story.chapter)}` : "Chapter 1";
  const cityLabel = story.city ? escapeHtml(story.city) : "Madrid";
  const locationLabel = story.displayLocation || story.location || story.city || "Madrid";
  return `
    <article class="lesson-story-hero">
      ${artwork ? `<img src="${escapeAttr(artwork)}" alt="${escapeAttr(getEpisodeArtworkAlt(lesson))}" loading="eager" fetchpriority="high" decoding="async" onerror="${LESSON_ARTWORK_ONERROR}">` : ""}
      <div class="lesson-story-shade"></div>
      <div class="lesson-story-copy">
        <small class="lesson-story-chapter">${chapterLabel} · ${cityLabel}</small>
        <h1>${escapeHtml(introCopy.title)}</h1>
        <p>${escapeHtml(introCopy.body)}</p>
        <span class="lesson-story-location">${icon("pin")}<span>${escapeHtml(locationLabel)}</span></span>
      </div>
    </article>
    ${renderMemoryCallback(lesson)}
    <article class="lesson-carlos-intro lesson-opening-carlos">
      <img src="${escapeAttr(carlosSceneArtwork)}" alt="Carlos welcoming you to ${escapeAttr(story.location || story.city || lesson.title)}" onerror="${CARLOS_FALLBACK_ONERROR}">
      <div><span>Carlos</span><h2>${escapeHtml(openingTitle)}</h2><p>${escapeHtml(openingMessage)}</p></div>
      <button type="button" class="lesson-opening-audio" data-speech="${escapeAttr(openingMessage)}" onclick="hablaLesson.speak(this.dataset.speech)" aria-label="Hear Carlos introduce the episode">${icon("sound")}</button>
    </article>
    <article class="lesson-mission-card lesson-opening-mission">
      <span class="lesson-icon">${icon("target")}</span>
      <div class="lesson-opening-mission-copy">
        <small>Today's mission</small>
        <h2>${escapeHtml(missionTitle)}</h2>
        <ul>${missionItems.map(item => `<li>${icon("check")}<span>${escapeHtml(item)}</span></li>`).join("")}</ul>
      </div>
      <button type="button" class="lesson-begin-episode" onclick="hablaLesson.next()"><span>Begin episode</span>${icon("arrow")}</button>
    </article>
  `;
}

function getOpeningMissionItems(lesson) {
  const configured = lesson.story?.openingMissionItems;
  if (Array.isArray(configured) && configured.length) return configured.slice(0, 4);
  const outcomes = lesson.canDo || lesson.objectives || [];
  return outcomes
    .filter(item => !/ask for repetition/i.test(String(item)))
    .slice(0, 4)
    .map(item => String(item).replace(/^I can\s+/i, "").replace(/\.$/, ""));
}

function renderMissionSequence(lesson) {
  if (!lesson.miniMissions?.length) return "";
  return `<section class="lesson-finale-route"><header><span>Episode route</span><h2>${escapeHtml(lesson.missionSequenceTitle || "One day · several small wins")}</h2></header><div>${lesson.miniMissions.map((mission, index) => `<article><i>${String(index + 1).padStart(2, "0")}</i><div><small>${escapeHtml(mission.location || "Madrid")}</small><strong>${escapeHtml(mission.title)}</strong><p>${escapeHtml(mission.goal)}</p></div></article>`).join("")}</div></section>`;
}

function renderMemoryCallback(lesson) {
  for (const callback of lesson.memoryCallbacks || []) {
    const memory = getLessonMemory(callback.sourceLessonId);
    if (!memory) continue;
    const message = callback.byChoice?.[memory.choiceId] || callback.message;
    if (!message) continue;
    return `<article class="lesson-memory-chip"><span>${icon("star")}</span><div><small>Carlos remembers</small><strong>${escapeHtml(message.spanish || message)}</strong>${message.english ? `<p>${escapeHtml(message.english)}</p>` : ""}</div></article>`;
  }
  return "";
}

function renderMessages(lesson, progress, scene) {
  return `
    <article class="lesson-phone-thread" aria-label="Message conversation with Carlos">
      <header><span class="lesson-phone-avatar">C</span><div><strong>${escapeHtml(scene.presentation?.contact || "Carlos")}</strong><small>${escapeHtml(scene.presentation?.status || "Active now")}</small></div></header>
      <div class="lesson-message-list">${(scene.lines || []).map(line => `<div class="lesson-message ${isLearnerSpeaker(line.speaker) ? "outgoing" : "incoming"}"><small>${escapeHtml(displaySpeakerName(line.speaker))}</small><p>${escapeHtml(line.spanish || line.exampleSpanish || line.intent)}</p>${line.english || line.exampleEnglish ? `<span>${escapeHtml(line.english || line.exampleEnglish)}</span>` : ""}${renderSpeechButton(line.spanish || line.exampleSpanish, line.speaker, "Hear phrase")}</div>`).join("")}</div>
    </article>
  `;
}

function renderChoice(lesson, progress) {
  const choices = lesson.learnerChoices;
  const selectedId = progress.selectedChoiceId || getLessonMemory(lesson.id)?.choiceId;
  const selected = choices.options.find(choice => choice.id === selectedId);
  return `
    <section class="lesson-section-heading lesson-choice-heading"><span>Carlos asks</span><h1>${escapeHtml(choices.prompt || "What do you choose?")}</h1>${choices.promptEnglish ? `<p class="lesson-choice-translation">${escapeHtml(choices.promptEnglish)}</p>` : ""}<p class="lesson-choice-guidance">The language goal stays the same. You decide how this moment unfolds.</p></section>
    <div class="lesson-choice-grid">
      ${choices.options.map(choice => `<button type="button" class="lesson-choice-card ${choice.id === selectedId ? "selected" : ""}" aria-pressed="${choice.id === selectedId}" aria-label="Choose ${escapeAttr(choice.label || choice.learnerEnglish)}: ${escapeAttr(choice.learnerSpanish)}" onclick="hablaLesson.choose('${escapeAttr(choice.id)}')"><span>${renderChoiceIcon(choice.icon || choice.id)}</span><strong>${escapeHtml(choice.label || choice.learnerEnglish)}</strong><small>${escapeHtml(choice.learnerSpanish)}</small>${choice.id === selectedId ? icon("check") : ""}</button>`).join("")}
    </div>
    ${selected ? `<article class="lesson-choice-response" aria-live="polite"><span class="lesson-phone-avatar">C</span><div><small>${escapeHtml(choices.responseLabel || "Carlos responds")}</small><h2>${escapeHtml(selected.carlosSpanish)}</h2><p>${escapeHtml(selected.carlosEnglish)}</p><button type="button" data-speech="${escapeAttr(selected.carlosSpanish)}" onclick="hablaLesson.speak(this.dataset.speech)" aria-label="Play Carlos: ${escapeAttr(selected.carlosSpanish)}">${icon("sound")} Hear Carlos</button></div></article>` : `<p class="lesson-choice-hint">Choose one to continue the story.</p>`}
  `;
}

function renderVocabulary(lesson, progress) {
  const selectedId = progress.selectedChoiceId || getLessonMemory(lesson.id)?.choiceId;
  const selected = lesson.learnerChoices?.options?.find(choice => choice.id === selectedId);
  const prioritized = prioritizeVocabulary(lesson.vocabulary || [], selected);
  const vocabularyCount = Array.isArray(lesson.vocabulary) ? lesson.vocabulary.length : 0;
  const readyVocabularyCount = prioritized.filter(item => {
    const key = `${lesson.id}:${slugify(item.spanish)}`;
    const status = progress.rendererVocabularyStatus?.[key] || {};
    return Boolean(status.heard || status.repeated);
  }).length;
  const presentation = lesson.vocabularyPresentation || {};
  const renderCards = items => items.map(item => {
    const priority = item.learningPriority || (presentation.showPriorityLabels ? (item.tier > 1 ? "Good to know" : "Required") : "");
    const vocabularyKey = `${lesson.id}:${slugify(item.spanish)}`;
    const dialogueContext = getVocabularyDialogueContext(lesson, item);
    const vocabularyStatus = progress.rendererVocabularyStatus?.[vocabularyKey] || {};
    const isSaved = getSavedVocabularyPhrases().some(saved => saved.key === vocabularyKey);
    const contextChips = getVocabularyContextChips(item);
    return `
      <article class="lesson-vocab-item ${item.tier > 1 ? "optional" : ""}" data-vocabulary-card="${escapeAttr(vocabularyKey)}">
        <header class="lesson-vocab-card-head">
          <span class="lesson-vocab-context-icon">${renderChoiceIcon(inferVocabularyIcon(item))}</span>
          <div class="lesson-vocab-word">
            ${priority ? `<small class="lesson-vocab-priority">${escapeHtml(priority)}</small>` : ""}
            <strong>${escapeHtml(item.spanish)}</strong>
            <span>${escapeHtml(item.english)}</span>
          </div>
          <div class="lesson-vocab-actions">
            <button type="button" data-vocabulary-key="${escapeAttr(vocabularyKey)}" data-speech="${escapeAttr(item.spanish)}" onclick="hablaLesson.hearVocabulary(this)" aria-label="Hear ${escapeAttr(item.spanish)} in Spanish">${icon("sound")}<span>Listen</span></button>
          </div>
        </header>
        ${renderVocabularyDialogue(dialogueContext, item)}
        <footer class="lesson-vocab-footer">
          <button type="button" class="lesson-vocab-save ${isSaved ? "is-saved" : ""}" data-vocabulary-key="${escapeAttr(vocabularyKey)}" data-spanish="${escapeAttr(item.spanish)}" data-english="${escapeAttr(item.english)}" data-example-spanish="${escapeAttr(item.exampleSpanish || "")}" data-example-english="${escapeAttr(item.exampleEnglish || "")}" onclick="hablaLesson.toggleVocabularyFavorite(this)" aria-pressed="${isSaved}" aria-label="${isSaved ? "Remove" : "Favorite"} ${escapeAttr(item.spanish)} ${isSaved ? "from" : "for"} Practice" title="${isSaved ? "Remove from Practice favorites" : "Favorite for Practice"}">${icon("star")}<span class="sr-only">${isSaved ? "Favorited" : "Favorite"}</span></button>
          ${contextChips.length ? `<span class="lesson-vocab-meta-chip">${icon(getVocabularyChipIcon(contextChips[0]))}${escapeHtml(contextChips[0])}</span>` : ""}
          ${item.tier <= 1 ? `<span class="lesson-vocab-essential-chip">${icon("star")} Essential</span>` : ""}
          <span class="lesson-vocab-learning-status ${vocabularyStatus.heard || vocabularyStatus.repeated ? "is-heard" : ""}" data-vocab-learning-status>${vocabularyStatus.heard || vocabularyStatus.repeated ? `${icon("check")} Learned` : ""}</span>
          <span class="lesson-vocab-scene-chip">${icon("scene")} ${dialogueContext ? `Scene ${dialogueContext.sceneNumber}` : "Next scene"}</span>
        </footer>
      </article>`;
  }).join("");
  let vocabularyGroupNumber = 0;
  const renderGroups = items => Object.entries(groupBy(items, item => item.group || "Useful words")).map(([group, groupItems]) => {
    vocabularyGroupNumber += 1;
    const groupNumber = vocabularyGroupNumber;
    const groupContext = getVocabularyGroupContext(group);
    const groupIcon = presentation.groupIcons?.[group];
    const groupIconMarkup = groupIcon && ICONS[groupIcon] ? icon(groupIcon) : renderChoiceIcon(inferVocabularyGroupIcon(group));
    const groupComplete = groupItems.every(item => {
      const key = `${lesson.id}:${slugify(item.spanish)}`;
      const status = progress.rendererVocabularyStatus?.[key] || {};
      return Boolean(status.heard || status.repeated);
    });
    const groupOutcome = getVocabularyGroupOutcome(group);
    const outcome = groupComplete ? `<p class="lesson-vocab-group-outcome">${icon("check")}${escapeHtml(groupOutcome)}</p>` : "";
    const cardGrid = `<div class="lesson-vocab-grid" data-vocab-group-grid data-group-outcome="${escapeAttr(groupOutcome)}">${renderCards(groupItems)}</div>`;
    if (!presentation.collapseGroups) return `<section><header class="lesson-vocab-section-header"><b>${String(groupNumber).padStart(2, "0")}</b><span>${groupIconMarkup}</span><div><h2>${escapeHtml(group)}</h2><p>${escapeHtml(groupContext)}</p></div></header>${cardGrid}${outcome}</section>`;
    const expanded = presentation.openFirstGroup && groupNumber === 1 ? " open" : "";
    return `<details class="lesson-vocab-group"${expanded}><summary><b>${String(groupNumber).padStart(2, "0")}</b><i>${groupIconMarkup}</i><span><strong>${escapeHtml(group)}</strong><small>${escapeHtml(groupContext)}</small></span><em>${groupItems.length} ${groupItems.length === 1 ? "word" : "words"}</em>${icon("arrow")}</summary>${cardGrid}${outcome}</details>`;
  }).join("");
  const required = presentation.collapseOptional ? prioritized.filter(item => item.tier <= 1) : prioritized;
  const optional = presentation.collapseOptional ? prioritized.filter(item => item.tier > 1) : [];
  return `
    <article class="lesson-vocab-prep ${readyVocabularyCount >= vocabularyCount && vocabularyCount ? "is-ready" : ""}" data-vocab-readiness data-vocab-total="${vocabularyCount}">
      <div><small>Conversation readiness</small><strong><span data-vocab-ready-count>${readyVocabularyCount}</span> / ${vocabularyCount} ready</strong><progress class="lesson-vocab-readiness-track" aria-label="Vocabulary ready for the conversation" max="${Math.max(vocabularyCount, 1)}" value="${readyVocabularyCount}">${readyVocabularyCount} of ${vocabularyCount}</progress></div>
      <span>${icon("message")}</span>
    </article>
    <div class="lesson-vocab-groups">${renderGroups(required)}</div>
    ${optional.length ? `<details class="lesson-vocab-optional"><summary><span><small>Optional vocabulary</small><strong>Good to know</strong></span><b>${optional.length} words</b>${icon("arrow")}</summary><div class="lesson-vocab-groups">${renderGroups(optional)}</div></details>` : ""}
  `;
}

function getVocabularyGroupContext(group) {
  const normalized = String(group || "").toLowerCase();
  if (/open|greet/.test(normalized)) return "Start the conversation naturally.";
  if (/introduc|name|identity/.test(normalized)) return "Introduce yourself with confidence.";
  if (/response|feeling|reaction|check/.test(normalized)) return "Keep the conversation going.";
  if (/clos|goodbye|farewell/.test(normalized)) return "End the exchange naturally.";
  if (/polite|repair/.test(normalized)) return "Stay friendly when you need help.";
  if (/question|ask/.test(normalized)) return "Use these when you need an answer.";
  if (/family/.test(normalized)) return "Talk about the people close to you.";
  if (/time|day|plan/.test(normalized)) return "Use these to make the plan together.";
  if (/food|drink|fruit|bakery|dairy|shopping/.test(normalized)) return "Use these inside today’s scene.";
  return "Language you’ll hear and use today.";
}

function getVocabularyGroupOutcome(group) {
  const normalized = String(group || "").toLowerCase();
  if (/open|greet/.test(normalized)) return "Carlos can greet you now.";
  if (/introduc|name|identity/.test(normalized)) return "Carlos knows who you are.";
  if (/response|feeling|reaction|check/.test(normalized)) return "The conversation is flowing.";
  if (/clos|goodbye|farewell/.test(normalized)) return "You can finish the scene naturally.";
  if (/polite|repair/.test(normalized)) return "You can keep going when something is unclear.";
  return "You’re ready for this part of the scene.";
}

function renderVocabularyDialogue(context, item) {
  if (context?.lines?.length) {
    const line = context.lines[0];
    return `<div class="lesson-vocab-dialogue"><p><small>${escapeHtml(displaySpeakerName(line.speaker))}</small><b>${escapeHtml(line.spanish)}</b>${line.english ? `<em>${escapeHtml(line.english)}</em>` : ""}</p></div>`;
  }
  if (!item.exampleSpanish) return "";
  return `<div class="lesson-vocab-dialogue"><p><small>In today’s conversation</small><b>${escapeHtml(item.exampleSpanish)}</b><em>${escapeHtml(item.exampleEnglish)}</em></p></div>`;
}

function getVocabularyDialogueContext(lesson, item) {
  const target = normalize(item.spanish);
  if (!target) return null;
  const scenes = normalizeDialogue(lesson.dialogue || lesson.dialogues);
  for (let sceneIndex = 0; sceneIndex < scenes.length; sceneIndex += 1) {
    const lines = scenes[sceneIndex]?.lines || [];
    const lineIndex = lines.findIndex(line => {
      const phrase = normalize(line.spanish || line.exampleSpanish || "");
      if (!phrase) return false;
      return phrase === target
        || ` ${phrase} `.includes(` ${target} `)
        || (target.length > 6 && ` ${target} `.includes(` ${phrase} `));
    });
    if (lineIndex < 0) continue;
    const first = lines[lineIndex];
    const second = lines.slice(lineIndex + 1).find(line => isLearnerSpeaker(line.speaker) !== isLearnerSpeaker(first.speaker));
    return {
      sceneNumber: sceneIndex + 1,
      lines: [first, second].filter(Boolean).map(line => ({
        speaker: line.speaker,
        spanish: line.spanish || line.exampleSpanish,
        english: line.english || line.exampleEnglish || "",
      })),
    };
  }
  return null;
}

function inferVocabularyIcon(item) {
  if (item.icon) return item.icon;
  const phrase = normalize(item.spanish);
  if (phrase === "hola" || /adios|hasta|nos vemos/.test(phrase)) return "wave";
  if (/buenos dias|manana/.test(phrase)) return "morning";
  if (/buenas tardes|tarde/.test(phrase)) return "afternoon";
  if (/buenas noches|noche/.test(phrase)) return "evening";
  if (/mucho gusto|encantad|gracias|por favor/.test(phrase)) return "handshake";
  if (/bien|perfecto|claro/.test(phrase)) return "smile";
  if (/cafe/.test(phrase)) return "coffee-cup";
  if (/pan/.test(phrase)) return "bread-loaf";
  if (/queso/.test(phrase)) return "cheese";
  if (/manzana/.test(phrase)) return "apple";
  if (/tomate/.test(phrase)) return "tomato";
  return item.partOfSpeech === "question" ? "choice" : "smile";
}

function inferVocabularyGroupIcon(group) {
  const normalized = String(group || "").toLowerCase();
  if (/open|greet|clos|goodbye|farewell/.test(normalized)) return "wave";
  if (/introduc|name|identity|polite/.test(normalized)) return "handshake";
  if (/response|feeling|reaction|check/.test(normalized)) return "smile";
  if (/morning/.test(normalized)) return "morning";
  if (/afternoon|time|plan/.test(normalized)) return "afternoon";
  if (/night|evening/.test(normalized)) return "evening";
  if (/cafe|drink/.test(normalized)) return "coffee-cup";
  if (/food|fruit|produce/.test(normalized)) return "apple";
  return "choice";
}

function getVocabularyContextChips(item) {
  const tip = String(item.tip || "").toLowerCase();
  const group = String(item.group || "").toLowerCase();
  if (/formal/.test(tip) && !/informal/.test(tip)) return ["Formal"];
  if (/informal|friend|family/.test(tip)) return ["Friends"];
  if (/morning/.test(tip) || /morning/.test(group)) return ["Morning"];
  if (/afternoon|midday/.test(tip)) return ["Afternoon"];
  if (/night|evening/.test(tip)) return ["Evening"];
  if (/café|cafe|coffee/.test(`${tip} ${group}`)) return ["Café"];
  return item.tier <= 1 ? ["Spain"] : [];
}

function getVocabularyChipIcon(chip) {
  if (chip === "Morning" || chip === "Afternoon" || chip === "Evening") return "clock";
  if (chip === "Café") return "cup";
  if (chip === "Friends" || chip === "Formal") return "user";
  return "globe";
}

function renderGrammar(lesson) {
  const grammar = lesson.grammar || {};
  const examples = grammar.examples || [];
  const primary = examples[0] || getLanguageTipPhrase(grammar.comparison?.[0]);
  const secondary = examples[1] || getLanguageTipPhrase(grammar.comparison?.[1] || grammar.comparison?.[0]);
  const notes = grammar.notes || [];
  const city = lesson.story?.city || "Madrid";
  const coachTip = grammar.carlosTip
    || `In this scene, I’d start with “${primary?.spanish || primary?.text || grammar.topic || ""}” Try it once with me—it’s the phrase you’ll need next.`;
  const primarySpanish = primary?.spanish || primary?.text || grammar.topic || "";
  const primaryEnglish = primary?.english || primary?.meaning || grammar.meaning || "";
  const secondarySpanish = secondary?.spanish || secondary?.text || secondary?.word || "";
  const secondaryEnglish = secondary?.english || secondary?.meaning || "";
  const madridTip = grammar.madridTip
    || `If you remember one phrase today, make it “${primarySpanish}” It will sound natural in ${city}.`;
  const readyQuestion = grammar.readyQuestion || getLanguageTipReadyQuestion(lesson);
  return `
    <article class="lesson-language-coach">
      <img src="${escapeAttr(getCarlosAsset("speaking"))}" alt="Carlos sharing a language tip" onerror="${CARLOS_FALLBACK_ONERROR}">
      <div>
        <small>${icon("message")} Carlos says</small>
        <blockquote>${escapeHtml(coachTip)}</blockquote>
      </div>
      <button type="button" data-speech="${escapeAttr(coachTip)}" data-speaker="Carlos" data-idle-icon="sound" onclick="hablaLesson.playLine(this)" aria-pressed="false" aria-label="Hear Carlos give this advice">
        <span data-playback-icon>${icon("sound")}</span><span class="sr-only" data-playback-label>Hear Carlos</span>
      </button>
    </article>
    <div class="lesson-language-phrases ${secondarySpanish ? "" : "single"}">
      <article class="lesson-language-primary">
        <small>${icon("star")} Learn this first</small>
        <strong>${escapeHtml(primarySpanish)}</strong>
        <p>${escapeHtml(primaryEnglish)}</p>
        <div>
          ${notes.slice(0, 2).map(note => `<span>${icon("check")}${escapeHtml(note.title)}</span>`).join("")}
        </div>
        <button type="button" data-speech="${escapeAttr(primarySpanish)}" data-speaker="Carlos" data-idle-icon="sound" onclick="hablaLesson.playLine(this)" aria-pressed="false" aria-label="Hear ${escapeAttr(primarySpanish)}"><span data-playback-icon>${icon("sound")}</span><span data-playback-label>Listen</span></button>
      </article>
      ${secondarySpanish ? `<article class="lesson-language-secondary">
        <small>Later you’ll also hear</small>
        <strong>${escapeHtml(secondarySpanish)}</strong>
        <p>${escapeHtml(secondaryEnglish)}</p>
        <span>${icon("user")}${escapeHtml(notes[1]?.title || "You’ll hear this later.")}</span>
        <button type="button" data-speech="${escapeAttr(secondarySpanish)}" data-speaker="Carlos" data-idle-icon="sound" onclick="hablaLesson.playLine(this)" aria-pressed="false" aria-label="Hear ${escapeAttr(secondarySpanish)}"><span data-playback-icon>${icon("sound")}</span><span data-playback-label>Listen</span></button>
      </article>` : ""}
    </div>
    <aside class="lesson-language-city-tip">
      <span>${icon("globe")}</span>
      <div><small>${escapeHtml(city)} tip</small><p>${escapeHtml(madridTip)}</p></div>
    </aside>
    <section class="lesson-language-ready ${readyQuestion ? "has-question" : ""}">
      <span>${icon("check")}</span>
      <div>
        <small>One last thing…</small>
        ${readyQuestion
          ? `<p>Carlos is about to ask:</p><strong>${escapeHtml(readyQuestion)}</strong><em>Can you answer without looking?</em>`
          : `<strong>Perfect. You’re ready!</strong><p>${escapeHtml(lesson.sectionTransitions?.grammar || "Carlos is waiting in the next scene.")}</p>`}
      </div>
      <button type="button" onclick="hablaLesson.continueLanguageTip(this)"><span data-handoff-label>Continue Conversation</span>${icon("arrow")}</button>
    </section>
  `;
}

function continueLanguageTip(button) {
  const readyCard = button?.closest(".lesson-language-ready");
  if (!readyCard || button.disabled) return;
  if (prefersReducedMotion()) {
    advanceLesson();
    return;
  }

  button.disabled = true;
  readyCard.setAttribute("aria-busy", "true");
  readyCard.classList.add("is-continuing");
  const label = button.querySelector("[data-handoff-label]");
  if (label) label.textContent = "Carlos is waiting…";
  window.setTimeout(advanceLesson, 360);
}

function getLanguageTipPhrase(source) {
  if (!source) return null;
  return {
    spanish: source.exampleSpanish || source.spanish || source.text || source.word || "",
    english: source.exampleEnglish || source.english || source.meaning || "",
  };
}

function getLanguageTipReadyQuestion(lesson) {
  const scenes = normalizeDialogue(lesson.dialogue || lesson.dialogues)
    .filter(scene => scene.presentation?.type !== "messageThread");
  for (const scene of scenes) {
    for (const line of scene.lines || []) {
      if (isLearnerSpeaker(line.speaker)) continue;
      const spanish = String(line.spanish || line.exampleSpanish || "");
      const question = spanish.match(/¿[^?]+\?/u)?.[0];
      if (question) return question;
    }
  }
  return "";
}

function renderDialogue(lesson, progress, scene) {
  const selectedId = progress.selectedChoiceId || getLessonMemory(lesson.id)?.choiceId;
  const selected = lesson.learnerChoices?.options?.find(choice => choice.id === selectedId);
  const compactChoice = Boolean(lesson.dialoguePresentation?.compactChoicePreview);
  const intro = getSectionIntro(lesson, "dialogue", {
    eyebrow: "Part 1 · Guided dialogue",
    title: "Your first café conversation",
    body: "Listen, repeat, and answer Carlos one line at a time.",
  });
  return `
    <section class="lesson-conversation-module">
      <div class="lesson-conversation-intro">
        <div class="lesson-section-heading">
          <span>Part 1 · Guided dialogue</span>
          <h1>${escapeHtml(intro.title)}</h1>
          ${intro.body ? `<p>${escapeHtml(intro.body)}</p>` : ""}
        </div>
        <div class="lesson-conversation-toolbar">
          <button class="lesson-play-full" type="button" onclick="hablaLesson.playDialogue(this)" aria-pressed="false">
            <span data-playback-icon>${icon("play")}</span><b data-playback-label>Play full conversation</b>
          </button>
          <div class="lesson-speed-control" role="group" aria-label="Conversation playback speed">
            <button type="button" data-dialogue-speed="0.8" onclick="hablaLesson.setDialogueRate(this, .8)" aria-pressed="false">0.8×</button>
            <button type="button" class="active" data-dialogue-speed="0.92" onclick="hablaLesson.setDialogueRate(this, .92)" aria-pressed="true">1×</button>
          </div>
          <button class="lesson-translation-toggle" type="button" onclick="hablaLesson.toggleTranslations(this)" aria-pressed="true">
            English translations: <strong>On</strong>
          </button>
        </div>
      </div>
      ${selected ? compactChoice
        ? `<article class="lesson-branch-banner compact"><small>Your choice is part of this scene</small><p>You chose ${escapeHtml(String(selected.label || "this").toLowerCase())}. The conversation below uses your order: <strong>${escapeHtml(selected.modelOrder)}</strong></p></article>`
        : `<article class="lesson-branch-banner"><header><small>Your choice in this conversation</small><h2>See how your earlier choice changes the scene</h2><p>The full conversation continues below with your version included.</p></header><div class="lesson-branch-turn learner"><small>You can say</small><strong>${escapeHtml(selected.modelOrder)}</strong>${selected.modelOrderEnglish ? `<p>${escapeHtml(selected.modelOrderEnglish)}</p>` : ""}</div><div class="lesson-branch-turn carlos"><small>Carlos answers</small><strong>${escapeHtml(selected.carlosSpanish)}</strong>${selected.carlosEnglish ? `<p>${escapeHtml(selected.carlosEnglish)}</p>` : ""}</div></article>`
        : ""}
      ${scene.languageNote ? `<article class="lesson-language-note"><span>${icon("message")}</span><div><small>${escapeHtml(scene.languageNote.title || "Language note")}</small><p>${escapeHtml(scene.languageNote.text || "")}</p></div></article>` : ""}
      <div class="lesson-dialogue-list">${renderDialogueLines(scene.lines || [], selected)}</div>
      ${renderCarlosTransition(lesson, "dialogue")}
      <div class="lesson-conversation-divider">
        <span>Part 2 · Listen & understand</span>
        <p>Hear the same conversation with less help each time.</p>
      </div>
      ${renderListeningPasses(lesson, progress)}
    </section>
  `;
}

function renderDialogueLines(lines, selected) {
  let currentScene = "";
  return lines.map((line, index) => {
      const sceneName = String(line.scene || "").trim();
      const divider = sceneName && sceneName !== currentScene
        ? `<div class="lesson-scene-divider"><span>${escapeHtml(sceneName)}</span></div>`
        : "";
      if (sceneName) currentScene = sceneName;
      const resolved = resolveDialogueLine(line, selected);
      const learner = isLearnerSpeaker(line.speaker);
      const speakerName = displaySpeakerName(line.speaker);
      return `${divider}<article class="lesson-dialogue-line ${learner ? "learner" : ""}" data-dialogue-line-index="${index}">
        ${renderDialogueAvatar(line.speaker)}
        <div class="lesson-dialogue-copy">
          <small>${learner ? `Your turn · ${escapeHtml(speakerName)}` : escapeHtml(speakerName)}</small>
          <strong>${escapeHtml(resolved.spanish)}</strong>
          ${resolved.english ? `<p class="lesson-dialogue-translation">${escapeHtml(resolved.english)}</p>` : ""}
          ${learner ? `<div class="lesson-learner-actions">
            <button type="button" onclick="hablaLesson.playLine(this.closest('article').querySelector('[data-dialogue-audio]'))">${icon("sound")} Hear it</button>
            <button type="button" class="lesson-record-line" onclick="hablaLesson.recordLine(this)" aria-pressed="false">${icon("mic")}<span>Say it</span></button>
            <span class="lesson-record-status sr-only" aria-live="polite"></span>
          </div>` : ""}
        </div>
        ${renderDialogueAudioButton(resolved.spanish, line.speaker, `Hear ${learner ? "your model line" : speakerName}`)}
      </article>`;
    }).join("");
}

function renderListening(lesson, progress, scene) {
  const dialogue = scene || normalizeDialogue(lesson.dialogue || lesson.dialogues).find(item => item.presentation?.type !== "messageThread");
  return renderDialogue(lesson, progress, dialogue || { lines: [] });
}

function renderListeningPasses(lesson, progress) {
  const listening = normalizeFirst(lesson.listening) || {};
  const transcript = listening.transcript || normalizeDialogue(lesson.dialogue || lesson.dialogues)[0]?.lines || [];
  const script = listening.naturalScript || transcript.map(line => line.spanish).join(" ");
  const slowScript = String(listening.slowScript || script).replaceAll("/", "");
  const questions = getListeningQuestions(lesson);
  const state = progress.rendererListening || { pass: 0, questionIndex: 0, selected: null, complete: false };
  const pass = clamp(Number(state.pass || 0), 0, 2);
  const questionIndex = clamp(Number(state.questionIndex || 0), 0, Math.max(questions.length - 1, 0));
  const question = questions[questionIndex];
  const options = question ? stableShuffle(question.options || [], `${lesson.id}:listening:${questionIndex}`) : [];
  const answered = state.selected !== null && state.selected !== undefined;
  const stageLabels = listening.stageLabels || ["Listen only", "Read along", "Check understanding"];
  const stageDescriptions = [
    "Listen to the full conversation without reading.",
    "Follow the transcript at natural or slow speed.",
    "Answer a few questions to confirm what you understood.",
  ];
  return `
    ${listening.soundscape ? `<article class="lesson-soundscape"><span>${icon("sound")}</span><div><small>${escapeHtml(listening.soundscape.label || "Scene atmosphere")}</small><p>${escapeHtml(listening.soundscape.description || listening.soundscape)}</p></div></article>` : ""}
    <nav class="lesson-listening-progress" aria-label="Listening steps" tabindex="0">
      ${stageLabels.map((label, index) => `<button type="button" class="${pass === index ? "active" : ""} ${pass > index || state.complete ? "done" : ""}" onclick="hablaLesson.setListeningPass(${index})" ${pass === index ? 'aria-current="step"' : ""} aria-label="Listening pass ${index + 1}: ${escapeAttr(label)}"><i>${pass > index || state.complete ? icon("check") : index + 1}</i><span><strong>${escapeHtml(label)}</strong><small>${escapeHtml(stageDescriptions[index])}</small></span><em>${pass === index ? "Current" : pass > index || state.complete ? "Complete" : "Open"}</em></button>`).join("")}
    </nav>
    ${pass === 0 ? `
      <article class="lesson-listening-coach">
        <img src="${escapeAttr(getCarlosAsset("speaking"))}" alt="Carlos guiding your listening practice" onerror="${CARLOS_FALLBACK_ONERROR}">
        <div><small>Pass 1 · Listen only</small><h2>Listen once.</h2><p>Don’t worry if you miss words. Just follow the conversation.</p></div>
        <button type="button" onclick="hablaLesson.playListening(this, 0.92)" aria-pressed="false" aria-label="Play the conversation at natural speed"><span data-playback-icon>${icon("play")}</span><span data-playback-label>Play conversation</span></button>
      </article>
      <button class="lesson-listening-next" type="button" onclick="hablaLesson.setListeningPass(1)">Follow with the transcript${icon("arrow")}</button>
    ` : ""}
    ${pass === 1 ? `
      <article class="lesson-listening-transcript">
        <header><div><small>Pass 2 · Read along</small><h2>Read while each person speaks</h2></div><div class="lesson-playback-buttons"><button type="button" onclick="hablaLesson.playListening(this, 0.92)" aria-pressed="false" aria-label="Play the conversation at natural speed"><span data-playback-icon>${icon("play")}</span><span data-playback-label>Natural</span></button><button type="button" onclick="hablaLesson.playListening(this, 0.78)" aria-pressed="false" aria-label="Play the conversation slowly"><span data-playback-icon>${icon("play")}</span><span data-playback-label>Slow</span></button></div></header>
        <div class="lesson-listen-list">${transcript.map((line, index) => `<article class="${isLearnerSpeaker(line.speaker) ? "learner" : "speaker"}" data-listening-line-index="${index}">${renderDialogueAvatar(line.speaker)}<div><small>${escapeHtml(displaySpeakerName(line.speaker || "Carlos"))}</small><strong>${escapeHtml(line.spanish)}</strong><span class="lesson-dialogue-translation">${escapeHtml(line.english || "")}</span></div>${renderDialogueAudioButton(line.spanish, line.speaker, `Replay ${displaySpeakerName(line.speaker || "Carlos")}'s line`)}</article>`).join("")}</div>
      </article>
      <button class="lesson-listening-next" type="button" onclick="hablaLesson.setListeningPass(2)">Check what you understood${icon("arrow")}</button>
    ` : ""}
    ${pass === 2 ? `
      <article class="lesson-listening-check">
        <header><small>Pass 3 · Check understanding</small><span>${questions.length ? `${questionIndex + 1} of ${questions.length}` : "Complete"}</span></header>
        ${question ? `<h2>${escapeHtml(question.prompt)}</h2><div class="lesson-listening-options">${options.map((option, optionIndex) => `<button type="button" class="${answered && option === question.answer ? "correct" : ""} ${answered && option === state.selected && option !== question.answer ? "wrong" : ""}" onclick="hablaLesson.answerListening(${optionIndex})" ${answered ? "disabled" : ""}><span>${String.fromCharCode(65 + optionIndex)}</span>${escapeHtml(option)}${answered && option === question.answer ? icon("check") : ""}</button>`).join("")}</div>${answered ? `<div class="lesson-listening-feedback"><strong>${state.selected === question.answer ? "You followed it." : `Answer: ${escapeHtml(question.answer)}`}</strong><p>${escapeHtml(question.explanation || "Listen once more and keep following the conversation.")}</p>${state.complete ? `<span class="lesson-listening-complete">${icon("check")} Listening complete</span>` : `<button type="button" onclick="hablaLesson.nextListening()">${questionIndex + 1 >= questions.length ? "Finish listening" : "Next question"}${icon("arrow")}</button>`}</div>` : ""}` : `<p>No listening questions are available.</p>`}
      </article>
    ` : ""}
  `;
}

function renderPronunciation(lesson) {
  const pronunciation = normalizeFirst(lesson.pronunciation) || {};
  const items = pronunciation.items || lesson.pronunciationExercises || pronunciation.exercises || [];
  const timeline = pronunciation.presentation === "dayTimeline";
  const finalPractice = getPronunciationFinalPractice(lesson, pronunciation, items);
  return `
    <aside class="lesson-pronunciation-tip"><span>${icon("star")}</span><div><strong>Listen, then speak</strong><p>Hear Carlos once, then record yourself.</p></div></aside>
    <div class="lesson-pronunciation-list ${timeline ? "day-timeline" : ""}">
      ${items.map((item, index) => renderPronunciationCard(item, index, timeline)).join("")}
    </div>
    ${finalPractice ? renderPronunciationFinalPractice(finalPractice) : ""}
  `;
}

function renderPronunciationCard(item, index, timeline) {
  const text = item.text || item.spanish || item.phrase || "";
  const meaning = item.meaning || item.english || "";
  const label = timeline && item.icon && ICONS[item.icon]
    ? icon(item.icon)
    : String(index + 1).padStart(2, "0");
  return `
    <article class="lesson-pronunciation-card" data-pronunciation-line-index="${index}">
      <span class="lesson-pronunciation-number">${label}</span>
      <div class="lesson-pronunciation-copy">
        ${item.moment ? `<em>${escapeHtml(item.moment)}</em>` : ""}
        <strong>${escapeHtml(text)}</strong>
        ${meaning ? `<p>${escapeHtml(meaning)}</p>` : ""}
        <small>${renderPronunciationTip(item.note || "Say it once slowly, then naturally.")}</small>
      </div>
      <div class="lesson-pronunciation-actions">
        <button class="lesson-pronunciation-hear" type="button" data-speech="${escapeAttr(text)}" data-speaker="Carlos" onclick="hablaLesson.playLine(this)" aria-pressed="false" aria-label="Hear Carlos say ${escapeAttr(text)}">
          <span data-playback-icon>${icon("sound")}</span><span data-playback-label>Hear Carlos</span>
        </button>
        <button class="lesson-pronunciation-record lesson-record-line" type="button" onclick="hablaLesson.recordLine(this)" aria-pressed="false" aria-label="Record yourself saying ${escapeAttr(text)}">
          ${icon("mic")}<span>Say it</span>
        </button>
        <span class="lesson-record-status" aria-live="polite">Your recording will stay on this page.</span>
      </div>
    </article>
  `;
}

function renderPronunciationFinalPractice(practice) {
  return `
    <section class="lesson-pronunciation-final">
      <header><span>${icon("star")}</span><strong>Put it together</strong></header>
      <article class="lesson-pronunciation-card lesson-pronunciation-final-card">
        <span class="lesson-pronunciation-number">${icon("message")}</span>
        <div class="lesson-pronunciation-copy">
          <strong>${escapeHtml(practice.text)}</strong>
          ${practice.meaning ? `<p>${escapeHtml(practice.meaning)}</p>` : ""}
          <small>${escapeHtml(practice.note || "Bring today’s phrases together in one natural response.")}</small>
        </div>
        <div class="lesson-pronunciation-actions">
          <button class="lesson-pronunciation-hear" type="button" data-speech="${escapeAttr(practice.text)}" data-speaker="Carlos" onclick="hablaLesson.playLine(this)" aria-pressed="false">
            <span data-playback-icon>${icon("sound")}</span><span data-playback-label>Hear Carlos</span>
          </button>
          <button class="lesson-pronunciation-record lesson-record-line" type="button" onclick="hablaLesson.recordLine(this)" aria-pressed="false">
            ${icon("mic")}<span>Say the full line</span>
          </button>
          <span class="lesson-record-status" aria-live="polite">Record the complete thought, then play it back.</span>
        </div>
      </article>
    </section>
  `;
}

function getPronunciationFinalPractice(lesson, pronunciation, items) {
  const configured = pronunciation.putItTogether || pronunciation.finalPractice || pronunciation.fullLine;
  if (typeof configured === "string") return { text: configured };
  if (configured?.text || configured?.spanish || configured?.phrase) {
    return {
      text: configured.text || configured.spanish || configured.phrase,
      meaning: configured.meaning || configured.english || "",
      note: configured.note || "",
    };
  }

  const speaking = normalizeFirst(lesson.speaking) || {};
  const candidates = (speaking.items || lesson.speakingChallenge || [])
    .filter(item => item?.text)
    .map(item => {
      const text = String(item.text);
      const normalizedText = normalize(text);
      const overlap = items.reduce((score, phrase) => {
        const phraseText = normalize(phrase.text || phrase.spanish || phrase.phrase || "");
        return score + (phraseText && normalizedText.includes(phraseText) ? 1 : 0);
      }, 0);
      const score = overlap * 12
        + (item.stage === "personalize" ? 18 : 0)
        + Math.min(text.length, 80) / 10
        - (text.includes("...") ? 50 : 0);
      return {
        text,
        meaning: item.meaning || item.english || "",
        note: item.focus || "Bring today’s phrases together in one natural response.",
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  if (candidates[0]) return candidates[0];
  const fallback = items.findLast?.(item => item.text || item.spanish || item.phrase)
    || [...items].reverse().find(item => item.text || item.spanish || item.phrase);
  return fallback
    ? {
      text: fallback.text || fallback.spanish || fallback.phrase,
      meaning: fallback.meaning || fallback.english || "",
      note: fallback.note || "",
    }
    : null;
}

function renderPronunciationTip(value) {
  return escapeHtml(value).replace(
    /(^|[^A-ZÁÉÍÓÚÜÑ])([A-ZÁÉÍÓÚÜÑ]{2,}(?:-[A-ZÁÉÍÓÚÜÑ]{2,})*)(?=$|[^A-ZÁÉÍÓÚÜÑ])/g,
    "$1<mark>$2</mark>",
  );
}

function renderSpeaking(lesson, progress) {
  const speaking = normalizeFirst(lesson.speaking) || {};
  const items = speaking.items || lesson.speakingChallenge || [];
  const stageLabels = ["Listen", "Your turn", "Keep talking", "One more challenge", "Finish the conversation"];
  const index = clamp(Number(progress.guidedSpeakingIndex || 0), 0, Math.max(items.length - 1, 0));
  const challenge = progress.rendererSpeakingChallenge || {};
  if (challenge.active) return renderSpeakingChallenge(lesson, progress, speaking, items, challenge);
  const selectedId = progress.selectedChoiceId || getLessonMemory(lesson.id)?.choiceId;
  const selected = lesson.learnerChoices?.options?.find(choice => choice.id === selectedId);
  const sourceItem = items[index];
  const choiceItem = selected && sourceItem?.byChoice?.[selected.id]
    ? { ...sourceItem, ...sourceItem.byChoice[selected.id] }
    : sourceItem;
  const item = choiceItem?.responseFromChoice && selected ? {
    ...choiceItem,
    text: `${selected.learnerSpanish} ${selected.modelOrder}`,
    meaning: `${selected.learnerEnglish} ${selected.modelOrderEnglish || ""}`,
  } : choiceItem;
  if (!item) return `<p>No guided conversation prompts are available.</p>`;
  const attempt = getSpeakingAttempt(progress, index);
  const attempted = Boolean(attempt?.attempted || attempt?.skipped);
  const speaker = item.speaker || "Carlos";
  const speakerName = displaySpeakerName(speaker);
  const recordingKey = getSpeakingRecordingKey(lesson.id, index);
  const hasRecording = speakingRecordingUrls.has(recordingKey);
  return `
    ${index === 0 ? renderCarlosTransition(lesson, "listening") : ""}
    <aside class="lesson-speaking-tip"><span>${icon("star")}</span><div><strong>Speak naturally</strong><p>Carlos is listening for meaning, not perfection.</p></div></aside>
    ${renderSpeakingHistory(items, index, progress, lesson)}
    <nav class="lesson-speaking-exchange-progress" aria-label="Conversation exchanges">
      ${items.map((stage, stageIndex) => {
        const complete = stageIndex < index || Boolean(getSpeakingAttempt(progress, stageIndex)?.attempted || getSpeakingAttempt(progress, stageIndex)?.skipped);
        return `<span class="${stageIndex === index ? "active" : ""} ${complete ? "complete" : ""}"><i>${complete && stageIndex !== index ? icon("check") : stageIndex + 1}</i><small>${escapeHtml(stage.label || stageLabels[stageIndex] || `Exchange ${stageIndex + 1}`)}</small></span>`;
      }).join("")}
    </nav>
    <div class="lesson-speaking-path">
      <article class="lesson-speaking-exchange stage-${escapeAttr(item.stage || (index < 2 ? "repeat" : "personalize"))} ${attempted ? "has-attempt" : ""}">
        <header><i>${index + 1}</i><div><small>Exchange ${index + 1} of ${items.length}</small><strong>${escapeHtml(item.label || stageLabels[index] || "Keep talking")}</strong></div></header>
        <div class="lesson-speaking-prompt">
          ${renderDialogueAvatar(speaker)}
          <div><small>${escapeHtml(speakerName)} says</small><h2>${escapeHtml(item.carlosPrompt || item.prompt)}</h2>${item.carlosPromptEnglish ? `<p>${escapeHtml(item.carlosPromptEnglish)}</p>` : ""}</div>
          <button type="button" data-speech="${escapeAttr(item.carlosPrompt || item.text || "")}" data-speaker="${escapeAttr(speaker)}" onclick="hablaLesson.playLine(this)" aria-pressed="false" aria-label="Hear ${escapeAttr(speakerName)}"><span data-playback-icon>${icon("sound")}</span><span class="sr-only" data-playback-label>Hear ${escapeHtml(speakerName)}</span></button>
        </div>
        <div class="lesson-speaking-turn">
          ${renderLearnerAvatar()}
          <div><small>Your turn</small><strong>${escapeHtml(item.prompt)}</strong><p>${escapeHtml(item.cue || "Say your answer aloud.")}</p></div>
          <button class="lesson-speaking-record lesson-record-line" type="button" data-speaking-attempt-index="${index}" data-recording-key="${escapeAttr(recordingKey)}" onclick="hablaLesson.recordLine(this)" aria-pressed="false">
            ${icon("mic")}<span>${hasRecording ? "Replay my answer" : attempted ? "Answer again" : "Tap to answer"}</span>
          </button>
          <span class="lesson-record-status" aria-live="polite">${attempted ? getSpeakingFeedback(item, index, attempt) : "Tap to speak · Take your time"}</span>
        </div>
        <div class="lesson-speaking-after ${attempted ? "is-visible" : ""}" aria-hidden="${attempted ? "false" : "true"}">
          <small>After you speak</small>
          <div>
            <button type="button" onclick="hablaLesson.replaySpeaking(this)" ${hasRecording ? "" : "disabled"}>${icon("play")} Replay my answer</button>
            <button type="button" onclick="hablaLesson.retrySpeaking(this)">${icon("clock")} Try again</button>
            <button type="button" class="continue" onclick="hablaLesson.next()">${icon("arrow")} ${index + 1 >= items.length ? "Finish" : "Continue"}</button>
          </div>
        </div>
        <details class="lesson-speaking-model">
          <summary>Need help?</summary>
          <small>Suggested answer</small>
          <button type="button" data-speech="${escapeAttr(item.text || item.exampleAnswer || "")}" data-speaker="Model" onclick="hablaLesson.playLine(this)" aria-pressed="false"><strong>${escapeHtml(item.text || item.exampleAnswer || "Create your own answer")}</strong><span data-playback-icon>${icon("sound")}</span><span class="sr-only" data-playback-label>Play suggested answer</span></button>
          ${item.meaning ? `<p>${escapeHtml(item.meaning)}</p>` : ""}
          ${renderSpeakingAlternatives(item.alternatives, index + 1 >= items.length)}
        </details>
        ${attempted ? "" : `<button class="lesson-speaking-skip" type="button" onclick="hablaLesson.skipSpeaking()">Can’t use the microphone? Skip this attempt</button>`}
      </article>
    </div>
    ${index + 1 >= items.length && attempted ? renderSpeakingFinalChallenge(lesson, progress, items) : ""}
  `;
}

function renderSpeakingAlternatives(alternatives, showAll = false) {
  if (!Array.isArray(alternatives) || !alternatives.length) return "";
  return `<div class="lesson-speaking-alternatives"><small>Also natural</small>${alternatives.slice(0, showAll ? alternatives.length : 1).map(alternative => {
    const text = typeof alternative === "string" ? alternative : alternative?.spanish;
    if (!text) return "";
    return `<button type="button" data-speech="${escapeAttr(text)}" onclick="hablaLesson.speak(this.dataset.speech, .82, 'Model')"><span>${escapeHtml(text)}</span>${icon("sound")}</button>`;
  }).join("")}</div>`;
}

function renderSpeakingHistory(items, currentIndex, progress, lesson) {
  if (currentIndex <= 0) return "";
  const start = Math.max(0, currentIndex - 2);
  const exchanges = items.slice(start, currentIndex);
  return `
    <details class="lesson-speaking-history" open>
      <summary>Your conversation so far</summary>
      <div>
        ${exchanges.map((item, offset) => {
          const index = start + offset;
          const resolvedItem = resolveSpeakingItemForChoice(lesson, progress, item);
          const speaker = resolvedItem.speaker || "Carlos";
          const answered = getSpeakingAttempt(progress, index);
          return `
            <span>${renderDialogueAvatar(speaker)}<b>${escapeHtml(displaySpeakerName(speaker))}:</b> ${escapeHtml(resolvedItem.carlosPrompt || resolvedItem.prompt || "")}</span>
            <span>${renderLearnerAvatar()}<b>You:</b> ${answered?.skipped ? "Continued without recording" : "Answered aloud"}${speakingRecordingUrls.has(getSpeakingRecordingKey(lesson.id, index)) ? ` <button type="button" onclick="hablaLesson.replaySpeaking(this)" data-history-speaking-index="${index}" aria-label="Replay your previous answer">${icon("play")}</button>` : ""}</span>
          `;
        }).join("")}
      </div>
    </details>
  `;
}

function renderSpeakingFinalChallenge(lesson, progress, items) {
  const challenge = progress.rendererSpeakingChallenge || {};
  return `
    <article class="lesson-speaking-final">
      <span>${icon(challenge.complete ? "check" : "star")}</span>
      <div>
        <strong>${challenge.complete ? "Conversation challenge complete!" : getLessonNumber(lesson) === 1 ? "Your first conversation is complete!" : "Conversation complete!"}</strong>
        <p>${challenge.complete ? "You kept the conversation moving without opening the model." : "Now try it once without the model and see how much you remember."}</p>
      </div>
      ${challenge.complete
        ? `<button type="button" onclick="hablaLesson.next()">Continue lesson${icon("arrow")}</button>`
        : `<button type="button" onclick="hablaLesson.startSpeakingChallenge()">Try it now${icon("play")}</button>`}
    </article>
  `;
}

function renderSpeakingChallenge(lesson, progress, speaking, items, challenge) {
  const index = clamp(Number(challenge.index || 0), 0, Math.max(items.length - 1, 0));
  const item = resolveSpeakingItemForChoice(lesson, progress, items[index]);
  const attempted = Boolean(challenge.attempts?.[index]);
  const recordingKey = getSpeakingRecordingKey(lesson.id, index, true);
  const hasRecording = speakingRecordingUrls.has(recordingKey);
  const speaker = item?.speaker || "Carlos";
  if (!item) return `<p>No conversation challenge prompts are available.</p>`;
  return `
    <section class="lesson-speaking-challenge">
      <header>
        <span>Final conversation</span>
        <h1>Try it without help</h1>
        <p>Carlos will give you each prompt. Answer from memory, then continue.</p>
      </header>
      <div class="lesson-speaking-challenge-progress" aria-label="Challenge prompt ${index + 1} of ${items.length}">
        ${items.map((_entry, itemIndex) => `<i class="${itemIndex < index ? "complete" : ""} ${itemIndex === index ? "active" : ""}"></i>`).join("")}
      </div>
      <article class="lesson-speaking-exchange ${attempted ? "has-attempt" : ""}">
        <div class="lesson-speaking-prompt">
          ${renderDialogueAvatar(speaker)}
          <div><small>${escapeHtml(displaySpeakerName(speaker))} says</small><h2>${escapeHtml(item.carlosPrompt || item.prompt)}</h2>${item.carlosPromptEnglish ? `<p>${escapeHtml(item.carlosPromptEnglish)}</p>` : ""}</div>
          <button type="button" data-speech="${escapeAttr(item.carlosPrompt || item.prompt || "")}" data-speaker="${escapeAttr(speaker)}" onclick="hablaLesson.playLine(this)" aria-pressed="false"><span data-playback-icon>${icon("sound")}</span><span class="sr-only" data-playback-label>Hear prompt</span></button>
        </div>
        <div class="lesson-speaking-turn">
          ${renderLearnerAvatar()}
          <div><small>Your turn</small><strong>Answer without opening a model.</strong><p>Use any natural answer that keeps the conversation moving.</p></div>
          <button class="lesson-speaking-record lesson-record-line" type="button" data-speaking-challenge-index="${index}" data-recording-key="${escapeAttr(recordingKey)}" onclick="hablaLesson.recordLine(this)" aria-pressed="false">${icon("mic")}<span>${hasRecording ? "Replay my answer" : "Tap to answer"}</span></button>
          <span class="lesson-record-status" aria-live="polite">${attempted ? "That worked—Carlos understood you." : "No model this time. Trust what you remember."}</span>
        </div>
      </article>
      <footer>
        <button type="button" class="secondary" onclick="hablaLesson.exitSpeakingChallenge()">Exit challenge</button>
        <button type="button" class="primary" onclick="hablaLesson.nextSpeakingChallenge()" ${attempted ? "" : "disabled"}>${index + 1 >= items.length ? "Complete challenge" : "Next prompt"}${icon("arrow")}</button>
      </footer>
    </section>
  `;
}

function resolveSpeakingItemForChoice(lesson, progress, sourceItem) {
  const selectedId = progress.selectedChoiceId || getLessonMemory(lesson.id)?.choiceId;
  const selected = lesson.learnerChoices?.options?.find(choice => choice.id === selectedId);
  const choiceItem = selected && sourceItem?.byChoice?.[selected.id]
    ? { ...sourceItem, ...sourceItem.byChoice[selected.id] }
    : sourceItem;
  return choiceItem?.responseFromChoice && selected
    ? {
      ...choiceItem,
      text: `${selected.learnerSpanish} ${selected.modelOrder}`,
      meaning: `${selected.learnerEnglish} ${selected.modelOrderEnglish || ""}`,
    }
    : choiceItem;
}

function getSpeakingAttempt(progress, index) {
  return progress.guidedSpeakingAttempts?.[index] || null;
}

function getSpeakingRecordingKey(lessonId, index, challenge = false) {
  return `${lessonId}:${challenge ? "challenge" : "guided"}:${index}`;
}

function getSpeakingFeedback(item, index, attempt) {
  if (attempt?.skipped) return "Skipped—continue when you’re ready.";
  if (item.feedback) return item.feedback;
  if (item.stage === "personalize") return "Good—you made the answer your own.";
  if (item.stage === "recall" || index >= 2) return "That works. Carlos understood you.";
  return index === 1 ? "Nice—your introduction was clear." : "Nice—your answer was clear.";
}

function renderFlashcards(lesson, progress) {
  const cards = getAdaptiveFlashcards(lesson, progress.selectedChoiceId, progress);
  const index = clamp(Number(progress.flashcardIndex || 0), 0, Math.max(cards.length - 1, 0));
  const card = cards[index] || { spanish: "", english: "" };
  const flipped = Boolean(progress.flashcardFlipped);
  const percent = cards.length ? Math.round(((index + 1) / cards.length) * 100) : 0;
  return `
    <div class="lesson-flash-progress"><span>Card ${index + 1} of ${cards.length}</span><i><b style="width:${percent}%"></b></i></div>
    <button
      class="lesson-flashcard ${flipped ? "flipped" : ""}"
      type="button"
      onclick="hablaLesson.flashTap()"
      onpointerdown="hablaLesson.flashSwipeStart(event)"
      onpointerup="hablaLesson.flashSwipeEnd(event)"
      aria-label="${flipped ? "Show Spanish side" : "Reveal English translation"}"
    >
      <small>${flipped ? "English" : "Spanish"}</small>
      <strong>${escapeHtml(flipped ? card.english : card.spanish)}</strong>
      ${flipped ? `
        <span class="lesson-flashcard-source">${escapeHtml(card.spanish)}</span>
        <span class="lesson-flashcard-example">
          <b>${escapeHtml(card.exampleSpanish)}</b>
          <em>${escapeHtml(card.exampleEnglish)}</em>
        </span>
      ` : ""}
      <span class="lesson-flashcard-flip">${icon("refresh")} ${flipped ? "Tap to see Spanish" : "Tap to reveal"}</span>
    </button>
    <div class="lesson-flash-actions ${flipped ? "is-revealed" : ""}">
      <button type="button" data-speech="${escapeAttr(card.spanish)}" onclick="hablaLesson.speak(this.dataset.speech)" aria-label="Hear ${escapeAttr(card.spanish)} in Spanish">${icon("sound")} ${flipped ? "Hear Spanish again" : "Hear Spanish"}</button>
      ${flipped ? `
        <button type="button" class="needs-practice" onclick="hablaLesson.rateCard('again')">${icon("refresh")} Need practice</button>
        <button type="button" class="got-it" onclick="hablaLesson.rateCard('got-it')">${icon("check")} Got it!</button>
      ` : `<button type="button" onclick="hablaLesson.nextCard()">${index + 1 >= cards.length ? "Start again" : "Next card"}${icon("arrow")}</button>`}
    </div>
    <div class="lesson-flash-swipe-hint">
      <button type="button" onclick="hablaLesson.previousCard()" ${cards.length < 2 ? "disabled" : ""}>${icon("back")} Previous</button>
      <span>Swipe left for next · Swipe right for previous</span>
    </div>
  `;
}

function renderQuiz(lesson, progress) {
  const questions = lesson.quiz || [];
  const quiz = getRendererQuiz(lesson, progress);
  const index = clamp(Number(quiz.index || 0), 0, Math.max(questions.length - 1, 0));
  const question = questions[index];
  if (!question) return `<p>No quiz questions are available.</p>`;
  const options = stableShuffle(question.options || [], `${lesson.id}:${index}`);
  const answered = quiz.selected !== null && quiz.selected !== undefined;
  const correctAnswer = answered && isQuizAnswerCorrect(quiz.selected, question.answer);
  const answeredCount = index + (answered ? 1 : 0);
  const presentation = getQuizPresentation(question, answered);
  const reviewKey = getQuizReviewKey(question, index);
  const savedForReview = Boolean(progress.quizReviewFlags?.[reviewKey]);
  const progressPercent = Math.round(((index + 1) / questions.length) * 100);
  return `
    <article class="lesson-quiz-card quiz-kind-${escapeAttr(presentation.kind)}">
      <div class="lesson-quiz-status">
        <span>Question ${index + 1} of ${questions.length}</span>
        <strong>Score: ${quiz.score || 0} / ${answeredCount}</strong>
      </div>
      <div class="lesson-quiz-progress" role="progressbar" aria-label="Quiz progress" aria-valuemin="0" aria-valuemax="${questions.length}" aria-valuenow="${index + 1}">
        <i style="width:${progressPercent}%"></i>
      </div>
      <div class="lesson-quiz-question">
        <small>${escapeHtml(presentation.label)}</small>
        <div>
          <h2>${escapeHtml(question.prompt)}</h2>
          ${presentation.audioText ? `<button type="button" class="lesson-quiz-audio" data-speech="${escapeAttr(presentation.audioText)}" data-speaker="Carlos" data-idle-icon="sound" onclick="hablaLesson.playLine(this)" aria-label="Hear the Spanish in this question" aria-pressed="false"><span data-playback-icon>${icon("sound")}</span></button>` : ""}
        </div>
      </div>
      <div class="lesson-quiz-options">
        ${options.length ? options.map((option, optionIndex) => {
          const correct = answered && isQuizAnswerCorrect(option, question.answer);
          const wrong = answered && option === quiz.selected && !isQuizAnswerCorrect(option, question.answer);
          const optionLength = String(option || "").length;
          const lengthClass = optionLength > 90 ? "is-very-long" : optionLength > 55 ? "is-long" : "";
          return `<button type="button" class="${lengthClass} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}" onclick="hablaLesson.answerQuiz(${optionIndex})" ${answered ? "disabled" : ""}><span>${String.fromCharCode(65 + optionIndex)}</span><b>${escapeHtml(option)}</b>${correct ? icon("check") : wrong ? `<span class="lesson-quiz-wrong-mark" aria-hidden="true">×</span>` : ""}</button>`;
        }).join("") : `<form class="lesson-quiz-input" onsubmit="event.preventDefault();hablaLesson.submitQuiz(this.elements.answer.value)"><label for="lesson-quiz-answer">Type your answer</label><div><input id="lesson-quiz-answer" name="answer" type="text" autocomplete="off" autocapitalize="sentences" ${answered ? "disabled" : ""} value="${answered ? escapeAttr(quiz.selected) : ""}" placeholder="Your answer"><button type="submit" ${answered ? "disabled" : ""}>Check answer${icon("arrow")}</button></div></form>`}
      </div>
      ${answered ? `
        <div class="lesson-quiz-feedback ${correctAnswer ? "correct" : "incorrect"}" role="status" aria-live="polite">
          <span>${correctAnswer ? icon("check") : "×"}</span>
          <div>
            <strong>${correctAnswer ? "¡Correcto!" : "Not quite."}</strong>
            ${correctAnswer ? "" : `<small>The correct answer is ${escapeHtml(question.answer)}.</small>`}
            <p>${escapeHtml(question.explanation || "")}</p>
          </div>
        </div>
        <button type="button" class="lesson-quiz-next" onclick="hablaLesson.nextQuiz()">${index + 1 >= questions.length ? "Finish quiz" : "Next question"}${icon("arrow")}</button>
        <button type="button" class="lesson-quiz-review ${savedForReview ? "is-saved" : ""}" onclick="hablaLesson.toggleQuizReview()" aria-pressed="${savedForReview}">${icon("bookmark")}<span>${savedForReview ? "Saved for review" : "Save for review"}</span></button>
      ` : ""}
    </article>
  `;
}

function renderConversation(lesson, progress) {
  const conversation = lesson.miniConversation || lesson.realLifeMission || {};
  const mission = lesson.realLifeMission || {};
  const selectedId = progress.selectedChoiceId || getLessonMemory(lesson.id)?.choiceId;
  const selected = lesson.learnerChoices?.options?.find(choice => choice.id === selectedId);
  const turns = conversation.turns || [];
  return `
    <article class="lesson-challenge-brief"><span>${icon("target")}</span><div><small>Your goal</small><h2>${escapeHtml(conversation.title || mission.title || "Complete the mission")}</h2><p>${escapeHtml(conversation.goal || conversation.mission || mission.mission || "Use what you learned in one complete exchange.")}</p></div></article>
    ${selected ? `<article class="lesson-memory-chip"><span>${renderChoiceIcon(selected.icon || selected.id)}</span><div><small>${escapeHtml(lesson.learnerChoices?.memoryLabel || "Carlos remembers")}</small><strong>${escapeHtml(selected.memoryCallback || `You picked ${String(selected.label || "this").toLowerCase()} first. I’ll remember that.`)}</strong></div></article>` : ""}
    ${turns.length ? `<div class="lesson-conversation">${turns.map(turn => {
      const resolved = resolveDialogueLine(turn, selected);
      return `<article class="${isLearnerSpeaker(turn.speaker) ? "learner" : "carlos"}"><small>${escapeHtml(displaySpeakerName(turn.speaker))}</small><strong>${escapeHtml(resolved.spanish)}</strong>${resolved.english ? `<p>${escapeHtml(resolved.english)}</p>` : ""}${renderSpeechButton(resolved.spanish, turn.speaker, `Hear ${isLearnerSpeaker(turn.speaker) ? "your model line" : displaySpeakerName(turn.speaker)}`)}</article>`;
    }).join("")}</div>` : ""}
    ${mission.successPresentation === "emotional"
      ? `<article class="lesson-success-emotional"><span>${icon("check")}</span><small>${escapeHtml(mission.successTitle || "Mission complete")}</small><h2>${escapeHtml(mission.successHeadline || "You did it.")}</h2><blockquote>${escapeHtml(mission.successCarlos || mission.completionResponse || "Carlos celebrates the conversation you completed.")}</blockquote>${(mission.successMoments || []).length ? `<div>${mission.successMoments.map(item => `<b>${icon("check")}${escapeHtml(item)}</b>`).join("")}</div>` : ""}</article>`
      : `<article class="lesson-success-criteria"><h2>${escapeHtml(mission.successTitle || "Mission success")}</h2><ul>${(mission.successCriteria || []).map(item => `<li>${icon("check")}${escapeHtml(item)}</li>`).join("")}</ul><p>${escapeHtml(mission.completionResponse || "Carlos celebrates the conversation you completed.")}</p></article>`}
  `;
}

function renderCulture(lesson) {
  const culture = lesson.culture || {};
  const presentation = lesson.culturePresentation || {};
  const discoveries = new Map(getLessonDiscoveries(lesson.id).map(item => [item.id, item]));
  const worldBuilding = lesson.worldBuilding || [];
  const nativeSpeech = lesson.nativeSpeech || [];
  const commonMistakes = lesson.commonMistakes || [];
  const worldContent = worldBuilding.length ? `<div class="lesson-world-notes">${worldBuilding.map(note => `<article><span>${icon(note.icon && ICONS[note.icon] ? note.icon : "message")}</span><div><small>${escapeHtml(note.moment)}</small><strong>${escapeHtml(note.carlosSpanish)}</strong><p>${escapeHtml(note.carlosEnglish)}</p></div><button type="button" data-speech="${escapeAttr(note.carlosSpanish)}" onclick="hablaLesson.speak(this.dataset.speech)" aria-label="Hear Carlos: ${escapeAttr(note.carlosSpanish)}">${icon("sound")}</button></article>`).join("")}</div>` : "";
  const nativeLabel = presentation.nativeSpeechLabel || "You may also hear";
  const nativeContent = nativeSpeech.length ? `<article class="lesson-native-note"><small>${escapeHtml(nativeLabel)}</small>${nativeSpeech.map(note => `<div><strong>${escapeHtml(note.phrase)}</strong><span>${escapeHtml(note.meaning)}</span><p>${escapeHtml(note.note)}</p></div>`).join("")}</article>` : "";
  const mistakesContent = commonMistakes.length ? `<div class="lesson-mistake-list">${commonMistakes.map(note => `<article><small>Instead of</small><del>${escapeHtml(note.mistake)}</del><strong>${escapeHtml(note.better)}</strong><p>${escapeHtml(note.why)}</p></article>`).join("")}</div>` : "";
  const regionalContent = (culture.regionalNotes || []).length ? `<div class="lesson-regional-notes">${culture.regionalNotes.map(note => `<article><small>${escapeHtml(note.label)}</small><strong>${escapeHtml(note.phrase)}</strong><p>${escapeHtml(note.text)}</p></article>`).join("")}</div>` : "";
  const discoveryContent = (lesson.livingWorldInteractions || []).length ? `<div class="lesson-discoveries">${lesson.livingWorldInteractions.map(discovery => {
    const found = discoveries.get(discovery.id);
    return `<article class="${found ? "discovered" : ""}">${discovery.image ? `<img class="lesson-discovery-image" src="${escapeAttr(discovery.image)}" alt="${escapeAttr(discovery.title)}" loading="lazy">` : ""}<div><small>${found ? escapeHtml(discovery.savedEyebrow || "Travel journal moment") : escapeHtml(discovery.eyebrow || "Discover more")}</small><h2>${escapeHtml(discovery.title)}</h2>${found ? `<strong>${escapeHtml(discovery.carlosSpanish)}</strong><p>${escapeHtml(discovery.carlosEnglish)}</p>` : `<p>${escapeHtml(discovery.prompt || "Look a little closer.")}</p>`}</div><button type="button" onclick="hablaLesson.discover('${escapeAttr(discovery.id)}')" ${found ? "disabled" : ""}>${found ? icon("check") : icon("star")}<span>${found ? escapeHtml(discovery.savedLabel || "New memory added") : "Explore"}</span></button></article>`;
  }).join("")}</div>` : "";
  const extraCount = worldBuilding.length + nativeSpeech.length + commonMistakes.length + (culture.regionalNotes || []).length + (lesson.livingWorldInteractions || []).length;
  const phrases = lesson.essentialPhrases || [];
  const firstPhrase = phrases[0]?.spanish || "";
  const secondPhrase = phrases.find(item => /gusto/i.test(item.spanish || ""))?.spanish || phrases[1]?.spanish || "";
  const takeaway = culture.keyTakeaway || presentation.keyTakeaway || [firstPhrase, secondPhrase].filter(Boolean).join(" → ");
  return `
    ${culture.text ? `<article class="lesson-culture-quote"><small>${escapeHtml(culture.speaker || "Carlos")}</small><blockquote>${escapeHtml(culture.text)}</blockquote>${takeaway ? `<div class="lesson-culture-takeaway"><span>${icon("bulb")}</span><div><small>Key takeaway</small><strong>${escapeHtml(takeaway)}</strong></div></div>` : ""}</article>` : ""}
    ${extraCount ? `<details class="lesson-culture-extras"><summary><span><small>Optional</small><strong>Explore more</strong></span><b>${extraCount}</b>${icon("arrow")}</summary><div>${worldContent}${regionalContent}${discoveryContent}${nativeContent}${mistakesContent}</div></details>` : ""}
  `;
}

function getLessonClosing(lesson) {
  const choiceId = getLessonMemory(lesson.id)?.choiceId;
  return lesson.carlosClosingByChoice?.[choiceId]
    || lesson.carlosClosing
    || lesson.realLifeMission?.completionResponse
    || "You used Spanish successfully in a real situation.";
}

function renderChapterPostcard(ceremony) {
  const postcard = ceremony?.postcard;
  if (!postcard) return "";

  return `
    <article class="lesson-finale-postcard" aria-label="${escapeAttr(postcard.chapterLabel || "Next chapter")} · ${escapeAttr(postcard.destination || ceremony.nextDestination || "Granada")}">
      <div class="lesson-postcard-stage">
        <div class="lesson-postcard-flip">
          <div class="lesson-postcard-back">
            <span>${icon("passport")}</span>
            <small>Habla · Madrid</small>
          </div>
          <div class="lesson-postcard-front">
            <img src="${escapeAttr(postcard.image)}" alt="${escapeAttr(postcard.alt || `A postcard from ${postcard.destination || ceremony.nextDestination || "Granada"}`)}" loading="eager" onerror="this.hidden=true">
            <div><small>${escapeHtml(postcard.chapterLabel || "Next chapter")}</small><strong>${escapeHtml(postcard.destination || ceremony.nextDestination || "Granada")}</strong></div>
          </div>
        </div>
      </div>
      <div class="lesson-postcard-story">
        <small>${escapeHtml(postcard.eyebrow || "Carlos has one more surprise")}</small>
        <blockquote>${escapeHtml(postcard.carlosSpanish)}</blockquote>
        <p>${escapeHtml(postcard.carlosEnglish)}</p>
        ${postcard.voiceSpanish ? `<aside><button type="button" data-speech="${escapeAttr(postcard.voiceSpanish)}" data-speaker="${escapeAttr(postcard.voiceSpeaker || "Elena")}" onclick="hablaLesson.speak(this.dataset.speech, .8, this.dataset.speaker)" aria-label="Hear ${escapeAttr(postcard.voiceSpeaker || "Elena")}">${icon("sound")}</button><div><small>${escapeHtml(postcard.voiceSpeaker || "A familiar voice")}</small><strong>${escapeHtml(postcard.voiceSpanish)}</strong><p>${escapeHtml(postcard.voiceEnglish)}</p></div></aside>` : ""}
        <b>${escapeHtml(postcard.comingNext || "Coming next")}</b>
      </div>
    </article>
  `;
}

function renderLessonCompletion(lesson, progress = {}) {
  const completionXP = getLessonCompletionXP(lesson);
  const next = getLessonById(lesson.nextLesson);
  const ceremony = lesson.chapterCeremony;
  const visibleStepCount = buildLessonSteps(lesson).filter(item => !item.legacyCombined).length;
  const showAchievement = lesson.achievement && !ceremony?.hideAchievement;
  const showXp = !ceremony?.hideXp;
  const completionTitle = ceremony?.title || lesson.title;
  const completionBody = ceremony?.subtitle
    || lesson.sectionIntros?.reward?.body
    || "Your conversation is now part of your Spanish story.";
  const nextDescription = lesson.microCliffhanger?.english
    || next?.objective
    || next?.objectives?.[0]
    || "Your Spanish journey continues.";
  return `
    <section class="lesson-v2 lesson-completion-screen ${ceremony ? "lesson-finale-screen" : ""}" aria-label="${escapeAttr(completionTitle)} complete" aria-live="polite">
      ${renderLessonHeader(lesson, { label: "Complete", type: "complete" }, visibleStepCount - 1, visibleStepCount, 100, { ...progress, completed: true })}
      <main class="lesson-completion-stage">
        <article class="lesson-completion-card">
          <div class="lesson-completion-glow" aria-hidden="true"></div>
          <header class="lesson-completion-hero">
            <span class="lesson-completion-check">${icon(ceremony ? "passport" : "check")}</span>
            <div>
              <small>${escapeHtml(ceremony?.eyebrow || lesson.completionLabel || "Episode complete")}</small>
              <h1>${escapeHtml(completionTitle)}</h1>
              <p>${escapeHtml(completionBody)}</p>
            </div>
          </header>
          <section class="lesson-completion-carlos">
            <img src="${escapeAttr(getCarlosAsset("celebrating"))}" alt="Carlos celebrating with you" onerror="${CARLOS_FALLBACK_ONERROR}">
            <div>
              <small>Carlos</small>
              <p>${escapeHtml(getLessonClosing(lesson))}</p>
            </div>
          </section>
          ${ceremony ? `<section class="lesson-completion-ceremony"><small>Carlos says</small><blockquote>${escapeHtml(ceremony.carlosSpanish)}</blockquote><p>${escapeHtml(ceremony.carlosEnglish)}</p>${ceremony.journey?.length ? `<div>${ceremony.journey.map(place => `<span>${escapeHtml(place)}</span>`).join("")}</div>` : ""}${ceremony.nextDestination ? `<b>Next destination · ${escapeHtml(ceremony.nextDestination)}</b>` : ""}</section>` : ""}
          <section class="lesson-completion-rewards" aria-label="Unlocked rewards">
            ${lesson.passportStamp ? `<span>${icon("passport")}<small>Passport stamp</small><b>${escapeHtml(lesson.passportStamp.title)} · ${escapeHtml(lesson.passportStamp.city || "España")}</b></span>` : ""}
            ${showAchievement ? `<span>${icon("star")}<small>Achievement</small><b>${escapeHtml(lesson.achievement.title)}</b></span>` : ""}
            ${showXp ? `<span class="lesson-completion-xp"><b>+${completionXP}</b><small>XP earned</small></span>` : ""}
          </section>
          ${ceremony?.postcard ? renderChapterPostcard(ceremony) : ""}
          ${next ? `<section class="lesson-completion-next"><small>Next episode</small><strong>Lesson ${getLessonNumber(next)} · ${escapeHtml(next.title)}</strong><p>${escapeHtml(nextDescription)}</p></section>` : ""}
          <div class="lesson-completion-actions">
            ${next ? `<button class="lesson-completion-primary" type="button" onclick="hablaLesson.finishCompletion('next')">Start next lesson${icon("arrow")}</button>` : ""}
            <button class="lesson-completion-secondary" type="button" onclick="hablaLesson.finishCompletion('learn')">Back to Learn</button>
          </div>
        </article>
      </main>
    </section>
  `;
}

function renderLessonControls(step, stepIndex, steps, lesson, progress) {
  if (step?.type === "story") return "";
  if (step?.type === "grammar") return "";
  if (step?.type === "speaking" && progress.rendererSpeakingChallenge?.active) return "";
  const isLast = stepIndex === steps.length - 1;
  const choiceBlocked = step?.type === "choice" && !progress.selectedChoiceId && !getLessonMemory(lesson.id)?.choiceId;
  const quizBlocked = step?.type === "quiz" && !progress.rendererQuiz?.complete;
  const conversationBlocked = (step?.type === "dialogue" || step?.type === "listening")
    && Boolean(lesson.listening || lesson.listeningPhrases?.length)
    && !progress.rendererListening?.complete;
  const blocked = choiceBlocked || quizBlocked || conversationBlocked;
  const speakingItems = step?.type === "speaking" ? (normalizeFirst(lesson.speaking)?.items || lesson.speakingChallenge || []) : [];
  const guidedIndex = clamp(Number(progress.guidedSpeakingIndex || 0), 0, Math.max(speakingItems.length - 1, 0));
  const speakingBlocked = step?.type === "speaking"
    && !Boolean(getSpeakingAttempt(progress, guidedIndex)?.attempted || getSpeakingAttempt(progress, guidedIndex)?.skipped);
  const blockedWithSpeaking = blocked || speakingBlocked;
  const moreGuidedExchanges = step?.type === "speaking" && guidedIndex < speakingItems.length - 1;
  const backLabel = step?.type === "speaking" && guidedIndex > 0 ? "Previous exchange" : "Back";
  const nextStepIndex = getAdjacentLessonStepIndex(steps, stepIndex, 1);
  const nextStep = steps[nextStepIndex];
  const nextLabel = moreGuidedExchanges
    ? "Next exchange"
    : progress.completed && isLast
    ? "Back to Learn"
    : isLast
      ? "Next · Complete episode"
      : `Next · ${nextStep?.label || "Lesson"}`;
  return `
    <footer class="lesson-controls">
      <button type="button" class="lesson-control-secondary" onclick="hablaLesson.previous()" ${stepIndex === 0 ? "disabled" : ""}>${icon("back")} ${escapeHtml(backLabel)}</button>
      <button type="button" class="lesson-control-primary" onclick="hablaLesson.next()" ${blockedWithSpeaking ? "disabled" : ""}><span>${escapeHtml(nextLabel)}</span>${icon(progress.completed && isLast ? "check" : "arrow")}</button>
    </footer>
  `;
}

function advanceLesson() {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const steps = buildLessonSteps(lesson);
  const progress = getLessonProgress(lesson.id);
  const index = clamp(Number(progress.rendererStep || 0), 0, steps.length - 1);
  const step = steps[index];
  if (step.type === "speaking") {
    const speakingItems = normalizeFirst(lesson.speaking)?.items || lesson.speakingChallenge || [];
    const guidedIndex = clamp(Number(progress.guidedSpeakingIndex || 0), 0, Math.max(speakingItems.length - 1, 0));
    const attempt = getSpeakingAttempt(progress, guidedIndex);
    if (!attempt?.attempted && !attempt?.skipped) return;
    if (guidedIndex < speakingItems.length - 1) {
      updateLessonProgress(lesson.id, { guidedSpeakingIndex: guidedIndex + 1 });
      rerenderLesson(true);
      return;
    }
  }
  if (step.type === "choice" && !progress.selectedChoiceId && !getLessonMemory(lesson.id)?.choiceId) return;
  if (step.type === "quiz" && !progress.rendererQuiz?.complete) return;
  if ((step.type === "dialogue" || step.type === "listening")
    && (lesson.listening || lesson.listeningPhrases?.length)
    && !progress.rendererListening?.complete) return;

  const conversationSections = step.type === "dialogue" || step.type === "listening" ? ["dialogue", "listening"] : [step.id];
  const completedSections = Array.from(new Set([...(progress.completedSections || []), ...conversationSections]));
  if (index >= steps.length - 1) {
    if (!progress.completed) {
      updateLessonProgress(lesson.id, { completedSections, rendererStep: index, showCompletion: true });
      completeLesson(lesson.id);
      evaluateAchievements({ completedLessonsCount: getCourseProgress().completedCount });
      rerenderLesson(true);
    } else {
      document.querySelector('[data-page="learn"]')?.click();
    }
    return;
  }
  updateLessonProgress(lesson.id, {
    completedSections,
    rendererStep: getAdjacentLessonStepIndex(steps, index, 1),
    flashcardFlipped: false,
  });
  rerenderLesson(true);
}

function exitLessonCompletion(destination = "learn") {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const next = getLessonById(lesson.nextLesson);
  updateLessonProgress(lesson.id, { showCompletion: false });
  if (next) setActiveLesson(next.id);
  if (destination === "next" && next) {
    rerenderLesson(true);
    return;
  }
  document.querySelector('[data-page="learn"]')?.click();
}

function previousLessonStep() {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const steps = buildLessonSteps(lesson);
  const currentStep = steps[clamp(Number(progress.rendererStep || 0), 0, Math.max(steps.length - 1, 0))];
  if (currentStep?.type === "speaking" && Number(progress.guidedSpeakingIndex || 0) > 0) {
    updateLessonProgress(lesson.id, { guidedSpeakingIndex: Number(progress.guidedSpeakingIndex) - 1 });
    rerenderLesson(true);
    return;
  }
  const currentIndex = clamp(Number(progress.rendererStep || 0), 0, Math.max(steps.length - 1, 0));
  updateLessonProgress(lesson.id, { rendererStep: getAdjacentLessonStepIndex(steps, currentIndex, -1) });
  rerenderLesson(true);
}

function goToLessonStep(index) {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const steps = buildLessonSteps(lesson);
  const target = clamp(Number(index), 0, steps.length - 1);
  const allowed = progress.completed || target <= Number(progress.rendererStep || 0) || (progress.completedSections || []).includes(steps[target].id);
  if (!allowed) return;
  updateLessonProgress(lesson.id, { rendererStep: target });
  rerenderLesson(true);
}

function chooseLessonOption(choiceId) {
  const lesson = getActiveLesson();
  const choice = lesson?.learnerChoices?.options?.find(item => item.id === choiceId);
  if (!lesson || !choice) return;
  rememberLessonChoice(lesson, choice);
  updateLessonProgress(lesson.id, { selectedChoiceId: choice.id, selectedChoiceAt: new Date().toISOString(), flashcardIndex: 0, flashcardFlipped: false });
  rerenderLesson(false);
}

function flipFlashcard() {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  updateLessonProgress(lesson.id, { flashcardFlipped: !progress.flashcardFlipped });
  rerenderLesson(false);
}

function nextFlashcard() {
  moveFlashcard(1);
}

function previousFlashcard() {
  moveFlashcard(-1);
}

function moveFlashcard(direction) {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const cards = getAdaptiveFlashcards(lesson, progress.selectedChoiceId, progress);
  const currentIndex = clamp(Number(progress.flashcardIndex || 0), 0, Math.max(cards.length - 1, 0));
  const nextIndex = (currentIndex + direction + Math.max(cards.length, 1)) % Math.max(cards.length, 1);
  updateLessonProgress(lesson.id, { flashcardIndex: nextIndex, flashcardFlipped: false });
  rerenderLesson(false);
}

function rateFlashcard(rating) {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const cards = getAdaptiveFlashcards(lesson, progress.selectedChoiceId, progress);
  const index = clamp(Number(progress.flashcardIndex || 0), 0, Math.max(cards.length - 1, 0));
  const card = cards[index];
  if (!card) return;
  const nextCard = cards[(index + 1) % Math.max(cards.length, 1)];
  const confidence = {
    ...(progress.flashcardConfidence || {}),
    [getFlashcardKey(card)]: rating === "got-it" ? "got-it" : "again",
  };
  const nextProgress = { ...progress, flashcardConfidence: confidence };
  const reordered = getAdaptiveFlashcards(lesson, progress.selectedChoiceId, nextProgress);
  const nextIndex = Math.max(0, reordered.findIndex(item => getFlashcardKey(item) === getFlashcardKey(nextCard)));
  updateLessonProgress(lesson.id, {
    flashcardConfidence: confidence,
    flashcardIndex: nextIndex,
    flashcardFlipped: false,
  });
  rerenderLesson(false);
}

function handleFlashcardTap() {
  if (flashSwipeHandled) {
    flashSwipeHandled = false;
    return;
  }
  flipFlashcard();
}

function startFlashcardSwipe(event) {
  flashSwipeStartX = Number(event?.clientX || 0);
  flashSwipeStartY = Number(event?.clientY || 0);
  flashSwipeHandled = false;
}

function endFlashcardSwipe(event) {
  const deltaX = Number(event?.clientX || 0) - flashSwipeStartX;
  const deltaY = Number(event?.clientY || 0) - flashSwipeStartY;
  if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
  flashSwipeHandled = true;
  window.setTimeout(() => { flashSwipeHandled = false; }, 350);
  if (deltaX < 0) nextFlashcard();
  else previousFlashcard();
}

function setListeningPass(pass) {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const current = progress.rendererListening || { pass: 0, questionIndex: 0, selected: null, complete: false };
  updateLessonProgress(lesson.id, { rendererListening: { ...current, pass: clamp(Number(pass), 0, 2) } });
  rerenderLesson(false);
}

function answerListeningQuestion(optionIndex) {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const questions = getListeningQuestions(lesson);
  const current = progress.rendererListening || { pass: 2, questionIndex: 0, selected: null, complete: false };
  if (current.selected !== null && current.selected !== undefined) return;
  const questionIndex = clamp(Number(current.questionIndex || 0), 0, Math.max(questions.length - 1, 0));
  const question = questions[questionIndex];
  const options = stableShuffle(question?.options || [], `${lesson.id}:listening:${questionIndex}`);
  const answer = options[Number(optionIndex)];
  if (!question || typeof answer !== "string") return;
  updateLessonProgress(lesson.id, { rendererListening: { ...current, pass: 2, questionIndex, selected: answer } });
  rerenderLesson(false);
}

function nextListeningQuestion() {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const questions = getListeningQuestions(lesson);
  const current = progress.rendererListening || { pass: 2, questionIndex: 0, selected: null, complete: false };
  if (current.selected === null || current.selected === undefined) return;
  const questionIndex = clamp(Number(current.questionIndex || 0), 0, Math.max(questions.length - 1, 0));
  const last = questionIndex + 1 >= questions.length;
  if (last) {
    const completedSections = Array.from(new Set([
      ...(progress.completedSections || []),
      "dialogue",
      "listening",
    ]));
    updateLessonProgress(lesson.id, {
      completedSections,
      rendererListening: { ...current, pass: 2, questionIndex, complete: true },
    });
    rerenderLesson(false);
    return;
  }
  updateLessonProgress(lesson.id, { rendererListening: { ...current, pass: 2, questionIndex: questionIndex + 1, selected: null } });
  rerenderLesson(false);
}

function answerQuizQuestion(optionIndex) {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const quiz = getRendererQuiz(lesson, progress);
  if (quiz.selected !== null && quiz.selected !== undefined) return;
  const questionIndex = clamp(Number(quiz.index || 0), 0, Math.max((lesson.quiz?.length || 1) - 1, 0));
  const question = lesson.quiz?.[questionIndex];
  if (!question) return;
  const options = stableShuffle(question.options || [], `${lesson.id}:${questionIndex}`);
  const answer = options[Number(optionIndex)];
  if (typeof answer !== "string") return;
  saveQuizAnswer(lesson, quiz, questionIndex, question, answer);
}

function submitQuizAnswer(answer) {
  const lesson = getActiveLesson();
  if (!lesson || !String(answer || "").trim()) return;
  const progress = getLessonProgress(lesson.id);
  const quiz = getRendererQuiz(lesson, progress);
  if (quiz.selected !== null && quiz.selected !== undefined) return;
  const questionIndex = clamp(Number(quiz.index || 0), 0, Math.max((lesson.quiz?.length || 1) - 1, 0));
  const question = lesson.quiz?.[questionIndex];
  if (!question) return;
  saveQuizAnswer(lesson, quiz, questionIndex, question, String(answer).trim());
}

function saveQuizAnswer(lesson, quiz, questionIndex, question, answer) {
  updateLessonProgress(lesson.id, { rendererQuiz: { ...quiz, index: questionIndex, selected: answer, score: Number(quiz.score || 0) + (isQuizAnswerCorrect(answer, question.answer) ? 1 : 0) } });
  rerenderLesson(false);
}

function nextQuizQuestion() {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const quiz = getRendererQuiz(lesson, progress);
  if (quiz.selected === null || quiz.selected === undefined) return;
  const last = Number(quiz.index || 0) + 1 >= (lesson.quiz?.length || 0);
  if (last) {
    completeCurrentStepAndAdvance(lesson, "quiz", { rendererQuiz: { ...quiz, complete: true } });
    return;
  }
  updateLessonProgress(lesson.id, { rendererQuiz: { ...quiz, index: Number(quiz.index || 0) + 1, selected: null } });
  rerenderLesson(false);
}

function toggleQuizReviewQuestion() {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const quiz = getRendererQuiz(lesson, progress);
  const questionIndex = clamp(Number(quiz.index || 0), 0, Math.max((lesson.quiz?.length || 1) - 1, 0));
  const question = lesson.quiz?.[questionIndex];
  if (!question) return;
  const key = getQuizReviewKey(question, questionIndex);
  const quizReviewFlags = { ...(progress.quizReviewFlags || {}) };
  if (quizReviewFlags[key]) delete quizReviewFlags[key];
  else {
    quizReviewFlags[key] = {
      questionIndex,
      prompt: question.prompt,
      savedAt: new Date().toISOString(),
    };
  }
  updateLessonProgress(lesson.id, { quizReviewFlags });
  rerenderLesson(false);
}

function completeCurrentStepAndAdvance(lesson, stepId, patch = {}) {
  const progress = getLessonProgress(lesson.id);
  const steps = buildLessonSteps(lesson);
  const index = clamp(Number(progress.rendererStep || 0), 0, Math.max(steps.length - 1, 0));
  const completedSections = Array.from(new Set([...(progress.completedSections || []), stepId]));
  updateLessonProgress(lesson.id, {
    ...patch,
    completedSections,
    rendererStep: Math.min(index + 1, Math.max(steps.length - 1, 0)),
  });
  rerenderLesson(true);
}

function discoverLivingWorldMoment(discoveryId) {
  const lesson = getActiveLesson();
  const discovery = lesson?.livingWorldInteractions?.find(item => item.id === discoveryId);
  if (!lesson || !discovery) return;
  rememberDiscovery(lesson, discovery);
  rerenderLesson(false);
}

function playListeningConversation(button, rate = 0.92) {
  const lesson = getActiveLesson();
  const listening = normalizeFirst(lesson?.listening) || {};
  const transcript = listening.transcript || normalizeDialogue(lesson?.dialogue || lesson?.dialogues)[0]?.lines || [];
  const lines = transcript
    .map(line => ({ text: line.spanish || line.exampleSpanish || "", speaker: isLearnerSpeaker(line.speaker) ? "Model" : line.speaker || "Carlos" }))
    .filter(line => line.text);
  if (lines.length) {
    playLessonSequence(lines, button, "[data-listening-line-index]", Number(rate || 0.92));
    return;
  }
  playSingleSpeech(button, listening.naturalScript || "", rate, "Carlos");
}

function speakSequence(lines, rate) {
  void playSpeechSequence(lines, { rate });
}

function speakSpanish(text, rate = 0.84, speaker = "Carlos") {
  void playSpeech(text, { rate, speaker });
}

function hearVocabularyItem(button) {
  if (!button) return;
  const card = button.closest(".lesson-vocab-item");
  if (card) {
    card.classList.remove("is-listening");
    void card.offsetWidth;
    card.classList.add("is-listening");
    window.setTimeout(() => card.classList.remove("is-listening"), 420);
  }
  speakSpanish(button.dataset.speech || "");
  markVocabularyStatus(button.dataset.vocabularyKey, "heard", card);
}

function toggleVocabularyFavorite(button) {
  const lesson = getActiveLesson();
  if (!lesson || !button?.dataset.vocabularyKey) return;
  const saved = getSavedVocabularyPhrases();
  const index = saved.findIndex(item => item.key === button.dataset.vocabularyKey);
  const willSave = index < 0;
  if (willSave) {
    saved.unshift({
      key: button.dataset.vocabularyKey,
      sourceLessonId: lesson.id,
      spanish: button.dataset.spanish || "",
      english: button.dataset.english || "",
      exampleSpanish: button.dataset.exampleSpanish || "",
      exampleEnglish: button.dataset.exampleEnglish || "",
      savedAt: new Date().toISOString(),
    });
  } else {
    saved.splice(index, 1);
  }
  state.vocabulary = { ...(state.vocabulary || {}), savedPhrases: saved.slice(0, 100) };
  saveState(state);
  button.classList.toggle("is-saved", willSave);
  button.setAttribute("aria-pressed", String(willSave));
  button.setAttribute("aria-label", `${willSave ? "Remove" : "Favorite"} ${button.dataset.spanish || "phrase"} ${willSave ? "from" : "for"} Practice`);
  button.setAttribute("title", willSave ? "Remove from Practice favorites" : "Favorite for Practice");
  button.innerHTML = `${icon("star")}<span class="sr-only">${willSave ? "Favorited" : "Favorite"}</span>`;
}

function getSavedVocabularyPhrases() {
  return Array.isArray(state.vocabulary?.savedPhrases) ? [...state.vocabulary.savedPhrases] : [];
}

function markVocabularyStatus(key, status, card) {
  const lesson = getActiveLesson();
  if (!lesson || !key) return;
  const progress = getLessonProgress(lesson.id);
  const statuses = { ...(progress.rendererVocabularyStatus || {}) };
  const current = { ...(statuses[key] || {}) };
  current[status] = true;
  statuses[key] = current;
  updateLessonProgress(lesson.id, { rendererVocabularyStatus: statuses });
  const statusElement = card?.querySelector("[data-vocab-learning-status]");
  if (!statusElement) return;
  statusElement.classList.toggle("is-heard", Boolean(current.heard || current.repeated));
  statusElement.classList.remove("is-repeated");
  statusElement.innerHTML = `${icon("check")} Learned`;
  updateVocabularyReadiness();
  const groupGrid = card?.closest("[data-vocab-group-grid]");
  if (!groupGrid) return;
  const groupCards = [...groupGrid.querySelectorAll(".lesson-vocab-item")];
  const groupComplete = groupCards.length > 0 && groupCards.every(groupCard => groupCard.querySelector("[data-vocab-learning-status]")?.classList.contains("is-heard"));
  const groupContainer = groupGrid.parentElement;
  if (groupComplete && groupContainer && !groupContainer.querySelector(":scope > .lesson-vocab-group-outcome")) {
    groupGrid.insertAdjacentHTML("afterend", `<p class="lesson-vocab-group-outcome">${icon("check")}${escapeHtml(groupGrid.dataset.groupOutcome || "You’re ready for this part of the scene.")}</p>`);
  }
}

function updateVocabularyReadiness() {
  const readiness = document.querySelector("[data-vocab-readiness]");
  if (!readiness) return;
  const total = Number(readiness.dataset.vocabTotal || 0);
  const ready = document.querySelectorAll(".lesson-vocab-item [data-vocab-learning-status].is-heard").length;
  const count = readiness.querySelector("[data-vocab-ready-count]");
  const progressbar = readiness.querySelector(".lesson-vocab-readiness-track");
  if (count) count.textContent = String(ready);
  if (progressbar) progressbar.value = ready;
  readiness.classList.toggle("is-ready", total > 0 && ready >= total);
}

function playDialogueConversation(button) {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const selectedId = progress.selectedChoiceId || getLessonMemory(lesson.id)?.choiceId;
  const selected = lesson.learnerChoices?.options?.find(choice => choice.id === selectedId);
  const scenes = normalizeDialogue(lesson.dialogue || lesson.dialogues);
  const scene = scenes.find(item => item.presentation?.type !== "messageThread") || scenes[0];
  const fallbackTranscript = normalizeFirst(lesson.listening)?.transcript || [];
  const lines = (scene?.lines || fallbackTranscript).map(line => {
    const resolved = resolveDialogueLine(line, selected);
    return {
      text: resolved.spanish,
      speaker: isLearnerSpeaker(line.speaker) ? "Model" : line.speaker || "Carlos",
    };
  }).filter(line => line.text);
  playLessonSequence(lines, button, "[data-dialogue-line-index]", dialoguePlaybackRate);
}

function playDialogueLine(button) {
  if (!button) return;
  const card = button.closest(".lesson-dialogue-line, .lesson-listen-list article, .lesson-pronunciation-card, .lesson-speaking-prompt, .lesson-speaking-model, .lesson-quiz-question, .lesson-language-coach, .lesson-language-primary, .lesson-language-secondary");
  if (button === activePlaybackButton && isSpeechPlaying()) {
    stopSpeech();
    resetPlaybackUI();
    return;
  }

  resetPlaybackUI();
  activePlaybackButton = button;
  setPlaybackButtonState(button, true);
  card?.classList.add("is-playing");
  void playSpeech(button.dataset.speech || "", {
    rate: dialoguePlaybackRate,
    speaker: button.dataset.speaker || "Carlos",
    onEnd: () => {
      card?.classList.remove("is-playing");
      if (activePlaybackButton === button) resetPlaybackUI();
    },
    onError: () => {
      card?.classList.remove("is-playing");
      if (activePlaybackButton === button) resetPlaybackUI();
    },
  });
}

function playSingleSpeech(button, text, rate, speaker) {
  if (button === activePlaybackButton && isSpeechPlaying()) {
    stopSpeech();
    resetPlaybackUI();
    return;
  }
  resetPlaybackUI();
  activePlaybackButton = button;
  setPlaybackButtonState(button, true);
  void playSpeech(text, {
    rate: Number(rate || 0.92),
    speaker,
    onEnd: resetPlaybackUI,
    onError: resetPlaybackUI,
  });
}

function playLessonSequence(lines, button, cardSelector, rate) {
  if (!lines.length || !button) return;
  if (button === activePlaybackButton && isSpeechPlaying()) {
    stopSpeech();
    resetPlaybackUI();
    return;
  }

  resetPlaybackUI();
  activePlaybackButton = button;
  setPlaybackButtonState(button, true);
  const cards = [...document.querySelectorAll(cardSelector)];
  void playSpeechSequence(lines, {
    rate,
    onLineStart: (_line, index) => {
      cards.forEach((card, cardIndex) => card.classList.toggle("is-playing", cardIndex === index));
      cards[index]?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "nearest" });
    },
    onLineEnd: (_line, index) => cards[index]?.classList.remove("is-playing"),
    onEnd: resetPlaybackUI,
  }).finally(() => {
    if (activePlaybackButton === button) resetPlaybackUI();
  });
}

function setPlaybackButtonState(button, playing) {
  if (!button) return;
  button.classList.toggle("is-playing", playing);
  button.setAttribute("aria-pressed", String(playing));
  const iconMount = button.querySelector("[data-playback-icon]");
  const label = button.querySelector("[data-playback-label]");
  if (iconMount) iconMount.innerHTML = icon(playing ? "pause" : (button.dataset.idleIcon || "play"));
  if (label) {
    label.dataset.idleLabel ||= label.textContent;
    label.textContent = playing ? "Pause" : label.dataset.idleLabel;
  }
}

function resetPlaybackUI() {
  document.querySelectorAll(".lesson-dialogue-line.is-playing, .lesson-listen-list article.is-playing, .lesson-pronunciation-card.is-playing, .lesson-speaking-prompt.is-playing, .lesson-speaking-model.is-playing, .lesson-quiz-question.is-playing, .lesson-language-coach.is-playing, .lesson-language-primary.is-playing, .lesson-language-secondary.is-playing")
    .forEach(card => card.classList.remove("is-playing"));
  if (activePlaybackButton) setPlaybackButtonState(activePlaybackButton, false);
  activePlaybackButton = null;
}

function setDialogueRate(button, rate) {
  dialoguePlaybackRate = Number(rate) === 0.8 ? 0.8 : 0.92;
  button?.closest(".lesson-speed-control")?.querySelectorAll("button").forEach(item => {
    item.classList.toggle("active", item === button);
    item.setAttribute("aria-pressed", String(item === button));
  });
}

function toggleTranslations(button) {
  const module = button?.closest(".lesson-conversation-module");
  if (!module) return;
  const visible = button.getAttribute("aria-pressed") !== "false";
  module.classList.toggle("hide-translations", visible);
  button.setAttribute("aria-pressed", String(!visible));
  const label = button.querySelector("strong");
  if (label) label.textContent = visible ? "Off" : "On";
}

async function toggleLineRecording(button) {
  if (!button) return;
  const persistentKey = button.dataset.recordingKey || "";
  const persistentUrl = persistentKey ? speakingRecordingUrls.get(persistentKey) : "";
  if (persistentUrl && !recordedLineUrls.get(button)) recordedLineUrls.set(button, persistentUrl);
  const savedUrl = recordedLineUrls.get(button);
  if (savedUrl && activeRecorder?.state !== "recording") {
    const playback = new Audio(savedUrl);
    button.classList.add("is-playing");
    setRecordButtonLabel(button, "Playing");
    playback.addEventListener("ended", () => {
      button.classList.remove("is-playing");
      setRecordButtonLabel(button, "Play back");
    }, { once: true });
    await playback.play().catch(() => setRecordStatus(button, "Playback is unavailable."));
    return;
  }

  if (activeRecorder?.state === "recording") {
    if (activeRecordButton === button) activeRecorder.stop();
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
    setRecordStatus(button, "Recording is not supported in this browser.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    activeRecorder = recorder;
    activeRecordButton = button;
    recorder.addEventListener("dataavailable", event => {
      if (event.data.size) chunks.push(event.data);
    });
    recorder.addEventListener("stop", () => {
      const url = URL.createObjectURL(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      const previous = recordedLineUrls.get(button);
      if (previous) URL.revokeObjectURL(previous);
      recordedLineUrls.set(button, url);
      if (persistentKey) speakingRecordingUrls.set(persistentKey, url);
      stream.getTracks().forEach(track => track.stop());
      button.classList.remove("is-recording");
      button.setAttribute("aria-pressed", "false");
      setRecordButtonLabel(button, "Play back");
      markSpeakingAttempt(button);
      if (button.dataset.vocabularyKey) {
        markVocabularyStatus(button.dataset.vocabularyKey, "repeated", button.closest(".lesson-vocab-item"));
      }
      setRecordStatus(button, getRecordedSpeakingFeedback(button) || "Recording ready. Select Play back to hear yourself.");
      activeRecorder = null;
      activeRecordButton = null;
    }, { once: true });
    recorder.start();
    button.classList.add("is-recording");
    button.setAttribute("aria-pressed", "true");
    setRecordButtonLabel(button, "Stop");
    setRecordStatus(button, "Recording. Select Stop when you are finished.");
  } catch {
    setRecordStatus(button, "Microphone permission was not available.");
  }
}

function setRecordButtonLabel(button, value) {
  const label = button.querySelector("span");
  if (label) label.textContent = value;
}

function setRecordStatus(button, value) {
  const status = button.closest(".lesson-learner-actions, .lesson-pronunciation-actions, .lesson-speaking-turn, .lesson-vocab-actions")?.querySelector(".lesson-record-status");
  if (status) status.textContent = value;
}

function markSpeakingAttempt(button) {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const guidedIndex = Number(button.dataset.speakingAttemptIndex);
  const challengeIndex = Number(button.dataset.speakingChallengeIndex);

  if (Number.isInteger(guidedIndex) && guidedIndex >= 0) {
    const attempts = { ...(progress.guidedSpeakingAttempts || {}) };
    attempts[guidedIndex] = { attempted: true, skipped: false };
    updateLessonProgress(lesson.id, { guidedSpeakingAttempts: attempts });
    const exchange = button.closest(".lesson-speaking-exchange");
    exchange?.classList.add("has-attempt");
    const actions = exchange?.querySelector(".lesson-speaking-after");
    actions?.classList.add("is-visible");
    actions?.setAttribute("aria-hidden", "false");
    actions?.querySelector("[disabled]")?.removeAttribute("disabled");
    document.querySelector(".lesson-controls .lesson-control-primary")?.removeAttribute("disabled");
    return;
  }

  if (Number.isInteger(challengeIndex) && challengeIndex >= 0) {
    const current = progress.rendererSpeakingChallenge || { active: true, index: challengeIndex, attempts: {} };
    const attempts = { ...(current.attempts || {}), [challengeIndex]: true };
    updateLessonProgress(lesson.id, { rendererSpeakingChallenge: { ...current, attempts } });
    button.closest(".lesson-speaking-challenge")?.querySelector("footer .primary")?.removeAttribute("disabled");
  }
}

function getRecordedSpeakingFeedback(button) {
  const lesson = getActiveLesson();
  if (!lesson) return "";
  const index = Number(button.dataset.speakingAttemptIndex);
  if (!Number.isInteger(index) || index < 0) return button.dataset.speakingChallengeIndex !== undefined
    ? "That worked—Carlos understood you."
    : "";
  const progress = getLessonProgress(lesson.id);
  const items = normalizeFirst(lesson.speaking)?.items || lesson.speakingChallenge || [];
  const item = resolveSpeakingItemForChoice(lesson, progress, items[index]);
  return getSpeakingFeedback(item || {}, index, { attempted: true });
}

function skipSpeakingAttempt() {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const items = normalizeFirst(lesson.speaking)?.items || lesson.speakingChallenge || [];
  const index = clamp(Number(progress.guidedSpeakingIndex || 0), 0, Math.max(items.length - 1, 0));
  const attempts = { ...(progress.guidedSpeakingAttempts || {}) };
  attempts[index] = { attempted: false, skipped: true };
  updateLessonProgress(lesson.id, { guidedSpeakingAttempts: attempts });
  rerenderLesson(false);
}

function replaySpeakingAttempt(button) {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const historyIndex = Number(button?.dataset.historySpeakingIndex);
  const mainButton = Number.isInteger(historyIndex) && historyIndex >= 0
    ? null
    : button?.closest(".lesson-speaking-exchange")?.querySelector(".lesson-speaking-record");
  if (mainButton) {
    void toggleLineRecording(mainButton);
    return;
  }
  const index = Number.isInteger(historyIndex) ? historyIndex : Number(getLessonProgress(lesson.id).guidedSpeakingIndex || 0);
  playRecordedSpeakingUrl(speakingRecordingUrls.get(getSpeakingRecordingKey(lesson.id, index)), button);
}

function retrySpeakingAttempt(button) {
  const mainButton = button?.closest(".lesson-speaking-exchange")?.querySelector(".lesson-speaking-record");
  if (!mainButton) return;
  const key = mainButton.dataset.recordingKey;
  const previous = recordedLineUrls.get(mainButton) || (key ? speakingRecordingUrls.get(key) : "");
  if (previous) URL.revokeObjectURL(previous);
  recordedLineUrls.delete(mainButton);
  if (key) speakingRecordingUrls.delete(key);
  setRecordButtonLabel(mainButton, "Tap to answer");
  void toggleLineRecording(mainButton);
}

function playRecordedSpeakingUrl(url, button) {
  if (!url) return;
  const playback = new Audio(url);
  button?.classList.add("is-playing");
  playback.addEventListener("ended", () => button?.classList.remove("is-playing"), { once: true });
  void playback.play().catch(() => button?.classList.remove("is-playing"));
}

function startSpeakingChallenge() {
  const lesson = getActiveLesson();
  if (!lesson) return;
  updateLessonProgress(lesson.id, {
    rendererSpeakingChallenge: { active: true, complete: false, index: 0, attempts: {} },
  });
  rerenderLesson(true);
}

function nextSpeakingChallenge() {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const items = normalizeFirst(lesson.speaking)?.items || lesson.speakingChallenge || [];
  const current = progress.rendererSpeakingChallenge || {};
  const index = clamp(Number(current.index || 0), 0, Math.max(items.length - 1, 0));
  if (!current.attempts?.[index]) return;
  if (index + 1 >= items.length) {
    updateLessonProgress(lesson.id, {
      rendererSpeakingChallenge: { ...current, active: false, complete: true, index },
    });
  } else {
    updateLessonProgress(lesson.id, {
      rendererSpeakingChallenge: { ...current, index: index + 1 },
    });
  }
  rerenderLesson(true);
}

function exitSpeakingChallenge() {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  updateLessonProgress(lesson.id, {
    rendererSpeakingChallenge: { ...(progress.rendererSpeakingChallenge || {}), active: false },
  });
  rerenderLesson(true);
}

function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

function getVoiceProfile(speaker) {
  const name = normalize(speaker);
  if (name.includes("elena")) return { hints: ["elvira", "monica", "mónica", "helena"], voiceIndex: 2, rate: 0.9, pitch: 0.82 };
  if (name.includes("ana") || name.includes("marta") || name.includes("lucia") || name.includes("lucía") || name.includes("camarera") || name.includes("vecina")) {
    return { hints: ["helena", "monica", "mónica", "laura", "paulina", "marisol"], voiceIndex: 1, rate: 1, pitch: 1.14 };
  }
  if (name.includes("diego") || name.includes("nico") || name.includes("child")) return { hints: ["diego", "pablo"], voiceIndex: 3, rate: 1.03, pitch: 1.22 };
  if (name.includes("javier") || name.includes("vendor") || name.includes("vendedor") || name.includes("vecino")) return { hints: ["jorge", "alvaro", "álvaro", "enrique"], voiceIndex: 0, rate: 0.96, pitch: 0.92 };
  if (name.includes("model")) return { hints: ["helena", "monica", "mónica"], voiceIndex: 1, rate: 0.98, pitch: 1.02 };
  return { hints: ["jorge", "alvaro", "álvaro", "diego", "pablo"], voiceIndex: 0, rate: 0.98, pitch: 0.92 };
}

function isLearnerSpeaker(speaker) {
  const name = normalize(speaker);
  return name === "learner" || name === "you" || name === "student";
}

function renderSpeechButton(text, speaker = "Carlos", label = "Hear phrase") {
  if (!text) return "";
  const voice = isLearnerSpeaker(speaker) ? "Model" : (speaker || "Carlos");
  return `<button type="button" data-speech="${escapeAttr(text)}" data-speaker="${escapeAttr(voice)}" onclick="hablaLesson.speak(this.dataset.speech, .84, this.dataset.speaker)" aria-label="${escapeAttr(label)}">${icon("sound")}<span class="sr-only">${escapeHtml(label)}</span></button>`;
}

function renderDialogueAudioButton(text, speaker = "Carlos", label = "Hear phrase") {
  if (!text) return "";
  const voice = isLearnerSpeaker(speaker) ? "Model" : (speaker || "Carlos");
  return `<button class="lesson-dialogue-audio" type="button" data-dialogue-audio data-speech="${escapeAttr(text)}" data-speaker="${escapeAttr(voice)}" onclick="hablaLesson.playLine(this)" aria-pressed="false" aria-label="${escapeAttr(label)}"><span data-playback-icon>${icon("sound")}</span><span class="sr-only" data-playback-label>${escapeHtml(label)}</span></button>`;
}

function renderDialogueAvatar(speaker) {
  if (isLearnerSpeaker(speaker)) return renderLearnerAvatar();
  const name = displaySpeakerName(speaker);
  if (normalize(name) === "carlos") {
    return `<span class="lesson-dialogue-avatar is-carlos"><img src="${escapeAttr(getCarlosAsset("speaking"))}" alt="Carlos" onerror="${CARLOS_FALLBACK_ONERROR}"></span>`;
  }
  const initial = String(name || "?").trim().charAt(0).toUpperCase();
  return `<span class="lesson-dialogue-avatar is-character" role="img" aria-label="${escapeAttr(name)}">${escapeHtml(initial)}</span>`;
}

function renderLearnerAvatar() {
  const user = state.user || {};
  const sourceValue = user.profilePhoto || user.profilePhotoUrl || user.photoUrl || user.avatarUrl || user.avatar?.src || user.avatar;
  const source = typeof sourceValue === "string" && /^(?:data:image\/|blob:|https?:\/\/|\.?\.?\/|assets\/)/i.test(sourceValue)
    ? sourceValue
    : "";
  const initial = String(user.name || "").trim().charAt(0).toUpperCase();
  const fallback = initial
    ? `<span class="lesson-dialogue-avatar-fallback" aria-hidden="true">${escapeHtml(initial)}</span>`
    : `<span class="lesson-dialogue-avatar-fallback is-generic" aria-hidden="true">${icon("user")}</span>`;
  return `<span class="lesson-dialogue-avatar is-learner" role="img" aria-label="${escapeAttr(user.name || "Learner")} profile">${source ? `<img src="${escapeAttr(source)}" alt="" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="lesson-dialogue-avatar-fallback" hidden aria-hidden="true">${initial ? escapeHtml(initial) : icon("user")}</span>` : fallback}</span>`;
}

function displaySpeakerName(speaker) {
  if (isLearnerSpeaker(speaker)) return personalizeText("{{learnerName}}");
  const name = normalize(speaker);
  if (name === "camarera" || name === "camarero") return "Server";
  return speaker || "Carlos";
}

function getAdaptiveFlashcards(lesson, choiceId, progress = {}) {
  const deck = normalizeFirst(lesson.flashcards) || {};
  const sourceItems = [...(deck.items || [])];
  const items = deck.shuffle ? stableShuffle(sourceItems, `${lesson.id}:flashcards`) : sourceItems;
  const priority = deck.adaptiveOrdering?.[choiceId] || [];
  const ordered = [...priority, ...items.filter(item => !priority.includes(item))];
  const priorityKeys = new Set(priority.map(value => normalize(value)));
  const confidence = progress.flashcardConfidence || {};
  return ordered
    .map((value, baseIndex) => ({ ...lookupFlashcard(lesson, value), baseIndex }))
    .sort((a, b) => {
      const rank = card => {
        const status = confidence[getFlashcardKey(card)];
        if (status === "again") return 0;
        if (priorityKeys.has(normalize(card.spanish))) return 1;
        if (status === "got-it") return 3;
        return 2;
      };
      return rank(a) - rank(b) || a.baseIndex - b.baseIndex;
    });
}

function lookupFlashcard(lesson, value) {
  const normalized = normalize(value);
  const vocabulary = (lesson.vocabulary || []).find(item => normalize(item.spanish) === normalized || normalize(item.spanish).includes(normalized) || normalized.includes(normalize(item.spanish)));
  const phrase = (lesson.essentialPhrases || []).find(item => normalize(item.spanish) === normalized || normalize(item.spanish).includes(normalized) || normalized.includes(normalize(item.spanish)));
  const choice = lesson.learnerChoices?.options?.find(item => normalize(item.learnerSpanish) === normalized);
  const choiceOrder = lesson.learnerChoices?.options?.find(item => normalize(item.modelOrder) === normalized);
  const source = vocabulary || phrase || choice || choiceOrder || {};
  const english = vocabulary?.english || phrase?.english || choice?.learnerEnglish || choiceOrder?.modelOrderEnglish || "Review this mission phrase";
  const fallback = getFlashcardFallbackExample(value, english);
  const sourceExample = {
    spanish: source.exampleSpanish || fallback.spanish,
    english: source.exampleEnglish || fallback.english,
  };
  const example = normalize(sourceExample.spanish) === normalized
    ? getFlashcardExtendedExample(value, english) || sourceExample
    : sourceExample;
  return {
    spanish: value,
    english,
    exampleSpanish: example.spanish,
    exampleEnglish: example.english,
  };
}

function getFlashcardFallbackExample(spanish, english) {
  const normalized = normalize(spanish);
  if (normalized.startsWith("me llamo")) {
    return { spanish: "Me llamo {{learnerName}}.", english: "My name is {{learnerName}}." };
  }
  if (normalized.startsWith("soy de")) {
    return { spanish: "Soy de {{learnerCountry}}.", english: "I’m from {{learnerCountryEnglish}}." };
  }
  if (normalized === "mi familia") {
    return { spanish: "Mi familia está muy bien.", english: "My family is very well." };
  }
  return {
    spanish: String(spanish).replace(/\.{3}$/, "").trim(),
    english: String(english).replace(/\.{3}$/, "").trim(),
  };
}

function getFlashcardExtendedExample(spanish) {
  const normalized = normalize(spanish);
  if (normalized === "nada mas gracias") {
    return {
      spanish: "Nada más, gracias. La cuenta, por favor.",
      english: "Nothing else, thank you. The bill, please.",
    };
  }
  if (normalized === "la cuenta por favor") {
    return {
      spanish: "La cuenta, por favor. Gracias.",
      english: "The bill, please. Thank you.",
    };
  }
  return null;
}

function getFlashcardKey(card) {
  return normalize(card?.spanish || "");
}

function resolveDialogueLine(line, selected) {
  const fallback = {
    spanish: line.spanish || line.exampleSpanish || line.intent || "",
    english: line.english || line.exampleEnglish || "",
  };
  if (!selected) return fallback;

  if (line.byChoice?.[selected.id]) {
    return { ...fallback, ...line.byChoice[selected.id] };
  }

  const intent = normalize(line.intent);
  if (String(line.speaker).toLowerCase() === "learner" && intent.startsWith("choose ")) {
    return { spanish: selected.learnerSpanish, english: selected.learnerEnglish };
  }
  if (String(line.speaker).toLowerCase() === "learner" && intent.includes("stored drink preference")) {
    return { spanish: selected.learnerSpanish, english: selected.learnerEnglish };
  }
  if (String(line.speaker).toLowerCase() === "learner" && /(selected|chosen) (product|drink|item|room)/.test(intent)) {
    return { spanish: selected.modelOrder, english: selected.modelOrderEnglish || `I would like ${String(selected.label || "that").toLowerCase()}, please.` };
  }
  if (String(line.speaker).toLowerCase() === "carlos" && normalize(line.spanish).startsWith("buena eleccion")) {
    return { spanish: selected.carlosSpanish, english: selected.carlosEnglish };
  }
  return fallback;
}

function prioritizeVocabulary(items, choice) {
  if (!choice) return items;
  const focusTerms = (Array.isArray(choice.vocabularyFocus) ? choice.vocabularyFocus : [choice.vocabularyFocus]).filter(Boolean).map(normalize);
  const contextTerms = normalize(`${choice.learnerSpanish} ${choice.modelOrder || ""}`).split(/\s+/).filter(word => word.length > 3);
  const score = item => {
    const term = normalize(item.spanish);
    if (focusTerms.includes(term)) return 2;
    return Number(contextTerms.some(context => term.includes(context)));
  };
  return [...items].sort((a, b) => score(b) - score(a));
}

function getFlashcardItems(lesson) {
  return normalizeFirst(lesson.flashcards)?.items || [];
}

function getLessonNumber(lesson) {
  return Number(String(lesson.id || "").match(/lesson-(\d+)/)?.[1] || 1);
}

function normalizeDialogue(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

function normalizeFirst(value) {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function groupBy(items, getKey) {
  return items.reduce((groups, item) => {
    const key = getKey(item);
    (groups[key] ||= []).push(item);
    return groups;
  }, {});
}

function stableShuffle(values, seed) {
  const output = [...values];
  let state = [...String(seed)].reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) >>> 0, 2166136261);
  for (let index = output.length - 1; index > 0; index -= 1) {
    state = (state * 1664525 + 1013904223) >>> 0;
    const target = state % (index + 1);
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

function getListeningQuestions(lesson) {
  const listening = normalizeFirst(lesson.listening) || {};
  return listening.comprehension || (listening.items || []).map(item => ({
    prompt: `What does “${item.spanish}” mean?`,
    options: item.options,
    answer: item.answer,
    explanation: `“${item.spanish}” means “${item.answer}”`,
  }));
}

function getRendererQuiz(lesson, progress) {
  const saved = progress.rendererQuiz;
  const contentVersion = lesson.contentVersion || `quiz-${lesson.quiz?.length || 0}-${(lesson.quiz || []).map(item => item.answer).join("|")}`;
  if (!saved || saved.contentVersion !== contentVersion) {
    return { index: 0, score: 0, selected: null, complete: false, contentVersion };
  }
  return {
    ...saved,
    index: clamp(Number(saved.index || 0), 0, Math.max((lesson.quiz?.length || 1) - 1, 0)),
  };
}

function getQuizPresentation(question, answered = false) {
  const rawType = String(question.type || "").toLowerCase().replace(/[\s_-]/g, "");
  const prompt = String(question.prompt || "");
  let kind = "multiple-choice";
  let label = "Choose the best answer";

  if (!Array.isArray(question.options) || !question.options.length) {
    kind = "type-answer";
    label = "Type the answer";
  } else if (rawType.includes("listen") || question.audioText || question.listenText) {
    kind = "listen-choose";
    label = "Listen and choose";
  } else if (rawType.includes("fill") || /_{2,}/.test(prompt)) {
    kind = "fill-blank";
    label = "Fill in the blank";
  } else if (rawType.includes("order") || rawType.includes("arrange")) {
    kind = "word-order";
    label = "Put the words in order";
  } else if (rawType.includes("match") || /situation|natural reply|best response/i.test(prompt)) {
    kind = "situation";
    label = "Match the phrase to the situation";
  } else if (rawType.includes("translation") || /translate|what does|which phrase means/i.test(prompt)) {
    kind = "translation";
    label = "Tap the translation";
  }

  return {
    kind,
    label,
    audioText: getQuizAudioText(question, answered),
  };
}

function getQuizAudioText(question, answered = false) {
  const direct = question.audioText || question.listenText || question.spanish || question.phrase;
  if (direct) return String(direct);

  const prompt = String(question.prompt || "").trim();
  const quoted = prompt.match(/[“"«]([^”"»]+)[”"»]/);
  if (quoted?.[1] && /what does|translate|listen|means/i.test(prompt)) return quoted[1].trim();

  const whatDoes = prompt.match(/^what does\s+(.+?)\s+mean\??$/i);
  if (whatDoes?.[1]) return whatDoes[1].replace(/^[“"«]|[”"»]$/g, "").trim();

  const translate = prompt.match(/^translate\s*:\s*(.+)$/i);
  if (translate?.[1]) return translate[1].trim();

  if (answered && /_{2,}/.test(prompt)) return prompt.replace(/_{2,}/g, String(question.answer || "")).trim();
  return "";
}

function getQuizReviewKey(question, index) {
  if (question.id) return String(question.id);
  return `${index}-${slugify(question.prompt).slice(0, 56)}-${slugify(question.answer).slice(0, 32)}`;
}

function isQuizAnswerCorrect(given, expected) {
  const normalizedGiven = normalize(given);
  const expectedText = String(expected || "");
  return [expectedText, ...expectedText.split("/")]
    .map(normalize)
    .filter(Boolean)
    .some(answer => normalizedGiven === answer);
}

function rerenderLesson(scroll = false) {
  stopSpeech();
  resetPlaybackUI();
  if (activeRecorder?.state === "recording") activeRecorder.stop();
  window.dispatchEvent(new CustomEvent("habla:lesson-render", { detail: { scroll } }));
}

function icon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.star}</svg>`;
}

function renderMissingLesson() {
  return `<section class="lesson-missing"><h1>Lesson unavailable</h1><p>This lesson could not be loaded safely.</p><button type="button" data-page="learn">Back to Learn</button></section>`;
}

function normalize(value) {
  return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¿?¡!.,/]/g, "").trim();
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, "-");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function getAdjacentLessonStepIndex(steps, currentIndex, direction) {
  const increment = direction < 0 ? -1 : 1;
  let target = clamp(Number(currentIndex) + increment, 0, Math.max(steps.length - 1, 0));
  while (steps[target]?.legacyCombined) {
    const next = target + increment;
    if (next < 0 || next >= steps.length) break;
    target = next;
  }
  return target;
}

function escapeHtml(value) {
  return personalizeText(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
