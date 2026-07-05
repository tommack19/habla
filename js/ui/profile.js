export function renderProfile(state) {
  return `<section class="screen-card"><h1>👤 Me</h1><p>${state.user.name} · ${state.user.level} · ${state.user.streak} day streak</p></section>`;
}