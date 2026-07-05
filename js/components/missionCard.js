export function renderMissionCard(state, mission, currentLesson = null) {
  const statusText = mission.completed ? "Completed" : "Active";
  const actionText = mission.completed ? "Mission Complete" : "Complete Mission";
  const lessonScenario = currentLesson?.realLifeMission?.mission || currentLesson?.objectives?.[0] || "";

  return `
    <section class="mission-card">
      <div class="mission-icon">🗓️</div>
      <div>
        <div class="mission-heading">
          <span class="eyebrow">Today’s Mission</span>
          <span class="mission-status ${mission.completed ? "completed" : "active"}">${statusText}</span>
        </div>
        <h2>${mission.title}</h2>
        <p>${mission.description}</p>
        ${currentLesson ? `
          <div class="mission-lesson">
            <span>Current Lesson</span>
            <strong>${currentLesson.title}</strong>
            ${lessonScenario ? `<small>${lessonScenario}</small>` : ""}
          </div>
        ` : ""}

        <div class="mission-meta">
          <div>⭐ <strong>${mission.xpReward} XP</strong><small>Reward</small></div>
          <div>📶 <strong>${state.user.level}</strong><small>Your Level</small></div>
        </div>

        <div class="mission-actions">
          <button class="primary-action" data-page="carlos">
            ▶ Start Practice
          </button>
          <button class="secondary-action" data-mission-complete="${mission.id}" ${mission.completed ? "disabled" : ""}>
            ${actionText}
          </button>
        </div>
      </div>
    </section>
  `;
}
