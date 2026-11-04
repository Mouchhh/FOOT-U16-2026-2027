// Integration metadata never rewrites the supplied exercise objects or functions.
(() => {
  const banide = window.suppliedExerciseEngine;
  const sources = [
    {
      engine: banide,
      key: "banide",
      stylesheet: "supplied-exercise-base.css?v=cards-149",
      source: "Exos foot.html",
    },
    {
      engine: window.suppliedToroExerciseEngine,
      key: "toro",
      source: "Exos foot - Toro.html",
    },
    {
      engine: window.suppliedOppositionExerciseEngine,
      key: "opposition",
      source: "Exos foot - Opposition.html",
    },
    {
      engine: window.suppliedCoachExerciseEngine,
      key: "coach",
      source: "Exos foot - Séances du coach.html",
    },
    {
      engine: window.suppliedCircuitExerciseEngine,
      key: "circuit",
      source: "Exos foot - Circuit.html",
    },
    {
      engine: window.suppliedGamesExerciseEngine,
      key: "games",
      source: "Exos foot - Jeux et défis.html",
    },
    {
      engine: window.suppliedPhysicalExerciseEngine,
      key: "physical",
      source: "Exos foot - Physique.html",
    },
    {
      engine: window.suppliedFinishingExerciseEngine,
      key: "finishing",
      source: "Exos foot - Finition.html",
    },
    {
      engine: window.suppliedMyCoachExerciseEngine,
      key: "mycoach",
      source: "Exos foot - MyCoach.html",
      stylesheet: "supplied-mycoach-base.css?v=mycoach-197",
    },
  ];
  const owners = new Map(),
    views = new Map(),
    viewMetadata = new WeakMap(),
    modelOwners = new WeakMap();
  for (const source of sources) {
    source.stylesheet ||=
      "supplied-" + source.key + "-base.css?v=coach-bundles-166";
    for (const exercise of source.engine.exercises) {
      if (owners.has(exercise.id))
        throw Error("Identifiant d’exercice dupliqué : " + exercise.id);
      owners.set(exercise.id, source);
      const angles = source.engine.viewsOf
        ? source.engine.viewsOf(exercise)
        : [exercise];
      views.set(exercise.id, angles);
      angles.forEach((angle, index) =>
        viewMetadata.set(angle, { index, source: source.key }),
      );
    }
  }
  const owner = (exercise) => owners.get(exercise?.id) || sources[0];
  // Explicit physical/warm-up intentions take priority over a family name.
  function sectionFor(exercise) {
    const family = owner(exercise).key;
    if (exercise.moment === "physique") return "physical";
    if (exercise.moment === "echauffement") return "warm";
    if (family === "circuit") return "warm";
    if (family === "games") return "ludic";
    if (
      exercise.moment === "possede" &&
      exercise.sub === "Zone 3 / Box · Finition"
    )
      return "finish";
    if (
      family === "finishing" &&
      !["nepossede", "perd"].includes(exercise.moment)
    )
      return "finish";
    if (
      exercise.moment === "ludique" ||
      /toro|jeu|défi|tournoi/i.test(exercise.game || "")
    )
      return "ludic";
    return "tactical";
  }
  function sectionsFor(exercise) {
    const sections = new Set([sectionFor(exercise)]),
      family = owner(exercise).key;
    if (
      family === "circuit" ||
      ["phy-fifa-11", "phy-circuit-prevention"].includes(exercise.id)
    )
      sections.add("warm");
    if (
      family === "games" ||
      /toro|jeu|tournoi|défi/i.test(exercise.game || "")
    )
      sections.add("ludic");
    if (
      (family === "finishing" &&
        !["nepossede", "perd"].includes(exercise.moment)) ||
      exercise.id === "phy-sprint-frappe"
    )
      sections.add("finish");
    return [...sections];
  }
  window.suppliedExerciseEngine = {
    libraries: sources.map((s) => ({ key: s.key, source: s.source })),
    exercises: sources.flatMap((s) => s.engine.exercises),
    moments: Object.assign({}, ...sources.map((s) => s.engine.moments)),
    viewsOf: (exercise) =>
      views.get(typeof exercise === "string" ? exercise : exercise.id) || [],
    getExercise: (id, index = 0) => views.get(id)?.[index],
    viewIndex: (exercise) => viewMetadata.get(exercise)?.index || 0,
    sectionFor,
    sectionsFor,
    adapt: (exercise, context) =>
      owner(exercise).engine.adapt(exercise, context),
    buildExerciseModel(plan) {
      const engine = owner(plan.ex).engine,
        model = engine.buildExerciseModel(plan);
      modelOwners.set(model, engine);
      return model;
    },
    createBoard: (model, options) =>
      (modelOwners.get(model) || banide).createBoard(model, options),
    renderFiche: (exercise, onBack) =>
      owner(exercise).engine.renderFiche(exercise, onBack),
    materialOf: (plan, model) => owner(plan.ex).engine.materialOf(plan, model),
    seriesOf: (exercise, duration, band) =>
      owner(exercise).engine.seriesOf(exercise, duration, band),
    presentationFor(exercise) {
      const { stylesheet, source, key } = owner(exercise);
      return { stylesheet, source, key };
    },
  };
})();
