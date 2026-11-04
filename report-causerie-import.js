// Explicit, team-scoped import. Match facts and previously entered statistics are retained.
(() => {
  "use strict";
  const normalize = (value) => coachTeamNormalize(value);
  function candidates() {
    const rows = new Map();
    const add = (key, source, label, trusted = false) => {
      if (
        !source ||
        source.squadDirectory ||
        (!trusted && !coachTeamOwns(source)) ||
        (source.teamContext && !coachTeamOwns(source)) ||
        !source.matchPreparation ||
        !validMatchPreparation(source.matchPreparation) ||
        !matchPreparationFilled(source.matchPreparation) ||
        !Array.isArray(source.players)
      )
        return;
      const plan = source.matchPreparation;
      if (currentReport.info.date && currentReport.info.date !== plan.date)
        return;
      if (
        currentReport.info.opponent &&
        normalize(currentReport.info.opponent) !== normalize(plan.opponent)
      )
        return;
      if (!rows.has(key))
        rows.set(key, {
          key,
          source,
          label: [label, plan.date, plan.opponent].filter(Boolean).join(" · "),
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
  function merge(source) {
    const next = structuredClone(currentReport),
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
    // Preserve post-match observations if the same priority was already evaluated.
    snapshot.objectives = snapshot.objectives.map(
      (objective) =>
        next.preparation?.objectives.find(
          (old) => old.text === objective.text,
        ) || objective,
    );
    next.preparation = snapshot;
    next.info.formation = source.formation || next.info.formation;
    if (!next.info.date) next.info.date = source.matchPreparation.date;
    if (!next.info.opponent)
      next.info.opponent = source.matchPreparation.opponent;
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
  function render() {
    $("report-causerie-import")?.remove();
    if (reportTab !== "general" || currentReport.eventType === "training")
      return;
    const root = $("report-quick-panel");
    if (!root) return;
    const section = el("section", "report-causerie-import");
    section.id = "report-causerie-import";
    const choices = candidates(),
      select = el("select");
    select.id = "report-causerie-source";
    select.setAttribute("aria-label", "Causerie du match à importer");
    select.append(new Option("Choisir la causerie du match…", ""));
    for (const choice of choices)
      select.append(new Option(choice.label, choice.key));
    if (choices.length === 1) select.value = choices[0].key;
    const button = el(
      "button",
      "primary",
      "📌 Importer les éléments de la causerie du match",
    );
    button.id = "report-causerie-import-button";
    button.type = "button";
    button.disabled = !select.value;
    select.onchange = () => (button.disabled = !select.value);
    const status = el("p", "report-causerie-status");
    status.setAttribute("role", "status");
    if (!choices.length)
      status.textContent =
        "Aucune causerie disponible pour ce match dans cette équipe.";
    const reportId = currentReport.id,
      owner = activeCoach.id,
      team = activeCoachTeam.id;
    button.onclick = () => {
      try {
        if (
          currentReport.id !== reportId ||
          activeCoach.id !== owner ||
          activeCoachTeam.id !== team
        )
          throw Error("Le contexte a changé. Rouvrez le bilan.");
        const selected = candidates().find((row) => row.key === select.value);
        if (!selected)
          throw Error(
            "La causerie a changé. Rouvrez le bilan pour actualiser la liste.",
          );
        const next = merge(selected.source);
        next.updatedAt = new Date().toISOString();
        coachStorageSet("vestiaire-report-draft", JSON.stringify(next));
        clearTimeout(reportAutosaveTimer);
        currentReport = next;
        renderReportContent();
        $("report-causerie-import")
          ?.querySelector('[role="status"]')
          ?.replaceChildren(
            document.createTextNode(
              "Causerie importée · joueurs, système et consignes. Les statistiques déjà saisies sont conservées.",
            ),
          );
      } catch (error) {
        status.textContent =
          error.message || "Import non enregistré. Votre bilan reste conservé.";
      }
    };
    section.append(select, button, status);
    const preparation = currentReport.preparation;
    if (
      preparation?.imported &&
      (preparation.objectives.length || preparation.formation)
    ) {
      const details = el("details", "report-causerie-summary");
      details.append(el("summary", "", "Système et consignes du match"));
      if (preparation.formation)
        details.append(el("strong", "", preparation.formation));
      for (const item of preparation.objectives)
        details.append(el("p", "", item.text));
      for (const key of ["offensive", "defensive", "specific"])
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
