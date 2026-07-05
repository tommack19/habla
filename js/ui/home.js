import { renderHero } from "../components/hero.js";
import { renderMissionCard } from "../components/missionCard.js";
import { renderProgressCard } from "../components/progressCard.js";
import { renderQuoteCard } from "../components/quoteCard.js";
import { renderQuickPractice } from "../components/quickPractice.js";
import { getTodaysMission } from "../core/missions.js";
import { getCurrentLesson } from "../core/content.js";

export function renderHome(state) {
  const mission = getTodaysMission();
  const currentLesson = getCurrentLesson();

  return `
    ${renderHero(state)}
    ${renderMissionCard(state, mission, currentLesson)}
    ${renderProgressCard()}

    <section class="home-bottom">
      ${renderQuoteCard()}
      ${renderQuickPractice()}
    </section>
  `;
}
