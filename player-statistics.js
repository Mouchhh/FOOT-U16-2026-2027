// Report inputs and read-only season cards. No aggregate counters are persisted.
let playerStatsSelectedSeason = null,
  playerStatsDetail = null;
function playerStatsReportContext(panel) {
  if (reportTab === "players") {
    const date = reportField(
      "Date du bilan",
      currentReport.info.date,
      (v) => (currentReport.info.date = v),
      { type: "date" },
    );
    date.querySelector("input").setAttribute("aria-label", "Date du bilan");
    panel.append(date);
  }
  const wrap = el("label", "report-field player-stats-event-type");
  wrap.append(el("span", "", "Ce bilan concerne"));
  const select = el("select");
  select.setAttribute("aria-label", "Ce bilan concerne");
  select.append(
    new Option("Un match", "match"),
    new Option("Une séance", "training"),
  );
  select.value = currentReport.eventType || "match";
  select.onchange = () => {
    currentReport.eventType = select.value;
    reportAutosave();
    renderReportContent();
  };
  wrap.append(select);
  panel.append(wrap);
  if (reportTab !== "general")
    panel.append(
      el(
        "p",
        "hint",
        "Associez chaque joueur à sa fiche d’effectif pour cumuler ses statistiques. Seuls les bilans datés et enregistrés comptent ; le brouillon reste indépendant.",
      ),
    );
}
function playerStatsReportFields(card, row) {
  const section = el("section", "report-player-statistics"),
    header = el("h4", "", "Statistiques et présence");
  section.append(header);
  card.dataset.reportPlayer = row.id;
  const label = el("label", "report-field"),
    picker = el("select");
  label.append(el("span", "", "Fiche dans votre effectif"));
  picker.setAttribute("aria-label", "Fiche dans votre effectif");
  picker.append(new Option("Non associé à l’effectif", ""));
  const linked = playerStatsResolve(row),
    used = new Set(
      currentReport.players
        .filter((p) => p !== row)
        .map((p) => playerStatsResolve(p)?.id)
        .filter(Boolean),
    );
  for (const player of squadPlayers()) {
    const option = new Option(
      player.name + " · n° " + player.number,
      player.id,
    );
    option.disabled = used.has(player.id);
    picker.append(option);
  }
  picker.value = linked?.id || "";
  label.append(picker);
  section.append(label);
  picker.onchange = () => {
    if (used.has(picker.value)) {
      picker.value = linked?.id || "";
      return;
    }
    row.squadPlayerId = picker.value;
    const actual = squadPlayers().find((p) => p.id === picker.value);
    if (actual) {
      row.name = actual.name;
      row.number = String(actual.number);
    }
    reportAutosave();
    renderReportContent();
  };
  const grid = el("div", "report-player-stats-inputs");
  for (const [key, title] of Object.entries(playerStatsFields)) {
    const field = reportField(title, row[key] ?? "", (v) => (row[key] = v), {
      type: "number",
    });
    const input = field.querySelector("input");
    input.setAttribute("aria-label", title);
    if (row.eventStats && Object.hasOwn(row.eventStats, key)) {
      input.readOnly = true;
      field.append(el("small", "hint", "Calculé depuis les faits marquants"));
    }
    grid.append(field);
  }
  section.append(grid);
  const attendance = el("div", "player-attendance-controls"),
    modeLabel = el("label", "report-field"),
    mode = el("select");
  mode.setAttribute("aria-label", "Mode de présence aux séances");
  modeLabel.append(el("span", "", "Présence aux séances"));
  mode.append(
    new Option("Calcul automatique", "auto"),
    new Option("Pourcentage saisi manuellement", "manual"),
  );
  mode.value = row.attendanceMode || "auto";
  modeLabel.append(mode);
  const rateLabel = el("label", "report-field"),
    rate = el("input");
  rateLabel.append(el("span", "", "Taux de présence (%)"));
  rate.type = "number";
  rate.min = "0";
  rate.max = "100";
  rate.step = "1";
  rate.inputMode = "numeric";
  rate.setAttribute("aria-label", "Taux de présence (%)");
  rateLabel.append(rate);
  const hint = el("p", "hint");
  hint.setAttribute("role", "status");
  function paint() {
    const manual = mode.value === "manual",
      year = playerStatsSeason(currentReport.info.date);
    rate.readOnly = !manual;
    rate.value = manual ? row.attendanceRate || "" : "";
    if (manual) {
      hint.textContent =
        "Ce taux manuel sera identifié sur la fiche de saison. Le réglage du dernier bilan daté enregistré de ce joueur fait référence.";
      return;
    }
    if (!linked) {
      hint.textContent =
        "Choisissez une fiche d’effectif pour calculer la présence.";
      return;
    }
    if (year === null) {
      hint.textContent =
        "Renseignez la date du bilan pour identifier la saison.";
      return;
    }
    const now = playerStatsNow(),
      cutoff =
        currentReport.info.date < now.day
          ? { day: currentReport.info.date, time: "23:59" }
          : now,
      a = playerStatsSeasonSnapshot(year, { now: cutoff }).players.get(
        linked.id,
      )?.attendance;
    rate.value =
      a?.autoRate === null || a?.autoRate === undefined
        ? ""
        : String(a.autoRate);
    hint.textContent =
      a && a.autoRate !== null
        ? a.present +
          " présence(s) / " +
          (a.present + a.absent) +
          " séance(s) renseignée(s) · " +
          playerStatsSeasonLabel(year) +
          (a.uncertain ? " · " + a.uncertain + " à confirmer" : "")
        : "Aucun pointage validé pour cette saison. Utilisez « Sélectionner les séances » pour renseigner les présences.";
  }
  mode.onchange = () => {
    row.attendanceMode = mode.value;
    reportAutosave();
    paint();
  };
  rate.oninput = () => {
    row.attendanceRate = rate.value;
    reportAutosave();
  };
  const sessions = el(
    "button",
    "export",
    "Sélectionner les séances · calcul auto",
  );
  sessions.type = "button";
  sessions.disabled =
    !linked || playerStatsSeason(currentReport.info.date) === null;
  sessions.onclick = () =>
    window.playerAttendanceSessions.open({
      playerId: linked.id,
      year: playerStatsSeason(currentReport.info.date),
      cutoff: currentReport.info.date,
      onSaved: () => {
        row.attendanceMode = "auto";
        mode.value = "auto";
        reportAutosave();
        paint();
      },
    });
  attendance.append(modeLabel, rateLabel, sessions, hint);
  section.append(attendance);
  paint();
  card.append(section);
}
function playerStatsPrintRow(parent, row) {
  const values = [
    ...Object.entries(playerStatsFields)
      .filter(([key]) => row[key] !== undefined && row[key] !== "")
      .map(([key, label]) => label + " : " + row[key]),
  ];
  if (
    row.attendanceMode === "manual" &&
    row.attendanceRate !== undefined &&
    row.attendanceRate !== ""
  )
    values.push(
      "Présence aux séances : " + row.attendanceRate + " % (saisie manuelle)",
    );
  else {
    const linked = playerStatsResolve(row),
      year = playerStatsSeason(currentReport.info.date);
    if (linked && year !== null) {
      const now = playerStatsNow(),
        cutoff =
          currentReport.info.date < now.day
            ? { day: currentReport.info.date, time: "23:59" }
            : now,
        a = playerStatsSeasonSnapshot(year, { now: cutoff }).players.get(
          linked.id,
        )?.attendance;
      if (a?.autoRate !== null && a?.autoRate !== undefined)
        values.push(
          "Présence aux séances : " +
            a.autoRate +
            " % (" +
            a.present +
            "/" +
            (a.present + a.absent) +
            " pointages renseignés)",
        );
    }
  }
  if (values.length)
    parent.append(el("p", "report-player-stats-summary", values.join(" · ")));
}
function playerStatsIcon(kind) {
  kind = { contributions: "goals", discipline: "redCards" }[kind] || kind;
  const paths = {
    minutes: "M12 8v4l3 2 M9 2h6 M12 2v2",
    goals: "M12 8l4 3-2 5h-4l-2-5z M3 8l5 3 M21 8l-5 3 M7 20l3-4 M17 20l-3-4",
    assists: "M4 12h15 M14 6l6 6-6 6",
    yellowCards: "M7 3h10v18H7z",
    redCards: "M7 3h10v18H7z",
    attendance: "M5 12l4 4L19 6",
  };
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.7");
  if (["minutes", "goals"].includes(kind)) {
    const circle = document.createElementNS(svg.namespaceURI, "circle");
    circle.setAttribute("cx", "12");
    circle.setAttribute("cy", kind === "minutes" ? "13" : "12");
    circle.setAttribute("r", kind === "minutes" ? "9" : "10");
    svg.append(circle);
  }
  const path = document.createElementNS(svg.namespaceURI, "path");
  path.setAttribute("d", paths[kind] || paths.attendance);
  svg.append(path);
  return svg;
}
function playerStatsMetric(key, label, value) {
  const item = el("div", "player-stat-metric");
  item.dataset.stat = key;
  item.append(
    playerStatsIcon(key),
    el("strong", "", value),
    el("span", "", label),
  );
  if (key === "redCards" || key === "yellowCards")
    item.classList.add("player-stat-discipline");
  return item;
}
function playerStatsPresenceBar(attendance) {
  const box = el("div", "player-stat-attendance"),
    label = el(
      "span",
      "",
      attendance.rate === null
        ? "Présence non renseignée"
        : "Présence · " +
            attendance.rate +
            " %" +
            (attendance.source === "manual" ? " (manuel)" : ""),
    ),
    track = el("div", "player-stat-track"),
    fill = el("span");
  track.setAttribute("role", "progressbar");
  track.setAttribute("aria-label", "Présence aux entraînements");
  track.setAttribute("aria-valuemin", "0");
  track.setAttribute("aria-valuemax", "100");
  if (attendance.rate !== null)
    track.setAttribute("aria-valuenow", String(attendance.rate));
  else track.setAttribute("aria-valuetext", "Non renseignée");
  fill.style.width = (attendance.rate ?? 0) + "%";
  track.append(fill);
  box.append(label, track);
  return box;
}
function playerStatsCurrentSeason() {
  const options = playerStatsAvailableSeasons();
  if (!options.includes(playerStatsSelectedSeason))
    playerStatsSelectedSeason = playerStatsSeason();
  return playerStatsSelectedSeason;
}
function playerStatsDecorateCards() {
  const season = playerStatsCurrentSeason(),
    snapshot = playerStatsSeasonSnapshot(season),
    select = $("player-stats-season");
  if (select) {
    select.replaceChildren(
      ...playerStatsAvailableSeasons().map(
        (y) => new Option(playerStatsSeasonLabel(y), String(y)),
      ),
    );
    select.value = String(season);
  }
  for (const card of squadList.querySelectorAll("[data-player-id]")) {
    const id = card.dataset.playerId,
      stats = snapshot.players.get(id);
    if (!stats) continue;
    const name = card.querySelector(".squad-player-info strong");
    if (name) {
      const open = el("button", "player-stat-profile-link", stats.player.name);
      open.type = "button";
      open.setAttribute(
        "aria-label",
        "Ouvrir le bilan de saison de " + stats.player.name,
      );
      open.onclick = (event) => {
        event.stopPropagation();
        playerStatsOpen(id);
      };
      name.replaceChildren(open);
    }
    const badges = el("div", "player-stat-badges");
    const minutes = playerStatsMetric(
      "minutes",
      "min",
      playerStatsDisplay(stats, "minutes"),
    );
    const presence = playerStatsMetric(
      "attendance",
      "Présence",
      stats.attendance.rate === null ? "—" : stats.attendance.rate + " %",
    );
    minutes.title = "Temps de jeu total";
    presence.title = "Présence aux séances";
    presence.setAttribute("role", "progressbar");
    presence.setAttribute("aria-label", "Présence aux séances");
    presence.setAttribute("aria-valuemin", "0");
    presence.setAttribute("aria-valuemax", "100");
    if (stats.attendance.rate !== null)
      presence.setAttribute("aria-valuenow", String(stats.attendance.rate));
    else presence.setAttribute("aria-valuetext", "Non renseignée");
    const pair = (key, label, fields) => {
      const metric = playerStatsMetric(key, label, "");
      const value = el("div", "player-stat-pair");
      fields.forEach(([field, suffix], index) => {
        if (index) value.append(document.createTextNode(" / "));
        const part = el("span");
        part.dataset.stat = field;
        part.append(el("strong", "", playerStatsDisplay(stats, field)));
        if (suffix) part.append(document.createTextNode(" " + suffix));
        value.append(part);
      });
      metric.querySelector("strong").replaceWith(value);
      return metric;
    };
    const contributions = pair("contributions", "b / p", [
      ["goals", ""],
      ["assists", ""],
    ]);
    contributions.title = "Buts / passes décisives";
    const discipline = el("div", "player-stat-metric player-stat-cards");
    discipline.dataset.stat = "discipline";
    for (const [field, label, color] of [
      ["yellowCards", "Cartons jaunes", "yellow"],
      ["redCards", "Cartons rouges", "red"],
    ]) {
      const item = el("span", "player-stat-card-count"),
        rectangle = el("i", "player-stat-card-symbol is-" + color);
      rectangle.setAttribute("aria-hidden", "true");
      item.dataset.stat = field;
      const value = playerStatsDisplay(stats, field);
      item.title = label + " : " + value;
      item.setAttribute("aria-label", label + " : " + value);
      item.append(rectangle, el("strong", "", value));
      discipline.append(item);
    }
    badges.append(minutes, presence, contributions, discipline);
    const position = card.querySelector(".squad-player-info small");
    if (position)
      position.textContent = stats.player.position || "Poste à préciser";
    const actions = card.querySelector(".squad-row-actions");
    const manage = el("details", "player-stat-manage");
    manage.append(el("summary", "", "Gérer le joueur"), actions);
    card.append(badges, manage);
    card.classList.add("has-player-stats");
    card.onclick = (event) => {
      if (
        !event.target.closest("button,a,input,select,textarea,summary,details")
      )
        playerStatsOpen(id);
    };
  }
}
function playerStatsOpen(id) {
  if (
    !document.body.classList.contains("squad-mode") ||
    document.body.classList.contains("reports-mode")
  )
    return;
  const player = squadPlayers().find((p) => p.id === id);
  if (!player) return;
  const old = $("player-stats-dialog");
  if (old?.open) return;
  old?.remove();
  const dialog = el("dialog", "player-stats-dialog");
  dialog.id = "player-stats-dialog";
  dialog.setAttribute("aria-labelledby", "player-stats-title");
  playerStatsDetail = {
    id,
    coach: activeCoach.id,
    team: activeCoachTeam.id,
    dialog,
  };
  document.body.append(dialog);
  dialog.addEventListener(
    "close",
    () => {
      dialog.remove();
      playerStatsDetail = null;
      document
        .querySelector(
          `[data-player-id="${CSS.escape(id)}"] .player-stat-profile-link`,
        )
        ?.focus({ preventScroll: true });
    },
    { once: true },
  );
  playerStatsPaintDetail();
  dialog.showModal();
}
function playerStatsPaintDetail() {
  const current = playerStatsDetail;
  if (!current) return;
  const player = squadPlayers().find((p) => p.id === current.id);
  if (
    !player ||
    current.coach !== activeCoach.id ||
    current.team !== activeCoachTeam.id
  ) {
    current.dialog.close();
    return;
  }
  const snapshot = playerStatsSeasonSnapshot(playerStatsCurrentSeason()),
    stats = snapshot.players.get(player.id),
    dialog = current.dialog;
  dialog.replaceChildren();
  const head = el("div", "player-stat-profile-head"),
    text = el("div"),
    title = el("h2", "", player.name);
  title.id = "player-stats-title";
  text.append(
    el("p", "eyebrow", "BILAN DE SAISON"),
    title,
    el(
      "p",
      "hint",
      activeCoachTeam.label + " · " + playerStatsSeasonLabel(snapshot.year),
    ),
  );
  const close = el("button", "icon-button", "×");
  close.type = "button";
  close.setAttribute("aria-label", "Fermer le bilan du joueur");
  close.onclick = () => dialog.close();
  head.append(squadCardAvatar(player), text, close);
  text.append(
    el(
      "p",
      "hint",
      [
        "N° " + player.number,
        player.position,
        player.foot ? "Pied : " + player.foot : "",
      ]
        .filter(Boolean)
        .join(" · "),
    ),
  );
  dialog.append(head);
  const season = el("select");
  season.setAttribute("aria-label", "Saison du bilan joueur");
  for (const year of playerStatsAvailableSeasons())
    season.append(new Option(playerStatsSeasonLabel(year), String(year)));
  season.value = String(snapshot.year);
  season.onchange = () => {
    playerStatsSelectedSeason = Number(season.value);
    squadRender();
    playerStatsPaintDetail();
  };
  const label = el("label", "report-field", "Saison");
  label.append(season);
  dialog.append(label);
  const grid = el("div", "player-stat-detail-grid");
  grid.append(
    playerStatsMetric(
      "minutes",
      "minutes",
      playerStatsDisplay(stats, "minutes"),
    ),
    playerStatsMetric(
      "attendance",
      "présence",
      stats.attendance.rate === null ? "—" : stats.attendance.rate + " %",
    ),
  );
  for (const [key, label] of Object.entries(playerStatsFields))
    grid.append(playerStatsMetric(key, label, playerStatsDisplay(stats, key)));
  dialog.append(grid, playerStatsPresenceBar(stats.attendance));
  const a = stats.attendance;
  const source =
    a.source === "manual"
      ? "Saisie manuelle · bilan du " +
        new Intl.DateTimeFormat("fr-FR", {
          timeZone: "UTC",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(a.override.date + "T12:00:00Z"))
      : a.present +
        " présence(s) / " +
        (a.present + a.absent) +
        " séance(s) renseignée(s)" +
        (a.uncertain ? " · " + a.uncertain + " à confirmer" : "");
  const attendanceHistory = el("details", "player-stat-history");
  attendanceHistory.append(
    el("summary", "", "Présences aux séances"),
    el("p", "hint", source),
  );
  for (const row of [...a.entries].sort(
    (x, y) => y.date.localeCompare(x.date) || y.time.localeCompare(x.time),
  )) {
    const item = el("div", "player-stat-history-row");
    item.append(
      el("strong", "", row.date + " · " + row.time + " · " + row.title),
      el(
        "span",
        "player-stat-attendance-state",
        row.status === "present"
          ? "Présent"
          : row.status === "absent"
            ? "Absent"
            : "À confirmer",
      ),
    );
    attendanceHistory.append(item);
  }
  if (!a.entries.length)
    attendanceHistory.append(
      el(
        "p",
        "hint",
        "Aucun pointage validé pour cette saison. Les créneaux sans pointage ne sont pas comptés comme des absences.",
      ),
    );
  const pointage = el("button", "export", "Renseigner les présences");
  pointage.type = "button";
  pointage.onclick = () =>
    window.playerAttendanceSessions.open({
      playerId: player.id,
      year: snapshot.year,
    });
  attendanceHistory.append(pointage);
  dialog.append(attendanceHistory);
  const calculation = el("details", "player-stat-calculation");
  calculation.append(
    el("summary", "", "Comprendre le taux de présence"),
    el(
      "p",
      "hint",
      "Le calcul automatique utilise uniquement les réponses présent ou absent des pointages validés et enregistrés. Les réponses à confirmer sont exclues.",
    ),
    el(
      "p",
      "hint",
      snapshot.scheduled +
        " créneau(x) passé(s) repéré(s) dans l’agenda ou les présences. Sans pointage validé, aucune absence n’est déduite.",
    ),
  );
  attendanceHistory.append(calculation);
  const ratio =
    stats.known.goals && stats.known.assists && stats.totals.assists > 0
      ? (stats.totals.goals / stats.totals.assists).toLocaleString("fr-FR", {
          maximumFractionDigits: 2,
        })
      : "—";
  const contribution = el("div", "player-stat-contributions");
  contribution.append(
    el("strong", "", "Ratio buts / passes : " + ratio),
    el(
      "span",
      "hint",
      playerStatsDisplay(stats, "goals") +
        " buts / " +
        playerStatsDisplay(stats, "assists") +
        " passes décisives",
    ),
  );
  dialog.append(
    contribution,
    el(
      "p",
      "hint",
      stats.matches +
        " bilan(s) de match · " +
        stats.sessions +
        " bilan(s) de séance. Cumul des bilans datés enregistrés, hors brouillons et dates futures.",
    ),
  );
  const history = el("details", "player-stat-history");
  history.append(
    el(
      "summary",
      "",
      "Voir les bilans de la saison (" + stats.reports.length + ")",
    ),
  );
  history.append(
    el(
      "p",
      "hint",
      "Les copies ou remplacements d’un même bilan comptent une seule fois : la version enregistrée la plus récente est retenue.",
    ),
  );
  if (!stats.reports.length)
    history.append(
      el(
        "p",
        "hint",
        "Aucun bilan enregistré et associé à ce joueur pour cette saison.",
      ),
    );
  for (const row of [...stats.reports].reverse()) {
    const item = el("div", "player-stat-history-row");
    item.append(
      el(
        "strong",
        "",
        row.date +
          " · " +
          (row.kind === "training" ? "Séance" : "Match") +
          " · " +
          row.title,
      ),
      el(
        "p",
        "hint",
        (row.minutes === "" ? "—" : row.minutes) +
          " min · " +
          (row.goals || "—") +
          " buts · " +
          (row.assists || "—") +
          " passes · " +
          (row.yellowCards || "—") +
          " jaunes · " +
          (row.redCards || "—") +
          " rouges",
      ),
    );
    history.append(item);
  }
  dialog.append(history);
}
function playerStatsRefresh() {
  if (playerStatsDetail && !document.body.classList.contains("squad-mode"))
    playerStatsDetail.dialog.close();
  if (document.body.classList.contains("squad-mode")) squadRender();
  if (playerStatsDetail) playerStatsPaintDetail();
}
document.addEventListener("DOMContentLoaded", () => {
  const wrap = el("label", "player-stats-season-filter"),
    select = el("select");
  select.id = "player-stats-season";
  select.setAttribute("aria-label", "Saison des statistiques");
  wrap.append(el("span", "", "Saison des statistiques"), select);
  squadFilters.after(wrap);
  select.onchange = () => {
    playerStatsSelectedSeason = Number(select.value);
    squadRender();
  };
  const render = squadRender;
  squadRender = function () {
    render();
    playerStatsDecorateCards();
  };
  const renderReport = renderReportContent;
  renderReportContent = function () {
    renderReport();
    const root = $("after-match"),
      heading = root.querySelector(".reports-heading h1");
    root.dataset.eventKind = currentReport.eventType || "match";
    if (heading)
      heading.textContent =
        currentReport.eventType === "training"
          ? "Bilan de séance"
          : "Bilan du match";
    if (reportTab === "general" && $("report-quick-panel")) {
      const context = el("div", "player-stats-report-context");
      playerStatsReportContext(context);
      $("report-quick-panel").prepend(context);
    }
  };
  if (document.body.classList.contains("reports-mode")) renderReportContent();
  for (const name of ["renderReportLibrary", "renderTrainingLibrary"]) {
    const before = window[name];
    window[name] = function (...args) {
      const result = before(...args);
      playerStatsRefresh();
      return result;
    };
  }
  const clear = clubNetworkClear;
  clubNetworkClear = function () {
    playerStatsDetail?.dialog.close();
    return clear();
  };
  document.addEventListener("report-saved", (event) => {
    if (event.detail?.team !== activeCoachTeam.id) return;
    squadRender();
    if (playerStatsDetail && document.body.classList.contains("squad-mode"))
      playerStatsPaintDetail();
  });
  window.addEventListener("storage", playerStatsRefresh);
  document.addEventListener("club-session-ready", playerStatsRefresh);
  squadRender();
});
