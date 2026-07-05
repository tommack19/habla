export function renderHero(state) {
  return `
    <section class="home-hero">
      <div class="hero-copy">
        <h1>Good evening, ${state.user.name} 👋</h1>
        <p>You’re one step closer to speaking Spanish confidently with your wife’s family.</p>

        <div class="hero-stats">
          <div><span>🔥</span><strong>${state.user.streak}</strong><small>Day Streak</small></div>
          <div><span>⭐</span><strong>${state.user.xp} XP</strong><small>Total XP</small></div>
        </div>
      </div>

      <div class="hero-carlos">
        <div class="speech-bubble">
          <strong>¡Hola ${state.user.name}!</strong><br>
          Ready for today’s lesson?
        </div>
        <div class="carlos-face">😊</div>
        <div class="carlos-status">● Carlos is here to help</div>
      </div>
    </section>
  `;
}
