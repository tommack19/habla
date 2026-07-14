export function renderNavigation(active = "home") {
  return `
    <nav class="bottom-nav" aria-label="Primary navigation">
      <button type="button" class="tab ${active === "home" ? "active" : ""}" data-page="home" ${active === "home" ? 'aria-current="page"' : ""}>
        <span class="nav-icon nav-icon-home has-svg" aria-hidden="true">${navSvg("home")}</span>
        <span>Home</span>
      </button>

      <button type="button" class="tab ${active === "carlos" ? "active" : ""}" data-page="carlos" ${active === "carlos" ? 'aria-current="page"' : ""}>
        <span class="nav-icon nav-icon-carlos has-svg" aria-hidden="true">${navSvg("carlos")}</span>
        <span>Carlos</span>
      </button>

      <button type="button" class="tab ${active === "learn" ? "active" : ""}" data-page="learn" ${active === "learn" ? 'aria-current="page"' : ""}>
        <span class="nav-icon nav-icon-learn has-svg" aria-hidden="true">${navSvg("learn")}</span>
        <span>Learn</span>
      </button>

      <button type="button" class="tab ${active === "practice" ? "active" : ""}" data-page="practice" ${active === "practice" ? 'aria-current="page"' : ""}>
        <span class="nav-icon nav-icon-practice has-svg" aria-hidden="true">${navSvg("practice")}</span>
        <span>Practice</span>
      </button>

      <button type="button" class="tab ${active === "profile" ? "active" : ""}" data-page="profile" ${active === "profile" ? 'aria-current="page"' : ""}>
        <span class="nav-icon nav-icon-profile has-svg" aria-hidden="true">${navSvg("profile")}</span>
        <span>Me</span>
      </button>
    </nav>
  `;
}

function navSvg(name) {
  const paths = {
    home: `<path d="m3 11 9-8 9 8"/><path d="M5.5 9.5V21h13V9.5M9.5 21v-6h5v6"/>`,
    carlos: `<circle cx="12" cy="8" r="4"/><path d="M5 21c.7-5 3-7.5 7-7.5s6.3 2.5 7 7.5"/><path d="M17.5 5.5h2A2.5 2.5 0 0 1 22 8v3l-2.5-1.5H18"/>`,
    learn: `<path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H12v18H7.5A3.5 3.5 0 0 0 4 23V5.5Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H12v18h4.5A3.5 3.5 0 0 1 20 23V5.5Z"/>`,
    practice: `<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.2 2.2 4.8-5"/><path d="M12 1v2M23 12h-2"/>`,
    profile: `<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-5 3.2-7.5 7.5-7.5s6.8 2.5 7.5 7.5"/>`,
  };
  return `<svg viewBox="0 0 24 24" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}
