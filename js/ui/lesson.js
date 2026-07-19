import {
  completeLesson,
  getActiveLesson,
  getCourseProgress,
  getLessonById,
  getLessonProgress,
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

const ICONS = {
  back: `<path d="m15 18-6-6 6-6"/>`,
  book: `<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3H4V5.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v18a3 3 0 0 1 3-3h3V5.5Z"/>`,
  sound: `<path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="M15 9.5a4 4 0 0 1 0 5M17.5 7a7 7 0 0 1 0 10"/>`,
  check: `<path d="m5 12 4 4L19 6"/>`,
  arrow: `<path d="m8 5 7 7-7 7"/>`,
  message: `<path d="M4 5h16v11H8l-4 4V5Z"/>`,
  target: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m14 10 6-6"/>`,
  star: `<path d="m12 2.8 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3-4.6-4.5 6.4-.9L12 2.8Z"/>`,
  passport: `<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="11" r="4"/><path d="M8 11h8M12 7c1.2 1.2 1.8 2.5 1.8 4S13.2 13.8 12 15M12 7c-1.2 1.2-1.8 2.5-1.8 4s.6 2.8 1.8 4"/>`,
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
    discover: discoverLivingWorldMoment,
    speak: speakSpanish,
  };
}

export function renderLesson() {
  const lesson = getActiveLesson();
  if (!lesson) return renderMissingLesson();

  const progress = getLessonProgress(lesson.id);
  const steps = buildLessonSteps(lesson);
  const stepIndex = clamp(Number(progress.rendererStep || 0), 0, Math.max(steps.length - 1, 0));
  const step = steps[stepIndex];
  const completedSections = new Set(progress.completedSections || []);
  const percent = progress.completed
    ? 100
    : Math.round((completedSections.size / Math.max(steps.length, 1)) * 100);

  return `
    <section class="lesson-v2 emotion-${slugify(lesson.emotionalArc?.emotion || "journey")}" aria-label="${escapeAttr(lesson.title)} lesson">
      ${renderLessonHeader(lesson, step, stepIndex, steps, percent, progress)}
      <nav class="lesson-step-rail" aria-label="Lesson sections">
        ${steps.map((item, index) => renderStepDot(item, index, stepIndex, completedSections, progress.completed)).join("")}
      </nav>
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
      <span class="lesson-header-count">${progress.completed ? "Done" : `${stepIndex + 1}/${steps.length}`}</span>
      <div class="lesson-header-progress" aria-label="${percent}% complete"><i style="width:${percent}%"></i></div>
    </header>
  `;
}

function renderStepDot(step, index, activeIndex, completedSections, lessonCompleted) {
  const done = lessonCompleted || completedSections.has(step.id);
  const available = index <= activeIndex || done;
  return `<button type="button" class="lesson-step-dot ${index === activeIndex ? "active" : ""} ${done ? "done" : ""}" onclick="hablaLesson.goTo(${index})" ${available ? "" : "disabled"} aria-label="${escapeAttr(step.label)}${done ? ", complete" : ""}"><i>${done ? icon("check") : index + 1}</i><span>${escapeHtml(step.label)}</span></button>`;
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

function renderStory(lesson) {
  const story = lesson.story || {};
  const intro = lesson.carlosIntroduction || {};
  const artwork = preloadLessonArtwork(lesson);
  const mission = story.mission || lesson.realLifeMission?.mission || lesson.objectives?.[0];
  return `
    <article class="lesson-story-hero">
      ${artwork ? `<img src="${escapeAttr(artwork)}" alt="${escapeAttr(story.location || lesson.title)}" loading="eager" fetchpriority="high" decoding="async" onerror="${LESSON_ARTWORK_ONERROR}">` : ""}
      <div class="lesson-story-shade"></div>
      <div class="lesson-story-copy">
        <span>${escapeHtml(story.time || story.location || story.city || "Your Spanish journey")}</span>
        <h1>${escapeHtml(lesson.title)}</h1>
        <p>${escapeHtml(story.scene || mission || "A new conversation with Carlos begins.")}</p>
      </div>
    </article>
    ${renderMemoryCallback(lesson)}
    <article class="lesson-carlos-intro">
      <img src="${escapeAttr(getCarlosAsset("speaking"))}" alt="Carlos, your Spanish tutor" onerror="${CARLOS_FALLBACK_ONERROR}">
      <div><span>Carlos</span><h2>${escapeHtml(intro.title || intro.eyebrow || "Let’s begin")}</h2><p>${escapeHtml(intro.message || intro.text || mission)}</p></div>
    </article>
    <article class="lesson-mission-card">
      <span class="lesson-icon">${icon("target")}</span>
      <div><small>Your mission</small><h2>${escapeHtml(mission || "Complete the conversation")}</h2><ul>${(lesson.canDo || lesson.objectives || []).slice(0, 4).map(item => `<li>${icon("check")}${escapeHtml(item)}</li>`).join("")}</ul></div>
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
    return `<article class="lesson-memory-chip"><span>${icon("star")}</span><div><small>Carlos remembered</small><strong>${escapeHtml(message.spanish || message)}</strong>${message.english ? `<p>${escapeHtml(message.english)}</p>` : ""}</div></article>`;
  }
  return "";
}

function renderMessages(lesson, progress, scene) {
  return `
    <section class="lesson-section-heading"><span>Incoming message</span><h1>${escapeHtml(scene.title || "Carlos texted you")}</h1><p>${escapeHtml(scene.setting || "Read the conversation as a real message exchange.")}</p></section>
    <article class="lesson-phone-thread" aria-label="Message conversation with Carlos">
      <header><span class="lesson-phone-avatar">C</span><div><strong>${escapeHtml(scene.presentation?.contact || "Carlos")}</strong><small>Online</small></div></header>
      <div class="lesson-message-list">${(scene.lines || []).map(line => `<div class="lesson-message ${String(line.speaker).toLowerCase() === "learner" ? "outgoing" : "incoming"}"><small>${escapeHtml(line.speaker)}</small><p>${escapeHtml(line.spanish || line.exampleSpanish || line.intent)}</p>${line.english || line.exampleEnglish ? `<span>${escapeHtml(line.english || line.exampleEnglish)}</span>` : ""}<button type="button" data-speech="${escapeAttr(line.spanish || line.exampleSpanish || "")}" onclick="hablaLesson.speak(this.dataset.speech)">${icon("sound")}<span class="sr-only">Hear phrase</span></button></div>`).join("")}</div>
    </article>
  `;
}

function renderChoice(lesson, progress) {
  const choices = lesson.learnerChoices;
  const selectedId = progress.selectedChoiceId || getLessonMemory(lesson.id)?.choiceId;
  const selected = choices.options.find(choice => choice.id === selectedId);
  return `
    <section class="lesson-section-heading"><span>Your choice</span><h1>${escapeHtml(choices.prompt || "What do you choose?")}</h1><p>The language goal stays the same. You decide how this moment unfolds.</p></section>
    <div class="lesson-choice-grid">
      ${choices.options.map(choice => `<button type="button" class="lesson-choice-card ${choice.id === selectedId ? "selected" : ""}" onclick="hablaLesson.choose('${escapeAttr(choice.id)}')"><span>${choiceGlyph(choice.id)}</span><strong>${escapeHtml(choice.label || choice.learnerEnglish)}</strong><small>${escapeHtml(choice.learnerSpanish)}</small>${choice.id === selectedId ? icon("check") : ""}</button>`).join("")}
    </div>
    ${selected ? `<article class="lesson-choice-response"><span class="lesson-phone-avatar">C</span><div><small>Carlos responds</small><h2>${escapeHtml(selected.carlosSpanish)}</h2><p>${escapeHtml(selected.carlosEnglish)}</p><button type="button" data-speech="${escapeAttr(selected.carlosSpanish)}" onclick="hablaLesson.speak(this.dataset.speech)">${icon("sound")} Hear Carlos</button></div></article>` : `<p class="lesson-choice-hint">Choose one to continue the story.</p>`}
  `;
}

function renderVocabulary(lesson, progress) {
  const selectedId = progress.selectedChoiceId || getLessonMemory(lesson.id)?.choiceId;
  const selected = lesson.learnerChoices?.options?.find(choice => choice.id === selectedId);
  const prioritized = prioritizeVocabulary(lesson.vocabulary || [], selected);
  const groups = groupBy(prioritized, item => item.group || "Useful words");
  return `
    <section class="lesson-section-heading"><span>Vocabulary</span><h1>Words inside the experience</h1><p>${selected ? `${escapeHtml(selected.label)} comes first because that’s what you chose.` : "Learn the words that help you complete the mission."}</p></section>
    <div class="lesson-vocab-groups">${Object.entries(groups).map(([group, items]) => `<section><h2>${escapeHtml(group)}</h2><div class="lesson-vocab-grid">${items.map(item => `<article class="lesson-vocab-item"><div><strong>${escapeHtml(item.spanish)}</strong><span>${escapeHtml(item.english)}</span></div><button type="button" data-speech="${escapeAttr(item.spanish)}" onclick="hablaLesson.speak(this.dataset.speech)">${icon("sound")}</button>${item.exampleSpanish ? `<p><b>${escapeHtml(item.exampleSpanish)}</b><small>${escapeHtml(item.exampleEnglish)}</small></p>` : ""}</article>`).join("")}</div></section>`).join("")}</div>
  `;
}

function renderGrammar(lesson) {
  const grammar = lesson.grammar || {};
  return `
    <section class="lesson-section-heading"><span>One useful pattern</span><h1>${escapeHtml(grammar.topic || "Grammar in context")}</h1><p>${escapeHtml(grammar.meaning || grammar.explanation)}</p></section>
    <article class="lesson-grammar-note"><small>Remember</small><p>${escapeHtml(grammar.explanation || "")}</p><div class="lesson-grammar-examples">${(grammar.examples || []).map(example => `<button type="button" data-speech="${escapeAttr(example.spanish)}" onclick="hablaLesson.speak(this.dataset.speech)"><strong>${escapeHtml(example.spanish)}</strong><span>${escapeHtml(example.english)}</span>${icon("sound")}</button>`).join("")}</div></article>
    ${(grammar.notes || []).length ? `<div class="lesson-rule-list">${grammar.notes.map(note => `<article><span>${icon("check")}</span><div><strong>${escapeHtml(note.title)}</strong><p>${escapeHtml(note.text)}</p></div></article>`).join("")}</div>` : ""}
  `;
}

function renderDialogue(lesson, progress, scene) {
  const selectedId = progress.selectedChoiceId;
  const selected = lesson.learnerChoices?.options?.find(choice => choice.id === selectedId);
  return `
    <section class="lesson-section-heading"><span>Conversation</span><h1>${escapeHtml(scene.title || "Use it in context")}</h1><p>${escapeHtml(scene.setting || "Follow the conversation from beginning to end.")}</p></section>
    ${selected ? `<article class="lesson-branch-banner"><small>Your version</small><strong>${escapeHtml(selected.modelOrder)}</strong><span>${escapeHtml(selected.carlosSpanish)}</span></article>` : ""}
    <div class="lesson-dialogue-list">${renderDialogueLines(scene.lines || [], selected)}</div>
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
      return `${divider}<article class="lesson-dialogue-line ${String(line.speaker).toLowerCase() === "learner" ? "learner" : ""}"><span>${escapeHtml(line.speaker)}</span><div><strong>${escapeHtml(resolved.spanish)}</strong>${resolved.english ? `<p>${escapeHtml(resolved.english)}</p>` : ""}</div><button type="button" data-speech="${escapeAttr(resolved.spanish)}" onclick="hablaLesson.speak(this.dataset.speech)">${icon("sound")}</button></article>`;
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
  return `
    <section class="lesson-section-heading"><span>Listening with Carlos</span><h1>${escapeHtml(listening.title || "Can you follow our conversation?")}</h1><p>${escapeHtml(listening.instructions || "Hear the same conversation again, then check what you understood.")}</p></section>
    <nav class="lesson-listening-progress" aria-label="Listening steps">
      ${["Listen", "Follow along", "Understand"].map((label, index) => `<button type="button" class="${pass === index ? "active" : ""} ${pass > index || state.complete ? "done" : ""}" onclick="hablaLesson.setListeningPass(${index})"><i>${pass > index || state.complete ? icon("check") : index + 1}</i><span>${label}</span></button>`).join("")}
    </nav>
    ${pass === 0 ? `
      <article class="lesson-listening-coach">
        <img src="${escapeAttr(getCarlosAsset("speaking"))}" alt="Carlos guiding your listening practice" onerror="${CARLOS_FALLBACK_ONERROR}">
        <div><small>Pass 1 · Listen only</small><h2>Listen to Carlos one more time</h2><p>Put the transcript away. You do not need to catch every word—just follow the conversation.</p></div>
        <button type="button" data-speech="${escapeAttr(script)}" data-rate="0.92" onclick="hablaLesson.speak(this.dataset.speech, this.dataset.rate)">${icon("sound")} Play conversation</button>
      </article>
      <button class="lesson-listening-next" type="button" onclick="hablaLesson.setListeningPass(1)">Follow with the transcript${icon("arrow")}</button>
    ` : ""}
    ${pass === 1 ? `
      <article class="lesson-listening-transcript">
        <header><div><small>Pass 2 · Follow along</small><h2>Read while Carlos speaks</h2></div><div class="lesson-playback-buttons"><button type="button" data-speech="${escapeAttr(script)}" data-rate="0.92" onclick="hablaLesson.speak(this.dataset.speech, this.dataset.rate)">${icon("sound")} Natural</button><button type="button" data-speech="${escapeAttr(slowScript)}" data-rate="0.68" onclick="hablaLesson.speak(this.dataset.speech, this.dataset.rate)">${icon("sound")} Slow</button></div></header>
        <div class="lesson-listen-list">${transcript.map(line => `<article><button type="button" data-speech="${escapeAttr(line.spanish)}" onclick="hablaLesson.speak(this.dataset.speech)">${icon("sound")}</button><div><small>${escapeHtml(line.speaker || "Carlos")}</small><strong>${escapeHtml(line.spanish)}</strong><span>${escapeHtml(line.english || "")}</span></div></article>`).join("")}</div>
      </article>
      <button class="lesson-listening-next" type="button" onclick="hablaLesson.setListeningPass(2)">Check what you understood${icon("arrow")}</button>
    ` : ""}
    ${pass === 2 ? `
      <article class="lesson-listening-check">
        <header><small>Pass 3 · Understand</small><span>${questions.length ? `${questionIndex + 1} of ${questions.length}` : "Complete"}</span></header>
        ${question ? `<h2>${escapeHtml(question.prompt)}</h2><div class="lesson-listening-options">${options.map((option, optionIndex) => `<button type="button" class="${answered && option === question.answer ? "correct" : ""} ${answered && option === state.selected && option !== question.answer ? "wrong" : ""}" onclick="hablaLesson.answerListening(${optionIndex})" ${answered ? "disabled" : ""}><span>${String.fromCharCode(65 + optionIndex)}</span>${escapeHtml(option)}${answered && option === question.answer ? icon("check") : ""}</button>`).join("")}</div>${answered ? `<div class="lesson-listening-feedback"><strong>${state.selected === question.answer ? "You followed it." : `Answer: ${escapeHtml(question.answer)}`}</strong><p>${escapeHtml(question.explanation || "Listen once more and keep following the conversation.")}</p><button type="button" onclick="hablaLesson.nextListening()">${questionIndex + 1 >= questions.length ? "Finish listening" : "Next question"}${icon("arrow")}</button></div>` : ""}` : `<p>No listening questions are available.</p>`}
      </article>
    ` : ""}
  `;
}

function renderPronunciation(lesson) {
  const pronunciation = normalizeFirst(lesson.pronunciation) || {};
  const items = pronunciation.items || lesson.pronunciationExercises || pronunciation.exercises || [];
  return `
    <section class="lesson-section-heading"><span>Pronunciation</span><h1>${escapeHtml(pronunciation.focus || "Mission phrases")}</h1><p>Hear each phrase, then repeat it aloud. Clear communication matters more than perfection.</p></section>
    <div class="lesson-pronunciation-list">${items.map((item, index) => `<article><span>${String(index + 1).padStart(2, "0")}</span><div><strong>${escapeHtml(item.text || item.spanish || item.phrase)}</strong><p>${escapeHtml(item.meaning || item.english || item.note || "")}</p><small>${escapeHtml(item.note || "Say it once slowly, then naturally.")}</small></div><button type="button" data-speech="${escapeAttr(item.text || item.spanish || item.phrase)}" data-rate="0.78" onclick="hablaLesson.speak(this.dataset.speech, this.dataset.rate)">${icon("sound")}</button></article>`).join("")}</div>
  `;
}

function renderSpeaking(lesson) {
  const speaking = normalizeFirst(lesson.speaking) || {};
  const items = speaking.items || lesson.speakingChallenge || [];
  const stageLabels = ["Listen", "Your turn", "Keep talking", "One more challenge", "Finish the conversation"];
  return `
    <section class="lesson-section-heading"><span>Speaking with Carlos</span><h1>Now let’s try it together</h1><p>${escapeHtml(speaking.instructions || "Carlos will guide you through the same café conversation, one natural response at a time.")}</p></section>
    <article class="lesson-speaking-coach"><img src="${escapeAttr(getCarlosAsset("speaking"))}" alt="Carlos coaching your Spanish conversation" onerror="${CARLOS_FALLBACK_ONERROR}"><div><small>Carlos says</small><strong>We’ve heard the conversation. Now talk with me—I’ll help you all the way through.</strong></div></article>
    <div class="lesson-speaking-path">${items.map((item, index) => `<article class="stage-${escapeAttr(item.stage || (index < 2 ? "repeat" : "personalize"))}"><header><i>${index + 1}</i><span>${escapeHtml(item.label || stageLabels[index] || "Keep talking")}</span></header><div class="lesson-speaking-prompt"><small>Carlos</small><h2>${escapeHtml(item.carlosPrompt || item.prompt)}</h2></div><p class="lesson-speaking-cue">${escapeHtml(item.cue || "Say your answer aloud.")}</p><button type="button" data-speech="${escapeAttr(item.text || item.exampleAnswer || "")}" onclick="hablaLesson.speak(this.dataset.speech)"><strong>${escapeHtml(item.text || item.exampleAnswer || "Create your own answer")}</strong>${icon("sound")}</button>${item.meaning ? `<p class="lesson-speaking-meaning">${escapeHtml(item.meaning)}</p>` : ""}</article>`).join("")}</div>
  `;
}

function renderFlashcards(lesson, progress) {
  const cards = getAdaptiveFlashcards(lesson, progress.selectedChoiceId);
  const index = clamp(Number(progress.flashcardIndex || 0), 0, Math.max(cards.length - 1, 0));
  const card = cards[index] || { spanish: "", english: "" };
  const flipped = Boolean(progress.flashcardFlipped);
  return `
    <section class="lesson-section-heading"><span>Adaptive flashcards</span><h1>${progress.selectedChoiceId ? "Your choice comes first" : "Keep the mission language close"}</h1><p>Card ${index + 1} of ${cards.length}. Tap the card to flip it.</p></section>
    <button class="lesson-flashcard ${flipped ? "flipped" : ""}" type="button" onclick="hablaLesson.flipCard()"><small>${flipped ? "English" : "Spanish"}</small><strong>${escapeHtml(flipped ? card.english : card.spanish)}</strong><span>${flipped ? escapeHtml(card.spanish) : "Tap to reveal"}</span></button>
    <div class="lesson-flash-actions"><button type="button" data-speech="${escapeAttr(card.spanish)}" onclick="hablaLesson.speak(this.dataset.speech)">${icon("sound")} Hear it</button><button type="button" onclick="hablaLesson.nextCard()">${index + 1 >= cards.length ? "Start again" : "Next card"}${icon("arrow")}</button></div>
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
    <section class="lesson-section-heading"><span>Check your understanding</span><h1>Question ${index + 1} of ${questions.length}</h1><p>${escapeHtml(lesson.quizIntroduction || "Use the lesson context—not isolated memorization.")}</p></section>
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
  const selected = lesson.learnerChoices?.options?.find(choice => choice.id === progress.selectedChoiceId);
  const turns = conversation.turns || [];
  return `
    <section class="lesson-section-heading"><span>Carlos challenge</span><h1>${escapeHtml(conversation.title || "Complete the mission")}</h1><p>${escapeHtml(conversation.goal || conversation.mission || "Use what you learned in one complete exchange.")}</p></section>
    ${selected ? `<article class="lesson-memory-chip"><span>${icon("star")}</span><div><small>Carlos remembers</small><strong>You chose ${escapeHtml(selected.label)}.</strong></div></article>` : ""}
    ${turns.length ? `<div class="lesson-conversation">${turns.map(turn => {
      const resolved = resolveDialogueLine(turn, selected);
      return `<article class="${String(turn.speaker).toLowerCase() === "learner" ? "learner" : "carlos"}"><small>${escapeHtml(turn.speaker)}</small><strong>${escapeHtml(resolved.spanish)}</strong>${resolved.english ? `<p>${escapeHtml(resolved.english)}</p>` : ""}</article>`;
    }).join("")}</div>` : ""}
    <article class="lesson-success-criteria"><h2>Mission success</h2><ul>${(lesson.realLifeMission?.successCriteria || []).map(item => `<li>${icon("check")}${escapeHtml(item)}</li>`).join("")}</ul><p>${escapeHtml(lesson.realLifeMission?.completionResponse || "Carlos celebrates the conversation you completed.")}</p></article>
  `;
}

function renderCulture(lesson) {
  const culture = lesson.culture || {};
  const discoveries = new Map(getLessonDiscoveries(lesson.id).map(item => [item.id, item]));
  return `
    <section class="lesson-section-heading"><span>Living Madrid</span><h1>${escapeHtml(culture.title || "Spanish in real life")}</h1><p>${escapeHtml(culture.text || "Carlos shares the context behind the language.")}</p></section>
    ${(lesson.worldBuilding || []).length ? `<div class="lesson-world-notes">${lesson.worldBuilding.map(note => `<article><span>${icon("message")}</span><div><small>${escapeHtml(note.moment)}</small><strong>${escapeHtml(note.carlosSpanish)}</strong><p>${escapeHtml(note.carlosEnglish)}</p></div><button type="button" data-speech="${escapeAttr(note.carlosSpanish)}" onclick="hablaLesson.speak(this.dataset.speech)">${icon("sound")}</button></article>`).join("")}</div>` : ""}
    ${(lesson.livingWorldInteractions || []).length ? `<div class="lesson-discoveries">${lesson.livingWorldInteractions.map(discovery => {
      const found = discoveries.get(discovery.id);
      return `<article class="${found ? "discovered" : ""}"><div><small>${found ? "Moment collected" : "Optional discovery"}</small><h2>${escapeHtml(discovery.title)}</h2>${found ? `<strong>${escapeHtml(discovery.carlosSpanish)}</strong><p>${escapeHtml(discovery.carlosEnglish)}</p>` : `<p>${escapeHtml(discovery.prompt || "Look a little closer.")}</p>`}</div><button type="button" onclick="hablaLesson.discover('${escapeAttr(discovery.id)}')" ${found ? "disabled" : ""}>${found ? icon("check") : icon("star")}<span>${found ? "Discovered" : "Explore"}</span></button></article>`;
    }).join("")}</div>` : ""}
    ${(lesson.nativeSpeech || []).length ? `<article class="lesson-native-note"><small>You may also hear</small>${lesson.nativeSpeech.map(note => `<div><strong>${escapeHtml(note.phrase)}</strong><span>${escapeHtml(note.meaning)}</span><p>${escapeHtml(note.note)}</p></div>`).join("")}</article>` : ""}
  `;
}

function renderReward(lesson) {
  const ceremony = lesson.chapterCeremony;
  return `
    <section class="lesson-section-heading"><span>${ceremony ? "Chapter complete" : "Mission accomplished"}</span><h1>${escapeHtml(ceremony?.title || "You made this part of Madrid yours")}</h1><p>${escapeHtml(ceremony?.subtitle || "Your conversation becomes part of your Spanish passport.")}</p></section>
    ${ceremony ? `<article class="lesson-chapter-ceremony"><small>Carlos says</small><blockquote>${escapeHtml(ceremony.carlosSpanish)}</blockquote><p>${escapeHtml(ceremony.carlosEnglish)}</p>${ceremony.journey?.length ? `<div>${ceremony.journey.map(place => `<span>${escapeHtml(place)}</span>`).join("")}</div>` : ""}${ceremony.nextDestination ? `<b>Next destination · ${escapeHtml(ceremony.nextDestination)}</b>` : ""}</article>` : ""}
    <div class="lesson-reward-grid">
      ${lesson.passportStamp ? `<article class="lesson-passport-reward"><span>${icon("passport")}</span><small>Passport stamp</small><h2>${escapeHtml(lesson.passportStamp.title)}</h2><p>${escapeHtml(lesson.passportStamp.description)}</p><b>${escapeHtml(lesson.passportStamp.city || "España")}</b></article>` : ""}
      ${lesson.achievement ? `<article class="lesson-achievement-reward"><span>${icon("star")}</span><small>Achievement</small><h2>${escapeHtml(lesson.achievement.title)}</h2><p>${escapeHtml(lesson.achievement.description)}</p><b>+${Number(lesson.xpReward || 0)} XP</b></article>` : ""}
    </div>
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
      <blockquote>${escapeHtml(cliffhanger.spanish)}</blockquote>
      <p>${escapeHtml(cliffhanger.english)}</p>
      <small>Complete this episode to add your stamp and unlock what happens next.</small>
    </article>
  `;
}

function renderLessonControls(step, stepIndex, steps, lesson, progress) {
  const isLast = stepIndex === steps.length - 1;
  const choiceBlocked = step?.type === "choice" && !progress.selectedChoiceId && !getLessonMemory(lesson.id)?.choiceId;
  const quizBlocked = step?.type === "quiz" && !progress.rendererQuiz?.complete;
  const blocked = choiceBlocked || quizBlocked;
  return `
    <footer class="lesson-controls">
      <button type="button" class="lesson-control-secondary" onclick="hablaLesson.previous()" ${stepIndex === 0 ? "disabled" : ""}>${icon("back")} Back</button>
      <button type="button" class="lesson-control-primary" onclick="hablaLesson.next()" ${blocked ? "disabled" : ""}><span>${progress.completed && isLast ? "Back to Learn" : isLast ? "Complete Episode" : "Continue"}</span>${icon(progress.completed && isLast ? "check" : "arrow")}</button>
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
  if (step.type === "choice" && !progress.selectedChoiceId && !getLessonMemory(lesson.id)?.choiceId) return;
  if (step.type === "quiz" && !progress.rendererQuiz?.complete) return;

  const completedSections = Array.from(new Set([...(progress.completedSections || []), step.id]));
  if (index >= steps.length - 1) {
    if (!progress.completed) {
      updateLessonProgress(lesson.id, { completedSections, rendererStep: index });
      completeLesson(lesson.id);
      evaluateAchievements({ completedLessonsCount: getCourseProgress().completedCount });
      rerenderLesson();
    } else {
      document.querySelector('[data-page="learn"]')?.click();
    }
    return;
  }
  updateLessonProgress(lesson.id, { completedSections, rendererStep: index + 1, flashcardFlipped: false });
  rerenderLesson(true);
}

function previousLessonStep() {
  const lesson = getActiveLesson();
  if (!lesson) return;
  const progress = getLessonProgress(lesson.id);
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
  updateLessonProgress(lesson.id, { rendererListening: last
    ? { ...current, pass: 2, questionIndex, complete: true }
    : { ...current, pass: 2, questionIndex: questionIndex + 1, selected: null }
  });
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
  updateLessonProgress(lesson.id, { rendererQuiz: last ? { ...quiz, complete: true } : { ...quiz, index: Number(quiz.index || 0) + 1, selected: null } });
  rerenderLesson(false);
}

function discoverLivingWorldMoment(discoveryId) {
  const lesson = getActiveLesson();
  const discovery = lesson?.livingWorldInteractions?.find(item => item.id === discoveryId);
  if (!lesson || !discovery) return;
  rememberDiscovery(lesson, discovery);
  rerenderLesson(false);
}

function speakSpanish(text, rate = 0.84) {
  if (!text || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(String(text).replaceAll("/", ""));
  utterance.lang = "es-ES";
  utterance.rate = Number(rate || 0.84);
  window.speechSynthesis.speak(utterance);
}

function getAdaptiveFlashcards(lesson, choiceId) {
  const deck = normalizeFirst(lesson.flashcards) || {};
  const items = [...(deck.items || [])];
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
  const terms = normalize(`${choice.learnerSpanish} ${choice.modelOrder || ""}`).split(/\s+/).filter(word => word.length > 3);
  return [...items].sort((a, b) => Number(terms.some(term => normalize(a.spanish).includes(term))) < Number(terms.some(term => normalize(b.spanish).includes(term))) ? 1 : -1);
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

function choiceGlyph(id) {
  return ({ apples: "A", bread: "B", cheese: "Q", coffee: "C", flowers: "F", tomatoes: "T", tea: "T", juice: "J" })[id] || "•";
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
  return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
