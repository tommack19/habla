import { apiError, guard, json, openAIRequest, readBoundedBody, shortText, TutorError } from "../_shared/tutorApi.js";

const AUDIO_TYPES = { "audio/webm": "webm", "audio/mp4": "m4a", "audio/mpeg": "mp3", "audio/wav": "wav", "audio/ogg": "ogg" };

export async function onRequestPost({ request, env }) {
  try {
    await guard(request, env);
    const type = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
    if (!AUDIO_TYPES[type]) throw new TutorError("This audio format is not supported. You can still type your message.", 415);
    const audio = await readBoundedBody(request, 6 * 1024 * 1024);
    if (audio.size < 100) throw new TutorError("No recording was captured. Please try again.");
    const form = new FormData();
    form.set("file", new Blob([audio], { type }), `habla-recording.${AUDIO_TYPES[type]}`);
    form.set("model", env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe");
    form.set("response_format", "json");
    form.set("prompt", "A learner talking with Carlos in Spanish, English, or a mix of both. Transcribe the words as spoken; do not translate or correct them.");
    const result = await openAIRequest("audio/transcriptions", env, { method: "POST", body: form });
    const text = shortText(result.text, 1501);
    if (!text) throw new TutorError("No speech was recognized. Please try again or type your message.", 422, "no_speech");
    if (text.length > 1500) throw new TutorError("Please record a shorter message.", 413, "too_large");
    return json({ text });
  } catch (error) { return apiError(error); }
}

export function onRequestGet() {
  return json({ error: "Use POST to transcribe a recording." }, 405, { Allow: "POST" });
}
