import { getCurrentLesson } from "../core/content.js";
import { CARLOS_FALLBACK_ONERROR, getCarlosAsset } from "../data/carlosAssets.js";

export function renderCarlos(state) {
  const lesson = getCurrentLesson();
  const suggestedPrompts = getSuggestedPrompts(lesson);
  const heroAsset = getCarlosHeroAsset();

  return `
    <section class="carlos-screen" aria-label="Carlos Spanish tutor">
      <div class="carlos-page-column">
        <section class="carlos-chat-hero" id="stage">
          <img class="carlos-hero-scene" src="${heroAsset}" alt="Carlos, your Spanish tutor, ready for a conversation" loading="eager" onerror="${CARLOS_FALLBACK_ONERROR}">
          ${renderCarlosSvg()}
          <header class="carlos-chat-header">
            <div class="carlos-top-row">
              <button type="button" class="carlos-back" data-page="home" aria-label="Back to home"></button>
              <div class="carlos-title-lockup">
                <h1>Carlos</h1>
                <span><i></i><b id="status-label">AI Tutor</b></span>
              </div>
              <button class="carlos-level-pill" type="button">${escapeHtml(state.user.level || "A1 Beginner")} <span aria-hidden="true">&#8964;</span></button>
            </div>
          </header>
          <button class="carlos-hero-more" type="button" data-carlos-prompt="${escapeAttr(suggestedPrompts[0] || "Give me a useful Spanish phrase.")}" aria-label="Conversation suggestions"><span></span><span></span><span></span></button>
        </section>

        <section class="carlos-conversation-thread" aria-label="Conversation with Carlos">
          <div id="messages" aria-live="polite" aria-relevant="additions"></div>
        </section>

        <section class="carlos-chat-action" id="input-area" aria-label="Chat with Carlos">
          <div id="input-row">
            <button class="carlos-more-btn" type="button" data-carlos-prompt="${escapeAttr(suggestedPrompts[0] || "Give me a useful Spanish phrase.")}" aria-label="More options"></button>
            <input type="text" id="txt" placeholder="Ask Carlos anything in Spanish..." autocomplete="off" enterkeyhint="send" aria-label="Message Carlos">
            <button class="ibtn" id="mic-btn" type="button" aria-label="Start listening">${renderCarlosControlIcon("mic")}</button>
            <button class="ibtn" id="snd-btn" type="button" aria-label="Send message">${renderCarlosControlIcon("composerAction")}</button>
          </div>
          <div class="carlos-chat-meta" hidden>
            <button id="stop-btn" type="button">Stop Carlos</button>
            <div class="auto-row" id="auto-toggle" role="button" tabindex="0">
              <span>Carlos speaks</span>
              <div class="tog" id="tog-track" style="background:var(--green)">
                <div class="tog-k" id="tog-k" style="left:14px"></div>
              </div>
            </div>
          </div>
          <div id="mic-err"></div>
          <div id="hint">Speak English or Spanish - Carlos understands both</div>
        </section>
      </div>
    </section>
  `;
}

function getCarlosHeroAsset() {
  const hour = new Date().getHours();
  if (hour < 12) return getCarlosAsset("morning");
  if (hour < 18) return getCarlosAsset("afternoon");
  return getCarlosAsset("evening");
}

function renderCarlosControlIcon(name) {
  const paths = {
    mic: `<rect x="8.25" y="3.5" width="7.5" height="11.5" rx="3.75"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M8.75 21h6.5"/>`,
    send: `<path d="M5 12h13M13 6l6 6-6 6"/>`,
    keyboard: `<rect x="3.5" y="5.5" width="17" height="13" rx="2.5"/><path d="M7 9h.01M10.3 9h.01M13.7 9h.01M17 9h.01M7 12.2h.01M10.3 12.2h.01M13.7 12.2h.01M17 12.2h.01M7.5 15.2h9"/>`
  };
  if (name === "composerAction") {
    return `<svg class="composer-keyboard-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths.keyboard}</svg><svg class="composer-send-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths.send}</svg>`;
  }
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[name] || ""}</svg>`;
}

function renderCarlosSvg() {
  return `
    <svg id="carlos-svg" class="carlos-svg-compat" viewBox="0 0 150 180" width="210" height="252" style="transition:transform .05s" role="img" aria-label="Carlos">
      <rect x="57" y="140" width="36" height="22" rx="6" fill="#c8956c"/>
      <path d="M 35 162 Q 75 175 115 162 L 120 180 L 30 180 Z" fill="#1a3a6a"/>
      <path d="M 65 162 L 75 175 L 85 162 L 75 158 Z" fill="white"/>
      <ellipse cx="75" cy="82" rx="52" ry="58" fill="#c8956c"/>
      <ellipse cx="75" cy="30" rx="52" ry="22" fill="#2c1810"/>
      <path d="M 23 48 Q 20 35 25 25 Q 40 10 75 8 Q 110 10 125 25 Q 130 35 127 48" fill="#2c1810"/>
      <ellipse cx="23" cy="82" rx="10" ry="13" fill="#c8956c"/>
      <ellipse cx="127" cy="82" rx="10" ry="13" fill="#c8956c"/>
      <ellipse cx="23" cy="82" rx="6" ry="9" fill="#b07850" opacity=".5"/>
      <ellipse cx="127" cy="82" rx="6" ry="9" fill="#b07850" opacity=".5"/>
      <path id="brow-l" d="M 44 46 Q 56 40 65 44" stroke="#2c1810" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <path id="brow-r" d="M 85 44 Q 94 40 106 46" stroke="#2c1810" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="55" cy="52" rx="13" ry="7" fill="white"/>
      <ellipse cx="95" cy="52" rx="13" ry="7" fill="white"/>
      <ellipse id="iris-l" cx="55" cy="52" rx="8" ry="8" fill="#4a2c0a"/>
      <ellipse id="iris-r" cx="95" cy="52" rx="8" ry="8" fill="#4a2c0a"/>
      <ellipse id="pupil-l" cx="56" cy="50" rx="4" ry="4" fill="#1a0a00"/>
      <ellipse id="pupil-r" cx="96" cy="50" rx="4" ry="4" fill="#1a0a00"/>
      <circle id="shine-l" cx="58" cy="48" r="2" fill="white" opacity=".8"/>
      <circle id="shine-r" cx="98" cy="48" r="2" fill="white" opacity=".8"/>
      <ellipse cx="75" cy="74" rx="8" ry="5" fill="#b07850" opacity=".4"/>
      <circle cx="70" cy="76" r="2.5" fill="#9a6840" opacity=".5"/>
      <circle cx="80" cy="76" r="2.5" fill="#9a6840" opacity=".5"/>
      <path id="mouth" d="M 55 88 Q 75 93 95 88" stroke="#7a3a20" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <path d="M 46 80 Q 42 88 46 94" stroke="#b07850" stroke-width="1.5" fill="none" opacity=".4"/>
      <path d="M 104 80 Q 108 88 104 94" stroke="#b07850" stroke-width="1.5" fill="none" opacity=".4"/>
      <ellipse id="glow" cx="75" cy="82" rx="54" ry="60" fill="none" stroke="#27ae60" stroke-width="3" opacity="0"/>
      <g id="sound-bars" opacity="0">
        <rect x="108" y="37" width="5" height="8" rx="2" fill="#c0392b"/>
        <rect x="116" y="32" width="5" height="18" rx="2" fill="#c0392b"/>
        <rect x="124" y="28" width="5" height="26" rx="2" fill="#c0392b"/>
      </g>
      <g id="think-bubbles" opacity="0">
        <circle cx="108" cy="40" r="4" fill="#8e44ad"/>
        <circle cx="119" cy="28" r="6" fill="#8e44ad"/>
        <circle cx="132" cy="14" r="9" fill="#8e44ad"/>
        <text x="132" y="18" fill="white" font-size="9" text-anchor="middle">?</text>
      </g>
    </svg>
  `;
}

function renderPracticeTiles() {
  const tiles = [
    ["Greetings", "8 conversations", "greetings", "Hola"],
    ["Family", "10 conversations", "family", "Practice family words with me."],
    ["Restaurants", "12 conversations", "restaurants", "Practice ordering food in Spanish."],
    ["Travel", "14 conversations", "travel", "Practice a travel conversation."],
    ["Shopping", "9 conversations", "shopping", "Practice shopping in Spanish."],
    ["Work", "8 conversations", "work", "Practice a work introduction."],
    ["Small Talk", "11 conversations", "smalltalk", "Start a simple small talk conversation."],
    ["Free Chat", "Unlimited", "freechat", "Let's have a free Spanish chat."]
  ];

  return tiles.map(([title, detail, icon, prompt]) => `
    <button class="carlos-category-tile" type="button" data-carlos-prompt="${escapeAttr(prompt)}">
      <span class="carlos-category-icon ${icon}" aria-hidden="true"></span>
      <strong>${title}</strong>
      <small>${detail}</small>
    </button>
  `).join("");
}

function renderMetric(icon, label, value) {
  return `
    <article>
      <span class="carlos-progress-icon ${icon}" aria-hidden="true"></span>
      <p>${label}</p>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function getCarlosStats(state) {
  const progress = readJson("habla_progress_v1") || {};
  const activity = readJson("habla_activity_stats_v1") || {};
  const learned = Array.isArray(state.vocabulary?.learned) ? state.vocabulary.learned.length : 0;

  return {
    streak: Number(progress.streak || state.user?.streak || 0),
    conversations: Number(activity.carlosConversationsCount || 0),
    speakingMinutes: Number(activity.speakingMinutes || 0),
    words: Number(activity.vocabularyReviewedCount || learned || 0),
    pronunciationScore: Number(activity.pronunciationScore || 0)
  };
}

function getConversationTitle(lesson) {
  if (!lesson?.title) return "Ordering coffee";
  return lesson.title.replace(/^[^:]+:\s*/, "");
}

function getConversationPhrase(lesson) {
  const challenge = lesson?.speakingChallenge?.[0] || lesson?.speakingChallenges?.[0];
  if (typeof challenge === "string") return challenge;
  if (challenge?.prompt) return challenge.prompt;
  if (lesson?.realLifeMission?.mission) return lesson.realLifeMission.mission;
  return "Un cafe, por favor.";
}

function formatMinutes(minutes) {
  const total = Number(minutes || 0);
  if (total < 60) return `${total}m`;
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return mins ? `${hours}h ${mins}m` : `${hours}h`;
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch (error) {
    return null;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

function getSuggestedPrompts(lesson) {
  if (!lesson) {
    return [
      "Help me introduce myself in Spanish.",
      "Ask me a beginner greeting question.",
      "Practice a short conversation with me.",
    ];
  }

  const speakingPrompts = Array.isArray(lesson.speakingChallenge)
    ? lesson.speakingChallenge.map(challenge => challenge.prompt || challenge.exampleAnswer).filter(Boolean)
    : [];

  const dialoguePrompts = Array.isArray(lesson.dialogue)
    ? lesson.dialogue.map(dialogue => `Practice this scene: ${dialogue.title}`).filter(Boolean)
    : [];

  return [...speakingPrompts, ...dialoguePrompts].slice(0, 3);
}
