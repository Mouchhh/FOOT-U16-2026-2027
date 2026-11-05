// Resolve home/away from the exact scheduled fixture; never infer it from a free-text stadium.
function reportMatchLocation(report, source = null) {
  source =
    source ||
    [getCompositionBoard(), ...saves.map((s) => s.state)].find(
      (b) =>
        b.documentId &&
        b.documentId === report.preparation?.sourceCompositionId,
    );
  const date = report.info.date,
    key = source?.fffFixtureKey || report.agendaSourceKey;
  const events = trainingDateValid(date)
    ? agendaCalendarAllEvents({ from: date, to: date }).filter(
        (e) => e.kind === "match" && e.date === date && e.fff,
      )
    : [];
  const exact = key ? events.filter((e) => e.fff.key === key) : [];
  const matching = events.filter(
    (e) =>
      playerStatsName(e.fff.opponent || "") ===
      playerStatsName(report.info.opponent || ""),
  );
  const fixture = (
    exact.length === 1 ? exact[0] : matching.length === 1 ? matching[0] : null
  )?.fff;
  let inferred = "";
  if (fixture?.team) {
    if (fixture.away === fixture.team) inferred = "Extérieur";
    else if (fixture.home === fixture.team) inferred = "Domicile";
  }
  const override = ["Domicile", "Extérieur", "Terrain neutre"].includes(
    report.matchVenueOverride,
  )
    ? report.matchVenueOverride
    : "";
  const planVenue = source?.matchPreparation?.venue || "",
    known = ["Domicile", "Extérieur", "Terrain neutre"].includes(planVenue);
  return {
    venue:
      override ||
      inferred ||
      (known ? planVenue : "") ||
      report.info.venue ||
      "Domicile",
    stadium: fixture?.location || (!known ? planVenue : ""),
    fixture,
  };
}
// Keep the result caption in the same home/away order as its scoreboard.
const reportLocationResult = reportResult;
reportResult = function () {
  const value = reportLocationResult();
  if (
    currentReport.eventType === "training" ||
    reportMatchLocation(currentReport).venue !== "Extérieur"
  )
    return value;
  const i = currentReport.info;
  if (!/^\d{1,2}$/.test(i.goalsFor) || !/^\d{1,2}$/.test(i.goalsAgainst))
    return value;
  const difference = Number(i.goalsFor) - Number(i.goalsAgainst);
  return (
    i.goalsAgainst +
    " — " +
    i.goalsFor +
    " · " +
    (difference > 0 ? "Victoire" : difference < 0 ? "Défaite" : "Match nul")
  );
};
