// Team-scoped causerie continuity: link saved preparation and resume its report.
(() => {
  "use strict";
  const normalize = (value) => coachTeamNormalize(value);
  function candidates() {
    const rows = new Map();
    const add = (key, source, label, trusted = false) => {
      if (
        !source ||
        source.squadDirectory ||
        source.pionExplanation ||
        source.boardKind === "plan" ||
        !valid(source) ||
        (source.documentCompletion &&
          !documentCompletionIsCompleted("causerie", source)) ||
        (!trusted && !coachTeamOwns(source)) ||
        (source.teamContext && !coachTeamOwns(source)) ||
        !source.matchPreparation ||
        !validMatchPreparation(source.matchPreparation) ||
        !matchPreparationFilled(source.matchPreparation) ||
        !Array.isArray(source.players)
      )
        return;
      if (!rows.has(key))
        rows.set(key, {
          key,
          source,
          label: source.title?.trim() || label || "Causerie enregistrée",
        });
    };
    for (const save of saves)
      add(
        "board:" + (save.state.documentId || save.date),
        save.state,
        save.name || save.state.title || "Causerie enregistrée",
      );
    return [...rows.values()];
  }
  function merge(source, report = currentReport) {
    const next = structuredClone(report),
      roster = squadPlayers();
    const snapshot = reportPreparationSnapshot(source);
    if (
      next.preparation?.objectives.some(
        (old) =>
          (old.observation || old.status !== "Non évalué") &&
          !snapshot.objectives.some((item) => item.text === old.text),
      )
    ) {
      throw Error(
        "Cette causerie remplacerait des objectifs déjà évalués. Conservez ce bilan et créez un nouveau bilan pour cette préparation.",
      );
    }
    snapshot.imported = true;
    snapshot.sourceCompositionId = source.documentId;
    snapshot.sourceTitle = source.title || "Causerie enregistrée";
    // Preserve post-match observations if the same priority was already evaluated.
    snapshot.objectives = snapshot.objectives.map(
      (objective) =>
        next.preparation?.objectives.find(
          (old) => old.text === objective.text,
        ) || objective,
    );
    next.preparation = snapshot;
    next.info.formation = source.formation || next.info.formation;
    next.info.date = source.matchPreparation.date;
    next.info.opponent = source.matchPreparation.opponent;
    const location=reportMatchLocation(next,source);next.info.venue=location.venue;
    if(!next.info.stadium)next.info.stadium=location.stadium;
    if(location.fixture){if(!next.info.time)next.info.time=location.fixture.time||'';if(!next.info.competition)next.info.competition=location.fixture.competition||'';if(!next.agendaSourceKey)next.agendaSourceKey=location.fixture.key;}
    if (!next.title?.trim())
      next.title = (
        "Bilan · " + (source.title || source.matchPreparation.match || "Match")
      ).slice(0, 100);
    if (!next.info.conditions)
      next.info.conditions = source.matchPreparation.context;
    if (!next.plan.priority)
      next.plan.priority = snapshot.objectives.map((o) => o.text).join("\n");
    for (const player of source.players) {
      const linked = playerStatsResolve(player, roster);
      const existing = next.players.find((row) =>
        linked
          ? playerStatsResolve(row, roster)?.id === linked.id
          : row.id === player.id && row.name === player.name,
      );
      if (existing) continue;
      if (next.players.length >= 40)
        throw Error(
          "Import impossible : le bilan dépasserait 40 joueurs. Les données existantes sont conservées.",
        );
      let id = player.id || crypto.randomUUID();
      if (next.players.some((row) => row.id === id)) id = crypto.randomUUID();
      next.players.push({
        id,
        ...(linked ? { squadPlayerId: linked.id } : {}),
        name: player.name,
        number: String(player.number),
        role: player.role === "sub" ? "Impacteur / Finisseur" : "Titulaire",
        minutes: "",
        score: "",
        note: "",
        objective: "",
      });
    }
    reportEventsApply(next, roster);
    if (!reportValid(next))
      throw Error(
        "Vérifiez les champs du bilan et de la causerie avant l’import.",
      );
    return next;
  }
  function matches(report, source) {
    return (
      report.eventType !== "training" &&
      report.info.date === source.matchPreparation.date &&
      normalize(report.info.opponent) ===
        normalize(source.matchPreparation.opponent)
    );
  }
  function hasWork(report) {
    return (
      report.events.length ||
      report.players.some((p) =>
        [
          "minutes",
          "goals",
          "assists",
          "yellowCards",
          "redCards",
          "note",
          "objective",
        ].some((k) => p[k] !== undefined && p[k] !== ""),
      ) ||
      ["goalsFor", "goalsAgainst", "halfFor", "halfAgainst"].some(
        (k) => report.info[k] !== "",
      ) ||
      Object.values(report.analysis).some((v) => v.trim()) ||
      Object.entries(report.plan).some(
        ([k, v]) =>
          v?.trim() &&
          !(
            k === "priority" &&
            report.preparation?.imported &&
            v === report.preparation.objectives.map((o) => o.text).join("\n")
          ),
      ) ||
      Object.values(report.ratings).some((r) => r.score || r.note.trim())
    );
  }
  function apply(choice) {
    const source = choice.source;
    if (hasWork(currentReport) && !matches(currentReport, source))
      throw Error(
        "Ce bilan contient déjà des données d’un autre match. Créez un nouveau bilan avant de choisir cette causerie.",
      );
    let report = currentReport;
    if (!hasWork(report)) {
      const previous = reportLibrary.filter(
        (r) =>
          r.id !== report.id &&
          reportValid(r) &&
          coachTeamOwns(r) &&
          matches(r, source),
      );
      const linked = previous.filter(
        (r) => r.preparation?.sourceCompositionId === source.documentId,
      );
      const found = linked.length ? linked : previous;
      if (found.length > 1)
        throw Error(
          "Plusieurs bilans existent pour ce match. Reprenez celui souhaité dans les bilans enregistrés.",
        );
      if (found.length === 1) report = found[0];
    }
    if (!matches(report, source) && !hasWork(report)) {
      report = structuredClone(report);
      report.players = [];
      delete report.preparation;
      report.plan.priority = "";
      report.info.conditions = "";delete report.matchVenueOverride;report.info.venue="";report.info.stadium="";
      report.title = "";
    }
    const next = merge(source, report);
    next.updatedAt = new Date().toISOString();
    coachStorageSet("vestiaire-report-draft", JSON.stringify(next));
    clearTimeout(reportAutosaveTimer);
    currentReport = next;
    documentCompletionBeginEdit("report", next);
    return next;
  }
  function render() {
    $("report-causerie-import")?.remove();
    if (reportTab !== "general" || currentReport.eventType === "training")
      return;
    const root = $("report-quick-panel");
    if (!root) return;
    const choices = candidates();
    let error = "";
    if (!currentReport.preparation?.imported) {
      const matching = choices.filter((c) => matches(currentReport, c.source));
      const active = choices.find(
        (c) => c.source.documentId === getCompositionBoard().documentId,
      );
      const automatic =
        matching.length === 1
          ? matching[0]
          : !hasWork(currentReport)
            ? active || (choices.length === 1 ? choices[0] : null)
            : null;
      if (automatic) {
        try {
          apply(automatic);
          renderReportContent();
          return;
        } catch (e) {
          error = e.message;
        }
      }
    }
    const section = el("section", "report-causerie-import");
    section.id = "report-causerie-import";
    const label = el("label", "report-field", "Causerie liée au bilan"),
      select = el("select");
    select.id = "report-causerie-source";
    select.setAttribute("aria-label", "Causerie du match à importer");
    select.append(new Option("Choisir une causerie enregistrée…", ""));
    for (const choice of choices)
      select.append(new Option(choice.label, choice.key));
    let linked = choices.find(
      (c) =>
        c.source.documentId &&
        c.source.documentId === currentReport.preparation?.sourceCompositionId,
    );
    if (!linked && currentReport.preparation?.imported) {
      const matching = choices.filter((c) => matches(currentReport, c.source));
      if (matching.length === 1) linked = matching[0];
    }
    if (linked) select.value = linked.key;
    label.append(select);
    const status = el("p", "report-causerie-status");
    status.setAttribute("role", "status");
    status.textContent =
      error ||
      (currentReport.preparation?.imported
        ? "Causerie liée · " +
          (currentReport.preparation.sourceTitle ||
            linked?.label ||
            "préparation du match") +
          " · composition et consignes reprises."
        : choices.length
          ? "Sélectionnez la causerie : le bilan reprend directement le match, la composition et les consignes."
          : "Aucune causerie enregistrée pour cette équipe.");
    const button = el("button", "export", "Actualiser depuis la causerie");
    button.id = "report-causerie-import-button";
    button.type = "button";
    button.disabled = !select.value;
    const reportId = currentReport.id,
      owner = activeCoach.id,
      team = activeCoachTeam.id;
    const load = () => {
      try {
        if (
          currentReport.id !== reportId ||
          activeCoach.id !== owner ||
          activeCoachTeam.id !== team
        )
          throw Error("Le contexte a changé. Rouvrez le bilan.");
        const selected = candidates().find((c) => c.key === select.value);
        if (!selected) throw Error("Choisissez une causerie disponible.");
        apply(selected);
        renderReportContent();
      } catch (e) {
        status.textContent =
          e.message || "Liaison non enregistrée. Le bilan est conservé.";
      }
    };
    select.onchange = () => {
      button.disabled = !select.value;
      if (select.value) load();
    };
    button.onclick = load;
    section.append(label, button, status);
    const preparation = currentReport.preparation;
    if (preparation?.imported) {
      const details = el("details", "report-causerie-summary");
      details.append(el("summary", "", "Composition et consignes reprises"));
      if (preparation.formation)
        details.append(el("strong", "", preparation.formation));
      for (const item of preparation.objectives)
        details.append(el("p", "", item.text));
      for (const key of [
        "offensive",
        "defensive",
        "transitionOffDef",
        "transitionDefOff",
        "setPiecesFor",
        "setPiecesAgainst",
        "closingMessage",
        "specific",
      ])
        if (preparation.plan[key])
          details.append(el("p", "", preparation.plan[key]));
      section.append(details);
    }
    root.prepend(section);
  }
  document.addEventListener("DOMContentLoaded", () => {
    const before = renderReportContent;
    renderReportContent = function () {
      before();
      render();
    };
    const beforeSaves = renderSaves;
    renderSaves = function (...args) {
      const result = beforeSaves.apply(this, args);
      if (document.body.classList.contains("reports-mode")) render();
      return result;
    };
    render();
  });
})();
