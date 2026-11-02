// Position the ORIGINAL close controls externally: IDs, forms and guards stay intact.
document.addEventListener("DOMContentLoaded", () => {
  const records = new Map();
  let frame = 0;
  const controls =
    'button,a[href],[role="button"],input[type="button"],input[type="submit"]';
  const labelOf = (control) =>
    control.getAttribute("aria-label") ||
    (control.tagName === "INPUT" ? control.value : control.textContent.trim());
  const labelsOf = (control) => [
    control.getAttribute("aria-label") || "",
    control.tagName === "INPUT" ? control.value : control.textContent.trim(),
  ];
  const explicitClose = (control) =>
    !control.hidden &&
    labelsOf(control).some(
      (label) =>
        /^(fermer|close)(?:\b|\s)/i.test(label) || /^[×✕✖X]$/.test(label),
    );
  const cancelClose = (control) =>
    !control.hidden && /^Annuler$/i.test(labelOf(control));
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  const resize = new ResizeObserver(schedule);
  function update() {
    frame = 0;
    const panels = [
      ...document.querySelectorAll(
        'dialog[open],[role="dialog"]:not([hidden]),[role="alertdialog"]:not([hidden]),[data-closable-panel]:not([hidden])',
      ),
    ].filter((p) => p.getClientRects().length);
    for (const [panel] of records)
      if (!panels.includes(panel)) {
        resize.unobserve(panel);
        records.delete(panel);
      }
    for (const panel of panels) {
      const owned = [...panel.querySelectorAll(controls)].filter(
        (control) =>
          control.closest(
            'dialog,[role="dialog"],[role="alertdialog"],[data-closable-panel]',
          ) === panel,
      );
      const explicit = owned.filter(explicitClose);
      const source = explicit[0] || owned.find(cancelClose);
      const previous = records.get(panel);
      if (previous && previous !== source) {
        previous.classList.remove("external-modal-close");
        previous.style.removeProperty("left");
        previous.style.removeProperty("top");
      }
      for (const control of owned) {
        const duplicate = explicit.includes(control) && control !== source;
        if (control.classList.contains("duplicate-modal-close") !== duplicate)
          control.classList.toggle("duplicate-modal-close", duplicate);
      }
      if (!source) {
        records.delete(panel);
        resize.unobserve(panel);
        continue;
      }
      if (
        source !== previous ||
        !source.classList.contains("external-modal-close")
      ) {
        const label = /^[×✕✖X]$/.test(labelOf(source))
          ? "Fermer"
          : labelOf(source);
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
