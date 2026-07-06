import { renderHero } from "../components/hero.js";
import { renderMissionCard, renderTodayMissionCard } from "../components/missionCard.js";
import { renderProgressCard } from "../components/progressCard.js";
import { renderQuoteCard } from "../components/quoteCard.js";
import { renderQuickPractice } from "../components/quickPractice.js";
import { getTodaysMission } from "../core/missions.js";
import { getCourseProgress, getCurrentLesson, getLessonProgress, getNextAvailableLessonStatus } from "../core/content.js";

export function renderHome(state) {
  const mission = getTodaysMission();
  const currentLesson = getCurrentLesson();
  const lessonProgress = currentLesson ? getLessonProgress(currentLesson.id) : null;
  const nextLessonStatus = getNextAvailableLessonStatus();
  const courseProgress = getCourseProgress();

  return `
    ${renderHomeHeader(state)}
    ${renderHero(state)}
    ${renderMissionCard(state, mission, currentLesson, lessonProgress, nextLessonStatus, courseProgress)}
    ${renderProgressCard(state, courseProgress)}

    <section class="home-bottom">
      ${renderTodayMissionCard(state, mission)}
      ${renderQuoteCard()}
      ${renderQuickPractice()}
    </section>
  `;
}

function renderHomeHeader(state) {
  return `
    <section class="home-topbar h-section">
      <div class="home-brand">
        <div class="home-brand-mark" aria-hidden="true">H</div>
        <div>
          <div class="home-brand-name">Habla<span>.</span></div>
          <p>Speak Spanish. Live Confidently.</p>
        </div>
      </div>
      <div class="home-top-actions">
        <span class="home-level-pill">${state.user.level || "A1 Beginner"}</span>
        <span class="home-bell" aria-hidden="true"></span>
      </div>
    </section>
  `;
}
