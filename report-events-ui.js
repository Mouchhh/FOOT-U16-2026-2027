// Event changes update the open report; season figures remain based on saved reports.
function reportEventsCommit(change, control = null) {
  const before = structuredClone(currentReport);
  change();
  reportEventsApply(currentReport, squadPlayers());
  // Editing an event must not rebuild the report because another field is temporarily invalid.
  const invalidEvent = currentReport.events.some(
    (e) => !reportEventLinksValid(e),
  );
  const excessiveCount = currentReport.players.some((row) =>
    Object.values(row.eventStats || {}).some(
      (n) => !Number.isInteger(n) || n < 0 || n > 99,
    ),
  );
  if (invalidEvent || excessiveCount || currentReport.players.length > 40) {
    currentReport = before;
    notify("Vérifiez les joueurs et les valeurs (99 maximum par statistique).");
    renderReportContent();
    return;
  }
  reportAutosave();
  if (control?.isConnected) {
    const anchor = control.closest(".report-event"),
      top = anchor.getBoundingClientRect().top;
    const old = $("report-players-panel"),
      fragment = document.createDocumentFragment();
    if (old) {
      if (reportTab === "general") renderReportQuickMinutes(fragment);
      else renderReportPlayers(fragment, false);
      old.replaceWith(fragment);
    }
    const event = currentReport.events[Number(anchor.dataset.eventIndex)],
      passer = anchor.querySelector('[aria-label="Passeur décisif"]');
    if (control.getAttribute("aria-label") === "Événement")
      anchor
        .querySelector(".report-event-participants")
        .replaceWith(reportEventParticipants(event));
    if (passer && passer.isConnected) {
      passer.disabled = !event.playerId;
      passer.value = event.assisterId || "";
    }
    const delta = anchor.getBoundingClientRect().top - top;
    let scroller = anchor.parentElement;
    while (
      scroller &&
      scroller !== document.body &&
      !(
        /auto|scroll/.test(getComputedStyle(scroller).overflowY) &&
        scroller.scrollHeight > scroller.clientHeight
      )
    )
      scroller = scroller.parentElement;
    if (scroller && scroller !== document.body) scroller.scrollTop += delta;
    else window.scrollBy({ top: delta, behavior: "instant" });
    control.focus({ preventScroll: true });
  } else renderReportContent();
  reportGoalValidationDisplay();
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
        new Option(
          (reportMatchNumber(currentReport, player)
            ? "N° " + reportMatchNumber(currentReport, player) + " · "
            : "") + player.name,
          player.id,
        ),
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
  for (const type of ["click", "pointerdown", "input"])
    select.addEventListener(type, (event) => event.stopPropagation());
  select.onchange = (changeEvent) => {
    changeEvent.stopPropagation();
    const value = select.value,
      player = roster.find((p) => p.id === value);
    if (
      value &&
      !currentReport.players.some((r) => playerStatsResolve(r)?.id === value) &&
      currentReport.players.length >= 40
    ) {
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
    }, select);
  };
  return field;
}
function reportEventParticipants(event) {
  const participants = el("div", "report-event-participants");
  if (!["But contre", "Carton adverse"].includes(event.type))
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
  if (["Carton", "Carton adverse"].includes(event.type)) {
    const label = el("label", "report-field"),
      select = el("select");
    select.setAttribute("aria-label", "Couleur du carton");
    select.append(
      new Option("Choisir la couleur", ""),
      new Option("Jaune", "yellow"),
      new Option("Rouge", "red"),
    );
    select.value = event.card || "";
    label.append(el("span", "", "Couleur du carton"), select);
    participants.append(label);
    for (const type of ["click", "pointerdown", "input"])
      select.addEventListener(type, (e) => e.stopPropagation());
    select.onchange = (e) => {
      e.stopPropagation();
      reportEventsCommit(() => {
        event.card = select.value;
      }, select);
    };
  }
  return participants;
}
function renderReportEvents(root) {
  const panel = reportSection("Faits marquants");
  const add = el("button", "primary", "+ Ajouter un fait de match");
  add.type = "button";
  add.onclick = () => {
    if (currentReport.events.length >= 100) return notify("100 faits maximum.");
    reportEventsCommit(() =>
      currentReport.events.push({ minute: "", type: "But pour", detail: "" }),
    );
  };
  const adversary = el("button", "export", "+ Fait adverse");
  adversary.type = "button";
  adversary.onclick = () => {
    if (currentReport.events.length >= 100) return notify("100 faits maximum.");
    reportEventsCommit(() =>
      currentReport.events.push({ minute: "", type: "But contre", detail: "" }),
    );
  };
  const tools = el("div", "report-actions");
  tools.append(add, adversary);
  const error = el("p", "report-goal-error");
  error.id = "report-goal-error";
  error.setAttribute("role", "alert");
  panel.append(tools, error);
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
            if (!["Carton", "Carton adverse"].includes(v)) event.card = "";
            if (["But contre", "Carton adverse"].includes(v)) {
              event.playerId = "";
              event.playerName = "";
            }
          }, main.querySelector('[aria-label="Événement"]')),
        {
          choices: [
            "But pour",
            "But contre",
            "Changement",
            "Carton",
            "Carton adverse",
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
    row.append(reportEventParticipants(event));
    const extra = el("details", "report-event-extra");
    extra.append(
      el("summary", "", "Précision"),
      reportField(
        "Précision (facultatif)",
        event.detail,
        (v) => (event.detail = v),
        { area: true, rows: 2 },
      ),
    );
    row.append(extra);
    panel.append(row);
  });
  root.append(panel);
  reportGoalValidationDisplay();
}

let reportGoalValidationRequested = null;
function reportGoalValidationDisplay(force = false) {
  if (force) reportGoalValidationRequested = currentReport.id;
  const error = $("report-goal-error");
  if (error)
    error.textContent =
      reportGoalValidationRequested === currentReport.id
        ? reportGoalValidationMessage(currentReport)
        : "";
}
