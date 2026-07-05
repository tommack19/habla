import { renderHero } from "../components/hero.js";
import { renderMissionCard } from "../components/missionCard.js";
import { renderProgressCard } from "../components/progressCard.js";
import { renderQuoteCard } from "../components/quoteCard.js";
import { renderQuickPractice } from "../components/quickPractice.js";
import { getTodaysMission } from "../core/missions.js";
import { getCurrentLesson, getLessonProgress } from "../core/content.js";

export function renderHome(state) {
  const mission = getTodaysMission();
  const currentLesson = getCurrentLesson();
  const lessonProgress = currentLesson ? getLessonProgress(currentLesson.id) : null;

  return `
    ${renderHero(state)}
    ${renderMissionCard(state, mission, currentLesson, lessonProgress)}
    ${renderProgressCard()}

    <section class="home-bottom">
      ${renderQuoteCard()}
      ${renderQuickPractice()}
    </section>
  `;
}
