const MEMORY_KEY = "habla_lesson_memories_v1";

export function getLessonMemory(lessonId) {
  return readMemories().lessons[lessonId] || null;
}

export function getLearnerMemoryProfile() {
  return structuredCloneSafe(readMemories().profile);
}

export function rememberLessonChoice(lesson, choice) {
  if (!lesson?.id || !choice?.id) return null;
  const memories = readMemories();
  const existing = memories.lessons[lesson.id] || {};
  const memory = {
    ...existing,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    contentVersion: lesson.contentVersion || "1.0",
    choiceId: choice.id,
    choiceLabel: choice.label || choice.learnerEnglish || choice.id,
    learnerSpanish: choice.learnerSpanish || "",
    carlosSpanish: choice.carlosSpanish || "",
    chosenAt: existing.chosenAt || new Date().toISOString(),
  };
  memories.lessons[lesson.id] = memory;

  const choiceWrite = lesson.memory?.onChoice;
  if (choiceWrite?.key) {
    setPath(memories.profile, choiceWrite.key, resolveMemoryValue(choiceWrite, { lesson, choice }));
  }

  saveMemories(memories, "habla:lesson-memory", memory);
  return memory;
}

export function rememberLessonCompletion(lesson) {
  if (!lesson?.id) return null;
  const memories = readMemories();
  const choice = memories.lessons[lesson.id] || null;
  for (const write of lesson.memory?.onComplete || []) {
    if (write?.key) setPath(memories.profile, write.key, resolveMemoryValue(write, { lesson, choice }));
  }
  memories.lessons[lesson.id] = {
    ...(memories.lessons[lesson.id] || {}),
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    completedAt: memories.lessons[lesson.id]?.completedAt || new Date().toISOString(),
  };
  saveMemories(memories, "habla:learner-memory", { lessonId: lesson.id, profile: memories.profile });
  return memories.lessons[lesson.id];
}

export function rememberDiscovery(lesson, discovery) {
  if (!lesson?.id || !discovery?.id) return null;
  const memories = readMemories();
  const key = `${lesson.id}:${discovery.id}`;
  const existing = memories.discoveries[key];
  memories.discoveries[key] = existing || {
    id: discovery.id,
    lessonId: lesson.id,
    lessonTitle: lesson.title,
    title: discovery.title || discovery.label || discovery.id,
    carlosSpanish: discovery.carlosSpanish || "",
    carlosEnglish: discovery.carlosEnglish || "",
    discoveredAt: new Date().toISOString(),
  };
  for (const write of discovery.memoryWrites || []) {
    if (write?.key) setPath(memories.profile, write.key, resolveMemoryValue(write, { lesson, discovery }));
  }
  saveMemories(memories, "habla:living-world-memory", memories.discoveries[key]);
  return memories.discoveries[key];
}

export function getLessonDiscoveries(lessonId) {
  return Object.values(readMemories().discoveries).filter(item => item.lessonId === lessonId);
}

export function scheduleLessonRecap(lesson) {
  const recap = lesson?.eveningRecap;
  if (!lesson?.id || !recap) return null;
  const memories = readMemories();
  const existing = Object.values(memories.recaps).find(item => item.lessonId === lesson.id);
  if (existing) return existing;

  const choiceId = memories.lessons[lesson.id]?.choiceId;
  const message = recap.byChoice?.[choiceId] || recap.message;
  if (!message) return null;

  const now = new Date();
  const deliverAt = new Date(now.getTime() + Math.max(1, Number(recap.delayMinutes || 120)) * 60_000);
  const id = `${lesson.id}:${now.toISOString()}`;
  memories.recaps[id] = {
    id,
    lessonId: lesson.id,
    choiceId: choiceId || null,
    message,
    scheduledAt: now.toISOString(),
    deliverAt: deliverAt.toISOString(),
    deliveredAt: null,
  };
  saveMemories(memories, "habla:evening-recap-scheduled", memories.recaps[id]);
  return memories.recaps[id];
}

export function consumeDueRecap(now = new Date()) {
  const memories = readMemories();
  const recap = Object.values(memories.recaps)
    .filter(item => !item.deliveredAt && new Date(item.deliverAt).getTime() <= now.getTime())
    .sort((a, b) => String(a.deliverAt).localeCompare(String(b.deliverAt)))[0];
  if (!recap) return null;
  recap.deliveredAt = now.toISOString();
  saveMemories(memories, "habla:evening-recap-delivered", recap);
  return { ...recap };
}

export function markLessonMemoryUsed(sourceLessonId, targetLessonId, callbackId = "default") {
  const memories = readMemories();
  const key = `${sourceLessonId}:${targetLessonId}:${callbackId}`;
  memories.callbacks[key] = {
    sourceLessonId,
    targetLessonId,
    callbackId,
    usedAt: new Date().toISOString(),
  };
  saveMemories(memories);
  return memories.callbacks[key];
}

export function getJourneyMemories() {
  const memories = readMemories();
  return Object.values(memories.lessons).sort((a, b) => String(a.chosenAt || a.completedAt).localeCompare(String(b.chosenAt || b.completedAt)));
}

function readMemories() {
  if (typeof localStorage === "undefined") return createMemoryStore();
  try {
    const parsed = JSON.parse(localStorage.getItem(MEMORY_KEY) || "null");
    return {
      version: 2,
      profile: parsed?.profile && typeof parsed.profile === "object" ? parsed.profile : createProfile(),
      lessons: parsed?.lessons && typeof parsed.lessons === "object" ? parsed.lessons : {},
      discoveries: parsed?.discoveries && typeof parsed.discoveries === "object" ? parsed.discoveries : {},
      callbacks: parsed?.callbacks && typeof parsed.callbacks === "object" ? parsed.callbacks : {},
      recaps: parsed?.recaps && typeof parsed.recaps === "object" ? parsed.recaps : {},
      updatedAt: parsed?.updatedAt || null,
    };
  } catch {
    return createMemoryStore();
  }
}

function saveMemories(memories, eventName, detail) {
  memories.version = 2;
  memories.updatedAt = new Date().toISOString();
  if (typeof localStorage !== "undefined") localStorage.setItem(MEMORY_KEY, JSON.stringify(memories));
  if (eventName && typeof window !== "undefined") window.dispatchEvent(new CustomEvent(eventName, { detail }));
}

function resolveMemoryValue(write, context) {
  if (write.valueFrom === "choice.id") return context.choice?.id || context.choice?.choiceId || null;
  if (write.valueFrom === "choice.label") return context.choice?.label || context.choice?.choiceLabel || null;
  return write.value;
}

function setPath(target, path, value) {
  const segments = String(path).split(".").filter(Boolean);
  if (!segments.length) return;
  let cursor = target;
  for (const segment of segments.slice(0, -1)) {
    if (!cursor[segment] || typeof cursor[segment] !== "object") cursor[segment] = {};
    cursor = cursor[segment];
  }
  cursor[segments.at(-1)] = value;
}

function structuredCloneSafe(value) {
  return JSON.parse(JSON.stringify(value));
}

function createProfile() {
  return { preferences: {}, habits: {}, story: {} };
}

function createMemoryStore() {
  return { version: 2, profile: createProfile(), lessons: {}, discoveries: {}, callbacks: {}, recaps: {}, updatedAt: null };
}
