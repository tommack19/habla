import { LESSON_ARTWORK_ONERROR, preloadLessonArtwork } from "../data/lessonAssets.js";

export function renderLessonCover({
  variant,
  lesson,
  artworkAlt,
  eyebrow = "",
  overline = "",
  title,
  context = "",
  description = "",
  meta = [],
  action = null,
  footerHtml = "",
  className = "",
}) {
  const artwork = preloadLessonArtwork(lesson);
  const classes = [
    "lesson-cover",
    `lesson-cover--${variant}`,
    artwork ? "has-artwork" : "is-artwork-missing",
    className,
  ].filter(Boolean).join(" ");

  return `
    <article class="${classes}">
      ${artwork ? `<img class="lesson-cover__artwork" src="${escapeAttr(artwork)}" alt="${escapeAttr(artworkAlt || `${title} lesson artwork`)}" loading="eager" fetchpriority="high" decoding="async" onerror="${LESSON_ARTWORK_ONERROR}">` : ""}
      <div class="lesson-cover__copy">
        ${eyebrow ? `<span class="lesson-cover__eyebrow">${escapeHtml(eyebrow)}</span>` : ""}
        ${overline ? `<span class="lesson-cover__overline">${escapeHtml(overline)}</span>` : ""}
        <h2>${escapeHtml(title)}</h2>
        ${context ? `<em class="lesson-cover__context">${escapeHtml(context)}</em>` : ""}
        ${description ? `<p>${escapeHtml(description)}</p>` : ""}
        <div class="lesson-cover__actions">
          ${meta.length ? `<div class="lesson-cover__meta">${meta.map(renderMetaItem).join("")}</div>` : ""}
          ${action ? renderAction(action) : ""}
        </div>
      </div>
      ${footerHtml ? `<div class="lesson-cover__footer">${footerHtml}</div>` : ""}
    </article>
  `;
}

function renderMetaItem(item) {
  return `<span>${item.icon || ""}<b>${escapeHtml(item.text)}</b>${item.subtext ? `<small>${escapeHtml(item.subtext)}</small>` : ""}</span>`;
}

function renderAction(action) {
  return `
    <button class="lesson-cover__cta h-btn h-btn--primary ${escapeAttr(action.className || "")}" type="button" ${action.attributes || ""}>
      <span>${escapeHtml(action.label)}${action.subLabel ? `<small>${escapeHtml(action.subLabel)}</small>` : ""}</span>
      ${action.icon || `<i class="lesson-cover__arrow" aria-hidden="true"></i>`}
    </button>
  `;
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}
