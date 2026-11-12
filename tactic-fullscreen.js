// Tactique (Placement tactique and Animations): a compact page that fits without
// scrolling, and an « Ouvrir en grand » editor with zoom where every tool is reachable.
(() => {
  const zooms = [1, 1.5, 2];
  let open = null;
  const bar = el("div", "tactic-fs-bar");
  bar.hidden = true;
  const barTitle = el("strong", "tactic-fs-title", ""),
    zoomOut = el("button", "tactic-fs-zoom", "−"),
    zoomLabel = el("span", "tactic-fs-zoom-label", "100 %"),
    zoomIn = el("button", "tactic-fs-zoom", "+"),
    close = el("button", "primary tactic-fs-close", "✓ Fermer");
  for (const b of [zoomOut, zoomIn, close]) b.type = "button";
  zoomOut.setAttribute("aria-label", "Dézoomer le terrain");
  zoomIn.setAttribute("aria-label", "Zoomer sur le terrain");
  close.setAttribute("aria-label", "Fermer le grand écran");
  const zoomBox = el("div", "tactic-fs-zoombox");
  zoomBox.append(zoomOut, zoomLabel, zoomIn);
  bar.append(barTitle, zoomBox, close);
  document.body.append(bar);

  function setZoom(index) {
    if (!open) return;
    open.zoom = Math.max(0, Math.min(zooms.length - 1, index));
    open.container.style.setProperty("--fs-zoom", zooms[open.zoom]);
    zoomLabel.textContent = Math.round(zooms[open.zoom] * 100) + " %";
    zoomOut.disabled = open.zoom === 0;
    zoomIn.disabled = open.zoom === zooms.length - 1;
  }
  zoomOut.onclick = () => setZoom(open.zoom - 1);
  zoomIn.onclick = () => setZoom(open.zoom + 1);
  function enter(board) {
    if (open) leave();
    const container = board.container();
    // Only the board currently on screen can open in the large editor.
    if (!container || !container.getClientRects().length) return;
    open = { board, container, zoom: 0, details: board.details?.() || null };
    if (open.details) {
      open.detailsWasOpen = open.details.open;
      open.details.open = true;
    }
    for (const p of container.querySelectorAll("#pitch, #simple-pitch")) p.style.removeProperty("width");
    container.classList.add("tactic-fs");
    document.body.classList.add("tactic-fs-open");
    barTitle.textContent = board.title();
    bar.hidden = false;
    setZoom(0);
    close.focus();
  }
  function leave() {
    if (!open) return;
    const { container, details, detailsWasOpen } = open;
    container.classList.remove("tactic-fs");
    container.style.removeProperty("--fs-zoom");
    if (details) details.open = detailsWasOpen;
    document.body.classList.remove("tactic-fs-open");
    bar.hidden = true;
    const button = open.board.button;
    open = null;
    document.dispatchEvent(new CustomEvent("tactic-fs-closed"));
    button?.focus();
    scheduleFit();
  }
  close.onclick = leave;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open && !document.querySelector("dialog[open]")) {
      e.preventDefault();
      leave();
    }
  });
  // Leaving the Match view (another menu entry) closes the editor.
  new MutationObserver(() => {
    if (open && !open.container.offsetParent && !open.container.classList.contains("tactic-fs")) leave();
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  for (const id of ["view-home", "view-training", "view-coach-agenda", "view-reports", "view-resources", "view-club-network", "workspace-squad-entry"])
    document.getElementById(id)?.addEventListener("click", leave);

  function actionBar(board, extras = []) {
    const row = el("div", "tactic-compact-actions"),
      openButton = el("button", "primary tactic-fs-open-button", "⛶ Ouvrir en grand pour modifier");
    openButton.type = "button";
    openButton.onclick = () => enter(board);
    board.button = openButton;
    row.append(openButton, ...extras);
    return row;
  }
  const proxy = (label, id, cls = "export") => {
    const b = el("button", cls, label);
    b.type = "button";
    b.onclick = () => document.getElementById(id)?.click();
    return b;
  };

  // Placement tactique: the board (tools column + pitch).
  const placement = {
    container: () => document.querySelector(".terrain-team-section .board"),
    details: () => document.getElementById("comfort-match-tools"),
    title: () => "Placement tactique",
  };
  // The board is moved into its terrain section by other modules at DOMContentLoaded.
  const setupPlacement = () => {
  const board = placement.container();
  if (board && !board.dataset.tacticFs) {
    board.dataset.tacticFs = "1";
    const bar = actionBar(placement);
    board.closest(".workspace").before(bar);
    // The same board also serves « Composition »: compact mode only for the tactical plan.
    const sync = () => {
      const plan = typeof terrainBoardKind !== "undefined" && terrainBoardKind === "plan";
      board.classList.toggle("tactic-plan", plan);
      board.closest(".terrain-team-section")?.classList.toggle("tactic-plan-section", plan);
      bar.hidden = !plan;
    };
    const renderBefore = render;
    render = function (...args) {
      const value = renderBefore.apply(this, args);
      sync();
      return value;
    };
    new MutationObserver(sync).observe(document.body, { attributes: true, attributeFilter: ["class"] });
    sync();
  }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(setupPlacement));
  else setupPlacement();

  // Animations: the whole animation board (library, tools, playback, pitch).
  const animations = {
    container: () => document.getElementById("simple-board"),
    title: () => "Animation · " + (simpleState?.sequenceTitle?.trim() || "sans nom"),
  };
  const simple = animations.container();
  // The step buttons live on another page of the flow: the large editor mirrors them
  // (each mirror clicks the original, so its handlers and confirmations are unchanged).
  if (simple) {
    const steps = el("div", "tactic-fs-steps");
    steps.setAttribute("role", "group");
    steps.setAttribute("aria-label", "Étapes de l’animation");
    simple.append(steps);
    const paintSteps = () => {
      const originals = [...document.querySelectorAll("#simple-steps button")];
      steps.replaceChildren(el("strong", "", "Étapes"));
      steps.hidden = originals.length < 2;
      originals.forEach((original, i) => {
        const b = el("button", original.classList.contains("active") ? "active" : "", String(i + 1));
        b.type = "button";
        b.setAttribute("aria-label", "Étape " + (i + 1) + " · " + (original.getAttribute("aria-label") || ""));
        b.setAttribute("aria-pressed", original.getAttribute("aria-pressed") || "false");
        b.onclick = () => document.querySelectorAll("#simple-steps button")[i]?.click();
        steps.append(b);
      });
    };
    const renderBefore = renderSimple;
    renderSimple = function (...args) {
      const value = renderBefore.apply(this, args);
      paintSteps();
      return value;
    };
    paintSteps();
  }
  if (simple)
    simple
      .querySelector(".simple-library-panel")
      ?.after(actionBar(animations, [proxy("▶ Lire la séquence", "animation-play"), proxy("↓ PDF", "simple-pdf")]));

  // Compact pages fit the window: the pitch takes the height left once the rest is laid out.
  function fit() {
    const page = document.getElementById("terrain-page-0");
    if (!page || open) return;
    const boards = [
      [document.querySelector(".board.tactic-plan #pitch"), document.querySelector(".board.tactic-plan")],
      [document.querySelector("#simple-board:not(.tactic-fs) #simple-pitch"), document.getElementById("simple-board")],
    ];
    for (const [pitch, host] of boards) {
      if (!pitch || !host?.offsetParent) continue;
      const ratio = document.body.classList.contains("landscape-mode") ? 1.2353 : 0.8095,
        maxWidth = pitch.parentElement.getBoundingClientRect().width - 8;
      // Height left for the pitch = page height minus everything else; two passes
      // absorb reflows. The pitch may also grow back when the window gets taller.
      for (let pass = 0; pass < 2; pass++) {
        const height = pitch.getBoundingClientRect().height;
        if (!height) break;
        const others = page.scrollHeight - height,
          target = Math.max(260, Math.min(page.clientHeight - others - 4, maxWidth / ratio));
        if (Math.abs(target - height) < 2) break;
        pitch.style.setProperty("width", Math.round(target * ratio) + "px", "important");
      }
    }
  }
  let fitFrame = 0;
  let fitLater = 0;
  const scheduleFit = () => {
    cancelAnimationFrame(fitFrame);
    fitFrame = requestAnimationFrame(fit);
    // Again once page transitions are over.
    clearTimeout(fitLater);
    fitLater = setTimeout(fit, 400);
  };
  window.addEventListener("resize", scheduleFit);
  new MutationObserver(scheduleFit).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  if (typeof workspaceFlows !== "undefined" && workspaceFlows.terrain?.root)
    new MutationObserver(scheduleFit).observe(workspaceFlows.terrain.root, { attributes: true, subtree: true, attributeFilter: ["hidden", "data-step"] });
  document.addEventListener("click", () => setTimeout(scheduleFit, 50));
  window.tacticFullscreen = { open: (name) => enter(name === "animations" ? animations : placement), close: leave, isOpen: () => !!open };
})();
