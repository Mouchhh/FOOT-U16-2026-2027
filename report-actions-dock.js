// A body-level action bar avoids Safari's sticky/overflow/transform containing blocks.
document.addEventListener("DOMContentLoaded", () => {
  const root = $("after-match"),
    footer = $("report-next")?.closest(".flow-footer");
  if (!root || !footer) return;
  const spacer = el("div", "report-actions-clearance");
  spacer.setAttribute("aria-hidden", "true");
  footer.before(spacer);
  footer.classList.add("report-actions-dock");
  footer.setAttribute("aria-label", "Navigation du bilan");
  document.body.append(footer);
  let frame = 0;
  function measure() {
    frame = 0;
    if (
      !document.body.classList.contains("reports-mode") ||
      document.body.classList.contains("document-completed-report")
    )
      return;
    const rect = root.getBoundingClientRect();
    const left = Math.max(12, rect.left),
      width = Math.max(
        0,
        Math.min(rect.width, document.documentElement.clientWidth - left - 12),
      );
    footer.style.left = left + "px";
    footer.style.width = width + "px";
    document.body.style.setProperty(
      "--report-actions-height",
      Math.ceil(footer.getBoundingClientRect().height) + "px",
    );
  }
  function schedule() {
    if (!frame) frame = requestAnimationFrame(measure);
  }
  new ResizeObserver(schedule).observe(root);
  new ResizeObserver(schedule).observe(footer);
  new MutationObserver(schedule).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  window.addEventListener("resize", schedule);
  window.visualViewport?.addEventListener("resize", schedule);
  window.visualViewport?.addEventListener("scroll", schedule);
  document.addEventListener("click", schedule);
  schedule();
});
