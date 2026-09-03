export function renderQuickPractice() {
  const items = [
    ["home-icon-chat", "Greetings", "practice"],
    ["home-icon-practice", "Verbs", "practice"],
    ["home-icon-progress", "Numbers", "practice"],
    ["home-icon-people", "Family", "learn"],
    ["home-icon-phrases", "Phrases", "practice"],
    ["home-icon-food", "Food", "learn"],
  ];

  return `
    <div class="practice-card h-card">
      <h3 class="h-label">Quick Practice</h3>
      <div class="practice-grid">
        ${items.map(([icon, label, page]) => `
          <button type="button" data-page="${page}">
            <span class="practice-icon home-icon ${icon}" aria-hidden="true"></span>
            <span>${label}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}
