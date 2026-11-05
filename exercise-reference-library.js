document.addEventListener("DOMContentLoaded", () => {
  let intention = "",
    objective = "";
  const panel = el("section", "exercise-reference-navigation"),
    nav = el("div", "exercise-reference-intentions"),
    label = el("label", "report-field", "Sous-partie"),
    select = el("select");
  panel.setAttribute("aria-label", "Classement par intentions du club");
  nav.setAttribute("role", "group");
  nav.setAttribute("aria-label", "Intentions de jeu");
  select.setAttribute("aria-label", "Sous-partie des exercices");
  label.append(select);
  panel.append(nav, label);
  function sync() {
    for (const button of nav.querySelectorAll("button"))
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.intention === intention),
      );
    bmfSubcategorySelect(select, intention, objective);
  }
  function set(axis, sub = "") {
    if (sub && bmfSubcategories[sub]) axis = bmfSubcategories[sub].axis;
    else if (sub) sub = "";
    if (axis && !bmfCategories[axis]) axis = "";
    intention = axis;
    objective = sub;
    if ($("supplied-section")) $("supplied-section").value = "";
    if ($("bible-bmf-category")) $("bible-bmf-category").value = "";
    if ($("training-filter")) $("training-filter").value = "";
    bibleCataloguePage = 0;
    renderBibleCatalogue();
  }
  for (const [key, title] of [
    ["", "Toutes les intentions"],
    ...Object.entries(bmfCategories).map(([k, v]) => [k, v.label]),
  ]) {
    const button = el("button", "export", title);
    button.type = "button";
    button.dataset.intention = key;
    button.onclick = () => set(key);
    nav.append(button);
  }
  select.onchange = () => set(intention, select.value);
  const original = suppliedCatalogueExercises;
  suppliedCatalogueExercises = function (filters = {}) {
    const axis = intention || filters.axis || "",
      sub = objective || filters.objective || "";
    if (!axis && !sub) return original(filters);
    const unique = new Map(),
      allowed = new Set(
        original({ ...filters, axis: "", objective: "" }).map((e) => e.id),
      );
    for (const base of suppliedExerciseEngine.exercises) {
      const normal = (s) =>
        String(s || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();
      const choices = suppliedExerciseEngine
        .viewsOf(base)
        .filter(
          (e) =>
            clubExerciseMatches(e, axis, sub) &&
            (!filters.section ||
              suppliedExerciseEngine
                .sectionsFor(e)
                .includes(filters.section)) &&
            (!filters.query ||
              normal(
                [e.title, e.obj, e.goal, e.sub, ...e.rules, ...e.coach].join(
                  " ",
                ),
              ).includes(normal(filters.query))),
        );
      if (!choices.length) continue;
      if (!allowed.has(base.id)) continue;
      unique.set(base.id, choices[0]);
    }
    return [...unique.values()];
  };
  const render = renderBibleCatalogue;
  renderBibleCatalogue = function (...args) {
    const result = render.apply(this, args),
      root = $("training-catalogue");
    root.before(panel);
    sync();
    if (intention || objective) $("bible-reset").hidden = false;
    const advanced = document.querySelector(".bible-search-options");
    if (advanced)
      for (const id of ["bible-bmf-category", "training-filter"]) {
        const field = $(id)?.closest("label");
        if (field && !advanced.contains(field)) advanced.append(field);
        if (field) field.hidden = true;
      }
    for (const card of root.querySelectorAll("[data-exercise]")) {
      const e = suppliedExerciseEngine.getExercise(
          card.dataset.exercise,
          Number(card.dataset.view),
        ),
        meta = exerciseReferenceIndex.forExercise(e);
      if (!meta) continue;
      const c = clubExerciseClassification(e);
      const text = [
        c.axis ? bmfCategoryLabel(c.axis) : "Intention à préciser",
        c.objective ? bmfObjectiveLabel(c.objective) : "Sous-partie à préciser",
        c.mode === "ludic" ? "Mode ludique" : "",
      ]
        .filter(Boolean)
        .join(" · ");
      card.querySelector(".exercise-classification").textContent = text;
      const format = card.querySelector(".bible-card-format");
      format.replaceChildren();
      for (const name of [
        meta.effectif_min + "–" + meta.effectif_max + " joueurs",
        meta.duree + " min",
        meta.surface,
      ])
        format.append(el("span", "exercise-reference-badge", name));
      if (meta.effectif_a_verifier)
        format.append(
          el(
            "span",
            "exercise-reference-badge",
            "Effectif à vérifier dans la source",
          ),
        );
      const [add, view] = card.querySelectorAll(".bible-card-actions button");
      add.textContent = "+ Ajouter à ma séance";
      view.textContent = "Voir l’exercice";
      clubCleanExerciseLabels(card);
    }
    return result;
  };
  $("bible-reset")?.addEventListener(
    "click",
    () => {
      intention = "";
      objective = "";
    },
    true,
  );
  window.exerciseReferenceLibrary = { select: set };
  renderBibleCatalogue();
});
