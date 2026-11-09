// Attendance is edited on player rows; the former collective disclosure is retired.
window.reportAttendanceRowsOnly = true;
// Reuse the existing inputs and canonical attendance commits; never persist aggregate counters.
document.addEventListener('DOMContentLoaded', () => {
  function ensureRow(player, entry) {
    let row = entry || currentReport.players.find(r => playerStatsResolve(r)?.id === player?.id);
    if (!row && player && currentReport.players.length < 40) {
      row = {id: crypto.randomUUID(), squadPlayerId: player.id, name: player.name, number: String(player.number || ''), role: 'Titulaire', minutes: '', score: '', note: '', objective: ''};
      currentReport.players.push(row);
    }
    return row;
  }
  function week() {
    const anchor = trainingDateValid(currentReport.info.date) ? currentReport.info.date : playerStatsNow().day;
    const from = trainingWeekStart(anchor);
    return {includeFuture: true, year: playerStatsSeason(anchor), from, cutoff: agendaCalendarAdd(from, 6)};
  }
  function attendanceControls(player, events, options, reportRow) {
    const group = el('div', 'report-row-attendance');
    if (!player) {
      if (!reportRow) return group;
      const roster = squadPlayers();
      if (!roster.length) {
        group.append(el('small', 'hint', 'Ajoutez les fiches joueurs dans Votre effectif pour pointer leurs présences.'));
        return group;
      }
      const label = el('label', 'report-field report-attendance-player-link', 'Fiche joueur pour les présences'),picker = el('select');
      picker.setAttribute('aria-label', 'Associer la fiche de ' + reportRow.name);
      picker.append(new Option('Associer à votre effectif…', ''));
      const used = new Set(currentReport.players.filter(row => row.id !== reportRow.id).map(row => playerStatsResolve(row)?.id).filter(Boolean));
      for (const candidate of roster) {
        const option = new Option(candidate.name + ' · n° ' + candidate.number, candidate.id);
        option.disabled = used.has(candidate.id);picker.append(option);
      }
      const reportId = currentReport.id, owner = activeCoach.id + ':' + activeCoachTeam.id;
      picker.onchange = () => {
        if (currentReport.id !== reportId || owner !== activeCoach.id + ':' + activeCoachTeam.id) return;
        const row = currentReport.players.find(candidate => candidate.id === reportRow.id);
        const selected = squadPlayers().find(candidate => candidate.id === picker.value);
        if (!row || !selected || currentReport.players.some(candidate => candidate.id !== row.id && playerStatsResolve(candidate)?.id === selected.id)) { picker.value = '';return; }
        row.squadPlayerId = selected.id;row.name = selected.name;row.number = String(selected.number);
        reportAutosave();renderReportContent();
      };
      label.append(picker);group.append(label);
      return group;
    }
    for (const event of events) {
      const label = el('div', 'report-row-day');
      const weekday = new Intl.DateTimeFormat('fr-FR', {weekday: 'short', timeZone: 'UTC'}).format(new Date(event.date + 'T12:00:00Z'));
      const dayNumber = new Date(event.date + 'T12:00:00Z').getUTCDay();
      const badge = el('button', 'report-presence-badge', ['D','L','Ma','M','J','V','S'][dayNumber]);
      badge.type = 'button';
      label.append(badge);
      if (events.filter(e => e.date === event.date).length > 1) label.append(el('small', '', event.time));
      const now = playerStatsNow();
      const future = event.date + 'T' + event.time > now.day + 'T' + now.time;
      if (future) badge.dataset.upcoming = 'true';
      label.title = agendaCalendarDateLabel(event.date) + ' · ' + event.time + (future ? ' · À venir, hors statistiques jusqu’à la séance' : '');
      const select = el('select');
      select.classList.add('report-presence-native');
      select.tabIndex = -1;
      select.setAttribute('aria-hidden', 'true');
      select.setAttribute('aria-label', 'Présence ' + player.name + ' · ' + event.date + ' · ' + event.time);
      select.append(new Option('—', 'uncertain'), new Option('Présent', 'present'), new Option('Absent', 'absent'));
      const read = () => {
        const session = playerAttendanceSessions.sessionFor(event);
        const row = session?.attendance?.date === event.date && session?.attendance?.time === event.time
          ? session.attendance.rows.find(r => r.id === player.id || r.squadPlayerId === player.id) : null;
        return {session, value: row?.included ? row.status : 'uncertain'};
      };
      const initial = read();
      let baseline = JSON.stringify(initial.session || null);
      select.value = initial.value;
      select.dataset.status = initial.value;
      function paintBadge() {
        const text = {uncertain:'À confirmer',present:'Présent',absent:'Absent'}[select.value];
        badge.dataset.status = select.value;
        badge.setAttribute('aria-pressed', select.value === 'uncertain' ? 'mixed' : String(select.value === 'present'));
        badge.setAttribute('aria-label', player.name + ' · ' + weekday + ' · ' + event.time + ' · ' + text + (future ? ' · à venir' : ''));
        badge.title = label.title + ' · ' + text + ' · Cliquer pour changer';
      }
      paintBadge();
      badge.onclick = () => {
        const next = {uncertain:'present',present:'absent',absent:'uncertain'};
        select.value = next[select.value] || 'present';
        select.dispatchEvent(new Event('change'));
      };
      const reportId = currentReport.id, owner = activeCoach.id + ':' + activeCoachTeam.id;
      select.onchange = () => {
        try {
          if (currentReport.id !== reportId) throw Error('Le bilan a changé. Actualisez le pointage.');
          playerAttendanceSessions.commit({options, expectedOwner: owner, batches: [{key: playerAttendanceSessions.occurrenceKey(event), baseline, responses: [{playerId: player.id, status: select.value}]}]});
          const row = currentReport.players.find(r => playerStatsResolve(r)?.id === player.id);
          if (row) row.attendanceMode = 'auto';
          reportAutosave();
          baseline = JSON.stringify(read().session || null);
          select.dataset.status = select.value;
          paintBadge();
          status.textContent = 'Présence enregistrée.';
        } catch (error) {
          const value = read(); select.value = value.value;
          select.dataset.status = value.value;
          baseline = JSON.stringify(value.session || null);
          paintBadge();
          status.textContent = error.message || 'Pointage non enregistré. Réessayez.';
        }
      };
      // Other players may update this occurrence: the next change must use its latest snapshot.
      select._refreshAttendance = () => { const value = read(); baseline = JSON.stringify(value.session || null); select.value = value.value; select.dataset.status = value.value; paintBadge(); };
      label.append(select);
      group.append(label);
    }
    return group;
  }
  let status = el('p', 'report-row-status');
  status.setAttribute('role', 'status');
  function decorate() {
    const panel = $('report-players-panel');
    if (!panel) return;
    panel.classList.add('report-player-rows');
    const options = week();
    const events = playerAttendanceSessions.events(options).sort((a,b) => playerAttendanceSessions.occurrenceKey(a).localeCompare(playerAttendanceSessions.occurrenceKey(b)));
    panel.querySelector('.report-row-period')?.remove();
    panel.querySelector('.report-row-attendance-empty')?.remove();
    {
      const caption = el('p', 'hint report-row-period', 'Présences · semaine du ' + options.from.split('-').reverse().join('/') + ' · clic : présent / absent / à confirmer');
      panel.prepend(caption);
    }
    if (!events.length) {
      const empty = el('div', 'report-panel report-row-attendance-empty');
      empty.setAttribute('role', 'status');
      const end = options.cutoff.split('-').reverse().join('/');
      empty.append(el('p', '', 'Aucune séance de l’agenda pour cette équipe du ' + options.from.split('-').reverse().join('/') + ' au ' + end + '. Les jours de présence apparaissent quand les entraînements sont programmés sur cette semaine.'));
      if (!trainingDateValid(currentReport.info.date)) empty.append(el('p', 'hint', 'Le bilan n’a pas encore de date de match : la semaine actuelle est affichée. Renseignez la date du match pour retrouver ses séances.'));
      const configure = el('button', 'export', 'Configurer les jours de séance');
      configure.type = 'button';
      configure.onclick = () => agendaRecurringConfigure();
      empty.append(configure);
      panel.querySelector('.report-row-period').after(empty);
    }
    // Rebuild only presence controls when the agenda changes; preserve active statistics inputs.
    for (const node of panel.querySelectorAll('.report-player-row-ready')) {
      const row = currentReport.players.find(r => r.id === node.dataset.reportPlayer);
      let player = row && playerStatsResolve(row);
      if (!player && node.dataset.attendanceRosterId) player = squadPlayers().find(p => p.id === node.dataset.attendanceRosterId);
      node.querySelector('.report-row-attendance')?.replaceWith(attendanceControls(player, events, options, row));
    }
    for (const card of panel.querySelectorAll('.report-player:not(.report-player-row-ready)')) {
      card.classList.add('report-player-row-ready');
      const row = currentReport.players.find(r => r.id === card.dataset.reportPlayer);
      if (!row) continue;
      const player = playerStatsResolve(row);
      const heading = card.querySelector('.section-heading');
      const quick = el('div', 'report-row-quick');
      quick.append(attendanceControls(player, events, options, row));
      for (const name of ['Minutes jouées', 'Cartons jaunes', 'Cartons rouges']) {
        const input = card.querySelector('[aria-label="' + name + '"]') || [...card.querySelectorAll('label')].find(l => l.querySelector('span')?.textContent === name)?.querySelector('input');
        if (input) { input.setAttribute('aria-label', name); quick.append(input.closest('label')); }
      }
      const details = el('details', 'report-row-details');
      details.append(el('summary', '', 'Détails'));
      for (const child of [...card.children]) if (child !== heading) details.append(child);
      const remove = heading?.querySelector('.report-player-remove');
      if (remove) details.append(remove);
      card.append(quick, details);
    }
    for (const line of panel.querySelectorAll('.report-minute-line:not(.report-player-row-ready)')) {
      line.classList.add('report-player-row-ready');
      const index = [...panel.querySelectorAll('.report-minute-line')].indexOf(line);
      const roster = squadPlayers().filter(p => !currentReport.preparation?.imported || currentReport.players.some(r => playerStatsResolve(r)?.id === p.id));
      const entries = [...roster.map(player => ({player, row: currentReport.players.find(r => playerStatsResolve(r)?.id === player.id)})), ...currentReport.players.filter(r => !playerStatsResolve(r)).map(row => ({row, player:null}))];
      const entry = entries[index]; if (!entry) continue;
      if (entry.row) line.dataset.reportPlayer = entry.row.id;
      if (entry.player) line.dataset.attendanceRosterId = entry.player.id;
      line.querySelector(':scope > span').textContent = entry.player?.name || entry.row?.name || 'Joueur';
      line.insertBefore(attendanceControls(entry.player, events, options, entry.row), line.querySelector('label'));
      for (const [key, title] of [['yellowCards','Cartons jaunes'],['redCards','Cartons rouges']]) {
        const field = reportField(title, entry.row?.[key] ?? '', value => {
          entry.row = ensureRow(entry.player, entry.row);
          if (entry.row) entry.row[key] = value;
        }, {type:'number',max:99});
        const input = field.querySelector('input'); input.setAttribute('aria-label', title + ' · ' + (entry.player?.name || entry.row?.name || 'Joueur'));
        input.readOnly = !!entry.row?.eventStats && Object.hasOwn(entry.row.eventStats,key);
        if (input.readOnly) field.title = 'Calculé depuis les faits marquants';
        input.disabled = !entry.row && currentReport.players.length >= 40;
        line.append(field);
      }
    }
    panel.append(status);
  }
  const render = renderReportContent;
  renderReportContent = function(...args) { const value = render.apply(this,args); decorate(); return value; };
  const minutes = renderReportQuickMinutes;
  renderReportQuickMinutes = function(...args) { const value = minutes.apply(this,args); decorate(); return value; };
  document.addEventListener('attendance-saved', () => {
    document.querySelectorAll('.report-row-attendance select').forEach(input => input._refreshAttendance?.());
  });
  document.addEventListener('agenda-recurrence-updated', () => {
    if (document.body.classList.contains('reports-mode')) {
      decorate();
      reportAttendanceInline.render();
    }
  });
  document.addEventListener('input', event => {
    if(event.target.matches('#report-content input[type="date"]') && !event.target.closest('#report-attendance-inline')) decorate();
  });
  decorate();
});
