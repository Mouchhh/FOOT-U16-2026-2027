// Stable player links, exact event attribution, and deterministic derived report counters.
const reportEventPlayerKeys = ["playerId", "assisterId", "secondPlayerId"];
function reportEventLinksValid(event) {
  return (
    reportEventPlayerKeys.every(
      (k) =>
        event[k] === undefined ||
        (typeof event[k] === "string" && event[k].length <= 100),
    ) &&
    ["playerName", "assisterName", "secondPlayerName"].every(
      (k) =>
        event[k] === undefined ||
        (typeof event[k] === "string" && event[k].length <= 100),
    ) &&
    (event.card === undefined || ["", "yellow", "red"].includes(event.card)) &&
    !(
      event.type === "But pour" &&
      event.playerId &&
      event.playerId === event.assisterId
    ) &&
    !(
      event.type === "Changement" &&
      event.playerId &&
      event.playerId === event.secondPlayerId
    )
  );
}
function reportEventCounts(report) {
  const counts = new Map();
  const add = (id, key) => {
    if (!id) return;
    const item = counts.get(id) || {};
    item[key] = (item[key] || 0) + 1;
    counts.set(id, item);
  };
  for (const e of report.events || []) {
    if (e.type === "But pour") {
      add(e.playerId, "goals");
      if (e.playerId) add(e.assisterId, "assists");
    }
    if (e.type === "Carton" && e.card)
      add(e.playerId, e.card === "red" ? "redCards" : "yellowCards");
  }
  return counts;
}
function reportEventsApply(report, roster) {
  const counts = reportEventCounts(report);
  for (const [id] of counts) {
    const player = roster.find((p) => p.id === id);
    if (!player) continue;
    let row = report.players.find(
      (r) => playerStatsResolve(r, roster)?.id === id,
    );
    if (!row) {
      let rowId = "event-" + id.slice(0, 85),
        suffix = 0;
      while (report.players.some((r) => r.id === rowId))
        rowId = "event-" + id.slice(0, 80) + "-" + ++suffix;
      row = {
        id: rowId,
        squadPlayerId: id,
        name: player.name,
        number: String(player.number),
        role: "Titulaire",
        minutes: "",
        score: "",
        note: "",
        objective: "",
      };
      report.players.push(row);
    }
    row.squadPlayerId = id;
  }
  for (const row of report.players) {
    const player = playerStatsResolve(row, roster),
      values = counts.get(row.squadPlayerId || player?.id) || {};
    for (const key of ["goals", "assists", "yellowCards", "redCards"]) {
      if (values[key] !== undefined) {
        row.eventStats ||= {};
        row.manualStatsBeforeEvents ||= {};
        if (!Object.hasOwn(row.eventStats, key))
          row.manualStatsBeforeEvents[key] = playerStatsNumber(row[key])
            ? row[key]
            : "";
        row[key] = String(values[key]);
        row.eventStats[key] = values[key];
      } else if (row.eventStats && Object.hasOwn(row.eventStats, key)) {
        row[key] = "0";
        delete row.eventStats[key];
      }
    }
  }
  return report;
}
function reportEventDescription(
  event,
  roster = typeof squadPlayers === "function" ? squadPlayers() : [],
) {
  const name = (key, fallback) =>
    roster.find((p) => p.id === event[key])?.name ||
    event[fallback] ||
    (event[key] ? "Joueur retiré de l’effectif" : "");
  const who = name("playerId", "playerName"),
    pass = name("assisterId", "assisterName"),
    second = name("secondPlayerId", "secondPlayerName");
  const parts = [];
  if (event.type === "But pour") {
    if (who) parts.push("Buteur : " + who);
    if (event.playerId && pass) parts.push("Passe décisive : " + pass);
  } else if (event.type === "Changement") {
    if (who) parts.push("Sortant : " + who);
    if (second) parts.push("Entrant : " + second);
  } else if (who) parts.push("Joueur : " + who);
  if (["Carton", "Carton adverse"].includes(event.type) && event.card)
    parts.push(event.card === "red" ? "Carton rouge" : "Carton jaune");
  if (event.detail) parts.push(event.detail);
  return parts.join(" · ");
}

// Missing actors may be drafted, but an own goal event must be attributed before saving.
function reportGoalValidationMessage(report, roster = squadPlayers()) {
  const index = (report.events || []).findIndex(
    (event) =>
      event.type === "But pour" &&
      (!event.playerId ||
        !roster.some((player) => player.id === event.playerId)),
  );
  return index < 0
    ? ""
    : "But n° " +
        (index + 1) +
        " : sélectionnez un buteur de votre effectif avant de valider le bilan. Le passeur est facultatif.";
}
