// Event changes update the open report; season figures remain based on saved reports.
function reportEventsCommit(change) {
  const before = structuredClone(currentReport);
  change();
  reportEventsApply(currentReport, squadPlayers());
  if (!reportValid(currentReport)) {
    currentReport = before;
    notify("Vérifiez les joueurs et les valeurs (99 maximum par statistique).");
    renderReportContent();
    return;
  }
  reportAutosave();
  renderReportContent();
}
function reportEventsUnlinkPlayer(id) {
  for (const event of currentReport.events) {
    for (const key of reportEventPlayerKeys)
      if (event[key] === id) {
        event[key] = "";
        event[key.replace("Id", "Name")] = "";
      }
    if (event.type === "But pour" && !event.playerId) {
      event.assisterId = "";
      event.assisterName = "";
    }
  }
}
function reportEventPlayerField(event, key, label) {
  const field = el("label", "report-field"),
    select = el("select");
  field.append(el("span", "", label), select);
  select.setAttribute("aria-label", label);
  select.append(
    new Option(
      key === "assisterId" ? "Aucun / non renseigné" : "Choisir un joueur",
      "",
    ),
  );
  const roster = squadPlayers(),
    inReport = new Set(
      currentReport.players
        .map((r) => playerStatsResolve(r)?.id)
        .filter(Boolean),
    );
  for (const [title, players] of [
    ["Joueurs du bilan", roster.filter((p) => inReport.has(p.id))],
    ["Autres joueurs de l’effectif", roster.filter((p) => !inReport.has(p.id))],
  ]) {
    if (!players.length) continue;
    const group = el("optgroup");
    group.label = title;
    for (const player of players)
      group.append(
        new Option("N° " + player.number + " · " + player.name, player.id),
      );
    select.append(group);
  }
  if (event[key] && !roster.some((p) => p.id === event[key])) {
    const option = new Option(
      "Joueur indisponible · " + (event[key.replace("Id", "Name")] || ""),
      event[key],
    );
    option.disabled = true;
    select.append(option);
  }
  select.value = event[key] || "";
  if (key === "assisterId") select.disabled = !event.playerId;
  select.onchange = () => {
    const value = select.value,
      player = roster.find((p) => p.id === value);
    if (value && !inReport.has(value) && currentReport.players.length >= 40) {
      notify("40 joueurs maximum dans ce bilan.");
      select.value = event[key] || "";
      return;
    }
    if (
      value &&
      ((event.type === "But pour" &&
        value === event[key === "playerId" ? "assisterId" : "playerId"]) ||
        (event.type === "Changement" &&
          value === event[key === "playerId" ? "secondPlayerId" : "playerId"]))
    ) {
      notify("Choisissez deux joueurs différents.");
      select.value = event[key] || "";
      return;
    }
    reportEventsCommit(() => {
      event[key] = value;
      event[key.replace("Id", "Name")] = player?.name || "";
      if (key === "playerId" && event.type === "But pour" && !value) {
        event.assisterId = "";
        event.assisterName = "";
      }
    });
  };
  return field;
}
function renderReportEvents(root) {
  const panel = reportSection(
    "Faits marquants",
    "Sélectionnez les joueurs : les buts, passes et cartons alimentent leur suivi sans double saisie. La fiche Effectif est actualisée après l’enregistrement du bilan.",
  );
  const add = el("button", "primary", "+ Ajouter un fait de match");
  add.type = "button";
  add.onclick = () => {
    if (currentReport.events.length >= 100) return notify("100 faits maximum.");
    reportEventsCommit(() =>
      currentReport.events.push({ minute: "", type: "But pour", detail: "" }),
    );
  };
  panel.append(add);
  currentReport.events.forEach((event, index) => {
    const row = el("article", "report-event report-event-linked");
    row.dataset.eventIndex = String(index);
    const main = el("div", "report-event-main");
    main.append(
      reportField(
        "Minute",
        event.minute,
        (v) => {
          event.minute = v;
        },
        { type: "number", max: 180 },
      ),
      reportField(
        "Événement",
        event.type,
        (v) =>
          reportEventsCommit(() => {
            event.type = v;
            if (v !== "But pour") {
              event.assisterId = "";
              event.assisterName = "";
            }
            if (v !== "Changement") {
              event.secondPlayerId = "";
              event.secondPlayerName = "";
            }
            if (v !== "Carton") event.card = "";
          }),
        {
          choices: [
            "But pour",
            "But contre",
            "Changement",
            "Carton",
            "Occasion",
            "Autre",
          ],
        },
      ),
    );
    for (const label of main.querySelectorAll(".report-field"))
      label
        .querySelector("input,select")
        .setAttribute("aria-label", label.firstElementChild.textContent);
    const remove = el("button", "report-event-remove", "Retirer le fait");
    remove.type = "button";
    remove.setAttribute("aria-label", "Retirer le fait " + (index + 1));
    remove.onclick = () =>
      reportEventsCommit(() => currentReport.events.splice(index, 1));
    main.append(remove);
    row.append(main);
    const participants = el("div", "report-event-participants");
    if (event.type !== "But contre")
      participants.append(
        reportEventPlayerField(
          event,
          "playerId",
          event.type === "But pour"
            ? "Buteur"
            : event.type === "Changement"
              ? "Joueur sortant"
              : "Joueur concerné",
        ),
      );
    if (event.type === "But pour")
      participants.append(
        reportEventPlayerField(event, "assisterId", "Passeur décisif"),
      );
    if (event.type === "Changement")
      participants.append(
        reportEventPlayerField(event, "secondPlayerId", "Joueur entrant"),
      );
    if (event.type === "Carton")
      participants.append(
        reportField(
          "Couleur du carton",
          event.card || "",
          (v) =>
            reportEventsCommit(() => {
              event.card = v;
            }),
          { choices: ["Choisir la couleur", "Jaune", "Rouge"] },
        ),
      );
    // reportField's choices are strings; the card-color selector uses explicit machine values.
    if (event.type === "Carton") {
      const old = participants.lastElementChild,
        select = old.querySelector("select");
      select.replaceChildren(
        new Option("Choisir la couleur", ""),
        new Option("Jaune", "yellow"),
        new Option("Rouge", "red"),
      );
      select.value = event.card || "";
      select.setAttribute("aria-label", "Couleur du carton");
    }
    row.append(
      participants,
      reportField(
        "Précision (facultatif)",
        event.detail,
        (v) => (event.detail = v),
        { area: true, rows: 2 },
      ),
    );
    panel.append(row);
  });
  root.append(panel);
}
