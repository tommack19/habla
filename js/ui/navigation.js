export function renderNavigation(active = "home") {
  return `
    <nav class="bottom-nav">
      <button class="${active === "home" ? "active" : ""}" data-page="home">
        🏠
        <span>Home</span>
      </button>

      <button class="${active === "carlos" ? "active" : ""}" data-page="carlos">
        👨
        <span>Carlos</span>
      </button>

      <button class="${active === "learn" ? "active" : ""}" data-page="learn">
        📚
        <span>Learn</span>
      </button>

      <button class="${active === "practice" ? "active" : ""}" data-page="practice">
        🎯
        <span>Practice</span>
      </button>

      <button class="${active === "profile" ? "active" : ""}" data-page="profile">
        👤
        <span>Me</span>
      </button>
    </nav>
  `;
}