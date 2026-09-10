const MOTION_ROOT = ".lesson-narrative-experience";

let activeScene = "";
let activeTurn = "";
let listenersInstalled = false;
let scrollFrame = 0;

function reducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function sceneKey(root) {
  const scene = root.querySelector("[data-motion-scene]");
  return scene?.dataset.motionScene || (root.classList.contains("lesson-narrative-completion") ? "completion" : "");
}

function turnKey(root) {
  const turn = root.querySelector("[data-motion-turn]");
  return turn ? `${sceneKey(root)}:${turn.dataset.motionTurn || "0"}` : "";
}

function finishEntrance(root) {
  root.classList.remove("motion-preparing");
  root.classList.add("motion-ready");
}

function scrollByControlled(container, distance) {
  if (!distance) return;
  cancelAnimationFrame(scrollFrame);
  if (reducedMotion()) {
    container.scrollTop += distance;
    return;
  }
  const start = container.scrollTop;
  const startedAt = performance.now();
  const duration = 220;
  const tick = now => {
    const elapsed = Math.min((now - startedAt) / duration, 1);
    const eased = 1 - Math.pow(1 - elapsed, 3);
    container.scrollTop = start + (distance * eased);
    if (elapsed < 1) scrollFrame = requestAnimationFrame(tick);
  };
  scrollFrame = requestAnimationFrame(tick);
}

function keepRehearsalContextVisible(root) {
  const scene = root.querySelector('[data-motion-scene="rehearse"]');
  const dashboard = document.getElementById("dashboard");
  if (!scene || !dashboard) return;
  const heading = scene.querySelector(".lesson-narrative-heading");
  const activeTurn = scene.querySelector(".lesson-narrative-carlos-line");
  const header = root.querySelector(".lesson-narrative-header");
  if (!heading || !activeTurn) return;

  const dashboardBounds = dashboard.getBoundingClientRect();
  const headerBottom = header?.getBoundingClientRect().bottom || dashboardBounds.top;
  const safeTop = Math.max(dashboardBounds.top, headerBottom) + 12;
  const safeBottom = dashboardBounds.bottom - 20;
  const headingBounds = heading.getBoundingClientRect();
  const turnBounds = activeTurn.getBoundingClientRect();
  const distance = headingBounds.top < safeTop
    ? headingBounds.top - safeTop
    : turnBounds.bottom > safeBottom
      ? turnBounds.bottom - safeBottom
      : 0;
  scrollByControlled(dashboard, distance);
}

function installPressHandling() {
  if (listenersInstalled) return;
  listenersInstalled = true;
  const release = event => event.target.closest(`${MOTION_ROOT} button`)?.classList.remove("motion-pressed");
  document.addEventListener("pointerdown", event => {
    const button = event.target.closest(`${MOTION_ROOT} button:not(:disabled)`);
    if (button) button.classList.add("motion-pressed");
  });
  document.addEventListener("pointerup", release);
  document.addEventListener("pointercancel", release);
  document.addEventListener("pointerleave", release, true);
}

export function initializeLessonMotion() {
  installPressHandling();
  const root = document.querySelector(MOTION_ROOT);
  if (!root) {
    activeScene = "";
    activeTurn = "";
    return;
  }

  const nextScene = sceneKey(root);
  const nextTurn = turnKey(root);
  const sameScene = Boolean(nextScene && nextScene === activeScene);
  const sameTurn = Boolean(nextTurn && nextTurn === activeTurn);
  root.classList.toggle("motion-scene-stable", sameScene);
  root.classList.toggle("motion-turn-change", sameScene && !sameTurn && Boolean(nextTurn));

  if (reducedMotion()) {
    root.classList.add("motion-ready");
  } else {
    root.classList.add("motion-preparing");
    requestAnimationFrame(() => requestAnimationFrame(() => finishEntrance(root)));
  }

  if (sameScene && !sameTurn && nextScene === "rehearse") {
    requestAnimationFrame(() => keepRehearsalContextVisible(root));
  }

  activeScene = nextScene;
  activeTurn = nextTurn;
}
