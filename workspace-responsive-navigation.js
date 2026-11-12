// Keep the original buttons, IDs, accessible names and navigation handlers.
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.getElementById("workspace-navigation");
  const main = document.querySelector("body > main");
  if (!nav || !main) return;
  const sections = document.getElementById("task-section-navigation");
  if (sections) main.prepend(sections);
  // A body-level dock avoids the transformed/clipped workspace stacking contexts.
  main.before(nav);
  const paths = {
    "view-management": '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 17h7M17.5 14v7"/>',
    "view-resources":
      '<path d="M3 5h7l2 2h9v13H3z"/><path d="M7 11h10M7 15h7"/>',
    "view-home": '<path d="m3 10 9-7 9 7v10H6V10"/><path d="M9 20v-7h6v7"/>',
    "view-pitch":
      '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 5v14"/><circle cx="12" cy="12" r="3"/>',
    "view-training":
      '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3h6v4H9zM9 12h6M9 16h6"/>',
    "view-coach-agenda":
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 11h18M7 15h2M13 15h2"/>',
    "view-reports": '<path d="M4 20h17M7 16v-5M12 16V5M17 16V9"/>',
    "workspace-squad-entry":
      '<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M17 14a5 5 0 0 1 4 5v2"/>',
    "view-club-network":
      '<path d="M4 21V8l8-5 8 5v13M2 21h20M9 21v-5h6v5M8 10h1M15 10h1M8 13h1M15 13h1"/>',
  };
  for (const [id, path] of Object.entries(paths)) {
    const button = document.getElementById(id);
    if (!button) continue;
    const label = document.createElement("span");
    label.className = "navigation-label";
    label.textContent = button.textContent.trim();
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    svg.classList.add("navigation-icon");
    svg.innerHTML = path; // Static paths only; no user-supplied markup.
    button.replaceChildren(svg, label);
  }
  nav.classList.remove("workspace-menu-collapsed");
  const legacyToggle = document.getElementById("workspace-menu-toggle");
  if (legacyToggle) legacyToggle.hidden = true;
  document.body.classList.add("responsive-navigation");
  const desktop = matchMedia(
    "(min-width:1100px) and (hover:hover) and (pointer:fine)",
  );
  function updateSpace() {
    const space = desktop.matches
      ? 0
      : Math.ceil(nav.getBoundingClientRect().height);
    document.body.style.setProperty("--navigation-bottom-space", space + "px");
    document.documentElement.style.setProperty(
      "--navigation-bottom-clearance",
      space + "px",
    );
  }
  new ResizeObserver(updateSpace).observe(nav);
  function updateDock() {
    nav.dataset.dock = desktop.matches ? "left" : "bottom";
    updateSpace();
    window.dispatchEvent(new Event("resize"));
  }
  // Vertical arrow navigation complements the existing horizontal keyboard controls.
  nav.addEventListener("keydown", (event) => {
    if (!desktop.matches || !["ArrowUp", "ArrowDown"].includes(event.key))
      return;
    const buttons = [
      ...nav.querySelectorAll(":scope > button:not([disabled])"),
    ];
    const index = buttons.indexOf(event.target.closest("button"));
    if (index < 0) return;
    event.preventDefault();
    buttons[
      (index + (event.key === "ArrowDown" ? 1 : buttons.length - 1)) %
        buttons.length
    ].focus({ preventScroll: true });
  });
  desktop.addEventListener("change", updateDock);
  updateDock();
});
