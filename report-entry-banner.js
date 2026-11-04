// Acknowledgement is per coach/team and per browsing session. A real reload resets it.
(() => {
  "use strict";
  const prefix = "vestiaire-report-banner:",
    memory = new Set();
  const key = () => prefix + activeCoach.id + ":" + activeCoachTeam.id;
  function dismissed() {
    try {
      return memory.has(key()) || sessionStorage.getItem(key()) === "1";
    } catch {
      return memory.has(key());
    }
  }
  function dismiss(id = key()) {
    memory.add(id);
    try {
      sessionStorage.setItem(id, "1");
    } catch {}
  }
  function reset() {
    memory.clear();
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const id = sessionStorage.key(i);
        if (id?.startsWith(prefix)) sessionStorage.removeItem(id);
      }
    } catch {}
    $("report-entry-banner")?.remove();
  }
  if (performance.getEntriesByType("navigation")[0]?.type === "reload") reset();
  document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("report-saved", () => {
      dismiss();
      const banner = $("report-entry-banner");
      if (banner) banner.close();
    });
    const clear = clubNetworkClear;
    clubNetworkClear = function (...args) {
      reset();
      return clear.apply(this, args);
    };
  });
  window.reportEntryBanner = { key, dismissed, dismiss, reset };
})();
