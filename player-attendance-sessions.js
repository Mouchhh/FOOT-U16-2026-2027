// Explicit per-player pointage of real recurring occurrences. Never infer absence from an empty slot.
(() => {
  "use strict";
  const owner = () => activeCoach.id + ":" + activeCoachTeam.id;
  const occurrenceKey = (s) => s.date + "T" + s.time;
  function sessionFor(event) {
    const exact = trainingLibrary
      .filter(
        (s) =>
          trainingValid(s) &&
          !s.libraryOnly &&
          playerStatsOwns(s) &&
          occurrenceKey(s) === occurrenceKey(event),
      )
      .sort(
        (a, b) =>
          (Date.parse(b.attendance?.validatedAt) || 0) -
            (Date.parse(a.attendance?.validatedAt) || 0) ||
          playerStatsStamp(b) - playerStatsStamp(a),
      )[0];
    return (
      exact ||
      (event.session &&
        trainingLibrary.find(
          (s) => s.id === event.session.id && playerStatsOwns(s),
        ))
    );
  }
  function events({ year, date, cutoff, from, includeFuture = false }) {
    const now = playerStatsNow(),
      end = year + 1 + "-06-30";
    const range = {
      from: date || from || year + "-07-01",
      to: date || (cutoff && cutoff < end ? cutoff : end),
    };
    const merged = new Map();
    // Use the same resolved appointments as the calendar: exceptions, edits and team scope included.
    const listed = agendaCalendarAllEvents(range);
    for (const event of listed) {
      if (
        event.kind === "training" &&
        event.date >= range.from &&
        event.date <= range.to &&
        (!event.session || playerStatsOwns(event.session))
      )
        merged.set(occurrenceKey(event), event);
    }
    return [...merged.values()]
      .filter((e) => includeFuture || e.date + "T" + e.time <= now.day + "T" + now.time)
      .sort((a, b) => occurrenceKey(b).localeCompare(occurrenceKey(a)));
  }
  function commit({ options, batches, expectedOwner }) {
    if (expectedOwner !== owner())
      throw Error("Le coach ou l’équipe a changé. Rouvrez les présences.");
    const current = new Map(events(options).map((e) => [occurrenceKey(e), e]));
    const roster = squadPlayers();
    let next = [...trainingLibrary];
    const updated = [];
    for (const batch of batches) {
      const event = current.get(batch.key);
      if (!event)
        throw Error(
          "Une séance a été déplacée ou supprimée. Actualisez les créneaux.",
        );
      const stored = sessionFor(event);
      if (JSON.stringify(stored || null) !== batch.baseline)
        throw Error(
          "Les présences ont changé ailleurs. Actualisez le pointage avant de le modifier.",
        );
      if (
        stored?.id === currentTraining.id &&
        (JSON.stringify(currentTraining.attendance) !==
          JSON.stringify(stored.attendance) ||
          currentTraining.date !== stored.date ||
          currentTraining.time !== stored.time)
      )
        throw Error(
          "Des présences sont modifiées dans la séance ouverte. Enregistrez-les avant de poursuivre.",
        );
      const session = stored ? structuredClone(stored) : newTraining();
      session.date = event.date;
      session.time = event.time;
      session.title = event.title.slice(0, 100);
      if (event.category) session.category = event.category;
      const old = session.attendance,
        matching = old?.date === event.date && old?.time === event.time;
      const rows = old
        ? structuredClone(old.rows).map((r) => ({
            ...r,
            status: matching ? r.status : "uncertain",
          }))
        : roster.map((p) => ({
            id: p.id,
            name: p.name,
            status: "uncertain",
            keeper: /gardien/i.test(p.position),
            included: true,
          }));
      for (const response of batch.responses) {
        const player = roster.find((p) => p.id === response.playerId);
        if (
          !player ||
          !["present", "absent", "uncertain"].includes(response.status)
        )
          throw Error(
            "Le joueur ou la réponse n’est plus disponible. Actualisez ce pointage.",
          );
        let row = rows.find(
          (r) => r.id === player.id || r.squadPlayerId === player.id,
        );
        if (!row) {
          row = {
            id: player.id,
            name: player.name,
            status: "uncertain",
            keeper: /gardien/i.test(player.position),
            included: true,
          };
          rows.push(row);
        }
        row.status = response.status;
        row.included = true;
      }
      session.attendance = {
        version: 1,
        source: "manual",
        validationScope: "individual",
        date: event.date,
        time: event.time,
        validatedAt: new Date().toISOString(),
        rows,
      };
      session.updatedAt = new Date().toISOString();
      if (!trainingValid(session))
        throw Error(
          "Ce pointage ne peut pas être enregistré. Vérifiez les données de la séance.",
        );
      next = [session, ...next.filter((s) => s.id !== session.id)];
      updated.push(session);
    }
    if (!batches.length) return;
    coachStorageSet("vestiaire-training-library", JSON.stringify(next));
    trainingLibrary = next;
    const draft = updated.find((s) => s.id === currentTraining.id);
    if (draft) {
      currentTraining.attendance = structuredClone(draft.attendance);
      currentTraining.date = draft.date;
      currentTraining.time = draft.time;
      saveTrainingDraft();
      syncTrainingForm();
    }
    renderTrainingLibrary();
    renderCoachAgenda();
    if (typeof playerStatsRefresh === "function") playerStatsRefresh();
    document.dispatchEvent(new Event("attendance-saved"));
  }
  function open(options = {}) {
    if ($("player-attendance-sessions")?.open) return;
    const context = owner(),
      year = options.year ?? playerStatsSeason();
    const dialog = el("dialog", "completion-dialog player-attendance-sessions");
    dialog.id = "player-attendance-sessions";
    const heading = el("div", "section-heading"),
      title = el("h2", "", "Présences aux séances"),
      close = el("button", "icon-button", "×");
    title.id = "player-attendance-sessions-title";
    dialog.setAttribute("aria-labelledby", title.id);
    close.type = "button";
    close.setAttribute("aria-label", "Fermer les présences aux séances");
    heading.append(title, close);
    const picker = el("select"),
      label = el("label", "report-field", "Joueur"),
      list = el("div", "attendance-session-list"),
      hint = el(
        "p",
        "hint",
        "Choisissez Présent, Absent ou À confirmer pour chaque séance, puis enregistrez. Les créneaux sans réponse ne comptent pas comme des absences. Seules les séances passées de cette équipe sont proposées.",
      );
    picker.setAttribute("aria-label", "Joueur du pointage");
    picker.append(
      new Option("Choisir un joueur", ""),
      ...squadPlayers().map((p) => new Option(p.name, p.id)),
    );
    picker.value = options.playerId || "";
    label.append(picker);
    const status = el("p", "hint"),
      save = el("button", "primary", "Enregistrer les présences");
    status.setAttribute("role", "status");
    save.type = "button";
    const confirmed = el("input"),
      confirmation = el("label", "attendance-session-confirm");
    confirmed.type = "checkbox";
    confirmation.append(
      confirmed,
      document.createTextNode("J’ai vérifié ces réponses de présence."),
    );
    let changes = new Map(),
      baseline = new Map(),
      displayed = [];
    const dirty = () => changes.size > 0;
    const mayClose = () =>
      !dirty() || confirm("Fermer sans enregistrer les présences modifiées ?");
    close.onclick = () => {
      if (mayClose()) dialog.close();
    };
    dialog.addEventListener("cancel", (e) => {
      if (!mayClose()) e.preventDefault();
    });
    function render() {
      list.replaceChildren();
      changes.clear();
      baseline.clear();
      confirmed.checked = false;
      displayed = events({ ...options, year });
      if (!picker.value)
        list.append(
          el("p", "hint", "Sélectionnez un joueur de votre effectif."),
        );
      else if (!displayed.length)
        list.append(
          el(
            "p",
            "hint",
            "Aucune séance passée pour cette période. Configurez vos créneaux dans l’agenda ou enregistrez une séance datée.",
          ),
        );
      else
        for (const event of displayed) {
          const stored = sessionFor(event),
            validAttendance =
              stored?.attendance?.date === event.date &&
              stored.attendance.time === event.time;
          const rows = validAttendance ? stored.attendance.rows : [];
          const old = rows.find(
            (r) => r.id === picker.value || r.squadPlayerId === picker.value,
          );
          const row = el("label", "attendance-session-choice"),
            who = el("span"),
            select = el("select");
          who.append(
            el(
              "strong",
              "",
              agendaCalendarDateLabel(event.date) + " · " + event.time,
            ),
            el("small", "", event.title),
          );
          select.setAttribute(
            "aria-label",
            "Présence du " + event.date + " à " + event.time,
          );
          for (const [value, text] of [
            ["uncertain", "À confirmer"],
            ["present", "Présent"],
            ["absent", "Absent"],
          ])
            select.append(new Option(text, value));
          select.value = old?.included ? old.status : "uncertain";
          baseline.set(occurrenceKey(event), JSON.stringify(stored || null));
          const before = select.value;
          select.onchange = () => {
            confirmed.checked = false;
            if (select.value === before) changes.delete(occurrenceKey(event));
            else changes.set(occurrenceKey(event), select.value);
            status.textContent = "";
          };
          row.append(who, select);
          list.append(row);
        }
      save.disabled = !picker.value || !displayed.length;
    }
    picker.onchange = () => {
      if (
        dirty() &&
        !confirm("Changer de joueur sans enregistrer les présences modifiées ?")
      ) {
        picker.value = picker.dataset.previous || "";
        return;
      }
      picker.dataset.previous = picker.value;
      render();
    };
    picker.dataset.previous = picker.value;
    save.onclick = () => {
      if (context !== owner()) {
        status.textContent =
          "Le coach ou l’équipe a changé. Rouvrez les présences.";
        return;
      }
      const player = squadPlayers().find((p) => p.id === picker.value);
      if (!player) {
        status.textContent =
          "Sélectionnez un joueur encore présent dans votre effectif.";
        return;
      }
      if (!changes.size) {
        status.textContent = "Sélectionnez au moins une réponse à enregistrer.";
        return;
      }
      if (!confirmed.checked) {
        status.textContent = "Confirmez que vous avez vérifié les réponses.";
        return;
      }
      try {
        commit({
          options: { ...options, year },
          expectedOwner: context,
          batches: [...changes].map(([key, status]) => ({
            key,
            baseline: baseline.get(key),
            responses: [{ playerId: player.id, status }],
          })),
        });
        changes.clear();
        options.onSaved?.();
        dialog.close();
        notify("Présences enregistrées. Le taux automatique est actualisé.");
      } catch (error) {
        status.textContent =
          error.message ||
          "Enregistrement impossible. Vos réponses restent ouvertes.";
      }
    };
    dialog.append(heading, hint, label, list, confirmation, status, save);
    document.body.append(dialog);
    dialog.addEventListener("close", () => dialog.remove(), { once: true });
    render();
    dialog.showModal();
  }
  window.playerAttendanceSessions = {
    open,
    events,
    commit,
    sessionFor,
    occurrenceKey,
  };
})();
