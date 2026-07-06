export function renderHero(state) {
  const greeting = getTimeGreeting();
  const firstName = state.user.name || "there";
  const xp = Number(state.user.xp || 0).toLocaleString();
  const streak = Number(state.user.streak || 0);

  return `
    <section class="home-hero h-section">
      <div class="hero-copy">
        <span class="hero-hola">&iexcl;Hola ${escapeHtml(firstName)}!</span>
        <h1>${greeting}!</h1>
        <p>You're one step closer to speaking Spanish confidently with your wife's family.</p>

        <div class="hero-stats">
          <div class="hero-stat">
            <span class="hero-stat-icon home-icon home-icon-fire" aria-hidden="true"></span>
            <strong>${streak}</strong>
            <small>Day Streak</small>
          </div>
          <div class="hero-stat">
            <span class="hero-stat-icon home-icon home-icon-star" aria-hidden="true"></span>
            <strong>${xp}</strong>
            <small>Total XP</small>
          </div>
        </div>

        <div class="carlos-status h-badge"><span class="h-dot"></span>Carlos is here to help</div>
      </div>

      <div class="hero-carlos">
        <div class="speech-bubble">
          Today we're practicing real Spanish, one confident sentence at a time.
        </div>
        <img class="carlos-home-img" src="assets/images/carlos-home.png" alt="Carlos, your Spanish coach" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">
        <div class="carlos-home-fallback" style="display:none">Carlos</div>
      </div>
    </section>
  `;
}

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
