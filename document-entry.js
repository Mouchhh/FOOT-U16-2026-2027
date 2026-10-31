// Explicit document entry: context lookup → choice → resume/create → editor.
// Archived versions are local to this coach and are never published automatically.
function documentEntryContext(kind, payload) {
  const p = kind === "report" ? payload.info : payload.matchPreparation;
  return {
    id: kind === "report" ? payload.id : payload.documentId || "draft",
    key: kind === "report" ? payload.agendaSourceKey : payload.fffFixtureKey,
    date: p?.date || "",
    opponent: p?.opponent || p?.match || "",
    team: kind === "report" ? p?.team : payload.team,
    category: kind === "report" ? p?.category : payload.category,
  };
}
function documentEntrySameContext(a, b) {
  const normal = (v) =>
    String(v || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase();
  if (a.key && b.key) return a.key === b.key;
  if (a.date && b.date && a.opponent && b.opponent)
    return (
      a.date === b.date &&
      normal(a.opponent) === normal(b.opponent) &&
      (!a.category ||
        !b.category ||
        normal(a.category) === normal(b.category)) &&
      (!a.team || !b.team || normal(a.team) === normal(b.team))
    );
  return !!a.id && a.id === b.id;
}
function documentEntryMeaningful(kind, payload) {
  if (kind === "causerie") {
    const p = payload.matchPreparation;
    return (
      !!p &&
      (["context", "defensive", "offensive", "specific"].some((k) =>
        p[k]?.trim(),
      ) ||
        p.objectives.some((v) => v.trim()))
    );
  }
  const r = payload,
    plan = r.preparation?.plan;
  return (
    !!r.title?.trim() ||
    Object.values(r.analysis).some((v) => v.trim()) ||
    Object.values(r.plan).some((v) => v.trim()) ||
    Object.values(r.ratings).some((v) => v.score !== "" || v.note.trim()) ||
    r.players.length > 0 ||
    r.events.length > 0 ||
    [
      "competition",
      "round",
      "time",
      "stadium",
      "goalsFor",
      "goalsAgainst",
      "halfFor",
      "halfAgainst",
      "scorers",
    ].some((k) => r.info[k]?.trim()) ||
    ["date", "opponent", "conditions"].some(
      (k) =>
        r.info[k]?.trim() &&
        r.info[k] !==
          {
            date: plan?.date,
            opponent: plan?.opponent,
            conditions: plan?.context,
          }[k],
    )
  );
}
function documentEntryPayloadValid(kind, payload) {
  return kind === "report"
    ? reportValid(payload)
    : valid(payload) &&
        !payload.squadDirectory &&
        !payload.pionExplanation &&
        payload.boardKind !== "plan";
}
function documentEntrySignature(payload) {
  return JSON.stringify({ ...payload, updatedAt: "" });
}
function documentEntryArchives() {
  try {
    const rows = JSON.parse(
      coachStorageGet("vestiaire-document-versions") || "[]",
    );
    return Array.isArray(rows) && rows.length <= 100
      ? rows.filter(
          (r) =>
            r &&
            ["causerie", "report"].includes(r.kind) &&
            typeof r.at === "string" &&
            typeof r.id === "string" &&
            documentEntryPayloadValid(r.kind, r.payload),
        )
      : [];
  } catch {
    return [];
  }
}
document.addEventListener("DOMContentLoaded", () => {
  let bypass = 0,
    pending = null;
  const accepted = { causerie: null, report: null };
  const state = { phase: "idle", kind: null, context: null, error: "" };
  const perform = (fn) => {
    bypass++;
    try {
      return fn();
    } finally {
      bypass--;
    }
  };
  const current = (kind) =>
    kind === "report" ? currentReport : getCompositionBoard();
  const key = (kind, payload) =>
    activeCoach.id +
    ":" +
    kind +
    ":" +
    (kind === "report" ? payload.id : payload.documentId || "draft");
  const inside = (kind) =>
    kind === "report"
      ? document.body.classList.contains("reports-mode")
      : workspaceFlows.terrain.index() === 1 &&
        ![
          "home-mode",
          "training-mode",
          "reports-mode",
          "coach-agenda-mode",
          "club-network-mode",
          "squad-mode",
          "simple-mode",
        ].some((c) => document.body.classList.contains(c));
  // Preserve the full previous payload before replacing any draft.
  function archive(kind, payload) {
    if (!documentEntryMeaningful(kind, payload)) return true;
    if (!documentEntryPayloadValid(kind, payload)) {
      state.error =
        "Corrigez les champs signalés avant de créer une nouvelle version. Votre travail reste ouvert.";
      return false;
    }
    const rows = documentEntryArchives();
    if (
      rows.some(
        (r) =>
          r.kind === kind &&
          documentEntrySignature(r.payload) === documentEntrySignature(payload),
      )
    )
      return true;
    if (rows.length >= 100) {
      state.error =
        "Les versions précédentes sont pleines. Enregistrez votre document et libérez le stockage avant de recommencer.";
      return false;
    }
    try {
      rows.unshift({
        id: crypto.randomUUID(),
        kind,
        at: new Date().toISOString(),
        payload: structuredClone(payload),
      });
      coachStorageSet("vestiaire-document-versions", JSON.stringify(rows));
      refreshHistory();
      return true;
    } catch {
      state.error =
        "Impossible de conserver la version précédente. Votre travail reste ouvert et n’a pas été remplacé.";
      return false;
    }
  }
  function candidates(kind, context) {
    const live = current(kind),
      saved = kind === "report" ? reportLibrary : saves.map((s) => s.state),
      rows = [
        { payload: live, label: "Brouillon en cours" },
        ...saved.map((payload) => ({
          payload,
          label: "Document enregistré",
          saved: true,
        })),
        ...documentEntryArchives()
          .filter((r) => r.kind === kind)
          .map((r) => ({
            payload: r.payload,
            label:
              "Version précédente · " +
              new Date(r.at).toLocaleString("fr-FR", {
                timeZone: "Europe/Paris",
              }),
          })),
      ],
      seen = new Set();
    return rows.filter((row) => {
      const p = row.payload;
      if (
        context.id === "draft" &&
        !context.key &&
        !context.date &&
        !context.opponent &&
        p !== live
      )
        return false;
      if (
        !documentEntryPayloadValid(kind, p) ||
        !documentEntrySameContext(context, documentEntryContext(kind, p)) ||
        !(documentEntryMeaningful(kind, p) || (kind === "report" && row.saved))
      )
        return false;
      const signature = documentEntrySignature(p);
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    });
  }
  function blank(kind, context, source) {
    if (kind === "causerie") {
      const live = getCompositionBoard(),
        next = structuredClone(
          documentEntrySameContext(context, documentEntryContext(kind, live))
            ? live
            : source,
        );
      next.coach = activeCoach.name;
      next.notes = "";
      delete next.clubApproval;
      delete next.clubValidation;
      const old = next.matchPreparation || newMatchPreparation(),
        same = documentEntrySameContext(
          context,
          documentEntryContext(kind, next),
        );
      next.documentId = crypto.randomUUID();
      if (context.key) next.fffFixtureKey = context.key;
      else delete next.fffFixtureKey;
      next.matchPreparation = {
        ...newMatchPreparation(),
        date: context.date,
        title: same ? old.title : "",
        match: same ? old.match : context.opponent,
        opponent: context.opponent,
      };
      return next;
    }
    const next = newReport(),
      info = source?.info || next.info;
    next.title = "";
    next.info = {
      ...emptyObject(reportInfo),
      team: context.team || info.team || "",
      coach: activeCoach.name,
      category: context.category || info.category || "",
      date: context.date,
      opponent: context.opponent,
      venue: info.venue || "Domicile",
    };
    for (const k of [
      "time",
      "competition",
      "round",
      "stadium",
      "formation",
      "duration",
    ])
      next.info[k] = info[k] || "";
    if (context.key) next.agendaSourceKey = context.key;
    if (source?.preparation) {
      next.preparation = structuredClone(source.preparation);
      for (const objective of next.preparation.objectives) {
        objective.status = "Non évalué";
        objective.observation = "";
      }
    } else if (
      !documentEntrySameContext(
        context,
        documentEntryContext("causerie", getCompositionBoard()),
      )
    )
      delete next.preparation;
    return next;
  }
  function replace(kind, payload) {
    return perform(() =>
      workspaceReplaceDraft(
        kind === "report" ? "report" : "composition",
        payload,
      ),
    );
  }
  function openEditor(kind, continuation, fresh = false) {
    state.phase = "opening";
    if (fresh && kind === "report") reportTab = "general";
    perform(() => continuation());
    if (fresh && kind === "report") {
      renderReportTabs();
      renderReportContent();
    }
    accepted[kind] = key(kind, current(kind));
    state.kind = kind;
    state.context = documentEntryContext(kind, current(kind));
    state.error = "";
    state.phase = "idle";
  }
  // A pending choice never mutates the active document. Only an explicit action can replace it.
  function request(kind, continuation, options = {}) {
    if (bypass) return continuation();
    if (pending && !pending.open) {
      pending.remove();
      pending = null;
    }
    if (pending) return false;
    if (kind === "report" && reportAutosaveTimer) flushReportDraft();
    if (!workspaceNavigationCanLeave()) return false;
    if (
      !options.force &&
      inside(kind) &&
      accepted[kind] === key(kind, current(kind))
    )
      return perform(continuation);
    const matchContext = documentEntryContext(
        "causerie",
        getCompositionBoard(),
      ),
      fromMatch = ![
        "home-mode",
        "training-mode",
        "reports-mode",
        "coach-agenda-mode",
        "club-network-mode",
        "squad-mode",
      ].some((c) => document.body.classList.contains(c));
    const context =
      (options.context
        ? {
            id: "",
            date: "",
            opponent: "",
            team: "",
            category: "",
            ...options.context,
          }
        : null) ||
      (kind === "report" &&
      fromMatch &&
      matchContext.date &&
      matchContext.opponent
        ? matchContext
        : documentEntryContext(kind, current(kind)));
    state.phase = "checking";
    state.kind = kind;
    state.context = structuredClone(context);
    state.error = "";
    const rows = candidates(kind, context);
    if (!rows.length) {
      if (
        options.managesContext &&
        !documentEntrySameContext(
          context,
          documentEntryContext(kind, current(kind)),
        ) &&
        !archive(kind, current(kind))
      ) {
        notify(state.error);
        state.phase = "error";
        return false;
      }
      if (
        !options.managesContext &&
        !documentEntrySameContext(
          context,
          documentEntryContext(kind, current(kind)),
        )
      ) {
        const old = current(kind);
        if (
          !archive(kind, old) ||
          !replace(kind, blank(kind, context, kind === "report" ? null : old))
        ) {
          notify(state.error || "Le document ouvert reste conservé.");
          state.phase = "error";
          return false;
        }
      }
      openEditor(kind, continuation, true);
      return true;
    }
    const owner = activeCoach.id,
      generation = clubNetworkGeneration,
      initial = documentEntrySignature(current(kind));
    const dialog = el("dialog", "document-entry-dialog");
    dialog.id = "document-entry-dialog";
    dialog.setAttribute("aria-labelledby", "document-entry-title");
    const head = el("div", "section-heading"),
      cancel = el("button", "export", "Retour");
    cancel.type = "button";
    cancel.onclick = () => dialog.close();
    head.append(
      el(
        "h2",
        "",
        kind === "report" ? "Un bilan existe déjà" : "Une causerie existe déjà",
      ),
      cancel,
    );
    head.querySelector("h2").id = "document-entry-title";
    const description = el(
      "p",
      "document-entry-context",
      [
        trainingDateValid(context.date)
          ? agendaCalendarDateLabel(context.date)
          : context.date,
        String(context.opponent || "")
          .split("\n")[0]
          .slice(0, 160),
        context.category,
      ]
        .filter(Boolean)
        .join(" · ") || "Votre travail en cours",
    );
    const versions = el("label", "report-field", "Document à reprendre"),
      select = el("select");
    select.id = "document-entry-version";
    rows.forEach((row, i) =>
      select.append(
        new Option(
          row.label +
            " · " +
            (row.payload.title ||
              row.payload.info?.opponent ||
              row.payload.matchPreparation?.match ||
              "Sans titre"),
          String(i),
        ),
      ),
    );
    versions.append(select);
    versions.hidden = rows.length === 1;
    const actions = el("div", "document-entry-choices"),
      resume = el("button", "primary document-entry-choice"),
      create = el("button", "export document-entry-choice");
    resume.type = create.type = "button";
    resume.id = "document-entry-resume";
    create.id = "document-entry-create";
    resume.append(
      el("strong", "", "Reprendre / Modifier"),
      el(
        "span",
        "",
        "Retrouver le contenu existant et continuer votre travail.",
      ),
    );
    create.append(
      el(
        "strong",
        "",
        kind === "report"
          ? "Créer un nouveau bilan"
          : "Créer une nouvelle causerie",
      ),
      el(
        "span",
        "",
        "Repartir avec un texte vierge. L’ancien travail sera conservé dans les versions précédentes.",
      ),
    );
    actions.append(resume, create);
    const status = el("p", "hint");
    status.setAttribute("role", "status");
    const alive = () =>
      activeCoach.id === owner &&
      clubNetworkGeneration === generation &&
      documentEntrySignature(current(kind)) === initial;
    function choose(fresh) {
      if (!alive()) {
        status.textContent =
          "Le compte ou le document a changé. Fermez cette fenêtre puis rouvrez l’onglet.";
        state.error = status.textContent;
        state.phase = "error";
        return;
      }
      const row = rows[Number(select.value)];
      if (!row) return;
      state.phase = fresh ? "creating" : "opening";
      state.error = "";
      resume.disabled = create.disabled = true;
      let next = fresh
        ? blank(kind, context, row.payload)
        : structuredClone(row.payload);
      if (kind === "report" && context.key) next.agendaSourceKey = context.key;
      if (
        (fresh && !archive(kind, row.payload)) ||
        (JSON.stringify(next) !== JSON.stringify(current(kind)) &&
          !archive(kind, current(kind)))
      ) {
        status.textContent = state.error;
        resume.disabled = create.disabled = false;
        state.phase = "error";
        return;
      }
      if (
        JSON.stringify(next) !== JSON.stringify(current(kind)) &&
        !replace(kind, next)
      ) {
        status.textContent =
          "Le nouveau document n’a pas pu être ouvert. L’existant est conservé.";
        state.error = status.textContent;
        resume.disabled = create.disabled = false;
        state.phase = "error";
        return;
      }
      dialog.close();
      openEditor(kind, continuation, fresh);
    }
    resume.onclick = () => choose(false);
    create.onclick = () => choose(true);
    dialog.append(
      head,
      description,
      versions,
      actions,
      status,
      el(
        "p",
        "hint",
        "Versions précédentes conservées sur cet appareil, dans votre espace personnel.",
      ),
    );
    document.body.append(dialog);
    pending = dialog;
    state.phase = "choice";
    dialog.addEventListener(
      "close",
      () => {
        const closingCurrent = pending === dialog;
        if (closingCurrent) pending = null;
        dialog.remove();
        if (
          closingCurrent &&
          (state.phase === "choice" || state.phase === "error")
        )
          state.phase = "idle";
      },
      { once: true },
    );
    dialog.showModal();
    resume.focus();
    return false;
  }
  function showHistory(kind) {
    if (pending?.open || $("document-version-history")?.open) return;
    const rows = documentEntryArchives().filter((r) => r.kind === kind),
      owner = activeCoach.id,
      generation = clubNetworkGeneration,
      dialog = el("dialog", "document-entry-dialog");
    dialog.id = "document-version-history";
    const close = el("button", "export", "Fermer");
    close.type = "button";
    close.onclick = () => dialog.close();
    dialog.append(
      el("h2", "", "Versions précédentes"),
      close,
      el(
        "p",
        "hint",
        "Copies conservées sur cet appareil, dans votre espace personnel.",
      ),
    );
    if (!rows.length) dialog.append(el("p", "", "Aucune version précédente."));
    for (const r of rows) {
      const section = el("section", "document-version-row"),
        restore = el("button", "export", "Reprendre cette version");
      restore.type = "button";
      section.append(
        el(
          "strong",
          "",
          r.payload.title ||
            r.payload.info?.opponent ||
            r.payload.matchPreparation?.match ||
            "Sans titre",
        ),
        el(
          "p",
          "hint",
          new Date(r.at).toLocaleString("fr-FR", { timeZone: "Europe/Paris" }),
        ),
        restore,
      );
      restore.onclick = () => {
        if (owner !== activeCoach.id || generation !== clubNetworkGeneration)
          return dialog.close();
        if (!archive(kind, current(kind)) || !replace(kind, r.payload))
          return notify(state.error || "Restauration impossible.");
        dialog.close();
        openEditor(kind, () => {
          if (kind === "report")
            navigation("view-reports", () => {
              reportTab = "general";
              renderReportTabs();
              renderReportContent();
            });
          else
            navigation("view-pitch", () => {
              activateTerrainBoard("composition");
              terrainGo(1);
              renderMatchPreparation();
            });
        });
      };
      dialog.append(section);
    }
    document.body.append(dialog);
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    dialog.showModal();
  }
  function refreshHistory() {
    for (const kind of ["causerie", "report"]) {
      const button = $("document-versions-" + kind);
      if (button)
        button.hidden = !documentEntryArchives().some((r) => r.kind === kind);
    }
  }
  // Route main tabs, match steps and agenda shortcuts through the same entry policy.
  const navigation = workspaceNavigation.run;
  workspaceNavigation.run = function (parent, action) {
    if (parent !== "view-reports" || bypass) return navigation(parent, action);
    return request("report", () => navigation(parent, action));
  };
  const terrainGo = workspaceFlows.terrain.go;
  workspaceFlows.terrain.go = function (index) {
    if (index !== 1) {
      accepted.causerie = null;
      return terrainGo(index);
    }
    if (
      bypass ||
      document.body.classList.contains("simple-mode") ||
      terrainBoardKind !== "composition"
    )
      return terrainGo(index);
    return request("causerie", () => terrainGo(index));
  };
  // Direct navigation buttons use the same transition before the old form can appear.
  document.addEventListener(
    "click",
    (event) => {
      if (bypass || workspaceNavigationRouting) return;
      const button = event.target.closest("#view-reports");
      if (!button) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      request(
        "report",
        () =>
          navigation("view-reports", () =>
            window.taskWorkspace?.enter("view-reports"),
          ),
        { force: true },
      );
    },
    true,
  );
  // A saved agenda report must not replace the live draft before the choice.
  const calendarEvents = agendaCalendarEvents;
  agendaCalendarEvents = function () {
    return calendarEvents().map((event) => {
      if (event.kind !== "report") return event;
      return {
        ...event,
        open: () => {
          const reportId = event.id.slice("report:".length);
          const payload =
            currentReport.id === reportId
              ? currentReport
              : reportLibrary.find((r) => r.id === reportId);
          if (!payload)
            return notify(
              "Ce bilan n’est plus disponible. Actualisez l’agenda.",
            );
          return request(
            "report",
            () =>
              navigation("view-reports", () => {
                reportTab = "general";
                renderReportTabs();
                renderReportContent();
              }),
            {
              context: documentEntryContext("report", payload),
              force: true,
              managesContext: true,
            },
          );
        },
      };
    });
  };
  const agendaReport = agendaEventReport;
  agendaEventReport = function (event, date) {
    const board = event && agendaEventBoard(event),
      f = event?.fff;
    const context =
      event?.kind === "report"
        ? documentEntryContext(
            "report",
            reportLibrary.find((r) => "report:" + r.id === event.id) ||
              currentReport,
          )
        : {
            id: "agenda",
            key: event ? agendaMatchKeys(event)[0] : null,
            date: event?.date || date,
            opponent: f?.opponent || board?.matchPreparation?.opponent || "",
            category: event?.category || "",
            team: f?.team || board?.team || "",
          };
    return request("report", () => agendaReport(event, date), {
      context,
      force: true,
      managesContext: true,
    });
  };
  const agendaTalk = agendaEventCauserie;
  agendaEventCauserie = function (event, date) {
    const board = event && agendaEventBoard(event),
      f = event?.fff;
    const context = {
      id: board?.documentId || "agenda",
      key: f?.key,
      date: event?.date || date,
      opponent: f?.opponent || board?.matchPreparation?.opponent || "",
      team: f?.team || board?.team || "",
      category: event?.category || "",
    };
    return request("causerie", () => agendaTalk(event, date), {
      context,
      force: true,
      managesContext: true,
    });
  };
  $("report-new").onclick = () =>
    request(
      "report",
      () =>
        navigation("view-reports", () => {
          reportTab = "general";
          renderReportTabs();
          renderReportContent();
        }),
      { force: true },
    );
  for (const kind of ["causerie", "report"]) {
    const button = el("button", "export", "Versions précédentes");
    button.type = "button";
    button.id = "document-versions-" + kind;
    button.onclick = () => showHistory(kind);
    (kind === "report"
      ? $("after-match").querySelector(".reports-heading .report-actions")
      : $("task-causerie")
    ).append(button);
  }
  const enterTask = taskWorkspace.enter;
  taskWorkspace.enter = function (parent) {
    if (
      parent === "view-pitch" &&
      workspaceFlows.terrain.index() === 1 &&
      terrainBoardKind === "composition" &&
      !document.body.classList.contains("simple-mode") &&
      !bypass
    )
      return request("causerie", () => enterTask(parent), { force: true });
    return enterTask(parent);
  };
  new MutationObserver(() => {
    if (!inside("causerie")) accepted.causerie = null;
    if (!inside("report")) accepted.report = null;
  }).observe(document.body, { attributes: true, attributeFilter: ["class"] });
  const clear = clubNetworkClear;
  clubNetworkClear = function () {
    pending?.close();
    $("document-version-history")?.close();
    accepted.causerie = accepted.report = null;
    state.phase = "idle";
    clear();
    refreshHistory();
  };
  window.documentEntry = {
    request,
    perform,
    history: showHistory,
    getState: () => structuredClone(state),
    refresh: refreshHistory,
  };
  refreshHistory();
  function checkRestoredEntry() {
    if (pending || (accountCoachBinding && !clubNetworkBound())) return;
    if (inside("report") && accepted.report !== key("report", currentReport))
      request("report", () => {
        renderReportTabs();
        renderReportContent();
      });
    else if (
      inside("causerie") &&
      accepted.causerie !== key("causerie", getCompositionBoard())
    )
      request("causerie", () => renderMatchPreparation());
  }
  document.addEventListener("club-session-ready", () =>
    queueMicrotask(checkRestoredEntry),
  );
  window.addEventListener("popstate", () => queueMicrotask(checkRestoredEntry));
  checkRestoredEntry();
});
