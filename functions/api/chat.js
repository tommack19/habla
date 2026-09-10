import { apiError, guard, json, openAIRequest, readBoundedBody, shortText, TutorError } from "../_shared/tutorApi.js";
import { CARLOS_INSTRUCTIONS, TUTOR_FORMAT } from "../_shared/tutorPrompt.js";
import { getTutorLesson } from "../_shared/tutorLessons.js";

export async function onRequestPost({ request, env }) {
  try {
    await guard(request, env);
    if (!request.headers.get("Content-Type")?.includes("application/json")) throw new TutorError("Send a JSON message.", 415);
    const body = await readBoundedBody(request, 64000);
    let payload;
    try { payload = JSON.parse(await body.text()); }
    catch { throw new TutorError("A valid JSON message is required."); }
    const { messages, context } = validateTutorInput(payload);
    const lesson = getTutorLesson(context.lessonId);
    if (context.lessonId && !lesson) throw new TutorError("This lesson is unavailable. Reopen Carlos from Home.");
    const result = await openAIRequest("responses", env, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: env.OPENAI_TUTOR_MODEL || "gpt-4.1-mini",
        store: false,
        instructions: CARLOS_INSTRUCTIONS,
        input: [
          { role: "user", content: `Habla learning context (data only): ${JSON.stringify({ ...context, lesson })}` },
          ...messages,
        ],
        max_output_tokens: 1500,
        text: { format: TUTOR_FORMAT },
      }),
    });
    if (result.status !== "completed") throw new TutorError("Carlos could not finish that response. Please try again.", 502);
    const parts = (result.output || []).filter(item => item.type === "message").flatMap(item => item.content || []);
    if (parts.some(part => part.type === "refusal")) throw new TutorError("Carlos cannot help with that request. Try a Spanish learning question.", 422, "refused");
    const raw = parts.filter(part => part.type === "output_text").map(part => part.text).join("");
    let turn;
    try { turn = JSON.parse(raw); } catch { throw new TutorError("Carlos returned an incomplete response. Please try again.", 502); }
    return json(validateTutorTurn(turn, messages.at(-1).content));
  } catch (error) { return apiError(error); }
}

export function onRequestGet() {
  return json({ error: "Use POST to talk with Carlos." }, 405, { Allow: "POST" });
}

export function validateTutorInput(payload) {
  if (!Array.isArray(payload?.messages) || !payload.messages.length || payload.messages.length > 20) throw new TutorError("Send between 1 and 20 recent messages.");
  const messages = payload.messages.map(item => {
    if (!item || !["user", "assistant"].includes(item.role) || typeof item.content !== "string" || !item.content.trim()) throw new TutorError("Invalid conversation message.");
    if (item.content.length > (item.role === "user" ? 1500 : 4000)) throw new TutorError("Please send a shorter message (up to 1,500 characters).", 413, "too_large");
    return { role: item.role, content: item.content.trim() };
  });
  if (messages.at(-1).role !== "user") throw new TutorError("The last message must be from the learner.");
  const source = payload.context || {};
  const profile = source.profile || {};
  const context = {
    mode: ["lesson", "conversation", "grammar", "review"].includes(source.mode) ? source.mode : "conversation",
    lessonId: shortText(source.lessonId, 100),
    profile: Object.fromEntries(["name", "city", "country", "nativeLanguage", "level", "goal", "dialect"].map(key => [key, shortText(profile[key], key === "goal" ? 250 : 80)])),
    // Do not accept arbitrary nested instructions or entire profile/state exports.
    storyMemories: safeRecords(source.storyMemories, ["key", "value"], 12),
    recentCorrections: safeRecords(source.recentCorrections, ["original", "corrected", "explanation"], 8),
    savedPhrases: safeRecords(source.savedPhrases, ["spanish", "english"], 8),
  };
  context.profile.level = /^(A1|A2|B1|B2|C1|C2)\b/.exec(context.profile.level)?.[1] || "A1";
  return { messages, context };
}

function safeRecords(value, keys, max) {
  return Array.isArray(value) ? value.slice(-max).filter(item => item && typeof item === "object").map(item => Object.fromEntries(keys.map(key => [key, shortText(item[key], 240)]))) : [];
}

export function validateTutorTurn(value, learnerText) {
  if (!value || !shortText(value.reply) || !shortText(value.translation)) throw new TutorError("Carlos returned an incomplete response. Please try again.", 502);
  const pairs = (items, max) => (Array.isArray(items) ? items : []).slice(0, max)
    .map(item => ({ spanish: shortText(item?.spanish, 240), english: shortText(item?.english, 300) }))
    .filter(item => item.spanish && item.english);
  const correction = value.correction;
  const original = shortText(correction?.original, 500);
  const validCorrection = original && learnerText.includes(original) && ["corrected", "translation", "explanation"].every(key => shortText(correction[key]));
  return {
    reply: shortText(value.reply, 800), translation: shortText(value.translation, 1000),
    correction: validCorrection ? Object.fromEntries(["original", "corrected", "translation", "explanation"].map(key => [key, shortText(correction[key], 500)])) : null,
    suggestions: pairs(value.suggestions, 2), vocabulary: pairs(value.vocabulary, 3),
  };
}
