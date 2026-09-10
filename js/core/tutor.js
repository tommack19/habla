import { getLearnerMemoryProfile, getLessonMemory } from "./lessonMemory.js";

const PREFERENCES_KEY = "habla_carlos_preferences_v1";
const CORRECTIONS_KEY = "habla_carlos_corrections_v1";
export const TUTOR_MODES = ["conversation", "lesson", "grammar", "review"];

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}

export function readTutorPreferences() {
  const value = read(PREFERENCES_KEY, {});
  return { autoSpeak: value?.autoSpeak !== false, mode: TUTOR_MODES.includes(value?.mode) ? value.mode : "conversation" };
}

export function saveTutorPreferences(value) {
  return write(PREFERENCES_KEY, { autoSpeak: value.autoSpeak !== false, mode: TUTOR_MODES.includes(value.mode) ? value.mode : "conversation" });
}

export function getTutorCorrections() {
  const value = read(CORRECTIONS_KEY, []);
  return Array.isArray(value) ? value.filter(item => typeof item?.corrected === "string" && typeof item?.original === "string").slice(-16) : [];
}

export function rememberTutorCorrection(correction, message, lessonId) {
  if (!correction?.original || !correction.corrected || !String(message).includes(correction.original)) return;
  const list = getTutorCorrections().filter(item => item.corrected !== correction.corrected);
  list.push({ original: correction.original, corrected: correction.corrected, explanation: correction.explanation,
    translation: correction.translation, lessonId, recordedAt: new Date().toISOString() });
  return write(CORRECTIONS_KEY, list.slice(-16));
}

export function clearTutorCorrections() { return write(CORRECTIONS_KEY, []); }

export function buildTutorContext(state, lesson, mode) {
  const profile = state.user || {};
  const memory = getLearnerMemoryProfile();
  const storyMemories = [];
  function flatten(value, prefix = "", depth = 0) {
    if (!value || typeof value !== "object" || depth > 3) return;
    for (const [key, item] of Object.entries(value)) {
      if (storyMemories.length >= 11) break;
      const path = prefix ? `${prefix}.${key}` : key;
      if (item && typeof item === "object") flatten(item, path, depth + 1);
      else if (["string", "number", "boolean"].includes(typeof item)) storyMemories.push({ key: path, value: String(item).slice(0, 240) });
    }
  }
  flatten(memory);
  const choice = lesson?.id ? getLessonMemory(lesson.id) : null;
  if (choice?.choiceLabel) storyMemories.push({ key: "currentLessonChoice", value: choice.choiceLabel });
  return {
    mode, lessonId: lesson?.id || "",
    profile: Object.fromEntries(["name", "city", "country", "nativeLanguage", "level", "goal", "dialect"].map(key => [key, String(profile[key] || "").slice(0, key === "goal" ? 250 : 80)])),
    storyMemories,
    recentCorrections: getTutorCorrections().slice(-8),
    savedPhrases: (Array.isArray(state.vocabulary?.savedPhrases) ? state.vocabulary.savedPhrases : []).slice(-8).map(item => ({ spanish: item.spanish, english: item.english })),
  };
}

export async function requestTutorTurn(history, context, signal) {
  const messages = history.filter(item => !item.failed && ["user", "assistant"].includes(item.role) && typeof item.content === "string")
    .slice(-20).map(item => ({ role: item.role, content: item.content.slice(0, item.role === "user" ? 1500 : 4000) }));
  const response = await fetch("/api/chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, context }), signal,
  });
  let data;
  try { data = await response.json(); } catch { throw new Error("Carlos is not connected on this version of Habla."); }
  if (!response.ok) throw new Error(data?.error || "Carlos could not connect. Please try again.");
  if (typeof data?.reply !== "string" || !data.reply.trim() || typeof data.translation !== "string") throw new Error("Carlos returned an incomplete reply. Please try again.");
  return data;
}

export function saveTutorPhrase(state, phrase) {
  if (!phrase?.spanish || !phrase?.english) return false;
  state.vocabulary ||= { learned: [], weakWords: [], savedPhrases: [] };
  if (!Array.isArray(state.vocabulary.savedPhrases)) state.vocabulary.savedPhrases = [];
  const saved = state.vocabulary.savedPhrases;
  const normalized = phrase.spanish.trim().normalize("NFC").toLocaleLowerCase();
  if (saved.some(item => String(item.spanish || "").trim().normalize("NFC").toLocaleLowerCase() === normalized)) return true;
  saved.push({ key: `carlos:${normalized}`, spanish: phrase.spanish, english: phrase.english,
    source: "carlos", sourceLessonId: "", savedAt: new Date().toISOString() });
  return true;
}
