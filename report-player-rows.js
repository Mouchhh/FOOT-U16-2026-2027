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
    return {year: playerStatsSeason(anchor), from, cutoff: agendaCalendarAdd(from, 6)};
  }
  function attendanceControls(player, events, options) {
    const group = el('div', 'report-row-attendance');
    if (!player) return group;
    for (const event of events) {
      const label = el('label', 'report-row-day');
      const weekday = new Intl.DateTimeFormat('fr-FR', {weekday: 'short', timeZone: 'UTC'}).format(new Date(event.date + 'T12:00:00Z'));
      label.append(el('span', '', weekday + (events.filter(e => e.date === event.date).length > 1 ? ' · ' + event.time : '')));
      label.title = agendaCalendarDateLabel(event.date) + ' · ' + event.time;
      const select = el('select');
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
          status.textContent = 'Présence enregistrée.';
        } catch (error) {
          const value = read(); select.value = value.value;
          select.dataset.status = value.value;
          baseline = JSON.stringify(value.session || null);
          status.textContent = error.message || 'Pointage non enregistré. Réessayez.';
        }
      };
      // Other players may update this occurrence: the next change must use its latest snapshot.
      select._refreshAttendance = () => { const value = read(); baseline = JSON.stringify(value.session || null); select.value = value.value; select.dataset.status = value.value; };
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
    if (!panel.querySelector('.report-row-period')) {
      const caption = el('p', 'hint report-row-period', 'Présences · semaine du ' + options.from.split('-').reverse().join('/') + ' · — : à confirmer');
      panel.prepend(caption);
    }
    for (const card of panel.querySelectorAll('.report-player:not(.report-player-row-ready)')) {
      card.classList.add('report-player-row-ready');
      const row = currentReport.players.find(r => r.id === card.dataset.reportPlayer);
      if (!row) continue;
      const player = playerStatsResolve(row);
      const heading = card.querySelector('.section-heading');
      const quick = el('div', 'report-row-quick');
      quick.append(attendanceControls(player, events, options));
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
      line.querySelector(':scope > span').textContent = entry.player?.name || entry.row?.name || 'Joueur';
      line.insertBefore(attendanceControls(entry.player, events, options), line.querySelector('label'));
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
  decorate();
});
