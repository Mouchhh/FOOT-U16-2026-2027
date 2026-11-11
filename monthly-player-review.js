// Read-only monthly aggregates reuse saved-report deduplication and validated attendance.
function monthlyPlayerSnapshot(month) {
  const validMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
  if (!validMonth) throw new Error('Mois invalide');
  const snapshot = playerStatsSeasonSnapshot(playerStatsSeason(month + '-01'), {
    reports: reportLibrary.filter(r => r.info?.date?.startsWith(month)),
    trainings: trainingLibrary.filter(s => s.date?.startsWith(month)),
  });
  // Season overrides are not a monthly roll call; compute from this month's known entries.
  for (const stats of snapshot.players.values()) {
    const a = stats.attendance;
    a.rate = a.present + a.absent ? Math.round(100 * a.present / (a.present + a.absent)) : null;
  }
  return snapshot;
}
function monthlyReviewLastDay(month) {
  return agendaCalendarAdd(agendaCalendarMonth(month, 1) + '-01', -1);
}
document.addEventListener('DOMContentLoaded', () => {
  const panel = el('section', 'monthly-review');
  panel.id = 'monthly-review';
  const controls = el('div', 'monthly-review-controls');
  const label = el('label', 'report-field', 'Bilan mensuel des joueurs');
  const input = el('input');
  input.type = 'month';
  input.id = 'monthly-review-month';
  input.setAttribute('aria-label', 'Mois du bilan des joueurs');
  label.append(input);
  const back = el('button', 'export', 'Vue saison');
  back.type = 'button';
  const content = el('div', 'monthly-review-content');
  content.setAttribute('aria-live', 'polite');
  controls.append(label, back);
  panel.append(controls, content);
  squadList.before(panel);
  function paint() {
    const month = input.value;
    const active = /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
    squadList.closest('.squad-page')?.classList.toggle('monthly-review-mode', active);
    squadList.hidden = active;
    squadList.classList.toggle('monthly-review-hidden', active);
    back.hidden = !active;
    content.replaceChildren();
    if (!active) return;
    const current = monthlyPlayerSnapshot(month), previous = monthlyPlayerSnapshot(agendaCalendarMonth(month, -1));
    content.append(el('p', 'hint', 'Bilans enregistrés et présences pointées uniquement. Les séances sans pointage ne comptent pas comme absences. Évolution par rapport au mois précédent.'));
    if (!current.players.size) content.append(el('p', 'hint', 'Aucun joueur dans cette équipe.'));
    for (const stats of current.players.values()) {
      const row = el('article', 'monthly-player-row');
      row.dataset.monthlyPlayer = stats.player.id;
      const identity = el('div', 'monthly-player-identity');
      const open = el('button', 'player-stat-profile-link', stats.player.name);
      open.type = 'button';
      open.onclick = () => playerStatsOpen(stats.player.id);
      identity.append(open, el('small', '', squadPositionsLabel(stats.player)), squadIdentityBadges(stats.player, stats));
      const metrics = el('div', 'monthly-player-metrics');
      metrics.append(el('strong', '', playerStatsDisplay(stats, 'minutes') + ' min'));
      metrics.append(el('span', '', 'Présence : ' + (stats.attendance.rate === null ? '—' : stats.attendance.rate + ' %') + ' · ' + stats.attendance.present + '/' + (stats.attendance.present + stats.attendance.absent) + ' séances pointées'));
      metrics.append(el('span', '', 'Buts / passes : ' + playerStatsDisplay(stats, 'goals') + ' / ' + playerStatsDisplay(stats, 'assists')));
      const cards = el('span', 'monthly-player-cards');
      for (const [key, color, text] of [['yellowCards', 'yellow', 'Cartons jaunes'], ['redCards', 'red', 'Cartons rouges']]) {
        const item = el('span'); item.setAttribute('aria-label', text + ' : ' + playerStatsDisplay(stats, key));
        const icon = el('i', 'player-stat-card-symbol is-' + color); icon.setAttribute('aria-hidden', 'true');
        item.append(icon, document.createTextNode(playerStatsDisplay(stats, key))); cards.append(item);
      }
      metrics.append(cards);
      const before = previous.players.get(stats.player.id);
      const changes = [];
      if (stats.known.minutes && before?.known.minutes) {
        const delta = stats.totals.minutes - before.totals.minutes;
        changes.push((delta > 0 ? '+' : '') + delta + ' min');
      }
      if (stats.attendance.rate !== null && before?.attendance.rate !== null && before?.attendance.rate !== undefined) {
        const delta = stats.attendance.rate - before.attendance.rate;
        changes.push((delta > 0 ? '+' : '') + delta + ' points de présence');
      }
      metrics.append(el('small', '', changes.length ? 'Évolution : ' + changes.join(' · ') : 'Évolution : comparaison indisponible'));
      row.append(squadCardAvatar(stats.player), identity, metrics);
      content.append(row);
    }
  }
  input.onchange = paint;
  back.onclick = () => { input.value = ''; paint(); };
  window.monthlyPlayerReview = {open(month) {
    workspaceNavigation.run('workspace-squad-entry', () => {
      input.value = month;
      paint();
      panel.scrollIntoView({block: 'start', behavior: 'smooth'});
    });
  }};
  const renderSquad = squadRender;
  squadRender = function(...args) { const result = renderSquad.apply(this, args); paint(); return result; };
  const renderAgenda = renderCoachAgenda;
  renderCoachAgenda = function(...args) {
    const result = renderAgenda.apply(this, args);
    const month = $('coach-agenda-month').value || agendaCalendarToday().slice(0, 7);
    const date = monthlyReviewLastDay(month);
    const reminder = el('button', 'monthly-agenda-reminder', '📌 Bilan mensuel : compiler les stats des joueurs');
    reminder.type = 'button';
    reminder.dataset.monthlyReminder = date;
    reminder.onclick = () => monthlyPlayerReview.open(month);
    const grid = document.querySelector('.agenda-calendar-grid');
    if (grid && !grid.hidden) {
      const day = [...grid.querySelectorAll('.agenda-calendar-day')].find(node => node.dataset.date === date);
      day?.append(reminder);
    } else {
      reminder.prepend(document.createTextNode(agendaCalendarDateLabel(date) + ' · '));
      $('coach-agenda-list').append(reminder);
    }
    return result;
  };
  paint();
  renderCoachAgenda();
});
