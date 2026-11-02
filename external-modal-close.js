// Position the ORIGINAL close controls externally: IDs, forms and guards stay intact.
document.addEventListener("DOMContentLoaded", () => {
  const records = new Map();
  let frame = 0;
  const candidate = (button) =>
    !button.hidden &&
    (/^(fermer|close)(\b|\s)/i.test(button.getAttribute("aria-label") || "") ||
      /^(Fermer|Annuler|×|✕|✖|Close)$/i.test(button.textContent.trim()));
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const resize = new ResizeObserver(schedule);
  function update() {
    frame = 0;
    const panels = [
      ...document.querySelectorAll(
        'dialog[open],[role="dialog"]:not([hidden]),[data-closable-panel]:not([hidden])',
      ),
    ].filter((p) => p.getClientRects().length);
    for (const [panel] of records)
      if (!panels.includes(panel)) {
        resize.unobserve(panel);
        records.delete(panel);
      }
    for (const panel of panels) {
      let source = records.get(panel);
      if (!source || !panel.contains(source)) {
        source = [...panel.querySelectorAll("button")].find(
          (b) =>
            candidate(b) &&
            b.closest('dialog,[role="dialog"],[data-closable-panel]') === panel,
        );
        if (!source) continue;
        const label =
          source.getAttribute("aria-label") ||
          (/^[×✕✖]$/.test(source.textContent.trim())
            ? "Fermer"
            : source.textContent.trim());
        source.setAttribute("aria-label", label);
        source.title = label;
        source.classList.add("external-modal-close");
        panel.classList.add("external-close-panel");
        records.set(panel, source);
        resize.observe(panel);
      }
      const rect = panel.getBoundingClientRect();
      const left =
          Math.max(8, Math.min(innerWidth - 52, rect.right - 44)) + "px",
        top = Math.max(8, rect.top - 52) + "px";
      if (source.style.left !== left) source.style.left = left;
      if (source.style.top !== top) source.style.top = top;
    }
  }
  new MutationObserver(schedule).observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["open", "hidden", "disabled", "aria-label"],
  });
  window.addEventListener("resize", schedule);
  window.addEventListener("scroll", schedule, true);
  window.visualViewport?.addEventListener("resize", schedule);
  window.visualViewport?.addEventListener("scroll", schedule);
  window.externalModalClose = { refresh: schedule };
  schedule();
});
