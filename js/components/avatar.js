export function getUserAvatarSource(user = {}) {
  const value = user.profilePhoto || user.profilePhotoUrl || user.photoUrl || user.avatarUrl || user.avatar?.src || user.avatar;
  return typeof value === "string" && /^(?:data:image\/|blob:|https?:\/\/|\.?\.?\/|assets\/)/i.test(value) ? value : "";
}

export function getUserInitial(user = {}) {
  return String(user.name || "").trim().charAt(0).toUpperCase();
}

export function renderUserAvatar(user = {}, { className = "user-avatar", label = "profile" } = {}) {
  const source = getUserAvatarSource(user);
  const initial = getUserInitial(user);
  const accessibleName = `${user.name || "Learner"} ${label}`.trim();
  const fallback = initial ? escapeHtml(initial) : genericUserIcon();
  return `<span class="${escapeAttr(className)}" role="img" aria-label="${escapeAttr(accessibleName)}">${source ? `<img src="${escapeAttr(source)}" alt="" loading="lazy" decoding="async" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="user-avatar-fallback" hidden aria-hidden="true">${fallback}</span>` : `<span class="user-avatar-fallback${initial ? "" : " is-generic"}" aria-hidden="true">${fallback}</span>`}</span>`;
}

function genericUserIcon() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c.7-5 3.3-7 8-7s7.3 2 8 7"/></svg>`;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
