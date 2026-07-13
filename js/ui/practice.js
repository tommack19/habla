import { getActiveLesson, getUnlockedLessons } from "../core/content.js";

const TOPIC_KEY = "habla_selected_practice_topic_v1";
const SESSION_KEY = "habla_practice_session_v2";
const MODES = ["quiz", "flashcards", "pronunciation", "conversation"];
const TOPICS = {
  greetings: { title: "Greetings", icon: "greetings", lessons: ["a1-lesson-01-greetings", "a1-lesson-02-introductions"] },
  family: { title: "Family", icon: "family", lessons: ["lesson-03-family"] },
  "food-restaurants": { title: "Restaurants", icon: "restaurants", lessons: ["lesson-06-food-drinks"] },
  travel: { title: "Travel", icon: "travel", lessons: ["lesson-07-travel-basics", "lesson-08-vacation"] },
  shopping: { title: "Shopping", icon: "shopping", lessons: ["lesson-05-shopping"] },
  work: { title: "Work", icon: "work", lessons: ["lesson-14-work"] },
  phrases: { title: "Small Talk", icon: "phrases", lessons: ["a1-lesson-02-introductions"] },
  numbers: { title: "Numbers", icon: "numbers", lessons: ["lesson-04-numbers-time"] },
};

let recorder = null;
let recordingStream = null;
let recordingChunks = [];
let playbackUrl = "";

export function renderPractice(appState = {}) {
  const session = readSession();
  const topic = TOPICS[session.topic] || TOPICS.greetings;
  const lesson = getLessonForTopic(session.topic);

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
        <div><span class="practice-kicker">Habla.</span><h1>Practice</h1><p>Practice speaking, listening and more.</p></div>
        <span class="practice-level">A1 Beginner</span>
      </header>
      <div class="practice-mode-tabs" role="tablist" aria-label="Practice mode">
        ${modeTab("quiz", "Quiz", session.mode)}
        ${modeTab("flashcards", "Flashcards", session.mode)}
        ${modeTab("pronunciation", "Pronunciation", session.mode)}
        ${modeTab("conversation", "Conversation", session.mode)}
      </div>
      ${renderSummary(session.mode, topic, lesson)}
      <section class="practice-topic-section">
        <div class="practice-section-title"><h2>Practice by Topic</h2><span>Choose a focus</span></div>
        <div class="practice-topic-grid">
          ${Object.entries(TOPICS).map(([slug, item]) => {
            const availableLesson = getLessonForTopic(slug);
            const count = availableLesson ? getModeCount(session.mode, availableLesson) : 0;
            return `<button class="practice-topic ${session.topic === slug ? "selected" : ""} ${availableLesson ? "" : "locked"}" type="button" onclick="hablaPractice.selectTopic('${slug}')" aria-pressed="${session.topic === slug}">
              <span class="practice-topic-icon topic-${item.icon}" aria-hidden="true"></span>
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
        <div class="practice-empty-row"><span aria-hidden="true">↗</span><div><strong>Your practice history starts here</strong><small>Complete a focused session to build your review habit.</small></div></div>
      </section>
    </section>`;
}

function modeTab(mode, label, selected) {
  return `<button class="practice-mode-tab mode-${mode} ${selected === mode ? "selected" : ""}" type="button" role="tab" aria-selected="${selected === mode}" onclick="hablaPractice.selectMode('${mode}')"><span aria-hidden="true"></span><small>${label}</small></button>`;
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
    <div class="practice-summary-mark" aria-hidden="true"></div>
    <button class="practice-primary" type="button" onclick="hablaPractice.start()">${action}<span aria-hidden="true">›</span></button>
  </section>`;
}

function renderActivityHeader(title) {
  return `<header class="practice-activity-head"><button type="button" onclick="hablaPractice.back()" aria-label="Back to Practice">‹</button><h1>${title}</h1><span></span></header>`;
}

function renderTopicSummary(topic, lesson, current, total, mode) {
  const percent = total ? Math.round((current / total) * 100) : 0;
  return `<section class="practice-activity-summary mode-${mode}">
    <span class="practice-topic-icon topic-${topic.icon}" aria-hidden="true"></span>
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
    <button class="practice-primary practice-next" type="button" ${selected ? "" : "disabled"} onclick="hablaPractice.nextQuiz()">${session.quiz.index + 1 === total ? "See Results" : "Next Question"}<span>›</span></button>
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
    <button class="practice-flashcard ${session.flash.flipped ? "flipped" : ""}" type="button" onclick="hablaPractice.flip()" aria-label="Flip flashcard">
      <span class="flash-star">☆</span>
      <span class="flash-audio" data-phrase="${escapeAttr(card.spanish)}" onclick="event.stopPropagation();hablaPractice.speak(this.dataset.phrase)" aria-label="Hear Spanish">⌕</span>
      <span class="flash-front"><strong>${escapeHtml(card.spanish)}</strong><small>Tap card to flip</small></span>
      <span class="flash-back"><em>${escapeHtml(card.english)}</em>${card.exampleSpanish ? `<strong>${escapeHtml(card.exampleSpanish)}</strong><p>${escapeHtml(card.exampleEnglish || "")}</p>` : ""}${card.tip ? `<small>${escapeHtml(card.tip)}</small>` : ""}</span>
    </button>
    <div class="practice-card-nav"><button type="button" onclick="hablaPractice.prevCard()" aria-label="Previous card">‹</button><strong>${session.flash.index + 1} / ${total}</strong><button type="button" onclick="hablaPractice.nextCard()" aria-label="Next card">›</button></div>
    <button class="practice-secondary" type="button" onclick="hablaPractice.shuffleCards()">⌘&nbsp; Shuffle Cards</button>
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
      <button class="pron-listen" type="button" data-phrase="${escapeAttr(item.text)}" onclick="hablaPractice.speak(this.dataset.phrase)" aria-label="Listen to phrase">⌕</button>
      <button class="pron-mic ${session.pronunciation.recording ? "recording" : ""}" type="button" onclick="hablaPractice.toggleRecording()"><span>♩</span><small>${session.pronunciation.recording ? "Tap to stop" : "Tap to record"}</small></button>
      <div class="pron-status" aria-live="polite">${escapeHtml(session.pronunciation.message || "Speak now when you’re ready.")}</div>
      <audio class="pron-playback" controls ${playbackUrl ? `src="${escapeAttr(playbackUrl)}"` : "hidden"}></audio>
      <div class="pron-wave" aria-hidden="true">${Array.from({length: 26}, (_, i) => `<i style="height:${8 + ((i * 11) % 27)}px"></i>`).join("")}</div>
      ${item.note ? `<small class="pron-note">${escapeHtml(item.note)}</small>` : ""}
    </div>
    <div class="pron-actions"><button type="button" data-phrase="${escapeAttr(item.text)}" onclick="hablaPractice.speak(this.dataset.phrase)">↻ Listen Again</button><button type="button" onclick="hablaPractice.nextPronunciation()">${session.pronunciation.index + 1 === total ? "Finish" : "Next"}<span>›</span></button></div>
  </section>`;
}

function renderLockedActivity(session, topic) {
  return `<section class="practice-shell practice-activity">${renderActivityHeader(modeTitle(session.mode))}<div class="practice-locked-state"><span>◇</span><h2>${topic.title} practice is still locked</h2><p>Continue your lessons to unlock real ${topic.title.toLowerCase()} vocabulary and exercises.</p><button class="practice-primary" onclick="hablaPractice.back()">Back to Practice</button></div></section>`;
}

function renderNoDataActivity(session, topic, lesson) {
  return `<section class="practice-shell practice-activity">${renderActivityHeader(modeTitle(session.mode))}<div class="practice-locked-state"><span>◇</span><h2>No ${modeTitle(session.mode).toLowerCase()} material yet</h2><p>${escapeHtml(shortLessonTitle(lesson.title))} does not include this practice type. Nothing unrelated has been substituted.</p><button class="practice-primary" onclick="hablaPractice.back()">Back to Practice</button></div></section>`;
}

function renderResults(session, topic, lesson) {
  const total = session.quiz?.questions?.length || 0;
  const score = session.quiz?.score || 0;
  const percent = total ? Math.round((score / total) * 100) : 0;
  return `<section class="practice-shell practice-activity practice-results">${renderActivityHeader("Results")}<div class="results-card"><span>Session complete</span><strong>${percent}%</strong><h2>${topic.title} Quiz</h2><p>${score} of ${total} correct</p><button class="practice-primary" onclick="hablaPractice.restartQuiz()">Practice Again</button><button class="practice-secondary" onclick="hablaPractice.back()">Back to Practice</button></div></section>`;
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

function readSession() {
  let saved = {};
  try { saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "{}"); } catch {}
  let suppliedTopic = "";
  try { suppliedTopic = localStorage.getItem(TOPIC_KEY) || ""; } catch {}
  const topic = TOPICS[suppliedTopic] ? suppliedTopic : (TOPICS[saved.topic] ? saved.topic : "greetings");
  return { ...saved, mode: MODES.includes(saved.mode) ? saved.mode : "quiz", topic, view: ["launcher", "activity", "results"].includes(saved.view) ? saved.view : "launcher" };
}

function writeSession(session) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
function rerender() { window.dispatchEvent(new CustomEvent("habla:practice-render")); }

function stopRecordingResources() {
  if (recordingStream) recordingStream.getTracks().forEach(track => track.stop());
  recordingStream = null;
  recorder = null;
}

window.hablaPractice = {
  selectMode(mode) { const session = readSession(); session.mode = MODES.includes(mode) ? mode : "quiz"; session.view = "launcher"; writeSession(session); rerender(); },
  selectTopic(topic) { const session = readSession(); session.topic = TOPICS[topic] ? topic : "greetings"; localStorage.setItem(TOPIC_KEY, session.topic); session.view = "launcher"; writeSession(session); rerender(); },
  start() { const session = readSession(); if (session.mode === "conversation") { window.dispatchEvent(new CustomEvent("habla:practice-conversation", { detail: { topic: session.topic, title: TOPICS[session.topic].title } })); return; } session.view = "activity"; writeSession(session); rerender(); },
  back() { stopRecordingResources(); const session = readSession(); session.view = "launcher"; if (session.pronunciation) session.pronunciation.recording = false; writeSession(session); rerender(); },
  answer(index) { const session = readSession(); const question = session.quiz?.questions?.[session.quiz.index]; if (!question || session.quiz.selected) return; const answer = question.options[index]; session.quiz.selected = answer; if (answer === question.answer) session.quiz.score += 1; writeSession(session); rerender(); },
  nextQuiz() { const session = readSession(); if (!session.quiz?.selected) return; if (session.quiz.index + 1 >= session.quiz.questions.length) session.view = "results"; else { session.quiz.index += 1; session.quiz.selected = ""; } writeSession(session); rerender(); },
  restartQuiz() { const session = readSession(); const lesson = getLessonForTopic(session.topic); if (!lesson) return; ensureQuizSession(session, lesson, true); session.view = "activity"; writeSession(session); rerender(); },
  flip() { const session = readSession(); session.flash.flipped = !session.flash.flipped; writeSession(session); rerender(); },
  prevCard() { const session = readSession(); const total = session.flash.order.length; session.flash.index = (session.flash.index - 1 + total) % total; session.flash.flipped = false; writeSession(session); rerender(); },
  nextCard() { const session = readSession(); session.flash.index = (session.flash.index + 1) % session.flash.order.length; session.flash.flipped = false; writeSession(session); rerender(); },
  shuffleCards() { const session = readSession(); session.flash.order = shuffle(session.flash.order); session.flash.index = 0; session.flash.flipped = false; writeSession(session); rerender(); },
  speak(text) { speakSpanish(text); },
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
  nextPronunciation() { const session = readSession(); const lesson = getLessonForTopic(session.topic); const total = getPronunciation(lesson).length; if (session.pronunciation.index + 1 >= total) { session.view = "launcher"; session.pronunciation.index = 0; } else session.pronunciation.index += 1; session.pronunciation.message = ""; writeSession(session); rerender(); },
};

function shuffle(values) {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}

function speakSpanish(text) { if (!text || !window.speechSynthesis) return; speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(text); utterance.lang = "es-ES"; utterance.rate = .85; speechSynthesis.speak(utterance); }
function normalize(value) { return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¿?¡!.,]/g, "").trim(); }
function shortLessonTitle(title) { return String(title || "Lesson").replace(/^.*?:\s*/, ""); }
function modeTitle(mode) { return mode === "flashcards" ? "Flashcards" : mode === "pronunciation" ? "Pronunciation" : "Quiz"; }
function escapeAttr(value) { return escapeHtml(value).replace(/`/g, "&#96;"); }
function escapeHtml(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
