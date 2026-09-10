// These in-isolate limits are a backstop, not a distributed quota. See AI_TUTOR_SETUP.md.
const buckets = new Map();
export class TutorError extends Error {
  constructor(message, status = 400, code = "invalid_request") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

export function apiError(error) {
  const status = error instanceof TutorError ? error.status : 502;
  return json({
    error: error instanceof TutorError ? error.message : "Carlos could not connect. Please try again.",
    code: error instanceof TutorError ? error.code : "service_unavailable",
  }, status, status === 429 ? { "Retry-After": "60" } : {});
}

export async function guard(request, env) {
  const origin = request.headers.get("Origin");
  if ((origin && origin !== new URL(request.url).origin && origin !== env.HABLA_APP_ORIGIN)
    || request.headers.get("Sec-Fetch-Site") === "cross-site") {
    throw new TutorError("Cross-origin tutor requests are not allowed.", 403, "forbidden");
  }
  if (!env.OPENAI_API_KEY) {
    throw new TutorError("Carlos is not connected yet. The app owner needs to finish tutor setup.", 503, "not_configured");
  }
  const key = request.headers.get("CF-Connecting-IP") || "local";
  if (env.HABLA_AI_RATE_LIMITER?.limit) {
    const result = await env.HABLA_AI_RATE_LIMITER.limit({ key });
    if (!result.success) throw new TutorError("Please wait a minute before trying again.", 429, "rate_limited");
  }
  const now = Date.now();
  for (const [ip, bucket] of buckets) if (bucket.until <= now) buckets.delete(ip);
  if (!buckets.has(key) && buckets.size >= 10000) {
    throw new TutorError("Carlos is busy. Please try again shortly.", 429, "rate_limited");
  }
  const bucket = buckets.get(key) || { count: 0, until: now + 60000 };
  if (++bucket.count > 30) throw new TutorError("Please wait a minute before trying again.", 429, "rate_limited");
  buckets.set(key, bucket);
}

export async function readBoundedBody(request, maxBytes) {
  if (Number(request.headers.get("Content-Length")) > maxBytes) {
    throw new TutorError("This message is too large.", 413, "too_large");
  }
  if (!request.body) throw new TutorError("A request body is required.");
  const reader = request.body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new TutorError("This message is too large.", 413, "too_large");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return new Blob(chunks);
}

export function shortText(value, length = 200) {
  return typeof value === "string" ? value.trim().slice(0, length) : "";
}

export async function openAIRequest(path, env, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(`https://api.openai.com/v1/${path}`, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      signal: controller.signal,
    });
    if (!response.ok) {
      if (response.status === 429) throw new TutorError("Carlos has reached a service limit. Please try again later.", 429, "provider_limit");
      if ([401, 403, 404].includes(response.status)) throw new TutorError("Carlos needs an app owner to check the tutor configuration.", 503, "configuration_error");
      throw new TutorError("Carlos is temporarily unavailable. Please try again.", 502, "service_unavailable");
    }
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") throw new TutorError("Carlos took too long to respond. Please try again.", 504, "timeout");
    throw error;
  } finally { clearTimeout(timeout); }
}
