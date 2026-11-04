// One visible validation action; technical controls remain callable by existing save workflows.
document.addEventListener("DOMContentLoaded", () => {
  const root = $("after-match"),
    pdf = $("report-pdf");
  const remove = $("report-delete"),
    oldToolbar = remove.closest(".document-delete-toolbar");
  root.querySelector(".reports-heading .report-actions").append(remove);
  oldToolbar?.remove();
  const parking = el("div");
  parking.hidden = true;
  root.append(parking);
  parking.append(pdf);
  pdf.textContent = "Exporter le bilan";
  function paint() {
    const next = $("report-next");
    next.textContent = "Valider le bilan";
    next.onclick = () => documentCompletionFinish("report");
    next.classList.add("report-clean-validate");
    const tools = $("report-content").querySelector(".report-preview-tools");
    if (reportTab === "preview" && tools) {
      tools.replaceChildren(pdf);
      pdf.hidden = false;
    } else parking.append(pdf);
  }
  const before = renderReportContent;
  renderReportContent = function (...args) {
    parking.append(pdf);
    const value = before.apply(this, args);
    paint();
    return value;
  };
  const tabs = renderReportTabs;
  renderReportTabs = function (...args) {
    const value = tabs.apply(this, args);
    paint();
    return value;
  };
  paint();
});
