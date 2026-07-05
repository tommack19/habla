import { renderHero } from "../components/hero.js";
import { renderMissionCard } from "../components/missionCard.js";
import { renderProgressCard } from "../components/progressCard.js";
import { renderQuoteCard } from "../components/quoteCard.js";
import { renderQuickPractice } from "../components/quickPractice.js";

export function renderHome(state) {
  return `
    ${renderHero(state)}
    ${renderMissionCard(state)}
    ${renderProgressCard()}

    <section class="home-bottom">
      ${renderQuoteCard()}
      ${renderQuickPractice()}
    </section>
  `;
}
