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
// Order follows the usual educator logic (FFF base, not an absolute rule): warm-up
// without opposition first, then exercises of increasing size, the largest and most
// match-like last before the cool-down.
const trainingAssistantHiddenObjectives = ["ludic-activation", "ludic-motor", "ludic-cool"];
const trainingAssistantPhysicalKinds = {
  speed: { label: "Vitesse", pattern: /vitesse|sprint|d[ée]marrage|r[ée]action|vivacit[ée]|agilit[ée]|explosi/i },
  plyo: { label: "Pliométrie – force", pattern: /pliom|force|renforcement|gainage|explosi/i },
  endurance: { label: "Endurance – intermittent", pattern: /intermittent|endurance|a[ée]robie|30-30|15-15|10-20/i },
};
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
    // Explicit roles (set after generation) win over positions, e.g. a physical block.
    for (const block of stage.blocks) roles.set(block.id, block.assistantRole || role);
  });
  return roles;
}
function trainingAssistantAssignRoles(session) {
  const roles = trainingAssistantBibleRoles(session);
  return { ...session, blocks: session.blocks.map((b) => ({ ...b, assistantRole: roles.get(b.id) })) };
}
// A 10-minute physical block (9 + 1 min setup) for the whole group: after the warm-up
// for speed / plyometrics (fresh legs), before the cool-down for endurance. Its minutes
// come from the final game, so the session keeps the chosen duration.
function trainingAssistantAddPhysical(session, kind, needs) {
  const spec = trainingAssistantPhysicalKinds[kind];
  if (!spec) return session;
  const roles = trainingAssistantBibleRoles(session),
    games = session.blocks.filter((b) => roles.get(b.id) === "game");
  if (!games.length || games.some((b) => b.duration - 10 < 12 || (b.recoveryMinutes || 0) >= b.duration - 10))
    throw Error("Séance trop courte pour ajouter un travail physique : choisissez une durée plus longue.");
  const cool = session.blocks.find((b) => roles.get(b.id) === "cool") || session.blocks.at(-1),
    block = structuredClone(cool);
  block.id = crypto.randomUUID();
  delete block.parallelId;
  delete block.workshopPlayers;
  delete block.workshopKeepers;
  delete block.clubObjective;
  Object.assign(block, { duration: 9, setupMinutes: 1, recoveryMinutes: 2, assistantRole: "physical", assistantPhysical: kind });
  Object.assign(block.custom, {
    title: "Travail physique · " + spec.label,
    goal: "Développer la qualité physique choisie (" + spec.label.toLowerCase() + ") avec le ballon dès que possible.",
    instructions:
      "1 minute d’installation, puis 7 minutes de travail en séries courtes avec récupération active, 2 minutes de récupération finale. Qualité d’exécution avant la quantité ; arrêter un joueur dont la technique se dégrade.",
    success: "Les efforts restent rapides et propres jusqu’à la dernière série.",
    kind: "circuit",
    width: Math.max(6, Math.min(needs.bounds[0] - 2, 30)),
    length: Math.max(6, Math.min(needs.bounds[1] - 2, 20)),
  });
  block.custom.adaptation = {
    ...block.custom.adaptation,
    players: needs.total,
    keepers: needs.keepers,
    groups: [{ players: needs.total, keepers: needs.keepers }],
  };
  // The written final game is re-timed too, so its text matches its shorter slot.
  const retime = (b) => {
    const duration = b.duration - 10,
      setup = b.setupMinutes || 0,
      total = duration + setup,
      custom = { ...b.custom };
    custom.instructions = custom.instructions.replace(
      /\d+ minutes d’installation, puis \d+ minutes de jeu en séries d’environ (\d+) minutes avec récupération entre les séries : \d+ minutes au total\./,
      (_, length) =>
        setup + " minutes d’installation, puis " + duration + " minutes de jeu en séries d’environ " + length +
        " minutes avec récupération entre les séries : " + total + " minutes au total.",
    );
    return {
      ...b,
      duration,
      custom,
      notes: String(b.notes || "").replace(/Temps du bloc : \d+ min/, "Temps du bloc : " + total + " min"),
    };
  };
  const blocks = session.blocks.map((b) => (roles.get(b.id) === "game" ? retime(b) : b));
  const at =
    kind === "endurance"
      ? blocks.findIndex((b) => roles.get(b.id) === "cool")
      : blocks.findIndex((b) => roles.get(b.id) !== "activation");
  blocks.splice(at < 0 ? blocks.length : at, 0, block);
  const next = { ...session, blocks };
  next.duration = trainingSessionStages(next).at(-1)?.end || session.duration;
  if (!trainingValid(next)) throw Error("Le travail physique ne peut pas être ajouté à cette séance.");
  return next;
}
function trainingAssistantBibleTarget(block, role, objectives, needs) {
  const players = block.workshopPlayers ?? needs.total,
    target = {
      activation: { objectives: ["ludic-activation"], phases: ["activation"], warmup: true },
      workshop: {
        objectives: [block.clubObjective].filter(Boolean),
        phases: ["situation", "jeu", "opposition"],
        // Workshops aim at smaller / medium formats than the final game.
        sizeRef: Math.max(6, Math.round(players * 0.6)),
      },
      game: { objectives: [...objectives], phases: ["jeu", "opposition"], sizeRef: players, large: true },
      cool: { objectives: ["ludic-cool"], phases: [] },
      physical: {
        objectives: ["ludic-motor"],
        phases: [],
        physical: trainingAssistantPhysicalKinds[block.assistantPhysical]?.pattern || /./,
      },
    }[role] || { objectives: [...objectives], phases: [] };
  if (role === "workshop" && !target.objectives.length) target.objectives = [...objectives];
  return {
    ...target,
    players,
    keepers: block.workshopKeepers ?? needs.keepers,
    bounds: block.parallelId
      ? [Math.floor((needs.bounds[0] - 3) / 2), needs.bounds[1]]
      : [...needs.bounds],
    age: needs.age || 0,
  };
}
// Warm-up is opposition-free: circuits, ball work, coordination. Toros, rondos and
// duels go to the next stages (they are small formats, so they come first there).
function trainingAssistantOppositionFree(meta, exercise) {
  const text = String(meta.titre || "") + " " + String(exercise?.sub || "");
  return !/\bcontre\b|toro|rondo|duel|opposition|\bmatch\b/i.test(text) && !["jeu", "opposition"].includes(meta.phase);
}
function trainingAssistantWarmupPenalty(meta) {
  const title = String(meta.titre || "");
  if (/athl[ée]ti|physique|sprint|vitesse/i.test(title)) return 4;
  return meta.source === "games" ? 6 : 0;
}
// Size of an exercise for the progression: reference headcount, then surface.
function trainingAssistantSize(meta) {
  const dims = meta?.dimensions || [0, 0];
  return (meta?.effectif_reference || 0) + ((dims[0] || 0) * (dims[1] || 0)) / 100000;
}
function trainingAssistantBibleScore(meta, target) {
  // A warm-up circuit for 12 is run in several identical groups for a larger squad.
  const players = target.players,
    outside =
      players < meta.effectif_min
        ? meta.effectif_min - players
        : players > meta.effectif_max && !target.warmup && !target.physical
          ? players - meta.effectif_max
          : 0,
    dims = [...meta.dimensions].sort((a, b) => a - b),
    room = [...target.bounds].sort((a, b) => a - b),
    overflow =
      Math.max(0, dims[0] - room[0]) + Math.max(0, (dims[1] || 0) - room[1]),
    refAge = Number(
      String(meta.niveau_reference || "").match(/U(\d+)/i)?.[1] ||
        (/senior/i.test(meta.niveau_reference) ? 18 : 0),
    ),
    // The final game prefers a large, match-like surface.
    filled = Math.min(1, ((dims[0] || 0) * (dims[1] || 0)) / Math.max(1, room[0] * room[1]));
  return (
    outside * 3 +
    (target.warmup || target.physical ? 0 : Math.abs((target.sizeRef ?? players) - meta.effectif_reference) / 4) +
    Math.ceil(overflow / 10) * 4 +
    (target.age && refAge ? Math.floor(Math.abs(target.age - refAge) / 2) : 0) +
    (target.phases.length && !target.phases.includes(meta.phase) ? 3 : 0) +
    (target.warmup ? trainingAssistantWarmupPenalty(meta) : 0) +
    (target.large ? (1 - filled) * 3 : 0)
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
    // Replacements keep the progression: size between the neighbouring stages.
    const size = trainingAssistantSize(meta);
    if ((target.minSize !== undefined && size < target.minSize) || (target.maxSize !== undefined && size > target.maxSize))
      continue;
    const exercise = exerciseReferenceIndex.resolve(meta.id);
    if (!exercise) continue;
    if (!target.objectives.includes(clubExerciseClassification(exercise).objective))
      continue;
    if (target.warmup && !trainingAssistantOppositionFree(meta, exercise)) continue;
    if (target.physical && !target.physical.test(String(meta.titre || "") + " " + String(exercise.sub || ""))) continue;
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
    "assistantRole",
    "assistantPhysical",
  ])
    if (original[key] !== undefined) block[key] = original[key];
  // The slot keeps its identity (id, role) whatever exercise fills it.
  block.id = original.id;
  block.assistantMetaId = meta.id;
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
function trainingAssistantShuffle(list, random) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}
// Middle stages (workshops and final game) in session order, with their exercise size
// (largest Bible sheet of the stage; null when a written block is part of it).
function trainingAssistantProgressStages(session) {
  const roles = trainingAssistantBibleRoles(session);
  return trainingSessionStages(session)
    .filter((stage) => stage.blocks.every((b) => ["workshop", "game"].includes(roles.get(b.id))))
    .map((stage) => ({
      stage,
      size: stage.blocks.every((b) => b.assistantMetaId)
        ? Math.max(...stage.blocks.map((b) => trainingAssistantSize(exerciseReferenceIndex.get(b.assistantMetaId))))
        : null,
    }));
}
// Size window for replacing blockId: between the previous and next sized stages.
function trainingAssistantSizeWindow(session, blockId) {
  const list = trainingAssistantProgressStages(session),
    at = list.findIndex((x) => x.stage.blocks.some((b) => b.id === blockId));
  if (at < 0) return {};
  const before = list.slice(0, at).reverse().find((x) => x.size !== null),
    after = list.slice(at + 1).find((x) => x.size !== null);
  return {
    ...(before ? { minSize: before.size } : {}),
    ...(after ? { maxSize: after.size } : {}),
  };
}
function trainingAssistantUseBible(session, needs, objectives, random = Math.random) {
  if (!session.blocks.some((b) => b.assistantRole)) session = trainingAssistantAssignRoles(session);
  const generated = session.blocks.map((b) => structuredClone(b));
  if (!window.exerciseReferenceIndex) return { session, generated };
  const roles = trainingAssistantBibleRoles(session),
    baseline = new Map(
      session.blocks.map((b) => [b.id, trainingAssistantStageWarnings(session, b.id).length]),
    ),
    used = new Set();
  let next = structuredClone(session);
  next.blocks.forEach((b) => (b.assistantSource = "generated"));
  for (let index = 0; index < next.blocks.length; index++) {
    const original = next.blocks[index],
      target = trainingAssistantBibleTarget(original, roles.get(original.id), objectives, needs);
    // Workshops may fall back to small playful formats (toros, reduced games).
    const targets = roles.get(original.id) === "workshop"
      ? [target, { ...target, objectives: ["ludic-situation"] }]
      : [target];
    search: for (const goal of targets) {
      let candidates = trainingAssistantBibleCandidates(goal, used);
      // Warm-up varies from one session to the next: random order among every fit
      // scoring close to the best; the rest keeps its ranking as fallback.
      if ((goal.warmup || goal.physical) && candidates.length) {
        const limit = trainingAssistantBibleScore(candidates[0], goal) + 2;
        let size = 0;
        while (size < candidates.length && trainingAssistantBibleScore(candidates[size], goal) <= limit) size++;
        candidates = [...trainingAssistantShuffle(candidates.slice(0, size), random), ...candidates.slice(size)];
      }
      // First an exercise needing no adaptation warning; otherwise the closest one
      // whose only warning is the age band, kept visible on its card.
      for (const tolerant of [false, true])
        for (const meta of candidates) {
          const candidate = trainingAssistantTryBible(next, index, meta, goal, needs, baseline.get(original.id) || 0, tolerant);
          if (!candidate) continue;
          next = candidate;
          used.add(meta.source_id);
          break search;
        }
    }
  }
  next = trainingAssistantOrderBySize(next, needs, objectives, baseline);
  next.duration = trainingSessionStages(next).at(-1)?.end || next.duration;
  return trainingValid(next) ? { session: next, generated } : { session, generated };
}
// Exercises of the workshop / game stages are moved into the existing time slots by
// increasing size (the largest, closest to the match, last). Each sheet is re-adapted
// to its new slot; if one does not fit, the order chosen at selection is kept.
function trainingAssistantOrderBySize(session, needs, objectives, baseline) {
  const list = trainingAssistantProgressStages(session),
    slots = list.filter((x) => x.size !== null);
  if (slots.length < 2) return session;
  const contents = [...slots].sort((a, b) => a.size - b.size);
  if (contents.every((c, i) => c === slots[i])) return session;
  const roles = trainingAssistantBibleRoles(session);
  let next = structuredClone(session);
  for (const [i, slot] of slots.entries()) {
    const content = contents[i];
    if (content === slot) continue;
    for (const [group, slotBlock] of slot.stage.blocks.entries()) {
      const source = content.stage.blocks[group] || content.stage.blocks[0],
        meta = exerciseReferenceIndex.get(source.assistantMetaId),
        index = next.blocks.findIndex((b) => b.id === slotBlock.id),
        target = trainingAssistantBibleTarget(next.blocks[index], roles.get(slotBlock.id), objectives, needs),
        candidate = trainingAssistantTryBible(next, index, meta, target, needs, baseline.get(slotBlock.id) || 0, true);
      if (!candidate) return session;
      // The moved sheet keeps the objective it was chosen for.
      if (source.clubObjective) candidate.blocks[index].clubObjective = source.clubObjective;
      else delete candidate.blocks[index].clubObjective;
      next = candidate;
    }
  }
  return next;
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
    // Warm-up and cool-down are in every session; physical work is a separate option.
    for (const [key, sub] of Object.entries(bmfSubcategories).filter(
      ([k, v]) => v.axis === axis && !trainingAssistantHiddenObjectives.includes(k),
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
  const physical = field("Travail physique (facultatif)", el("select"));
  physical.id = "training-assistant-physical";
  physical.append(
    new Option("Aucun", "none"),
    new Option("Vitesse", "speed"),
    new Option("Pliométrie – force", "plyo"),
    new Option("Endurance – intermittent", "endurance"),
  );
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
  const advice = el(
    "p",
    "training-assistant-advice",
    "L’assistant propose une base de séance. Elle doit être adaptée à votre groupe : changez, modifiez, ajoutez ou retirez des exercices avant de l’utiliser.",
  );
  panel.append(heading, advice, form, status, preview, controls);
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
    seenBySlot = new Map(),
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
  // Target of a slot for list / « Autre exercice »: same role, group and space, and a
  // size between its neighbours so the progression (largest last) is kept.
  function slotTarget(block) {
    const role = trainingAssistantBibleRoles(session).get(block.id),
      target = trainingAssistantBibleTarget(block, role, bibleObjectives, bibleNeeds);
    return ["workshop", "game"].includes(role)
      ? { ...target, ...trainingAssistantSizeWindow(session, block.id) }
      : target;
  }
  function slotAllowed(index) {
    return trainingAssistantStageWarnings({ ...session, blocks: generated }, generated[index].id).length;
  }
  function usableAlternatives(block, index, extraExclude = new Set()) {
    const used = new Set([...session.blocks.map((b) => b.assistantSourceId).filter(Boolean), ...extraExclude]),
      target = slotTarget(block),
      allowed = slotAllowed(index),
      targets = trainingAssistantBibleRoles(session).get(block.id) === "workshop"
        ? [target, { ...target, objectives: ["ludic-situation"] }]
        : [target];
    return { target, allowed, lists: targets.map((t) => ({ target: t, candidates: trainingAssistantBibleCandidates(t, used) })) };
  }
  // Under each sequence: another Bible exercise, edit it, or create one's own here;
  // the full list stays available in a collapsed « Choisir dans une liste ».
  function bibleChooser(block) {
    const index = session.blocks.indexOf(block),
      box = el("div", "training-assistant-bible-tools"),
      row = el("div", "training-assistant-bible-actions");
    const another = el("button", "export training-assistant-bible-another", "↻ Autre exercice"),
      modify = el("button", "export training-assistant-bible-edit", "✎ Modifier cet exercice"),
      own = el("button", "export training-assistant-bible-own", "＋ Créer mon exercice ici");
    for (const b of [another, modify, own]) b.type = "button";
    another.setAttribute("aria-label", "Chercher un autre exercice · " + block.custom.title);
    modify.setAttribute("aria-label", "Modifier cet exercice dans l’éditeur · " + block.custom.title);
    own.setAttribute("aria-label", "Créer mon exercice à la place de · " + block.custom.title);
    modify.onclick = () => openInEditor(block.id, false);
    own.onclick = () => openInEditor(block.id, true);
    row.append(another, modify, own);
    box.append(row);
    if (!bibleNeeds || index < 0) {
      another.hidden = true;
      return box;
    }
    const probe = usableAlternatives(block, index);
    another.hidden = !probe.lists.some((l) => l.candidates.length);
    another.onclick = () => {
      if (!ready()) return;
      // No back-and-forth: sheets already shown for this slot are skipped until all
      // compatible ones have been proposed.
      const seen = seenBySlot.get(block.id) || new Set();
      if (block.assistantSourceId) seen.add(block.assistantSourceId);
      seenBySlot.set(block.id, seen);
      const pick = (exclude) => {
        const { allowed, lists } = usableAlternatives(block, index, exclude);
        for (const { target, candidates } of lists) {
          // Whole unseen pool, so history is only reset when every usable sheet was shown.
          const pool = trainingAssistantShuffle([...candidates], Math.random);
          const meta = pool.find((m) => trainingAssistantTryBible(session, index, m, target, bibleNeeds, allowed, true));
          if (meta) return meta;
        }
        return null;
      };
      let meta = pick(seen), restarted = false;
      if (!meta && seen.size) {
        seen.clear();
        if (block.assistantSourceId) seen.add(block.assistantSourceId);
        meta = pick(seen);
        restarted = true;
      }
      if (!meta) return (status.textContent = "Aucun autre exercice de la Bible ne convient à cette séquence.");
      replaceBlock(index, meta.id);
      if (restarted) status.textContent = "Toutes les fiches compatibles ont été proposées ; on recommence.";
    };
    const details = el("details", "training-assistant-bible-list"),
      label = el("label", "report-field training-assistant-bible-choice", "Changer d’exercice"),
      select = el("select");
    details.append(el("summary", "", "Choisir dans une liste"));
    select.setAttribute("aria-label", "Changer d’exercice · " + block.custom.title);
    select.append(new Option("Garder cet exercice", ""));
    let shown = 0;
    // Bounded search keeps the preview responsive on large libraries.
    for (const { target, candidates } of probe.lists)
      for (const meta of candidates.slice(0, 60)) {
        if (shown >= 8) break;
        if (!trainingAssistantTryBible(session, index, meta, target, bibleNeeds, probe.allowed, true)) continue;
        select.append(new Option(clubExerciseText(meta.titre) + " · " + meta.effectif_min + "–" + meta.effectif_max + " joueurs · " + meta.duree + " min", meta.id));
        shown++;
      }
    if (block.assistantSource === "bible" && generated[index])
      select.append(new Option("Exercice écrit par l’assistant", "__generated"));
    select.onchange = () => {
      if (select.value) replaceBlock(index, select.value);
    };
    label.append(select);
    details.append(label);
    if (select.options.length > 1) box.append(details);
    return box;
  }
  // « Modifier » / « Créer mon exercice ici »: the session goes to the editor (as with
  // « Ajuster dans l’éditeur »), then the exercise dialog opens on that same block.
  function openInEditor(blockId, fresh) {
    if (!ready() || !workspaceReplaceDraft("training", cleanSession(session))) return;
    stale = true;
    for (const b of [edit, save, plan, pdf]) b.disabled = true;
    status.textContent = "Séance envoyée dans l’éditeur : ajustez cet exercice, puis le reste de la séance.";
    hide();
    trainingWizard.go(3);
    const block = currentTraining.blocks.find((b) => b.id === blockId);
    if (!block) return;
    if (!fresh) return openCustomTrainingExercise(block);
    trainingCustomFreshId = block.id;
    openCustomTrainingExercise({
      id: block.id,
      duration: block.duration,
      custom: { title: "", goal: "", organisation: "", instructions: "", material: "", success: "", kind: "game", width: block.custom.width, length: block.custom.length },
    });
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
      // Every sheet shown in this slot (list or button) joins its history.
      if (block.assistantSourceId) {
        const seen = seenBySlot.get(block.id) || new Set();
        seen.add(block.assistantSourceId);
        seenBySlot.set(block.id, seen);
      }
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
    blocks: s.blocks.map(({ assistantSource, assistantSourceId, assistantWarnings, assistantRole, assistantPhysical, assistantMetaId, ...b }) => b),
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
      session = trainingAssistantAssignRoles(session);
      if (physical.value !== "none") session = trainingAssistantAddPhysical(session, physical.value, bibleNeeds);
      ({ session, generated } = trainingAssistantUseBible(session, bibleNeeds, bibleObjectives));
      seenBySlot = new Map();
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
        "Proposition prête (" + fromBible + " exercice(s) de la Bible sur " + session.blocks.length + " séquence(s)). C’est une base à adapter : changez, modifiez, ajoutez ou retirez des exercices.";
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
