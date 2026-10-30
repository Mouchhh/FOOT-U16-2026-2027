/* Presentation only: theme → zone objective → supplied exercises.
   EXOS, FICHE_MOMENTS and the original sheets/animation engine remain unchanged. */
function renderSuppliedExerciseClassification() {
  const selected = Number(location.hash.slice(1));
  if (location.hash && EXOS[selected]) return;

  const sections = Object.entries(FICHE_MOMENTS).map(([moment, theme]) => {
    const entries = EXOS.map((exercise, index) => ({ exercise, index }))
      .filter(({ exercise }) => exercise.moment === moment);
    // Always show the twelve agreed zone objectives, including empty folders.
    // Ludique keeps the sub-labels from the supplied exercises.
    const objectives = theme.subs.length ? theme.subs : [...new Set(entries.map(({ exercise }) => exercise.sub))];
    const section = h('section', { class: 'b-theme', 'data-moment': moment },
      h('h2', {}, theme.label));
    section.style.setProperty('--band', theme.band);
    section.style.setProperty('--theme', theme.accent);

    for (const objective of objectives) {
      const exercises = entries.filter(({ exercise }) => exercise.sub === objective);
      const folder = h('details', { class: 'b-objective', 'data-objective': objective, open: exercises.length > 0 },
        h('summary', {}, h('span', {}, objective),
          h('span', { class: 'b-objective-count' }, String(exercises.length))));
      const links = h('div', { class: 'b-list' });
      for (const { exercise, index } of exercises) {
        links.append(h('a', { href: '#' + index, 'data-exercise-id': exercise.id },
          h('b', {}, exercise.title), h('span', {}, exercise.obj || exercise.goal)));
      }
      if (!exercises.length) links.append(h('p', { class: 'b-empty' }, 'Aucun exercice pour le moment.'));
      folder.append(links);
      section.append(folder);
    }
    return section;
  });
  document.body.replaceChildren(h('main', { class: 'b-home' },
    h('header', { class: 'b-head' }, h('img', { src: LOGO, alt: '' }), h('h1', {}, 'Exos foot')),
    ...sections));
}
// The original hash listener opens sheets; this listener only lays out the index.
addEventListener('hashchange', renderSuppliedExerciseClassification);
renderSuppliedExerciseClassification();
