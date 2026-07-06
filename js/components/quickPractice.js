export function renderQuickPractice() {
  const items = [
    ["&#128075;", "Greetings", "practice"],
    ["&#9889;", "Verbs", "practice"],
    ["123", "Numbers", "practice"],
    ["&#128106;", "Family", "learn"],
    ["&#128172;", "Phrases", "practice"],
    ["&#127869;", "Food", "learn"],
  ];

  return `
    <div class="practice-card h-card">
      <h3 class="h-label">Quick Practice</h3>
      <div class="practice-grid">
        ${items.map(([icon, label, page]) => `
          <button type="button" data-page="${page}">
            <span class="practice-icon">${icon}</span>
            <span>${label}</span>
          </button>
        `).join("")}
      </div>
    </div>
  `;
}
