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
import { LESSON_ARTWORK_ONERROR, preloadLessonArtwork } from "../data/lessonAssets.js";
import { personalizeText } from "../core/personalization.js";
import { playSpeech, playSpeechSequence } from "../core/audio.js";
import { renderChoiceIcon } from "../components/choiceIcons.js";

const ICONS = {
  back: `<path d="m15 18-6-6 6-6"/>`,
  book: `<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3H4V5.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v18a3 3 0 0 1 3-3h3V5.5Z"/>`,
  sound: `<path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10"/>`,
  mic: `<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 10a6 6 0 0 0 12 0M12 16v5M9 21h6"/>`,
  check: `<path d="m5 12 4 4L19 6"/>`,
  arrow: `<path d="m8 5 7 7-7 7"/>`,
  message: `<path d="M4 5h16v11H8l-4 4V5Z"/>`,
  target: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m14 10 6-6"/>`,
  star: `<path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 2.8Z"/>`,
  passport: `<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="11" r="4"/><path d="M8 11h8M12 7c1.2 1.2 1.8 2.5 1.8 4S13.2 13.8 12 15M12 7c-1.2 1.2-1.8 2.5-1.8 4s.6 2.8 1.8 4"/>`,
  sofa: `<path d="M5 12V9a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 9v3"/><path d="M4 11a2 2 0 0 0-2 2v4h20v-4a2 2 0 0 0-2-2M5 17v2M19 17v2M12 7v5"/>`,
  cup: `<path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 4c0 1 1 1 1 2M12 4c0 1 1 1 1 2"/>`,
  sun: `<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  moon: `<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/>`,
};

if (typeof window !== "undefined") {
  window.hablaLesson = {
    next: advanceLesson,
    previous: previousLessonStep,
    goTo: goToLessonStep,
    choose: chooseLessonOption,
    flipCard: flipFlashcard,
    nextCard: nextFlashcard,
    answerQuiz: answerQuizQuestion,
    submitQuiz: submitQuizAnswer,
    nextQuiz: nextQuizQuestion,
    setListeningPass,
    answerListening: answerListeningQuestion,
    nextListening: nextListeningQuestion,
    playListening: playListeningConversation,
    discover: discoverLivingWorldMoment,
    speak: speakSpanish,
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
  const percent = progress.completed
    ? 100
    : Math.round(((stepIndex + 1) / Math.max(steps.length, 1)) * 100);

  return `
    <section class="lesson-v2 emotion-${slugify(lesson.emotionalArc?.emotion || "journey")}" aria-label="${escapeAttr(lesson.title)} lesson">
      ${renderLessonHeader(lesson, step, stepIndex, steps, percent, progress)}
      <main class="lesson-stage" id="lesson-stage" tabindex="-1">
        ${renderStep(step, lesson, progress)}
      </main>
      ${renderLessonControls(step, stepIndex, steps, lesson, progress)}
    </section>
  `;
}

function buildLessonSteps(lesson) {
  const steps = [{ id: "story", label: "Story", type: "story" }];
  const dialogue = normalizeDialogue(lesson.dialogue || lesson.dialogues);
  const messageThread = dialogue.find(scene => scene.presentation?.type === "messageThread");
  if (messageThread) steps.push({ id: "messages", label: "Messages", type: "messages", data: messageThread });
  if (lesson.learnerChoices?.options?.length) steps.push({ id: "choice", label: "Your Choice", type: "choice" });
  if (lesson.vocabulary?.length) steps.push({ id: "vocabulary", label: "Vocabulary", type: "vocabulary" });
  if (lesson.grammar) steps.push({ id: "grammar", label: "Grammar", type: "grammar" });
  const standardDialogue = dialogue.find(scene => scene !== messageThread);
  if (standardDialogue) steps.push({ id: "dialogue", label: "Dialogue", type: "dialogue", data: standardDialogue });
  if (lesson.listening || lesson.listeningPhrases?.length) steps.push({ id: "listening", label: "Listening", type: "listening" });
  if (lesson.pronunciation || lesson.pronunciationExercises?.length) steps.push({ id: "pronunciation", label: "Pronunciation", type: "pronunciation" });
  if (lesson.speaking || lesson.speakingChallenge?.length) steps.push({ id: "speaking", label: "Speaking", type: "speaking" });
  if (getFlashcardItems(lesson).length) steps.push({ id: "flashcards", label: "Flashcards", type: "flashcards" });
  if (lesson.quiz?.length) steps.push({ id: "quiz", label: "Quiz", type: "quiz" });
  if (lesson.miniConversation || lesson.realLifeMission) steps.push({ id: "conversation", label: "Carlos", type: "conversation" });
  if (lesson.culture || lesson.worldBuilding?.length || lesson.livingWorldInteractions?.length) steps.push({ id: "culture", label: "Culture", type: "culture" });
  if (lesson.passportStamp || lesson.achievement) steps.push({ id: "reward", label: "Reward", type: "reward" });
  if (lesson.microCliffhanger) steps.push({ id: "cliffhanger", label: "Next Episode", type: "cliffhanger" });
  return steps;
}

function renderLessonHeader(lesson, step, stepIndex, steps, percent, progress) {
  return `
    <header class="lesson-v2-header">
      <button class="lesson-back" type="button" data-page="learn" aria-label="Back to Learn">${icon("back")}</button>
      <div class="lesson-header-copy">
        <span>Lesson ${getLessonNumber(lesson)} · ${escapeHtml(step?.label || "Lesson")}</span>
        <strong>${escapeHtml(lesson.title)}</strong>
      </div>
      <span class="lesson-header-count"><strong>${progress.completed ? "Done" : `${stepIndex + 1}/${steps.length}`}</strong><small>${percent}%</small></span>
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
    reward: renderReward,
    cliffhanger: renderCliffhanger,
  };
  return (renderers[step.type] || renderMissingLesson)(lesson, progress, step.data);
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
  return `<section class="lesson-section-heading"><span>${escapeHtml(intro.eyebrow)}</span><h1>${escapeHtml(intro.title)}</h1>${intro.body ? `<p>${escapeHtml(intro.body)}</p>` : ""}</section>`;
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
  const mission = story.mission || lesson.realLifeMission?.mission || lesson.objectives?.[0];
  const introCopy = getSectionIntro(lesson, "story", {
    eyebrow: story.time || story.location || story.city || "Your Spanish journey",
    title: lesson.title,
    body: story.heroText || mission || "A new conversation with Carlos begins.",
  });
  return `
    <article class="lesson-story-hero">
      ${artwork ? `<img src="${escapeAttr(artwork)}" alt="${escapeAttr(story.location || lesson.title)}" loading="eager" fetchpriority="high" decoding="async" onerror="${LESSON_ARTWORK_ONERROR}">` : ""}
      <div class="lesson-story-shade"></div>
      <div class="lesson-story-copy">
        ${story.chapter || story.city ? `<small class="lesson-story-chapter">${story.chapter ? `Chapter ${escapeHtml(story.chapter)}` : ""}${story.chapter && story.city ? " · " : ""}${story.city ? escapeHtml(story.city) : ""}</small>` : ""}
        <span>${escapeHtml(introCopy.eyebrow)}</span>
        <h1>${escapeHtml(introCopy.title)}</h1>
        <p>${escapeHtml(introCopy.body)}</p>
      </div>
    </article>
    ${renderMemoryCallback(lesson)}
    <article class="lesson-carlos-intro">
      <img src="${escapeAttr(getCarlosAsset("speaking"))}" alt="Carlos, your Spanish tutor" onerror="${CARLOS_FALLBACK_ONERROR}">
      <div><span>Carlos</span><h2>${escapeHtml(intro.title || intro.eyebrow || "Let’s begin")}</h2><p>${escapeHtml(intro.message || intro.text || mission)}</p></div>
    </article>
    <article class="lesson-mission-card">
      <span class="lesson-icon">${icon("target")}</span>
      <div><small>Today's mission</small><h2>${escapeHtml(mission || "Complete the conversation")}</h2><ul>${(lesson.canDo || lesson.objectives || []).slice(0, 4).map(item => `<li>${icon("check")}${escapeHtml(item)}</li>`).join("")}</ul></div>
    </article>
    ${renderMissionSequence(lesson)}
  `;
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
    <section class="lesson-section-heading"><span>Incoming message</span><h1>${escapeHtml(scene.title || "Carlos texted you")}</h1><p>${escapeHtml(scene.setting || "Read the conversation as a real message exchange.")}</p></section>
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
  const presentation = lesson.vocabularyPresentation || {};
  const renderCards = items => items.map(item => {
    const priority = item.learningPriority || (presentation.showPriorityLabels ? (item.tier > 1 ? "Good to know" : "Required") : "");
    return `<article class="lesson-vocab-item ${item.tier > 1 ? "optional" : ""}"><div>${priority ? `<small class="lesson-vocab-priority">${escapeHtml(priority)}</small>` : ""}<strong>${escapeHtml(item.spanish)}</strong><span>${escapeHtml(item.english)}</span></div><button type="button" data-speech="${escapeAttr(item.spanish)}" onclick="hablaLesson.speak(this.dataset.speech)" aria-label="Hear ${escapeAttr(item.spanish)} in Spanish">${icon("sound")}</button>${item.exampleSpanish ? `<p><b>${escapeHtml(item.exampleSpanish)}</b><small>${escapeHtml(item.exampleEnglish)}</small></p>` : ""}</article>`;
  }).join("");
  const renderGroups = items => Object.entries(groupBy(items, item => item.group || "Useful words")).map(([group, groupItems], index) => {
    if (!presentation.collapseGroups) return `<section><h2>${escapeHtml(group)}</h2><div class="lesson-vocab-grid">${renderCards(groupItems)}</div></section>`;
    const expanded = presentation.openFirstGroup && index === 0 ? " open" : "";
    const groupIcon = presentation.groupIcons?.[group];
    return `<details class="lesson-vocab-group"${expanded}><summary>${groupIcon && ICONS[groupIcon] ? `<i>${icon(groupIcon)}</i>` : ""}<span><small>Vocabulary</small><strong>${escapeHtml(group)}</strong></span><b>${groupItems.length} ${groupItems.length === 1 ? "word" : "words"}</b>${icon("arrow")}</summary><div class="lesson-vocab-grid">${renderCards(groupItems)}</div></details>`;
  }).join("");
  const required = presentation.collapseOptional ? prioritized.filter(item => item.tier <= 1) : prioritized;
  const optional = presentation.collapseOptional ? prioritized.filter(item => item.tier > 1) : [];
  return `
    ${renderSectionHeading(lesson, "vocabulary", { eyebrow: "Vocabulary", title: "Words inside the experience", body: selected ? `${selected.label} comes first because that’s what you chose.` : "Learn the words that help you complete the mission." })}
    <div class="lesson-vocab-groups">${renderGroups(required)}</div>
    ${optional.length ? `<details class="lesson-vocab-optional"><summary><span><small>Optional vocabulary</small><strong>Good to know</strong></span><b>${optional.length} words</b>${icon("arrow")}</summary><div class="lesson-vocab-groups">${renderGroups(optional)}</div></details>` : ""}
  `;
}

function renderGrammar(lesson) {
  const grammar = lesson.grammar || {};
  return `
    ${renderSectionHeading(lesson, "grammar", { eyebrow: "One useful pattern", title: grammar.topic || "Grammar in context", body: grammar.meaning || grammar.explanation })}
    <article class="lesson-grammar-note"><small>Remember</small><p>${escapeHtml(grammar.explanation || "")}</p><div class="lesson-grammar-examples">${(grammar.examples || []).map(example => `<button class="${String(example.spanish || "").length > 34 ? "wide" : ""}" type="button" data-speech="${escapeAttr(example.spanish)}" onclick="hablaLesson.speak(this.dataset.speech)" aria-label="Hear ${escapeAttr(example.spanish)} in Spanish"><strong>${escapeHtml(example.spanish)}</strong><span>${escapeHtml(example.english)}</span>${icon("sound")}</button>`).join("")}</div></article>
    ${(grammar.comparison || []).length ? `<div class="lesson-grammar-comparison" aria-label="Quick comparison">${grammar.comparison.map(item => `<article><small>${escapeHtml(item.label)}</small><strong>${escapeHtml(item.word)}</strong><span>${escapeHtml(item.meaning)}</span><p><b>${escapeHtml(item.exampleSpanish)}</b>${escapeHtml(item.exampleEnglish)}</p></article>`).join("")}</div>` : ""}
    ${(grammar.notes || []).length ? `<div class="lesson-rule-list">${grammar.notes.map(note => `<article><span>${icon("check")}</span><div><strong>${escapeHtml(note.title)}</strong><p>${escapeHtml(note.text)}</p></div></article>`).join("")}</div>` : ""}
    ${renderCarlosTransition(lesson, "grammar")}
  `;
}

function renderDialogue(lesson, progress, scene) {
  const selectedId = progress.selectedChoiceId || getLessonMemory(lesson.id)?.choiceId;
  const selected = lesson.learnerChoices?.options?.find(choice => choice.id === selectedId);
  const compactChoice = Boolean(lesson.dialoguePresentation?.compactChoicePreview);
  return `
    ${renderSectionHeading(lesson, "dialogue", { eyebrow: "Conversation", title: scene.title || "Use it in context", body: scene.setting || "Follow the conversation from beginning to end." })}
    ${selected ? compactChoice
      ? `<article class="lesson-branch-banner compact"><small>Your choice is part of this scene</small><p>You chose ${escapeHtml(String(selected.label || "this").toLowerCase())}. The conversation below uses your order: <strong>${escapeHtml(selected.modelOrder)}</strong></p></article>`
      : `<article class="lesson-branch-banner"><header><small>Your choice in this conversation</small><h2>See how your earlier choice changes the scene</h2><p>The full conversation continues below with your version included.</p></header><div class="lesson-branch-turn learner"><small>You can say</small><strong>${escapeHtml(selected.modelOrder)}</strong>${selected.modelOrderEnglish ? `<p>${escapeHtml(selected.modelOrderEnglish)}</p>` : ""}</div><div class="lesson-branch-turn carlos"><small>Carlos answers</small><strong>${escapeHtml(selected.carlosSpanish)}</strong>${selected.carlosEnglish ? `<p>${escapeHtml(selected.carlosEnglish)}</p>` : ""}</div></article>`
      : ""}
    ${scene.languageNote ? `<article class="lesson-language-note"><span>${icon("message")}</span><div><small>${escapeHtml(scene.languageNote.title || "Language note")}</small><p>${escapeHtml(scene.languageNote.text || "")}</p></div></article>` : ""}
    <div class="lesson-dialogue-list">${renderDialogueLines(scene.lines || [], selected)}</div>
    ${renderCarlosTransition(lesson, "dialogue")}
  `;
}

function renderDialogueLines(lines, selected) {
  let currentScene = "";
  return lines.map(line => {
      const sceneName = String(line.scene || "").trim();
      const divider = sceneName && sceneName !== currentScene
        ? `<div class="lesson-scene-divider"><span>${escapeHtml(sceneName)}</span></div>`
        : "";
      if (sceneName) currentScene = sceneName;
      const resolved = resolveDialogueLine(line, selected);
      return `${divider}<article class="lesson-dialogue-line ${isLearnerSpeaker(line.speaker) ? "learner" : ""}"><span>${escapeHtml(displaySpeakerName(line.speaker))}</span><div><strong>${escapeHtml(resolved.spanish)}</strong>${resolved.english ? `<p>${escapeHtml(resolved.english)}</p>` : ""}</div>${renderSpeechButton(resolved.spanish, line.speaker, `Hear ${isLearnerSpeaker(line.speaker) ? "your model line" : displaySpeakerName(line.speaker)}`)}</article>`;
    }).join("");
}

function renderListening(lesson, progress) {
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
  const stageLabels = listening.stageLabels || ["Listen", "Read Along", "Check Understanding"];
  return `
    ${renderSectionHeading(lesson, "listening", { eyebrow: "Listening with Carlos", title: listening.title || "Can you follow our conversation?", body: listening.instructions || "Hear the same conversation again, then check what you understood." })}
    ${listening.soundscape ? `<article class="lesson-soundscape"><span>${icon("sound")}</span><div><small>${escapeHtml(listening.soundscape.label || "Scene atmosphere")}</small><p>${escapeHtml(listening.soundscape.description || listening.soundscape)}</p></div></article>` : ""}
    <nav class="lesson-listening-progress" aria-label="Listening steps">
      ${stageLabels.map((label, index) => `<button type="button" class="${pass === index ? "active" : ""} ${pass > index || state.complete ? "done" : ""}" onclick="hablaLesson.setListeningPass(${index})" ${pass === index ? 'aria-current="step"' : ""} aria-label="Listening pass ${index + 1}: ${escapeAttr(label)}"><i>${pass > index || state.complete ? icon("check") : index + 1}</i><span>${escapeHtml(label)}</span></button>`).join("")}
    </nav>
    ${pass === 0 ? `
      <article class="lesson-listening-coach">
        <img src="${escapeAttr(getCarlosAsset("speaking"))}" alt="Carlos guiding your listening practice" onerror="${CARLOS_FALLBACK_ONERROR}">
        <div><small>Pass 1 · Listen only</small><h2>Listen once.</h2><p>Don’t worry if you miss words. Just follow the conversation.</p></div>
        <button type="button" onclick="hablaLesson.playListening(0.92)" aria-label="Play the conversation at natural speed">${icon("sound")} Play conversation</button>
      </article>
      <button class="lesson-listening-next" type="button" onclick="hablaLesson.setListeningPass(1)">Follow with the transcript${icon("arrow")}</button>
    ` : ""}
    ${pass === 1 ? `
      <article class="lesson-listening-transcript">
        <header><div><small>Pass 2 · Read along</small><h2>Read while each person speaks</h2></div><div class="lesson-playback-buttons"><button type="button" onclick="hablaLesson.playListening(0.92)" aria-label="Play the conversation at natural speed">${icon("sound")} Natural</button><button type="button" onclick="hablaLesson.playListening(0.68)" aria-label="Play the conversation slowly">${icon("sound")} Slow</button></div></header>
        <div class="lesson-listen-list">${transcript.map(line => `<article class="${isLearnerSpeaker(line.speaker) ? "learner" : "speaker"}">${renderSpeechButton(line.spanish, line.speaker, `Hear ${isLearnerSpeaker(line.speaker) ? "your model line" : displaySpeakerName(line.speaker)}`)}<div><small>${escapeHtml(displaySpeakerName(line.speaker || "Carlos"))}</small><strong>${escapeHtml(line.spanish)}</strong><span>${escapeHtml(line.english || "")}</span></div></article>`).join("")}</div>
      </article>
      <button class="lesson-listening-next" type="button" onclick="hablaLesson.setListeningPass(2)">Check what you understood${icon("arrow")}</button>
    ` : ""}
    ${pass === 2 ? `
      <article class="lesson-listening-check">
        <header><small>Pass 3 · Check understanding</small><span>${questions.length ? `${questionIndex + 1} of ${questions.length}` : "Complete"}</span></header>
        ${question ? `<h2>${escapeHtml(question.prompt)}</h2><div class="lesson-listening-options">${options.map((option, optionIndex) => `<button type="button" class="${answered && option === question.answer ? "correct" : ""} ${answered && option === state.selected && option !== question.answer ? "wrong" : ""}" onclick="hablaLesson.answerListening(${optionIndex})" ${answered ? "disabled" : ""}><span>${String.fromCharCode(65 + optionIndex)}</span>${escapeHtml(option)}${answered && option === question.answer ? icon("check") : ""}</button>`).join("")}</div>${answered ? `<div class="lesson-listening-feedback"><strong>${state.selected === question.answer ? "You followed it." : `Answer: ${escapeHtml(question.answer)}`}</strong><p>${escapeHtml(question.explanation || "Listen once more and keep following the conversation.")}</p><button type="button" onclick="hablaLesson.nextListening()">${questionIndex + 1 >= questions.length ? "Finish listening" : "Next question"}${icon("arrow")}</button></div>` : ""}` : `<p>No listening questions are available.</p>`}
      </article>
    ` : ""}
  `;
}

function renderPronunciation(lesson) {
  const pronunciation = normalizeFirst(lesson.pronunciation) || {};
  const items = pronunciation.items || lesson.pronunciationExercises || pronunciation.exercises || [];
  const timeline = pronunciation.presentation === "dayTimeline";
  return `
    ${renderSectionHeading(lesson, "pronunciation", { eyebrow: "Pronunciation", title: pronunciation.focus || "Mission phrases", body: "Hear each phrase, then repeat it aloud. Clear communication matters more than perfection." })}
    <div class="lesson-pronunciation-list ${timeline ? "day-timeline" : ""}">${items.map((item, index) => `<article><span>${timeline && item.icon && ICONS[item.icon] ? icon(item.icon) : String(index + 1).padStart(2, "0")}</span><div>${item.moment ? `<em>${escapeHtml(item.moment)}</em>` : ""}<strong>${escapeHtml(item.text || item.spanish || item.phrase)}</strong><p>${escapeHtml(item.meaning || item.english || item.note || "")}</p><small>${escapeHtml(item.note || "Say it once slowly, then naturally.")}</small></div><button type="button" data-speech="${escapeAttr(item.text || item.spanish || item.phrase)}" data-rate="0.78" onclick="hablaLesson.speak(this.dataset.speech, this.dataset.rate)" aria-label="Hear ${escapeAttr(item.text || item.spanish || item.phrase)} slowly">${icon("sound")}</button></article>`).join("")}</div>
  `;
}

function renderSpeaking(lesson, progress) {
  const speaking = normalizeFirst(lesson.speaking) || {};
  const items = speaking.items || lesson.speakingChallenge || [];
  const stageLabels = ["Listen", "Your turn", "Keep talking", "One more challenge", "Finish the conversation"];
  const index = clamp(Number(progress.guidedSpeakingIndex || 0), 0, Math.max(items.length - 1, 0));
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
  return `
    ${index === 0 ? renderCarlosTransition(lesson, "listening") : ""}
    ${renderSectionHeading(lesson, "speaking", { eyebrow: "Guided conversation", title: "Talk it through with Carlos", body: speaking.instructions || "Listen to Carlos, answer aloud, then continue the conversation." })}
    <div class="lesson-guided-progress"><span>Exchange ${index + 1} of ${items.length}</span><i><b style="width:${Math.round(((index + 1) / items.length) * 100)}%"></b></i></div>
    <div class="lesson-speaking-path"><article class="stage-${escapeAttr(item.stage || (index < 2 ? "repeat" : "personalize"))}"><header><i>${index + 1}</i><span>${escapeHtml(item.label || stageLabels[index] || "Keep talking")}</span></header><div class="lesson-speaking-prompt"><div><small>${escapeHtml(displaySpeakerName(item.speaker || "Carlos"))} says:</small><h2>${escapeHtml(item.carlosPrompt || item.prompt)}</h2>${item.carlosPromptEnglish ? `<p>${escapeHtml(item.carlosPromptEnglish)}</p>` : ""}</div><button type="button" data-speech="${escapeAttr(item.carlosPrompt || item.text || "")}" data-speaker="${escapeAttr(item.speaker || "Carlos")}" onclick="hablaLesson.speak(this.dataset.speech, .84, this.dataset.speaker)" aria-label="Hear ${escapeAttr(displaySpeakerName(item.speaker || "Carlos"))}">${icon("sound")}</button></div><div class="lesson-speaking-turn"><span>${icon("mic")}</span><div><small>Your turn</small><strong>${escapeHtml(item.prompt)}</strong><p>${escapeHtml(item.cue || "Say your answer aloud.")}</p></div></div><details class="lesson-speaking-model"><summary>Need a model?</summary><button type="button" data-speech="${escapeAttr(item.text || item.exampleAnswer || "")}" onclick="hablaLesson.speak(this.dataset.speech, .82, 'Model')"><strong>${escapeHtml(item.text || item.exampleAnswer || "Create your own answer")}</strong>${icon("sound")}</button>${item.meaning ? `<p>${escapeHtml(item.meaning)}</p>` : ""}${renderSpeakingAlternatives(item.alternatives)}</details></article></div>
    ${index + 1 >= items.length ? renderCarlosTransition(lesson, "speaking") : ""}
  `;
}

function renderSpeakingAlternatives(alternatives) {
  if (!Array.isArray(alternatives) || !alternatives.length) return "";
  return `<div class="lesson-speaking-alternatives"><small>Also natural</small>${alternatives.map(alternative => {
    const text = typeof alternative === "string" ? alternative : alternative?.spanish;
    if (!text) return "";
    return `<button type="button" data-speech="${escapeAttr(text)}" onclick="hablaLesson.speak(this.dataset.speech, .82, 'Model')"><span>${escapeHtml(text)}</span>${icon("sound")}</button>`;
  }).join("")}</div>`;
}

function renderFlashcards(lesson, progress) {
  const cards = getAdaptiveFlashcards(lesson, progress.selectedChoiceId);
  const index = clamp(Number(progress.flashcardIndex || 0), 0, Math.max(cards.length - 1, 0));
  const card = cards[index] || { spanish: "", english: "" };
  const flipped = Boolean(progress.flashcardFlipped);
  return `
    <section class="lesson-section-heading"><span>Adaptive flashcards</span><h1>${progress.selectedChoiceId ? "Your choice comes first" : "Keep the mission language close"}</h1><p>Card ${index + 1} of ${cards.length}. Tap the card to flip it.</p></section>
    <button class="lesson-flashcard ${flipped ? "flipped" : ""}" type="button" onclick="hablaLesson.flipCard()"><small>${flipped ? "English" : "Spanish"}</small><strong>${escapeHtml(flipped ? card.english : card.spanish)}</strong><span>${flipped ? escapeHtml(card.spanish) : "Tap to reveal"}</span></button>
    <div class="lesson-flash-actions"><button type="button" data-speech="${escapeAttr(card.spanish)}" onclick="hablaLesson.speak(this.dataset.speech)" aria-label="Hear ${escapeAttr(card.spanish)} in Spanish">${icon("sound")} Hear it</button><button type="button" onclick="hablaLesson.nextCard()">${index + 1 >= cards.length ? "Start again" : "Next card"}${icon("arrow")}</button></div>
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
  return `
    ${renderSectionHeading(lesson, "quiz", { eyebrow: "Check your understanding", title: `Question ${index + 1} of ${questions.length}`, body: lesson.quizIntroduction || "Use the lesson context—not isolated memorization." }, { questionNumber: index + 1, questionCount: questions.length })}
    <article class="lesson-quiz-card">
      <div class="lesson-quiz-score"><span>${quiz.score || 0} correct</span><i><b style="width:${Math.round((index / questions.length) * 100)}%"></b></i></div>
      <h2>${escapeHtml(question.prompt)}</h2>
      <div class="lesson-quiz-options">
        ${options.length ? options.map((option, optionIndex) => {
          const correct = answered && isQuizAnswerCorrect(option, question.answer);
          const wrong = answered && option === quiz.selected && !isQuizAnswerCorrect(option, question.answer);
          return `<button type="button" class="${correct ? "correct" : ""} ${wrong ? "wrong" : ""}" onclick="hablaLesson.answerQuiz(${optionIndex})" ${answered ? "disabled" : ""}><span>${String.fromCharCode(65 + optionIndex)}</span>${escapeHtml(option)}${correct ? icon("check") : ""}</button>`;
        }).join("") : `<form class="lesson-quiz-input" onsubmit="event.preventDefault();hablaLesson.submitQuiz(this.elements.answer.value)"><label for="lesson-quiz-answer">Type your answer</label><div><input id="lesson-quiz-answer" name="answer" type="text" autocomplete="off" autocapitalize="sentences" ${answered ? "disabled" : ""} value="${answered ? escapeAttr(quiz.selected) : ""}" placeholder="Your answer"><button type="submit" ${answered ? "disabled" : ""}>Check answer${icon("arrow")}</button></div></form>`}
      </div>
      ${answered ? `<div class="lesson-quiz-feedback ${correctAnswer ? "correct" : "incorrect"}"><strong>${correctAnswer ? "¡Correcto!" : `Answer: ${escapeHtml(question.answer)}`}</strong><p>${escapeHtml(question.explanation)}</p><button type="button" onclick="hablaLesson.nextQuiz()">${index + 1 >= questions.length ? "Finish quiz" : "Next question"}${icon("arrow")}</button></div>` : ""}
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
    <section class="lesson-section-heading"><span>${escapeHtml(mission.presentationEyebrow || "Example conversation")}</span><h1>${escapeHtml(mission.presentationTitle || "Carlos Challenge")}</h1><p>${escapeHtml(mission.presentationBody || "Watch the conversation once, then try it yourself.")}</p></section>
    <article class="lesson-challenge-brief"><span>${icon("target")}</span><div><small>Your goal</small><h2>${escapeHtml(conversation.title || mission.title || "Complete the mission")}</h2><p>${escapeHtml(conversation.goal || conversation.mission || mission.mission || "Use what you learned in one complete exchange.")}</p></div></article>
    ${selected ? `<article class="lesson-memory-chip"><span>${renderChoiceIcon(selected.icon || selected.id)}</span><div><small>${escapeHtml(lesson.learnerChoices?.memoryLabel || "Carlos remembers")}</small><strong>${escapeHtml(selected.memoryCallback || `You picked ${String(selected.label || "this").toLowerCase()} first. I’ll remember that.`)}</strong></div></article>` : ""}
    ${turns.length ? `<div class="lesson-conversation">${turns.map(turn => {
      const resolved = resolveDialogueLine(turn, selected);
      return `<article class="${isLearnerSpeaker(turn.speaker) ? "learner" : "carlos"}"><small>${escapeHtml(displaySpeakerName(turn.speaker))}</small><strong>${escapeHtml(resolved.spanish)}</strong>${resolved.english ? `<p>${escapeHtml(resolved.english)}</p>` : ""}${renderSpeechButton(resolved.spanish, turn.speaker, `Hear ${isLearnerSpeaker(turn.speaker) ? "your model line" : displaySpeakerName(turn.speaker)}`)}</article>`;
    }).join("")}</div>` : ""}
    ${mission.successPresentation === "emotional"
      ? `<article class="lesson-success-emotional"><span>${icon("check")}</span><small>${escapeHtml(mission.successTitle || "Mission complete")}</small><h2>${escapeHtml(mission.successHeadline || "You did it.")}</h2><blockquote>${escapeHtml(mission.successCarlos || mission.completionResponse || "Carlos celebrates the conversation you completed.")}</blockquote>${(mission.successMoments || []).length ? `<div>${mission.successMoments.map(item => `<b>${icon("check")}${escapeHtml(item)}</b>`).join("")}</div>` : ""}</article>`
      : `<article class="lesson-success-criteria"><h2>${escapeHtml(mission.successTitle || "Mission success")}</h2><ul>${(mission.successCriteria || []).map(item => `<li>${icon("check")}${escapeHtml(item)}</li>`).join("")}</ul><p>${escapeHtml(mission.completionResponse || "Carlos celebrates the conversation you completed.")}</p></article>`}
    <article class="lesson-live-challenge">
      <img src="${escapeAttr(getCarlosAsset("speaking"))}" alt="Carlos ready to practice this lesson with you" onerror="${CARLOS_FALLBACK_ONERROR}">
      <div><small>Carlos</small><h2>Now it’s your turn.</h2><p>${escapeHtml(mission.livePracticeCopy || "Great job. Now try the conversation with me. I’ll help if you get stuck.")}</p></div>
      <button type="button" data-page="carlos">${icon("message")} Try it with Carlos</button>
    </article>
  `;
}

function renderCulture(lesson) {
  const culture = lesson.culture || {};
  const presentation = lesson.culturePresentation || {};
  const discoveries = new Map(getLessonDiscoveries(lesson.id).map(item => [item.id, item]));
  const worldBuilding = lesson.worldBuilding || [];
  const nativeSpeech = lesson.nativeSpeech || [];
  const commonMistakes = lesson.commonMistakes || [];
  const disclose = (enabled, label, count, content) => enabled && content
    ? `<details class="lesson-culture-disclosure"><summary><span><small>Tap to explore</small><strong>${escapeHtml(label)}</strong></span><b>${count}</b>${icon("arrow")}</summary><div>${content}</div></details>`
    : content;
  const worldContent = worldBuilding.length ? `<div class="lesson-world-notes">${worldBuilding.map(note => `<article><span>${icon(note.icon && ICONS[note.icon] ? note.icon : "message")}</span><div><small>${escapeHtml(note.moment)}</small><strong>${escapeHtml(note.carlosSpanish)}</strong><p>${escapeHtml(note.carlosEnglish)}</p></div><button type="button" data-speech="${escapeAttr(note.carlosSpanish)}" onclick="hablaLesson.speak(this.dataset.speech)" aria-label="Hear Carlos: ${escapeAttr(note.carlosSpanish)}">${icon("sound")}</button></article>`).join("")}</div>` : "";
  const nativeLabel = presentation.nativeSpeechLabel || "You may also hear";
  const nativeContent = nativeSpeech.length ? `<article class="lesson-native-note"><small>${escapeHtml(nativeLabel)}</small>${nativeSpeech.map(note => `<div><strong>${escapeHtml(note.phrase)}</strong><span>${escapeHtml(note.meaning)}</span><p>${escapeHtml(note.note)}</p></div>`).join("")}</article>` : "";
  const mistakesContent = commonMistakes.length ? `<div class="lesson-mistake-list">${commonMistakes.map(note => `<article><small>Instead of</small><del>${escapeHtml(note.mistake)}</del><strong>${escapeHtml(note.better)}</strong><p>${escapeHtml(note.why)}</p></article>`).join("")}</div>` : "";
  return `
    ${renderSectionHeading(lesson, "culture", { eyebrow: culture.speaker ? `${culture.speaker} says` : "Living Madrid", title: culture.title || "Spanish in real life", body: culture.text || "Carlos shares the context behind the language." })}
    ${culture.speaker ? `<article class="lesson-culture-quote"><small>${escapeHtml(culture.speaker)}</small><blockquote>${escapeHtml(culture.text)}</blockquote></article>` : ""}
    ${disclose(presentation.collapseWorldBuilding, presentation.worldBuildingLabel || "Story moments", worldBuilding.length, worldContent)}
    ${(culture.regionalNotes || []).length ? `<div class="lesson-regional-notes">${culture.regionalNotes.map(note => `<article><small>${escapeHtml(note.label)}</small><strong>${escapeHtml(note.phrase)}</strong><p>${escapeHtml(note.text)}</p></article>`).join("")}</div>` : ""}
    ${(lesson.livingWorldInteractions || []).length ? `<div class="lesson-discoveries">${lesson.livingWorldInteractions.map(discovery => {
      const found = discoveries.get(discovery.id);
      return `<article class="${found ? "discovered" : ""}">${discovery.image ? `<img class="lesson-discovery-image" src="${escapeAttr(discovery.image)}" alt="${escapeAttr(discovery.title)}" loading="lazy">` : ""}<div><small>${found ? escapeHtml(discovery.savedEyebrow || "Travel journal moment") : escapeHtml(discovery.eyebrow || "Discover more")}</small><h2>${escapeHtml(discovery.title)}</h2>${found ? `<strong>${escapeHtml(discovery.carlosSpanish)}</strong><p>${escapeHtml(discovery.carlosEnglish)}</p>` : `<p>${escapeHtml(discovery.prompt || "Look a little closer.")}</p>`}</div><button type="button" onclick="hablaLesson.discover('${escapeAttr(discovery.id)}')" ${found ? "disabled" : ""}>${found ? icon("check") : icon("star")}<span>${found ? escapeHtml(discovery.savedLabel || "New memory added") : "Explore"}</span></button></article>`;
    }).join("")}</div>` : ""}
    ${disclose(presentation.collapseNativeSpeech, nativeLabel, nativeSpeech.length, nativeContent)}
    ${presentation.showCommonMistakes || presentation.collapseCommonMistakes ? disclose(presentation.collapseCommonMistakes, "Common mix-ups", commonMistakes.length, mistakesContent) : ""}
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

function renderReward(lesson) {
  const completionXP = getLessonCompletionXP(lesson);
  const ceremony = lesson.chapterCeremony;
  const closing = getLessonClosing(lesson);
  const showAchievement = lesson.achievement && !ceremony?.hideAchievement;
  const showXp = !ceremony?.hideXp;
  return `
    ${renderSectionHeading(lesson, "reward", { eyebrow: ceremony?.eyebrow || (ceremony ? "Chapter complete" : "Mission accomplished"), title: ceremony?.title || "You made this part of Madrid yours", body: ceremony?.subtitle || "Your conversation becomes part of your Spanish passport." })}
    ${closing ? `<article class="lesson-carlos-closing"><img src="${escapeAttr(getCarlosAsset("celebrating"))}" alt="Carlos celebrating your lesson progress" onerror="${CARLOS_FALLBACK_ONERROR}"><div><small>Carlos</small><blockquote>${escapeHtml(closing)}</blockquote>${lesson.microCliffhanger?.english ? `<p>${escapeHtml(lesson.microCliffhanger.english)}</p>` : ""}</div></article>` : ""}
    ${ceremony ? `<article class="lesson-chapter-ceremony"><small>Carlos says</small><blockquote>${escapeHtml(ceremony.carlosSpanish)}</blockquote><p>${escapeHtml(ceremony.carlosEnglish)}</p>${ceremony.journey?.length ? `<div>${ceremony.journey.map(place => `<span>${escapeHtml(place)}</span>`).join("")}</div>` : ""}${ceremony.nextDestination ? `<b>Next destination · ${escapeHtml(ceremony.nextDestination)}</b>` : ""}</article>` : ""}
    <div class="lesson-reward-grid ${ceremony ? "is-chapter-finale" : ""}">
      ${lesson.passportStamp ? `<article class="lesson-passport-reward"><span>${icon("passport")}</span><small>Passport stamp</small><h2>${escapeHtml(lesson.passportStamp.title)}</h2><b>${escapeHtml(lesson.passportStamp.city || "España")}</b><p>${escapeHtml(lesson.passportStamp.description)}</p></article>` : ""}
      ${showAchievement ? `<article class="lesson-achievement-reward"><span>${icon("star")}</span><small>Achievement</small><h2>${escapeHtml(lesson.achievement.title)}</h2><p>${escapeHtml(lesson.achievement.description)}</p>${showXp ? `<b class="lesson-xp-detail">+${completionXP} XP</b>` : ""}</article>` : ""}
    </div>
  `;
}

function renderLessonCompletion(lesson) {
  const completionXP = getLessonCompletionXP(lesson);
  const next = getLessonById(lesson.nextLesson);
  const ceremony = lesson.chapterCeremony;
  if (ceremony?.postcard) {
    return `
      <section class="lesson-v2 lesson-completion-screen lesson-finale-screen" aria-label="${escapeAttr(ceremony.title || lesson.title)}" aria-live="polite">
        <article class="lesson-finale-card">
          <div class="lesson-completion-glow" aria-hidden="true"></div>
          <span class="lesson-finale-seal">${icon("passport")}</span>
          <small>${escapeHtml(ceremony.eyebrow || "Chapter complete")}</small>
          <h1>${escapeHtml(ceremony.title || "Madrid Complete")}</h1>
          <p>${escapeHtml(ceremony.subtitle || "Madrid is now part of your Spanish story.")}</p>
          <div class="lesson-finale-carlos">
            <small>Carlos</small>
            <blockquote>${escapeHtml(ceremony.carlosSpanish)}</blockquote>
            <p>${escapeHtml(ceremony.carlosEnglish)}</p>
          </div>
          ${lesson.passportStamp ? `<div class="lesson-finale-stamp"><span>${icon("passport")}</span><div><small>Madrid passport</small><strong>${escapeHtml(lesson.passportStamp.title)}</strong></div><b>Added</b></div>` : ""}
          ${renderChapterPostcard(ceremony)}
          <p class="lesson-finale-exit-note">Your journey is saved. Use the navigation below whenever you’re ready.</p>
        </article>
      </section>
    `;
  }
  return `
    <section class="lesson-v2 lesson-completion-screen" aria-label="${escapeAttr(lesson.title)} complete">
      <article class="lesson-completion-card">
        <div class="lesson-completion-glow" aria-hidden="true"></div>
        <span class="lesson-completion-check">${icon("check")}</span>
        <small>${ceremony ? "Madrid chapter complete" : escapeHtml(lesson.completionLabel || "Lesson complete")}</small>
        <h1>${escapeHtml(lesson.title)}</h1>
        <div class="lesson-completion-carlos">
          <small>Carlos</small>
          <p>${escapeHtml(getLessonClosing(lesson))}</p>
          ${lesson.microCliffhanger?.english ? `<blockquote class="lesson-completion-cliffhanger"><small>Next time with Carlos</small>${escapeHtml(lesson.microCliffhanger.english)}</blockquote>` : ""}
        </div>
        ${next ? `<div class="lesson-completion-next"><small>Next episode</small><strong>Lesson ${getLessonNumber(next)} · ${escapeHtml(next.title)}</strong><p>${escapeHtml(next.objective || next.objectives?.[0] || "Your Spanish journey continues.")}</p></div>` : ""}
        <div class="lesson-completion-rewards">
          ${lesson.passportStamp ? `<span>${icon("passport")}<b>${escapeHtml(lesson.passportStamp.title)}</b> stamp</span>` : ""}
          ${lesson.achievement ? `<span>${icon("star")}<b>${escapeHtml(lesson.achievement.title)}</b> unlocked</span>` : ""}
          <span class="lesson-completion-xp"><b>+${completionXP}</b> XP</span>
        </div>
        <div class="lesson-completion-actions">
          ${next ? `<button class="lesson-completion-primary" type="button" onclick="hablaLesson.finishCompletion('next')">Start next lesson${icon("arrow")}</button>` : ""}
          <button class="lesson-completion-secondary" type="button" onclick="hablaLesson.finishCompletion('learn')">Back to Learn</button>
        </div>
      </article>
    </section>
  `;
}

function renderCliffhanger(lesson) {
  const cliffhanger = lesson.microCliffhanger || {};
  const next = getLessonById(cliffhanger.payoffLesson || lesson.nextLesson);
  return `
    <article class="lesson-next-episode">
      <div class="lesson-next-light"></div>
      <span>Next episode</span>
      <h1>${escapeHtml(next?.title || "Your journey continues")}</h1>
      ${cliffhanger.confirmationSpanish ? `<aside class="lesson-next-message"><header><span class="lesson-phone-avatar">C</span><div><strong>Carlos</strong><small>Now</small></div></header><p>${escapeHtml(cliffhanger.confirmationSpanish)}</p>${cliffhanger.confirmationEnglish ? `<small>${escapeHtml(cliffhanger.confirmationEnglish)}</small>` : ""}</aside>` : ""}
      ${cliffhanger.speaker ? `<small class="lesson-next-speaker">${escapeHtml(cliffhanger.speaker)} says:</small>` : ""}
      <blockquote>${escapeHtml(cliffhanger.spanish)}</blockquote>
      <p>${escapeHtml(cliffhanger.english)}</p>
      <small>${escapeHtml(cliffhanger.footer || "Ready for the next chapter? Continue Carlos’s story when you’re ready.")}</small>
    </article>
  `;
}

function renderLessonControls(step, stepIndex, steps, lesson, progress) {
  const isLast = stepIndex === steps.length - 1;
  const choiceBlocked = step?.type === "choice" && !progress.selectedChoiceId && !getLessonMemory(lesson.id)?.choiceId;
  const quizBlocked = step?.type === "quiz" && !progress.rendererQuiz?.complete;
  const blocked = choiceBlocked || quizBlocked;
  const speakingItems = step?.type === "speaking" ? (normalizeFirst(lesson.speaking)?.items || lesson.speakingChallenge || []) : [];
  const guidedIndex = clamp(Number(progress.guidedSpeakingIndex || 0), 0, Math.max(speakingItems.length - 1, 0));
  const moreGuidedExchanges = step?.type === "speaking" && guidedIndex < speakingItems.length - 1;
  const backLabel = step?.type === "speaking" && guidedIndex > 0 ? "Previous exchange" : "Back";
  const nextLabel = moreGuidedExchanges
    ? "Next exchange"
    : progress.completed && isLast
    ? "Back to Learn"
    : isLast
      ? "Complete episode"
      : `Next · ${steps[stepIndex + 1]?.label || "Lesson"}`;
  return `
    <footer class="lesson-controls">
      <button type="button" class="lesson-control-secondary" onclick="hablaLesson.previous()" ${stepIndex === 0 ? "disabled" : ""}>${icon("back")} ${escapeHtml(backLabel)}</button>
      <button type="button" class="lesson-control-primary" onclick="hablaLesson.next()" ${blocked ? "disabled" : ""}><span>${escapeHtml(nextLabel)}</span>${icon(progress.completed && isLast ? "check" : "arrow")}</button>
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
    if (guidedIndex < speakingItems.length - 1) {
      updateLessonProgress(lesson.id, { guidedSpeakingIndex: guidedIndex + 1 });
      rerenderLesson(true);
      return;
    }
  }
  if (step.type === "choice" && !progress.selectedChoiceId && !getLessonMemory(lesson.id)?.choiceId) return;
  if (step.type === "quiz" && !progress.rendererQuiz?.complete) return;

  const completedSections = Array.from(new Set([...(progress.completedSections || []), step.id]));
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
  updateLessonProgress(lesson.id, { completedSections, rendererStep: index + 1, flashcardFlipped: false });
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
  updateLessonProgress(lesson.id, { rendererStep: Math.max(0, Number(progress.rendererStep || 0) - 1) });
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
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
  const cards = getAdaptiveFlashcards(lesson, progress.selectedChoiceId);
  const nextIndex = (Number(progress.flashcardIndex || 0) + 1) % Math.max(cards.length, 1);
  updateLessonProgress(lesson.id, { flashcardIndex: nextIndex, flashcardFlipped: false });
  rerenderLesson(false);
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
    completeCurrentStepAndAdvance(lesson, "listening", {
      rendererListening: { ...current, pass: 2, questionIndex, complete: true },
    });
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

function playListeningConversation(rate = 0.92) {
  const lesson = getActiveLesson();
  const listening = normalizeFirst(lesson?.listening) || {};
  const transcript = listening.transcript || normalizeDialogue(lesson?.dialogue || lesson?.dialogues)[0]?.lines || [];
  const lines = transcript
    .map(line => ({ text: line.spanish || line.exampleSpanish || "", speaker: isLearnerSpeaker(line.speaker) ? "Model" : line.speaker || "Carlos" }))
    .filter(line => line.text);
  if (lines.length) speakSequence(lines, Number(rate || 0.92));
  else speakSpanish(listening.naturalScript || "", rate, "Carlos");
}

function speakSequence(lines, rate) {
  void playSpeechSequence(lines, { rate });
}

function speakSpanish(text, rate = 0.84, speaker = "Carlos") {
  void playSpeech(text, { rate, speaker });
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

function displaySpeakerName(speaker) {
  if (isLearnerSpeaker(speaker)) return personalizeText("{{learnerName}}");
  const name = normalize(speaker);
  if (name === "camarera" || name === "camarero") return "Server";
  return speaker || "Carlos";
}

function getAdaptiveFlashcards(lesson, choiceId) {
  const deck = normalizeFirst(lesson.flashcards) || {};
  const sourceItems = [...(deck.items || [])];
  const items = deck.shuffle ? stableShuffle(sourceItems, `${lesson.id}:flashcards`) : sourceItems;
  const priority = deck.adaptiveOrdering?.[choiceId] || [];
  const ordered = [...priority, ...items.filter(item => !priority.includes(item))];
  return ordered.map(value => lookupFlashcard(lesson, value));
}

function lookupFlashcard(lesson, value) {
  const normalized = normalize(value);
  const vocabulary = (lesson.vocabulary || []).find(item => normalize(item.spanish) === normalized || normalize(item.spanish).includes(normalized) || normalized.includes(normalize(item.spanish)));
  const phrase = (lesson.essentialPhrases || []).find(item => normalize(item.spanish) === normalized || normalize(item.spanish).includes(normalized));
  const choice = lesson.learnerChoices?.options?.find(item => normalize(item.learnerSpanish) === normalized);
  const choiceOrder = lesson.learnerChoices?.options?.find(item => normalize(item.modelOrder) === normalized);
  return { spanish: value, english: vocabulary?.english || phrase?.english || choice?.learnerEnglish || choiceOrder?.modelOrderEnglish || "Review this mission phrase" };
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

function isQuizAnswerCorrect(given, expected) {
  const normalizedGiven = normalize(given);
  const expectedText = String(expected || "");
  return [expectedText, ...expectedText.split("/")]
    .map(normalize)
    .filter(Boolean)
    .some(answer => normalizedGiven === answer);
}

function rerenderLesson(scroll = false) {
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

function escapeHtml(value) {
  return personalizeText(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
