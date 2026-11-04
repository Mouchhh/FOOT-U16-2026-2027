// Point every player on a real agenda occurrence directly inside the match report.
(() => {
  "use strict";
  const drafts = new Map();
  const owner = () => activeCoach.id + ":" + activeCoachTeam.id;
  const key = () => owner() + ":" + currentReport.id;
  function state() {
    const id = key();
    if (!drafts.has(id))
      drafts.set(id, {
        anchor: "",
        from: "",
        to: "",
        selected: "",
        answers: new Map(),
        baseline: null,
        dirty: false,
        open: false,
        auto: true,
      });
    const s = drafts.get(id),
      anchor = trainingDateValid(currentReport.info.date)
        ? currentReport.info.date
        : playerStatsNow().day;
    if (s.anchor !== anchor && !s.dirty) {
      s.anchor = anchor;
      s.from = trainingWeekStart(anchor);
      s.to = agendaCalendarAdd(s.from, 6);
      s.selected = "";
    }
    return s;
  }
  function render() {
    const root = $("report-content");
    root?.querySelector("#report-attendance-inline")?.remove();
    if (!root || !["general", "players"].includes(reportTab)) return;
    const s = state(),
      reportId = currentReport.id,
      context = owner(),
      year = playerStatsSeason(s.anchor);
    const options = () => ({ year, from: s.from, cutoff: s.to });
    const panel = el("details", "report-attendance-inline");
    panel.id = "report-attendance-inline";
    panel.open = s.open;
    const summary = el(
      "summary",
      "",
      "Pointer les présences aux entraînements",
    );
    panel.append(summary);
    const filters = el("div", "report-attendance-filters");
    const dateField = (title, value) => {
      const label = el("label", "report-field", title),
        input = el("input");
      input.type = "date";
      input.value = value;
      input.setAttribute("aria-label", title);
      label.append(input);
      filters.append(label);
      return input;
    };
    const from = dateField("Présences du", s.from),
      to = dateField("Présences au", s.to),
      label = el("label", "report-field", "Séance de l’agenda"),
      select = el("select");
    select.setAttribute("aria-label", "Séance de l’agenda");
    label.append(select);
    const status = el("p", "hint"),
      list = el("div", "report-attendance-roster"),
      actions = el("div", "report-actions"),
      save = el("button", "primary", "Enregistrer le pointage"),
      cancel = el("button", "export", "Annuler les modifications"),
      refresh = el("button", "export", "Actualiser les créneaux");
    save.type = cancel.type = refresh.type = "button";
    status.setAttribute("role", "status");
    const checked = el("input"),
      confirmation = el("label", "attendance-session-confirm");
    checked.type = "checkbox";
    checked.setAttribute("aria-label", "Confirmer le pointage de cette séance");
    confirmation.append(
      checked,
      document.createTextNode("J’ai vérifié les présences de cette séance."),
    );
    const autoLabel = el("label", "report-attendance-auto"),
      auto = el("input");
    auto.type = "checkbox";
    auto.checked = s.auto;
    auto.setAttribute("aria-label", "Enregistrement immédiat");
    autoLabel.append(auto, document.createTextNode("Enregistrement immédiat"));
    auto.onchange = () => {
      s.auto = auto.checked;
    };
    const weekBar = el("div", "report-attendance-week");
    const previousWeek = el("button", "export", "←"),
      nextWeek = el("button", "export", "→"),
      matchWeek = el("button", "export", "Semaine du bilan"),
      weekCaption = el("span");
    previousWeek.type = nextWeek.type = matchWeek.type = "button";
    previousWeek.setAttribute("aria-label", "Semaine de présence précédente");
    nextWeek.setAttribute("aria-label", "Semaine de présence suivante");
    weekBar.append(previousWeek, weekCaption, nextWeek, matchWeek);
    const dayButtons = el("div", "report-attendance-days");
    dayButtons.setAttribute("role", "group");
    dayButtons.setAttribute("aria-label", "Jours de séance de l’agenda");
    const advanced = el("details", "report-attendance-advanced");
    advanced.append(el("summary", "", "Autre période ou séance"), filters, label);
    function chooseWeek(start) {
      if (s.dirty) return;
      s.from = trainingWeekStart(start);
      s.to = agendaCalendarAdd(s.from, 6);
      s.selected = "";
      from.value = s.from;
      to.value = s.to;
      sessions();
    }
    previousWeek.onclick = () => chooseWeek(agendaCalendarAdd(s.from, -7));
    nextWeek.onclick = () => chooseWeek(agendaCalendarAdd(s.from, 7));
    matchWeek.onclick = () => chooseWeek(s.anchor);
    let available = [],
      event = null,
      ratios = new Map();
    function rate(player) {
      const a = ratios.get(player.id)?.attendance;
      if (!a) return "—";
      const before = a.entries.find(
        (e) => e.date === event.date && e.time === event.time,
      )?.status;
      const answer = s.answers.get(player.id) || "uncertain";
      const applies = playerStatsInSeason(event.date, year);
      const present =
          a.present +
          (applies
            ? Number(answer === "present") - Number(before === "present")
            : 0),
        absent =
          a.absent +
          (applies
            ? Number(answer === "absent") - Number(before === "absent")
            : 0);
      return present + absent
        ? Math.round((present / (present + absent)) * 100) + " %"
        : "—";
    }
    function paintRates() {
      for (const line of list.children) {
        const player = squadPlayers().find(
          (p) => p.id === line.dataset.attendancePlayer,
        );
        if (player)
          line.querySelector(".report-attendance-rate").textContent =
            rate(player);
      }
    }
    function lock() {
      from.disabled = to.disabled = select.disabled = s.dirty;
      previousWeek.disabled = nextWeek.disabled = matchWeek.disabled = s.dirty;
      for (const button of dayButtons.children) {
        button.disabled = s.dirty;
        button.setAttribute("aria-pressed", String(button.dataset.occurrence === s.selected));
      }
      cancel.hidden = !s.dirty;
      save.disabled = !event || !squadPlayers().length;
    }
    function load() {
      event =
        available.find(
          (e) => playerAttendanceSessions.occurrenceKey(e) === s.selected,
        ) || null;
      list.replaceChildren();
      if (!event) {
        save.disabled = true;
        lock();
        return;
      }
      const stored = playerAttendanceSessions.sessionFor(event);
      if (!s.dirty) {
        s.baseline = JSON.stringify(stored || null);
        s.answers.clear();
        const rows =
          stored?.attendance?.date === event.date &&
          stored.attendance.time === event.time
            ? stored.attendance.rows
            : [];
        for (const p of squadPlayers()) {
          const row = rows.find(
            (r) => r.id === p.id || r.squadPlayerId === p.id,
          );
          s.answers.set(p.id, row?.included ? row.status : "uncertain");
        }
      }
      // This collective panel previews the live season rate, like the Effectif card.
      ratios = playerStatsSeasonSnapshot(year, {
        now: playerStatsNow(),
      }).players;
      if (!squadPlayers().length)
        list.append(
          el(
            "p",
            "hint",
            "Ajoutez vos joueurs dans Votre effectif pour les pointer ici. Il n’est pas nécessaire de les importer dans le bilan.",
          ),
        );
      for (const player of squadPlayers()) {
        const line = el("div", "report-attendance-player");
        line.dataset.attendancePlayer = player.id;
        const who = el("div");
        who.append(
          el("strong", "", player.name),
          el("small", "", "N° " + player.number),
        );
        const choices = el("div", "report-attendance-choices");
        choices.setAttribute("role", "group");
        choices.setAttribute("aria-label", "Présence de " + player.name);
        for (const [value, title] of [
          ["present", "Présent"],
          ["absent", "Absent"],
          ["uncertain", "À confirmer"],
        ]) {
          const item = el("label"),
            radio = el("input");
          radio.type = "radio";
          radio.name = "pointage-" + reportId + "-" + player.id;
          radio.value = value;
          radio.checked = (s.answers.get(player.id) || "uncertain") === value;
          radio.setAttribute("aria-label", title + " · " + player.name);
          radio.onchange = () => {
            s.answers.set(player.id, value);
            s.dirty = true;
            checked.checked = false;
            status.textContent =
              "Aperçu mis à jour · enregistrez pour synchroniser les fiches joueurs.";
            paintRates();
            lock();
            if (s.auto) {
              checked.checked = true;
              save.onclick();
              list
                .querySelector(
                  'input[value="' +
                    value +
                    '"][aria-label="' +
                    CSS.escape(title + " · " + player.name) +
                    '"]',
                )
                ?.focus({ preventScroll: true });
            }
          };
          item.append(radio, el("span", "", title));
          choices.append(item);
        }
        const figure = el("div", "report-attendance-figure");
        figure.append(
          el("strong", "report-attendance-rate", rate(player)),
          el("small", "", "Saison · auto"),
        );
        line.append(who, choices, figure);
        list.append(line);
      }
      lock();
    }
    function sessions() {
      if (
        !trainingDateValid(s.from) ||
        !trainingDateValid(s.to) ||
        s.from > s.to
      ) {
        available = [];
        status.textContent = "Choisissez une période valide.";
      } else {
        available = playerAttendanceSessions.events(options()).sort((a, b) => playerAttendanceSessions.occurrenceKey(a).localeCompare(playerAttendanceSessions.occurrenceKey(b)));
        status.textContent = available.length
          ? ""
          : "Aucune séance passée sur cette période. Modifiez les dates ou configurez vos créneaux dans l’agenda.";
      }
      dayButtons.replaceChildren();
      weekCaption.textContent = "Du " + s.from.split("-").reverse().join("/") + " au " + s.to.split("-").reverse().join("/");
      select.replaceChildren(
        ...available.map(
          (e) =>
            new Option(
              agendaCalendarDateLabel(e.date) +
                " · " +
                e.time +
                " · " +
                e.title,
              playerAttendanceSessions.occurrenceKey(e),
            ),
        ),
      );
      if (
        s.dirty &&
        s.selected &&
        !available.some(
          (e) => playerAttendanceSessions.occurrenceKey(e) === s.selected,
        )
      ) {
        select.append(new Option("Séance devenue indisponible", s.selected));
        select.value = s.selected;
        load();
        status.textContent =
          "Cette séance a changé. Annulez les modifications puis actualisez les créneaux.";
        return;
      }
      if (
        !available.some(
          (e) => playerAttendanceSessions.occurrenceKey(e) === s.selected,
        )
      )
        s.selected = available[0]
          ? playerAttendanceSessions.occurrenceKey(available[0])
          : "";
      select.value = s.selected;
      for (const occurrence of available) {
        const key = playerAttendanceSessions.occurrenceKey(occurrence);
        const weekday = new Intl.DateTimeFormat("fr-FR", {weekday: "long", timeZone: "UTC"}).format(new Date(occurrence.date + "T12:00:00Z"));
        const button = el("button", "report-attendance-day", "Séance " + weekday + " · " + occurrence.time);
        button.type = "button";
        button.dataset.occurrence = key;
        button.title = agendaCalendarDateLabel(occurrence.date) + " · " + occurrence.time + " · " + occurrence.title;
        button.onclick = () => {
          if (s.dirty) return;
          s.selected = key;
          select.value = key;
          load();
        };
        dayButtons.append(button);
      }
      summary.textContent =
        "Pointer les présences · " + available.length + " séance(s)";
      load();
    }
    from.onchange = () => {
      s.from = from.value;
      s.selected = "";
      sessions();
    };
    to.onchange = () => {
      s.to = to.value;
      s.selected = "";
      sessions();
    };
    select.onchange = () => {
      s.selected = select.value;
      load();
    };
    cancel.onclick = () => {
      s.dirty = false;
      checked.checked = false;
      sessions();
    };
    refresh.onclick = () => {
      if (s.dirty) {
        status.textContent =
          "Enregistrez ou annulez vos modifications avant d’actualiser.";
        return;
      }
      sessions();
    };
    save.onclick = () => {
      if (!event) return;
      if (context !== owner() || reportId !== currentReport.id) {
        status.textContent =
          "Le bilan ou l’équipe a changé. Rouvrez le pointage.";
        return;
      }
      if (!checked.checked) {
        status.textContent = "Confirmez les présences avant d’enregistrer.";
        return;
      }
      try {
        s.dirty = true;
        playerAttendanceSessions.commit({
          options: options(),
          expectedOwner: context,
          batches: [
            {
              key: s.selected,
              baseline: s.baseline,
              responses: [...s.answers].map(([playerId, status]) => ({
                playerId,
                status,
              })),
            },
          ],
        });
        for (const row of currentReport.players)
          if (s.answers.has(playerStatsResolve(row)?.id))
            row.attendanceMode = "auto";
        s.dirty = false;
        checked.checked = false;
        reportAutosave();
        sessions();
        status.textContent =
          "Pointage enregistré. Les taux automatiques et les fiches sont actualisés.";
        root.querySelectorAll("[data-report-player]").forEach((card) => {
          const row = currentReport.players.find(
              (r) => r.id === card.dataset.reportPlayer,
            ),
            control = card.querySelector(
              '[aria-label="Mode de présence aux séances"]',
            );
          if (row && control) {
            control.value = row.attendanceMode || "auto";
            control.dispatchEvent(new Event("change"));
          }
        });
      } catch (error) {
        lock();
        status.textContent =
          error.message ||
          "Enregistrement impossible : vos réponses sont conservées.";
      }
    };
    panel.addEventListener("toggle", () => {
      s.open = panel.open;
    });
    actions.append(save, cancel, refresh);
    const create = el("details", "report-attendance-create");
    create.append(el("summary", "", "+ Ajouter une séance à pointer"));
    const fields = el("div", "report-attendance-filters");
    const make = (caption, type, value) => {
      const label = el("label", "report-field", caption),
        input = el("input");
      input.type = type;
      input.value = value;
      input.setAttribute("aria-label", caption);
      label.append(input);
      fields.append(label);
      return input;
    };
    const day = make("Date de la séance", "date", s.anchor),
      time = make("Heure de la séance", "time", "19:00"),
      title = make("Nom de la séance", "text", "Entraînement");
    title.maxLength = 100;
    const add = el("button", "export", "Créer et pointer cette séance");
    add.type = "button";
    add.onclick = () => {
      if (s.dirty) {
        status.textContent = "Enregistrez ou annulez le pointage en cours.";
        return;
      }
      const now = playerStatsNow();
      if (
        context !== owner() ||
        currentReport.id !== reportId ||
        !trainingDateValid(day.value) ||
        playerStatsSeason(day.value) !== year ||
        !/^\d{2}:\d{2}$/.test(time.value) ||
        day.value + "T" + time.value > now.day + "T" + now.time
      ) {
        status.textContent =
          "Choisissez une séance passée de la saison du bilan, avec une heure valide.";
        return;
      }
      try {
        const existing = playerAttendanceSessions
          .events({ year: playerStatsSeason(day.value), date: day.value })
          .find((e) => e.time === time.value);
        if (!existing) {
          const session = newTraining();
          session.date = day.value;
          session.time = time.value;
          session.title = title.value.trim() || "Entraînement";
          if (!trainingValid(session))
            throw Error("Vérifiez les informations de la séance.");
          const next = [session, ...trainingLibrary];
          coachStorageSet("vestiaire-training-library", JSON.stringify(next));
          trainingLibrary = next;
          renderTrainingLibrary();
          renderCoachAgenda();
        }
        s.from = day.value;
        s.to = day.value;
        s.selected = day.value + "T" + time.value;
        from.value = s.from;
        to.value = s.to;
        sessions();
        create.open = false;
      } catch (error) {
        status.textContent =
          error.message ||
          "Séance non enregistrée. Votre pointage reste conservé.";
      }
    };
    create.append(fields, add);
    panel.append(
      weekBar,
      dayButtons,
      advanced,
      autoLabel,
      list,
      confirmation,
      actions,
      create,
      status,
    );
    root.append(panel);
    sessions();
  }
  document.addEventListener("DOMContentLoaded", () => {
    const before = renderReportContent;
    renderReportContent = function () {
      before();
      render();
    };
    document.addEventListener("input", (e) => {
      if (
        e.target.matches('#report-content input[type="date"]') &&
        !e.target.closest("#report-attendance-inline") &&
        !state().dirty
      )
        render();
    });
    document.addEventListener("attendance-saved", () => {
      if (!state().dirty) render();
    });
    render();
  });
  window.reportAttendanceInline = { render };
})();
