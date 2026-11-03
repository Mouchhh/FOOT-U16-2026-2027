// Derived statistics only: the saved reports/attendance remain the source of truth.
const playerStatsFields = {
  goals: "Buts",
  assists: "Passes décisives",
  yellowCards: "Cartons jaunes",
  redCards: "Cartons rouges",
};
function playerStatsNumber(value, max = 99) {
  return (
    value === "" ||
    (typeof value === "string" &&
      /^\d{1,3}$/.test(value) &&
      Number(value) <= max)
  );
}
function playerStatsRowValid(row) {
  return (
    Object.keys(playerStatsFields).every(
      (k) => row[k] === undefined || playerStatsNumber(row[k]),
    ) &&
    (row.squadPlayerId === undefined ||
      (typeof row.squadPlayerId === "string" &&
        row.squadPlayerId.length <= 100)) &&
    (row.attendanceMode === undefined ||
      ["auto", "manual"].includes(row.attendanceMode)) &&
    (row.attendanceRate === undefined ||
      playerStatsNumber(row.attendanceRate, 100))
  );
}
function playerStatsNow() {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("fr-CA", {
      timeZone: "Europe/Paris",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .filter((p) => p.type !== "literal")
      .map((p) => [p.type, p.value]),
  );
  return {
    day: p.year + "-" + p.month + "-" + p.day,
    time: p.hour + ":" + p.minute,
  };
}
function playerStatsSeason(date = playerStatsNow().day) {
  if (!trainingDateValid(date)) return null;
  const year = Number(date.slice(0, 4));
  return Number(date.slice(5, 7)) >= 7 ? year : year - 1;
}
function playerStatsSeasonLabel(year) {
  return year + " / " + (year + 1);
}
function playerStatsInSeason(date, year) {
  return (
    trainingDateValid(date) &&
    date >= year + "-07-01" &&
    date <= year + 1 + "-06-30"
  );
}
function playerStatsOwns(document) {
  return document.teamContext
    ? document.teamContext.id === activeCoachTeam.id
    : coachTeamOwns(document);
}
function playerStatsName(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("fr");
}
function playerStatsResolve(row, roster = squadPlayers()) {
  if (Object.hasOwn(row, "squadPlayerId"))
    return roster.find((p) => p.id === row.squadPlayerId) || null;
  const exact = roster.find((p) => p.id === row.id);
  if (exact) return exact;
  const name = playerStatsName(row.name);
  if (!name) return null;
  const matches = roster.filter((p) => playerStatsName(p.name) === name);
  // A number alone or an ambiguous name never links a report to a player.
  return matches.length === 1 &&
    (!row.number || String(matches[0].number) === String(row.number))
    ? matches[0]
    : null;
}
function playerStatsStamp(row) {
  return Number.isFinite(Date.parse(row.updatedAt))
    ? Date.parse(row.updatedAt)
    : 0;
}
function playerStatsUnique(rows) {
  const unique = new Map();
  for (const row of rows) {
    const old = unique.get(row.id);
    if (!old || playerStatsStamp(row) > playerStatsStamp(old))
      unique.set(row.id, row);
  }
  return [...unique.values()];
}
// Copies and explicit replacements retain their encounter lineage. Changing the
// date/time/opponent makes a distinct encounter without deleting any report.
function playerStatsEventKey(report) {
  const source =
    typeof report.agendaSourceKey === "string" && report.agendaSourceKey
      ? report.agendaSourceKey
      : report.statsEventId || report.id;
  return JSON.stringify([
    source,
    report.eventType || "match",
    report.info.date,
    report.info.time,
    playerStatsName(report.info.opponent),
  ]);
}
function playerStatsUniqueEvents(reports) {
  const events = new Map();
  for (const report of playerStatsUnique(reports)) {
    const key = playerStatsEventKey(report),
      old = events.get(key);
    if (!old || playerStatsStamp(report) > playerStatsStamp(old))
      events.set(key, report);
  }
  return [...events.values()];
}
function playerStatsEmpty(player) {
  return {
    player,
    totals: { minutes: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 },
    known: {
      minutes: false,
      goals: false,
      assists: false,
      yellowCards: false,
      redCards: false,
    },
    reports: [],
    matches: 0,
    sessions: 0,
    attendance: {
      present: 0,
      absent: 0,
      uncertain: 0,
      autoRate: null,
      rate: null,
      source: "auto",
      override: null,
    },
  };
}
function playerStatsSeasonSnapshot(
  year,
  {
    roster = squadPlayers(),
    reports = reportLibrary,
    trainings = trainingLibrary,
    now = playerStatsNow(),
  } = {},
) {
  const rosterIds = new Set(roster.map((p) => p.id));
  const identityWeight = (row) =>
    row.squadPlayerId ? 2 : rosterIds.has(row.id) ? 1 : 0;
  const identityFirst = (rows) =>
    [...rows].sort((a, b) => identityWeight(b) - identityWeight(a));
  const result = new Map(
    roster.map((player) => [player.id, playerStatsEmpty(player)]),
  );
  const saved = playerStatsUniqueEvents(
    reports.filter(
      (r) =>
        reportValid(r) &&
        playerStatsOwns(r) &&
        playerStatsInSeason(r.info.date, year) &&
        r.info.date <= now.day,
    ),
  ).sort(
    (a, b) =>
      a.info.date.localeCompare(b.info.date) ||
      playerStatsStamp(a) - playerStatsStamp(b),
  );
  for (const report of saved) {
    const seen = new Set();
    for (const row of identityFirst(report.players)) {
      const player = playerStatsResolve(row, roster);
      if (!player || seen.has(player.id)) continue;
      seen.add(player.id);
      const stats = result.get(player.id),
        kind = report.eventType === "training" ? "training" : "match";
      stats[kind === "training" ? "sessions" : "matches"]++;
      for (const key of ["minutes", ...Object.keys(playerStatsFields)])
        if (
          row[key] !== undefined &&
          row[key] !== "" &&
          playerStatsNumber(row[key], key === "minutes" ? 180 : 99)
        ) {
          stats.totals[key] += Number(row[key]);
          stats.known[key] = true;
        }
      stats.reports.push({
        id: report.id,
        date: report.info.date,
        title: report.title || report.info.opponent || "Bilan",
        kind,
        minutes: row.minutes,
        ...Object.fromEntries(
          Object.keys(playerStatsFields).map((k) => [k, row[k] ?? ""]),
        ),
      });
      stats.attendance.override =
        row.attendanceMode === "manual"
          ? {
              rate:
                row.attendanceRate !== undefined && row.attendanceRate !== ""
                  ? Number(row.attendanceRate)
                  : null,
              date: report.info.date,
            }
          : null;
    }
  }
  // One validated roll call per actual date/time; copies never inflate attendance.
  const occurrences = new Map();
  for (const session of playerStatsUnique(
    trainings.filter((s) => trainingValid(s) && playerStatsOwns(s)),
  )) {
    const a = session.attendance;
    if (
      !a ||
      !a.validatedAt ||
      !Number.isFinite(Date.parse(a.validatedAt)) ||
      a.date !== session.date ||
      a.time !== session.time ||
      !playerStatsInSeason(session.date, year) ||
      session.date + "T" + session.time > now.day + "T" + now.time
    )
      continue;
    const key = session.date + "T" + session.time,
      old = occurrences.get(key);
    if (
      !old ||
      Date.parse(a.validatedAt) > Date.parse(old.attendance.validatedAt)
    )
      occurrences.set(key, session);
  }
  for (const session of occurrences.values()) {
    const seen = new Set();
    for (const row of identityFirst(session.attendance.rows)) {
      if (!row.included) continue;
      const player = playerStatsResolve(row, roster);
      if (!player || seen.has(player.id)) continue;
      seen.add(player.id);
      const attendance = result.get(player.id).attendance;
      attendance[
        row.status === "present"
          ? "present"
          : row.status === "absent"
            ? "absent"
            : "uncertain"
      ]++;
    }
  }
  for (const stats of result.values()) {
    const a = stats.attendance,
      known = a.present + a.absent;
    a.autoRate = known ? Math.round((a.present / known) * 100) : null;
    a.rate = a.override ? a.override.rate : a.autoRate;
    a.source = a.override ? "manual" : "auto";
  }
  const dates = new Set([...occurrences.keys()]);
  for (const s of trainings)
    if (
      trainingValid(s) &&
      playerStatsOwns(s) &&
      playerStatsInSeason(s.date, year) &&
      s.date + "T" + s.time <= now.day + "T" + now.time
    )
      dates.add(s.date + "T" + s.time);
  // Recurrent slots supply context, never automatically turn an unknown into absence.
  if (
    typeof agendaRecurringOccurrences === "function" &&
    now.day >= year + "-07-01"
  )
    for (const event of agendaRecurringOccurrences(undefined, {
      from: year + "-07-01",
      to: now.day < year + 1 + "-06-30" ? now.day : year + 1 + "-06-30",
    }))
      if (
        event.kind === "training" &&
        event.date + "T" + event.time <= now.day + "T" + now.time
      )
        dates.add(event.date + "T" + event.time);
  return {
    year,
    players: result,
    scheduled: dates.size,
    attendanceSessions: occurrences.size,
  };
}
function playerStatsAvailableSeasons() {
  const years = new Set([playerStatsSeason()]);
  for (const r of reportLibrary)
    if (playerStatsOwns(r)) {
      const year = playerStatsSeason(r.info?.date);
      if (year !== null) years.add(year);
    }
  for (const s of trainingLibrary)
    if (playerStatsOwns(s)) {
      const year = playerStatsSeason(s.date);
      if (year !== null) years.add(year);
    }
  return [...years].filter((y) => Number.isInteger(y)).sort((a, b) => b - a);
}
function playerStatsDisplay(stats, key) {
  return stats.known[key] ? String(stats.totals[key]) : "—";
}
function playerStatsValidationMessage(report) {
  if (!Array.isArray(report?.players)) return "";
  const used = new Set();
  for (const row of identityFirst(report.players)) {
    if (!row) continue;
    if (row.squadPlayerId && used.has(row.squadPlayerId))
      return "Une fiche d’effectif est associée à plusieurs lignes : gardez une seule ligne par joueur dans ce bilan.";
    if (row.squadPlayerId) used.add(row.squadPlayerId);
    for (const [key, label] of Object.entries(playerStatsFields))
      if (row[key] !== undefined && !playerStatsNumber(row[key]))
        return (
          label +
          " : saisissez un nombre entier de 0 à 99 pour " +
          (row.name || "ce joueur") +
          "."
        );
    if (
      row.attendanceRate !== undefined &&
      !playerStatsNumber(row.attendanceRate, 100)
    )
      return (
        "Présence : saisissez un pourcentage entier de 0 à 100 pour " +
        (row.name || "ce joueur") +
        "."
      );
  }
  return "";
}
