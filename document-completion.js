// Completion is document metadata, saved atomically with the coach's existing library/outbox.
const documentCompletionEditing = { causerie: null, report: null };
function documentCompletionCurrent(kind) {
  return kind === "report" ? currentReport : getCompositionBoard();
}
function documentCompletionId(kind, payload) {
  return kind === "report" ? payload.id : payload.documentId;
}
function documentCompletionFingerprint(payload) {
  const canonical = (v) =>
    Array.isArray(v)
      ? v.map(canonical)
      : v && typeof v === "object"
        ? Object.fromEntries(
            Object.keys(v)
              .sort()
              .filter(
                (k) =>
                  ![
                    "updatedAt",
                    "teamContext",
                    "documentCompletion",
                    "clubReference",
                    "clubApproval",
                    "clubValidation",
                  ].includes(k),
              )
              .map((k) => [k, canonical(v[k])]),
          )
        : v;
  const body = JSON.stringify(canonical(payload));
  let a = 2166136261,
    b = 5381;
  for (let n = 0; n < body.length; n++) {
    a = Math.imul(a ^ body.charCodeAt(n), 16777619);
    b = Math.imul(b, 33) ^ body.charCodeAt(n);
  }
  return (
    body.length + ":" + (a >>> 0).toString(16) + ":" + (b >>> 0).toString(16)
  );
}
function documentCompletionIsCompleted(kind, payload) {
  const mark = payload?.documentCompletion;
  return !!(
    mark &&
    mark.version === 1 &&
    mark.kind === kind &&
    typeof mark.at === "string" &&
    Number.isFinite(Date.parse(mark.at)) &&
    mark.fingerprint === documentCompletionFingerprint(payload)
  );
}
function documentCompletionIsEditing(kind, payload) {
  return (
    documentCompletionEditing[kind] === documentCompletionId(kind, payload) &&
    !!documentCompletionEditing[kind]
  );
}
function documentCompletionBeginEdit(
  kind,
  payload = documentCompletionCurrent(kind),
) {
  documentCompletionEditing[kind] =
    documentCompletionId(kind, payload) || "draft";
  documentCompletionRefresh();
}
function documentCompletionEndEdit(kind) {
  documentCompletionEditing[kind] = null;
}
function documentCompletionRefresh() {
  for (const kind of ["causerie", "report"]) {
    const on =
        documentCompletionIsCompleted(kind, documentCompletionCurrent(kind)) &&
        !documentCompletionIsEditing(kind, documentCompletionCurrent(kind)),
      cls = "document-completed-" + kind;
    if (document.body.classList.contains(cls) !== on)
      document.body.classList.toggle(cls, on);
  }
}
function documentCompletionOpen(
  kind,
  payload = documentCompletionCurrent(kind),
) {
  const current = documentCompletionCurrent(kind);
  if (
    current !== payload &&
    !workspaceReplaceDraft(
      kind === "report" ? "report" : "composition",
      structuredClone(payload),
    )
  )
    return false;
  documentCompletionBeginEdit(kind, documentCompletionCurrent(kind));
  documentEntry.perform(() =>
    workspaceNavigation.run(
      kind === "report" ? "view-reports" : "view-pitch",
      () => {
        if (kind === "report") {
          reportTab = "general";
          renderReportTabs();
          renderReportContent();
        } else if (activateTerrainBoard("composition"))
          workspaceFlows.terrain.go(1);
      },
    ),
  );
  documentCompletionRefresh();
  return true;
}
function documentCompletionFinish(kind) {
  if (kind === "report" && !reportStatsPrepareForSave()) return false;
  if (kind === "causerie" && !activateTerrainBoard("composition")) return false;
  const payload = documentCompletionCurrent(kind),
    root = kind === "report" ? $("after-match") : $("match-plan-form"),
    invalid = [...root.querySelectorAll("input,textarea,select")].find(
      (input) => input.getClientRects().length && !input.checkValidity(),
    );
  if (invalid) {
    invalid.reportValidity();
    return false;
  }
  if (!(kind === "report" ? reportValid(payload) : valid(payload))) {
    notify("Vérifiez les champs avant de terminer. Le document reste ouvert.");
    return false;
  }
  const previous = {
    id: payload.documentId,
    title: payload.title,
    mark: payload.documentCompletion,
  };
  if (kind === "causerie") {
    if (!payload.documentId) payload.documentId = crypto.randomUUID();
    if (!payload.title?.trim())
      payload.title = (payload.team + " · " + payload.formation).slice(0, 100);
  }
  payload.documentCompletion = {
    version: 1,
    kind,
    at: new Date().toISOString(),
    fingerprint: documentCompletionFingerprint(payload),
  };
  try {
    const saved = kind === "report" ? saveReport() : saveNamedComposition();
    if (saved !== true)
      throw Error(
        "La sauvegarde n’est pas confirmée. Le document reste ouvert.",
      );
    const stored = documentCompletionCurrent(kind);
    coachStorageSet(
      kind === "report" ? "vestiaire-report-draft" : "vestiaire-draft",
      JSON.stringify(stored),
    );
    documentCompletionEndEdit(kind);
    for (const id of [
      "match-plan-dialog",
      "document-entry-dialog",
      "document-version-history",
      "workspace-save-dialog",
    ])
      if ($(id)?.open) $(id).close();
    documentCompletionRefresh();
    documentEntry.perform(() => workspaceNavigation.run("view-home"));
    const message =
      (kind === "report" ? "Bilan enregistré." : "Causerie enregistrée.") +
      " Vous pouvez le retrouver dans votre historique.";
    document.dispatchEvent(
      new CustomEvent("document-completed", {
        detail: {
          kind,
          id: documentCompletionId(kind, stored),
          coachId: activeCoach.id,
          teamId: activeCoachTeam.id,
        },
      }),
    );
    notify(kind === "report" ? reportStatsSaveNotice(message) : message);
    return true;
  } catch (error) {
    const current = documentCompletionCurrent(kind);
    if (previous.mark) current.documentCompletion = previous.mark;
    else delete current.documentCompletion;
    if (kind === "causerie" && !previous.id) {
      delete current.documentId;
      current.title = previous.title;
    }
    const status = $(
      kind === "report" ? "report-save-status" : "match-plan-status",
    );
    status.textContent =
      error.message || "Enregistrement impossible. Le document reste ouvert.";
    notify(status.textContent);
    return false;
  }
}
document.addEventListener("DOMContentLoaded", () => {
  for (const kind of ["causerie", "report"]) {
    const root = kind === "report" ? $("after-match") : $("task-causerie"),
      landing = el("section", "document-completion-card");
    landing.id = "document-completion-" + kind;
    landing.append(
      el(
        "h2",
        "",
        kind === "report" ? "Bilan enregistré" : "Causerie enregistrée",
      ),
      el(
        "p",
        "hint",
        "Votre document reste consultable. Ouvrez-le pour le relire ou commencez un nouveau document.",
      ),
    );
    const actions = el("div", "report-actions"),
      review = el("button", "export", "Relire / modifier"),
      fresh = el(
        "button",
        "primary",
        kind === "report"
          ? "Créer un nouveau bilan"
          : "Créer une nouvelle causerie",
      );
    review.type = fresh.type = "button";
    review.onclick = () => documentCompletionOpen(kind);
    fresh.onclick = () => {
      documentEntry.request(kind, () => {}, { force: true, newDocument: true });
    };
    actions.append(review, fresh);
    landing.append(actions);
    const selectLabel = el(
        "label",
        "report-field",
        "Historique des documents enregistrés",
      ),
      select = el("select"),
      open = el("button", "export", "Ouvrir le document sélectionné");
    selectLabel.append(select);
    open.type = "button";
    open.onclick = () => {
      const items =
        kind === "report"
          ? reportLibrary
          : saves
              .map((s) => s.state)
              .filter(
                (s) =>
                  !s.squadDirectory &&
                  !s.pionExplanation &&
                  s.boardKind !== "plan",
              );
      const selected = items.find(
        (p) => documentCompletionId(kind, p) === select.value,
      );
      if (selected) documentCompletionOpen(kind, selected);
    };
    landing.append(selectLabel, open);
    root.prepend(landing);
    const update = () => {
      const value = select.value,
        items =
          kind === "report"
            ? reportLibrary
            : saves
                .map((s) => s.state)
                .filter(
                  (s) =>
                    !s.squadDirectory &&
                    !s.pionExplanation &&
                    s.boardKind !== "plan",
                );
      select.replaceChildren(
        ...items
          .filter((p) => documentCompletionId(kind, p))
          .map(
            (p) =>
              new Option(
                [
                  kind === "report" ? p.info.date : p.matchPreparation?.date,
                  p.title || p.team || "Document",
                ]
                  .filter(Boolean)
                  .join(" · "),
                documentCompletionId(kind, p),
              ),
          ),
      );
      if ([...select.options].some((o) => o.value === value))
        select.value = value;
      open.disabled = !select.options.length;
    };
    const render = kind === "report" ? renderReportLibrary : renderSaves;
    if (kind === "report")
      renderReportLibrary = function () {
        render();
        update();
      };
    else
      renderSaves = function () {
        render();
        update();
      };
    update();
  }
  const submit = $("match-plan-form").querySelector("[type=submit]");
  submit.textContent = "Valider et fermer la causerie";
  $("match-plan-form").onsubmit = (event) => {
    event.preventDefault();
    documentCompletionFinish("causerie");
  };
  const finish = el("button", "primary", "Terminer le bilan");
  finish.type = "button";
  finish.id = "report-finish";
  finish.onclick = () => documentCompletionFinish("report");
  $("after-match")
    .querySelector(".reports-heading .report-actions")
    .append(finish);
  const next = $("report-next"),
    previous = next.onclick;
  next.onclick = () =>
    reportTab === "preview" ? documentCompletionFinish("report") : previous();
  const label = () => {
    if (reportTab === "preview") next.textContent = "Terminer le bilan ✓";
  };
  for (const key of ["tabs", "content"]) {
    if (key === "tabs") {
      const render = renderReportTabs;
      renderReportTabs = function () {
        render();
        label();
      };
    } else {
      const render = renderReportContent;
      renderReportContent = function () {
        render();
        label();
      };
    }
  }
  label();
  const working = homeWorkingCopies;
  homeWorkingCopies = function () {
    return working().filter((item) =>
      item.key === "report"
        ? !documentCompletionIsCompleted("report", currentReport)
        : item.key === "composition"
          ? !documentCompletionIsCompleted("causerie", getCompositionBoard())
          : true,
    );
  };
  const replace = workspaceReplaceDraft;
  workspaceReplaceDraft = function (kind, payload, ...args) {
    const result = replace(kind, payload, ...args);
    if (result && ["report", "composition"].includes(kind))
      documentCompletionBeginEdit(
        kind === "report" ? "report" : "causerie",
        documentCompletionCurrent(kind === "report" ? "report" : "causerie"),
      );
    return result;
  };
  new MutationObserver(documentCompletionRefresh).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  documentCompletionRefresh();
});
