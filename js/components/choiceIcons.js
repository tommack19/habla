const CHOICE_ICON_PATHS = Object.freeze({
  apple: `<path d="M12 8c-4.2-2.7-8.1.5-7.4 5.1.6 4.2 3.1 8 5.6 8 1 0 1.3-.6 1.8-.6s.8.6 1.8.6c2.5 0 5-3.8 5.6-8C20.1 8.5 16.2 5.3 12 8Z"/><path d="M12 8c-.1-2.4 1.1-4.2 3.5-5M12.7 5.2c-2.2.1-3.8-.7-4.7-2.3 2.3-.5 4 .2 4.7 2.3Z"/>`,
  "bread-loaf": `<path d="M4 10.5C4 6.9 7.2 4 11 4h2c3.8 0 7 2.9 7 6.5V19H4v-8.5Z"/><path d="m9 7 2 3M13 6.5l2 3M6.5 8.5l2 3"/>`,
  cheese: `<path d="M4 10 15.5 4 20 9v10H4v-9Z"/><path d="M4 10h16M9 14h.01M15 16h.01M16 8h.01"/>`,
  "coffee-cup": `<path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 4c0 1 1 1 1 2M12 4c0 1 1 1 1 2"/>`,
  flowers: `<path d="M12 11v10M12 16c-3.5-3.3-6-2.5-7-1 2.8 0 5.1 1 7 3M12 15c3.5-3.3 6-2.5 7-1-2.8 0-5.1 1-7 3"/><circle cx="12" cy="7" r="2"/><path d="M12 5c-1.3-3-4.3-2.2-4.3.2C5 4.5 3.7 7.3 5.8 8.7c-1.8 2.2.5 4.5 2.6 2.8 1 2.7 4.2 2.7 5.2 0 2.1 1.7 4.4-.6 2.6-2.8 2.1-1.4.8-4.2-1.9-3.5C14.3 2.8 11.3 2 12 5Z"/>`,
  tomato: `<circle cx="12" cy="13" r="7.5"/><path d="M12 5.5c-.3-2 1.2-3.2 2.8-3.5M12 6l-3-2 1 3.2L7 8l3.7.8L12 12l1.3-3.2L17 8l-3-.8L15 4l-3 2Z"/>`,
  "tea-cup": `<path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M11 4v7M9.5 4h3M8 3c0 1.2 1.2 1.4 1.2 2.5"/>`,
  "orange-juice": `<path d="M7 7h10l-1 14H8L7 7Z"/><path d="M9 7c.2-2 1.5-3 3.5-3M13 3l3-1M10 13c1.1-1.7 3.9-1.7 5 0-1.1 1.7-3.9 1.7-5 0Z"/>`,
  "living-room": `<path d="M5 12V9a2.5 2.5 0 0 1 2.5-2.5h9A2.5 2.5 0 0 1 19 9v3"/><path d="M4 11a2 2 0 0 0-2 2v4h20v-4a2 2 0 0 0-2-2M5 17v2M19 17v2M12 7v5"/>`,
  kitchen: `<path d="M4 4v7a3 3 0 0 0 3 3h1V4M6 4v5M18 4v17M14 4v6a4 4 0 0 0 4 4"/>`,
  "study-corner": `<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11a3 3 0 0 1 3 3v15a3 3 0 0 0-3-3H4V5.5Z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H14v18a3 3 0 0 1 3-3h3V5.5Z"/>`,
  morning: `<circle cx="12" cy="12" r="4.25"/><path d="M12 2.25v2.1M12 19.65v2.1M4.82 4.82l1.49 1.49M17.69 17.69l1.49 1.49M2.25 12h2.1M19.65 12h2.1M4.82 19.18l1.49-1.49M17.69 6.31l1.49-1.49"/>`,
  afternoon: `<path d="M3 18.25h18M5.25 18.25a6.75 6.75 0 0 1 13.5 0"/><path d="M12 4.25v2.5M5.9 9.2l1.75 1.75M18.1 9.2l-1.75 1.75M3.5 13.75h2.4M18.1 13.75h2.4"/>`,
  evening: `<path d="M20.2 15.35A8.4 8.4 0 0 1 8.65 3.8a8.4 8.4 0 1 0 11.55 11.55Z"/><path d="m17.25 3.5.45 1.2 1.2.45-1.2.45-.45 1.2-.45-1.2-1.2-.45 1.2-.45.45-1.2ZM20.2 8.4l.27.72.73.28-.73.27-.27.73-.28-.73-.72-.27.72-.28.28-.72Z"/>`,
  wave: `<path d="M8.35 11.65V7.1a1.45 1.45 0 0 1 2.9 0v3.15M11.25 10.25V5.35a1.45 1.45 0 0 1 2.9 0v4.9M14.15 10.25V6.5a1.45 1.45 0 0 1 2.9 0v5.15M17.05 11.65V9a1.45 1.45 0 0 1 2.9 0v5c0 4.45-3.05 7.2-7.25 7.2-2.9 0-5.15-1.35-6.65-3.9l-2.3-3.85a1.55 1.55 0 0 1 2.4-1.9l2.2 2.1Z"/><path d="M4.7 5.1 2.8 3.65M20.1 4.9l1.35-1.75M5.25 8.25H2.8"/>`,
  handshake: `<path d="m3.1 10.15 3.4-3.4 3.35.85-4.5 4.65L9.6 16.5a1.8 1.8 0 0 0 2.55 0l5.95-5.95 2.8 2.8"/><path d="m8.7 12.15 2.75-2.75a2.25 2.25 0 0 1 3.2 0l1.3 1.3M14.6 13.95l1.35 1.35a1.45 1.45 0 0 1-2.05 2.05l-1.2-1.2M17.1 11.55l-2.65-2.65 3.05-2.15 3.4 3.4M3.1 10.15l2.55 2.55"/>`,
  smile: `<circle cx="12" cy="12" r="9"/><path d="M8.4 9.75h.01M15.6 9.75h.01M8.25 14.1c.95 1.35 2.2 2.05 3.75 2.05s2.8-.7 3.75-2.05"/>`,
  choice: `<rect x="4" y="4" width="16" height="16" rx="5"/><path d="m8.5 12 2.25 2.25 4.75-4.75"/>`,
});

const CHOICE_ICON_ALIASES = Object.freeze({
  apples: "apple",
  bread: "bread-loaf",
  coffee: "coffee-cup",
  juice: "orange-juice",
  sofa: "living-room",
  cup: "kitchen",
  book: "study-corner",
  sun: "morning",
  clock: "afternoon",
  moon: "evening",
  tomatoes: "tomato",
  tea: "tea-cup",
});

export const CHOICE_ICON_IDS = Object.freeze(Object.keys(CHOICE_ICON_PATHS).filter(id => id !== "choice"));

export function resolveChoiceIconId(value) {
  const requested = String(value || "").trim().toLowerCase();
  const resolved = CHOICE_ICON_ALIASES[requested] || requested;
  return CHOICE_ICON_PATHS[resolved] ? resolved : "choice";
}

export function hasChoiceIcon(value) {
  return resolveChoiceIconId(value) !== "choice" || String(value || "").trim().toLowerCase() === "choice";
}

export function renderChoiceIcon(value, className = "") {
  const iconId = resolveChoiceIconId(value);
  const cssClass = className ? ` class="${escapeClassName(className)}"` : "";
  return `<svg${cssClass} viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke" data-choice-icon="${iconId}">${CHOICE_ICON_PATHS[iconId]}</svg>`;
}

function escapeClassName(value) {
  return String(value || "").replace(/[^a-zA-Z0-9_-]/g, "");
}
