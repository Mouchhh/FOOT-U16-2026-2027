// Shared presentation adapter: keep each panel's original controls and save/error handlers.
(() => {
  "use strict";
  const nativeShow = HTMLDialogElement.prototype.show;
  const nativeModal = HTMLDialogElement.prototype.showModal;
  const context = new WeakMap();
  let order = 0;
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
  // Decisions that protect existing work retain native modal focus/inert behavior.
  const decision = (panel) =>
    /(?:delete|confirm|conflict|document-entry|document-name)/i.test(
      panel.id + " " + panel.className,
    );
  function register(panel) {
    if (panel.ownerDocument !== document) return;
    panel.classList.add("workspace-sheet");
    if (context.has(panel)) return;
    context.set(panel, { focus: null, owner: "" });
    panel.addEventListener("close", () => {
      const record = context.get(panel);
      if (
        !sheets().length &&
        record.focus?.isConnected &&
        record.owner === owner()
      )
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
    this.setAttribute("aria-modal", decision(this) ? "true" : "false");
    return (decision(this) ? nativeModal : nativeShow).call(this);
  };
  // Non-modal sheets support Escape and honor existing cancel guards (busy/unsaved work).
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || event.defaultPrevented) return;
    const panel = sheets().at(-1);
    if (!panel || panel.matches(":modal")) return;
    event.preventDefault();
    if (panel.dispatchEvent(new Event("cancel", { cancelable: true })))
      panel.close();
  });
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("dialog").forEach(register);
    const observer = new MutationObserver((changes) => {
      for (const change of changes)
        for (const node of change.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          if (node.matches("dialog")) register(node);
          node.querySelectorAll("dialog").forEach(register);
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // A panel must never continue editing the previous coach/team after a switch.
    document.addEventListener("club-session-ready", () => {
      for (const panel of sheets())
        if (context.get(panel)?.owner && context.get(panel).owner !== owner())
          panel.close();
    });
  });
  window.workspaceSheets = {
    register,
    open: (panel) => panel.showModal(),
    close: (panel) => panel.close(),
  };
})();
