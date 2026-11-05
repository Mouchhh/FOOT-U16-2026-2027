// Phase assignments are snapshots, scoped to this match and included in its archive.
document.addEventListener("DOMContentLoaded", () => {
  const phases = causerieEleven.phases;
  const previousValid = valid;
  valid = function (board) {
    return (
      previousValid(board) &&
      (board.causerieAnimationVariant === undefined ||
        ["native", "gif"].includes(board.causerieAnimationVariant)) &&
      (board.causerieSlideAnimations === undefined ||
        (board.causerieSlideAnimations &&
          typeof board.causerieSlideAnimations === "object" &&
          Object.keys(phases).every(
            (key) =>
              Array.isArray(board.causerieSlideAnimations[key]) &&
              board.causerieSlideAnimations[key].length <= 20 &&
              board.causerieSlideAnimations[key].every(simpleSequenceValid),
          )))
    );
  };
  const panel = el("details", "causerie-eleven-options");
  panel.id = "causerie-eleven-options";
  panel.append(el("summary", "", "Présentation · 11 slides"));
  const fields = el("div", "causerie-eleven-fields");
  const inputs = new Map();
  const status = el("p", "hint");
  status.setAttribute("role", "status");
  function save(change) {
    const board = getCompositionBoard(),
      before = structuredClone(board);
    change(board);
    if (!valid(board) || !persistTerrainWorkspace()) {
      for (const key of [
        "matchPreparation",
        "causerieSlideAnimations",
        "causerieSlideExercises",
        "causerieAnimationVariant",
      ]) {
        if (before[key] === undefined) delete board[key];
        else board[key] = before[key];
      }
      status.textContent = "Modification non enregistrée. Réessayez.";
      paint();
      return false;
    }
    documentCompletionBeginEdit("causerie", board);
    status.textContent =
      "Contenus liés aux diapositives · validez la causerie pour les conserver avec ce match.";
    return true;
  }
  for (const [key, title] of Object.entries(causerieEleven.fields)) {
    const label = el("label", "report-field", title),
      input = el(["round", "venue"].includes(key) ? "input" : "textarea");
    input.maxLength = 4000;
    input.setAttribute("aria-label", title);
    if (input.tagName === "TEXTAREA") input.rows = 3;
    input.oninput = () =>
      save((board) => (board.matchPreparation[key] = input.value));
    label.append(input);
    fields.append(label);
    inputs.set(key, input);
  }
  const formatLabel = el("label", "report-field", "Format des animations"),
    format = el("select");
  format.setAttribute("aria-label", "Format des animations des 11 slides");
  format.append(
    new Option("PowerPoint · trajectoires natives", "native"),
    new Option("Canva · GIF intégrés", "gif"),
  );
  formatLabel.append(format);
  format.onchange = () =>
    save((board) => (board.causerieAnimationVariant = format.value));
  const assignments = el("div", "causerie-eleven-phases");
  panel.append(
    fields,
    formatLabel,
    el(
      "p",
      "hint",
      "Piochez dans vos animations et exercices enregistrés dans Mon Club. Les quatre phases restent sur les slides 6 à 9 ; 4 situations maximum par phase pour la lisibilité.",
    ),
    assignments,
    status,
  );
  $("task-causerie").append(panel);
  function paint() {
    const board = getCompositionBoard();
    for (const [key, input] of inputs)
      if (document.activeElement !== input)
        input.value = board.matchPreparation?.[key] || "";
    format.value = board.causerieAnimationVariant || "native";
    assignments.replaceChildren();
    const entries = [...causerieClubSituations.animations()];
    const exercises = causerieClubSituations.exercises();
    for (const exercise of Object.values(
      board.causerieSlideExercises || {},
    ).flat())
      if (!exercises.some((e) => e.id === exercise.id))
        exercises.push(exercise);
    const saved = [
      ...(board.causerieAnimations || []),
      ...Object.values(board.causerieSlideAnimations || {}).flat(),
    ];
    for (const entry of saved)
      if (!entries.some((row) => row.entry.id === entry.id))
        entries.push({ entry, local: false });
    for (const [key, phase] of Object.entries(phases)) {
      const section = el("section"),
        heading = el("h4", "", "Slide " + phase.slide + " · " + phase.title);
      section.dataset.phase = key;
      section.append(heading);
      const search = el("input"),
        filter = el("select"),
        choices = el("div", "causerie-situation-choices");
      search.type = "search";
      search.placeholder = "Rechercher dans mes contenus enregistrés";
      search.setAttribute("aria-label", "Rechercher · " + phase.title);
      filter.setAttribute("aria-label", "Type de contenu · " + phase.title);
      filter.append(
        new Option("Tous mes contenus", ""),
        new Option("Animations", "animation"),
        new Option("Exercices", "exercise"),
      );
      section.append(search, filter, choices);
      for (const { entry } of entries) {
        const label = el("label", "causerie-phase-choice"),
          check = el("input");
        check.type = "checkbox";
        check.setAttribute("aria-label", phase.title + " · " + entry.title);
        check.checked = (
          board.causerieSlideAnimations?.[key] ||
          (!board.causerieSlideAnimations && key === "defensive"
            ? board.causerieAnimations
            : []) ||
          []
        ).some((e) => e.id === entry.id);
        check.onchange = () => {
          const chosen =
            board.causerieSlideAnimations?.[key] ||
            (!board.causerieSlideAnimations && key === "defensive"
              ? board.causerieAnimations
              : []) ||
            [];
          if (
            check.checked &&
            chosen.length +
              (board.causerieSlideExercises?.[key]?.length || 0) >=
              4
          ) {
            check.checked = false;
            status.textContent =
              "4 situations maximum par phase pour des schémas lisibles.";
            return;
          }
          save((target) => {
            const map = structuredClone(
              target.causerieSlideAnimations ||
                Object.fromEntries(
                  Object.keys(phases).map((k) => [
                    k,
                    k === "defensive" ? target.causerieAnimations || [] : [],
                  ]),
                ),
            );
            map[key] = check.checked
              ? [
                  ...map[key].filter((e) => e.id !== entry.id),
                  structuredClone(entry),
                ]
              : map[key].filter((e) => e.id !== entry.id);
            target.causerieSlideAnimations = map;
          });
        };
        label.dataset.kind = "animation";
        label.dataset.title = entry.title.toLocaleLowerCase("fr");
        label.append(check, document.createTextNode(entry.title));
        choices.append(label);
      }
      for (const exercise of exercises) {
        const label = el("label", "causerie-phase-choice"),
          check = el("input");
        check.type = "checkbox";
        check.setAttribute(
          "aria-label",
          phase.title + " · Exercice · " + exercise.title,
        );
        check.checked = (board.causerieSlideExercises?.[key] || []).some(
          (e) => e.id === exercise.id,
        );
        check.onchange = () => {
          const selected = board.causerieSlideExercises?.[key] || [];
          if (
            check.checked &&
            selected.length +
              (board.causerieSlideAnimations?.[key]?.length ||
                (!board.causerieSlideAnimations && key === "defensive"
                  ? board.causerieAnimations?.length || 0
                  : 0)) >=
              4
          ) {
            check.checked = false;
            status.textContent =
              "4 situations maximum par phase pour des schémas lisibles.";
            return;
          }
          save((target) => {
            const map = structuredClone(
              target.causerieSlideExercises ||
                Object.fromEntries(Object.keys(phases).map((k) => [k, []])),
            );
            map[key] = check.checked
              ? [
                  ...map[key].filter((e) => e.id !== exercise.id),
                  structuredClone(exercise),
                ]
              : map[key].filter((e) => e.id !== exercise.id);
            target.causerieSlideExercises = map;
          });
        };
        label.dataset.kind = "exercise";
        label.dataset.title = exercise.title.toLocaleLowerCase("fr");
        label.append(
          check,
          document.createTextNode("Exercice · " + exercise.title),
        );
        choices.append(label);
      }
      const filterChoices = () => {
        for (const row of choices.children)
          row.hidden =
            !!(filter.value && row.dataset.kind !== filter.value) ||
            !row.dataset.title.includes(search.value.toLocaleLowerCase("fr"));
      };
      search.oninput = filterChoices;
      filter.onchange = filterChoices;
      if (!entries.length && !exercises.length)
        section.append(
          el(
            "p",
            "hint",
            "Enregistrez une animation dans Tactique pour la sélectionner ici.",
          ),
        );
      assignments.append(section);
    }
    document.dispatchEvent(new CustomEvent("causerie:options-rendered"));
  }
  const before = renderMatchPreparation;
  renderMatchPreparation = function (...args) {
    const value = before.apply(this, args);
    paint();
    return value;
  };
  const library = renderSaves;
  renderSaves = function (...args) {
    const value = library.apply(this, args);
    paint();
    return value;
  };
  paint();
});
