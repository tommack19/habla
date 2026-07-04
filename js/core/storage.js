const STORAGE_KEY = "habla_state_v1";

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return null;
  }

  try {
    return JSON.parse(saved);
  } catch (error) {
    console.error("Could not load saved Habla state:", error);
    return null;
  }
}

export function clearSavedState() {
  localStorage.removeItem(STORAGE_KEY);
}