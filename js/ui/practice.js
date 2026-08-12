import { getLessonProgress, getSavedQuizReviewQuestions, getUnlockedLessons, updateLessonProgress } from "../core/content.js";
import { playSpeech, stopSpeech } from "../core/audio.js";
import { awardXP, getCurrentXP } from "../core/progress.js";
import { state } from "../core/state.js";
import { saveState } from "../core/storage.js";
import {
  getDeck,
  getDecks,
  getPracticeSentences,
  getPracticeVocabulary,
  getSavedWords,
  getWeakSpots,
} from "../core/practiceData.js";
import {
  getPracticeStreak,
  ratePracticeCard,
  readPracticeState,
  recordPracticeResult,
  recordWeakSpot,
  saveGameScore,
} from "../core/practiceStore.js";
import { buildVerbQuestion, getVerb, PRACTICE_VERBS, VERB_SUBJECTS } from "../data/practiceVerbs.js";
import { getGrammarTopic, GRAMMAR_TOPICS } from "../data/practiceGrammar.js";

const SESSION_KEY = "habla_practice_session_v3";
const DIRECTIONS = ["spanish-english", "english-spanish", "mixed"];
let speedTimer = null;
let autoAdvanceTimer = null;
let pointerStart = null;

export function renderPractice() {
  const session = readSession();
  const routes = {
    hub: renderHub,
    daily: renderDailyPractice,
    "flashcards-setup": renderFlashcardSetup,
    flashcards: renderFlashcards,
    verbs: renderVerbTrainer,
    "verb-drill": renderVerbDrill,
    games: renderGames,
    "word-match": renderWordMatch,
    "sentence-builder": renderSentenceBuilder,
    "speed-round": renderSpeedRound,
    "conjugation-sprint": renderConjugationSprint,
    grammar: renderGrammarLab,
    "grammar-drill": renderGrammarDrill,
    "saved-words": renderSavedWords,
    "saved-questions": renderSavedQuestions,
    "needs-practice": renderNeedsPractice,
    summary: renderReviewSummary,
  };
  return (routes[session.view] || renderHub)(session);
}

function renderHub() {
  const dueCount = getDeck("due").cards.length;
  const weakSpots = getWeakSpots();
  const savedCount = getSavedWords().length;
  const needsPracticeCount = getNeedsPracticeCards().length;
  const store = readPracticeState();
  const streak = getPracticeStreak(store);
  const verbsToReview = Math.min(3, PRACTICE_VERBS.length);
  const estimatedMinutes = Math.max(2, Math.min(8, Math.ceil((dueCount + verbsToReview + 1) / 4)));
  const dailyActivityCount = buildDailyTasks().length;
  return `<section class="practice-hub" aria-labelledby="practice-title">
    <header class="practice-hub-title"><div><small>Practice</small><h1 id="practice-title">Practice</h1><p>Sharpen your Spanish.</p></div><span aria-hidden="true">${icon("target")}</span></header>
    <section class="practice-today" aria-label="Today's challenge">
      <header><div><small>Today’s challenge</small><h2>Build today’s<br>momentum</h2><p>${estimatedMinutes} minutes · ${dailyActivityCount} activities</p></div><div class="practice-streak" aria-label="${streak} day practice streak">${icon("flame")}<strong>${streak}</strong><span>day streak</span></div></header>
      <div class="practice-hero-scene" role="img" aria-label="A warm café street in Madrid"><span><small>Today in Madrid</small><strong>Café &amp; conversation</strong></span></div>
      <button class="practice-cta" type="button" onclick="hablaPractice.startDailyPractice()">${icon("review")}<span>Start Daily Practice</span>${icon("arrow")}</button>
    </section>
    <section class="practice-section practice-modes"><header><h2>Choose a mode</h2></header>
      <div class="practice-mode-grid">
        ${modeCard("flashcards", "Flashcards", "Review words and phrases", `${dueCount} due`, "cards")}
        ${modeCard("verbs", "Verb Trainer", "Master conjugations", `${verbsToReview} to review`, "verbs")}
        ${modeCard("games", "Quick Games", "Fast recall challenges", "4 games", "games")}
        ${modeCard("grammar", "Grammar Lab", "Practice useful patterns", `${GRAMMAR_TOPICS.length} topics`, "grammar")}
      </div>
    </section>
    <section class="practice-shortcuts" aria-labelledby="practice-review-title"><header><h2 id="practice-review-title">Review status</h2></header>
      <div class="practice-collections">
        ${collectionButton("saved-words", "bookmark", "Saved Words", savedCount, "", "saved")}
        ${collectionButton("needs-practice", "retry", "Needs Practice", needsPracticeCount, "", "practice")}
        ${collectionButton("needs-practice", "alert", "Weak Spots", weakSpots.length, "", "weak")}
        ${collectionButton("flashcards-setup", "clock", "Due for Review", dueCount, "due", "due")}
      </div>
    </section>
    <section class="practice-section practice-weak"><header><h2>Your weak spots</h2><button type="button" onclick="hablaPractice.open('needs-practice')">View all</button></header>
      ${weakSpots.length ? `<div class="practice-weak-list">${weakSpots.map(renderWeakSpot).join("")}</div>` : `<div class="practice-empty"><span>${icon("spark")}</span><div><strong>No weak spots yet</strong><p>Mistakes from drills and saved review items will guide this section.</p></div></div>`}
    </section>
  </section>`;
}

function modeCard(route, title, description, count, iconName) {
  return `<button class="practice-mode-card mode-${route}" type="button" onclick="hablaPractice.open('${route === "flashcards" ? "flashcards-setup" : route}')"><span class="practice-mode-icon">${icon(iconName)}</span><span class="practice-mode-copy"><strong>${title}</strong><p>${description}</p></span><small class="practice-mode-metric">${count}</small>${icon("arrow")}</button>`;
}

function collectionButton(route, iconName, title, count, deck = "", accent = "saved") {
  return `<button class="progress-${accent}" type="button" onclick="hablaPractice.open('${route}'${deck ? `,'${deck}'` : ""})"><span>${icon(iconName)}</span><strong>${count}</strong><small>${title}</small></button>`;
}

function renderWeakSpot(item) {
  const improving = item.mastery >= 55;
  return `<button class="${improving ? "is-improving" : "needs-work"}" type="button" onclick="hablaPractice.openWeakSpot('${escapeJs(item.id)}')"><span>${icon(improving ? "trend" : "alert")}</span><div><strong>${escapeHtml(item.title)}</strong><i aria-label="${item.mastery}% mastery">${[20,40,60,80,100].map(value => `<b class="${item.mastery >= value ? "filled" : ""}"></b>`).join("")}</i></div><small>${improving ? "Improving" : "Needs work"}</small>${icon("arrow")}</button>`;
}

function deckChip(deck) {
  return `<button type="button" onclick="hablaPractice.open('flashcards-setup','${deck.id}')"><span>${icon(deckIcon(deck.id))}</span><strong>${escapeHtml(deck.title)}</strong><small>${deck.cards.length}</small></button>`;
}

function renderDailyPractice(session) {
  const daily = session.daily;
  if (!daily?.tasks?.length) return renderHub();
  if (daily.index >= daily.tasks.length) return renderReviewSummary({ summary: { title: "Daily Practice", answered: daily.tasks.length, correct: daily.correct, missed: daily.missed, returnView: "hub" } });
  const task = daily.tasks[daily.index];
  if (daily.feedback) queueAutoAdvance(advanceDaily, daily.feedback.type === "correct" ? 650 : 1050);
  const progress = Math.round((daily.index / daily.tasks.length) * 100);
  return `<section class="practice-tool practice-daily">${toolHeader("Daily Practice")}
    <div class="practice-live-head"><span>${daily.index + 1} / ${daily.tasks.length}</span><i><b style="width:${progress}%"></b></i><strong>${icon("flame")} ${daily.streak}</strong></div>
    ${task.type === "flash" ? renderDailyFlash(task, daily) : renderDailyQuestion(task, daily)}
  </section>`;
}

function renderDailyFlash(task, daily) {
  const revealed = daily.revealed;
  return `<article class="practice-daily-card ${revealed ? "is-revealed" : ""}"><small>Vocabulary recall</small><h1>${escapeHtml(task.spanish)}</h1>${revealed ? `<div class="practice-daily-answer"><strong>${escapeHtml(task.english)}</strong><p>${escapeHtml(task.exampleSpanish || "")}</p></div><div class="practice-rating"><button class="again" onclick="hablaPractice.answerDaily('again')">${icon("back")}Again</button><button class="hard" onclick="hablaPractice.answerDaily('hard')">Hard</button><button class="got-it" onclick="hablaPractice.answerDaily('got-it')">Got it${icon("arrow")}</button></div>` : `<button class="practice-cta" onclick="hablaPractice.revealDaily()"><span>Reveal answer</span>${icon("flip")}</button>`}${daily.feedback ? practiceLiveFeedback(daily.feedback) : ""}</article>`;
}

function renderDailyQuestion(task, daily) {
  const answered = daily.selected != null;
  const correct = answered && normalize(daily.selected) === normalize(task.answer);
  return `<article class="practice-drill-card practice-daily-card"><small>${task.type === "verb" ? `${escapeHtml(task.infinitive)} · present` : "Grammar focus"}</small><h1>${escapeHtml(task.prompt)}</h1>${task.english ? `<p>${escapeHtml(task.english)}</p>` : ""}<div class="practice-answer-grid">${task.options.map(option => answerButton(option, task.answer, daily.selected, "answerDaily")).join("")}</div>${answered ? feedback(correct, task.explanation || completedPrompt(task.prompt, task.answer), task.explanation || `Correct answer: ${task.answer}.`) : ""}${daily.feedback ? practiceLiveFeedback(daily.feedback) : ""}</article>`;
}

function renderFlashcardSetup(session) {
  const decks = getDecks();
  const selected = session.deckId || "due";
  const direction = DIRECTIONS.includes(session.direction) ? session.direction : "mixed";
  return `<section class="practice-tool practice-flash-setup">${toolHeader("Flashcards")}
    <header class="practice-tool-intro"><span>${icon("cards")}</span><div><small>Deck builder</small><h1>Flashcards</h1><p>Choose what to review and which direction to practise.</p></div></header>
    <section class="practice-picker"><h2>Choose a deck</h2><div class="practice-deck-list">${decks.map(deck => `<button type="button" class="${selected === deck.id ? "selected" : ""}" onclick="hablaPractice.selectDeck('${deck.id}')" aria-pressed="${selected === deck.id}"><span>${icon(deckIcon(deck.id))}</span><div><strong>${escapeHtml(deck.title)}</strong><small>${deck.cards.length} cards</small></div>${selected === deck.id ? icon("check") : icon("arrow")}</button>`).join("")}</div></section>
    <section class="practice-picker"><h2>Card direction</h2><div class="practice-segmented">${directionButton("spanish-english", "Spanish → English", direction)}${directionButton("english-spanish", "English → Spanish", direction)}${directionButton("mixed", "Mixed", direction)}</div></section>
    <button class="practice-cta practice-tool-cta" type="button" onclick="hablaPractice.startFlashcards()" ${getDeck(selected).cards.length ? "" : "disabled"}>${icon("cards")}<span>${getDeck(selected).cards.length ? "Start flashcards" : "No cards in this deck"}</span>${icon("arrow")}</button>
  </section>`;
}

function directionButton(id, label, current) {
  return `<button type="button" class="${id === current ? "selected" : ""}" onclick="hablaPractice.setDirection('${id}')" aria-pressed="${id === current}">${label}</button>`;
}

function renderFlashcards(session) {
  const cards = session.flash?.cards || [];
  const index = Math.min(Number(session.flash?.index || 0), Math.max(cards.length - 1, 0));
  const card = cards[index];
  if (!card) return renderFlashcardSetup(session);
  const direction = session.flash.direction === "mixed" ? (index % 2 ? "english-spanish" : "spanish-english") : session.flash.direction;
  const front = direction === "english-spanish" ? card.english : card.spanish;
  const back = direction === "english-spanish" ? card.spanish : card.english;
  const revealed = Boolean(session.flash.revealed);
  if (session.flash.feedback) queueAutoAdvance(advanceFlash, 520);
  return `<section class="practice-tool practice-flash-session">${toolHeader("Flashcards", "flashcards-setup")}
    <div class="practice-flash-hud"><div><strong>${index + 1}</strong><span>of ${cards.length}</span></div><i aria-label="${Math.round(((index + 1) / cards.length) * 100)}% complete"><b style="width:${Math.round(((index + 1) / cards.length) * 100)}%"></b></i><div class="practice-mini-streak">${icon("flame")}<strong>${session.flash.streak || 0}</strong></div></div>
    <article class="practice-review-card ${revealed ? "revealed" : ""}" tabindex="0" onclick="hablaPractice.revealCard()" onpointerdown="hablaPractice.pointerStart(event)" onpointerup="hablaPractice.flashPointerEnd(event)" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();hablaPractice.revealCard()}" aria-label="${revealed ? `Revealed: ${escapeAttr(front)} means ${escapeAttr(back)}` : `Flashcard: ${escapeAttr(front)}. Activate to reveal`}">
      <div class="practice-flash-glow" aria-hidden="true"></div><div class="practice-flash-inner"><div class="practice-flash-face practice-flash-front"><small>${direction === "english-spanish" ? "English" : "Spanish"}</small><h1>${escapeHtml(front)}</h1><button type="button" onclick="event.stopPropagation();hablaPractice.speak('${escapeJs(card.spanish)}')" aria-label="Hear ${escapeAttr(card.spanish)}">${icon("sound")}</button><p class="practice-reveal-hint">${icon("flip")} Tap to reveal</p></div><div class="practice-flash-face practice-flash-back"><div class="practice-flash-pair"><small>${direction === "english-spanish" ? "English" : "Spanish"}</small><strong>${escapeHtml(front)}</strong><small>${direction === "english-spanish" ? "Spanish" : "English"}</small><h1>${escapeHtml(back)}</h1></div><button type="button" onclick="event.stopPropagation();hablaPractice.speak('${escapeJs(card.spanish)}')" aria-label="Hear ${escapeAttr(card.spanish)}">${icon("sound")}</button>${card.exampleSpanish ? `<div class="practice-card-answer"><p>${escapeHtml(card.exampleSpanish)}<span>${escapeHtml(card.exampleEnglish || "")}</span></p></div>` : ""}</div></div>
    </article>
    ${revealed ? `<div class="practice-rating" aria-label="Rate this card"><button class="again" onclick="hablaPractice.rateCard('again')"><span>${icon("back")}</span><strong>Again</strong><small>Review soon</small></button><button class="hard" onclick="hablaPractice.rateCard('hard')"><span>${icon("alert")}</span><strong>Hard</strong><small>Needs work</small></button><button class="got-it" onclick="hablaPractice.rateCard('got-it')"><span>${icon("check")}</span><strong>Got it</strong><small>Keep going</small></button></div><div class="practice-flash-footer"><span>${icon("flame")} ${session.flash.streak || 0} in a row</span><strong>+15 XP max</strong></div><p class="practice-swipe-hint">Swipe to rate this card</p>` : ""}
    ${session.flash.feedback ? practiceLiveFeedback(session.flash.feedback) : ""}
  </section>`;
}

function renderVerbTrainer(session) {
  const selected = session.verbId || PRACTICE_VERBS[0].id;
  const activeVerb = getVerb(selected);
  return `<section class="practice-tool">${toolHeader("Verb Trainer")}
    <header class="practice-tool-intro accent-purple"><span>${icon("verbs")}</span><div><small>Verb trainer</small><h1>Build fast recall</h1><p>Choose a verb, scan the pattern, then train it.</p></div></header>
    <section class="practice-picker practice-verb-picker"><div class="practice-picker-title"><h2>Choose a verb</h2><span>Present tense</span></div><div class="practice-verb-grid">${PRACTICE_VERBS.map(verb => `<button type="button" class="${selected === verb.id ? "selected" : ""}" onclick="hablaPractice.selectVerb('${verb.id}')" aria-pressed="${selected === verb.id}"><strong>${escapeHtml(verb.infinitive)}</strong><small>${escapeHtml(verb.english)}</small></button>`).join("")}</div></section>
    <section class="practice-verb-preview"><header><span>${icon("verbs")}</span><div><small>${escapeHtml(activeVerb.infinitive)} · present</small><h2>${escapeHtml(activeVerb.english)}</h2></div></header><div class="practice-conjugation-strip">${VERB_SUBJECTS.map((subject,index) => `<span><b>${escapeHtml(subject)}</b><strong>${escapeHtml(activeVerb.present[index])}</strong></span>`).join("")}</div></section>
    <button class="practice-cta practice-tool-cta" type="button" onclick="hablaPractice.startVerbDrill()">${icon("verbs")}<span>Start verb drill</span>${icon("arrow")}</button>
  </section>`;
}

function renderVerbDrill(session) {
  const drill = session.verbDrill;
  if (!drill?.questions?.length) return renderVerbTrainer(session);
  const question = drill.questions[drill.index];
  const answered = drill.selected !== undefined && drill.selected !== null;
  const correct = answered && normalize(drill.selected) === normalize(question.answer);
  if (drill.feedback) queueAutoAdvance(advanceVerb, drill.feedback.type === "correct" ? 700 : 1100);
  return `<section class="practice-tool practice-rapid-drill practice-verb-drill">${toolHeader("Verb Trainer", "verbs")}<div class="practice-live-head"><span>${drill.index + 1} / ${drill.questions.length}</span><i><b style="width:${Math.round(((drill.index + 1) / drill.questions.length) * 100)}%"></b></i><strong>${icon("flame")} ${drill.streak || 0}</strong></div>
    <article class="practice-drill-card ${answered ? (correct ? "is-correct" : "is-incorrect") : ""}"><header><span>${icon("verbs")}</span><small>${escapeHtml(question.infinitive.toUpperCase())} · PRESENT</small></header><div class="practice-subject-cue">${escapeHtml(question.subject)}</div><h1>${escapeHtml(answered ? completedPrompt(question.prompt, question.answer) : question.prompt)}</h1><p>Choose the correct present-tense form.</p>
      ${question.type === "fill" ? (!answered ? `<form onsubmit="event.preventDefault();hablaPractice.answerVerbText(this.answer.value)"><label><span>Type the conjugation</span><input name="answer" type="text" autocomplete="off" autocapitalize="none" required></label><button class="practice-cta" type="submit"><span>Check answer</span>${icon("arrow")}</button></form>` : "") : `<div class="practice-answer-grid">${question.options.map(option => answerButton(option, question.answer, drill.selected, "answerVerb")).join("")}</div>`}
      ${answered ? feedback(correct, completedPrompt(question.prompt, question.answer), `Correct form: ${question.answer}.`) : ""}
      ${drill.feedback ? practiceLiveFeedback(drill.feedback) : ""}
    </article>
  </section>`;
}

function renderGames() {
  const scores = readPracticeState().gameScores;
  return `<section class="practice-tool practice-games-landing">${toolHeader("Quick Games")}<header class="practice-tool-intro accent-orange"><span>${icon("games")}</span><div><small>Quick games</small><h1>Play with Spanish</h1><p>Pick a fast challenge and beat your best.</p></div></header><div class="practice-game-list">
    ${gameCard("word-match", "match", "Word Match", "Match Spanish words to their meanings.", scores["word-match"]?.best)}
    ${gameCard("sentence-builder", "sentence", "Sentence Builder", "Put useful phrases in the right order.", scores["sentence-builder"]?.best)}
    ${gameCard("speed-round", "timer", "Speed Round", "Answer as many as you can in 60 seconds.", scores["speed-round"]?.best)}
    ${gameCard("conjugation-sprint", "sprint", "Conjugation Sprint", "Race through rapid verb forms.", scores["conjugation-sprint"]?.best)}
  </div></section>`;
}

function gameCard(route, iconName, title, description, score = 0) {
  const preview = route === "word-match" ? `<i></i><i></i><i></i><i></i>` : route === "sentence-builder" ? `<i></i><i></i><i></i>` : route === "speed-round" ? `<b>30</b>` : `<b>${icon("flame")}</b>`;
  return `<button class="game-${route}" type="button" onclick="hablaPractice.startGame('${route}')"><header><span>${icon(iconName)}</span><small>${score ? `Best · ${score}` : "New game"}</small></header><div class="practice-game-preview" aria-hidden="true">${preview}</div><div><strong>${title}</strong><p>${description}</p></div><span class="practice-play-arrow">${icon("arrow")}</span></button>`;
}

function renderWordMatch(session) {
  if (!session.match?.pairs?.length) return renderGames();
  const game = session.match;
  if (game.matched.length === game.pairs.length) return renderInlineGameComplete("Word Match", game.pairs.length, game.mistakes, "word-match");
  if (game.lastResult) queueAutoAdvance(() => clearMatchFeedback(game.lastResult.type === "correct"), game.lastResult.type === "correct" ? 420 : 520);
  const elapsed = Math.max(0, Math.floor((Date.now() - game.startedAt) / 1000));
  const tileButton = (tile, index) => `<button type="button" class="${game.selected === index ? "selected" : ""} ${game.matched.includes(tile.pairId) ? "matched" : ""} ${game.lastResult?.indexes?.includes(index) ? game.lastResult.type : ""}" onclick="hablaPractice.selectMatch(${index})" ${game.matched.includes(tile.pairId) || game.lastResult ? "disabled" : ""}>${escapeHtml(tile.text)}</button>`;
  const spanishTiles = game.tiles.map((tile,index) => ({tile,index})).filter(item => item.tile.side === "es");
  const englishTiles = game.tiles.map((tile,index) => ({tile,index})).filter(item => item.tile.side === "en");
  return `<section class="practice-tool practice-game practice-match-game">${toolHeader("Word Match", "games")}<div class="practice-game-hud"><div><small>Matched</small><strong>${game.matched.length}<span>/${game.pairs.length}</span></strong></div><div><small>Time</small><strong>${elapsed}<span>s</span></strong></div><div><small>Mistakes</small><strong>${game.mistakes}</strong></div></div><header class="practice-game-heading"><small>Quick game</small><h1>Match each pair</h1><p>Choose one tile from each language.</p></header><div class="practice-match-board"><section><h2>Spanish</h2>${spanishTiles.map(({tile,index}) => tileButton(tile,index)).join("")}</section><i aria-hidden="true"></i><section><h2>English</h2>${englishTiles.map(({tile,index}) => tileButton(tile,index)).join("")}</section></div>${game.lastResult ? practiceLiveFeedback(game.lastResult) : ""}</section>`;
}

function renderSentenceBuilder(session) {
  const game = session.sentence;
  if (!game?.items?.length) return renderGames();
  if (game.index >= game.items.length) return renderInlineGameComplete("Sentence Builder", game.correct, game.items.length - game.correct, "sentence-builder");
  const item = game.items[game.index];
  if (game.feedback) queueAutoAdvance(() => game.feedback === "correct" ? advanceSentence() : retrySentence(), game.feedback === "correct" ? 700 : 1050);
  return `<section class="practice-tool practice-game practice-builder-game">${toolHeader("Sentence Builder", "games")}<div class="practice-live-head"><span>${game.index + 1} / ${game.items.length}</span><i><b style="width:${Math.round(((game.index + 1) / game.items.length) * 100)}%"></b></i><strong>${icon("flame")} ${game.streak || 0}</strong></div><article class="practice-builder ${game.feedback ? `is-${game.feedback}` : ""}"><header><small>Build the Spanish</small><h1>${escapeHtml(item.english)}</h1></header><section class="practice-construction-zone"><small>Your sentence</small><div class="practice-answer-row" aria-label="Your sentence" ondragover="event.preventDefault()" ondrop="hablaPractice.dropToken(event)">${game.answer.length ? game.answer.map((token,index) => `<button type="button" onclick="hablaPractice.returnToken(${index})">${escapeHtml(token)}</button>`).join("") : `<span>Tap words to build your answer</span>`}</div></section><section class="practice-word-bank"><small>Available words</small><div class="practice-token-bank">${game.bank.map((token,index) => `<button type="button" draggable="true" ondragstart="hablaPractice.dragToken(event,${index})" onclick="hablaPractice.useToken(${index})">${escapeHtml(token)}</button>`).join("")}</div></section><div class="practice-builder-actions"><button type="button" onclick="hablaPractice.resetSentence()">${icon("retry")} Reset</button><button class="practice-cta" type="button" onclick="hablaPractice.checkSentence()" ${game.answer.length || game.feedback ? "" : "disabled"}>Check answer${icon("check")}</button></div>${game.feedback ? `<div class="practice-builder-result ${game.feedback}" role="status" aria-live="polite"><span>${icon(game.feedback === "correct" ? "spark" : "retry")}</span><div><strong>${game.feedback === "correct" ? "¡Excelente!" : "Try that order again"}</strong><small>${game.feedback === "correct" ? "+10 XP" : `Correct sentence: ${escapeHtml(item.spanish)}`}</small></div></div>` : ""}</article></section>`;
}

function renderSpeedRound(session) {
  const game = session.speed;
  if (!game?.questions?.length) return renderGames();
  const remaining = Math.max(0, Math.ceil((game.deadline - Date.now()) / 1000));
  if (!remaining || game.complete) return renderInlineGameComplete("Speed Round", game.correct, game.missed, "speed-round");
  const question = game.questions[game.index % game.questions.length];
  queueSpeedTick();
  if (game.feedback) queueAutoAdvance(() => advanceTimedGame("speed"), game.feedback.type === "correct" ? 260 : 520);
  return `<section class="practice-tool practice-game practice-timed-game speed-theme">${toolHeader("Speed Round", "games")}${renderTimedHud(game, remaining, readPracticeState().gameScores["speed-round"]?.best || 0)}<div class="practice-combo">${icon("flame")}<strong>${game.streak} streak</strong>${game.multiplier > 1 ? `<b>×${game.multiplier} XP</b>` : `<span>Build your combo</span>`}</div><article class="practice-speed-card ${game.feedback ? `is-${game.feedback.type}` : ""}"><small>Choose the Spanish</small><h1>${escapeHtml(question.english)}</h1><div class="practice-answer-grid">${question.options.map(option => `<button type="button" onclick="hablaPractice.answerSpeed('${escapeJs(option)}')" ${game.feedback ? "disabled" : ""}>${escapeHtml(option)}</button>`).join("")}</div>${game.feedback ? practiceLiveFeedback(game.feedback) : ""}</article></section>`;
}

function renderConjugationSprint(session) {
  const game = session.sprint;
  if (!game?.questions?.length) return renderGames();
  const remaining = Math.max(0, Math.ceil((game.deadline - Date.now()) / 1000));
  if (!remaining || game.complete) return renderInlineGameComplete("Conjugation Sprint", game.correct, game.missed, "conjugation-sprint");
  const question = game.questions[game.index % game.questions.length];
  queueSpeedTick("sprint");
  if (game.feedback) queueAutoAdvance(() => advanceTimedGame("sprint"), game.feedback.type === "correct" ? 260 : 520);
  return `<section class="practice-tool practice-game practice-timed-game sprint-theme">${toolHeader("Conjugation Sprint", "games")}${renderTimedHud(game, remaining, readPracticeState().gameScores["conjugation-sprint"]?.best || 0)}<div class="practice-combo">${icon("flame")}<strong>${game.streak} streak</strong>${game.multiplier > 1 ? `<b>×${game.multiplier} XP</b>` : `<span>Keep the pace</span>`}</div><article class="practice-speed-card accent-purple ${game.feedback ? `is-${game.feedback.type}` : ""}"><small>${escapeHtml(question.infinitive.toUpperCase())} · PRESENT</small><div class="practice-subject-cue">${escapeHtml(question.subject)}</div><h1>${escapeHtml(question.prompt)}</h1><div class="practice-answer-grid">${question.options.map(option => `<button type="button" onclick="hablaPractice.answerSprint('${escapeJs(option)}')" ${game.feedback ? "disabled" : ""}>${escapeHtml(option)}</button>`).join("")}</div>${game.feedback ? practiceLiveFeedback(game.feedback) : ""}</article></section>`;
}

function renderTimedHud(game, remaining, best) {
  return `<div class="practice-speed-head"><div><small>Score</small><strong>${game.correct}</strong></div><span class="practice-timer-ring" style="--time:${remaining}"><b data-speed-time>${remaining}</b><small>seconds</small></span><div><small>Best</small><strong>${best}</strong></div></div>`;
}

function renderGrammarLab() {
  const store = readPracticeState();
  return `<section class="practice-tool practice-grammar-landing">${toolHeader("Grammar Lab")}<header class="practice-tool-intro accent-blue"><span>${icon("grammar")}</span><div><small>Grammar lab</small><h1>Patterns that unlock Spanish</h1><p>Short drills with immediate, useful feedback.</p></div></header><div class="practice-grammar-list">${GRAMMAR_TOPICS.map((topic,index) => { const spot = store.weakSpots[`grammar-${topic.id}`]; const progress = Math.min(topic.drills.length, Number(spot?.correct || 0)); const percent = topic.drills.length ? Math.round((progress / topic.drills.length) * 100) : 0; return `<button type="button" class="accent-${topic.accent}" onclick="hablaPractice.startGrammar('${topic.id}')"><span>${icon(grammarIcon(topic.id))}</span><div><small>Topic ${String(index + 1).padStart(2,"0")}</small><strong>${escapeHtml(topic.title)}</strong><p>${escapeHtml(topic.subtitle)}</p><i aria-label="${percent}% mastered"><b style="width:${percent}%"></b></i></div><em>${progress}/${topic.drills.length}</em>${icon("arrow")}</button>`; }).join("")}</div></section>`;
}

function renderGrammarDrill(session) {
  const drill = session.grammarDrill;
  if (!drill) return renderGrammarLab();
  const topic = getGrammarTopic(drill.topicId);
  if (drill.index >= topic.drills.length) return renderInlineGameComplete(topic.title, drill.correct, topic.drills.length - drill.correct, "grammar");
  const question = topic.drills[drill.index];
  const answered = drill.selected !== null && drill.selected !== undefined;
  const correct = answered && normalize(drill.selected) === normalize(question.answer);
  if (drill.feedback) queueAutoAdvance(advanceGrammar, drill.feedback.type === "correct" ? 700 : 1150);
  const hearts = Math.max(0, 3 - drill.missed);
  return `<section class="practice-tool practice-rapid-drill practice-grammar-drill">${toolHeader(topic.title, "grammar")}<div class="practice-live-head"><span>${drill.index + 1} / ${topic.drills.length}</span><i><b style="width:${Math.round(((drill.index + 1) / topic.drills.length) * 100)}%"></b></i><strong class="practice-hearts" aria-label="${hearts} hearts remaining">${[0,1,2].map(index => icon(index < hearts ? "heart" : "heart-empty")).join("")}</strong></div><article class="practice-drill-card ${answered ? (correct ? "is-correct" : "is-incorrect") : ""}"><header><span>${icon(grammarIcon(topic.id))}</span><small>${escapeHtml(topic.title)}</small></header><h1>${escapeHtml(answered && correct ? completedPrompt(question.prompt, question.answer) : question.prompt)}</h1><div class="practice-answer-grid">${question.options.map(option => answerButton(option, question.answer, drill.selected, "answerGrammar")).join("")}</div>${answered ? feedback(correct, question.explanation, question.explanation) : ""}${drill.feedback ? practiceLiveFeedback(drill.feedback) : ""}</article></section>`;
}

function renderSavedWords() {
  const words = getSavedWords();
  return `<section class="practice-tool">${toolHeader("Saved Words")}<header class="practice-tool-intro"><span>${icon("bookmark")}</span><div><small>Saved collection</small><h1>${words.length} saved ${words.length === 1 ? "phrase" : "phrases"}</h1><p>Everything you marked during lessons is ready for review.</p></div></header>${words.length ? `<div class="practice-word-list">${words.map(word => `<article><div><strong>${escapeHtml(word.spanish)}</strong><span>${escapeHtml(word.english)}</span></div><button type="button" onclick="hablaPractice.speak('${escapeJs(word.spanish)}')" aria-label="Hear ${escapeAttr(word.spanish)}">${icon("sound")}</button><button type="button" onclick="hablaPractice.removeSavedWord('${escapeJs(word.key)}')" aria-label="Remove ${escapeAttr(word.spanish)} from Saved Words">${icon("close")}</button></article>`).join("")}</div><button class="practice-cta practice-tool-cta" onclick="hablaPractice.open('flashcards-setup','saved')">${icon("cards")}<span>Review saved words</span>${icon("arrow")}</button>` : emptyState("bookmark", "No saved words yet", "Use the bookmark on lesson vocabulary to build this collection.")}</section>`;
}

function renderSavedQuestions() {
  const items = getSavedQuizReviewQuestions();
  return `<section class="practice-tool">${toolHeader("Saved Questions")}<header class="practice-tool-intro accent-blue"><span>${icon("question")}</span><div><small>Saved collection</small><h1>${items.length} saved ${items.length === 1 ? "question" : "questions"}</h1><p>Questions you bookmarked during an episode, with the answer ready when you need it.</p></div></header>${items.length ? `<div class="practice-question-list">${items.map(item => {
    const prompt = item.question?.prompt || "Saved question";
    const answer = item.question?.answer || item.question?.correctAnswer || "";
    const explanation = item.question?.explanation || "";
    return `<article><small>${escapeHtml(item.lessonTitle || "Episode review")}</small><h2>${escapeHtml(prompt)}</h2>${answer ? `<p><strong>Answer:</strong> ${escapeHtml(answer)}</p>` : ""}${explanation ? `<p>${escapeHtml(explanation)}</p>` : ""}<button type="button" onclick="hablaPractice.removeSavedQuestion('${escapeJs(item.lessonId)}',${Number(item.questionIndex)})" aria-label="Remove saved question from ${escapeAttr(item.lessonTitle || "episode")}">${icon("close")}<span>Remove</span></button></article>`;
  }).join("")}</div>` : emptyState("question", "No saved questions yet", "Bookmark a difficult quiz question and it will appear here for later review.")}</section>`;
}

function renderNeedsPractice() {
  const cards = getNeedsPracticeCards();
  return `<section class="practice-tool">${toolHeader("Needs Practice")}<header class="practice-tool-intro accent-orange"><span>${icon("retry")}</span><div><small>Adaptive collection</small><h1>${cards.length} ${cards.length === 1 ? "card" : "cards"} to revisit</h1><p>Words you rated Again during lessons or Practice appear here.</p></div></header>${cards.length ? `<div class="practice-word-list">${cards.map(card => `<article><div><strong>${escapeHtml(card.spanish)}</strong><span>${escapeHtml(card.english)}</span></div><button type="button" onclick="hablaPractice.speak('${escapeJs(card.spanish)}')" aria-label="Hear ${escapeAttr(card.spanish)}">${icon("sound")}</button><button type="button" onclick="hablaPractice.markLearned('${escapeJs(card.key)}','${escapeJs(card.lessonId || "")}','${escapeJs(normalize(card.spanish))}')" aria-label="Mark ${escapeAttr(card.spanish)} learned">${icon("check")}</button></article>`).join("")}</div><button class="practice-cta practice-tool-cta" onclick="hablaPractice.startNeedsPractice()">${icon("cards")}<span>Review difficult cards</span>${icon("arrow")}</button>` : emptyState("check", "Nothing needs extra practice", "Cards you rate Again will appear here automatically.")}</section>`;
}

function renderReviewSummary(session) {
  const summary = session.summary || { title: "Review complete", answered: 0, correct: 0, missed: 0, returnView: "hub" };
  const accuracy = summary.answered ? Math.round((summary.correct / summary.answered) * 100) : 0;
  return `<section class="practice-tool practice-summary-screen">${toolHeader("Review Summary", summary.returnView || "hub")}<div class="practice-summary-ring" style="--accuracy:${accuracy}"><span><strong>${accuracy}%</strong><small>accuracy</small></span></div><small>Session complete</small><h1>${escapeHtml(summary.title)}</h1><dl><div><dt>${summary.answered}</dt><dd>answered</dd></div><div><dt>${summary.correct}</dt><dd>correct</dd></div><div><dt>${summary.missed}</dt><dd>missed</dd></div></dl><button class="practice-cta" type="button" onclick="hablaPractice.continuePractice()"><span>Continue practising</span>${icon("arrow")}</button><button class="practice-secondary-action" type="button" onclick="hablaPractice.open('hub')">Back to Practice</button></section>`;
}

function renderInlineGameComplete(title, correct, missed, gameId) {
  return `<section class="practice-tool practice-inline-complete">${toolHeader(title, gameId === "grammar" ? "grammar" : "games")}<span>${icon("trophy")}</span><h1>${escapeHtml(title)} complete</h1><p>${correct} correct · ${missed} missed</p><button class="practice-cta" type="button" onclick="hablaPractice.finishInlineGame('${gameId}',${correct},${missed})"><span>View summary</span>${icon("arrow")}</button></section>`;
}

function toolHeader(title, backView = "hub") {
  return `<header class="practice-tool-header"><button type="button" onclick="hablaPractice.open('${backView}')" aria-label="Back">${icon("back")}</button><h2>${escapeHtml(title)}</h2><span aria-hidden="true"></span></header>`;
}

function drillProgress(index, total, correct, label) {
  return `<div class="practice-session-progress"><span>${escapeHtml(label)} · ${index + 1} / ${total}</span><small>${correct} correct</small><i><b style="width:${Math.round((index / total) * 100)}%"></b></i></div>`;
}

function answerButton(option, answer, selected, action) {
  const answered = selected !== null && selected !== undefined;
  const isCorrect = answered && normalize(option) === normalize(answer);
  const isWrong = answered && normalize(option) === normalize(selected) && !isCorrect;
  return `<button type="button" class="${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}" onclick="hablaPractice.${action}('${escapeJs(option)}')" ${answered ? "disabled" : ""}>${escapeHtml(option)}${isCorrect ? icon("check") : isWrong ? icon("close") : ""}</button>`;
}

function feedback(correct, correctCopy, incorrectCopy) {
  return `<div class="practice-feedback ${correct ? "correct" : "incorrect"}" role="status" aria-live="polite"><span>${icon(correct ? "check" : "close")}</span><div><strong>${correct ? "¡Correcto!" : "Not quite."}</strong><p>${escapeHtml(correct ? correctCopy : incorrectCopy)}</p></div></div>`;
}

function emptyState(iconName, title, copy) { return `<div class="practice-empty"><span>${icon(iconName)}</span><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(copy)}</p></div></div>`; }

function getNeedsPracticeCards() {
  const vocabulary = getPracticeVocabulary();
  return vocabulary.filter(card => {
    const schedule = readPracticeState().cards[card.key];
    const lessonConfidence = card.lessonId ? getLessonProgress(card.lessonId).flashcardConfidence?.[normalize(card.spanish)] : null;
    return schedule?.rating === "again" || lessonConfidence === "again";
  });
}

function readSession() {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    return parsed && typeof parsed === "object" ? { view: "hub", direction: "mixed", deckId: "due", ...parsed } : { view: "hub", direction: "mixed", deckId: "due" };
  } catch { return { view: "hub", direction: "mixed", deckId: "due" }; }
}

function writeSession(session) { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); }
function rerender() { window.dispatchEvent(new CustomEvent("habla:practice-render")); }

function startFlashSession(deckId, direction = "mixed", overrideCards = null) {
  const session = readSession();
  const source = overrideCards || getDeck(deckId).cards;
  session.view = "flashcards";
  session.flash = { cards: stableShuffle(source, `${deckId}-${Date.now()}`).slice(0, 30), index: 0, direction, revealed: false, correct: 0, missed: 0, streak: 0, ratings: [], feedback: null };
  writeSession(session); rerender();
}

function finishSession(title, mode, answered, correct, missed, returnView = "hub") {
  recordPracticeResult({ mode, answered, correct, missed, topic: title });
  const session = readSession();
  session.view = "summary";
  session.summary = { title, answered, correct, missed, returnView };
  writeSession(session); rerender();
}

function buildSpeedQuestions() {
  const cards = getPracticeVocabulary();
  return cards.slice(0, 20).map((card,index) => ({ ...card, options: stableOptions(card.spanish, cards.map(item => item.spanish), `speed-${index}`) }));
}

function buildSprintQuestions() {
  return Array.from({ length: 24 }, (_, index) => {
    const verb = PRACTICE_VERBS[index % PRACTICE_VERBS.length];
    const question = buildVerbQuestion(verb, index % VERB_SUBJECTS.length);
    return { ...question, prompt: `${question.subject.toUpperCase()} + ${verb.infinitive.toUpperCase()}` };
  });
}

function buildDailyTasks() {
  const allCards = getDeck("all").cards;
  const due = getDeck("due").cards;
  const difficult = getNeedsPracticeCards();
  const cards = dedupeByKey([...difficult, ...due, ...allCards]).slice(0, 4).map(card => ({ type: "flash", ...card }));
  const verbTasks = [0, 1].map(index => { const question=buildVerbQuestion(PRACTICE_VERBS[index % PRACTICE_VERBS.length],index);return { ...question, drillType:question.type, type:"verb" }; });
  const grammarTopic = GRAMMAR_TOPICS[new Date().getDate() % GRAMMAR_TOPICS.length];
  const grammar = grammarTopic.drills[0];
  return [...cards, ...verbTasks, { type: "grammar", topicId: grammarTopic.id, ...grammar }];
}

function queueSpeedTick(mode = "speed") {
  if (speedTimer) return;
  speedTimer = window.setInterval(() => {
    const session = readSession();
    const expectedView = mode === "sprint" ? "conjugation-sprint" : "speed-round";
    const game = mode === "sprint" ? session.sprint : session.speed;
    if (session.view !== expectedView || !game) { clearSpeedTimer(); return; }
    const remaining = Math.max(0, Math.ceil((game.deadline - Date.now()) / 1000));
    const timer=document.querySelector("[data-speed-time]");timer?.replaceChildren(String(remaining));timer?.closest(".practice-timer-ring")?.style.setProperty("--time",String(remaining));
    if (!remaining) { game.complete = true; writeSession(session); clearSpeedTimer(); rerender(); }
  }, 500);
}

function clearSpeedTimer() { if (speedTimer) window.clearInterval(speedTimer); speedTimer = null; }
function clearAutoAdvance() { if (autoAdvanceTimer) window.clearTimeout(autoAdvanceTimer); autoAdvanceTimer = null; }
function queueAutoAdvance(callback, delay = 700) { clearAutoAdvance(); autoAdvanceTimer = window.setTimeout(() => { autoAdvanceTimer = null; callback(); }, delay); }

window.hablaPractice = {
  open(view, value = "") { clearSpeedTimer(); clearAutoAdvance(); stopSpeech(); const session = readSession(); session.view = view || "hub"; if (view === "flashcards-setup" && value) session.deckId = value; writeSession(session); rerender(); },
  openWeakSpot(id) { if(String(id).startsWith("grammar-")){this.open("grammar");return;}if(String(id).startsWith("verb-")){this.open("verbs");return;}if(id==="saved-questions"){this.open("saved-questions");return;}if(id==="sentence-order"){this.open("games");return;}this.open("needs-practice"); },
  startTodayReview() { const due = getDeck("due").cards; startFlashSession("due", "mixed", due.length ? due : getDeck("all").cards.slice(0, 12)); },
  startDailyPractice() { const session=readSession();session.view="daily";session.daily={tasks:buildDailyTasks(),index:0,correct:0,missed:0,streak:0,selected:null,revealed:false,feedback:null};writeSession(session);rerender(); },
  revealDaily() { const session=readSession();if(!session.daily)return;session.daily.revealed=true;writeSession(session);rerender(); },
  answerDaily(value) { answerDaily(value); },
  selectDeck(id) { const session = readSession(); session.deckId = id; writeSession(session); rerender(); },
  setDirection(direction) { const session = readSession(); session.direction = DIRECTIONS.includes(direction) ? direction : "mixed"; writeSession(session); rerender(); },
  startFlashcards() { const session = readSession(); startFlashSession(session.deckId || "due", session.direction || "mixed"); },
  startNeedsPractice() { const cards = getNeedsPracticeCards(); startFlashSession("needs-practice", "mixed", cards); },
  revealCard() { const session = readSession(); if (!session.flash || session.flash.revealed) return; session.flash.revealed = true; writeSession(session); rerender(); },
  rateCard(rating) { const session=readSession();const flash=session.flash,card=flash?.cards?.[flash.index];if(!card||flash.feedback)return;ratePracticeCard(card.key,rating);flash.ratings.push(rating);const correct=rating==="got-it";if(correct){flash.correct+=1;flash.streak+=1;}else{flash.missed+=1;flash.streak=0;}const xp=rating==="got-it"?15:rating==="hard"?8:3;awardPracticeXP(xp,"Flashcard review");const spot=cardWeakSpot(card);recordWeakSpot(spot.id,spot.title,correct);flash.feedback={type:correct?"correct":rating==="hard"?"hard":"incorrect",xp,streak:flash.streak,message:rating==="got-it"?"Got it!":rating==="hard"?"Reviewing sooner":"Back again soon"};writeSession(session);haptic(correct?"success":"light");rerender();queueAutoAdvance(advanceFlash,520); },
  pointerStart(event) { pointerStart={x:event.clientX,y:event.clientY}; },
  flashPointerEnd(event) { if(!pointerStart)return;const dx=event.clientX-pointerStart.x,dy=event.clientY-pointerStart.y;pointerStart=null;const session=readSession();if(!session.flash?.revealed||session.flash.feedback)return;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)){this.rateCard(dx>0?"got-it":"again");}else if(dy>55){this.rateCard("hard");} },
  selectVerb(id) { const session = readSession(); session.verbId = getVerb(id).id; writeSession(session); rerender(); },
  startVerbDrill() { const session = readSession(); const verb = getVerb(session.verbId); session.view = "verb-drill"; session.verbDrill = { questions: Array.from({length:10},(_,i)=>buildVerbQuestion(verb,i)), index:0, correct:0, missed:0, streak:0, selected:null, feedback:null }; writeSession(session); rerender(); },
  answerVerb(value) { answerVerb(value); },
  answerVerbText(value) { answerVerb(value); },
  nextVerb() { advanceVerb(); },
  startGame(route) { clearSpeedTimer();clearAutoAdvance();const session=readSession(),startedAt=Date.now();if(route==="word-match"){const cards=getPracticeVocabulary().slice(0,6);session.match={pairs:cards,tiles:stableShuffle(cards.flatMap((card,index)=>[{pairId:index,side:"es",text:card.spanish},{pairId:index,side:"en",text:card.english}]),`match-${startedAt}`),matched:[],selected:null,mistakes:0,startedAt,lastResult:null};}else if(route==="sentence-builder"){const items=getPracticeSentences().slice(0,6);session.sentence={items,index:0,correct:0,streak:0,bank:[],answer:[],feedback:null,startedAt};prepareSentence(session.sentence);}else if(route==="conjugation-sprint"){session.sprint={questions:buildSprintQuestions(),index:0,correct:0,missed:0,streak:0,bestStreak:0,multiplier:1,startedAt,deadline:startedAt+60000,complete:false,feedback:null};}else{const questions=buildSpeedQuestions();session.speed={questions,index:0,correct:0,missed:0,streak:0,bestStreak:0,multiplier:1,startedAt,deadline:startedAt+60000,complete:false,feedback:null};}session.view=route;writeSession(session);rerender(); },
  selectMatch(index) { const session=readSession(),game=session.match,tile=game?.tiles?.[index];if(!tile||game.matched.includes(tile.pairId)||game.lastResult)return;if(game.selected==null){game.selected=index;writeSession(session);rerender();return;}const firstIndex=game.selected,first=game.tiles[firstIndex],correct=first.pairId===tile.pairId&&first.side!==tile.side;game.lastResult={type:correct?"correct":"incorrect",indexes:[firstIndex,index],xp:correct?5:0,message:correct?"Match!":"Try another pair"};if(correct){game.matched.push(tile.pairId);awardPracticeXP(5,"Word Match");recordWeakSpot("word-match","Word matching",true);haptic("success");}else{game.mistakes+=1;recordWeakSpot("word-match","Word matching",false);haptic("error");}game.selected=null;writeSession(session);rerender();queueAutoAdvance(()=>clearMatchFeedback(correct),correct?420:520); },
  useToken(index) { const session=readSession(); if(session.sentence?.feedback)return; const [token]=session.sentence.bank.splice(index,1); if(token)session.sentence.answer.push(token);writeSession(session);rerender(); },
  returnToken(index) { const session=readSession(); if(session.sentence?.feedback)return; const [token]=session.sentence.answer.splice(index,1);if(token)session.sentence.bank.push(token);writeSession(session);rerender(); },
  resetSentence() { const session=readSession();prepareSentence(session.sentence);writeSession(session);rerender(); },
  dragToken(event,index) { event.dataTransfer?.setData("text/plain",String(index)); },
  dropToken(event) { event.preventDefault();const index=Number(event.dataTransfer?.getData("text/plain"));if(Number.isInteger(index))this.useToken(index); },
  checkSentence() { const session=readSession(),game=session.sentence,item=game?.items?.[game.index];if(!item||game.feedback)return;const correct=normalize(game.answer.join(" "))===normalize(item.spanish);game.feedback=correct?"correct":"incorrect";if(correct){game.correct+=1;game.streak+=1;awardPracticeXP(10,"Sentence Builder");haptic("success");}else{game.streak=0;haptic("error");}recordWeakSpot("sentence-order","Sentence building",correct);writeSession(session);rerender();queueAutoAdvance(()=>correct?advanceSentence():retrySentence(),correct?700:1050); },
  nextSentence() { const session=readSession();session.sentence.index+=1;if(session.sentence.index<session.sentence.items.length)prepareSentence(session.sentence);writeSession(session);rerender(); },
  answerSpeed(value) { answerTimedGame("speed",value); },
  answerSprint(value) { answerTimedGame("sprint",value); },
  startGrammar(id) { const session=readSession();session.view="grammar-drill";session.grammarDrill={topicId:getGrammarTopic(id).id,index:0,correct:0,missed:0,streak:0,selected:null,feedback:null};writeSession(session);rerender(); },
  answerGrammar(value) { const session=readSession(),drill=session.grammarDrill,topic=getGrammarTopic(drill?.topicId),question=topic.drills[drill?.index];if(!question||drill.selected!=null)return;drill.selected=value;const correct=normalize(value)===normalize(question.answer);if(correct){drill.correct+=1;drill.streak+=1;awardPracticeXP(10,"Grammar Lab");haptic("success");}else{drill.missed+=1;drill.streak=0;haptic("error");}drill.feedback={type:correct?"correct":"incorrect",xp:correct?10:0,streak:drill.streak,message:correct?"¡Correcto!":"Quick correction"};recordWeakSpot(`grammar-${topic.id}`,topic.title,correct);writeSession(session);rerender();queueAutoAdvance(advanceGrammar,correct?700:1150); },
  nextGrammar() { advanceGrammar(); },
  finishInlineGame(gameId,correct,missed) { const session=readSession();const game=gameId==="word-match"?session.match:gameId==="conjugation-sprint"?session.sprint:gameId==="speed-round"?session.speed:null;const elapsedSeconds=game?.startedAt?Math.round((Date.now()-game.startedAt)/1000):0;saveGameScore(gameId,correct,{streak:game?.bestStreak||game?.streak||0,elapsedSeconds});finishSession(gameId==="grammar"?"Grammar drill":titleCase(gameId),gameId,correct+missed,correct,missed,gameId==="grammar"?"grammar":"games"); },
  continuePractice() { const session=readSession();session.view=session.summary?.returnView||"hub";delete session.summary;writeSession(session);rerender(); },
  removeSavedWord(key) { state.vocabulary.savedPhrases=getSavedWords().filter(item=>item.key!==key);saveState(state);showToast("Removed from Saved Words");rerender(); },
  removeSavedQuestion(lessonId, questionIndex) { const progress=getLessonProgress(lessonId);const flags={...(progress.quizReviewFlags||{})};Object.keys(flags).forEach(key=>{if(Number(flags[key]?.questionIndex)===Number(questionIndex))delete flags[key];});updateLessonProgress(lessonId,{quizReviewFlags:flags});showToast("Removed from Saved Questions");rerender(); },
  markLearned(cardKey,lessonId,lessonKey) { ratePracticeCard(cardKey,"got-it");if(lessonId){const progress=getLessonProgress(lessonId);updateLessonProgress(lessonId,{flashcardConfidence:{...(progress.flashcardConfidence||{}),[lessonKey]:"got-it"}});}showToast("Marked as learned");rerender(); },
  speak(text) { playSpeech(text,{speaker:"Carlos"}); },
  cleanup() { clearSpeedTimer();clearAutoAdvance();stopSpeech(); },
};

function answerDaily(value) {
  const session=readSession(),daily=session.daily,task=daily?.tasks?.[daily.index];
  if(!task||daily.feedback)return;
  if(task.type==="flash"){
    const rating=value;
    ratePracticeCard(task.key,rating);
    const correct=rating==="got-it";
    const xp=correct?15:rating==="hard"?8:3;
    if(correct){daily.correct+=1;daily.streak+=1;}else{daily.missed+=1;daily.streak=0;}
    daily.feedback={type:correct?"correct":rating==="hard"?"hard":"incorrect",xp,streak:daily.streak,message:correct?"Got it!":rating==="hard"?"Reviewing sooner":"Back again soon"};
    awardPracticeXP(xp,"Daily vocabulary");
    const spot=cardWeakSpot(task);recordWeakSpot(spot.id,spot.title,correct);
  }else{
    daily.selected=value;
    const correct=normalize(value)===normalize(task.answer);
    if(correct){daily.correct+=1;daily.streak+=1;awardPracticeXP(10,"Daily Practice");}else{daily.missed+=1;daily.streak=0;}
    daily.feedback={type:correct?"correct":"incorrect",xp:correct?10:0,streak:daily.streak,message:correct?"¡Perfecto!":`Answer: ${task.answer}`};
    recordWeakSpot(task.type==="verb"?`verb-${task.verbId}`:`grammar-${task.topicId}`,task.type==="verb"?`${task.infinitive} conjugation`:"Daily grammar",correct);
  }
  writeSession(session);haptic(daily.feedback.type==="correct"?"success":"error");rerender();queueAutoAdvance(advanceDaily,daily.feedback.type==="correct"?650:1050);
}

function advanceDaily(){const session=readSession(),daily=session.daily;if(!daily)return;daily.index+=1;daily.selected=null;daily.revealed=false;daily.feedback=null;if(daily.index>=daily.tasks.length){const {tasks,correct,missed}=daily;writeSession(session);finishSession("Daily Practice","daily",tasks.length,correct,missed,"hub");return;}writeSession(session);rerender();}

function advanceFlash(){const session=readSession(),flash=session.flash;if(!flash)return;flash.index+=1;flash.revealed=false;flash.feedback=null;if(flash.index>=flash.cards.length){const {cards,correct,missed}=flash;writeSession(session);finishSession("Flashcard review","flashcards",cards.length,correct,missed,"flashcards-setup");return;}writeSession(session);rerender();}

function answerVerb(value) { const session=readSession(),drill=session.verbDrill,question=drill?.questions?.[drill.index];if(!question||drill.selected!=null)return;drill.selected=value;const correct=normalize(value)===normalize(question.answer);if(correct){drill.correct+=1;drill.streak+=1;awardPracticeXP(10,"Verb Trainer");haptic("success");}else{drill.missed+=1;drill.streak=0;haptic("error");}drill.feedback={type:correct?"correct":"incorrect",xp:correct?10:0,streak:drill.streak,message:correct?"¡Perfecto!":`Correct form: ${question.answer}`};recordWeakSpot(`verb-${question.verbId}`,`${question.infinitive} conjugation`,correct);writeSession(session);rerender();queueAutoAdvance(advanceVerb,correct?700:1100); }
function advanceVerb(){const session=readSession(),drill=session.verbDrill;if(!drill||drill.selected==null)return;drill.index+=1;drill.selected=null;drill.feedback=null;if(drill.index>=drill.questions.length){const verb=getVerb(session.verbId);writeSession(session);finishSession(`${verb.infinitive} · Present`,"verbs",drill.questions.length,drill.correct,drill.missed,"verbs");return;}writeSession(session);rerender();}

function clearMatchFeedback(correct){const session=readSession(),game=session.match;if(!game)return;game.lastResult=null;if(game.matched.length>=game.pairs.length){const elapsed=Math.max(1,Math.round((Date.now()-game.startedAt)/1000));const score=Math.max(10,(game.pairs.length*25)-(game.mistakes*8)-elapsed);saveGameScore("word-match",score,{elapsedSeconds:elapsed,streak:game.pairs.length});writeSession(session);finishSession("Word Match","word-match",game.pairs.length+game.mistakes,game.pairs.length,game.mistakes,"games");return;}writeSession(session);rerender();}
function advanceSentence(){const session=readSession(),game=session.sentence;if(!game)return;game.index+=1;if(game.index>=game.items.length){saveGameScore("sentence-builder",game.correct,{streak:game.streak});writeSession(session);finishSession("Sentence Builder","sentence-builder",game.items.length,game.correct,game.items.length-game.correct,"games");return;}prepareSentence(game);writeSession(session);rerender();}
function retrySentence(){const session=readSession(),game=session.sentence;if(!game)return;prepareSentence(game);writeSession(session);rerender();}

function answerTimedGame(kind,value){const session=readSession(),game=kind==="sprint"?session.sprint:session.speed,question=game?.questions?.[game.index%game.questions.length];if(!question||game.complete||game.feedback)return;const answer=kind==="sprint"?question.answer:question.spanish;const correct=normalize(value)===normalize(answer);if(correct){game.correct+=1;game.streak+=1;game.bestStreak=Math.max(game.bestStreak||0,game.streak);game.multiplier=Math.min(3,1+Math.floor(game.streak/5));const xp=5*game.multiplier;awardPracticeXP(xp,kind==="sprint"?"Conjugation Sprint":"Speed Round");if(game.streak%5===0)game.deadline+=2000;game.feedback={type:"correct",xp,streak:game.streak,message:game.streak%5===0?"+2 seconds!":"Correct"};haptic("success");}else{game.missed+=1;game.streak=0;game.multiplier=1;game.feedback={type:"incorrect",xp:0,streak:0,message:`Answer: ${answer}`};haptic("error");}recordWeakSpot(kind==="sprint"?`verb-${question.verbId}`:"speed-vocabulary",kind==="sprint"?`${question.infinitive} conjugation`:"Vocabulary recall",correct);writeSession(session);rerender();queueAutoAdvance(()=>advanceTimedGame(kind),correct?260:520);}
function advanceTimedGame(kind){const session=readSession(),game=kind==="sprint"?session.sprint:session.speed;if(!game)return;game.index+=1;game.feedback=null;if(Date.now()>=game.deadline){game.complete=true;const id=kind==="sprint"?"conjugation-sprint":"speed-round";saveGameScore(id,game.correct,{streak:game.bestStreak});writeSession(session);finishSession(titleCase(id),id,game.correct+game.missed,game.correct,game.missed,"games");return;}writeSession(session);rerender();}

function advanceGrammar(){const session=readSession(),drill=session.grammarDrill;if(!drill||drill.selected==null)return;const topic=getGrammarTopic(drill.topicId);drill.index+=1;drill.selected=null;drill.feedback=null;if(drill.index>=topic.drills.length){saveGameScore(`grammar-${topic.id}`,drill.correct,{streak:drill.streak});writeSession(session);finishSession(topic.title,"grammar",topic.drills.length,drill.correct,drill.missed,"grammar");return;}writeSession(session);rerender();}

function practiceLiveFeedback(value){const type=value.type||"correct";return `<div class="practice-live-feedback ${type}" role="status" aria-live="polite"><span>${icon(type==="correct"?"check":type==="hard"?"alert":"close")}</span><strong>${escapeHtml(value.message||(type==="correct"?"Great!":"Try again"))}</strong>${value.streak>1?`<em>${icon("flame")} ${value.streak} in a row</em>`:""}${value.xp?`<b>+${value.xp} XP</b>`:""}</div>`;}
function completedPrompt(prompt,answer){return String(prompt||"").replace(/_{2,}/g,answer);}
function awardPracticeXP(amount,reason){if(amount>0)awardXP(amount,reason);return getCurrentXP();}
function haptic(type="light"){if(typeof navigator==="undefined"||typeof navigator.vibrate!=="function")return;navigator.vibrate(type==="error"?[24,35,24]:type==="success"?[12,24,12]:8);}
function dedupeByKey(items){const seen=new Set();return items.filter(item=>item?.key&&!seen.has(item.key)&&seen.add(item.key));}
function cardWeakSpot(card){const id=(card.deckIds||[]).find(value=>!["saved","all","due","recent"].includes(value))||"vocabulary";return {id:`vocab-${id}`,title:id==="vocabulary"?"Vocabulary recall":`${titleCase(id)} vocabulary`};}
function prepareSentence(game) { const item=game?.items?.[game.index];if(!item)return;game.bank=stableShuffle(tokenize(item.spanish),item.id);game.answer=[];game.feedback=null; }
function tokenize(value) { return String(value||"").replace(/([.,!?¿¡])/g," $1 ").trim().split(/\s+/).filter(Boolean); }
function stableOptions(answer,values,seed){return [answer,...[...new Set(values)].filter(v=>normalize(v)!==normalize(answer)).sort((a,b)=>hash(seed+a)-hash(seed+b)).slice(0,3)].sort((a,b)=>hash(seed+"o"+a)-hash(seed+"o"+b));}
function stableShuffle(values,seed){return [...values].sort((a,b)=>hash(seed+JSON.stringify(a))-hash(seed+JSON.stringify(b)));}
function hash(value){return [...String(value)].reduce((sum,c)=>((sum*31)+c.charCodeAt(0))>>>0,2166136261);}
function normalize(value){return String(value||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[¿?¡!.,]/g,"").replace(/\s+/g," ").trim();}
function grammarIcon(id){return ({articles:"articles","ser-estar":"compare",agreement:"agreement",possessives:"people",questions:"question",conjugation:"verbs"})[id]||"grammar";}
function deckIcon(id){return ({due:"clock",recent:"spark",saved:"bookmark",greetings:"wave",family:"people",food:"food",travel:"travel",numbers:"clock",all:"cards"})[id]||"cards";}
function titleCase(value){return String(value||"").split(/[-\s]+/).map(word=>word.charAt(0).toUpperCase()+word.slice(1)).join(" ");}
function showToast(message){document.querySelector(".practice-toast")?.remove();const toast=document.createElement("div");toast.className="practice-toast";toast.setAttribute("role","status");toast.setAttribute("aria-live","polite");toast.innerHTML=`${icon("check")}<strong>${escapeHtml(message)}</strong>`;document.body.appendChild(toast);requestAnimationFrame(()=>toast.classList.add("visible"));setTimeout(()=>{toast.classList.remove("visible");setTimeout(()=>toast.remove(),200);},1800);}
function escapeJs(value){return String(value||"").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/\r?\n/g," ");}
function escapeAttr(value){return escapeHtml(value).replace(/`/g,"&#96;");}
function escapeHtml(value){return String(value||"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);}

function icon(name) {
  const paths = {
    target:'<circle cx="11.5" cy="12.5" r="7.5"/><circle cx="11.5" cy="12.5" r="3.25"/><path d="m14 10 6-6m0 0v4m0-4h-4"/>',review:'<rect x="4" y="7" width="13" height="10" rx="2"/><path d="m10 10 3 2-3 2v-4Zm7 1 3-2v6l-3-2"/>',arrow:'<path d="m9 5 7 7-7 7"/>',back:'<path d="m15 18-6-6 6-6"/>',cards:'<rect x="5.5" y="4" width="13" height="16" rx="2.2"/><path d="M8.5 8h7M8.5 12h5"/><path d="M8 2.5h9.5A3.5 3.5 0 0 1 21 6v11"/>',verbs:'<path d="M5 4h14M5 20h14M8 4v16M16 4v16"/><path d="M6 8h4m4 8h4"/>',games:'<path d="M8.2 8h7.6c1.4 0 2.5.8 3 2.1l1.5 4.5c.7 2.2-1.9 4-3.7 2.5l-2.2-1.8H9.6l-2.2 1.8c-1.8 1.5-4.4-.3-3.7-2.5l1.5-4.5A3.2 3.2 0 0 1 8.2 8Z"/><path d="M9 11v4m-2-2h4m4.5-1.5h.01M17.5 14h.01"/>',grammar:'<path d="M6 3.5h9l3 3V20.5H6z"/><path d="M15 3.5v3h3M9 10h6M9 13.5h6M9 17h4"/>',bookmark:'<path d="M7 4.5c0-1 .8-1.8 1.8-1.8h6.4c1 0 1.8.8 1.8 1.8V21l-5-3.2L7 21V4.5Z"/>',retry:'<path d="M5.2 8.5A8 8 0 1 1 4 14"/><path d="M5 3v5.5h5.5"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6.5v5.8l3.8 2.2"/>',trend:'<path d="m4 16.5 5-5 4 3.5 7-8"/><path d="M15.5 7H20v4.5"/>',alert:'<path d="M10.4 4.6 2.8 18a1.8 1.8 0 0 0 1.6 2.7h15.2a1.8 1.8 0 0 0 1.6-2.7L13.6 4.6a1.8 1.8 0 0 0-3.2 0Z"/><path d="M12 9v5M12 17.5h.01"/>',spark:'<path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/>',check:'<path d="m5 12 4 4L19 6"/>',sound:'<path d="M5 10v4h3l4 3V7l-4 3H5Z"/><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12"/>',match:'<path d="M7 7h10v4H7zM7 15h10v4H7z"/><path d="m4 9 2 2 3-4M15 17l2 2 3-4"/>',sentence:'<path d="M4 6h7M13 6h7M4 12h4M10 12h10M4 18h10"/>',timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v5l3 2M9 3h6"/>',trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0V4Z"/><path d="M8 6H4v2a4 4 0 0 0 4 4M16 6h4v2a4 4 0 0 1-4 4M12 13v4M8 21h8"/>',close:'<path d="m6 6 12 12M18 6 6 18"/>',wave:'<path d="M8 12V6a1.5 1.5 0 0 1 3 0v4-6a1.5 1.5 0 0 1 3 0v6-5a1.5 1.5 0 0 1 3 0v8l2-2a1.7 1.7 0 0 1 2.4 2.4L17 18a7 7 0 0 1-5 2H9a6 6 0 0 1-6-6v-2a1.5 1.5 0 0 1 3 0v1"/>',people:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.5-5 2.5-7 6-7s5.5 2 6 7M14 14c4 0 6 2 6.5 6"/>',food:'<path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M14 3v7h3"/>',travel:'<path d="m3 15 18-9-7 15-2-7-9 1Z"/>',articles:'<path d="M5 19 10 5h4l5 14M7 14h10"/>',compare:'<path d="M4 8h16M7 5 4 8l3 3M17 13l3 3-3 3M4 16h16"/>',agreement:'<path d="M5 7h9M5 12h14M5 17h7"/><path d="m16 6 2 2 3-4"/>',question:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4 2.4c-1 .6-1.5 1.1-1.5 2.1M12 17h.01"/>',flame:'<path d="M13 3s1 4-2 6c-2 1.5-3 3-3 5a4 4 0 0 0 8 0c0-2-1-3.5-1-5 3 2 4 4 4 7a7 7 0 0 1-14 0c0-5 4-7 8-13Z"/>',flip:'<path d="M4 7h11a5 5 0 0 1 5 5v5"/><path d="m16 14 4 3 3-4M20 17H9a5 5 0 0 1-5-5V7"/>',sprint:'<path d="M5 16c3-7 7-10 14-10-1 7-4 11-11 14l-3-4Z"/><path d="m10 15-5 5M13 9h.01"/>',heart:'<path d="M20.8 5.7a5 5 0 0 0-7.1 0L12 7.4l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.2a5 5 0 0 0 0-7.1Z" fill="currentColor"/>',"heart-empty":'<path d="M20.8 5.7a5 5 0 0 0-7.1 0L12 7.4l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21l8.8-8.2a5 5 0 0 0 0-7.1Z"/>',
  };
  return `<svg class="practice-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.spark}</svg>`;
}
