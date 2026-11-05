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
function clubTrainingBlockCard(block, index, { details = true } = {}) {
  const custom = block.custom,
    card = el("article", "training-assistant-phase training-club-sequence"),
    short = (s, n = 165) => {
      const value = clubExerciseText(s).replace(/\s+/g, " ").trim();
      return value.length > n ? value.slice(0, n - 1).trimEnd() + "…" : value;
    };
  card.append(
    el("span", "training-sequence-number", "Séquence " + (index + 1)),
    el("h3", "", clubExerciseText(custom.title).replace(/^\d+\.\s*/, "")),
  );
  const badges = el("div", "training-sequence-facts"),
    setup = block.setupMinutes || 0,
    recovery = block.recoveryMinutes || 0;
  for (const text of [
    custom.width + " × " + custom.length + " m",
    block.duration + setup + " min",
    custom.adaptation?.groups.length > 1
      ? custom.adaptation.groups.length + " ateliers en parallèle"
      : "Atelier collectif",
  ])
    badges.append(el("span", "", text));
  card.append(badges, el("p", "training-sequence-goal", short(custom.goal)));
  const list = el("ul", "training-sequence-rules");
  for (const line of custom.instructions
    .split(/\n|(?<=\.)\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 2))
    list.append(el("li", "", short(line)));
  card.append(list);
  const timing = el("p", "training-sequence-timing");
  timing.append(
    el(
      "strong",
      "",
      "Travail " + Math.max(0, block.duration - recovery) + " min",
    ),
    document.createTextNode(
      " · Repos " +
        recovery +
        " min" +
        (setup ? " · Installation " + setup + " min" : ""),
    ),
  );
  card.append(timing);
  if (details) {
    const more = el("details", "training-sequence-more");
    more.append(
      el("summary", "", "Consignes complètes"),
      el("p", "", clubExerciseText(custom.organisation)),
      el("p", "", clubExerciseText(custom.instructions)),
      el("p", "", clubExerciseText(custom.material)),
    );
    card.append(more);
  }
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
