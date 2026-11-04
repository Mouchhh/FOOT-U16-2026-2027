// Existing Bible layout, containing the coach’s supplied Banide, Toro and Opposition exercises.
const suppliedExerciseIds = suppliedExerciseEngine.exercises.map((e) => e.id);
const suppliedMomentAxes = {
  possede: "ball",
  perd: "loss",
  recupere: "win",
  nepossede: "off",
  ludique: "ludic",
};
const suppliedSections = {
  warm: "Échauffement",
  physical: "Physique",
  ludic: "Ludique",
  finish: "Finition",
  tactical: "Jeu et tactique",
};
function ensureSuppliedSections() {
  if ($("supplied-section")) return;
  const group = el("div", "supplied-section-filters");
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Compartiments des exercices");
  const field = el("input");
  field.id = "supplied-section";
  field.type = "hidden";
  field.value = "";
  group.append(field);
  for (const [key, label] of [
    ["", "Tous les exercices"],
    ...Object.entries(suppliedSections),
  ]) {
    const button = el("button", "export", label);
    button.type = "button";
    button.dataset.section = key;
    button.onclick = () => {
      field.value = key;
      $("bible-bmf-category").value = "";
      $("training-filter").value = "";
      renderBibleCatalogue();
      field.dispatchEvent(new Event("change", { bubbles: true }));
    };
    group.append(button);
  }
  const host = $("training-catalogue");
  host.parentElement.insertBefore(group, host);
  $("bible-reset").addEventListener(
    "click",
    () => {
      field.value = "";
    },
    true,
  );
}
function ensureSuppliedLibraries() {
  if ($("supplied-source")) return;
  const label = el("label", "supplied-library-filter", "Bibliothèque"),
    select = el("select"),
    original = el(
      "a",
      "supplied-original-download",
      "Fichier original MyCoach",
    );
  select.id = "supplied-source";
  select.setAttribute("aria-label", "Bibliothèque d’exercices");
  const names = {
    banide: "Banide",
    toro: "Toro",
    opposition: "Opposition",
    coach: "Séances du coach",
    circuit: "Circuits",
    games: "Jeux et défis",
    physical: "Physique",
    finishing: "Finition",
    mycoach: "MyCoach",
  };
  select.append(new Option("Toutes les bibliothèques", ""));
  for (const source of suppliedExerciseEngine.libraries)
    select.append(new Option(names[source.key] || source.source, source.key));
  original.href = "assets/exercises/mycoach-original.html";
  original.download = "Exos foot - MyCoach.html";
  original.hidden = true;
  select.onchange = () => {
    select.dataset.filtered = String(!!select.value);
    original.hidden = select.value !== "mycoach";
    renderBibleCatalogue();
  };
  label.append(select, original);
  document.querySelector(".supplied-section-filters").before(label);
  $("bible-reset").addEventListener(
    "click",
    () => {
      select.value = "";
      select.dataset.filtered = "false";
      original.hidden = true;
    },
    true,
  );
}
function suppliedCatalogueExercises({
  section = "",
  axis = "",
  objective = "",
  query = "",
  source = "",
} = {}) {
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  return suppliedExerciseEngine.exercises.flatMap((base) => {
    const matches = suppliedExerciseEngine
      .viewsOf(base)
      .filter(
        (e) =>
          (!source ||
            suppliedExerciseEngine.presentationFor(e).key === source) &&
          (!section ||
            suppliedExerciseEngine.sectionsFor(e).includes(section)) &&
          (!axis || suppliedMomentAxes[e.moment] === axis) &&
          (!objective || suppliedObjective(e) === objective) &&
          (!query ||
            normalize(
              [
                e.title,
                e.game,
                e.name,
                e.obj,
                e.goal,
                e.sub,
                ...e.rules,
                ...e.coach,
              ].join(" "),
            ).includes(normalize(query))),
      );
    if (!matches.length) return [];
    const preferred =
      section === "warm"
        ? matches.find((e) => e.moment === "echauffement")
        : section === "physical"
          ? matches.find((e) => e.moment === "physique")
          : null;
    return [preferred || matches[0]];
  });
}
function suppliedObjective(e) {
  return (
    Object.keys(bmfSubcategories).find(
      (k) =>
        bmfSubcategories[k].axis === suppliedMomentAxes[e.moment] &&
        bmfSubcategories[k].label === e.sub,
    ) || ""
  );
}
function suppliedSessionContext() {
  const space = bibleAvailable(currentTraining);
  return {
    players: currentTraining.players,
    keepers: currentTraining.keepers,
    category: currentTraining.category,
    level:
      { discovery: "decouverte", developing: "dev", advanced: "confirme" }[
        currentTraining.level
      ] || "dev",
    moment: "libre",
    space: [space.width, space.length],
  };
}
function suppliedSheet(e) {
  const host = el("div", "supplied-original-sheet"),
    shadow = host.attachShadow({ mode: "open" });
  for (const href of [
    suppliedExerciseEngine.presentationFor(e).stylesheet,
    "imported-exercises-theme.css?v=coach-bundles-166",
  ]) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    shadow.append(link);
  }
  const style = document.createElement("style");
  style.textContent =
    ":host{display:block;min-width:0;--club-navy:#142d50;--club-blue:#2855a2;--navy:#142d50;--blue:#2855a2;--blue-2:#204581;--blue-soft:#eaf0f9;--line:#dce5ef;--bg:#f2f5f9;--card:#fff;--ink:#203958;--muted:#536a83;--text:system-ui,sans-serif;--display:system-ui,sans-serif;font:15px/1.55 system-ui,sans-serif;color:#203958}.f-card{width:100%;height:750px;max-height:none}@media(max-width:820px){.f-card{height:auto;min-height:0}}";
  shadow.append(style, suppliedExerciseEngine.renderFiche(e));
  return host;
}
function openSuppliedSheet(e) {
  $("bible-sheet-dialog")?.remove();
  const dialog = el("dialog", "bible-sheet-dialog");
  dialog.id = "bible-sheet-dialog";
  const head = el("div", "bible-dialog-heading"),
    close = el("button", "export", "Fermer");
  close.type = "button";
  close.onclick = () => dialog.close();
  head.append(el("h2", "", e.title), close);
  const actions = el("div", "bible-card-actions"),
    add = el("button", "primary", "+ Ajouter à la séance");
  add.type = "button";
  add.onclick = () => {
    if (addSuppliedExercise(e)) dialog.close();
  };
  actions.append(
    add,
    el(
      "p",
      "hint",
      "Ajout avec les paramètres de votre séance : " +
        currentTraining.players +
        " joueurs dont " +
        currentTraining.keepers +
        " gardien(s). Le bouton Adapter sert à explorer la fiche.",
    ),
  );
  const angles = suppliedExerciseEngine.viewsOf(e);
  if (angles.length > 1) {
    const label = el(
        "label",
        "supplied-angle-picker",
        "Intention / angle pédagogique de la fiche",
      ),
      select = el("select");
    select.setAttribute("aria-label", "Intention de cette fiche");
    angles.forEach((angle, index) =>
      select.append(
        new Option(
          suppliedExerciseEngine.moments[angle.moment].label +
            " · " +
            angle.sub +
            (angle.obj ? " · " + angle.obj : ""),
          String(index),
        ),
      ),
    );
    select.value = String(suppliedExerciseEngine.viewIndex(e));
    select.onchange = () => openSuppliedSheet(angles[Number(select.value)]);
    label.append(select);
    dialog.append(head, actions, label, suppliedSheet(e));
  } else dialog.append(head, actions, suppliedSheet(e));
  document.body.append(dialog);
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  dialog.showModal();
}
function suppliedBoardSnapshot(model) {
  const types = {
    home: "blue",
    away: "red",
    neutral: "blue",
    keeper: "keeper",
    ball: "ball",
    cone: "cone",
    disc: "disc",
    mini: "mini",
    goal: "goal",
  };
  return {
    version: 1,
    lines: true,
    seconds: 2,
    frames: model.frames.slice(0, 12).map((frame) => ({
      objects: model.tokens
        .filter((t) => types[t.type])
        .map((t) => ({
          id: t.id,
          type: types[t.type],
          x: Math.max(0, Math.min(100, (frame[t.id][0] / model.W) * 100)),
          y: Math.max(0, Math.min(100, (frame[t.id][1] / model.H) * 100)),
          rotation: (((t.rot || 0) % 360) + 360) % 360,
          scale: 1,
          label: String(t.label || "").slice(0, 20),
          color:
            t.type === "neutral"
              ? "#ffffff"
              : t.type === "away"
                ? "#d62828"
                : "#2855a2",
        })),
    })),
  };
}
function addSuppliedExercise(e) {
  if (!applyTrainingForm())
    return notify("Vérifiez les paramètres de la séance.");
  if (currentTraining.blocks.length >= 20) return notify("20 blocs maximum.");
  const plan = suppliedExerciseEngine.adapt(e, suppliedSessionContext());
  if (
    plan.warn.length &&
    !confirm(
      plan.warn.join("\n") +
        "\n\nAjouter cet exercice pour l’ajuster dans la séance ?",
    )
  )
    return;
  const model = suppliedExerciseEngine.buildExerciseModel(plan),
    groups = plan.groups.map((g) => ({ players: g.n, keepers: g.k }));
  if (groups.some((g) => g.keepers > g.players - 2))
    return notify(
      "Gardez au moins deux joueurs de champ par groupe avant ajout.",
    );
  const custom = {
    importedExerciseId: e.id,
    importedExerciseView: suppliedExerciseEngine.viewIndex(e),
    title: e.title,
    goal: e.goal,
    organisation:
      groups
        .map(
          (g, i) =>
            "Groupe " +
            (i + 1) +
            " : " +
            g.players +
            " joueurs dont " +
            g.keepers +
            " gardien(s)",
        )
        .join("\n") +
      "\n" +
      plan.orgText,
    instructions: [
      ...(e.obj ? ["Objectif : " + e.obj] : []),
      ...e.rules,
      "Coaching :",
      ...e.coach,
      "Posture : " + e.posture,
      "Attendus :",
      ...e.expect,
      "Plus simple : " + e.easier,
      "Plus difficile : " + e.harder,
      ...(e.series
        ? [
            "Séries de référence : travail " +
              e.series[0] +
              " s · récupération " +
              e.series[1] +
              " s",
          ]
        : []),
      "Séries pour le groupe : " +
        suppliedExerciseEngine.seriesOf(e, e.duration, plan.band).text,
      "Source : " + (e.src?.label || "Fichier du coach"),
    ].join("\n"),
    material: suppliedExerciseEngine.materialOf(plan, model),
    success: e.success,
    kind: "game",
    width: Math.min(68, plan.size[0]),
    length: Math.min(105, plan.size[1]),
    board: suppliedBoardSnapshot(model),
    adaptation: {
      version: 1,
      players: currentTraining.players,
      keepers: currentTraining.keepers,
      source:
        suppliedExerciseEngine.presentationFor(e).source + " · " + e.title,
      rotations: e.rules.join("\n"),
      groups,
    },
  };
  if (!trainingCustomValid(custom))
    return notify(
      "Cette adaptation ne peut pas être enregistrée. Vérifiez les paramètres.",
    );
  return trainingCommitBlocks((blocks) =>
    blocks.push({
      id: crypto.randomUUID(),
      exerciseId: "custom",
      custom,
      duration: e.duration,
      notes: "",
    }),
  );
}
renderBibleCatalogue = function () {
  ensureBibleCatalogue();
  ensureSuppliedSections();
  ensureSuppliedLibraries();
  const root = $("training-catalogue");
  root.parentElement.classList.remove("supplied-exercises-catalogue");
  const axis = $("bible-bmf-category").value;
  bmfSubcategorySelect($("training-filter"), axis, $("training-filter").value);
  $("bible-objective-filter-label").hidden = axis === "ludic";
  const objective = $("training-filter").value,
    query = $("training-search")
      .value.trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  // Legacy controls requiring the retired exercise engine do not describe these supplied fiches.
  for (const id of [
    "bible-five-only",
    "bible-fit-only",
    "bible-method",
    "bible-phase",
  ]) {
    const node = $(id);
    if (node) {
      const label = node.closest("label");
      if (label) label.hidden = true;
      else node.hidden = true;
    }
  }
  const section = $("supplied-section").value,
    source = $("supplied-source").value,
    exercises = suppliedCatalogueExercises({
      section,
      axis,
      objective,
      query,
      source,
    });
  const signature = JSON.stringify([query, axis, objective, section, source]);
  if (signature !== bibleCatalogueSignature) {
    bibleCataloguePage = 0;
    bibleCatalogueSignature = signature;
  }
  const size =
      innerWidth >= 1500
        ? 4
        : innerWidth >= 1100
          ? 3
          : innerWidth >= 650
            ? 2
            : 1,
    total = Math.max(1, Math.ceil(exercises.length / size));
  bibleCataloguePage = Math.min(bibleCataloguePage, total - 1);
  bibleDisposeDiagrams(root);
  root.replaceChildren();
  $("bible-intro").textContent =
    suppliedExerciseEngine.exercises.length + " fiches · schémas et animations";
  $("bible-results").textContent = exercises.length + " exercice(s) trouvé(s)";
  $("bible-group-context").textContent =
    currentTraining.players +
    " joueurs · " +
    currentTraining.keepers +
    " gardien(s) · " +
    currentTraining.category;
  $("bible-reset").hidden = !query && !axis && !objective && !section;
  $("supplied-section")
    .parentElement.querySelectorAll("button")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.section === section),
      ),
    );
  $("bible-phase-shortcuts")
    .querySelectorAll("button")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.category === axis),
      ),
    );
  for (const e of exercises.slice(
    bibleCataloguePage * size,
    (bibleCataloguePage + 1) * size,
  )) {
    const card = el(
      "article",
      "training-catalogue-card bible-card supplied-exercise-card",
    );
    card.dataset.exercise = e.id;
    card.dataset.moment = e.moment;
    card.dataset.section = section || suppliedExerciseEngine.sectionFor(e);
    card.dataset.view = String(suppliedExerciseEngine.viewIndex(e));
    const picture = el("button", "bible-card-picture");
    picture.type = "button";
    picture.setAttribute("aria-label", "Voir le schéma : " + e.title);
    picture.onclick = () => openSuppliedSheet(e);
    const reference = {
        players: e.players[1],
        keepers: e.keepers || 0,
        category: e.refCategory || "Seniors",
        level: "dev",
        moment: "libre",
        space: [68, 105],
      },
      model = suppliedExerciseEngine.buildExerciseModel(
        suppliedExerciseEngine.adapt(e, reference),
      ),
      svg = suppliedExerciseEngine.createBoard(model, {
        editable: false,
        viewer: true,
        title: e.title,
      }).svg;
    svg.setAttribute("aria-hidden", "true");
    picture.append(
      svg,
      el("span", "bible-card-picture-label", "Voir le schéma"),
    );
    card.append(
      picture,
      el(
        "p",
        "exercise-classification",
        suppliedExerciseEngine.moments[e.moment].label + " · " + e.sub,
      ),
      el("span", "eyebrow", e.type),
      el("h3", "", e.title),
      el("p", "bible-card-goal", e.obj || e.goal),
      el(
        "p",
        "bible-card-format",
        e.duration +
          " min · " +
          e.size.join(" × ") +
          " m · " +
          e.players[1] +
          " joueurs (référence)",
      ),
    );
    const details = el("details", "bible-card-preview");
    details.append(el("summary", "", "Consulter les détails ici"));
    details.addEventListener("toggle", () => {
      if (details.open && !details.querySelector(".supplied-original-sheet"))
        details.append(suppliedSheet(e));
    });
    const actions = el("div", "bible-card-actions"),
      add = el("button", "primary", "+ Ajouter à la séance"),
      open = el("button", "export", "Ouvrir la fiche");
    add.type = open.type = "button";
    add.onclick = () => addSuppliedExercise(e);
    open.onclick = () => openSuppliedSheet(e);
    actions.append(add, open);
    card.append(details, actions);
    root.append(card);
  }
  if (!exercises.length)
    root.append(
      el("p", "hint", "Aucun exercice dans cette rubrique pour le moment."),
    );
  if (total > 1) {
    const pager = el("nav", "bible-result-pages"),
      previous = el("button", "export", "← Précédent"),
      next = el("button", "export", "Suivant →");
    previous.type = next.type = "button";
    previous.id = "bible-previous";
    next.id = "bible-more";
    previous.disabled = bibleCataloguePage === 0;
    next.disabled = bibleCataloguePage === total - 1;
    previous.onclick = () => {
      bibleCataloguePage--;
      renderBibleCatalogue();
    };
    next.onclick = () => {
      bibleCataloguePage++;
      renderBibleCatalogue();
    };
    pager.setAttribute("aria-label", "Pages des exercices");
    pager.append(
      previous,
      el("span", "", "Page " + (bibleCataloguePage + 1) + " / " + total),
      next,
    );
    root.prepend(pager);
  }
};
const reuseBeforeImportedExercises = trainingReuseExercise;
trainingReuseExercise = function (block, source, label) {
  const e = suppliedExerciseEngine.getExercise(
    block.custom?.importedExerciseId,
    block.custom?.importedExerciseView || 0,
  );
  if (!e) return reuseBeforeImportedExercises(block, source, label);
  $("training-personal-library")?.close();
  openSuppliedSheet(e);
};
