export function renderNavigation(active = "home") {
  return `
    <nav class="bottom-nav" aria-label="Primary navigation">
      <button type="button" class="tab ${active === "home" ? "active" : ""}" data-page="home" aria-label="Home" ${active === "home" ? 'aria-current="page"' : ""}>
        <span class="nav-icon nav-icon-home has-svg" aria-hidden="true">${navSvg("home")}</span>
        <span>Home</span>
      </button>

      <button type="button" class="tab ${active === "carlos" ? "active" : ""}" data-page="carlos" aria-label="Carlos" ${active === "carlos" ? 'aria-current="page"' : ""}>
        <span class="nav-icon nav-icon-carlos has-svg" aria-hidden="true">${navSvg("carlos")}</span>
        <span>Carlos</span>
      </button>

      <button type="button" class="tab ${active === "learn" ? "active" : ""}" data-page="learn" aria-label="Learn" ${active === "learn" ? 'aria-current="page"' : ""}>
        <span class="nav-icon nav-icon-learn has-svg" aria-hidden="true">${navSvg("learn")}</span>
        <span>Learn</span>
      </button>

      <button type="button" class="tab ${active === "practice" ? "active" : ""}" data-page="practice" aria-label="Practice" ${active === "practice" ? 'aria-current="page"' : ""}>
        <span class="nav-icon nav-icon-practice has-svg" aria-hidden="true">${navSvg("practice")}</span>
        <span>Practice</span>
      </button>

      <button type="button" class="tab ${active === "profile" ? "active" : ""}" data-page="profile" aria-label="Me" ${active === "profile" ? 'aria-current="page"' : ""}>
        <span class="nav-icon nav-icon-profile has-svg" aria-hidden="true">${navSvg("profile")}</span>
        <span>Me</span>
      </button>
    </nav>
  `;
}

function navSvg(name) {
  const paths = {
    home: `<path d="m3 11 9-8 9 8"/><path d="M5.5 9.5V21h13V9.5M9.5 21v-6h5v6"/>`,
    carlos: `<path d="M8.1 8.35c0-2.75 1.65-4.65 4.05-4.65 2.45 0 4.1 1.9 4.1 4.65 0 2.7-1.7 4.65-4.1 4.65S8.1 11.05 8.1 8.35Z"/><path d="M8.25 7.05c.35-2.6 2.05-4.4 4.45-4.4 1.85 0 3.35 1.05 4.05 2.75-1-.5-1.9-.65-2.8-.4-1.3.35-2.35-.05-3.05-.8-.35 1.35-1.25 2.3-2.65 2.85Z"/><path d="M4.85 21c.55-4.75 3-7.35 7.3-7.35 4.25 0 6.7 2.6 7.25 7.35"/><path d="m9.25 14.05 2.9 2.45 2.9-2.45"/><path d="M18.1 4.1h1.75c1 0 1.8.8 1.8 1.8v1.55c0 1-.8 1.8-1.8 1.8h-.45l-1.65 1.35V9.2"/><path d="M19.25 6.65h.01M20.35 6.65h.01"/>`,
    learn: `<path d="M3.75 5.25c0-.7.55-1.25 1.25-1.25h4.15c1.2 0 2.25.55 2.85 1.4V20c-.6-.85-1.65-1.4-2.85-1.4H3.75V5.25Z"/><path d="M20.25 5.25c0-.7-.55-1.25-1.25-1.25h-4.15c-1.2 0-2.25.55-2.85 1.4V20c.6-.85 1.65-1.4 2.85-1.4h5.4V5.25Z"/><path d="M12 5.4v14.4"/>`,
    practice: `<circle cx="12" cy="12" r="8.5"/><path d="m8.5 12 2.2 2.2 4.8-5"/><path d="M12 1v2M23 12h-2"/>`,
    profile: `<circle cx="12" cy="8" r="4"/><path d="M4.5 21c.7-5 3.2-7.5 7.5-7.5s6.8 2.5 7.5 7.5"/>`,
  };
  return `<svg viewBox="0 0 24 24" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
}
