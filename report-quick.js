// Minimal match entry. Historical analysis remains available in its dedicated tabs.
let reportQuickDetailed = false; // Retained for saved navigation state compatibility.
function renderReportQuickMinutes(root) {
  const panel = reportSection("Temps de jeu");
  panel.id = "report-players-panel";
  panel.classList.add("report-quick-minutes");
  const roster = squadPlayers();
  const entries = roster.map((player) => ({
    player,
    row: currentReport.players.find(
      (row) => playerStatsResolve(row)?.id === player.id,
    ),
  }));
  entries.push(
    ...currentReport.players
      .filter((row) => !playerStatsResolve(row))
      .map((row) => ({ player: null, row })),
  );
  for (const entry of entries) {
    const name = entry.player?.name || entry.row?.name || "Joueur sans nom";
    const line = el("div", "report-minute-line");
    const number = entry.player?.number ?? entry.row?.number;
    line.append(el("span", "", (number ? "N° " + number + " · " : "") + name));
    const field = reportField(
      "Minutes · " + name,
      entry.row?.minutes || "",
      (value) => {
        if (!entry.row) {
          if (currentReport.players.length >= 40) return;
          entry.row = {
            id: crypto.randomUUID(),
            squadPlayerId: entry.player.id,
            name: entry.player.name,
            number: String(entry.player.number || ""),
            role: "Titulaire",
            minutes: "",
            score: "",
            note: "",
            objective: "",
          };
          currentReport.players.push(entry.row);
        }
        entry.row.minutes = value;
      },
      { type: "number", max: 180 },
    );
    const input = field.querySelector("input");
    input.setAttribute("aria-label", "Minutes jouées · " + name);
    input.disabled = !entry.row && currentReport.players.length >= 40;
    field.querySelector("span").textContent = "min";
    line.append(field);
    panel.append(line);
  }
  if (!entries.length)
    panel.append(el("p", "hint", "Aucun joueur dans l’effectif."));
  root.append(panel);
}
function renderReportQuick() {
  if (reportTab !== "general") return;
  const root = $("report-content"),
    panel = el("section", "report-match-page");
  panel.id = "report-quick-panel";
  const layout = el("div", "report-match-columns");
  const result = reportSection("Score");
  const board = el("div", "report-scoreboard");
  const awayName = el(
    "strong",
    "",
    currentReport.info.opponent || "Adversaire",
  );
  for (const [key, name] of [
    ["goalsFor", el("strong", "", currentReport.info.team || "Notre équipe")],
    ["goalsAgainst", awayName],
  ]) {
    const side = el("div", "report-score-side");
    side.append(
      name,
      reportField(
        reportInfo[key],
        currentReport.info[key],
        (v) => (currentReport.info[key] = v),
        { type: "number" },
      ),
    );
    if (board.children.length)
      board.append(el("span", "report-score-separator", "—"));
    board.append(side);
  }
  const score = el("p", "report-quick-result", reportResult());
  score.id = "report-quick-result";
  score.setAttribute("role", "status");
  result.append(board, score);
  const context = reportSection("Match"),
    grid = el("div", "report-grid");
  grid.append(
    reportField("Adversaire", currentReport.info.opponent, (v) => {
      currentReport.info.opponent = v;
      awayName.textContent = v || "Adversaire";
    }),
    reportField(
      "Date",
      currentReport.info.date,
      (v) => (currentReport.info.date = v),
      { type: "date" },
    ),
  );
  context.append(grid);
  layout.append(result, context);
  panel.append(layout);
  root.replaceChildren(panel);
  renderReportEvents(panel);
  renderReportQuickMinutes(panel);
  const actions = el("div", "report-actions");
  const validate = el("button", "primary", "Valider le bilan");
  validate.id = "report-quick-validate";
  validate.type = "button";
  validate.onclick = () => documentCompletionFinish("report");
  actions.append(validate);
  panel.append(actions);
}
document.addEventListener("DOMContentLoaded", () => {
  const before = renderReportContent;
  renderReportContent = function () {
    before();
    renderReportQuick();
  };
  if (reportTab === "general") renderReportContent();
});
