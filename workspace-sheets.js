// One visible full-screen workspace. Preserve each original form and its save/cancel guards.
(() => {
  "use strict";
  const nativeShow = HTMLDialogElement.prototype.show,
    nativeModal = HTMLDialogElement.prototype.showModal,
    nativeClose = HTMLDialogElement.prototype.close;
  const context = new WeakMap(),
    inerted = new Set();
  let order = 0, priorityRoot = null;
  const owner = () =>
    [
      typeof activeCoach !== "undefined" ? activeCoach.id : "",
      typeof activeCoachTeam !== "undefined" ? activeCoachTeam.id : "",
    ].join(":");
  const sheets = () =>
    [...document.querySelectorAll("dialog.workspace-sheet[open]")].sort(
      (a, b) =>
        Number(a.dataset.sheetOrder || 0) - Number(b.dataset.sheetOrder || 0),
    );
  function restoreBackground() {
    for (const node of inerted) node.inert = false;
    inerted.clear();
  }
  function isolate(parent, active) {
    for (const child of parent.children) {
      if (child === active || child.matches("script,style,link")) continue;
      if (child.contains(active)) isolate(child, active);
      else if (!child.inert) {
        child.inert = true;
        inerted.add(child);
      }
    }
  }
  function refresh() {
    restoreBackground();
    if (priorityRoot && !priorityRoot.isConnected) priorityRoot = null;
    const panels = sheets(),
      active = priorityRoot || panels
        .filter(
          (p) => !context.get(p)?.owner || context.get(p).owner === owner(),
        )
        .at(-1);
    for (const panel of panels) {
      const suspended = panel !== active;
      panel.classList.toggle("workspace-sheet-suspended", suspended);
      if (suspended) panel.setAttribute("aria-hidden", "true");
      else panel.removeAttribute("aria-hidden");
    }
    document.body.classList.toggle("workspace-panel-open", !!active);
    if (active) isolate(document.body, active);
    if (priorityRoot && !priorityRoot.contains(document.activeElement)) focusables(priorityRoot)[0]?.focus({ preventScroll: true });
    return active;
  }
  function focusables(panel) {
    return [
      ...panel.querySelectorAll(
        "button,a[href],input,select,textarea,summary,[tabindex]",
      ),
    ].filter(
      (e) =>
        !e.disabled &&
        e.tabIndex >= 0 &&
        e.getClientRects().length &&
        !e.closest("[inert]"),
    );
  }
  function register(panel) {
    if (panel.ownerDocument !== document || panel.classList.contains("agenda-inline-week")) return;
    panel.classList.add("workspace-sheet");
    if (context.has(panel)) return;
    context.set(panel, { focus: null, owner: "" });
    panel.addEventListener("close", () => {
      const active = refresh(),
        record = context.get(panel);
      if (active) {
        if (!active.contains(document.activeElement)) {
          const target =
            record.owner === owner() && active.contains(record.focus)
              ? record.focus
              : focusables(active)[0] || active;
          target.focus({ preventScroll: true });
        }
      } else if (record.owner === owner() && record.focus?.isConnected)
        record.focus.focus({ preventScroll: true });
    });
  }
  HTMLDialogElement.prototype.showModal = function () {
    if (this.ownerDocument !== document) return nativeModal.call(this);
    register(this);
    if (this.open) return;
    const record = context.get(this);
    record.focus = document.activeElement;
    record.owner = owner();
    this.dataset.sheetOrder = String(++order);
    this.style.setProperty("--sheet-layer", String(2200 + order));
    this.setAttribute("aria-modal", "true");
    // Native show() avoids stacked top-layer backdrops. Visibility and focus are managed here.
    restoreBackground();
    this.classList.remove("workspace-sheet-suspended");
    this.removeAttribute("aria-hidden");
    try {
      nativeShow.call(this);
      refresh();
    } catch (error) {
      refresh();
      throw error;
    }
  };
  HTMLDialogElement.prototype.close = function (...args) {
    const result = nativeClose.apply(this, args);
    if (
      this.ownerDocument === document &&
      this.classList.contains("workspace-sheet")
    )
      refresh();
    return result;
  };
  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented) return;
    const panel = (priorityRoot?.isConnected ? priorityRoot : null) || sheets()
      .filter((p) => !p.classList.contains("workspace-sheet-suspended"))
      .at(-1);
    if (!panel) return;
    if (event.key === "Escape") {
      event.preventDefault();
      if (panel.dispatchEvent(new Event("cancel", { cancelable: true })))
        panel.close();
    } else if (event.key === "Tab") {
      const list = focusables(panel),
        first = list[0],
        last = list.at(-1);
      if (!first) {
        event.preventDefault();
        panel.focus();
      } else if (
        event.shiftKey &&
        (!panel.contains(document.activeElement) ||
          document.activeElement === first)
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (!panel.contains(document.activeElement) ||
          document.activeElement === last)
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  });
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("dialog").forEach(register);
    new MutationObserver((changes) => {
      for (const change of changes)
        for (const node of change.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.matches("dialog")) register(node);
          node.querySelectorAll("dialog").forEach(register);
        }
      refresh();
    }).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
    });
    document.addEventListener("club-session-ready", () => {
      for (const panel of sheets())
        if (context.get(panel)?.owner && context.get(panel).owner !== owner())
          panel.close();
      refresh();
    });
    refresh();
  });
  window.workspaceSheets = {
    prioritize: (root) => {
      if (root && root.ownerDocument !== document) throw Error("Panneau hors de cette page.");
      priorityRoot = root;
      refresh();
    },
    register,
    open: (panel) => panel.showModal(),
    close: (panel) => panel.close(),
    refresh,
  };
})();
