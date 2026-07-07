export function renderNavigation(active = "home") {
  return `
    <nav class="bottom-nav">
      <button class="tab ${active === "home" ? "active" : ""}" data-page="home">
        <span class="nav-icon nav-icon-home" aria-hidden="true"></span>
        <span>Home</span>
      </button>

      <button class="tab ${active === "carlos" ? "active" : ""}" data-page="carlos">
        <span class="nav-icon nav-icon-carlos" aria-hidden="true"></span>
        <span>Carlos</span>
      </button>

      <button class="tab ${active === "learn" ? "active" : ""}" data-page="learn">
        <span class="nav-icon nav-icon-learn" aria-hidden="true"></span>
        <span>Learn</span>
      </button>

      <button class="tab ${active === "practice" ? "active" : ""}" data-page="practice">
        <span class="nav-icon nav-icon-practice" aria-hidden="true"></span>
        <span>Practice</span>
      </button>

      <button class="tab ${active === "profile" ? "active" : ""}" data-page="profile">
        <span class="nav-icon nav-icon-profile" aria-hidden="true"></span>
        <span>Me</span>
      </button>
    </nav>
  `;
}
