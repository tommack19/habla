import { getLessonProgress, getSavedQuizReviewQuestions, getUnlockedLessons } from "./content.js";
import { state } from "./state.js";
import { getCardSchedule, isCardDue, readPracticeState } from "./practiceStore.js";

const DECKS = Object.freeze([
  { id: "greetings", title: "Greetings", lessonIds: ["a1-lesson-01-greetings", "a1-lesson-02-introductions"] },
  { id: "family", title: "Family", lessonIds: ["lesson-03-family"] },
  { id: "food", title: "Food & drinks", lessonIds: ["lesson-05-shopping", "lesson-06-food-drinks"] },
  { id: "travel", title: "Travel", lessonIds: ["lesson-07-travel-basics"] },
  { id: "numbers", title: "Numbers & time", lessonIds: ["lesson-04-numbers-time"] },
]);

export function getPracticeVocabulary() {
  const unlocked = getUnlockedLessons();
  const completed = unlocked.filter(lesson => getLessonProgress(lesson.id).completed);
  const sourceLessons = completed.length ? completed : unlocked.slice(0, 1);
  const cards = sourceLessons.flatMap(lesson => buildLessonCards(lesson));
  const saved = getSavedWords().map(item => ({ ...item, deckIds: ["saved"], saved: true, key: item.key || `${item.sourceLessonId || "saved"}:${normalize(item.spanish)}` }));
  return dedupe([...saved, ...cards]);
}

export function getDecks() {
  const cards = getPracticeVocabulary();
  const due = cards.filter(card => isCardDue(card.key));
  const recent = [...cards].sort((a, b) => String(b.learnedAt || "").localeCompare(String(a.learnedAt || "")));
  return [
    { id: "due", title: "Due for review", cards: due },
    { id: "recent", title: "Recent words", cards: recent },
    { id: "saved", title: "Saved words", cards: cards.filter(card => card.saved) },
    ...DECKS.map(deck => ({ ...deck, cards: cards.filter(card => card.deckIds.includes(deck.id)) })),
    { id: "all", title: "All vocabulary", cards },
  ];
}

export function getDeck(id) { return getDecks().find(deck => deck.id === id) || getDecks().at(-1); }

export function getPracticeSentences() {
  const unlocked = getUnlockedLessons();
  const completed = unlocked.filter(lesson => getLessonProgress(lesson.id).completed);
  const lessons = completed.length ? completed : unlocked.slice(0, 1);
  const sentences = lessons.flatMap(lesson => [
    ...(lesson.vocabulary || []).map(item => ({ spanish: item.exampleSpanish, english: item.exampleEnglish, lessonId: lesson.id })),
    ...normalizeDialogue(lesson.dialogue).flatMap(scene => (scene.lines || []).map(line => ({ spanish: line.spanish, english: line.english, lessonId: lesson.id }))),
  ]).filter(item => item.spanish && item.english && item.spanish.trim().split(/\s+/).length >= 2 && item.spanish.trim().split(/\s+/).length <= 9);
  return dedupe(sentences.map((item, index) => ({ ...item, id: `${item.lessonId}:sentence:${index}`, key: normalize(item.spanish) })), "key");
}

export function getWeakSpots() {
  const store = readPracticeState();
  const tracked = Object.values(store.weakSpots).map(item => ({
    id: item.id,
    title: item.title,
    attempts: item.attempts,
    correct: item.correct,
    mastery: item.attempts ? Math.round((item.correct / item.attempts) * 100) : 0,
  }));
  const difficultCards = getPracticeVocabulary().filter(card => ["again", "hard"].includes(getCardSchedule(card.key)?.rating));
  if (difficultCards.length) {
    const hardCount = difficultCards.filter(card => getCardSchedule(card.key)?.rating === "hard").length;
    tracked.push({ id: "difficult-vocabulary", title: "Vocabulary recall", attempts: difficultCards.length, correct: hardCount, mastery: Math.round((hardCount / difficultCards.length) * 45) });
  }
  const savedQuestions = getSavedQuizReviewQuestions();
  if (savedQuestions.length) tracked.push({ id: "saved-questions", title: "Saved questions", attempts: savedQuestions.length, correct: 0, mastery: 25 });
  return dedupe(tracked, "id").sort((a, b) => a.mastery - b.mastery).slice(0, 4);
}

export function getSavedWords() {
  return Array.isArray(state.vocabulary?.savedPhrases)
    ? state.vocabulary.savedPhrases.filter(item => item?.spanish && item?.english)
    : [];
}

function buildLessonCards(lesson) {
  const deckIds = DECKS.filter(deck => deck.lessonIds.includes(lesson.id)).map(deck => deck.id);
  return (lesson.vocabulary || []).filter(item => item?.spanish && item?.english).map((item, index) => ({
    key: `${lesson.id}:${normalize(item.spanish)}`,
    spanish: item.spanish,
    english: item.english,
    exampleSpanish: item.exampleSpanish || item.spanish,
    exampleEnglish: item.exampleEnglish || item.english,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    learnedAt: getLessonProgress(lesson.id).completedAt || "",
    deckIds,
    sourceIndex: index,
    saved: false,
  }));
}

function normalizeDialogue(value) { return !value ? [] : Array.isArray(value) ? value : [value]; }
function normalize(value) { return String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[¿?¡!.,]/g, "").trim(); }
function dedupe(items, keyName = "key") { const seen = new Set(); return items.filter(item => item?.[keyName] && !seen.has(item[keyName]) && seen.add(item[keyName])); }
