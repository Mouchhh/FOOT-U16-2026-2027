const trainingAssistantValid = trainingValid;
trainingValid = function (session) {
  return (
    trainingAssistantValid(session) &&
    (session.assistantLevel === undefined || trainingText(session.assistantLevel, 100)) &&
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
  availableBounds,
  singleWorkshop = false,
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
  const bounds = availableBounds || trainingSpaces[space];
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
    singleWorkshop,
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
  const count = needs.singleWorkshop ? 1 : Math.max(1, Math.ceil(needs.field / limit)),
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
  // The coach may choose the total time (45–150 min); otherwise 75 min before U16, 90 after.
  const requested = Number(input.duration),
    chosen = Number.isInteger(requested) && requested >= 45 && requested <= 150,
    duration = chosen ? requested : n.age < 16 ? 75 : 90,
    ratio = n.age < 16 ? [25, 25] : [30, 35],
    warmMinutes = duration >= 75 ? 15 : 12,
    coolMinutes = duration >= 75 ? 10 : 8,
    middle = duration - warmMinutes - coolMinutes,
    mainMinutes = Math.round((middle * ratio[0]) / (ratio[0] + ratio[1])),
    times = [warmMinutes, mainMinutes, middle - mainMinutes, coolMinutes],
    setups = [1, 3, n.age < 16 ? 2 : 4, 0],
    rests = [2, n.age < 16 ? 4 : 3, n.age < 16 ? 2 : 3, Math.min(5, coolMinutes - 3)];
  const seriesText = (minutes, setupMinutes, length) =>
    setupMinutes +
    " minutes d’installation, puis " +
    (minutes - setupMinutes) +
    " minutes de jeu en séries d’environ " +
    length +
    " minutes avec récupération entre les séries : " +
    minutes +
    " minutes au total.";
  const levelAdvice =
    (n.age < 15
      ? "Consignes courtes et démonstration avant la première série. "
      : "") +
    (n.technical === "advanced"
      ? "Commencer en touches libres, puis réduire le temps de décision ou passer à trois touches si la qualité reste stable."
      : "Commencer avec une opposition progressive et en touches libres ; ajouter une seule contrainte lorsque le groupe réussit régulièrement.");
  Object.assign(session, {
    title: (n.goal + " · " + n.level).slice(0, 100),
    assistantLevel: n.level,
    players: n.total,
    keepers: n.keepers,
    age: n.age,
    level: n.technical,
    context: n.context,
    space: n.space,
    duration,
    themes: [n.focus],
    creationMode: "assisted",
    libraryOnly: !session.agendaLink,
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
      title: "1. Échauffement",
      groups: warm,
      kind: "circuit",
      goal: "Préparer progressivement le groupe pour " + n.goal + ".",
      instructions:
        // 15 min: 1 + 3 + 3×3 + 2×1 ; 12 min: 1 + 2 + 3×2.5 + 2×0.75 (rounded wording).
        (warmMinutes >= 15
          ? "1 minute d’organisation, puis 3 minutes de mobilité et de conduite souple et 3 séquences de 3 minutes de passes et déplacements avec prise d’information. Une minute de récupération entre les séquences."
          : "1 minute d’organisation, puis 2 minutes de mobilité et de conduite souple et 3 séquences de 2 minutes 30 de passes et déplacements avec prise d’information. 45 secondes de récupération entre les séquences.") +
        " Les gardiens participent au jeu au pied. Augmenter progressivement la vitesse, sans course maximale à froid. Total : " +
        warmMinutes +
        " minutes.",
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
        seriesText(times[1], setups[1], 6),
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
        seriesText(times[2], setups[2], 7) +
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
        (coolMinutes - 5) +
        " minutes de marche et de mobilité douce, 3 minutes d’échanges : ce qui a fonctionné, ce qui reste difficile, un repère à retenir. Prévoir 2 minutes pour l’hydratation et le rangement collectif.",
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
function trainingAssistantGenerateTwo(input) {
  const needs = trainingAssistantNeeds({ ...input, goal: input.goal || "Ateliers ciblés" });
  if (needs.field < 8)
    throw Error("Deux ateliers nécessitent au moins 8 joueurs de champ (4 par atelier).");
  if (needs.field > 36)
    throw Error("Au-delà de 36 joueurs de champ, choisissez la répartition automatique pour garder des ateliers actifs.");
  const counts = [0, 1].map(i => ({
    field: Math.floor(needs.field / 2) + (i < needs.field % 2 ? 1 : 0),
    keepers: Math.floor(needs.keepers / 2) + (i < needs.keepers % 2 ? 1 : 0),
  }));
  // Two distinct zones, with a 3 m passage and outer clearances supplied by Groups.
  const availableBounds = [Math.floor((needs.bounds[0] - 3) / 2), needs.bounds[1]];
  const parts = counts.map((count, group) => trainingAssistantGenerate({
    ...input, organisation: "auto", singleWorkshop: true, availableBounds,
    ...(input.objectives ? { objectives: group ? [...input.objectives].reverse() : input.objectives } : {}),
    players: count.field + " + " + count.keepers,
  }));
  const session = parts[0];
  session.players = needs.total;
  session.keepers = needs.keepers;
  session.blocks = parts[0].blocks.flatMap((first, index) => {
    const parallelId = crypto.randomUUID();
    return parts.map((part, group) => {
      const block = part.blocks[index];
      block.parallelId = parallelId;
      block.workshopPlayers = counts[group].field + counts[group].keepers;
      block.workshopKeepers = counts[group].keepers;
      block.custom.title = "Atelier " + (group === 0 ? "A" : "B") + " · " + block.custom.title;
      return block;
    });
  });
  session.notes += "\nDeux ateliers simultanés, groupes distincts ; passage de 3 m entre les zones.";
  if (!trainingValid(session) || trainingSessionStages(session).some(stage => trainingStageReview(stage, session).warnings.length))
    throw Error("Ces deux ateliers ne tiennent pas dans l’espace disponible. Choisissez un terrain plus grand ou la répartition automatique.");
  return session;
}
function trainingAssistantGenerate(input) {
  if (input.organisation === "two") return trainingAssistantGenerateTwo(input);
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
    if (i === 0) block.custom.title = "Échauffement";
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
// The assistant fills each sequence with an exercise of the Bible (with its original
// diagram), adapted to the group; its written workshop stays only as a fallback.
function trainingAssistantBibleRoles(session) {
  const stages = trainingSessionStages(session),
    roles = new Map();
  stages.forEach((stage, index) => {
    const role =
      index === 0
        ? "activation"
        : index === stages.length - 1
          ? "cool"
          : index === stages.length - 2
            ? "game"
            : "workshop";
    for (const block of stage.blocks) roles.set(block.id, role);
  });
  return roles;
}
function trainingAssistantBibleTarget(block, role, objectives, needs) {
  const target = {
    activation: { objectives: ["ludic-activation"], phases: ["activation"], warmup: true },
    workshop: {
      objectives: [block.clubObjective].filter(Boolean),
      phases: ["situation", "jeu", "opposition"],
    },
    game: { objectives: [...objectives], phases: ["jeu", "opposition"] },
    cool: { objectives: ["ludic-cool"], phases: [] },
  }[role];
  if (role === "workshop" && !target.objectives.length)
    target.objectives = [...objectives];
  return {
    ...target,
    players: block.workshopPlayers ?? needs.total,
    keepers: block.workshopKeepers ?? needs.keepers,
    bounds: block.parallelId
      ? [Math.floor((needs.bounds[0] - 3) / 2), needs.bounds[1]]
      : [...needs.bounds],
    age: needs.age || 0,
  };
}
// Any real warm-up with the ball suits the coach (passing circuit, toro, rondo, ball
// work, FIFA 11+…); only tag/relay games and athletic circuits come after them.
function trainingAssistantWarmupPenalty(meta) {
  const title = String(meta.titre || "");
  if (/athl[ée]ti|physique|sprint|vitesse/i.test(title)) return 4;
  return meta.source === "games" ? 6 : 0;
}
function trainingAssistantBibleScore(meta, target) {
  // A warm-up circuit for 12 is run in several identical groups for a larger squad.
  const players = target.players,
    outside =
      players < meta.effectif_min
        ? meta.effectif_min - players
        : players > meta.effectif_max && !target.warmup
          ? players - meta.effectif_max
          : 0,
    dims = [...meta.dimensions].sort((a, b) => a - b),
    room = [...target.bounds].sort((a, b) => a - b),
    overflow =
      Math.max(0, dims[0] - room[0]) + Math.max(0, (dims[1] || 0) - room[1]),
    refAge = Number(
      String(meta.niveau_reference || "").match(/U(\d+)/i)?.[1] ||
        (/senior/i.test(meta.niveau_reference) ? 18 : 0),
    );
  return (
    outside * 3 +
    // For a warm-up the reference headcount does not matter (split into groups).
    (target.warmup ? 0 : Math.abs(players - meta.effectif_reference) / 4) +
    Math.ceil(overflow / 10) * 4 +
    (target.age && refAge ? Math.floor(Math.abs(target.age - refAge) / 2) : 0) +
    (target.phases.length && !target.phases.includes(meta.phase) ? 3 : 0) +
    (target.warmup ? trainingAssistantWarmupPenalty(meta) : 0)
  );
}
function trainingAssistantBibleCandidates(target, used = new Set()) {
  if (!window.exerciseReferenceIndex) return [];
  const seen = new Set(),
    out = [];
  for (const meta of exerciseReferenceIndex.entries) {
    if (
      // Like clubExerciseRecommendations: the club objective comes from
      // clubExerciseClassification, so only unreliable player counts are excluded.
      meta.effectif_a_verifier ||
      seen.has(meta.source_id) ||
      used.has(meta.source_id) ||
      meta.gardiens > target.keepers
    )
      continue;
    const exercise = exerciseReferenceIndex.resolve(meta.id);
    if (!exercise) continue;
    if (!target.objectives.includes(clubExerciseClassification(exercise).objective))
      continue;
    seen.add(meta.source_id);
    out.push({ meta, score: trainingAssistantBibleScore(meta, target) });
  }
  return out
    .sort(
      (a, b) =>
        a.score - b.score ||
        String(a.meta.titre).localeCompare(String(b.meta.titre), "fr"),
    )
    .map((c) => c.meta);
}
// Adapts one Bible exercise to a generated block; throws when it cannot be placed.
function trainingAssistantBibleBlock(meta, original, target, needs) {
  const exercise = exerciseReferenceIndex.resolve(meta.id),
    context = {
      players: target.players,
      keepers: target.keepers,
      category: needs.level,
      level: needs.technical === "advanced" ? "confirme" : "dev",
      moment: "libre",
      space: target.bounds,
    };
  // Engines check keepers and minimum players on the first group only: every
  // subgroup must be able to play the sheet as written.
  const plan = suppliedExerciseEngine.adapt(exercise, context),
    minimum = plan.ex?.players?.[0] ?? exercise.players?.[0] ?? 1;
  if (plan.groups.some((g) => g.n < minimum || g.k < (plan.needK || 0)))
    throw Error("Un sous-groupe ne peut pas jouer cette fiche.");
  const result = suppliedExerciseBlock(exercise, context);
  const block = result.block;
  for (const key of [
    "duration",
    "setupMinutes",
    "recoveryMinutes",
    "parallelId",
    "workshopPlayers",
    "workshopKeepers",
    "clubObjective",
  ])
    if (original[key] !== undefined) block[key] = original[key];
  // Series depend on the sequence's current duration: the card derives them at display
  // time (clubTrainingBlockSeries), so no stale series for the reference duration is saved.
  block.custom.instructions = block.custom.instructions
    .split("\n")
    .filter((line) => !/^Séries pour le groupe : /.test(line))
    .join("\n");
  // A tolerated age warning stays in the saved sheet, not only on the preview card.
  if (result.warnings.length)
    block.custom.instructions =
      "À adapter : " + result.warnings.join(" ") + "\n" + block.custom.instructions;
  // The first stage keeps its role in the title: « Échauffement · <exercise> ».
  if (target.warmup)
    block.custom.title = ("Échauffement · " + block.custom.title).slice(0, 100);
  block.assistantSource = "bible";
  block.assistantSourceId = meta.source_id;
  return { block, warnings: result.warnings };
}
// Only an age mismatch may be tolerated (shown on the card); player-count, keeper,
// space or intensity warnings mean the exercise does not fit this sequence.
function trainingAssistantAgeOnly(warnings) {
  return warnings.every((w) => /^Fiche conçue pour /.test(w));
}
// One usable replacement for blocks[index], or null: adaptation, warnings, validity
// and the stage footprint are all checked against the current session.
function trainingAssistantTryBible(session, index, meta, target, needs, allowedWarnings, tolerant) {
  let built;
  try {
    built = trainingAssistantBibleBlock(meta, session.blocks[index], target, needs);
  } catch {
    return null;
  }
  if (built.warnings.length && !(tolerant && trainingAssistantAgeOnly(built.warnings)))
    return null;
  if (built.warnings.length) built.block.assistantWarnings = built.warnings.slice(0, 3);
  const candidate = {
    ...session,
    blocks: session.blocks.map((b, i) => (i === index ? built.block : b)),
  };
  if (
    !trainingValid(candidate) ||
    trainingAssistantStageWarnings(candidate, built.block.id).length > allowedWarnings
  )
    return null;
  return candidate;
}
function trainingAssistantStageWarnings(session, blockId) {
  const stage = trainingSessionStages(session).find((s) =>
    s.blocks.some((b) => b.id === blockId),
  );
  return stage ? trainingStageReview(stage, session).warnings : [];
}
function trainingAssistantUseBible(session, needs, objectives, random = Math.random) {
  const generated = session.blocks.map((b) => structuredClone(b));
  if (!window.exerciseReferenceIndex) return { session, generated };
  const roles = trainingAssistantBibleRoles(session),
    baseline = new Map(
      session.blocks.map((b) => [
        b.id,
        trainingAssistantStageWarnings(session, b.id).length,
      ]),
    ),
    used = new Set();
  let next = structuredClone(session);
  next.blocks.forEach((b) => (b.assistantSource = "generated"));
  for (let index = 0; index < next.blocks.length; index++) {
    const original = next.blocks[index],
      target = trainingAssistantBibleTarget(
        original,
        roles.get(original.id),
        objectives,
        needs,
      );
    // First an exercise needing no adaptation warning; otherwise the closest one
    // whose only warning is the age band, kept visible on its card.
    let candidates = trainingAssistantBibleCandidates(target, used);
    // Warm-up varies from one session to the next: random order among every fit
    // scoring close to the best; the rest keeps its ranking as fallback.
    if (target.warmup && candidates.length) {
      const limit = trainingAssistantBibleScore(candidates[0], target) + 2;
      let size = 0;
      while (size < candidates.length && trainingAssistantBibleScore(candidates[size], target) <= limit) size++;
      const best = candidates.slice(0, size);
      for (let i = best.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [best[i], best[j]] = [best[j], best[i]];
      }
      candidates = [...best, ...candidates.slice(size)];
    }
    pass: for (const tolerant of [false, true])
      for (const meta of candidates) {
        const candidate = trainingAssistantTryBible(
          next,
          index,
          meta,
          target,
          needs,
          baseline.get(original.id) || 0,
          tolerant,
        );
        if (!candidate) continue;
        next = candidate;
        used.add(meta.source_id);
        break pass;
      }
  }
  next.duration = trainingSessionStages(next).at(-1)?.end || next.duration;
  return trainingValid(next) ? { session: next, generated } : { session, generated };
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
  const sessionDuration = field("Durée de la séance", el("select"));
  sessionDuration.id = "training-assistant-duration";
  sessionDuration.append(new Option("Selon l’âge (75 min avant U16, 90 min ensuite)", "auto"));
  for (const minutes of [60, 75, 90, 105, 120])
    sessionDuration.append(new Option(minutes + " min", String(minutes)));
  const organisation = field("Organisation du groupe", el("select"));
  organisation.append(new Option("Répartition automatique", "auto"), new Option("Deux ateliers séparés", "two"));
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
    stale = true,
    generated = [],
    bibleNeeds = null,
    bibleObjectives = [];
  form.addEventListener("input", () => {
    if (session) {
      stale = true;
      for (const b of [edit, save, plan, pdf]) b.disabled = true;
      status.textContent =
        "Les critères ont changé : générez à nouveau la séance.";
    }
  });
  const context = () => activeCoach.id + ":" + activeCoachTeam.id;
  function renderStages(target) {
    const roles = trainingAssistantBibleRoles(session);
    for (const [index, stage] of trainingSessionStages(session).entries()) {
      const row = el("section", "training-assistant-stage");
      if (stage.parallel) {
        row.classList.add("training-assistant-stage-parallel");
        row.append(el("h3", "training-assistant-stage-title", "Séquence " + (index + 1) + " · Deux ateliers simultanés · " + stage.minutes + " min"));
      }
      stage.blocks.forEach((block, group) => {
        const card = clubTrainingBlockCard(block, index, { details: false, session: trainingSessionForBlock(block, session) });
        if (stage.parallel) card.querySelector(".training-sequence-number").textContent = "Groupe " + (group === 0 ? "A" : "B");
        if (block.assistantSource === "generated")
          card.append(el("p", "hint training-assistant-bible-note", roles.get(block.id) === "cool" ? "Retour au calme proposé par l’assistant : la Bible n’a pas de fiche de ce type." : "Aucun exercice de la Bible ne convient à ce groupe : exercice écrit par l’assistant."));
        if (target === preview) card.append(bibleChooser(block));
        row.append(card);
      });
      target.append(row);
    }
  }
  // « Changer d'exercice » replaces one sequence only, with the same group, space and time.
  function bibleChooser(block) {
    const index = session.blocks.indexOf(block),
      label = el("label", "report-field training-assistant-bible-choice", "Changer d’exercice"),
      select = el("select");
    select.setAttribute("aria-label", "Changer d’exercice · " + block.custom.title);
    select.append(new Option("Garder cet exercice", ""));
    if (bibleNeeds && index >= 0) {
      const role = trainingAssistantBibleRoles(session).get(block.id),
        target = trainingAssistantBibleTarget(block, role, bibleObjectives, bibleNeeds),
        used = new Set(session.blocks.map((b) => b.assistantSourceId).filter(Boolean));
      const allowed = trainingAssistantStageWarnings({ ...session, blocks: generated }, generated[index].id).length;
      let shown = 0;
      // Bounded search keeps the preview responsive on large libraries.
      for (const meta of trainingAssistantBibleCandidates(target, used).slice(0, 60)) {
        if (shown >= 5) break;
        if (!trainingAssistantTryBible(session, index, meta, target, bibleNeeds, allowed, true)) continue;
        select.append(new Option(clubExerciseText(meta.titre) + " · " + meta.effectif_min + "–" + meta.effectif_max + " joueurs · " + meta.duree + " min", meta.id));
        shown++;
      }
      if (block.assistantSource === "bible" && generated[index])
        select.append(new Option("Exercice écrit par l’assistant", "__generated"));
    }
    select.onchange = () => {
      if (select.value) replaceBlock(index, select.value);
    };
    label.append(select);
    // One click: another usable Bible exercise for this sequence, drawn at random
    // among the close fits, so the coach can keep clicking until one suits.
    const another = el("button", "export training-assistant-bible-another", "↻ Autre exercice");
    another.type = "button";
    another.setAttribute("aria-label", "Chercher un autre exercice · " + block.custom.title);
    another.disabled = !bibleNeeds || index < 0;
    // No button where the Bible has no sheet of this kind (cool-down today).
    if (bibleNeeds && index >= 0) {
      const role = trainingAssistantBibleRoles(session).get(block.id);
      another.hidden = !trainingAssistantBibleCandidates(
        trainingAssistantBibleTarget(block, role, bibleObjectives, bibleNeeds),
      ).length;
    }
    another.onclick = () => {
      if (!ready()) return;
      const role = trainingAssistantBibleRoles(session).get(block.id),
        target = trainingAssistantBibleTarget(block, role, bibleObjectives, bibleNeeds),
        used = new Set(session.blocks.map((b) => b.assistantSourceId).filter(Boolean)),
        allowed = trainingAssistantStageWarnings({ ...session, blocks: generated }, generated[index].id).length,
        candidates = trainingAssistantBibleCandidates(target, used);
      if (!candidates.length) return (status.textContent = "Aucun autre exercice de la Bible ne convient à cette séquence.");
      const limit = trainingAssistantBibleScore(candidates[0], target) + 4,
        pool = candidates.filter((m) => trainingAssistantBibleScore(m, target) <= limit),
        rest = candidates.filter((m) => !pool.includes(m));
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const pick = [...pool, ...rest].slice(0, 80).find((meta) =>
        trainingAssistantTryBible(session, index, meta, target, bibleNeeds, allowed, true),
      );
      if (!pick) return (status.textContent = "Aucun autre exercice de la Bible ne convient à cette séquence.");
      replaceBlock(index, pick.id);
    };
    const box = el("div", "training-assistant-bible-tools");
    box.append(another, label);
    return box;
  }
  function replaceBlock(index, choice) {
    if (!ready()) return;
    const original = session.blocks[index];
    if (!original) return;
    try {
      let block;
      if (choice === "__generated") block = structuredClone(generated[index]);
      else {
        const meta = exerciseReferenceIndex.get(choice),
          role = trainingAssistantBibleRoles(session).get(original.id),
          target = trainingAssistantBibleTarget(original, role, bibleObjectives, bibleNeeds),
          built = trainingAssistantBibleBlock(meta, original, target, bibleNeeds);
        block = built.block;
        if (!trainingAssistantAgeOnly(built.warnings))
          throw Error("Cet exercice ne convient pas à ce groupe ou à cet espace. La séance est conservée.");
        if (built.warnings.length) block.assistantWarnings = built.warnings.slice(0, 3);
      }
      block.assistantSource = choice === "__generated" ? "generated" : "bible";
      const blocks = session.blocks.map((b, i) => (i === index ? block : b)),
        next = { ...session, blocks },
        written = { ...session, blocks: generated };
      next.duration = trainingSessionStages(next).at(-1)?.end || session.duration;
      if (
        !trainingValid(next) ||
        trainingAssistantStageWarnings(next, block.id).length >
          trainingAssistantStageWarnings(written, generated[index].id).length
      )
        throw Error("Cet exercice ne tient pas dans cette séquence (place, effectif ou durée). La séance est conservée.");
      session = next;
      paint();
      status.textContent = "Séquence mise à jour.";
    } catch (error) {
      status.textContent = error.message || "Cet exercice ne peut pas être utilisé ici.";
      paint();
    }
  }
  // Assistant-only markers never leave the preview.
  const cleanSession = (s) => ({
    ...s,
    blocks: s.blocks.map(({ assistantSource, assistantSourceId, assistantWarnings, ...b }) => b),
  });
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
    renderStages(preview);
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
        organisation: organisation.value,
        ...(sessionDuration.value === "auto" ? {} : { duration: Number(sessionDuration.value) }),
      });
      bibleObjectives = selectedObjectives();
      bibleNeeds = trainingAssistantNeeds({
        goal: goal.value || "Séance",
        objective: bibleObjectives[0],
        level: level.value,
        players: players.value,
        space: space.value,
      });
      ({ session, generated } = trainingAssistantUseBible(session, bibleNeeds, bibleObjectives));
      owner = context();
      stale = false;
      for (const b of [edit, save, plan, pdf]) b.disabled = false;
      date.value = session.date;
      time.value = session.time;
      schedule.open = true;
      paint();
      controls.hidden = false;
      const fromBible = session.blocks.filter((b) => b.assistantSource === "bible").length;
      status.textContent =
        "Séance prête : " + fromBible + " exercice(s) de la Bible sur " + session.blocks.length + " séquence(s). « Changer d’exercice » propose d’autres fiches.";
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
    let next = structuredClone(cleanSession(session));
    next.libraryOnly = scheduled ? false : session.libraryOnly !== false;
    if (scheduled || next.agendaLink) {
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
    try { if(typeof trainingAgendaPrepareSave==='function')next=trainingAgendaPrepareSave(next); }
    catch(error){status.textContent=error.message;return;}
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
      renderTrainingLibrary();
      renderCoachAgenda();
      document.dispatchEvent(new CustomEvent('training-library-updated'));
      const message = scheduled
        ? "Séance enregistrée dans Mes séances et dans l’agenda."
        : "Séance enregistrée dans Mes séances.";
      if (trainingResetAfterSave()) notify(message);
    } catch (error) {
      status.textContent =
        "Enregistrement impossible : la séance proposée reste disponible. " +
        (error.message || "");
    }
  }
  save.onclick = () => commit(false);
  plan.onclick = () => commit(true);
  edit.onclick = () => {
    if (ready() && workspaceReplaceDraft("training", cleanSession(session))) {
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
      renderStages(print);
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
  function reset() {
    session = null; owner = ""; stale = true; generated = []; bibleNeeds = null;
    form.reset(); goal.value = ""; level.value = activeCoachTeam.category || "";
    preview.replaceChildren(); print.replaceChildren();
    date.value = time.value = ""; schedule.open = false;
    controls.hidden = true; status.textContent = "";
    for (const b of [edit, save, plan, pdf]) b.disabled = true;
    hide(); panel.scrollTop = 0;
  }
  window.trainingAssistantAZ = { open: () => tab.click(), reset };
});
