// Active report layout. Legacy fields remain readable without adding empty inputs.
function reportGrowingField(label, value, setter, options = {}) {
  const field = reportField(label, value, setter, {
      area: true,
      rows: 3,
      ...options,
    }),
    input = field.querySelector("textarea");
  const size = () => {
    input.style.height = "auto";
    input.style.height =
      Math.max(100, Math.min(input.scrollHeight, 300)) + "px";
  };
  input.addEventListener("input", size);
  requestAnimationFrame(() => {
    if (input.isConnected) size();
  });
  return field;
}
function reportPreviousNotes(title, entries) {
  const filled = entries.filter(
    ([, value]) => typeof value === "string" && value.trim(),
  );
  if (!filled.length) return null;
  const details = el("details", "report-previous-notes");
  details.append(el("summary", "", title));
  for (const [label, value] of filled) {
    const item = el("div", "report-text-block");
    item.append(el("h3", "", label), el("p", "", value));
    details.append(item);
  }
  return details;
}
function reportAnalysisWorkshopSuggestions(analysis, priority = '') {
  const text = [priority, analysis.improveAttack, analysis.improveDefence, analysis.transitions, analysis.setPieces].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const rules = [
    [/fini|frapp|\btirs?\b|\bbuts?\b|efficac/, 'Finition'],
    [/conserv|pression|maitris|possess/, 'Conservation sous pression'],
    [/transition|recuper|perte|repli|contre/, 'Transitions'],
    [/\bpressing\b|harcel|bloc haut/, 'Pressing collectif'],
    [/relanc|sortie de balle|construct/, 'Sortie de balle'],
    [/defen|couvr|bloc|profondeur/, 'Organisation défensive'],
    [/cpa|arret|corner|coup franc/, 'Coups de pied arrêtés'],
    [/duel|impact/, 'Duels'],
    [/largeur|couloir|debord/, 'Occupation de la largeur'],
  ];
  return rules.filter(([pattern]) => pattern.test(text)).map(([, label]) => label).slice(0, 4);
}
function reportRenderAnalysis(root) {
  const view = el('div', 'report-analysis-modern');
  const grid = el('div', 'report-analysis-cards');
  const field = (label, value, setter, key, placeholder) => {
    const wrap = reportField(label, value || '', setter, { area: true, rows: 2, placeholder });
    const input = wrap.querySelector('textarea');input.dataset.analysisField = key;
    const resize = () => {input.style.height = 'auto';input.style.height = Math.max(48, Math.min(input.scrollHeight, 180)) + 'px';};
    input.addEventListener('input', resize);requestAnimationFrame(resize);return wrap;
  };
  const animations = reportSection('Animations');animations.classList.add('report-analysis-card');
  animations.append(el('p', 'report-analysis-subtitle', 'Ce qui a fait basculer le match.'));
  animations.append(field('Récupération / perte', currentReport.analysis.transitions, v => currentReport.analysis.transitions = v, 'transitions', 'À la récupération… À la perte…'));
  animations.append(field('Phases arrêtées · pour / contre', currentReport.analysis.setPieces, v => currentReport.analysis.setPieces = v, 'setPieces', 'CPA offensifs et défensifs : les faits à retenir…'));
  const ball = el('div', 'report-analysis-ball-fields');
  for (const key of ['withBall', 'withoutBall']) ball.append(field(reportAnalysis[key], currentReport.analysis[key], v => currentReport.analysis[key] = v, key, 'Complément facultatif…'));
  animations.prepend(ball);animations.insertBefore(animations.querySelector('h2'),ball);animations.insertBefore(animations.querySelector('.report-analysis-subtitle'),ball);
  const progress = reportSection('Pistes de progrès & Axes de travail');progress.classList.add('report-analysis-card');
  progress.append(el('p', 'report-analysis-subtitle', 'Les priorités à travailler cette semaine.'));
  progress.append(field('Priorité de la semaine', currentReport.plan.priority, v => currentReport.plan.priority = v, 'priority', 'La priorité à retenir…'));
  const axes = el('div', 'report-analysis-axes');
  for (const [key, label] of [['improveAttack', 'Avec le ballon'], ['improveDefence', 'Sans le ballon']]) axes.append(field(label, currentReport.analysis[key], v => currentReport.analysis[key] = v, key, 'Une piste de progrès…'));
  progress.append(axes);
  const suggestions = el('div', 'report-workshop-suggestions');suggestions.setAttribute('aria-live', 'polite');
  function suggest() {
    suggestions.replaceChildren(el('span', 'report-workshop-label', 'Ateliers suggérés'));
    const labels = reportAnalysisWorkshopSuggestions(currentReport.analysis, currentReport.plan.priority);
    if (!labels.length) suggestions.append(el('small', '', 'Renseignez un axe de travail pour obtenir des suggestions.'));
    else {const tags = el('div', 'report-workshop-tags');for (const label of labels) tags.append(el('span', '', label));suggestions.append(tags);}
  }
  view.addEventListener('input', suggest);suggest();progress.append(suggestions);grid.append(animations, progress);view.append(grid);
  const extra = reportSection('Compléments et évaluations sportives');
  extra.classList.add('report-analysis-card', 'report-analysis-extras');
  const ratings = el('div', 'report-analysis-quick-ratings');
  for (const [key, title] of Object.entries(reportSport)) {
    const rating = currentReport.ratings[key], row = el('div', 'report-analysis-quick-rating'),heading = el('div', 'report-analysis-rating-heading'), value = el('output');
    heading.append(el('span', '', key === 'physical' ? 'Intensité / état physique' : title), value);row.append(heading);
    const choices = el('div', 'report-analysis-scores');choices.setAttribute('role', 'group');choices.setAttribute('aria-label', title + ' · note sur 5');
    const paint = () => {value.textContent = rating.score ? rating.score + ' / 5' : 'Non évalué';choices.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.score === rating.score)));};
    for (const score of ['', '1', '2', '3', '4', '5']) {const b = el('button', '', score || '—');b.type = 'button';b.dataset.score = score;b.setAttribute('aria-label', score ? title + ' : ' + score + ' sur 5' : title + ' : non évalué');b.onclick = () => {rating.score = score;paint();reportAutosave();};choices.append(b);}
    paint();row.append(choices);
    const note = field('Observation', rating.note, v => rating.note = v, 'rating-' + key, 'Observation facultative…');note.classList.add('report-analysis-rating-note');row.append(note);ratings.append(row);
  }
  extra.append(ratings);
  grid.append(extra);
  const previous = reportPreviousNotes('Notes conservées des anciens bilans', [['Première période', currentReport.analysis.firstHalf], ['Seconde période', currentReport.analysis.secondHalf]]);
  if (previous) view.append(previous);root.append(view);
}
function reportGroupMessagePanel() {
  const panel = reportSection("Message à transmettre au groupe");
  panel.id = "report-group-message";
  const field = reportGrowingField(
    "Message au groupe",
    currentReport.plan.summary,
    (v) => {
      currentReport.plan.summary = v;
      copy.disabled = !v.trim();
    },
  );
  const input = field.querySelector("textarea");
  input.id = "report-group-message-text";
  const copy = el("button", "export", "Copier le message");
  copy.type = "button";
  copy.id = "report-group-message-copy";
  copy.disabled = !currentReport.plan.summary.trim();
  const status = el("p", "hint");
  status.setAttribute("role", "status");
  copy.onclick = async () => {
    const text = input.value;
    if (!text.trim()) return;
    try {
      if (!navigator.clipboard?.writeText) throw Error();
      await navigator.clipboard.writeText(text);
      if (status.isConnected) status.textContent = "Message copié.";
    } catch {
      if (input.isConnected) {
        input.focus();
        input.select();
        status.textContent =
          "Copie automatique indisponible : le texte est sélectionné. Utilisez Copier sur votre appareil.";
      }
    }
  };
  panel.append(field, copy, status);
  return panel;
}
function reportRenderPlan(root) {
  const context = reportSection("Plan d’action");
  context.append(
    reportGrowingField(
      reportPlan.priority,
      currentReport.plan.priority,
      (v) => (currentReport.plan.priority = v),
    ),
  );
  const review = el("details", "report-analysis-details");
  review.append(
    el("summary", "", "Programmer un point de suivi"),
    reportField(
      reportPlan.reviewDate,
      currentReport.plan.reviewDate,
      (v) => (currentReport.plan.reviewDate = v),
      { type: "date" },
    ),
  );
  context.append(review);
  root.append(context);
  const sessions = reportSection("Séances");
  sessions.id = "report-session-plan";
  const grid = el("div", "report-grid");
  for (const [key, label] of [
    ["sessionObjective", "Objectif"],
    ["sessionExercise", "Exercice prévu"],
  ])
    grid.append(
      reportGrowingField(
        label,
        currentReport.plan[key] || "",
        (v) => (currentReport.plan[key] = v),
        {
          placeholder:
            key === "sessionObjective"
              ? "Ce que vous souhaitez travailler…"
              : "Exercice retenu ou organisation envisagée…",
        },
      ),
    );
  sessions.append(grid);
  root.append(sessions, reportGroupMessagePanel());
  const legacy = reportPreviousNotes(
    "Notes conservées des anciens plans d’action",
    [
      ["Séance archivée 1", currentReport.plan.session1],
      ["Séance archivée 2", currentReport.plan.session2],
      ["Séance archivée 3", currentReport.plan.session3],
      ["Ancienne note de réussite", currentReport.plan.success],
      ["Ancienne attribution du suivi", currentReport.plan.owner],
    ],
  );
  if (legacy) root.append(legacy);
}
function reportSportDocument() {
  const section = el("section");
  section.append(el("h2", "", "2. Analyse tactique"));
  for (const [title, top, improve] of [
    ["Top Offensif (Avec le ballon)", "topAttack", "improveAttack"],
    ["Top Défensif (Sans le ballon)", "topDefence", "improveDefence"],
  ]) {
    const block = el("div", "report-doc-tactical");
    block.append(el("h3", "", title));
    for (const [label, key] of [
      ["Points forts", top],
      ["À améliorer", improve],
    ])
      if (currentReport.analysis[key].trim())
        reportPrintText(block, label, currentReport.analysis[key]);
    if (
      !currentReport.analysis[top].trim() &&
      !currentReport.analysis[improve].trim()
    )
      block.append(el("p", "", "Non renseigné"));
    section.append(block);
  }
  if (
    Object.keys(reportSport).some(
      (k) =>
        currentReport.ratings[k].score || currentReport.ratings[k].note.trim(),
    )
  )
    section.append(reportRatingTable(reportSport));
  for (const key of [
    "withBall",
    "withoutBall",
    "transitions",
    "setPieces",
    "firstHalf",
    "secondHalf",
  ])
    if (currentReport.analysis[key].trim())
      reportPrintText(
        section,
        reportAnalysis[key],
        currentReport.analysis[key],
      );
  return section;
}
function reportPlanDocument() {
  const section = el("section");
  section.append(el("h2", "", "5. Plan d’action"));
  for (const key of ["priority", "reviewDate"])
    if (currentReport.plan[key].trim())
      reportPrintText(section, reportPlan[key], currentReport.plan[key]);
  const sessions = el("div");
  sessions.append(el("h3", "", "Séances"));
  for (const [key, label] of [
    ["sessionObjective", "Objectif"],
    ["sessionExercise", "Exercice prévu"],
  ])
    if (currentReport.plan[key]?.trim())
      reportPrintText(sessions, label, currentReport.plan[key]);
  if (sessions.children.length > 1) section.append(sessions);
  if (currentReport.plan.summary.trim())
    reportPrintText(
      section,
      "Message à transmettre au groupe",
      currentReport.plan.summary,
    );
  // Preserve non-empty historical text in exports, without reviving removed fields.
  const legacy = [
    ["Séance archivée 1", currentReport.plan.session1],
    ["Séance archivée 2", currentReport.plan.session2],
    ["Séance archivée 3", currentReport.plan.session3],
    ["Ancienne note de réussite", currentReport.plan.success],
    ["Ancienne attribution du suivi", currentReport.plan.owner],
  ].filter(([, v]) => v.trim());
  if (legacy.length) {
    section.append(el("h3", "", "Notes antérieures"));
    for (const [label, value] of legacy) reportPrintText(section, label, value);
  }
  return section;
}
