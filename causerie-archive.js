// Reuse the composition library and authenticated club outbox; no duplicate archive store.
function causerieArchiveValid(payload) {
  return (
    !!payload &&
    !payload.squadDirectory &&
    !payload.pionExplanation &&
    payload.boardKind !== "plan" &&
    coachTeamOwns(payload) &&
    valid(payload) &&
    matchPreparationFilled(payload.matchPreparation)
  );
}
document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(
    "#terrain-page-0 .terrain-team-section",
  );
  if (!container) return;
  const strip = el("section", "causerie-archive-strip");
  strip.id = "causerie-archive-strip";
  const label = el("label", "report-field", "Mes causeries enregistrées"),
    select = el("select");
  select.id = "causerie-archive-select";
  select.setAttribute("aria-label", "Mes causeries enregistrées");
  label.append(select);
  const resume = el("button", "export", "Reprendre"),
    reuse = el("button", "primary", "Réutiliser pour un prochain match");
  resume.id = "causerie-archive-resume";
  reuse.id = "causerie-archive-reuse";
  resume.type = reuse.type = "button";
  const status = el("p", "causerie-archive-status");
  status.setAttribute("role", "status");
  const validated = el("div", "causerie-validated-status");
  validated.id = "causerie-validated-status";
  const text = el("span", "", "Causerie validée · composition enregistrée"),
    edit = el("button", "export", "Modifier cette composition");
  edit.type = "button";
  edit.id = "causerie-composition-edit";
  edit.onclick = () => {
    documentCompletionBeginEdit("causerie");
    render();
    paint();
  };
  validated.append(text, edit);
  strip.append(label, resume, reuse, status, validated);
  container.prepend(strip);
  const locked = new Set();
  function releaseLocks() {
    for (const node of locked) node.inert = false;
    locked.clear();
  }
  function items() {
    return saves.map((s) => s.state).filter(causerieArchiveValid);
  }
  function paint() {
    const board = getCompositionBoard(),
      rows = items();
    select.replaceChildren(
      new Option(
        rows.length ? "Choisir une causerie…" : "Aucune causerie enregistrée",
        "",
      ),
      ...rows.map(
        (p) =>
          new Option(
            [
              p.matchPreparation.date,
              p.matchPreparation.opponent,
              p.title || p.formation,
            ]
              .filter(Boolean)
              .join(" · "),
            p.documentId,
          ),
      ),
    );
    select.value = rows.some((p) => p.documentId === board.documentId) ? board.documentId : "";
    resume.disabled = reuse.disabled = !select.value;
    const complete =
      terrainBoardKind === "composition" &&
      documentCompletionIsCompleted("causerie", board) &&
      !documentCompletionIsEditing("causerie", board);
    validated.hidden = !complete;
    strip.dataset.validated = String(complete);
    releaseLocks();
    if (complete) {
      for (const node of container.querySelectorAll(
        ":scope > .workspace, :scope > #task-match-settings",
      )) {
        if (!node.inert) {
          node.inert = true;
          locked.add(node);
        }
      }
    }
  }
  select.onchange = () => {
    resume.disabled = reuse.disabled = !select.value;
    status.textContent = "";
    if (select.value) openSelected(false);
  };
  function clearTransient() {
    beforeTactic = null;
    drag = null;
    editing = null;
    photo = "";
    incomingId = null;
    $("undo-tactic").hidden = true;
    $("move").click();
    renderMatchPreparation();
    $("match-plan-status").textContent = "";
  }
  function openSelected(copy) {
    const source = items().find((p) => p.documentId === select.value);
    if (!source) {
      status.textContent =
        "Cette causerie n’est plus disponible dans cette équipe.";
      return;
    }
    const next = structuredClone(source);
    if (copy) {
      next.documentId = crypto.randomUUID();
      next.title = (
        "Nouvelle causerie · " + (source.title || source.team)
      ).slice(0, 100);
      for (const key of [
        "documentCompletion",
        "clubReference",
        "clubApproval",
        "clubValidation",
        "sourceCompositionId",
      ])
        delete next[key];
      next.matchPreparation = {
        ...next.matchPreparation,
        date: "",
        opponent: "",
        match: "",
        title: "",
        context: "",
      };
      next.teamContext = { ...activeCoachTeam };
    }
    // Persist/recover the current draft before changing anything visible.
    const installed = typeof matchWorkspaceInstall === "function"
      ? matchWorkspaceInstall(next)
      : workspaceReplaceDraft("composition", next);
    if (!installed) { paint(); return; }
    documentCompletionEndEdit("causerie");
    if (
      copy ||
      !documentCompletionIsCompleted("causerie", getCompositionBoard())
    )
      documentCompletionBeginEdit("causerie");
    clearTransient();
    documentEntry.perform(() =>
      workspaceNavigation.run("view-pitch", () => workspaceFlows.terrain.go(0)),
    );
    render();
    documentCompletionRefresh();
    paint();
    status.textContent = copy
      ? "Nouvelle copie prête · renseignez la date et l’adversaire."
      : "Causerie ouverte dans son équipe d’origine.";
  }
  resume.onclick = () => openSelected(false);
  reuse.onclick = () => openSelected(true);
  const beforeRender = render;
  render = function (...args) {
    const result = beforeRender.apply(this, args);
    paint();
    return result;
  };
  const beforeSaves = renderSaves;
  renderSaves = function (...args) {
    const result = beforeSaves.apply(this, args);
    paint();
    clubNetworkRenderSources();
    return result;
  };
  const beforeSources = clubNetworkRenderSources;
  clubNetworkRenderSources = function (...args) {
    const result = beforeSources.apply(this, args);
    const options = $("club-network-source").options;
    for (let index = 1; index < options.length; index++) {
      const source = clubNetworkSources[Number(options[index].value)];
      if (
        source?.kind === "composition" &&
        causerieArchiveValid(source.payload)
      )
        options[index].textContent =
          "Causerie · " + source.title.replace(/^Causerie · /, "");
    }
    return result;
  };
  document.addEventListener("document-completed", (event) => {
    if (event.detail.kind !== "causerie") return;
    clearTransient();
    render();
    paint();
    clubNetworkRenderSources();
  });
  new MutationObserver(() => paint()).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  document.addEventListener("club-session-ready", paint);
  paint();
  clubNetworkRenderSources();
});
