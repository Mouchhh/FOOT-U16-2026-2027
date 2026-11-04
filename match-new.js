// A new match is constructed from team identity, never cloned from the previous match.
function newBlankMatch(context = {}) {
  const next = {
    teamContext: { ...activeCoachTeam },
    boardKind: "composition",
    matchCreation: "blank",
    documentId: crypto.randomUUID(),
    coach: activeCoach.name,
    team: activeCoachTeam.team || "Stade Mayennais",
    category: activeCoachTeam.category,
    section: "Masculine",
    squad: "",
    matchDuration: "",
    title: "",
    formation: "4-3-3",
    color: "#2855a2",
    lanes: true,
    benchVisible: true,
    clubLogo: getCompositionBoard().clubLogo || "",
    notes: "",
    arrows: [],
    players: [],
    matchPreparation: {
      ...newMatchPreparation(),
      date: context.date || "",
      opponent: context.opponent || "",
      match: context.match || "",
      title: context.title || "",
    },
  };
  if (context.key) next.fffFixtureKey = context.key;
  return next;
}
function matchWorkspaceInstall(next) {
  if (!valid(next) || !coachTeamOwns(next)) return false;
  if (!workspaceKeepDraft("composition", getCompositionBoard())) return false;
  if (gamePlanBoard && !workspaceKeepDraft("plan", gamePlanBoard)) return false;
  const updates = [
    ["vestiaire-gameplan-draft", "null"],
    ["vestiaire-terrain-mode", JSON.stringify("composition")],
    ["vestiaire-last-canva-presentation", "null"],
    ["vestiaire-draft", JSON.stringify(next)],
  ];
  const before = updates.map(([key]) => [key, coachStorageGet(key)]);
  try {
    for (const [key, value] of updates) coachStorageSet(key, value);
  } catch (error) {
    for (const [key, value] of before.reverse())
      try {
        if (value === null) localStorage.removeItem(coachStorageKey(key));
        else coachStorageSet(key, value);
      } catch {}
    notify(
      "Nouveau match non créé : le travail actuel reste ouvert. Vérifiez le stockage avant de réessayer.",
    );
    return false;
  }
  state = structuredClone(next);
  compositionBoard = state;
  gamePlanBoard = null;
  terrainBoardKind = "composition";
  terrainKnownState = state;
  beforeTactic = null;
  drag = null;
  editing = null;
  photo = "";
  incomingId = null;
  playerPhotoJob++;
  photoPending = false;
  $("photo").value = "";
  $("photo-preview").hidden = true;
  $("photo-preview").removeAttribute("src");
  $("edit-form").querySelector("button.primary").disabled = false;
  documentCompletionEndEdit("causerie");
  documentCompletionBeginEdit("causerie", state);
  document.body.classList.remove("simple-mode", "game-plan-mode", "focus-mode");
  $("simple-board").hidden = true;
  $("mode-simple").classList.remove("active");
  $("mode-simple").setAttribute("aria-pressed", "false");
  $("undo-tactic").hidden = true;
  $("move").click();
  const last = $("personal-canva-last");
  if (last) {
    last.hidden = true;
    last.removeAttribute("href");
  }
  render();
  renderMatchPreparation();
  for (const input of $("match-plan-form").querySelectorAll(
    "input,textarea,select",
  ))
    input.setCustomValidity("");
  for (const id of ["causerie-archive-select", "match-roster-add"]) {
    const select = $(id);
    if (select) {
      select.value = "";
      select.dispatchEvent(new Event("change"));
    }
  }
  $("match-plan-status").textContent = "";
  documentEntry.accept?.("causerie");
  document.dispatchEvent(
    new CustomEvent("workspace-draft-changed", {
      detail: { kind: "composition" },
    }),
  );
  return true;
}
function startBlankMatch(context = {}) {
  if (document.querySelector("dialog[open]") || !workspaceNavigationCanLeave())
    return false;
  if (!matchWorkspaceInstall(newBlankMatch(context))) return false;
  documentEntry.perform(() =>
    workspaceNavigation.run("view-pitch", () => workspaceFlows.terrain.go(0)),
  );
  return true;
}
document.addEventListener("DOMContentLoaded", () => {
  const formation = $("formation");
  formation.prepend(new Option("Choisir un système", ""));
  formation.value = state.formation;
  const container = document.querySelector(
    "#terrain-page-0 .terrain-team-section",
  );
  const bar = el("div", "match-new-actions"),
    fresh = el("button", "primary", "Nouveau match");
  fresh.id = "match-new";
  fresh.type = "button";
  fresh.onclick = () => startBlankMatch();
  const select = el("select");
  select.id = "match-roster-add";
  select.setAttribute("aria-label", "Ajouter un joueur à cette composition");
  const add = el("button", "export", "Ajouter au terrain");
  add.type = "button";
  add.id = "match-roster-add-button";
  function refresh() {
    const old = select.value;
    select.replaceChildren(
      new Option("Choisir un joueur de l’effectif", ""),
      ...squadPlayers()
        .filter(
          (p) =>
            !getCompositionBoard().players.some(
              (row) => row.id === p.id || row.squadPlayerId === p.id,
            ),
        )
        .map((p) => new Option(p.name + " · N° " + p.number, p.id)),
    );
    select.value = [...select.options].some((o) => o.value === old) ? old : "";
    add.disabled =
      !select.value ||
      (documentCompletionIsCompleted("causerie", getCompositionBoard()) &&
        !documentCompletionIsEditing("causerie", getCompositionBoard()));
  }
  select.onchange = () => (add.disabled = !select.value);
  add.onclick = () => {
    if (terrainBoardKind !== "composition") return;
    if (
      documentCompletionIsCompleted("causerie", getCompositionBoard()) &&
      !documentCompletionIsEditing("causerie", getCompositionBoard())
    )
      return;
    const player = squadPlayers().find((p) => p.id === select.value);
    if (
      !player ||
      state.players.some((p) => p.id === player.id) ||
      state.players.length >= 30
    )
      return;
    const next = structuredClone(state);
    const slot = compositionEmptySlots(next)[0];
    next.players.push({
      id: player.id,
      name: player.name,
      number: player.number,
      photo: player.photo,
      role: "starter",
      x: slot?.x ?? 50,
      y: slot?.y ?? 50,
      ...(slot ? { formationSlot: slot.formationSlot } : {}),
    });
    try {
      coachStorageSet("vestiaire-draft", JSON.stringify(next));
    } catch {
      return notify("Joueur non ajouté : stockage indisponible.");
    }
    state = next;
    render();
    refresh();
  };
  bar.append(fresh, select, add);
  container.prepend(bar);
  const previous = render;
  render = function (...args) {
    const value = previous.apply(this, args);
    refresh();
    return value;
  };
  const previousSaves = renderSaves;
  renderSaves = function (...args) {
    const value = previousSaves.apply(this, args);
    refresh();
    return value;
  };
  refresh();
});
