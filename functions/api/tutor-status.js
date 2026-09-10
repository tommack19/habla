import { json } from "../_shared/tutorApi.js";

export function onRequestGet({ env }) {
  return json({ configured: Boolean(env.OPENAI_API_KEY), voiceConfigured: Boolean(env.ELEVENLABS_API_KEY) });
}
