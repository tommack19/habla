export function renderProgressCard(state, courseProgress) {
  const activity = readActivityStats();
  const wordsLearned = Number(activity.vocabularyReviewedCount ?? state.vocabulary?.learned?.length ?? 0);
  const speakingMinutes = Number(activity.speakingMinutes ?? 0);
  const speakingLabel = formatSpeakingTime(speakingMinutes);
  const lessonsCompleted = Number(courseProgress?.completedCount ?? 0);
  const coursePercent = Number(courseProgress?.percent ?? 0);
  const nextLessonTitle = courseProgress?.nextLessonStatus?.nextLessonTitle || courseProgress?.nextLessonStatus?.message?.replace("Next lesson coming soon: ", "") || "More Spanish";
  const nextLessonNumber = getNextLessonNumber(courseProgress, lessonsCompleted);

  return `
    <section class="progress-card h-card h-section">
      <h3 class="h-label">Your Progress</h3>
      <div class="progress-overview">
        <div class="course-ring" style="--course:${coursePercent}">
          <strong>${coursePercent}%</strong>
          <span>Course Complete</span>
        </div>
        <div class="progress-stat"><span class="home-icon home-icon-book" aria-hidden="true"></span><strong>${wordsLearned}</strong><small>Words Learned</small></div>
        <div class="progress-stat"><span class="home-icon home-icon-clock" aria-hidden="true"></span><strong>${speakingLabel}</strong><small>Speaking Time</small></div>
        <div class="progress-stat"><span class="home-icon home-icon-trophy" aria-hidden="true"></span><strong>${lessonsCompleted}</strong><small>Lessons Completed</small></div>
        <div class="progress-next">
          <span>Next up</span>
          <strong>${escapeHtml(nextLessonNumber)}</strong>
          <small>${escapeHtml(shortenLessonTitle(nextLessonTitle))}</small>
          <b aria-hidden="true">&rarr;</b>
        </div>
      </div>
    </section>
  `;
}

function getNextLessonNumber(courseProgress, lessonsCompleted) {
  const nextNumber = Number(courseProgress?.currentLessonNumber || lessonsCompleted + 1 || 1);
  return `Lesson ${nextNumber}`;
}

function shortenLessonTitle(title) {
  return String(title || "More Spanish")
    .replace(/^Lesson\s+\d+\s*[:.-]\s*/i, "")
    .replace(/^Next lesson coming soon:\s*/i, "")
    .split(":")[0]
    .trim();
}

function readActivityStats() {
  if (typeof localStorage === "undefined") return {};

  try {
    return JSON.parse(localStorage.getItem("habla_activity_stats_v1") || "{}");
  } catch (error) {
    return {};
  }
}

function formatSpeakingTime(minutes) {
  if (!minutes) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (!hours) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
