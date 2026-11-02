// One framing policy for main views, subtabs, programmatic routing and history.
// It never changes document data and never recenters while the coach is typing.
document.addEventListener("DOMContentLoaded", () => {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const state = {
    phase: "idle",
    view: "",
    targetId: "",
    expectedY: 0,
    offset: 12,
    behavior: "smooth",
    revision: 0,
  };
  let firstFrame = 0,
    secondFrame = 0,
    finishTimer = 0,
    waiting = false,
    invalidTarget = null,
    pending = {},
    lastSignature = "";
  const visible = (node) =>
    !!node &&
    !node.hidden &&
    node.getClientRects().length > 0 &&
    getComputedStyle(node).visibility !== "hidden";
  function current() {
    const body = document.body,
      flow = workspaceFlows;
    if (body.classList.contains("resources-mode"))
      return {
        view: "resources",
        root: $("coach-resources"),
        panel: $("coach-resources"),
        key: "resources",
      };
    if (body.classList.contains("squad-mode"))
      return {
        view: "squad",
        root: $("coach-squad-dialog"),
        panel: $("coach-squad-dialog"),
        key: "squad",
      };
    if (body.classList.contains("home-mode"))
      return {
        view: "home",
        root: $("club-home"),
        panel: flow.home.pages[flow.home.index()],
        key: "home:" + flow.home.index(),
      };
    if (body.classList.contains("training-mode")) {
      const panel = visible($("training-library-page"))
        ? $("training-library-page")
        : visible(document.querySelector(".training-exercises-page"))
          ? document.querySelector(".training-exercises-page")
          : $("training-step-" + trainingWizard.step());
      return {
        view: "training",
        root: $("training-space"),
        panel,
        key: "training:" + panel?.id + ":" + trainingWizard.step(),
      };
    }
    if (body.classList.contains("reports-mode"))
      return {
        view: "report",
        root: $("after-match"),
        panel: $("report-tabs"),
        key: "report:" + reportTab + ":" + currentReport.id,
      };
    if (body.classList.contains("coach-agenda-mode"))
      return {
        view: "agenda",
        root: $("coach-agenda"),
        panel: flow.agenda.pages[flow.agenda.index()],
        key: "agenda:" + flow.agenda.index(),
      };
    if (body.classList.contains("club-network-mode"))
      return {
        view: "club",
        root: $("club-network-dialog"),
        panel: clubNetworkBound()
          ? flow.club.pages[flow.club.index()]
          : $("club-network-dialog"),
        key: "club:" + flow.club.index() + ":" + clubNetworkBound(),
      };
    return {
      view: "terrain",
      root: flow.terrain.root,
      panel: flow.terrain.pages[flow.terrain.index()],
      key:
        "terrain:" +
        flow.terrain.index() +
        ":" +
        terrainBoardKind +
        ":" +
        body.classList.contains("simple-mode") +
        ":" +
        (getCompositionBoard().documentId || "draft"),
    };
  }
  // Reserve the final pinned height, including before a sticky menu reaches the top.
  function measureOffset() {
    let offset = 12;
    for (const node of document.querySelectorAll(
      "body>header,#workspace-navigation",
    )) {
      if (!visible(node) || node.dataset.dock) continue;
      const style = getComputedStyle(node),
        top = parseFloat(style.top),
        rect = node.getBoundingClientRect();
      if (
        (style.position === "fixed" || style.position === "sticky") &&
        Number.isFinite(top) &&
        top < innerHeight / 2 &&
        (style.position === "sticky" || rect.top <= top + 2) &&
        (style.position === "sticky" || rect.bottom > 0)
      )
        offset = Math.max(
          offset,
          (style.position === "sticky" ? top + rect.height : rect.bottom) + 12,
        );
    }
    document.documentElement.style.setProperty(
      "--workspace-framing-offset",
      Math.ceil(offset) + "px",
    );
    state.offset = offset;
    return offset;
  }
  function clearFrames() {
    cancelAnimationFrame(firstFrame);
    cancelAnimationFrame(secondFrame);
    firstFrame = secondFrame = 0;
  }
  function scrollContainer(node) {
    if (
      node === document.scrollingElement ||
      node === document.body ||
      node === document.documentElement
    )
      return false;
    const style = getComputedStyle(node);
    return (
      /auto|scroll/.test(style.overflowY) &&
      node.scrollHeight > node.clientHeight + 1
    );
  }
  function resetPanels(root) {
    for (const node of [
      root,
      ...root.querySelectorAll("section,div,aside,article,ul,ol,nav,details"),
    ]) {
      if (
        !visible(node) ||
        node.matches("textarea,input,select") ||
        !scrollContainer(node)
      )
        continue;
      node.scrollTo({ top: 0, behavior: "instant" });
    }
  }
  function revealAncestors(target) {
    for (
      let node = target.parentElement;
      node && node !== document.body;
      node = node.parentElement
    )
      if (scrollContainer(node)) {
        const delta =
          target.getBoundingClientRect().top -
          node.getBoundingClientRect().top -
          node.clientTop;
        node.scrollTop = Math.max(0, node.scrollTop + delta);
      }
  }
  function run() {
    secondFrame = 0;
    if (document.querySelector("dialog[open]")) {
      waiting = true;
      state.phase = "waiting-dialog";
      return;
    }
    const active = current();
    if (!visible(active.root)) {
      state.phase = "idle";
      return;
    }
    const options = pending;
    pending = {};
    waiting = false;
    let target =
      options.target &&
      active.root.contains(options.target) &&
      visible(options.target)
        ? options.target
        : null;
    if (!target && options.scope === "tools")
      target = [...active.root.querySelectorAll(".tactic-tool-panel")].find(
        visible,
      );
    if (!target)
      target =
        options.scope === "main" || state.view !== active.view
          ? active.root
          : visible(active.panel)
            ? active.panel
            : active.root;
    resetPanels(active.root);
    revealAncestors(target);
    const offset = measureOffset(),
      max = Math.max(0, document.scrollingElement.scrollHeight - innerHeight),
      top = Math.max(
        0,
        Math.min(max, scrollY + target.getBoundingClientRect().top - offset),
      );
    state.view = active.view;
    state.targetId = target.id || active.root.id;
    state.expectedY = top;
    state.behavior = reduced.matches ? "instant" : "smooth";
    state.phase = "scrolling";
    state.revision++;
    window.scrollTo({ top, left: 0, behavior: state.behavior });
    clearTimeout(finishTimer);
    finishTimer = setTimeout(() => (state.phase = "idle"), 1100);
  }
  function request(options = {}) {
    if (
      invalidTarget &&
      visible(invalidTarget) &&
      !invalidTarget.validity.valid
    ) {
      clearFrames();
      pending = {};
      state.phase = "idle";
      return;
    }
    invalidTarget = null;
    const priority = { auto: 0, sub: 1, tools: 2, main: 3 };
    if (options.target) pending.target = options.target;
    if (
      (priority[options.scope || "auto"] || 0) >=
      (priority[pending.scope || "auto"] || 0)
    )
      pending.scope = options.scope || "auto";
    clearFrames();
    state.phase = "scheduled";
    // Wait for the destination's DOM, visibility and workspace measurements.
    firstFrame = requestAnimationFrame(() => {
      firstFrame = 0;
      secondFrame = requestAnimationFrame(run);
    });
  }
  function detect() {
    const next = current().key;
    if (next !== lastSignature) {
      lastSignature = next;
      request();
    }
  }
  const navigation = workspaceNavigation.run;
  workspaceNavigation.run = function (...args) {
    const result = navigation.apply(this, args);
    request();
    return result;
  };
  for (const flow of Object.values(workspaceFlows)) {
    const go = flow.go;
    flow.go = function (...args) {
      const result = go.apply(this, args);
      request();
      return result;
    };
  }
  for (const method of ["go", "openCatalogue", "openLibrary"]) {
    const original = trainingWizard[method];
    trainingWizard[method] = function (...args) {
      const result = original.apply(this, args);
      request();
      return result;
    };
  }
  for (const name of ["renderReportContent", "render"]) {
    const original = name === "render" ? render : renderReportContent;
    const wrapped = function (...args) {
      const result = original.apply(this, args);
      detect();
      return result;
    };
    if (name === "render") render = wrapped;
    else renderReportContent = wrapped;
  }
  const mainIds = new Set([
    "view-resources",
    "view-home",
    "view-pitch",
    "view-training",
    "view-coach-agenda",
    "view-reports",
    "workspace-squad-entry",
    "view-club-network",
  ]);
  document.addEventListener(
    "click",
    (event) => {
      const button = event.target.closest("button,.brand");
      if (!button || button.disabled || button.closest("dialog")) return;
      if (mainIds.has(button.id) || button.matches(".brand"))
        request({ scope: "main" });
      else if (
        button.matches(
          ".task-section-tab,.flow-progress>button,#report-tabs>button,.training-progress>button,.training-workspace-tabs>button,.flow-footer>button,.training-step-footer>button,.mode-switch>button,.report-analysis-switch>button,.agenda-calendar-heading button,#report-next,#report-previous,#training-create-session,#training-resume-session,#training-exercises-resume",
        )
      )
        request({ scope: "sub" });
      else if (button.matches(".tactic-tabs>button"))
        request({ scope: "tools" });
    },
    true,
  );
  new MutationObserver(detect).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  for (const node of [
    ...document.querySelectorAll(".flow-root"),
    $("training-space"),
  ])
    if (node)
      new MutationObserver(detect).observe(node, {
        attributes: true,
        attributeFilter: ["data-step", "class", "hidden"],
      });
  document.addEventListener(
    "close",
    () => {
      if (waiting && !document.querySelector("dialog[open]")) request();
    },
    true,
  );
  window.addEventListener("scrollend", () => {
    if (
      state.phase === "scrolling" &&
      Math.abs(scrollY - state.expectedY) < 2
    ) {
      clearTimeout(finishTimer);
      state.phase = "idle";
    }
  });
  function interrupt() {
    if (!firstFrame && !secondFrame && state.phase !== "scrolling") return;
    clearFrames();
    clearTimeout(finishTimer);
    pending = {};
    waiting = false;
    state.phase = "idle";
    window.scrollTo({ top: scrollY, behavior: "instant" });
  }
  document.addEventListener(
    "invalid",
    (event) => {
      if (event.target.closest("dialog")) return;
      invalidTarget = event.target;
      interrupt();
    },
    true,
  );
  document.addEventListener("pointerdown", interrupt, true);
  window.addEventListener("wheel", interrupt, { passive: true });
  window.addEventListener("touchstart", interrupt, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (
      ["PageUp", "PageDown", "Home", "End", "ArrowUp", "ArrowDown"].includes(
        event.key,
      ) &&
      !event.target.matches("input,textarea,select")
    )
      interrupt();
    else if (event.target.matches("input,textarea,select,[contenteditable]"))
      interrupt();
  });
  reduced.addEventListener("change", () => {
    if (reduced.matches && state.phase === "scrolling") {
      clearTimeout(finishTimer);
      window.scrollTo({ top: state.expectedY, behavior: "instant" });
      state.phase = "idle";
    }
  });
  window.addEventListener("resize", measureOffset);
  window.workspaceFraming = {
    request,
    getState: () => ({ ...state }),
    current: () => ({
      view: current().view,
      rootId: current().root?.id,
      panelId: current().panel?.id,
    }),
    cancel: interrupt,
  };
  measureOffset();
  lastSignature = current().key;
  request({ scope: "main" });
});
