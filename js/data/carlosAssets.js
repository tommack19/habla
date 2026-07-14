const CARLOS_HOME_FALLBACK = "assets/images/carlos-home.png";

export const CARLOS_REFERENCE_SHEET = "assets/reference/carlos-character-sheet.png";

export const CARLOS_ASSETS = Object.freeze({
  home: CARLOS_HOME_FALLBACK,
  profile: CARLOS_HOME_FALLBACK,
  speaking: CARLOS_HOME_FALLBACK,
  thinking: CARLOS_HOME_FALLBACK,
  celebrating: CARLOS_HOME_FALLBACK,
  morning: "assets/images/Carlos/Carlos-morning-hero.png",
  afternoon: "assets/images/Carlos/Carlos-afternoon-hero.png",
  evening: "assets/images/Carlos/Carlos-noches-Hero.png",
});

export const CARLOS_FALLBACK_ONERROR = `this.onerror=null;this.src='${CARLOS_HOME_FALLBACK}'`;

export function getCarlosAsset(role = "home") {
  return CARLOS_ASSETS[role] || CARLOS_HOME_FALLBACK;
}
