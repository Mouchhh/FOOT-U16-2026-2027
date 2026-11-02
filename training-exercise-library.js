// Reuse actual work and keep explicitly created exercises available independently of the open session.
// One atomic record holds independent creations and deleted list references.
// Legacy arrays remain readable. Session documents are never rewritten here.
function trainingPersonalExerciseStore() {
  const raw = coachStorageGet("vestiaire-personal-exercises");
  const value = raw ? JSON.parse(raw) : [];
  if (Array.isArray(value)) return { version: 1, entries: value, deleted: [] };
  if (
    !value ||
    value.version !== 1 ||
    !Array.isArray(value.entries) ||
    !Array.isArray(value.deleted) ||
    value.deleted.length > 10000 ||
    !value.deleted.every((k) => typeof k === "string" && k.length <= 180)
  )
    throw Error("Bibliothèque personnelle illisible");
  return value;
}
function trainingPersonalExerciseSignature(block) {
  return JSON.stringify([
    block.custom,
    block.duration,
    block.setupMinutes || 0,
    block.recoveryMinutes ?? null,
    block.notes,
  ]);
}
function trainingPersonalExerciseKey(block) {
  const text = trainingPersonalExerciseSignature(block);
  let a = 2166136261,
    b = 3339675911;
  for (let i = 0; i < text.length; i++) {
    a = Math.imul(a ^ text.charCodeAt(i), 16777619);
    b = Math.imul(b ^ text.charCodeAt(i), 2246822519);
  }
  return (
    block.id +
    ":" +
    text.length +
    ":" +
    (a >>> 0).toString(16) +
    ":" +
    (b >>> 0).toString(16)
  );
}
function trainingStoredPersonalExercises() {
  try {
    const records = trainingPersonalExerciseStore().entries;
    return records.filter(
      (r) =>
        r &&
        trainingText(r.label, 200) &&
        r.source &&
        Number.isInteger(r.source.players) &&
        r.source.players >= 2 &&
        r.source.players <= 80 &&
        Number.isInteger(r.source.keepers) &&
        r.source.keepers >= 0 &&
        r.source.keepers <= 12 &&
        r.block?.exerciseId === "custom" &&
        trainingValid({ ...newTraining(), blocks: [r.block] }),
    );
  } catch {
    return [];
  }
}
function trainingKeepPersonalExercise(block) {
  try {
    const store = trainingPersonalExerciseStore(),
      entries = trainingStoredPersonalExercises().filter(
        (r) => r.block.id !== block.id,
      );
    if (entries.length >= 200) {
      notify(
        "Exercice conservé dans le brouillon. Bibliothèque personnelle pleine : enregistrez sa séance pour le retrouver.",
      );
      return false;
    }
    entries.unshift({
      block: structuredClone(block),
      source: {
        players: block.workshopPlayers ?? currentTraining.players,
        keepers: block.workshopKeepers ?? currentTraining.keepers,
      },
      label: "Mon exercice · " + activeCoach.name,
    });
    coachStorageSet(
      "vestiaire-personal-exercises",
      JSON.stringify({
        ...store,
        entries,
        deleted: store.deleted.filter(
          (k) => k !== trainingPersonalExerciseKey(block),
        ),
      }),
    );
    return true;
  } catch {
    notify(
      "Exercice conservé dans le brouillon ; sa copie indépendante n’a pas pu être enregistrée.",
    );
    return false;
  }
}
function trainingDeletePersonalExercise(entry, owner) {
  if (activeCoach.id !== owner) return false;
  try {
    const store = trainingPersonalExerciseStore(),
      signature = trainingPersonalExerciseSignature(entry.block);
    const blocks = [
      ...currentTraining.blocks,
      ...trainingLibrary.flatMap((s) => s.blocks),
      ...store.entries.map((r) => r?.block).filter(Boolean),
    ];
    const matching = blocks.filter(
      (b) =>
        b.exerciseId === "custom" &&
        trainingPersonalExerciseSignature(b) === signature,
    );
    if (!matching.some((b) => b.id === entry.block.id)) {
      notify("Cet exercice a changé. Fermez puis rouvrez vos exercices.");
      return false;
    }
    const deleted = [
      ...new Set([
        ...store.deleted,
        ...matching.map(trainingPersonalExerciseKey),
      ]),
    ];
    if (deleted.length > 10000) throw Error("Bibliothèque pleine");
    const entries = store.entries.filter(
      (r) =>
        !r?.block || trainingPersonalExerciseSignature(r.block) !== signature,
    );
    coachStorageSet(
      "vestiaire-personal-exercises",
      JSON.stringify({ version: 1, entries, deleted }),
    );
    return true;
  } catch {
    notify("Suppression non enregistrée. Votre exercice est conservé.");
    return false;
  }
}
function trainingPersonalExercises() {
  const entries = [],
    seen = new Set();
  let deleted;
  try {
    deleted = new Set(trainingPersonalExerciseStore().deleted);
  } catch {
    return [];
  }
  const sources = [
    { session: currentTraining, draft: true },
    ...trainingLibrary.map((session) => ({ session, draft: false })),
  ];
  for (const { session, draft } of sources)
    for (const block of session.blocks) {
      if (
        block.exerciseId !== "custom" ||
        !trainingCustomValid(block.custom) ||
        deleted.has(trainingPersonalExerciseKey(block))
      )
        continue;
      const signature = JSON.stringify([
        block.custom,
        block.duration,
        block.setupMinutes || 0,
        block.recoveryMinutes ?? null,
        block.notes,
      ]);
      if (seen.has(signature)) continue;
      seen.add(signature);
      entries.push({
        sessionId: session.id,
        block: structuredClone(block),
        draft,
        source: {
          players: block.workshopPlayers ?? session.players,
          keepers: block.workshopKeepers ?? session.keepers,
        },
        label: draft
          ? "Brouillon ouvert sur cet appareil"
          : (session.title || session.team) + " · " + session.date,
      });
    }
  for (const record of trainingStoredPersonalExercises()) {
    const b = record.block;
    if (deleted.has(trainingPersonalExerciseKey(b))) continue;
    const signature = JSON.stringify([
      b.custom,
      b.duration,
      b.setupMinutes || 0,
      b.recoveryMinutes ?? null,
      b.notes,
    ]);
    if (seen.has(signature)) continue;
    seen.add(signature);
    entries.push({ ...structuredClone(record), draft: false, sessionId: null });
  }
  return entries;
}
function trainingOpenPersonalExercises() {
  if ($("training-personal-library")?.open) return;
  if (!applyTrainingForm()) return;
  const sessionId = currentTraining.id,
    coachId = activeCoach.id,
    dialog = el("dialog", "completion-dialog");
  dialog.id = "training-personal-library";
  dialog.setAttribute("aria-label", "Mes exercices personnels");
  const head = el("div", "section-heading"),
    close = el("button", "export", "Fermer");
  close.type = "button";
  close.onclick = () => dialog.close();
  head.append(el("h2", "", "Mes exercices personnels"), close);
  dialog.append(
    head,
    el(
      "p",
      "hint",
      "Exercices issus de vos séances enregistrées et de votre préparation ouverte. Chaque ajout crée une copie indépendante. Les créations sont conservées sur cet appareil. Pour les partager au club ou les retrouver sur un autre appareil, enregistrez une séance qui les contient.",
    ),
  );
  const label = el("label", "report-field", "Chercher un exercice personnel"),
    search = el("input");
  search.type = "search";
  search.maxLength = 150;
  label.append(search);
  const list = el("div"),
    status = el("p", "hint");
  status.setAttribute("role", "status");
  dialog.append(label, list, status);
  const normal = (s) =>
    s
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("fr");
  function render() {
    const entries = trainingPersonalExercises();
    list.replaceChildren();
    const query = normal(search.value.trim());
    const filtered = entries.filter((e) =>
      normal(
        [e.block.custom.title, e.block.custom.goal, e.label].join(" "),
      ).includes(query),
    );
    status.textContent = filtered.length + " exercice(s)";
    if (!filtered.length)
      list.append(
        el(
          "p",
          "",
          "Aucun exercice personnel trouvé. Créez votre exercice puis enregistrez sa séance pour le réutiliser.",
        ),
      );
    for (const entry of filtered) {
      const row = el("section", "report-panel"),
        copy = el("button", "primary", "Ajouter une copie");
      copy.type = "button";
      row.append(
        el("h3", "", entry.block.custom.title),
        el("p", "hint", entry.label),
        el("p", "", entry.block.custom.goal),
        el(
          "p",
          "hint",
          entry.block.custom.width +
            " × " +
            entry.block.custom.length +
            " m · " +
            entry.block.duration +
            " min · " +
            (entry.block.custom.board?.frames.length || 0) +
            " image(s) d’animation",
        ),
        copy,
      );
      const adapt = el("button", "export", "Adapter à ma séance");
      adapt.type = "button";
      adapt.onclick = () =>
        trainingReuseExercise(entry.block, entry.source, entry.label);
      row.append(adapt);
      const remove = el("button", "personal-exercise-delete", "");
      remove.type = "button";
      remove.setAttribute(
        "aria-label",
        "Supprimer " + entry.block.custom.title,
      );
      remove.title = "Supprimer de Mes exercices";
      remove.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/></svg><span>Supprimer</span>';
      remove.onclick = () => {
        if (activeCoach.id !== coachId || currentTraining.id !== sessionId) {
          status.textContent =
            "Le coach ou la séance a changé. Fermez puis rouvrez vos exercices.";
          return;
        }
        if (
          !confirm(
            "Supprimer « " +
              entry.block.custom.title +
              " » de Mes exercices ? Cette suppression est définitive dans cette liste. Les copies déjà intégrées aux séances sont conservées.",
          )
        )
          return;
        if (trainingDeletePersonalExercise(entry, coachId)) {
          render();
          status.textContent = "Exercice supprimé de Mes exercices.";
          search.focus({ preventScroll: true });
        }
      };
      row.append(remove);
      copy.onclick = () => {
        if (activeCoach.id !== coachId || currentTraining.id !== sessionId) {
          status.textContent =
            "La séance ou le coach a changé. Fermez puis rouvrez vos exercices.";
          return;
        }
        if (currentTraining.blocks.length >= 20) {
          status.textContent =
            "20 blocs maximum : retirez un exercice avant de poursuivre.";
          return;
        }
        const b = structuredClone(entry.block);
        b.id = crypto.randomUUID();
        if (!trainingCommitBlocks((blocks) => blocks.push(b))) {
          status.textContent =
            "Copie non ajoutée : le déroulé précédent est conservé.";
          return;
        }
        dialog.close();
        trainingWizard.go(3);
        notify(
          "Copie indépendante ajoutée. Vérifiez l’effectif, les dimensions et les rotations pour cette séance.",
        );
      };
      list.append(row);
    }
  }
  search.oninput = render;
  render();
  document.body.append(dialog);
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  dialog.showModal();
  search.focus();
}
document.addEventListener("DOMContentLoaded", () => {
  $("custom-training-form").addEventListener("submit", () => {
    if ($("custom-training-dialog").open) return;
    const block = trainingCustomEditing
      ? currentTraining.blocks.find((b) => b.id === trainingCustomEditing)
      : currentTraining.blocks.at(-1);
    if (block?.exerciseId === "custom") trainingKeepPersonalExercise(block);
  });
  const button = el("button", "export", "Mes exercices");
  button.id = "training-personal-exercises";
  button.type = "button";
  button.onclick = trainingOpenPersonalExercises;
  $("training-custom-add").after(button);
  const clear = clubNetworkClear;
  clubNetworkClear = function () {
    $("training-personal-library")?.close();
    $("custom-training-dialog")?.close();
    clear();
  };
});
