import { resolveCharacterVoice } from "./functions/_shared/characterVoices.js";

const MAX_TEXT_LENGTH = 800;
const OUTPUT_FORMAT = "mp3_44100_128";
const QUALITY_MODEL = "eleven_multilingual_v2";
const FAST_MODEL = "eleven_flash_v2_5";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/tts") {
      if (request.method === "GET") {
        return new Response(
          JSON.stringify({ error: "Use POST to generate speech." }),
          {
            status: 405,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              Allow: "POST",
            },
          }
        );
      }

      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }

      return handleTTS(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleTTS(request, env) {
  if (!env.ELEVENLABS_API_KEY) {
    return jsonError("Voice service is not configured.", 503);
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return jsonError("A valid JSON body is required.", 400);
  }

  const text = String(payload?.text || "")
    .replace(/\*\*?([^*]+)\*\*?/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) {
    return jsonError("Speech text is required.", 400);
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return jsonError(
      `Speech text must be ${MAX_TEXT_LENGTH} characters or fewer.`,
      413
    );
  }

  const { character, voiceId } = resolveCharacterVoice(payload?.speaker);

  const modelId =
    payload?.mode === "fast" ? FAST_MODEL : QUALITY_MODEL;

  const elevenLabsResponse = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(
      voiceId
    )}?output_format=${OUTPUT_FORMAT}`,
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
    }
  );

  if (!elevenLabsResponse.ok) {
    const detail = await elevenLabsResponse.text();
    console.error(
      "ElevenLabs TTS request failed",
      elevenLabsResponse.status,
      detail.slice(0, 500)
    );

    return jsonError(
      "Voice generation is temporarily unavailable.",
      502
    );
  }

  return new Response(elevenLabsResponse.body, {
    status: 200,
    headers: {
      "Content-Type":
        elevenLabsResponse.headers.get("Content-Type") || "audio/mpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Habla-Character": character,
    },
  });
}

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}