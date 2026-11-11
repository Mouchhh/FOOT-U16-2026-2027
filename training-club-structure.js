// Club taxonomy is presentation/index metadata, never a rewrite of source exercises.
Object.assign(suppliedMomentAxes, { echauffement: "ludic", physique: "ludic" });
function clubExerciseClassification(exercise) {
  const normalize = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
  const meta = window.exerciseReferenceIndex?.forExercise(exercise);
  let axis = suppliedMomentAxes[exercise.moment] || "",
    objective = "";
  if (exercise.moment === "echauffement") objective = "ludic-activation";
  else if (exercise.moment === "physique") objective = "ludic-motor";
  else if (axis === "ludic")
    objective =
      Object.keys(bmfSubcategories).find(
        (k) =>
          bmfSubcategories[k].axis === "ludic" &&
          normalize(bmfSubcategories[k].label) === normalize(exercise.sub),
      ) ||
      (meta?.phase === "activation"
        ? "ludic-activation"
        : meta?.phase === "situation"
          ? "ludic-situation"
          : "ludic-game");
  else
    objective =
      Object.keys(bmfSubcategories).find(
        (k) =>
          bmfSubcategories[k].axis === axis &&
          normalize(bmfSubcategories[k].label) === normalize(exercise.sub),
      ) || "";
  const zone = String(exercise.sub || "").match(/Zone\s*([123])/i)?.[1];
  if (!objective && zone && axis) {
    const zones = {
      ball: ["ball-build", "ball-control", "ball-finish"],
      loss: ["loss-goal", "loss-slow", "loss-press"],
      win: ["win-forward", "win-zone3", "win-score"],
      off: ["off-low", "off-control", "off-high"],
    };
    objective = zones[axis]?.[Number(zone) - 1] || "";
  }
  if (!objective && /^Jeu\s*·/.test(exercise.sub || "")) {
    axis = "ludic";
    objective = /réduit/i.test(exercise.sub) ? "ludic-situation" : "ludic-game";
  }
  if (!axis && meta?.phase === "activation") {
    axis = "ludic";
    objective = "ludic-activation";
  }
  return {
    axis,
    objective,
    originalMoment: exercise.moment,
    originalSub: exercise.sub,
    mode:
      ["activation", "situation"].includes(meta?.phase) || axis === "ludic"
        ? "ludic"
        : "tactical",
    format: meta?.phase || "",
    needsReview: !axis || !objective,
  };
}
suppliedObjective = (exercise) =>
  clubExerciseClassification(exercise).objective;
function clubExerciseMatches(exercise, axis = "", objective = "") {
  const c = clubExerciseClassification(exercise);
  return (
    (!axis || c.axis === axis) && (!objective || c.objective === objective)
  );
}
function clubExerciseRecommendations(objectives, needs) {
  const seen = new Set();
  return exerciseReferenceIndex
    .find({
      effectif: needs.total,
      gardiens: needs.keepers,
      surface: needs.space,
      niveau: needs.level,
    })
    .filter((meta) => {
      if (meta.effectif_a_verifier || seen.has(meta.source_id)) return false;
      const exercise = exerciseReferenceIndex.resolve(meta.id),
        c = clubExerciseClassification(exercise);
      if (!objectives.includes(c.objective)) return false;
      seen.add(meta.source_id);
      return true;
    });
}
function clubTrainingObjectives(input) {
  const selected = input.objectives;
  if (
    !Array.isArray(selected) ||
    !selected.length ||
    selected.length > 4 ||
    new Set(selected).size !== selected.length ||
    selected.some((k) => !Object.hasOwn(bmfSubcategories, k))
  )
    throw Error("Choisissez entre 1 et 4 sous-parties des intentions de jeu.");
  return selected;
}
function clubExerciseText(text) {
  return String(text || "").replace(
    /mycoach(?:\s+by\s+FFF)?/gi,
    "Référence d’entraînement",
  );
}
function clubCleanExerciseLabels(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    if (!node.parentElement?.closest("style,script")) {
      const clean = clubExerciseText(node.data);
      if (clean !== node.data) node.data = clean;
    }
  }
  for (const node of root.querySelectorAll(
    "[title],[aria-label],[alt],[placeholder]",
  ))
    for (const name of ["title", "aria-label", "alt", "placeholder"])
      if (node.hasAttribute(name))
        node.setAttribute(name, clubExerciseText(node.getAttribute(name)));
  return root;
}
const clubSheetOriginal = suppliedSheet;
suppliedSheet = function (...args) {
  const host = clubSheetOriginal(...args);
  clubCleanExerciseLabels(host.shadowRoot);
  return host;
};
const clubTrainingDocument = trainingDocument;
trainingDocument = function (...args) {
  return clubCleanExerciseLabels(clubTrainingDocument(...args));
};
// Read-only projection: brief extracts and a separate adaptation strip.
// The sheet's own reference rhythm (series in seconds), shown as written; sheets
// without explicit series show nothing rather than an invented cadence.
function clubTrainingBlockSeries(block, source) {
  const series = source?.series;
  if (!Array.isArray(series) || !(series[0] > 0)) return "";
  const time = (sec) => { const m = Math.floor(sec / 60), s = Math.round(sec % 60); return m ? m + " min" + (s ? " " + String(s).padStart(2, "0") : "") : s + " s"; };
  return "Rythme de référence de la fiche : efforts de " + time(series[0]) +
    (series[1] > 0 ? ", récupération " + time(series[1]) + " entre les efforts." : ", en continu.");
}
function clubTrainingBlockCard(block, index, { details = true, session = null } = {}) {
  const custom = block.custom,
    card = el("article", "training-assistant-phase training-club-sequence training-workshop"),
    short = (value, length = 155) => {
      const text = clubExerciseText(value || "").replace(/\s+/g, " ").trim();
      return text.length > length ? text.slice(0, length - 1).trimEnd() + "…" : text;
    },
    source = custom.importedExerciseId
      ? suppliedExerciseEngine.getExercise(custom.importedExerciseId, custom.importedExerciseView || 0)
      : null,
    setup = block.setupMinutes || 0,
    recovery = block.recoveryMinutes || 0,
    groups = custom.adaptation?.groups || [{
      players: block.workshopPlayers ?? session?.players ?? 2,
      keepers: block.workshopKeepers ?? session?.keepers ?? 0,
    }];
  card.append(
    el("span", "training-sequence-number", "Séquence " + (index + 1)),
    el("h3", "", clubExerciseText(custom.title).replace(/^\d+\.\s*/, "")),
  );
  const facts = el("div", "training-sequence-facts");
  for (const label of [
    (block.duration + setup) + " min",
    custom.width + " × " + custom.length + " m" + (groups.length > 1 ? " / atelier" : ""),
  ]) facts.append(el("span", "", label));
  card.append(facts);
  const body = el("div", "training-workshop-body"),
    figure = el("figure", "training-workshop-diagram"),
    content = el("div", "training-workshop-content");
  if (source) {
    const reference = suppliedReferenceBoard(source);
    reference.svg.setAttribute("aria-label", "Schéma d’origine · " + source.title);
    figure.append(reference.svg, el("figcaption", "", "Schéma identique à la bibliothèque · adaptations séparées"));
  } else if (custom.board) {
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-label", "Schéma enregistré · " + custom.title);
    drawExerciseBoard(canvas, custom.board);
    figure.append(canvas, el("figcaption", "", source ? "Schéma adapté · fiche d’origine conservée" : "Schéma enregistré · atelier illustré"));
    if (custom.board.frames.length > 1) {
      const play = el("button", "export training-workshop-play", "Lire l’animation");
      play.type = "button";play.onclick = () => playExerciseBoard(canvas, custom.board);figure.append(play);
    }
  } else {
    figure.classList.add("training-workshop-no-diagram");
    figure.append(el("p", "", "Aucun schéma associé"), el("figcaption", "", "Choisissez un exercice de la bibliothèque pour reprendre son schéma d’origine."));
  }
  const label = (title, value, className = "") => {
    content.append(el("h4", "", title), el("p", className, short(value, 120)));
  };
  label("Objectif", source?.goal || custom.goal, "training-sequence-goal");
  label(source ? "Organisation de référence" : "Organisation", source
    ? source.game + " · " + Math.min(...source.players) + "–" + Math.max(...source.players) + " joueurs · " + source.keepers + " G · " + source.size.join(" × ") + " m"
    : custom.organisation);
  content.append(el("h4", "", "Consignes clés"));
  const list = el("ul", "training-sequence-rules"),
    rules = source?.rules || custom.instructions.split(/\n|(?<=\.)\s+/).filter(Boolean);
  rules.slice(0, 2).forEach(rule => list.append(el("li", "", short(rule, 130))));
  content.append(list);
  body.append(figure, content);card.append(body);
  const timing = el("p", "training-sequence-timing");
  timing.append(el("strong", "", "Travail " + Math.max(0, block.duration - recovery) + " min"),
    document.createTextNode(" · Repos " + recovery + " min" + (setup ? " · Installation " + setup + " min" : "")));
  card.append(timing);
  const adaptation = el("aside", "training-workshop-adaptation");
  adaptation.append(el("strong", "", "Adaptations pour ce groupe"), el("p", "", groups.map((g, i) =>
    (groups.length > 1 ? "G" + (i + 1) + " : " : "") + (g.players - g.keepers) + " joueurs de champ" +
    (g.keepers ? " + " + g.keepers + " G" : " · sans gardien")
  ).join(" · ")));
  if (session) adaptation.append(el("p", "", [
    session.assistantLevel || session.category || "U" + session.age,
    trainingLevels[session.level],
    custom.width + " × " + custom.length + " m par zone",
  ].filter(Boolean).join(" · ")));
  if (session) adaptation.append(el("p", "", "Repère de niveau : " +
    (session.level === "advanced"
      ? "touches libres, puis réduire le temps de décision si la qualité reste stable."
      : "touches libres et opposition progressive ; une seule contrainte à la fois.")));
  if (session && custom.adaptation && (custom.adaptation.players !== session.players || custom.adaptation.keepers !== session.keepers))
    adaptation.append(el("p", "training-alert", "L’effectif a changé : réadaptez cet atelier avant utilisation."));
  // Bible sheet: the saved age warning, and series derived from the current duration
  // (recoveries included), so editor changes never leave stale series behind.
  if (source) {
    for (const line of String(custom.instructions || "").split("\n"))
      if (/^À adapter : /.test(line)) adaptation.append(el("p", "training-alert", line));
    const series = clubTrainingBlockSeries(block, source);
    if (series) adaptation.append(el("p", "training-block-series", series));
  }
  card.append(adaptation);
  const more = el("button", "export training-workshop-source", source ? "Voir la fiche d’origine" : "Lire toutes les consignes");
  more.type = "button";
  if (source) more.onclick = () => openSuppliedSheet(source);
  else {
    const full = el("section", "training-workshop-full");
    full.hidden = true;
    for (const key of ["goal", "organisation", "instructions", "material", "success"])
      full.append(el("h4", "", customTrainingLabels[key]), el("p", "", clubExerciseText(custom[key])));
    more.setAttribute("aria-expanded", "false");
    more.onclick = () => { full.hidden = !full.hidden; more.setAttribute("aria-expanded", String(!full.hidden)); };
    card.append(full);
  }
  card.append(more);
  return card;
}
const clubSessionIndex = trainingSessionIndex;
trainingSessionIndex = function (session) {
  const result = clubSessionIndex(session),
    keys = (session.assistantObjectives || []).filter((k) =>
      Object.hasOwn(bmfSubcategories, k),
    );
  if (!keys.length) return result;
  result.axes = [
    ...new Set([...result.axes, ...keys.map((k) => bmfSubcategories[k].axis)]),
  ];
  result.objectives = [...new Set([...result.objectives, ...keys])];
  result.text +=
    " " +
    keys
      .map(
        (k) =>
          bmfCategoryLabel(bmfSubcategories[k].axis) +
          " " +
          bmfObjectiveLabel(k),
      )
      .join(" ")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  result.sector =
    result.axes.length === 1
      ? bmfCategoryLabel(result.axes[0])
      : "Plusieurs intentions de jeu";
  return result;
};
// JSON-compatible club index. The old reference index remains an internal compatibility adapter.
window.clubExerciseIndex = {
  version: 2,
  entries() {
    return exerciseReferenceIndex.entries.map((meta) => {
      const c = clubExerciseClassification(
        exerciseReferenceIndex.resolve(meta.id),
      );
      return {
        id: meta.id,
        source_id: meta.source_id,
        source_view: meta.source_view,
        intention: c.axis,
        sous_partie: c.objective,
        mode: c.mode,
        format: meta.phase,
        effectif_min: meta.effectif_min,
        effectif_max: meta.effectif_max,
        gardiens: meta.gardiens,
        surface: meta.surface,
        dimensions: [...meta.dimensions],
        difficulte: meta.difficulte,
        duree: meta.duree,
        origine: { intention: c.originalMoment, sous_partie: c.originalSub },
        a_verifier: c.needsReview || !!meta.effectif_a_verifier,
      };
    });
  },
  find({ intention = "", sous_partie = "", mode = "" } = {}) {
    return this.entries().filter(
      (e) =>
        (!intention || e.intention === intention) &&
        (!sous_partie || e.sous_partie === sous_partie) &&
        (!mode || e.mode === mode),
    );
  },
};
const clubCustomDetail = trainingCustomDetail;
trainingCustomDetail = function (...args) {
  return clubCleanExerciseLabels(clubCustomDetail(...args));
};
const clubOpenSheet = openSuppliedSheet;
openSuppliedSheet = function (exercise) {
  const result = clubOpenSheet(exercise),
    dialog = $("bible-sheet-dialog");
  if (!dialog) return result;
  const c = clubExerciseClassification(exercise),
    label = el(
      "p",
      "club-exercise-location",
      [
        bmfCategoryLabel(c.axis),
        bmfObjectiveLabel(c.objective),
        c.mode === "ludic" ? "Mode ludique" : "",
      ]
        .filter(Boolean)
        .join(" · "),
    );
  dialog.querySelector(".bible-dialog-heading")?.after(label);
  const picker = dialog.querySelector(".supplied-angle-picker select");
  if (picker) {
    const views = suppliedExerciseEngine.viewsOf(exercise);
    [...picker.options].forEach((option, i) => {
      const v = views[i],
        classification = clubExerciseClassification(v);
      option.textContent = [
        bmfCategoryLabel(classification.axis),
        bmfObjectiveLabel(classification.objective),
        v.obj,
      ]
        .filter(Boolean)
        .join(" · ");
    });
  }
  return result;
};
