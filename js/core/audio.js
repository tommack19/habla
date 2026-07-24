import { personalizeText } from "./personalization.js";

const TTS_ENDPOINT = "/api/tts";
const REMOTE_RETRY_DELAY = 60_000;

let activeAudio = null;
let activeObjectUrl = "";
let activeUtterance = null;
let remoteUnavailableUntil = 0;
let playbackToken = 0;

export async function playSpeech(text, options = {}) {
  const cleanText = cleanSpeechText(personalizeText(text));
  if (!cleanText) return false;

  const token = ++playbackToken;
  stopActivePlayback(true);

  try {
    if (Date.now() >= remoteUnavailableUntil) {
      const played = await playRemoteSpeech(cleanText, options, token);
      if (played) return true;
    }
  } catch (error) {
    console.warn("ElevenLabs playback unavailable; using browser voice.", error);
    remoteUnavailableUntil = Date.now() + REMOTE_RETRY_DELAY;
  }

  return playBrowserSpeech(cleanText, options, token);
}

export async function playSpeechSequence(lines, options = {}) {
  const token = ++playbackToken;
  stopActivePlayback(true);

  const sequence = lines || [];
  for (let index = 0; index < sequence.length; index += 1) {
    const line = sequence[index];
    if (token !== playbackToken) return false;
    const completed = await playSpeechWithoutReset(
      cleanSpeechText(personalizeText(line?.text || "")),
      {
        ...options,
        speaker: line?.speaker || options.speaker || "Carlos",
        onStart: undefined,
        onEnd: undefined,
      },
      token,
    );
    if (!completed || token !== playbackToken) return false;
    const nextLine = sequence[index + 1];
    if (nextLine) {
      await wait(normalizeSpeaker(line?.speaker) === normalizeSpeaker(nextLine?.speaker) ? 240 : 420);
    }
  }

  if (token === playbackToken) options.onEnd?.();
  return true;
}

export function stopSpeech() {
  playbackToken += 1;
  stopActivePlayback(true);
}

export function isSpeechPlaying() {
  return Boolean(activeAudio || activeUtterance || globalThis.speechSynthesis?.speaking);
}

async function playSpeechWithoutReset(text, options, token) {
  if (!text) return true;
  try {
    if (Date.now() >= remoteUnavailableUntil) {
      const played = await playRemoteSpeech(text, options, token);
      if (played) return true;
    }
  } catch (error) {
    console.warn("ElevenLabs sequence playback unavailable; using browser voice.", error);
    remoteUnavailableUntil = Date.now() + REMOTE_RETRY_DELAY;
  }
  return playBrowserSpeech(text, options, token);
}

async function playRemoteSpeech(text, options, token) {
  const response = await fetch(TTS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      speaker: options.speaker || "Carlos",
      mode: options.mode || "quality",
    }),
  });

  if (!response.ok) {
    if (response.status === 404 || response.status === 405 || response.status === 503) {
      remoteUnavailableUntil = Date.now() + REMOTE_RETRY_DELAY;
    }
    throw new Error(`TTS request failed with ${response.status}`);
  }

  const blob = await response.blob();
  if (token !== playbackToken) return false;

  releaseObjectUrl();
  activeObjectUrl = URL.createObjectURL(blob);
  const audio = new Audio(activeObjectUrl);
  activeAudio = audio;
  audio.preload = "auto";
  audio.playbackRate = clampPlaybackRate(options.rate);
  audio.preservesPitch = true;

  return new Promise(resolve => {
    let settled = false;
    const finish = success => {
      if (settled) return;
      settled = true;
      if (activeAudio === audio) activeAudio = null;
      releaseObjectUrl();
      if (token === playbackToken) {
        if (success) options.onEnd?.();
      }
      resolve(success);
    };

    audio.addEventListener("ended", () => finish(true), { once: true });
    audio.addEventListener("error", () => finish(false), { once: true });
    options.onStart?.();
    audio.play().catch(() => finish(false));
  });
}

function playBrowserSpeech(text, options, token) {
  if (!globalThis.speechSynthesis || !globalThis.SpeechSynthesisUtterance) {
    options.onError?.();
    return Promise.resolve(false);
  }

  const utterance = new SpeechSynthesisUtterance(text.replaceAll("/", ""));
  const profile = getBrowserVoiceProfile(options.speaker);
  const voices = speechSynthesis.getVoices();
  const spanishVoices = voices.filter(voice => /^es(?:-|_)/i.test(voice.lang || ""));
  const spainVoices = spanishVoices.filter(voice => /^es(?:-|_)ES/i.test(voice.lang || ""));
  const pool = spainVoices.length ? spainVoices : spanishVoices;
  const hinted = pool.find(voice => profile.hints.some(hint => normalizeSpeaker(voice.name).includes(hint)));
  utterance.voice = hinted || pool[profile.voiceIndex % Math.max(pool.length, 1)] || null;
  utterance.lang = utterance.voice?.lang || "es-ES";
  utterance.rate = clampPlaybackRate(options.rate) * profile.rate;
  utterance.pitch = profile.pitch;
  activeUtterance = utterance;

  return new Promise(resolve => {
    let settled = false;
    const finish = success => {
      if (settled) return;
      settled = true;
      if (activeUtterance === utterance) activeUtterance = null;
      if (token === playbackToken) {
        if (success) options.onEnd?.();
        else options.onError?.();
      }
      resolve(success);
    };
    utterance.onend = () => finish(true);
    utterance.onerror = () => finish(false);
    options.onStart?.();
    speechSynthesis.speak(utterance);
  });
}

function stopActivePlayback(cancelBrowserVoice) {
  if (activeAudio) {
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }
  releaseObjectUrl();
  if (cancelBrowserVoice) globalThis.speechSynthesis?.cancel?.();
  activeUtterance = null;
}

function releaseObjectUrl() {
  if (!activeObjectUrl) return;
  URL.revokeObjectURL(activeObjectUrl);
  activeObjectUrl = "";
}

function cleanSpeechText(value) {
  return String(value || "")
    .replace(/\*\*?([^*]+)\*\*?/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function clampPlaybackRate(rate) {
  const numeric = Number(rate);
  return Number.isFinite(numeric) ? Math.min(1.1, Math.max(0.72, numeric)) : 0.96;
}

function normalizeSpeaker(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getBrowserVoiceProfile(speaker) {
  const name = normalizeSpeaker(speaker);
  if (name.includes("elena")) return { hints: ["elvira", "monica", "helena"], voiceIndex: 2, rate: 0.92, pitch: 0.82 };
  if (["ana", "marta", "lucia"].some(character => name.includes(character))) {
    return { hints: ["helena", "monica", "laura", "paulina", "marisol"], voiceIndex: 1, rate: 1, pitch: 1.1 };
  }
  if (name.includes("diego") || name.includes("nico")) return { hints: ["diego", "pablo"], voiceIndex: 3, rate: 1.02, pitch: 1.18 };
  if (name.includes("javier") || name.includes("vendor") || name.includes("server")) {
    return { hints: ["jorge", "alvaro", "enrique"], voiceIndex: 0, rate: 0.98, pitch: 0.92 };
  }
  if (name.includes("model") || name.includes("learner")) {
    return { hints: ["helena", "monica", "laura"], voiceIndex: 1, rate: 1, pitch: 1.02 };
  }
  return { hints: ["jorge", "alvaro", "diego", "pablo"], voiceIndex: 0, rate: 0.98, pitch: 0.92 };
}

function wait(duration) {
  return new Promise(resolve => window.setTimeout(resolve, duration));
}
