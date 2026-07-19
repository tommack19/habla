export function renderMissionCard(state, mission, currentLesson = null, lessonProgress = null, nextLessonStatus = null, courseProgress = null) {
  const lessonCompleted = Boolean(lessonProgress?.completed);
  const lessonDescription = currentLesson?.objectives?.[0] || currentLesson?.realLifeMission?.mission || "Practice today's Spanish lesson.";
  const lessonReward = Number(currentLesson?.xpReward || 0);
  const xpLabel = lessonCompleted
    ? `${lessonProgress?.xpAwarded || lessonReward} XP earned`
    : `${lessonReward} XP reward`;
  const nextLessonMissing = nextLessonStatus?.type === "next-lesson-missing";
  const progressPercent = Number(courseProgress?.percent ?? 0);
  const lessonNumber = courseProgress?.currentLessonNumber || 1;
  const lessonTotal = courseProgress?.totalLoadedLessons || 1;
  const statusText = lessonCompleted ? "Completed" : "In Progress";
  const primaryText = "Start Today's Lesson";
  const title = currentLesson?.title || "Today's Spanish Lesson";
  const moduleName = currentLesson?.module || "Spanish";
  const lessonImage = getLessonImage(currentLesson?.id);

  return `
    <section class="mission-card lesson-feature-card h-card h-card--gold h-section">
      <div class="lesson-feature-content">
        <div class="mission-heading">
          <div>
            <span class="eyebrow h-label">Current Lesson</span>
            <div class="lesson-number">Lesson ${lessonNumber} of ${lessonTotal}</div>
          </div>
          <span class="mission-status h-badge ${lessonCompleted ? "completed h-badge--green" : "active h-badge--gold"}">${statusText}</span>
        </div>

        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(lessonDescription)}</p>

        <div class="lesson-feature-progress">
          <div class="lesson-feature-bar h-progress" aria-hidden="true">
            <i style="width:${progressPercent}%"></i>
          </div>
          <strong>${progressPercent}%</strong>
        </div>

        <div class="lesson-feature-meta">
          <span class="${lessonCompleted ? "is-complete" : ""}">${lessonCompleted ? "Completed" : "Ready to start"}</span>
          <strong>${xpLabel}</strong>
        </div>

        ${nextLessonMissing ? `
          <div class="mission-next-soon">
            <span>You're caught up</span>
            <small>${escapeHtml(nextLessonStatus.message || "Next lesson coming soon.")}</small>
          </div>
        ` : ""}

        ${lessonCompleted ? `<input class="review-toggle" type="checkbox" id="review-lesson-toggle">` : ""}
        <div class="mission-actions">
          <button class="primary-action h-btn h-btn--primary" data-page="carlos">
            ${primaryText}
          </button>
          ${lessonCompleted ? `
            <label class="secondary-action review-action h-btn h-btn--secondary" for="review-lesson-toggle" role="button" tabindex="0">
              Review Lesson
            </label>
          ` : `
            <button class="secondary-action h-btn h-btn--secondary" data-page="learn">
              Review Lesson
            </button>
          `}
        </div>

        ${lessonCompleted ? renderReviewPanel() : ""}
      </div>

      <div class="lesson-feature-art">
        ${lessonImage ? `
          <img src="${lessonImage}" alt="" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';">
        ` : ""}
        <div class="lesson-art-card">
          <div class="lesson-art-icon" aria-hidden="true">${getLessonIcon(currentLesson?.id)}</div>
          <span>${escapeHtml(moduleName)}</span>
          <strong>${escapeHtml(title)}</strong>
        </div>
      </div>
    </section>
  `;
}

function getLessonImage(lessonId) {
  const imageMap = {
    "a1-lesson-01-greetings": "assets/images/lessons/lesson-01-greetings.png.png",
    "a1-lesson-02-introductions": "assets/images/lessons/lesson-02-introductions.png.png",
    "lesson-03-family": "assets/images/lessons/lesson-03-family.png.png",
    "lesson-04-numbers-time": "assets/images/lessons/lesson-04-numbers-time.png.png",
    "lesson-05-shopping": "assets/images/lessons/lesson-05-shopping.png.png",
    "lesson-06-food-drinks": "assets/images/lessons/lesson-06-food-drinks.png.png",
    "lesson-07-travel-basics": "assets/images/lessons/lesson-07-travel.png.png",
    "lesson-08-vacation": "assets/images/lessons/lesson-08-vacation.png.png",
    "lesson-09-around-the-house": "assets/images/lessons/lesson-08-vacation.png.png",
    "lesson-10-daily-routine": "assets/images/lessons/lesson-07-travel.png.png",
  };

  return imageMap[lessonId] || "";
}

function getLessonIcon(lessonId) {
  const iconMap = {
    "lesson-01-greetings": "Hi",
    "lesson-02-introductions": "Me",
    "lesson-03-family": "Fam",
    "lesson-04-numbers-time": "Time",
    "lesson-05-market": "Food",
    "lesson-06-cafe": "Cafe",
    "lesson-07-airport": "Go",
    "lesson-08-beach": "Sol",
  };

  return iconMap[lessonId] || "Habla";
}

function renderReviewPanel() {
  return `
    <div class="review-panel" aria-label="Review lesson options">
      <div class="review-panel-heading">
        <span>Choose review mode</span>
        <small>Pick how you want to revisit this lesson.</small>
      </div>
      <div class="review-options">
        <button type="button" data-page="carlos">
          <strong>Review with Carlos</strong>
          <small>Talk through the lesson</small>
        </button>
        <button type="button" data-page="practice">
          <strong>Practice Quiz</strong>
          <small>Retest the lesson</small>
        </button>
        <button type="button" data-page="learn">
          <strong>Review Vocabulary</strong>
          <small>Study the words again</small>
        </button>
      </div>
    </div>
  `;
}

export function renderTodayMissionCard(state, mission) {
  const statusText = mission.completed ? "Completed" : "Active";
  const actionText = mission.completed ? "Mission Complete" : "Complete Mission";

  return `
    <section class="today-mission-card h-card">
      <div class="today-mission-head">
        <div>
          <span class="eyebrow h-label">Today's Mission</span>
          <h3>${escapeHtml(mission.title)}</h3>
        </div>
        <div class="mission-icon home-icon home-icon-mission" aria-hidden="true"></div>
      </div>
      <p>${escapeHtml(mission.description)}</p>
      <div class="today-mission-meta">
        <span><strong>${mission.xpReward} XP</strong></span>
        <span><strong>${escapeHtml(state.user.level)}</strong></span>
        <em class="${mission.completed ? "completed" : ""}">${statusText}</em>
      </div>
      <button class="secondary-action mission-complete-action h-btn h-btn--quiet" data-mission-complete="${mission.id}" ${mission.completed ? "disabled" : ""}>
        ${actionText}
      </button>
    </section>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
