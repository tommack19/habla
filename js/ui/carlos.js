import { getCurrentLesson } from "../core/content.js";

export function renderCarlos(state) {
  const greeting = getCarlosGreeting(state.user.name);
  const lesson = getCurrentLesson();
  const suggestedPrompts = getSuggestedPrompts(lesson);
  const lessonIntro = lesson
    ? `Today we're practicing ${lesson.title}. ${lesson.realLifeMission?.mission || lesson.objectives?.[0] || "Let's use this lesson in a real conversation."}`
    : "Practice out loud, ask questions, or type when you want a quieter session.";

  return `
    <section class="carlos-screen" aria-label="Carlos Spanish tutor">
      <div class="carlos-avatar-panel" id="stage">
        <div class="carlos-orbit" aria-hidden="true"></div>
        <svg id="carlos-svg" viewBox="0 0 150 180" width="210" height="252" style="transition:transform .05s" role="img" aria-label="Carlos">
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

        <div class="carlos-greeting-card">
          <span class="carlos-greeting-kicker">${lesson ? "Current lesson" : "Spanish tutor"}</span>
          <h1>${greeting}</h1>
          ${lesson ? `<h2 style="color:var(--text);font-size:.95rem;line-height:1.3;margin-top:8px;">${escapeHtml(lesson.title)}</h2>` : ""}
          <p>${escapeHtml(lessonIntro)}</p>
          ${lesson?.realLifeMission ? `
            <div style="border-left:2px solid rgba(39,174,96,.65);margin-top:10px;padding-left:10px;">
              <span style="display:block;color:var(--green);font-size:.62rem;font-weight:800;letter-spacing:.7px;text-transform:uppercase;">Real Life Mission</span>
              <p style="margin-top:4px;">${escapeHtml(lesson.realLifeMission.mission)}</p>
            </div>
          ` : ""}
          ${suggestedPrompts.length ? `
            <div class="carlos-suggested-prompts" aria-label="Suggested prompts" style="display:grid;gap:7px;margin-top:12px;">
              ${suggestedPrompts.map(prompt => `
                <button type="button" data-carlos-prompt="${escapeAttr(prompt)}" style="border:1px solid rgba(232,184,109,.28);border-radius:10px;background:rgba(232,184,109,.08);color:var(--gold);font:inherit;font-size:.76rem;line-height:1.35;padding:8px 10px;text-align:left;cursor:pointer;">${escapeHtml(prompt)}</button>
              `).join("")}
            </div>
          ` : ""}
        </div>

        <div class="carlos-status-row">
          <div class="carlos-status-pill" aria-live="polite">
            <span class="carlos-status-dot"></span>
            <span id="status-label">Carlos</span>
          </div>

          <div class="auto-row" id="auto-toggle" role="button" tabindex="0">
            <span>Carlos speaks</span>
            <div class="tog" id="tog-track" style="background:var(--green)">
              <div class="tog-k" id="tog-k" style="left:14px"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="carlos-conversation-shell">
        <div id="messages" aria-live="polite"></div>
      </div>

      <div class="carlos-input-shell" id="input-area">
        <div id="input-row">
          <button class="ibtn" id="mic-btn" type="button" aria-label="Start listening">🎤</button>
          <input type="text" id="txt" placeholder="Type or tap 🎤 to speak" autocomplete="off">
          <button class="ibtn" id="snd-btn" type="button" aria-label="Send message">➤</button>
        </div>
        <button id="stop-btn" type="button">Stop Carlos</button>
        <div id="mic-err"></div>
        <div id="hint">Speak English or Spanish - Carlos understands both</div>
      </div>
    </section>
  `;
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

function getCarlosGreeting(name) {
  const hour = new Date().getHours();

  if (hour < 12) {
    return `Buenos días, ${name} ☀️`;
  }

  if (hour < 18) {
    return `Buenas tardes, ${name} 🌤️`;
  }

  return `Buenas noches, ${name} 🌙`;
}
