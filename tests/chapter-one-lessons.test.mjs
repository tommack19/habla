import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

function memoryStorage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key), clear: () => values.clear() };
}
globalThis.localStorage = memoryStorage();
globalThis.sessionStorage = memoryStorage();
globalThis.window = new EventTarget();
window.location = { hash: "#learn" };
window.history = { pushState: (_state, _title, hash) => { window.location.hash = hash; }, replaceState: (_state, _title, hash) => { window.location.hash = hash; } };
window.matchMedia = () => ({ matches: true });
globalThis.document = { querySelector: () => null, querySelectorAll: () => [], getElementById: () => null };
globalThis.fetch = async url => {
  assert.equal(url.protocol, "file:", "render tests must not contact a provider");
  return Response.json(JSON.parse(await readFile(url, "utf8")));
};
const content = await import("../js/core/content.js");
const lessons = (await content.contentReady).slice(0, 10);
const { renderLesson } = await import("../js/ui/lesson.js");
const { renderPractice } = await import("../js/ui/practice.js");
const { state } = await import("../js/core/state.js");
const { personalizeText } = await import("../js/core/personalization.js");
const { getLessonMemory, getLessonDiscoveries } = await import("../js/core/lessonMemory.js");
const { initializeProgressEngine } = await import("../js/core/progress.js");
const { getEpisodeArtwork } = await import("../js/data/lessonAssets.js");
const root = new URL("../", import.meta.url);
const htmlText = value => personalizeText(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
function resolveTurn(turn, choiceId) { return { ...turn, ...(turn.byChoice?.[choiceId] || {}) }; }
function correctOption(html, turn) {
  const options = [...html.matchAll(/onclick="hablaLesson.answerPattern\((\d+)\)"[^>]*><span>[^<]*<\/span><strong>([\s\S]*?)<\/strong>/g)];
  const found = options.find(([, , text]) => text === htmlText(turn.responseSpanish));
  assert.ok(found, `missing correct rehearsal option: ${turn.responseSpanish}`);
  return Number(found[1]);
}
function typeReply(index, text) {
  const exchange = { dataset: { speakingIndex: String(index) } };
  const label = { querySelector: () => ({ value: text }) };
  window.hablaLesson.submitSpeakingText({ closest: selector => selector === "label" ? label : exchange });
}

beforeEach(() => {
  localStorage.clear(); sessionStorage.clear();
  state.user = { name: "Maya & Alex", city: "London", country: "United Kingdom", nativeLanguage: "English", xp: 0 };
  state.vocabulary = { learned: [], weakWords: [], savedPhrases: [] };
  initializeProgressEngine(state);
});

test("all ten episodes run through the same seven scenes and completion, without duplicate rewards", () => {
  for (const lesson of lessons) {
    content.setActiveLesson(lesson.id);
    assert.match(renderLesson(), /data-motion-scene="arrive"/);
    assert.equal(content.getLessonProgress(lesson.id).lessonFlowVersion, lesson.learnExperience.flowVersion || 6);
    window.hablaLesson.next();
    assert.equal(content.getLessonProgress(lesson.id).rendererStep, 1, "fresh sessions must not remigrate and skip encounter");
    assert.match(renderLesson(), /data-motion-scene="encounter"/);
    const choice = lesson.learnerChoices?.options?.[0];
    if (choice) {
      window.hablaLesson.next();
      assert.equal(content.getLessonProgress(lesson.id).rendererStep, 1, "choice is required before continuing");
      window.hablaLesson.choose(choice.id);
      assert.equal(getLessonMemory(lesson.id).choiceId, choice.id);
    }
    window.hablaLesson.next();
    assert.match(renderLesson(), /data-motion-scene="discover"/);
    window.hablaLesson.next();
    for (let index = 0; index < lesson.conversationBuilder.length; index++) {
      const turn = resolveTurn(lesson.conversationBuilder[index], choice?.id);
      const html = renderLesson();
      assert.match(html, /data-motion-scene="rehearse"/);
      const correct = correctOption(html, turn);
      if (index === 0) {
        window.hablaLesson.answerPattern((correct + 1) % turn.practiceOptions.length);
        window.hablaLesson.nextPattern();
        assert.equal(content.getLessonProgress(lesson.id).rendererPatternPractice.index, 0, "wrong answers cannot advance");
        window.hablaLesson.retryPattern();
      }
      window.hablaLesson.answerPattern(correct);
      window.hablaLesson.nextPattern();
    }
    assert.match(renderLesson(), /data-motion-scene="speak"/);
    window.hablaLesson.finishNarrativeSpeak(true);
    const conversation = lesson.learnExperience.scenes.conversation.stages?.map(stage => ({
      speaker: stage.speaker, carlosEnglish: stage.carlosPromptEnglish, responseSpanish: stage.text,
    })) || lesson.conversationBuilder;
    for (let index = 0; index < conversation.length; index++) {
      const turn = resolveTurn(conversation[index], choice?.id);
      const html = renderLesson();
      assert.match(html, /data-motion-scene="converse"/);
      if (lesson === lessons[0]) {
        // Frozen Lesson 1 keeps its established English task and expandable response hint.
        assert.ok(html.includes(htmlText(lesson.conversationBuilder[index].responseEnglish)));
      } else assert.ok(html.includes(htmlText(turn.carlosEnglish)), "English is visible for the current prompt");
      assert.ok(html.includes(`data-speaker="${turn.speaker || "Carlos"}"`));
      typeReply(index, personalizeText(turn.responseSpanish));
      assert.equal(content.getLessonProgress(lesson.id).guidedSpeakingAttempts[index].typedResponse, personalizeText(turn.responseSpanish));
      window.hablaLesson.next();
    }
    assert.match(renderLesson(), /data-motion-scene="culture"/);
    assert.equal(content.getLessonProgress(lesson.id).rendererStep, 6);
    window.hablaLesson.next();
    const completed = content.getLessonProgress(lesson.id);
    assert.equal(completed.completed, true);
    assert.match(renderLesson(), /data-motion-scene="completion"/);
    if (lesson !== lessons[0]) assert.match(renderLesson(), /Your next conversation is ready/);
    assert.ok(completed.xpAwarded <= Number(lesson.xpReward));
    window.hablaLesson.next();
    assert.equal(content.getLessonProgress(lesson.id).xpAwarded, completed.xpAwarded);
    assert.equal(content.getLessonProgress(lesson.id).completedAt, completed.completedAt);
  }
});

test("every branch has one valid rehearsal answer and carries through model, pattern, and speaking", () => {
  for (const lesson of lessons.filter(item => item.learnerChoices?.options?.length)) {
    content.setActiveLesson(lesson.id); renderLesson();
    for (const choice of lesson.learnerChoices.options) {
      window.hablaLesson.choose(choice.id);
      content.updateLessonProgress(lesson.id, { rendererStep: 1 });
      let html = renderLesson();
      assert.ok(html.includes(htmlText(choice.carlosEnglish)));
      for (let index = 0; index < lesson.conversationBuilder.length; index++) {
        const turn = resolveTurn(lesson.conversationBuilder[index], choice.id);
        assert.equal(new Set(turn.practiceOptions).size, turn.practiceOptions.length);
        assert.equal(turn.practiceOptions.filter(item => item === turn.responseSpanish).length, 1);
        assert.ok(html.includes(htmlText(turn.responseSpanish)), "a tested reply appears in the model scene first");
        content.updateLessonProgress(lesson.id, { rendererStep: 3, rendererPatternPractice: { index, selected: null, complete: false } });
        correctOption(renderLesson(), turn);
        content.updateLessonProgress(lesson.id, { rendererStep: 5, guidedSpeakingIndex: index });
        assert.ok(renderLesson().includes(htmlText(turn.responseSpanish)), "speaking hints use the selected branch");
      }
    }
  }
});

test("legacy progress migrates once while preserving completion, rewards, choices, and quiz review", () => {
  const lesson = lessons[1]; content.setActiveLesson(lesson.id);
  content.updateLessonProgress(lesson.id, { lessonFlowVersion: 5, rendererStep: 2, completed: true, completedAt: "2026-08-20", xpAwarded: 80, showCompletion: false,
    guidedSpeakingIndex: 4, guidedSpeakingAttempts: { 0: { typedResponse: "old exercise" } }, quizReviewFlags: { 2: { questionIndex: 2 } }, completedSections: ["grammar", "quiz"] });
  renderLesson();
  const progress = content.getLessonProgress(lesson.id);
  assert.equal(progress.rendererStep, 2);
  assert.equal(progress.lessonFlowVersion, lesson.learnExperience.flowVersion || 6);
  assert.equal(progress.completedAt, "2026-08-20");
  assert.equal(progress.xpAwarded, 80);
  assert.equal(progress.completed, true);
  assert.deepEqual(progress.quizReviewFlags, { 2: { questionIndex: 2 } });
  assert.deepEqual(progress.guidedSpeakingAttempts, {});
  assert.deepEqual(progress.completedSections, ["pattern", "culture"]);
  content.updateLessonProgress(lesson.id, { guidedSpeakingAttempts: { 0: { typedResponse: "new exercise" } } });
  renderLesson();
  assert.equal(content.getLessonProgress(lesson.id).guidedSpeakingAttempts[0].typedResponse, "new exercise");
  // Lesson 4 used only a message thread. Its old message step must open the encounter, not disappear.
  content.setActiveLesson(lessons[3].id);
  content.updateLessonProgress(lessons[3].id, { lessonFlowVersion: 5, rendererStep: 1 });
  assert.match(renderLesson(), /data-motion-scene="encounter"/);
});

test("a changed choice resets only the dependent practice, and optional discoveries remain explicit", () => {
  const lesson = lessons[4]; content.setActiveLesson(lesson.id); renderLesson();
  window.hablaLesson.choose("apples");
  content.updateLessonProgress(lesson.id, { guidedSpeakingAttempts: { 0: { attempted: true } }, rendererPatternPractice: { complete: true }, xpAwarded: 90 });
  window.hablaLesson.choose("bread");
  assert.deepEqual(content.getLessonProgress(lesson.id).guidedSpeakingAttempts, {});
  assert.equal(content.getLessonProgress(lesson.id).rendererPatternPractice.complete, false);
  assert.equal(content.getLessonProgress(lesson.id).xpAwarded, 90);
  assert.equal(getLessonMemory(lesson.id).choiceId, "bread");
  content.updateLessonProgress(lesson.id, { rendererStep: 6 });
  renderLesson();
  assert.deepEqual(getLessonDiscoveries(lesson.id), []);
  window.hablaLesson.discover(lesson.livingWorldInteractions[0].id);
  window.hablaLesson.discover(lesson.livingWorldInteractions[0].id);
  assert.equal(getLessonDiscoveries(lesson.id).length, 1);
});

test("each lesson review opens its own content and the finale stays in Madrid until the postcard", () => {
  for (const lesson of lessons) {
    content.completeLesson(lesson.id);
    const topic = lesson.learnExperience.practiceUnlock.topic;
    sessionStorage.setItem("habla_practice_session_v2", JSON.stringify({ topic, mode: "flashcards", view: "activity" }));
    localStorage.setItem("habla_selected_practice_topic_v1", topic);
    renderPractice(state);
    const saved = JSON.parse(sessionStorage.getItem("habla_practice_session_v2"));
    assert.equal(saved.flash.lessonId, lesson.id, `wrong review lesson for ${lesson.title}`);
  }
  const finale = lessons[9]; content.setActiveLesson(finale.id);
  content.updateLessonProgress(finale.id, { showCompletion: false, rendererStep: 0, lessonFlowVersion: 6 });
  assert.doesNotMatch(getEpisodeArtwork(finale, "cover"), /granada|episode-10/);
  assert.match(renderLesson(), /landmarks\/madrid\/madrid-evening/);
  content.updateLessonProgress(finale.id, { showCompletion: true, speakingSkipped: false });
  const html = renderLesson();
  assert.match(html, /Madrid Complete/);
  assert.match(html, /chapter-02-granada-postcard/);
  assert.match(html, /Elena/);
  assert.ok(html.includes(htmlText(finale.chapterCeremony.postcard.voiceEnglish)));
});

test("content contracts, local assets, profile placeholders, and chapter-review scope remain valid", () => {
  const allowedTokens = new Set(["learnerName", "learnerCity", "learnerCountry", "learnerCountryEnglish", "questionCount", "questionNumber"]);
  for (const [index, lesson] of lessons.entries()) {
    assert.equal(lesson.prerequisiteLesson || null, lessons[index - 1]?.id || null);
    assert.equal(lesson.nextLesson, lessons[index + 1]?.id || "lesson-11-weather");
    assert.ok(lesson.vocabulary.length >= 15 && lesson.vocabulary.length <= 30);
    assert.ok(lesson.quiz.length >= 15 && lesson.quiz.length <= 20);
    for (const match of JSON.stringify(lesson).matchAll(/\{\{(\w+)\}\}/g)) assert.ok(allowedTokens.has(match[1]));
    const visit = value => {
      if (Array.isArray(value)) { value.forEach(visit); return; }
      if (!value || typeof value !== "object") return;
      if (value.options && typeof value.answer === "string") assert.equal(value.options.filter(item => item === value.answer).length, 1);
      for (const [key, field] of Object.entries(value)) {
        if (key === "image" && typeof field === "string" && field.startsWith("assets/")) assert.ok(existsSync(fileURLToPath(new URL(field, root))), field);
        visit(field);
      }
    };
    visit(lesson);
    content.setActiveLesson(lesson.id); renderLesson();
    content.updateLessonProgress(lesson.id, { rendererStep: 5 });
    const html = renderLesson();
    assert.doesNotMatch(html, /\{\{learner|\bundefined\b|\bNaN\b/);
  }
  content.setActiveLesson(lessons[1].id);
  content.updateLessonProgress(lessons[1].id, { rendererStep: 4 });
  const personal = renderLesson();
  assert.match(personal, /Reino Unido/);
  assert.match(personal, /Londres/);
  assert.equal(lessons[9].chapterReview, true);
  assert.equal(lessons[9].grammar, undefined);
  assert.equal(lessons[9].miniMissions.length, 6);
});

test("Lesson 2 keeps its cinematic contract and an existing version-7 session", () => {
  const lesson = lessons[1];
  assert.equal(lesson.learnExperience.flowVersion, 7);
  assert.deepEqual(lesson.conversationBuilder.map(turn => turn.id), ["share-origin", "share-residence", "ask-residence"]);
  assert.equal(lesson.learnExperience.scenes.conversation.stages.length, 3);
  assert.equal(lesson.learnExperience.scenes.conversation.speaker, "Ana");
  assert.equal(lesson.learnExperience.scenes.speak.allowTypedResponse, true);
  assert.equal(lesson.learnExperience.scenes.completion.showRewards, true);
  content.setActiveLesson(lesson.id);
  content.updateLessonProgress(lesson.id, {
    lessonFlowVersion: 7, rendererStep: 5, guidedSpeakingIndex: 1,
    guidedSpeakingAttempts: { 0: { attempted: true, typedResponse: "Me llamo Maya. Mucho gusto." } },
    rendererPatternPractice: { index: 2, selected: "Vivo en Londres. ¿Dónde vives?", complete: true },
    completedSections: ["story", "encounter", "pattern", "rehearsal", "speak"],
  });
  const saved = content.getLessonProgress(lesson.id);
  const html = renderLesson();
  renderLesson();
  assert.deepEqual(content.getLessonProgress(lesson.id), saved, "modern attempts must not be remigrated");
  assert.match(html, /Talk with Ana/);
  assert.match(html, /Me llamo Maya/);
  assert.doesNotMatch(html, /lesson-chapter-episode/);
});

test("Lesson 2 review remains completion-gated and unlocks the exact lesson", () => {
  const lesson = lessons[1];
  content.completeLesson(lessons[0].id);
  sessionStorage.setItem("habla_practice_session_v2", JSON.stringify({ topic: "introductions", mode: "flashcards", view: "activity" }));
  localStorage.setItem("habla_selected_practice_topic_v1", "introductions");
  renderPractice(state);
  assert.notEqual(JSON.parse(sessionStorage.getItem("habla_practice_session_v2")).flash?.lessonId, lesson.id);
  content.completeLesson(lesson.id);
  sessionStorage.setItem("habla_practice_session_v2", JSON.stringify({ topic: "introductions", mode: "flashcards", view: "activity" }));
  renderPractice(state);
  assert.equal(JSON.parse(sessionStorage.getItem("habla_practice_session_v2")).flash.lessonId, lesson.id);
});
