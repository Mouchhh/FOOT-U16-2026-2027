// Integration adapter only: each source retains its own exact exercise engine.
(() => {
  const banide = window.suppliedExerciseEngine;
  const toro = window.suppliedToroExerciseEngine;
  const owners = new Map();
  const modelOwners = new WeakMap();
  const engines = [banide, toro];
  for (const engine of engines)
    for (const exercise of engine.exercises) {
      if (owners.has(exercise.id))
        throw new Error("Identifiant d’exercice dupliqué");
      owners.set(exercise.id, engine);
    }
  const owner = (exercise) => owners.get(exercise?.id) || banide;
  window.suppliedExerciseEngine = {
    exercises: engines.flatMap((engine) => engine.exercises),
    moments: banide.moments,
    adapt: (exercise, context) => owner(exercise).adapt(exercise, context),
    buildExerciseModel(plan) {
      const engine = owner(plan.ex);
      const model = engine.buildExerciseModel(plan);
      modelOwners.set(model, engine);
      return model;
    },
    createBoard(model, options) {
      return (modelOwners.get(model) || banide).createBoard(model, options);
    },
    renderFiche: (exercise, onBack) =>
      owner(exercise).renderFiche(exercise, onBack),
    materialOf: (plan, model) => owner(plan.ex).materialOf(plan, model),
    seriesOf: (exercise, duration, band) =>
      owner(exercise).seriesOf(exercise, duration, band),
    presentationFor(exercise) {
      return owner(exercise) === toro
        ? {
            stylesheet: "supplied-toro-base.css?v=toro-160",
            source: "Exos foot - Toro.html",
          }
        : {
            stylesheet: "supplied-exercise-base.css?v=cards-149",
            source: "Exos foot.html",
          };
    },
  };
})();
