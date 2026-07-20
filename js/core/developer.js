const DEVELOPER_MODE_KEY = "habla_developer_mode_v1";

export function isDeveloperMode() {
  if (typeof window === "undefined") return false;

  const requestedMode = new URLSearchParams(window.location.search).get("dev");
  if (requestedMode === "1") writeDeveloperMode(true);
  if (requestedMode === "0") writeDeveloperMode(false);

  try {
    const savedMode = window.localStorage.getItem(DEVELOPER_MODE_KEY);
    if (savedMode === "true") return true;
    if (savedMode === "false") return false;
  } catch {
    // Fall through to the safe host-based default.
  }

  return isLocalDevelopmentHost();
}

export function setDeveloperMode(enabled) {
  writeDeveloperMode(Boolean(enabled));
  return Boolean(enabled);
}

function isLocalDevelopmentHost() {
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function writeDeveloperMode(enabled) {
  try {
    window.localStorage.setItem(DEVELOPER_MODE_KEY, String(enabled));
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

if (typeof window !== "undefined") {
  window.hablaDev = {
    enabled: isDeveloperMode,
    enable() {
      setDeveloperMode(true);
      window.location.reload();
    },
    disable() {
      setDeveloperMode(false);
      window.location.reload();
    },
  };
}
