import { resolveCharacterVoice } from "../_shared/characterVoices.js";

const MAX_TEXT_LENGTH = 800;
const OUTPUT_FORMAT = "mp3_44100_128";
const QUALITY_MODEL = "eleven_multilingual_v2";
const FAST_MODEL = "eleven_flash_v2_5";

export async function onRequestPost(context) {
  const { request, env } = context;
  const sameOriginError = validateSameOrigin(request, env);
  if (sameOriginError) return sameOriginError;
  if (!env.ELEVENLABS_API_KEY) return jsonError("Voice service is not configured.", 503);

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonError("A valid JSON body is required.", 400);
  }

  const text = cleanSpeechText(payload?.text);
  if (!text) return jsonError("Speech text is required.", 400);
  if (text.length > MAX_TEXT_LENGTH) {
    return jsonError(`Speech text must be ${MAX_TEXT_LENGTH} characters or fewer.`, 413);
  }

  const { character, voiceId } = resolveCharacterVoice(payload?.speaker);
  const modelId = payload?.mode === "fast" ? FAST_MODEL : QUALITY_MODEL;
  const cacheKey = await createCacheKey(request.url, { text, character, modelId });
  const cache = globalThis.caches?.default;
  const cached = cache ? await cache.match(cacheKey) : null;
  if (cached) return withVoiceHeaders(cached, character, "HIT");

  const elevenLabsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${OUTPUT_FORMAT}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": env.ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        apply_text_normalization: "auto",
      }),
    },
  );

  if (!elevenLabsResponse.ok) {
    const detail = await safeErrorMessage(elevenLabsResponse);
    console.error("ElevenLabs TTS request failed", elevenLabsResponse.status, detail);
    return jsonError("Voice generation is temporarily unavailable.", 502);
  }

  const response = new Response(elevenLabsResponse.body, {
    status: 200,
    headers: {
      "Content-Type": elevenLabsResponse.headers.get("Content-Type") || "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });

  if (cache) context.waitUntil(cache.put(cacheKey, response.clone()));
  return withVoiceHeaders(response, character, "MISS");
}

export function onRequestGet() {
  return jsonError("Use POST to generate speech.", 405, { Allow: "POST" });
}

function validateSameOrigin(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return null;

  try {
    const requestOrigin = new URL(request.url).origin;
    const allowedOrigin = env.HABLA_APP_ORIGIN || requestOrigin;
    if (origin === requestOrigin || origin === allowedOrigin) return null;
  } catch {
    // Invalid origins are rejected below.
  }

  return jsonError("Cross-origin voice requests are not allowed.", 403);
}

function cleanSpeechText(value) {
  return String(value || "")
    .replace(/\*\*?([^*]+)\*\*?/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function createCacheKey(requestUrl, input) {
  const bytes = new TextEncoder().encode(JSON.stringify(input));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const hash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  const url = new URL(requestUrl);
  url.pathname = `/__habla_tts_cache/${hash}`;
  url.search = "";
  return new Request(url.toString(), { method: "GET" });
}

async function safeErrorMessage(response) {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "No error detail returned.";
  }
}

function withVoiceHeaders(response, character, cacheStatus) {
  const wrapped = new Response(response.body, response);
  wrapped.headers.set("X-Habla-Character", character);
  wrapped.headers.set("X-Habla-Cache", cacheStatus);
  return wrapped;
}

function jsonError(message, status, extraHeaders = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}
