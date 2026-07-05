export function renderMissionCard(state) {
  return `
    <section class="mission-card">
      <div class="mission-icon">🗓️</div>
      <div>
        <span class="eyebrow">Today’s Mission</span>
        <h2>Talking with Family</h2>
        <p>Practice introducing your wife and talking about your family and relatives.</p>

        <div class="mission-meta">
          <div>🕒 <strong>${state.user.dailyTargetMinutes} min</strong><small>Estimated Time</small></div>
          <div>📶 <strong>${state.user.level}</strong><small>Your Level</small></div>
        </div>

        <button class="primary-action" data-page="carlos">
          ▶ Start Today’s Lesson
        </button>
      </div>
    </section>
  `;
}
