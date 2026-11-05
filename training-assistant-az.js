const trainingAssistantValid = trainingValid;
trainingValid = function (session) {
  return (
    trainingAssistantValid(session) &&
    (session.libraryOnly === undefined ||
      typeof session.libraryOnly === "boolean") &&
    (session.assistantObjectives === undefined ||
      (Array.isArray(session.assistantObjectives) &&
        session.assistantObjectives.length >= 1 &&
        session.assistantObjectives.length <= 4 &&
        new Set(session.assistantObjectives).size ===
          session.assistantObjectives.length &&
        session.assistantObjectives.every((k) =>
          Object.hasOwn(bmfSubcategories, k),
        )))
  );
};
// Local coaching templates: deterministic adaptation, no external AI call or rewrite of imported exercises.
function trainingAssistantNeeds({
  goal,
  level,
  players,
  space,
  objective = "",
}) {
  const clean = (s) =>
    String(s || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  if (
    !goal?.trim() ||
    goal.length > 200 ||
    !level?.trim() ||
    level.length > 100
  )
    throw Error("Précisez l’objectif et le niveau du groupe.");
  const count = clean(players);
  let field, keepers;
  const sum = count.match(
    /^(\d+)\s*(?:joueurs?(?: de champ)?)?\s*\+\s*(\d+)\s*(?:gardiens?|gb)?$/,
  );
  const included = count.match(
    /^(\d+)\s*(?:joueurs?)?\s*dont\s*(\d+)\s*(?:gardiens?|gb)?$/,
  );
  if (sum) {
    field = Number(sum[1]);
    keepers = Number(sum[2]);
  } else if (included) {
    keepers = Number(included[2]);
    field = Number(included[1]) - keepers;
  } else if (/^\d+$/.test(count)) {
    field = Number(count);
    keepers = 0;
  } else
    throw Error(
      "Indiquez par exemple « 14 + 2 » : 14 joueurs de champ et 2 gardiens.",
    );
  if (field < 4 || field + keepers > 80 || keepers < 0 || keepers > 12)
    throw Error(
      "Prévoyez au moins 4 joueurs de champ, au maximum 80 présents et 12 gardiens.",
    );
  if (!["quarter", "half", "full"].includes(space))
    throw Error("Choisissez la surface disponible.");
  const bounds = trainingSpaces[space];
  if ((bounds[0] * bounds[1]) / (field + keepers) < 30)
    throw Error(
      "Cet espace est trop réduit pour cet effectif. Choisissez une surface plus grande ou travaillez avec un groupe plus petit.",
    );
  const text = clean(level),
    ageMatch = text.match(/\bu\s*(\d{1,2})\b/),
    age = ageMatch ? Number(ageMatch[1]) : 18;
  if (age < 12 || age > 65)
    throw Error(
      "Cet assistant est prévu pour les U12 et catégories supérieures.",
    );
  const context = /national/.test(text)
    ? "National"
    : /regional/.test(text)
      ? "Régional"
      : /loisir/.test(text)
        ? "Loisir"
        : "District";
  const theme = clean(goal),
    mapped = bmfTrainingThemes(
      bmfSubcategories[objective]?.axis || "",
      objective,
    )[0],
    focus = [
      "Relance",
      "Finition",
      "Défense",
      "Pressing",
      "Transitions",
      "Conservation",
    ].includes(mapped)
      ? mapped
      : /fini|frapp|tir|but/.test(theme)
        ? "Finition"
        : /press/.test(theme)
          ? "Pressing"
          : /trans|recup|perte/.test(theme)
            ? "Transitions"
            : /sortie|relance/.test(theme)
              ? "Relance"
              : /defen|bloc|couliss/.test(theme)
                ? "Défense"
                : "Conservation";
  return {
    goal: goal.trim(),
    level: level.trim(),
    field,
    keepers,
    total: field + keepers,
    age,
    context,
    space,
    bounds,
    focus,
    technical:
      context === "National" || context === "Régional"
        ? "advanced"
        : "developing",
  };
}
function trainingAssistantGroups(needs, limit, area) {
  const count = Math.max(1, Math.ceil(needs.field / limit)),
    cols = Math.ceil(Math.sqrt(count)),
    rows = Math.ceil(count / cols);
  return Array.from({ length: count }, (_, i) => {
    const field =
      Math.floor(needs.field / count) + (i < needs.field % count ? 1 : 0);
    const keepers =
      Math.floor(needs.keepers / count) + (i < needs.keepers % count ? 1 : 0);
    const total = field + keepers,
      maxW = Math.floor(needs.bounds[0] / cols) - 2,
      maxL = Math.floor(needs.bounds[1] / rows) - 2;
    const width = Math.max(
        6,
        Math.min(
          maxW,
          Math.round(
            Math.sqrt(
              (total *
                area *
                (needs.age < 15 ? 0.9 : 1) *
                (needs.technical === "advanced" ? 1.1 : 1)) /
                1.35,
            ),
          ),
        ),
      ),
      length = Math.max(6, Math.min(maxL, Math.round(width * 1.35)));
    const side = Math.floor(field / 2),
      joker = field % 2;
    return {
      players: total,
      keepers,
      field,
      width,
      length,
      roles:
        side +
        " contre " +
        side +
        (joker ? " + 1 joker neutre" : "") +
        (keepers
          ? " + " + keepers + " gardien(s)"
          : " · deux portes ou mini-buts"),
    };
  });
}
function trainingAssistantGenerateBase(input) {
  const n = trainingAssistantNeeds(input),
    session = newTraining();
  const main = trainingAssistantGroups(n, 10, 75),
    game = trainingAssistantGroups(n, n.total <= 20 ? 18 : 10, 120),
    warm = trainingAssistantGroups(n, 8, 35);
  for (const group of warm)
    group.roles =
      group.field +
      " joueurs de champ" +
      (group.keepers
        ? " + " + group.keepers + " gardien(s) au jeu au pied"
        : "") +
      " en circulation de balle et mobilité";
  const setup = (groups) =>
    groups
      .map(
        (g, i) =>
          "Atelier " +
          (i + 1) +
          " : " +
          g.players +
          " présents dont " +
          g.keepers +
          " gardien(s), " +
          g.width +
          " × " +
          g.length +
          " m. " +
          (g.roles || "Rassemblement collectif") +
          ".",
      )
      .join("\n");
  const roleNotes =
    "Les gardiens occupent les buts disponibles ; au-delà de deux par atelier, les autres jouent comme appuis au pied et alternent toutes les 2 minutes. Sans gardien : finir dans des portes. Avec un seul gardien : un but gardé et deux portes opposées ; inverser les rôles à chaque série. Les jokers changent toutes les 2 minutes.";
  const patterns = {
    Relance: [
      "Ressortir sous pression",
      "L’équipe en possession repart du gardien ou de sa ligne de fond. Marquer un point en franchissant une porte opposée après une passe vers l’avant. Les défenseurs pressent à la première passe. À la récupération, ils contre-attaquent vers la ligne de départ.",
      "S’écarter pour créer une ligne de passe, s’orienter avant de recevoir et proposer un soutien derrière le porteur.",
      "Bonus si le ballon franchit une ligne par une passe au sol après fixation d’un adversaire.",
    ],
    Pressing: [
      "Presser ensemble",
      "L’équipe qui relance démarre du gardien ou de sa ligne de fond. Le bloc adverse déclenche sur une passe latérale ou un contrôle fermé. Le premier joueur cadre, les partenaires ferment les solutions intérieures. À la récupération, attaquer immédiatement la cible.",
      "Se déplacer ensemble, protéger l’axe et couvrir le partenaire qui sort. Arrêter la séquence si le bloc se désunit, puis replacer.",
      "Bonus si une récupération collective est suivie d’une frappe ou du franchissement d’une porte.",
    ],
    Transitions: [
      "Changer rapidement de statut",
      "Deux équipes cherchent la cible opposée. À la perte, le joueur proche ralentit le porteur ; les partenaires protègent l’axe. À la récupération, chercher une passe vers l’avant si elle est disponible, sinon conserver par un soutien.",
      "Réagir à la perte sans se jeter, prendre une information à la récupération et proposer deux solutions au porteur.",
      "Bonus si la récupération est suivie d’une progression maîtrisée vers la cible, sans obligation de jouer vers l’avant si la solution est fermée.",
    ],
    Finition: [
      "Construire puis conclure",
      "Attaquer le but gardé ou les mini-buts en combinant avec un appui. L’équipe qui défend cherche les portes opposées dès la récupération. Repartir rapidement avec un ballon de réserve, sans frappe simultanée vers la même cible.",
      "Regarder le gardien avant de frapper, accompagner l’action et varier les courses pour offrir une passe dans la zone de finition.",
      "Bonus pour un but après une passe en retrait ou une combinaison avec un partenaire.",
    ],
    Défense: [
      "Défendre ensemble",
      "L’équipe qui attaque cherche une cible au-delà de la ligne défensive. Les défenseurs se déplacent ensemble pour fermer l’axe, protéger la profondeur et orienter vers un côté. À la récupération, chercher les portes opposées.",
      "Cadrer sans se jeter, couvrir le partenaire et garder des distances permettant l’entraide.",
      "Bonus si une récupération est obtenue en restant compact et suivie d’une sortie de zone maîtrisée.",
    ],
    Conservation: [
      "Conserver pour progresser",
      "Deux équipes et, si nécessaire, un joker cherchent à conserver puis à franchir une porte par une passe. À la récupération, changer immédiatement le sens d’attaque.",
      "Prendre l’information avant réception, créer des angles de passe et se déplacer après avoir donné.",
      "Bonus si plusieurs joueurs participent à la progression avant de franchir la cible.",
    ],
  };
  const [title, instructions, behaviour, constraint] = patterns[n.focus];
  const duration = n.age < 16 ? 75 : 90,
    times = n.age < 16 ? [15, 25, 25, 10] : [15, 30, 35, 10],
    setups = [1, 3, n.age < 16 ? 2 : 4, 0],
    rests = [2, n.age < 16 ? 4 : 3, n.age < 16 ? 2 : 3, 5];
  const levelAdvice =
    (n.age < 15
      ? "Consignes courtes et démonstration avant la première série. "
      : "") +
    (n.technical === "advanced"
      ? "Commencer en touches libres, puis réduire le temps de décision ou passer à trois touches si la qualité reste stable."
      : "Commencer avec une opposition progressive et en touches libres ; ajouter une seule contrainte lorsque le groupe réussit régulièrement.");
  Object.assign(session, {
    title: (n.goal + " · " + n.level).slice(0, 100),
    players: n.total,
    keepers: n.keepers,
    age: n.age,
    level: n.technical,
    context: n.context,
    space: n.space,
    duration,
    themes: [n.focus],
    creationMode: "assisted",
    libraryOnly: true,
    notes:
      "Objectif du coach : " +
      n.goal +
      "\nGroupe : " +
      n.level +
      "\n" +
      n.field +
      " joueurs de champ + " +
      n.keepers +
      " gardien(s).\nSéance proposée à partir de quatre critères, ajustable par le coach.\n" +
      levelAdvice,
  });
  const phases = [
    {
      title: "1. Échauffement / Activation",
      groups: warm,
      kind: "circuit",
      goal: "Préparer progressivement le groupe pour " + n.goal + ".",
      instructions:
        "1 minute d’organisation, puis 3 minutes de mobilité et de conduite souple et 3 séquences de 3 minutes de passes et déplacements avec prise d’information. Une minute de récupération entre les séquences. Les gardiens participent au jeu au pied. Augmenter progressivement la vitesse, sans course maximale à froid.",
      success:
        "Tous les joueurs sont actifs et la qualité des appuis et des passes reste maîtrisée.",
    },
    {
      title: "2. Situation / " + title,
      groups: main,
      kind: n.focus === "Finition" ? "game" : "possession",
      goal: n.goal,
      instructions:
        instructions +
        "\nComportements attendus : " +
        behaviour +
        "\n" +
        roleNotes +
        "\n" +
        levelAdvice +
        "\n" +
        (n.age < 16
          ? "3 minutes d’installation, puis 3 séries de 6 minutes avec 2 minutes de récupération entre les séries : 25 minutes au total."
          : "3 minutes d’installation, puis 4 séries de 6 minutes avec 1 minute de récupération entre les séries : 30 minutes au total."),
      success:
        "Observer sur plusieurs actions si le comportement attendu apparaît, puis ajuster une seule contrainte à la fois.",
    },
    {
      title: "3. Jeu appliqué / Opposition",
      groups: game,
      kind: "game",
      goal: "Retrouver " + n.goal + " dans un jeu avec opposition.",
      instructions:
        "Jeu orienté vers les cibles. " +
        constraint +
        "\n" +
        roleNotes +
        "\n" +
        (n.age < 16
          ? "2 minutes d’installation, puis 3 séries de 7 minutes avec 1 minute de récupération entre les séries : 25 minutes au total."
          : "4 minutes d’installation, puis 4 séries de 7 minutes avec 1 minute de récupération entre les séries : 35 minutes au total.") +
        " Dernière série en jeu libre pour observer le transfert.",
      success:
        "Les joueurs réinvestissent le principe sans rappel permanent du coach.",
    },
    {
      title: "4. Bilan / Retour au calme",
      groups: [
        {
          players: n.total,
          keepers: n.keepers,
          width: Math.min(n.bounds[0] - 2, 20),
          length: Math.min(n.bounds[1] - 2, 20),
        },
      ],
      kind: "circuit",
      goal: "Faire le point sur " + n.goal + " et récupérer.",
      instructions:
        "5 minutes de marche et de mobilité douce, 3 minutes d’échanges : ce qui a fonctionné, ce qui reste difficile, un repère à retenir. Prévoir 2 minutes pour l’hydratation et le rangement collectif.",
      success:
        "Chaque joueur repart avec un repère simple à réutiliser au prochain entraînement.",
    },
  ];
  session.blocks = phases.map((phase, i) => ({
    id: crypto.randomUUID(),
    exerciseId: "custom",
    duration: times[i] - setups[i],
    setupMinutes: setups[i],
    recoveryMinutes: rests[i],
    notes:
      "Temps du bloc : " +
      times[i] +
      " min, installation et récupérations comprises.",
    custom: {
      title: phase.title,
      goal: phase.goal,
      organisation: setup(phase.groups),
      instructions: phase.instructions,
      material:
        n.total +
        " chasubles, coupelles, ballons de réserve" +
        (n.keepers
          ? ", buts disponibles ou mini-buts"
          : ", portes ou mini-buts") +
        ".",
      success: phase.success,
      kind: phase.kind,
      width: phase.groups[0].width,
      length: phase.groups[0].length,
      adaptation: {
        version: 1,
        players: n.total,
        keepers: n.keepers,
        groups: phase.groups.map((g) => ({
          players: g.players,
          keepers: g.keepers,
        })),
        source: "Assistant A à Z",
        rotations: roleNotes,
      },
    },
  }));
  if (!trainingValid(session))
    throw Error(
      "Cette configuration ne permet pas une séance cohérente. Ajustez l’effectif ou la surface.",
    );
  return session;
}
function trainingAssistantGenerate(input) {
  if (!input.objectives) return trainingAssistantGenerateBase(input); // Legacy stored/API callers remain readable.
  const selected = clubTrainingObjectives(input),
    labels = selected.map((k) => bmfObjectiveLabel(k)),
    first = selected[0];
  const parts = selected.map((key) =>
    trainingAssistantGenerateBase({
      ...input,
      objective: key,
      goal:
        bmfCategoryLabel(bmfSubcategories[key].axis) +
        " · " +
        bmfObjectiveLabel(key),
    }),
  );
  const session = parts[0],
    budget = session.blocks[1].duration + (session.blocks[1].setupMinutes || 0);
  const ateliers = parts.map((part, index) => {
    const block = part.blocks[1],
      minutes =
        Math.floor(budget / parts.length) +
        (index < budget % parts.length ? 1 : 0),
      setup = Math.min(2, Math.max(0, minutes - 3)),
      rest = Math.min(2, Math.max(0, Math.floor((minutes - setup) / 4))),
      key = selected[index];
    block.clubObjective = key;
    block.setupMinutes = setup;
    block.duration = minutes - setup;
    block.recoveryMinutes = rest;
    block.custom.title = "Atelier · " + bmfObjectiveLabel(key);
    block.custom.goal =
      bmfCategoryLabel(bmfSubcategories[key].axis) +
      " · " +
      bmfObjectiveLabel(key);
    block.custom.instructions =
      block.custom.instructions.split("\n")[0] +
      "\nTravail " +
      (block.duration - rest) +
      " min · Repos " +
      rest +
      " min · Installation " +
      setup +
      " min.";
    block.notes =
      "Séquence de " +
      minutes +
      " minutes, récupération et installation comprises.";
    if (bmfSubcategories[key].axis === "ludic") {
      const rules = {
        "ludic-activation":
          "Passes et mobilité progressive par petits groupes. Changer de partenaire après chaque passe.",
        "ludic-situation":
          "Jeu réduit avec deux cibles. Un point après une passe réussie dans la cible adverse ; remettre rapidement un ballon en jeu.",
        "ludic-motor":
          "Enchaîner appuis et conduite entre des coupelles espacées. Privilégier la précision et progresser en vitesse.",
        "ludic-game":
          "Défi collectif de passes : atteindre une cible en impliquant tous les partenaires. Alterner les rôles à chaque série.",
        "ludic-cool":
          "Marche, mobilité douce et respiration. Terminer par un échange court et l’hydratation.",
      };
      block.custom.instructions =
        rules[key] +
        "\nTravail " +
        (block.duration - rest) +
        " min · Repos " +
        rest +
        " min.";
    }
    return block;
  });
  session.blocks = [
    session.blocks[0],
    ...ateliers,
    session.blocks[2],
    session.blocks[3],
  ];
  const appliedGame = session.blocks[session.blocks.length - 2],
    gameTail = appliedGame.custom.instructions.split("\n").slice(1).join("\n");
  appliedGame.custom.goal = "Réinvestir : " + labels.join(" · ");
  appliedGame.custom.instructions =
    [
      ...new Set(
        parts.map((part) => part.blocks[2].custom.instructions.split("\n")[0]),
      ),
    ].join("\n") +
    "\n" +
    gameTail;
  session.blocks.forEach((block, i) => {
    block.custom.title = block.custom.title.replace(/^\d+\.\s*/, "");
    if (i === 0) block.custom.title = "Activation ludique";
  });
  session.bmfCategory = bmfSubcategories[first].axis;
  session.bmfObjective = first;
  session.assistantObjectives = selected;
  session.title = (labels.join(" + ") + " · " + input.level).slice(0, 100);
  session.notes =
    "Intentions et sous-parties :\n" +
    selected
      .map(
        (key) =>
          bmfCategoryLabel(bmfSubcategories[key].axis) +
          " · " +
          bmfObjectiveLabel(key),
      )
      .join("\n");
  session.themes = [
    ...new Set(
      selected.flatMap((key) =>
        bmfTrainingThemes(bmfSubcategories[key].axis, key),
      ),
    ),
  ].slice(0, 3);
  if (!trainingValid(session))
    throw Error(
      "Ajustez les critères : cette séance ne peut pas être enregistrée.",
    );
  return session;
}
document.addEventListener("DOMContentLoaded", () => {
  const root = $("training-space"),
    panel = el("section", "training-assistant-panel");
  panel.id = "training-assistant-az";
  panel.hidden = true;
  const heading = el("h2", "", "Créer ma séance avec l’Assistant"),
    form = el("form", "training-assistant-form");
  function field(title, input) {
    const label = el("label", "report-field", title);
    input.setAttribute("aria-label", title);
    input.required = true;
    label.append(input);
    form.append(label);
    return input;
  }
  const goal = el("input");
  goal.type = "hidden";
  form.append(goal);
  const objectives = el("fieldset", "training-assistant-objectives");
  objectives.append(
    el("legend", "", "Intentions de jeu et sous-parties · 1 à 4 choix"),
  );
  for (const [axis, category] of Object.entries(bmfCategories)) {
    const group = el("details", "training-assistant-intention");
    group.dataset.intention = axis;
    group.append(el("summary", "", category.label));
    for (const [key, sub] of Object.entries(bmfSubcategories).filter(
      ([, v]) => v.axis === axis,
    )) {
      const label = el("label", "training-assistant-choice"),
        check = el("input");
      check.type = "checkbox";
      check.value = key;
      check.setAttribute("aria-label", category.label + " · " + sub.label);
      label.append(check, document.createTextNode(sub.label));
      group.append(label);
    }
    objectives.append(group);
  }
  form.append(objectives);
  const selectedObjectives = () =>
    [...objectives.querySelectorAll("input:checked")].map(
      (input) => input.value,
    );
  objectives.addEventListener("change", (event) => {
    if (selectedObjectives().length > 4) {
      event.target.checked = false;
      status.textContent =
        "4 sous-parties maximum pour une séance lisible et réalisable.";
    }
    goal.value = selectedObjectives()
      .map(bmfObjectiveLabel)
      .join(" · ")
      .slice(0, 200);
  });
  const level = field("Niveau du groupe", el("input"));
  level.maxLength = 100;
  level.value = activeCoachTeam.category || "";
  level.placeholder = "U17 Régional, U15 Départemental, Seniors…";
  const players = field("Joueurs de champ + gardiens", el("input"));
  players.maxLength = 60;
  players.placeholder = "14 + 2";
  const space = field("Espace / Terrain disponible", el("select"));
  space.append(
    new Option("Demi-terrain", "half"),
    new Option("Terrain complet", "full"),
    new Option("Quart de terrain", "quarter"),
  );
  const generate = el(
    "button",
    "primary",
    "Générer la séance avec l’Assistant",
  );
  generate.type = "submit";
  generate.id = "training-assistant-generate";
  form.append(generate);
  const status = el("p", "hint");
  status.setAttribute("role", "status");
  const preview = el("div", "training-assistant-preview");
  preview.setAttribute("aria-live", "polite");
  const controls = el("div", "training-assistant-controls");
  controls.hidden = true;
  const schedule = el("details");
  schedule.append(el("summary", "", "Date et horaire pour l’agenda"));
  const dateLabel = el("label", "report-field", "Date de la séance"),
    date = el("input");
  date.type = "date";
  date.setAttribute("aria-label", "Date de la séance générée");
  dateLabel.append(date);
  const timeLabel = el("label", "report-field", "Horaire"),
    time = el("input");
  time.type = "time";
  time.setAttribute("aria-label", "Horaire de la séance générée");
  timeLabel.append(time);
  schedule.append(dateLabel, timeLabel);
  const actions = el("div", "report-actions");
  const edit = el("button", "export", "Ajuster dans l’éditeur"),
    save = el("button", "export", "Enregistrer dans Mes séances"),
    plan = el("button", "primary", "Enregistrer dans l’agenda"),
    pdf = el("button", "export", "Exporter en PDF");
  for (const button of [edit, save, plan, pdf]) button.type = "button";
  actions.append(edit, save, plan, pdf);
  controls.append(schedule, actions);
  panel.append(heading, form, status, preview, controls);
  root.querySelector(".training-workspace-tabs").after(panel);
  const tab = el("button", "", "Assistant A à Z");
  tab.type = "button";
  tab.id = "training-assistant-open";
  root.querySelector(".training-workspace-tabs").append(tab);
  function hide() {
    panel.hidden = true;
    if (root.classList.contains("training-assistant-open"))
      root.classList.remove("training-assistant-open");
    tab.setAttribute("aria-pressed", "false");
  }
  tab.onclick = () => {
    trainingWizard.go(0);
    panel.hidden = false;
    root.classList.add("training-assistant-open");
    tab.setAttribute("aria-pressed", "true");
  };
  root
    .querySelector(".training-workspace-tabs")
    .addEventListener("click", (event) => {
      if (event.target.closest("button") !== tab) hide();
    });
  new MutationObserver(() => {
    if (
      !panel.hidden &&
      (root.classList.contains("training-library-open") ||
        root.classList.contains("training-exercises-open"))
    )
      hide();
  }).observe(root, { attributes: true, attributeFilter: ["class"] });
  let session = null,
    owner = "",
    stale = true;
  form.addEventListener("input", () => {
    if (session) {
      stale = true;
      for (const b of [edit, save, plan, pdf]) b.disabled = true;
      status.textContent =
        "Les critères ont changé : générez à nouveau la séance.";
    }
  });
  const context = () => activeCoach.id + ":" + activeCoachTeam.id;
  function paint() {
    preview.replaceChildren();
    preview.append(
      el("h3", "", session.title),
      el(
        "p",
        "hint",
        session.players +
          " présents dont " +
          session.keepers +
          " gardien(s) · " +
          session.duration +
          " min · " +
          trainingSpaceLabels[session.space],
      ),
    );
    session.blocks.forEach((block, index) =>
      preview.append(clubTrainingBlockCard(block, index)),
    );
    if (window.exerciseReferenceIndex) {
      const n = trainingAssistantNeeds({
        goal: goal.value,
        objective: selectedObjectives()[0],
        level: level.value,
        players: players.value,
        space: space.value,
      });
      const suggestions = clubExerciseRecommendations(
        selectedObjectives(),
        n,
      ).slice(0, 3);
      const references = el("section", "training-assistant-references");
      references.append(el("h3", "", "Exercices de référence compatibles"));
      if (!suggestions.length)
        references.append(
          el(
            "p",
            "hint",
            "Aucune fiche ne correspond exactement à cet effectif, ces gardiens et cet espace. Ajustez les critères ou conservez l’atelier proposé.",
          ),
        );
      for (const ref of suggestions) {
        const row = el("div", "training-assistant-reference-row"),
          info = el("div"),
          actions = el("div", "report-actions");
        info.append(
          el("strong", "", clubExerciseText(ref.titre)),
          el(
            "small",
            "",
            ref.effectif_min +
              "–" +
              ref.effectif_max +
              " joueurs · " +
              ref.duree +
              " min · " +
              ref.surface,
          ),
        );
        const view = el("button", "export", "Voir l’exercice"),
          use = el("button", "export", "Utiliser dans l’atelier correspondant");
        view.type = use.type = "button";
        view.onclick = () =>
          openSuppliedSheet(exerciseReferenceIndex.resolve(ref.id));
        const targetObjective = clubExerciseClassification(
          exerciseReferenceIndex.resolve(ref.id),
        ).objective;
        use.disabled = session.blocks.some(
          (b) =>
            b.clubObjective === targetObjective &&
            b.custom.importedExerciseId === ref.source_id,
        );
        use.onclick = () => {
          if (!ready()) return;
          try {
            const result = suppliedExerciseBlock(
              exerciseReferenceIndex.resolve(ref.id),
              {
                players: n.total,
                keepers: n.keepers,
                category: n.level,
                level: n.technical === "advanced" ? "confirme" : "dev",
                moment: "libre",
                space: n.bounds,
              },
            );
            if (result.warnings.length && !confirm(result.warnings.join("\n")))
              return;
            const target = session.blocks.findIndex(
              (b) => b.clubObjective === targetObjective,
            );
            if (target < 1)
              throw Error(
                "Cet exercice ne correspond pas à un atelier sélectionné.",
              );
            result.block.clubObjective = targetObjective;
            const blocks = session.blocks.map((b, i) =>
                i === target ? result.block : b,
              ),
              duration = blocks.reduce(
                (total, b) => total + b.duration + (b.setupMinutes || 0),
                0,
              ),
              next = { ...session, blocks, duration };
            if (!trainingValid(next))
              throw Error(
                "Cette fiche ne peut pas être intégrée dans la durée de cette séance.",
              );
            session = next;
            paint();
          } catch (error) {
            status.textContent = error.message;
          }
        };
        actions.append(view, use);
        row.append(info, actions);
        references.append(row);
      }
      preview.append(references);
    }
  }
  form.onsubmit = (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    stale = true;
    for (const b of [edit, save, plan, pdf]) b.disabled = true;
    try {
      session = trainingAssistantGenerate({
        objectives: selectedObjectives(),
        level: level.value,
        players: players.value,
        space: space.value,
      });
      owner = context();
      stale = false;
      for (const b of [edit, save, plan, pdf]) b.disabled = false;
      date.value = session.date;
      time.value = session.time;
      schedule.open = true;
      paint();
      controls.hidden = false;
      status.textContent =
        "Séance prête : activation, ateliers ciblés, jeu appliqué et retour au calme.";
    } catch (error) {
      status.textContent = error.message;
    }
  };
  function ready() {
    if (stale || !session || owner !== context()) {
      status.textContent =
        "L’équipe ou le coach a changé. Générez une nouvelle séance.";
      return false;
    }
    return true;
  }
  function commit(scheduled) {
    if (!ready()) return;
    const next = structuredClone(session);
    next.libraryOnly = scheduled ? false : session.libraryOnly !== false;
    if (scheduled) {
      if (
        !trainingDateValid(date.value) ||
        !/^([01]\d|2[0-3]):[0-5]\d$/.test(time.value)
      ) {
        schedule.open = true;
        status.textContent =
          "Choisissez une date et une heure valides pour l’agenda.";
        return;
      }
      next.date = date.value;
      next.time = time.value;
    }
    if (
      scheduled &&
      trainingLibrary.some(
        (item) =>
          !item.libraryOnly &&
          item.id !== next.id &&
          item.date === next.date &&
          item.time === next.time,
      )
    ) {
      status.textContent =
        "Une séance est déjà prévue pour cette équipe à cet horaire. Choisissez un autre créneau ou modifiez la séance existante.";
      schedule.open = true;
      return;
    }
    next.updatedAt = new Date().toISOString();
    if (!trainingValid(next)) {
      status.textContent = "Vérifiez les informations avant d’enregistrer.";
      return;
    }
    const library = [
      next,
      ...trainingLibrary.filter((item) => item.id !== next.id),
    ];
    try {
      coachStorageSet("vestiaire-training-library", JSON.stringify(library));
      trainingLibrary = library;
      session = structuredClone(next);
      renderTrainingLibrary();
      renderCoachAgenda();
      status.textContent = scheduled
        ? "Séance enregistrée dans Mes séances et dans l’agenda."
        : next.libraryOnly
          ? "Séance enregistrée dans Mes séances, sans rendez-vous dans l’agenda."
          : "Séance mise à jour ; son rendez-vous dans l’agenda est conservé.";
    } catch (error) {
      status.textContent =
        "Enregistrement impossible : la séance proposée reste disponible. " +
        (error.message || "");
    }
  }
  save.onclick = () => commit(false);
  plan.onclick = () => commit(true);
  edit.onclick = () => {
    if (ready() && workspaceReplaceDraft("training", session)) {
      stale = true;
      for (const b of [edit, save, plan, pdf]) b.disabled = true;
      status.textContent =
        "Poursuivez les ajustements dans l’éditeur, ou générez une nouvelle proposition ici.";
      hide();
      trainingWizard.go(3);
    }
  };
  let printTitle = null;
  const print = el("section");
  print.id = "training-assistant-print";
  document.body.append(print);
  pdf.onclick = () => {
    if (!ready()) return;
    const before = currentTraining;
    try {
      print.replaceChildren(
        el("h1", "", session.title),
        el(
          "p",
          "",
          session.players + " joueurs · " + session.duration + " min",
        ),
      );
      session.blocks.forEach((block, index) =>
        print.append(clubTrainingBlockCard(block, index, { details: false })),
      );
    } finally {
      currentTraining = before;
    }
    printTitle = document.title;
    document.body.classList.add("training-assistant-printing");
    window.print();
  };
  window.addEventListener("beforeprint", () => {
    if (
      document.body.classList.contains("training-assistant-printing") &&
      session
    )
      document.title = session.title + " — " + session.team;
  });
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("training-assistant-printing");
    if (printTitle !== null) {
      document.title = printTitle;
      printTitle = null;
    }
  });
  document.addEventListener("club-session-ready", () => {
    if (owner && owner !== context()) {
      session = null;
      owner = "";
      stale = true;
      preview.replaceChildren();
      print.replaceChildren();
      controls.hidden = true;
      goal.value = "";
      objectives
        .querySelectorAll("input")
        .forEach((check) => (check.checked = false));
      level.value = activeCoachTeam.category || "";
      players.value = "";
      status.textContent = "";
    }
  });
  window.trainingAssistantAZ = { open: () => tab.click() };
});
