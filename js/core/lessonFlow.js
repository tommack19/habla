export const LESSON_FLOW_VERSION = 3;

export const LESSON_SECTION_LABELS = Object.freeze({
  story: "Episode Opening",
  vocabulary: "Words You\u2019ll Need",
  grammar: "Carlos\u2019 Advice",
  dialogue: "Watch Carlos",
  listening: "Watch Carlos",
  pronunciation: "Say It Naturally",
  speaking: "Talk with Carlos",
  flashcards: "Keep It Fresh",
  quiz: "Can You Remember?",
  culture: "Madrid Moment",
  complete: "Episode Complete",
});

export function buildLessonFlow(lesson = {}, { includeRemovedConversation = false } = {}) {
  const steps = [{ id: "story", label: LESSON_SECTION_LABELS.story, type: "story" }];
  const dialogue = normalizeList(lesson.dialogue || lesson.dialogues);
  const messageThread = dialogue.find(scene => scene?.presentation?.type === "messageThread");
  const standardDialogue = dialogue.find(scene => scene !== messageThread);

  if (messageThread) {
    steps.push({ id: "messages", label: "A Message from Carlos", type: "dialogue", data: messageThread, legacyCombined: true });
  }
  if (lesson.learnerChoices?.options?.length) steps.push({ id: "choice", label: "Choose the Moment", type: "choice" });
  if (lesson.vocabulary?.length) steps.push({ id: "vocabulary", label: LESSON_SECTION_LABELS.vocabulary, type: "vocabulary" });
  if (lesson.grammar) steps.push({ id: "grammar", label: LESSON_SECTION_LABELS.grammar, type: "grammar" });
  if (standardDialogue) steps.push({ id: "dialogue", label: LESSON_SECTION_LABELS.dialogue, type: "dialogue", data: standardDialogue });
  if (lesson.listening || lesson.listeningPhrases?.length) {
    steps.push({
      id: "listening",
      label: LESSON_SECTION_LABELS.listening,
      type: "listening",
      data: standardDialogue || messageThread,
      legacyCombined: Boolean(standardDialogue),
    });
  }
  if (lesson.pronunciation || lesson.pronunciationExercises?.length) steps.push({ id: "pronunciation", label: LESSON_SECTION_LABELS.pronunciation, type: "pronunciation" });
  if (lesson.speaking || lesson.speakingChallenge?.length) steps.push({ id: "speaking", label: LESSON_SECTION_LABELS.speaking, type: "speaking" });
  if (hasFlashcards(lesson)) steps.push({ id: "flashcards", label: LESSON_SECTION_LABELS.flashcards, type: "flashcards" });
  if (lesson.quiz?.length) steps.push({ id: "quiz", label: LESSON_SECTION_LABELS.quiz, type: "quiz" });
  if (includeRemovedConversation && lesson.realLifeMission) steps.push({ id: "conversation", label: "Removed conversation", type: "conversation" });
  if (lesson.culture || lesson.worldBuilding?.length || lesson.livingWorldInteractions?.length) steps.push({ id: "culture", label: LESSON_SECTION_LABELS.culture, type: "culture" });
  return steps;
}

export function resolveLessonFlow(lesson, progress = {}) {
  const steps = buildLessonFlow(lesson);
  const requestedId = normalizeRemovedStepId(progress.rendererStepId);
  let index = requestedId ? steps.findIndex(step => step.id === requestedId) : -1;

  if (index < 0 && Number(progress.lessonFlowVersion || 0) < 2) {
    const legacy = buildLessonFlow(lesson, { includeRemovedConversation: true });
    const legacyIndex = clampIndex(progress.rendererStep, legacy.length);
    const legacyId = normalizeRemovedStepId(legacy[legacyIndex]?.id);
    index = steps.findIndex(step => step.id === legacyId);
  }
  if (index < 0) index = clampIndex(progress.rendererStep, steps.length);

  const visibleSteps = steps.filter(step => !step.legacyCombined);
  const visibleIndex = Math.max(0, steps.slice(0, index + 1).filter(step => !step.legacyCombined).length - 1);
  const totalScreens = visibleSteps.length + 1;
  const percent = progress.completed && progress.showCompletion
    ? 100
    : Math.round((visibleIndex / Math.max(totalScreens, 1)) * 100);

  return {
    steps,
    index,
    step: steps[index],
    stepId: steps[index]?.id || "story",
    visibleSteps,
    visibleIndex,
    totalScreens,
    percent,
  };
}

function normalizeRemovedStepId(value) {
  if (value === "conversation" || value === "your-turn" || value === "mission") return "speaking";
  return String(value || "");
}

function normalizeList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function hasFlashcards(lesson) {
  const deck = Array.isArray(lesson.flashcards) ? lesson.flashcards[0] : lesson.flashcards;
  return Boolean(deck?.items?.length);
}

function clampIndex(value, length) {
  const numeric = Number(value);
  return Math.min(Math.max(Number.isFinite(numeric) ? numeric : 0, 0), Math.max(length - 1, 0));
}
