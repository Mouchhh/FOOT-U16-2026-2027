// Frozen per-page team context: delayed writes and pagehide cannot target another team.
const coachTeamBaseKey = coachStorageKey;
const coachTeamManifestKey = coachTeamBaseKey("vestiaire-teams");
const coachTeamSelectionKey = coachTeamBaseKey("vestiaire-active-team");
const coachTeamSharedKeys = new Set([
  "vestiaire-coach-account",
  "vestiaire-personal-exercises",
  "vestiaire-personal-canva",
]);
const coachTeamWorkspaceKeys = new Set([
  "vestiaire-draft",
  "vestiaire-gameplan-draft",
  "vestiaire-report-draft",
  "vestiaire-training-draft",
  "vestiaire-simple",
  "vestiaire-simple-library",
  "vestiaire-terrain-mode",
  "vestiaire-landscape",
  "vestiaire-navigation",
  "vestiaire-recovery",
  "vestiaire-document-versions",
  "vestiaire-fff-calendar",
  "vestiaire-pasted-fixtures",
  "vestiaire-agenda-event-edits",
  "vestiaire-agenda-removed-matches",
  "vestiaire-agenda-week-template",
  "vestiaire-coach-reminders",
  "vestiaire-last-canva-presentation",
]);
function coachTeamNormalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
function coachTeamCategoryId(category) {
  let hash = 2166136261;
  for (const char of coachTeamNormalize(category))
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return "category-" + (hash >>> 0).toString(36);
}
function coachTeamValid(team) {
  return (
    team &&
    typeof team.id === "string" &&
    /^(unassigned|category-[a-z0-9]+|team-[a-z0-9-]{1,80})$/.test(team.id) &&
    typeof team.label === "string" &&
    team.label.trim().length > 0 &&
    team.label.length <= 60 &&
    typeof team.category === "string" &&
    team.category.length <= 30 &&
    typeof team.team === "string" &&
    team.team.length <= 50
  );
}
function coachTeamFromCategory(category, team = "") {
  category = String(category || "")
    .trim()
    .slice(0, 30);
  return category
    ? {
        id: coachTeamCategoryId(category),
        label: category,
        category,
        team: String(team || "").slice(0, 50),
      }
    : { id: "unassigned", label: "À classer", category: "", team: "" };
}
function coachTeamDescriptor(payload) {
  if (coachTeamValid(payload?.teamContext)) return payload.teamContext;
  return coachTeamFromCategory(
    payload?.info?.category ?? payload?.category,
    payload?.info?.team ?? payload?.team,
  );
}
let coachTeams = [];
try {
  const saved = JSON.parse(localStorage.getItem(coachTeamManifestKey) || "[]");
  if (
    Array.isArray(saved) &&
    saved.length <= 100 &&
    saved.every(coachTeamValid)
  )
    coachTeams = saved;
} catch {}
// Deleted teams stay deleted: old documents or club calendars never bring them back.
const coachTeamRemovedKey = coachTeamBaseKey("vestiaire-removed-teams");
let coachTeamRemoved = new Set();
try {
  const removed = JSON.parse(localStorage.getItem(coachTeamRemovedKey) || "[]");
  if (Array.isArray(removed)) coachTeamRemoved = new Set(removed.filter((id) => typeof id === "string" && id !== "unassigned").slice(0, 500));
} catch {}
coachTeams = coachTeams.filter((t) => !coachTeamRemoved.has(t.id));
function coachTeamDiscover(team, persist = false) {
  if (
    !coachTeamValid(team) ||
    coachTeamRemoved.has(team.id) ||
    coachTeams.some((t) => t.id === team.id) ||
    coachTeams.length >= 100
  )
    return;
  coachTeams.push({ ...team });
  if (persist) {
    try {
      const stored = JSON.parse(
        localStorage.getItem(coachTeamManifestKey) || "[]",
      );
      const merged = new Map(
        [
          ...coachTeams,
          ...(Array.isArray(stored) ? stored.filter(coachTeamValid) : []),
        ].map((t) => [t.id, t]),
      );
      if (merged.size <= 100) {
        coachTeams = [...merged.values()];
        localStorage.setItem(coachTeamManifestKey, JSON.stringify(coachTeams));
      }
    } catch {
      /* Documents still contain their team metadata. */
    }
    coachTeamsRefreshSelector();
  }
}
coachTeamDiscover(coachTeamFromCategory(""));
// Discover only this coach's historical documents; never infer another educator's teams.
for (const key of coachLibraryKeys) {
  try {
    const rows = JSON.parse(
      localStorage.getItem(coachTeamBaseKey(key)) || "[]",
    );
    if (Array.isArray(rows))
      for (const row of rows)
        coachTeamDiscover(
          coachTeamDescriptor(key === "vestiaire-saves" ? row.state : row),
        );
  } catch {}
}
// Recover configured contexts from their local documents even if the small team index was lost.
try {
  for (const key of coachLibraryKeys) {
    const prefix = coachTeamBaseKey(key) + ":team:";
    for (let n = 0; n < localStorage.length; n++) {
      const storedKey = localStorage.key(n);
      if (!storedKey?.startsWith(prefix)) continue;
      try {
        const rows = JSON.parse(localStorage.getItem(storedKey));
        if (Array.isArray(rows))
          for (const row of rows)
            coachTeamDiscover(
              coachTeamDescriptor(key === "vestiaire-saves" ? row.state : row),
            );
      } catch {}
    }
  }
} catch {
  /* The app remains usable when local storage is unavailable. */
}
for (const key of [
  "vestiaire-draft",
  "vestiaire-training-draft",
  "vestiaire-report-draft",
]) {
  try {
    const draft = JSON.parse(
      localStorage.getItem(coachTeamBaseKey(key)) || "null",
    );
    if (draft) coachTeamDiscover(coachTeamDescriptor(draft));
  } catch {}
}
for (const schedule of clubFixtureSchedules)
  if (
    coachTeamNormalize(schedule.ownerCoachName) ===
    coachTeamNormalize(activeCoach.name)
  )
    coachTeamDiscover(coachTeamFromCategory(schedule.category, schedule.team));
let coachTeamSelected = "";
try {
  coachTeamSelected = sessionStorage.getItem(coachTeamSelectionKey) || "";
} catch {}
const activeCoachTeam = Object.freeze({
  ...(coachTeams.find((t) => t.id === coachTeamSelected) ||
    coachTeams.find((t) => t.id !== "unassigned") ||
    coachTeams[0]),
});
// Remember the resolved team before server discovery adds other teams to the index.
// Reloading must never silently select a newly discovered team.
try {
  sessionStorage.setItem(coachTeamSelectionKey, activeCoachTeam.id);
} catch {}
function coachTeamOwns(payload) {
  return coachTeamDescriptor(payload).id === activeCoachTeam.id;
}
function coachTeamStamp(payload) {
  if (!payload || typeof payload !== "object") return payload;
  if (payload.teamContext && !coachTeamOwns(payload))
    throw Error("Ce document appartient à une autre équipe.");
  return { ...payload, teamContext: { ...activeCoachTeam } };
}
function coachTeamEncodeLibrary(key, value) {
  const rows = JSON.parse(value);
  if (!Array.isArray(rows)) throw Error("Bibliothèque invalide");
  return JSON.stringify(
    rows.map((row) =>
      key === "vestiaire-saves"
        ? { ...row, state: coachTeamStamp(row.state) }
        : coachTeamStamp(row),
    ),
  );
}
// Team libraries use separate keys. Historical aggregate records remain untouched backups.
function coachTeamReadLibrary(key) {
  const scoped = localStorage.getItem(coachStorageKey(key)),
    raw =
      scoped === null ? localStorage.getItem(coachTeamBaseKey(key)) : scoped;
  if (raw === null) return null;
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows)) throw Error("Bibliothèque invalide");
  return JSON.stringify(
    rows
      .filter((row) =>
        coachTeamOwns(key === "vestiaire-saves" ? row.state : row),
      )
      .map((row) =>
        key === "vestiaire-saves"
          ? { ...row, state: coachTeamStamp(row.state) }
          : coachTeamStamp(row),
      ),
  );
}
coachStorageKey = function (key, id = activeCoach.id) {
  const base = coachTeamBaseKey(key, id);
  if (typeof key !== "string") return base;
  if (id !== activeCoach.id || coachTeamSharedKeys.has(key)) return base;
  if (
    coachLibraryKeys.has(key) ||
    coachTeamWorkspaceKeys.has(key) ||
    key.startsWith("vestiaire-save-journal:")
  )
    return base + ":team:" + activeCoachTeam.id;
  return base;
};
coachStorageGet = function (key) {
  let value;
  if (coachLibraryKeys.has(key)) value = coachTeamReadLibrary(key);
  else {
    value = localStorage.getItem(coachStorageKey(key));
    if (value === null && coachTeamWorkspaceKeys.has(key)) {
      const previous = localStorage.getItem(coachTeamBaseKey(key));
      if (previous !== null) {
        if (
          [
            "vestiaire-draft",
            "vestiaire-training-draft",
            "vestiaire-report-draft",
            "vestiaire-gameplan-draft",
          ].includes(key)
        ) {
          try {
            if (coachTeamOwns(JSON.parse(previous))) value = previous;
          } catch {}
        } else if (activeCoachTeam.id === "unassigned") value = previous;
      }
    }
  }
  if (coachLibraryKeys.has(key) && !coachLibraryBaselines.has(key))
    coachLibraryBaselines.set(key, value);
  return value;
};
function coachTeamAssertUniqueIds(key, incoming) {
  const unwrap = (row) => (key === "vestiaire-saves" ? row.state : row),
    id = (payload) =>
      key === "vestiaire-saves" ? payload?.documentId : payload?.id,
    ids = new Set(incoming.map((row) => id(unwrap(row))).filter(Boolean)),
    base = coachTeamBaseKey(key),
    current = coachStorageKey(key);
  for (let n = 0; n < localStorage.length; n++) {
    const storedKey = localStorage.key(n);
    if (
      storedKey === current ||
      (storedKey !== base && !storedKey.startsWith(base + ":team:"))
    )
      continue;
    const rows = JSON.parse(localStorage.getItem(storedKey));
    if (!Array.isArray(rows)) throw Error("Bibliothèque invalide");
    if (
      rows.some(
        (row) => !coachTeamOwns(unwrap(row)) && ids.has(id(unwrap(row))),
      )
    )
      throw Error("Identifiant déjà utilisé par une autre équipe.");
  }
}
coachStorageSet = function (key, value) {
  // A deleted team never gets its documents back (unload handlers, other tabs).
  if (
    activeCoachTeam.id !== "unassigned" &&
    (coachLibraryKeys.has(key) || coachTeamWorkspaceKeys.has(key) || String(key).startsWith("vestiaire-save-journal:")) &&
    coachTeamIsRemoved(activeCoachTeam.id)
  )
    throw Error("Cette équipe a été supprimée : rien n’est enregistré.");
  if (coachLibraryKeys.has(key)) {
    const encoded = coachTeamEncodeLibrary(key, value);
    coachTeamAssertUniqueIds(key, JSON.parse(encoded));
    localStorage.setItem(coachStorageKey(key), encoded);
    coachLibraryBaselines.set(key, encoded);
    return;
  }
  if (
    [
      "vestiaire-draft",
      "vestiaire-training-draft",
      "vestiaire-report-draft",
      "vestiaire-gameplan-draft",
    ].includes(key)
  ) {
    const draft = JSON.parse(value);
    if (draft?.teamContext && !coachTeamOwns(draft))
      throw Error("Ce brouillon appartient à une autre équipe.");
  }
  localStorage.setItem(coachStorageKey(key), value);
};
function coachTeamsRefreshSelector() {
  const select = document.getElementById("coach-team-select");
  if (!select) return;
  select.replaceChildren(
    ...coachTeams.map((team) => new Option(team.label, team.id)),
    new Option("Configurer cette équipe…", "__edit"),
    new Option("+ Ajouter une équipe…", "__add"),
  );
  select.value = activeCoachTeam.id;
  document.dispatchEvent(new Event("coach-teams-updated"));
}
function coachTeamRememberView(id) {
  sessionStorage.setItem(
    coachTeamBaseKey("vestiaire-team-entry"),
    JSON.stringify({
      teamId: id,
      view: window.workspaceFraming?.current().view || "home",
    }),
  );
}
function coachTeamEntryPage() {
  const key = coachTeamBaseKey("vestiaire-team-entry");
  try {
    const value = JSON.parse(sessionStorage.getItem(key) || "null");
    sessionStorage.removeItem(key);
    return value?.teamId === activeCoachTeam.id &&
      [
        "home",
        "terrain",
        "training",
        "agenda",
        "report",
        "squad",
        "resources",
        "club",
      ].includes(value.view)
      ? value.view
      : null;
  } catch {
    return null;
  }
}
function coachTeamSwitch(id) {
  if (id === activeCoachTeam.id) return true;
  if (
    !coachTeams.some((t) => t.id === id) ||
    document.querySelector("dialog[open]")
  ) {
    coachTeamsRefreshSelector();
    return false;
  }
  if (!flushCoachWorkspace()) {
    coachTeamsRefreshSelector();
    return false;
  }
  try {
    coachTeamRememberView(id);
    sessionStorage.setItem(coachTeamSelectionKey, id);
    history.replaceState(null, "", location.href);
    location.reload();
    return true;
  } catch {
    notify("Changement impossible : votre équipe actuelle reste ouverte.");
    coachTeamsRefreshSelector();
    return false;
  }
}
// This coach's local storage keys holding one team's documents and drafts.
function coachTeamStorageKeys(id) {
  const prefix = coachTeamBaseKey(""),
    suffix = ":team:" + id,
    keys = [];
  for (let n = 0; n < localStorage.length; n++) {
    const key = localStorage.key(n);
    if (!key || !key.startsWith(prefix) || !key.endsWith(suffix)) continue;
    const base = key.slice(prefix.length, key.length - suffix.length);
    if (coachLibraryKeys.has(base) || coachTeamWorkspaceKeys.has(base) || base.startsWith("vestiaire-save-journal:"))
      keys.push(key);
  }
  return keys;
}
// Everything stored for one team on this device: its scoped keys, plus its records in
// the historical aggregate libraries and its historical base drafts. Throws on unreadable data.
function coachTeamInventory(id) {
  const scoped = coachTeamStorageKeys(id),
    belongs = (payload) => coachTeamDescriptor(payload).id === id,
    aggregates = [],
    drafts = [];
  let count = 0;
  // Only documents count for the coach (library rows and drafts), not internal
  // settings such as navigation or recovery state, which are erased too.
  const draftNames = ["vestiaire-draft", "vestiaire-training-draft", "vestiaire-report-draft", "vestiaire-gameplan-draft"];
  for (const key of scoped) {
    const value = JSON.parse(localStorage.getItem(key)),
      base = key.slice(coachTeamBaseKey("").length).replace(/:team:.*$/, "");
    if (coachLibraryKeys.has(base) && Array.isArray(value)) count += value.length;
    else if (draftNames.includes(base) && value) count++;
  }
  for (const name of coachLibraryKeys) {
    const key = coachTeamBaseKey(name),
      raw = localStorage.getItem(key);
    if (raw === null) continue;
    const rows = JSON.parse(raw);
    if (!Array.isArray(rows)) throw Error("Bibliothèque illisible");
    const keep = rows.filter((row) => !belongs(name === "vestiaire-saves" ? row.state : row));
    if (keep.length !== rows.length) {
      aggregates.push({ key, keep });
      count += rows.length - keep.length;
    }
  }
  for (const name of ["vestiaire-draft", "vestiaire-training-draft", "vestiaire-report-draft", "vestiaire-gameplan-draft"]) {
    const key = coachTeamBaseKey(name),
      raw = localStorage.getItem(key);
    if (raw === null) continue;
    const draft = JSON.parse(raw);
    if (draft && belongs(draft)) {
      drafts.push(key);
      count++;
    }
  }
  return { scoped, aggregates, drafts, count };
}
// Writes are refused for a deleted team, even from an older tab or an unload handler.
function coachTeamIsRemoved(id) {
  try {
    const removed = JSON.parse(localStorage.getItem(coachTeamRemovedKey) || "[]");
    return Array.isArray(removed) && removed.includes(id);
  } catch {
    return coachTeamRemoved.has(id);
  }
}
// Deletes a team on this device after an explicit confirmation. Its local documents
// and drafts are erased; copies already shared with the club are not touched.
function coachTeamDelete(id) {
  const team = coachTeams.find((t) => t.id === id);
  if (!team || id === "unassigned") return;
  const dialog = el("dialog", "coach-team-dialog coach-team-delete");
  dialog.setAttribute("aria-labelledby", "coach-team-delete-title");
  const form = el("form"),
    title = el("h2", "", "Supprimer « " + team.label + " » ?"),
    status = el("p", "hint"),
    actions = el("div", "report-actions"),
    cancel = el("button", "export", "Annuler"),
    confirmButton = el("button", "danger", "Supprimer définitivement");
  let inventory;
  try {
    inventory = coachTeamInventory(id);
  } catch {
    notify("Suppression impossible : des données de cette équipe sont illisibles. Rien n’a été effacé.");
    return;
  }
  const count = inventory.count;
  title.id = "coach-team-delete-title";
  cancel.type = "button";
  confirmButton.type = "submit";
  cancel.onclick = () => dialog.close();
  status.setAttribute("role", "status");
  actions.append(cancel, confirmButton);
  form.append(
    title,
    el("p", "", "L’équipe et ses " + count + " document(s) enregistrés sur cet appareil (compositions, séances, bilans, brouillons) seront effacés. Cette action est définitive."),
    el("p", "hint", "Les copies déjà partagées avec le club ne sont pas effacées. Votre effectif d’autres équipes, vos exercices et votre compte ne changent pas."),
    status,
    actions,
  );
  form.onsubmit = (event) => {
    event.preventDefault();
    if (!flushCoachWorkspace()) {
      status.textContent = "Enregistrez ou corrigez le travail ouvert avant de supprimer une équipe.";
      return;
    }
    let current;
    try {
      // Read and validate everything first: an unreadable record cancels the deletion.
      current = coachTeamInventory(id);
    } catch {
      status.textContent = "Suppression annulée : des données de cette équipe sont illisibles. Rien n’a été effacé.";
      return;
    }
    try {
      // Merge with what other tabs may have written since this page loaded.
      const storedRemoved = JSON.parse(localStorage.getItem(coachTeamRemovedKey) || "[]"),
        storedTeams = JSON.parse(localStorage.getItem(coachTeamManifestKey) || "[]"),
        removed = new Set([...(Array.isArray(storedRemoved) ? storedRemoved.filter((x) => typeof x === "string") : []), ...coachTeamRemoved, id]);
      localStorage.setItem(coachTeamRemovedKey, JSON.stringify([...removed]));
      const merged = new Map(
        [...coachTeams, ...(Array.isArray(storedTeams) ? storedTeams.filter(coachTeamValid) : [])].map((t) => [t.id, t]),
      );
      const remaining = [...merged.values()].filter((t) => !removed.has(t.id));
      localStorage.setItem(coachTeamManifestKey, JSON.stringify(remaining));
      // Pending club synchronisation of this team is dropped (never sent, never deletes).
      if (typeof clubNetworkPendingPrefix === "function")
        for (const key of Object.keys(localStorage))
          if (key.startsWith(clubNetworkPendingPrefix()))
            try {
              if (JSON.parse(localStorage.getItem(key))?.teamId === id) localStorage.removeItem(key);
            } catch {}
      for (const key of current.scoped) localStorage.removeItem(key);
      for (const { key, keep } of current.aggregates) localStorage.setItem(key, JSON.stringify(keep));
      for (const key of current.drafts) localStorage.removeItem(key);
      coachTeamRemoved = removed;
      coachTeams = remaining;
    } catch {
      status.textContent = "Suppression incomplète ou impossible : le stockage est indisponible ou illisible. Réessayez.";
      return;
    }
    dialog.dataset.saved = "true";
    dialog.close();
    if (id === activeCoachTeam.id) {
      const next = coachTeams.find((t) => t.id !== "unassigned") || coachTeams[0] || { id: "unassigned" };
      try {
        coachTeamRememberView(next.id);
        sessionStorage.setItem(coachTeamSelectionKey, next.id);
      } catch {}
      history.replaceState(null, "", location.href);
      location.reload();
    } else notify("Équipe « " + team.label + " » supprimée.");
  };
  dialog.append(form);
  dialog.addEventListener(
    "close",
    () => {
      dialog.remove();
      coachTeamsRefreshSelector();
    },
    { once: true },
  );
  document.body.append(dialog);
  dialog.showModal();
  cancel.focus();
  return dialog;
}
function coachTeamAddDialog(edit = false, targetTeam = activeCoachTeam) {
  const editedTeam = edit
    ? coachTeams.find((t) => t.id === targetTeam.id)
    : activeCoachTeam;
  if (!editedTeam) return;
  const dialog = el("dialog", "coach-team-dialog");
  dialog.setAttribute("aria-labelledby", "coach-team-title");
  const form = el("form"),
    heading = el("div", "section-heading"),
    title = el("h2", "", edit ? "Configurer mon équipe" : "Ajouter une équipe"),
    close = el("button", "icon-button", "×");
  title.id = "coach-team-title";
  close.type = "button";
  close.setAttribute("aria-label", "Fermer");
  close.onclick = () => dialog.close();
  heading.append(title, close);
  form.append(heading);
  const field = (label, max) => {
    const wrap = el("label", "report-field", label),
      input = el("input");
    input.required = true;
    input.maxLength = max;
    wrap.append(input);
    form.append(wrap);
    return input;
  };
  const label = field("Nom affiché (ex. Seniors A)", 60),
    category = field("Catégorie (ex. Seniors, U15)", 30),
    team = field("Nom de l’équipe", 50);
  team.value = edit ? editedTeam.team || "Stade Mayennais" : "Stade Mayennais";
  if (edit) {
    label.value =
      editedTeam.id === "unassigned" && editedTeam.label === "À classer"
        ? ""
        : editedTeam.label;
    category.value = editedTeam.category;
  }
  const hint = el(
      "p",
      "hint",
      "Chaque équipe possède ses propres joueurs, bilans, séances, brouillons et créneaux. Les exercices et votre compte restent communs.",
    ),
    status = el("p", "hint"),
    save = el(
      "button",
      "primary",
      edit ? "Enregistrer mon équipe" : "Créer et ouvrir cette équipe",
    );
  save.type = "submit";
  status.setAttribute("role", "status");
  form.append(hint, status, save);
  if (edit && editedTeam.id !== "unassigned") {
    const remove = el("button", "danger coach-team-remove", "Supprimer cette équipe");
    remove.type = "button";
    remove.onclick = () => {
      dialog.close();
      coachTeamDelete(editedTeam.id);
    };
    form.append(remove);
  }
  form.onsubmit = (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const entry = {
      id: edit ? editedTeam.id : "team-" + crypto.randomUUID(),
      label: label.value.trim(),
      category: category.value.trim(),
      team: team.value.trim(),
    };
    if (!coachTeamValid(entry) || !entry.category || !entry.team) {
      status.textContent = "Renseignez les trois champs.";
      return;
    }
    if (
      coachTeams.some(
        (t) =>
          t.id !== entry.id &&
          coachTeamNormalize(t.label) === coachTeamNormalize(entry.label),
      )
    ) {
      status.textContent = "Ce nom existe déjà. Choisissez un nom distinct.";
      return;
    }
    if (!edit && coachTeams.length >= 100) {
      status.textContent = "100 équipes maximum.";
      return;
    }
    if (!flushCoachWorkspace()) {
      status.textContent =
        "Corrigez ou enregistrez le travail ouvert avant de changer d’équipe.";
      return;
    }
    try {
      const stored = JSON.parse(
        localStorage.getItem(coachTeamManifestKey) || "[]",
      );
      const merged = new Map(
        [
          ...coachTeams,
          ...(Array.isArray(stored) ? stored.filter((t) => coachTeamValid(t) && !coachTeamRemoved.has(t.id)) : []),
        ].map((t) => [t.id, t]),
      );
      merged.set(entry.id, entry);
      localStorage.setItem(
        coachTeamManifestKey,
        JSON.stringify([...merged.values()]),
      );
      coachTeams = [...merged.values()];
      dialog.dataset.saved = "true";
      dialog.close();
      if (edit) {
        coachTeamRememberView(entry.id);
        sessionStorage.setItem(coachTeamSelectionKey, entry.id);
        history.replaceState(null, "", location.href);
        location.reload();
      } else coachTeamSwitch(entry.id);
    } catch {
      status.textContent =
        "Équipe non ouverte : le stockage est indisponible. Votre travail reste conservé.";
    }
  };
  dialog.append(form);
  dialog.addEventListener(
    "close",
    () => {
      dialog.remove();
      coachTeamsRefreshSelector();
    },
    { once: true },
  );
  document.body.append(dialog);
  dialog.showModal();
  label.focus();
  return dialog;
}
document.addEventListener("DOMContentLoaded", () => {
  const wrap = el("label", "coach-team-picker"),
    caption = el("span", "", "Équipe / catégorie"),
    select = el("select");
  select.id = "coach-team-select";
  select.setAttribute("aria-label", "Équipe / catégorie");
  wrap.append(caption, select);
  document.querySelector(".header-actions").prepend(wrap);
  coachTeamsRefreshSelector();
  select.onchange = () => {
    if (select.value === "__add" || select.value === "__edit") {
      const edit = select.value === "__edit";
      coachTeamsRefreshSelector();
      coachTeamAddDialog(edit);
    } else coachTeamSwitch(select.value);
  };
});

// Outermost guard (after every storage wrapper, e.g. save journals of the club network):
// a deleted team can no longer write anything, and other open tabs leave it at once.
document.addEventListener("DOMContentLoaded", () => {
  const teamKey = (key) =>
    typeof key === "string" &&
    (coachLibraryKeys.has(key) || coachTeamWorkspaceKeys.has(key) || key.startsWith("vestiaire-save-journal:"));
  const outer = coachStorageSet;
  coachStorageSet = function (key, value) {
    if (activeCoachTeam.id !== "unassigned" && teamKey(key) && coachTeamIsRemoved(activeCoachTeam.id))
      throw Error("Cette équipe a été supprimée : rien n’est enregistré.");
    return outer.apply(this, arguments);
  };
  if (typeof clubNetworkPendingJobs === "function") {
    const jobs = clubNetworkPendingJobs;
    clubNetworkPendingJobs = function () {
      return coachTeamIsRemoved(activeCoachTeam.id) ? [] : jobs.apply(this, arguments);
    };
  }
  window.addEventListener("storage", (event) => {
    if (event.key !== coachTeamRemovedKey || activeCoachTeam.id === "unassigned" || !coachTeamIsRemoved(activeCoachTeam.id)) return;
    notify("Cette équipe a été supprimée dans un autre onglet.");
    const next = (() => {
      try {
        const stored = JSON.parse(localStorage.getItem(coachTeamManifestKey) || "[]");
        return stored.find((t) => t.id !== "unassigned" && !coachTeamIsRemoved(t.id))?.id || "unassigned";
      } catch {
        return "unassigned";
      }
    })();
    try {
      sessionStorage.setItem(coachTeamSelectionKey, next);
    } catch {}
    setTimeout(() => location.reload(), 1200);
  });
});
