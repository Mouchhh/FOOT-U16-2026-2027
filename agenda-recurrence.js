// Rules persist indefinitely; only the requested calendar window is materialized.
const agendaRecurringTypes = {
  training: { label: "Entraînement", short: "Séance", kind: "training" },
  match: { label: "Match", short: "Match", kind: "match" },
  video: { label: "Séance vidéo", short: "Vidéo", kind: "video" },
  meeting: { label: "Réunion / autre", short: "Réunion", kind: "meeting" },
};
const agendaRecurringKey = "vestiaire-agenda-week-template";
const agendaRecurringId = /^[a-zA-Z0-9-]{1,80}$/;
function agendaRecurringLegacyValid(plan) {
  return (
    plan &&
    plan.version === 1 &&
    ["month", "season", "custom"].includes(plan.scope) &&
    Number.isSafeInteger(plan.revision) &&
    plan.revision >= 0 &&
    typeof plan.enabled === "boolean" &&
    trainingDateValid(plan.from) &&
    trainingDateValid(plan.to) &&
    plan.to >= plan.from &&
    typeof plan.category === "string" &&
    plan.category.length <= 30 &&
    Array.isArray(plan.slots) &&
    plan.slots.length <= 20 &&
    new Set(plan.slots.map((s) => s?.id)).size === plan.slots.length &&
    new Set(plan.slots.map((s) => [s?.day, s?.type, s?.time].join("|")))
      .size === plan.slots.length &&
    (!plan.enabled || plan.slots.length > 0) &&
    plan.slots.every(
      (s) =>
        s &&
        agendaRecurringSlotValid({
          ...s,
          seriesId: s.id,
          from: plan.from,
          to: plan.to,
          category: plan.category,
          location: "",
        }),
    ) &&
    plan.statuses &&
    typeof plan.statuses === "object" &&
    !Array.isArray(plan.statuses)
  );
}
function agendaRecurringSlotValid(s) {
  return (
    s &&
    typeof s.id === "string" &&
    typeof s.seriesId === "string" &&
    agendaRecurringId.test(s.id) &&
    agendaRecurringId.test(s.seriesId) &&
    trainingDateValid(s.from) &&
    (s.to === null || (trainingDateValid(s.to) && s.to >= s.from)) &&
    Number.isInteger(s.day) &&
    s.day >= 1 &&
    s.day <= 7 &&
    Object.hasOwn(agendaRecurringTypes, s.type) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(s.time) &&
    typeof s.title === "string" &&
    s.title.length <= 100 &&
    ["pending", "confirmed"].includes(s.status) &&
    typeof s.category === "string" &&
    s.category.length <= 30 &&
    typeof s.location === "string" &&
    s.location.length <= 500
  );
}
function agendaRecurringKeyValid(id) {
  const match = /^recurring:([a-zA-Z0-9-]{1,80}):(\d{4}-\d{2}-\d{2})$/.exec(id);
  return match && trainingDateValid(match[2]) ? match : null;
}
function agendaRecurringFrozenValid(event) {
  return (
    event &&
    typeof event.id === "string" &&
    agendaRecurringKeyValid(event.id) &&
    ["training", "match", "video", "meeting"].includes(event.kind) &&
    trainingDateValid(event.date) &&
    /^([01]\d|2[0-3]):[0-5]\d$/.test(event.time) &&
    typeof event.title === "string" &&
    event.title.length <= 100 &&
    typeof event.category === "string" &&
    event.category.length <= 30 &&
    typeof event.location === "string" &&
    event.location.length <= 500 &&
    ["pending", "confirmed"].includes(event.status) &&
    event.recurring &&
    agendaRecurringId.test(event.recurring.slotId) &&
    agendaRecurringId.test(event.recurring.seriesId) &&
    Object.hasOwn(agendaRecurringTypes, event.recurring.type) &&
    trainingDateValid(event.recurring.originalDate)
  );
}
function agendaRecurringPreservePast(plan, cutoff, seriesId = null) {
  for (const id of Object.keys(plan.exceptions)) {
    const event = agendaRecurringResolve(id, plan);
    if (
      !event ||
      (seriesId && event.recurring.seriesId !== seriesId) ||
      event.date >= cutoff ||
      event.recurring.originalDate < cutoff
    )
      continue;
    const { open, ...snapshot } = event;
    (plan.frozen ??= {})[id] = snapshot;
  }
}
function agendaRecurringValid(plan) {
  if (plan?.version === 1) return agendaRecurringLegacyValid(plan);
  if (
    !plan ||
    plan.version !== 2 ||
    plan.scope !== "persistent" ||
    !Number.isSafeInteger(plan.revision) ||
    plan.revision < 0 ||
    typeof plan.enabled !== "boolean" ||
    !trainingDateValid(plan.from) ||
    plan.to !== null ||
    typeof plan.category !== "string" ||
    plan.category.length > 30 ||
    !Array.isArray(plan.slots) ||
    plan.slots.length > 2000 ||
    !plan.slots.every(agendaRecurringSlotValid) ||
    new Set(plan.slots.map((s) => s.id)).size !== plan.slots.length ||
    !plan.statuses ||
    typeof plan.statuses !== "object" ||
    Array.isArray(plan.statuses) ||
    !plan.exceptions ||
    typeof plan.exceptions !== "object" ||
    Array.isArray(plan.exceptions)
  )
    return false;
  if (plan.enabled !== plan.slots.some((s) => s.to === null)) return false;
  if (
    plan.templateSlots !== undefined &&
    (!Array.isArray(plan.templateSlots) ||
      plan.templateSlots.length > 20 ||
      !plan.templateSlots.every(
        (s) =>
          s &&
          agendaRecurringSlotValid({
            ...s,
            seriesId: s.seriesId || s.id,
            from: plan.from,
            to: null,
            category: plan.category,
            location: s.location || "",
          }),
      ))
  )
    return false;
  if (
    plan.frozen !== undefined &&
    (!plan.frozen ||
      typeof plan.frozen !== "object" ||
      Array.isArray(plan.frozen) ||
      Object.keys(plan.frozen).length > 20000 ||
      !Object.entries(plan.frozen).every(
        ([id, event]) => id === event?.id && agendaRecurringFrozenValid(event),
      ))
  )
    return false;
  if (
    Object.keys(plan.statuses).length > 20000 ||
    Object.keys(plan.exceptions).length > 20000
  )
    return false;
  if (
    !Object.entries(plan.statuses).every(
      ([id, status]) =>
        agendaRecurringKeyValid(id) &&
        ["pending", "confirmed"].includes(status),
    )
  )
    return false;
  if (
    !Object.entries(plan.exceptions).every(
      ([id, x]) =>
        agendaRecurringKeyValid(id) &&
        x &&
        typeof x.deleted === "boolean" &&
        (x.deleted ||
          (trainingDateValid(x.date) &&
            /^([01]\d|2[0-3]):[0-5]\d$/.test(x.time) &&
            typeof x.title === "string" &&
            x.title.trim() &&
            x.title.length <= 100 &&
            typeof x.location === "string" &&
            x.location.length <= 500)),
    )
  )
    return false;
  // Two versions of the same series may never overlap.
  const series = new Map();
  for (const slot of plan.slots) {
    const versions = series.get(slot.seriesId) || [];
    if (
      versions.some(
        (s) =>
          (s.to === null || s.to >= slot.from) &&
          (slot.to === null || slot.to >= s.from),
      )
    )
      return false;
    versions.push(slot);
    series.set(slot.seriesId, versions);
  }
  return true;
}
function agendaRecurringUpgrade(plan) {
  if (plan.version === 2) return structuredClone(plan);
  return {
    version: 2,
    scope: "persistent",
    revision: plan.revision,
    enabled: plan.enabled,
    from: plan.from,
    to: null,
    category: plan.category,
    templateSlots: plan.slots.map((s) => ({ ...s, location: "" })),
    slots: plan.slots.flatMap((s) => {
      const stop =
        plan.to < agendaCalendarToday()
          ? plan.to
          : agendaCalendarAdd(agendaCalendarToday(), -1);
      return !plan.enabled && stop < plan.from
        ? []
        : [
            {
              ...s,
              seriesId: s.id,
              from: plan.from,
              to: plan.enabled ? null : stop,
              category: plan.category,
              location: "",
            },
          ];
    }),
    statuses: { ...plan.statuses },
    exceptions: {},
  };
}
function agendaRecurringRead() {
  try {
    const value = JSON.parse(coachStorageGet(agendaRecurringKey) || "null");
    if (!agendaRecurringValid(value)) return null;
    const plan = agendaRecurringUpgrade(value);
    return agendaRecurringValid(plan) ? plan : null;
  } catch {
    return null;
  }
}
function agendaRecurringWindow() {
  const month = $("coach-agenda-month")?.value,
    week = $("coach-agenda-week")?.value;
  if (/^\d{4}-\d{2}$/.test(month || "")) {
    const first = month + "-01",
      start = agendaCalendarAdd(
        first,
        -((new Date(first + "T12:00:00Z").getUTCDay() + 6) % 7),
      );
    return {
      from: start,
      to: agendaCalendarAdd(agendaCalendarMonth(month, 1) + "-01", 6),
    };
  }
  if (trainingDateValid(week || "")) {
    const first = trainingWeekStart(week);
    return { from: first, to: agendaCalendarAdd(first, 6) };
  }
  const today = agendaCalendarToday();
  return {
    from: agendaCalendarAdd(today, -31),
    to: agendaCalendarAdd(today, 366),
  };
}
function agendaRecurringMakeEvent(plan, slot, date) {
  if (plan.frozen?.["recurring:" + slot.id + ":" + date]) return null;
  if (
    date < slot.from ||
    (slot.to && date > slot.to) ||
    (new Date(date + "T12:00:00Z").getUTCDay() || 7) !== slot.day
  )
    return null;
  const id = "recurring:" + slot.id + ":" + date,
    x = plan.exceptions[id];
  if (x?.deleted) return null;
  const type = agendaRecurringTypes[slot.type];
  return {
    id,
    kind: type.kind,
    label: type.short,
    date: x?.date || date,
    time: x?.time || slot.time,
    title: x?.title || slot.title || type.label,
    category: slot.category,
    location: x?.location ?? slot.location,
    status: plan.statuses[id] || slot.status,
    recurring: {
      slotId: slot.id,
      seriesId: slot.seriesId,
      originalDate: date,
      type: slot.type,
    },
    _agendaKeys: ["event:" + id],
    open: () => agendaRecurringOpen(id),
  };
}
function agendaRecurringResolve(id, plan = agendaRecurringRead()) {
  const match = agendaRecurringKeyValid(id);
  if (!plan || !match) return null;
  if (plan.frozen?.[id]) {
    const x = plan.exceptions[id];
    if (x?.deleted) return null;
    return {
      ...plan.frozen[id],
      ...(x && !x.deleted ? x : {}),
      status: plan.statuses[id] || plan.frozen[id].status,
      open: () => agendaRecurringOpen(id),
    };
  }
  const slot = plan.slots.find((s) => s.id === match[1]);
  return slot ? agendaRecurringMakeEvent(plan, slot, match[2]) : null;
}
function agendaRecurringOccurrences(
  plan = agendaRecurringRead(),
  range = window.agendaRecurringQueryRange || agendaRecurringWindow(),
) {
  if (
    !plan ||
    !agendaRecurringValid(plan) ||
    !trainingDateValid(range.from) ||
    !trainingDateValid(range.to) ||
    range.to < range.from ||
    Date.parse(range.to) - Date.parse(range.from) > 800 * 86400000
  )
    return [];
  plan = agendaRecurringUpgrade(plan);
  const events = new Map();
  for (const slot of plan.slots) {
    let from = slot.from > range.from ? slot.from : range.from,
      to = slot.to && slot.to < range.to ? slot.to : range.to;
    if (from > to) continue;
    const day = new Date(from + "T12:00:00Z").getUTCDay() || 7;
    from = agendaCalendarAdd(from, (slot.day - day + 7) % 7);
    for (let date = from; date <= to; date = agendaCalendarAdd(date, 7)) {
      const event = agendaRecurringMakeEvent(plan, slot, date);
      if (event) events.set(event.id, event);
    }
  }
  // A moved occurrence must also be found in its destination month, even years away.
  for (const [id, x] of Object.entries(plan.exceptions))
    if (!x.deleted && x.date >= range.from && x.date <= range.to) {
      const event = agendaRecurringResolve(id, plan);
      if (event) events.set(id, event);
    }
  for (const id of Object.keys(plan.frozen || {})) {
    const event = agendaRecurringResolve(id, plan);
    if (event && event.date >= range.from && event.date <= range.to)
      events.set(id, event);
  }
  const legacyEdits =
    typeof agendaEventEdits === "function" ? agendaEventEdits() : [];
  for (const edit of legacyEdits)
    if (edit.date >= range.from && edit.date <= range.to)
      for (const key of edit.keys) {
        if (!key.startsWith("event:recurring:")) continue;
        const event = agendaRecurringResolve(key.slice(6), plan);
        if (event) events.set(event.id, event);
      }
  return [...events.values()]
    .filter(
      (e) =>
        (e.date >= range.from && e.date <= range.to) ||
        legacyEdits.some(
          (x) =>
            x.keys.includes("event:" + e.id) &&
            x.date >= range.from &&
            x.date <= range.to,
        ),
    )
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}
function agendaRecurringTrimMetadata(plan) {
  const eligible = (id) => {
    if (plan.frozen?.[id]) return true;
    const m = agendaRecurringKeyValid(id),
      s = m && plan.slots.find((s) => s.id === m[1]);
    return s && m[2] >= s.from && (!s.to || m[2] <= s.to);
  };
  plan.statuses = Object.fromEntries(
    Object.entries(plan.statuses).filter(([id]) => eligible(id)),
  );
  plan.exceptions = Object.fromEntries(
    Object.entries(plan.exceptions).filter(([id]) => eligible(id)),
  );
  plan.enabled = plan.slots.some((s) => s.to === null);
  return plan;
}
function agendaRecurringCommit(plan, revision) {
  if ((agendaRecurringRead()?.revision || 0) !== revision)
    throw Error(
      "La récurrence a changé dans une autre fenêtre. Rouvrez le réglage.",
    );
  plan.revision = revision + 1;
  if (!agendaRecurringValid(plan))
    throw Error(
      "Réglage invalide ou trop volumineux. Les rendez-vous précédents sont conservés.",
    );
  coachStorageSet(agendaRecurringKey, JSON.stringify(plan));
}
function agendaRecurringReplace(plan, rows, cutoff, enabled, category) {
  const next = plan
      ? structuredClone(plan)
      : {
          version: 2,
          scope: "persistent",
          revision: 0,
          enabled: true,
          from: cutoff,
          to: null,
          category,
          statuses: {},
          exceptions: {},
          slots: [],
        },
    kept = new Set(),
    same = (s, r) =>
      ["day", "type", "time", "title", "status", "location"].every(
        (k) => (s[k] || "") === (r[k] || ""),
      ) && s.category === category;
  agendaRecurringPreservePast(next, cutoff);
  next.slots = next.slots.flatMap((s) => {
    if (s.to && s.to < cutoff) return [s];
    const row = rows.find((r) => r.id === s.id);
    if (enabled && row && same(s, row) && s.to === null && s.from <= cutoff) {
      kept.add(row.id);
      return [s];
    }
    return s.from < cutoff ? [{ ...s, to: agendaCalendarAdd(cutoff, -1) }] : [];
  });
  if (enabled)
    for (const row of rows)
      if (!kept.has(row.id)) {
        const previous = plan?.slots.find((s) => s.id === row.id);
        next.slots.push({
          ...row,
          id: crypto.randomUUID(),
          seriesId: previous?.seriesId || row.seriesId || row.id,
          from: cutoff,
          to: null,
          category,
          location: row.location || "",
        });
      }
  next.from = next.from < cutoff ? next.from : cutoff;
  next.category = category;
  next.templateSlots = structuredClone(rows);
  return agendaRecurringTrimMetadata(next);
}
function agendaRecurringChange(id, scope, changes, revision) {
  const plan = agendaRecurringRead(),
    event = agendaRecurringResolve(id, plan);
  if (!event || plan.revision !== revision)
    throw Error("Ce rendez-vous a changé. Rouvrez-le depuis le calendrier.");
  if (scope === "one") {
    plan.exceptions[id] = changes
      ? { ...changes, deleted: false }
      : { deleted: true };
  } else if (scope === "future") {
    const previousDefaults = plan.slots.filter((s) => s.to === null);
    const slot = plan.slots.find((s) => s.id === event.recurring.slotId) ||
        plan.slots.find((s) => s.seriesId === event.recurring.seriesId) || {
          ...event.recurring,
          ...event,
          id: event.recurring.slotId,
          seriesId: event.recurring.seriesId,
          type: event.recurring.type,
        },
      today = agendaCalendarToday(),
      firstAffected =
        changes && changes.date < event.date ? changes.date : event.date,
      cutoff = firstAffected > today ? firstAffected : today;
    agendaRecurringPreservePast(plan, cutoff, slot.seriesId);
    // An exception moved out of a past slot into the affected future must not resurrect at its old date.
    for (const key of Object.keys(plan.exceptions)) {
      const moved = agendaRecurringResolve(key, plan);
      if (
        moved &&
        moved.recurring.seriesId === slot.seriesId &&
        moved.date >= cutoff &&
        moved.recurring.originalDate < cutoff
      )
        plan.exceptions[key] = { deleted: true };
    }
    plan.slots = plan.slots.flatMap((s) =>
      s.seriesId !== slot.seriesId || (s.to && s.to < cutoff)
        ? [s]
        : s.from < cutoff
          ? [{ ...s, to: agendaCalendarAdd(cutoff, -1) }]
          : [],
    );
    if (changes)
      plan.slots.push({
        ...slot,
        id: crypto.randomUUID(),
        from: changes.date > cutoff ? changes.date : cutoff,
        to: null,
        day: new Date(changes.date + "T12:00:00Z").getUTCDay() || 7,
        time: changes.time,
        title: changes.title,
        location: changes.location,
      });
    agendaRecurringTrimMetadata(plan);
    plan.templateSlots = structuredClone(
      plan.enabled ? plan.slots.filter((s) => s.to === null) : previousDefaults,
    );
  } else throw Error("Choisissez la portée de la modification.");
  agendaRecurringCommit(plan, revision);
}

function agendaRecurringState(event) {
  if (["pending", "confirmed"].includes(event.status)) return event.status;
  if (event.draft && event.kind === "match") {
    const board = agendaEventBoard(event),
      saved =
        board?.documentId &&
        saves.find((s) => s.state?.documentId === board.documentId)?.state;
    const canonical = (value) =>
      Array.isArray(value)
        ? value.map(canonical)
        : value && typeof value === "object"
          ? Object.fromEntries(
              Object.keys(value)
                .sort()
                .filter((k) => k !== "updatedAt")
                .map((k) => [k, canonical(value[k])]),
            )
          : value;
    if (
      board &&
      saved &&
      JSON.stringify(canonical(board)) === JSON.stringify(canonical(saved))
    )
      return "confirmed";
  }
  return event.draft ? "pending" : "confirmed";
}
function agendaRecurringCard(event) {
  const card = el(
      "article",
      "report-panel agenda-event-card agenda-kind-" + event.kind,
    ),
    info = el("div");
  card.dataset.agendaEvent = event.id;
  info.append(
    el("strong", "", event.label + " · " + event.title),
    el(
      "p",
      "",
      [
        agendaCalendarDateLabel(event.date),
        event.time,
        event.category,
        event.location,
      ]
        .filter(Boolean)
        .join(" · "),
    ),
    el(
      "p",
      "recurring-status",
      event.status === "confirmed" ? "Créneau confirmé" : "À préparer",
    ),
  );
  const open = el("button", "export", "Voir ce rendez-vous");
  open.type = "button";
  open.onclick = event.open;
  card.append(info, open);
  return card;
}
function agendaRecurringDialog(title, id) {
  const dialog = el("dialog", "completion-dialog agenda-recurring-dialog");
  dialog.id = id;
  const head = el("div", "section-heading"),
    heading = el("h2", "", title),
    close = el("button", "export", "Fermer");
  heading.id = id + "-title";
  dialog.setAttribute("aria-labelledby", heading.id);
  close.type = "button";
  close.onclick = () => dialog.close();
  head.append(heading, close);
  dialog.append(head);
  dialog.addEventListener("close", () => dialog.remove(), { once: true });
  return { dialog, close };
}
function agendaRecurringOpen(id) {
  const event = agendaCalendarEvents().find((e) => e.id === id && e.recurring);
  if (!event) return;
  const owner = activeCoach.id,
    { dialog } = agendaRecurringDialog(event.title, "agenda-recurring-event");
  dialog.append(
    el(
      "p",
      "",
      [
        agendaRecurringTypes[event.recurring.type].label,
        agendaCalendarDateLabel(event.date),
        event.time,
        event.category,
        event.location,
      ]
        .filter(Boolean)
        .join(" · "),
    ),
    el(
      "p",
      "hint",
      "Rendez-vous de votre semaine type. Sa confirmation ne crée pas de contenu de séance.",
    ),
  );
  const state = el(
      "p",
      "recurring-status",
      event.status === "confirmed" ? "Créneau confirmé" : "À préparer",
    ),
    actions = el("div", "resource-actions"),
    toggle = el(
      "button",
      "export",
      event.status === "confirmed"
        ? "Remettre en attente"
        : "Confirmer ce rendez-vous",
    ),
    status = el("p", "hint");
  status.setAttribute("role", "status");
  toggle.type = "button";
  toggle.onclick = () => {
    if (activeCoach.id !== owner) return;
    const current = agendaCalendarEvents().find(
        (e) => e.id === id && e.recurring,
      ),
      plan = agendaRecurringRead();
    if (!current || !plan) {
      status.textContent =
        "Ce rendez-vous a changé. Rouvrez-le depuis le calendrier.";
      return;
    }
    const next = current.status === "confirmed" ? "pending" : "confirmed";
    plan.statuses[id] = next;
    plan.revision++;
    if (!agendaRecurringValid(plan)) {
      status.textContent =
        "Trop de statuts individuels. Rouvrez le réglage de la semaine type.";
      return;
    }
    try {
      coachStorageSet(agendaRecurringKey, JSON.stringify(plan));
      state.textContent =
        next === "confirmed" ? "Créneau confirmé" : "À préparer";
      toggle.textContent =
        next === "confirmed"
          ? "Remettre en attente"
          : "Confirmer ce rendez-vous";
      renderCoachAgenda();
    } catch {
      status.textContent =
        "Statut non enregistré. Le rendez-vous est conservé.";
    }
  };
  if (event.kind === "training") {
    const prepare = el("button", "primary", "Préparer la séance");
    prepare.type = "button";
    prepare.onclick = () => {
      if (activeCoach.id !== owner) return;
      const current = agendaCalendarEvents().find(
        (e) => e.id === id && e.recurring,
      );
      if (!current) return;
      const next = newTraining();
      next.date = current.date;
      next.time = current.time || next.time;
      next.title = current.title.slice(0, 100);
      next.coach = activeCoach.name;
      if (current.category) next.category = current.category;
      if (!trainingValid(next) || !workspaceReplaceDraft("training", next))
        return;
      dialog.close();
      workspaceNavigation.run("view-training", () => {
        syncTrainingForm();
        trainingWizard.go(2);
      });
    };
    actions.append(prepare);
  }
  if (event.kind === "match") {
    const prepare = el("button", "primary", "Préparer ce match");
    prepare.type = "button";
    prepare.onclick = () => {
      if (activeCoach.id !== owner) return;
      dialog.close();
      agendaEventCauserie(null, event.date);
    };
    actions.append(prepare);
  }
  const configure = el("button", "export", "Modifier ma semaine type");
  configure.type = "button";
  configure.onclick = () => {
    dialog.close();
    agendaRecurringConfigure();
  };
  const edit = el("button", "export", "Modifier ce rendez-vous"),
    remove = el(
      "button",
      "export recurring-delete",
      "Supprimer ce rendez-vous",
    );
  edit.type = remove.type = "button";
  edit.onclick = () => {
    dialog.close();
    agendaRecurringEdit(id);
  };
  remove.onclick = () => {
    dialog.close();
    agendaRecurringEdit(id, true);
  };
  actions.append(toggle, edit, remove, configure);
  dialog.append(state, actions, status);
  document.body.append(dialog);
  dialog.showModal();
}
function agendaRecurringEdit(id, remove = false, moveDate = null) {
  const plan = agendaRecurringRead(),
    event =
      agendaCalendarEvents().find((e) => e.id === id && e.recurring) ||
      agendaRecurringResolve(id, plan);
  if (!plan || !event) return;
  const owner = activeCoach.id,
    revision = plan.revision,
    { dialog, close } = agendaRecurringDialog(
      remove
        ? "Supprimer le rendez-vous récurrent"
        : "Modifier le rendez-vous récurrent",
      "agenda-recurring-edit",
    ),
    form = el("form", "training-form"),
    scopeLabel = el("label", "report-field", "Appliquer à"),
    scope = el("select");
  scope.id = "recurring-edit-scope";
  scope.append(
    new Option("Cette occurrence uniquement", "one"),
    new Option("Toutes les occurrences futures de ce créneau", "future"),
  );
  scopeLabel.append(scope);
  form.append(scopeLabel);
  const field = (label, type, value, max) => {
    const wrap = el("label", "report-field", label),
      input = el("input");
    input.type = type;
    input.value = value || "";
    if (max) input.maxLength = max;
    wrap.append(input);
    form.append(wrap);
    return input;
  };
  let title, date, time, location;
  if (!remove) {
    title = field("Titre", "text", event.title, 100);
    date = field("Date", "date", moveDate || event.date);
    time = field("Heure", "time", event.time);
    location = field("Lieu", "text", event.location, 500);
    title.required = date.required = time.required = true;
  }
  const note = el("p", "hint"),
    status = el("p", "hint"),
    save = el(
      "button",
      remove ? "export recurring-delete" : "primary",
      remove ? "Supprimer" : "Enregistrer les modifications",
    );
  status.setAttribute("role", "alert");
  save.type = "submit";
  const explain = () => {
    if (date) {
      date.min = scope.value === "future" ? agendaCalendarToday() : "";
      if (scope.value === "future" && date.value < date.min) {
        const day = new Date(date.value + "T12:00:00Z").getUTCDay() || 7,
          current = new Date(date.min + "T12:00:00Z").getUTCDay() || 7;
        date.value = agendaCalendarAdd(date.min, (day - current + 7) % 7);
      }
    }
    note.textContent =
      scope.value === "one"
        ? "Les autres rendez-vous restent inchangés."
        : "S’applique à ce créneau à partir de la première date concernée (au plus tôt aujourd’hui). Les dates passées et les séances ou matchs déjà enregistrés sont conservés.";
  };
  scope.onchange = explain;
  explain();
  form.append(note, status, save);
  dialog.append(form);
  let dirty = false;
  form.addEventListener("input", () => (dirty = true));
  form.addEventListener("change", () => (dirty = true));
  const mayClose = () =>
    !dirty ||
    confirm("Fermer sans enregistrer la modification de ce rendez-vous ?");
  close.onclick = () => {
    if (mayClose()) dialog.close();
  };
  dialog.addEventListener("cancel", (e) => {
    if (!mayClose()) e.preventDefault();
  });
  form.onsubmit = (e) => {
    e.preventDefault();
    if (activeCoach.id !== owner || !form.reportValidity()) return;
    if (!remove && !title.value.trim()) return;
    try {
      agendaRecurringChange(
        id,
        scope.value,
        remove
          ? null
          : {
              title: title.value.trim(),
              date: date.value,
              time: time.value,
              location: location.value.trim(),
            },
        revision,
      );
      dirty = false;
      dialog.close();
      if (!remove) {
        $("coach-agenda-month").value = date.value.slice(0, 7);
        $("coach-agenda-week").value = "";
      }
      renderCoachAgenda();
      notify(
        remove
          ? "Récurrence supprimée pour la portée choisie."
          : "Rendez-vous mis à jour pour la portée choisie.",
      );
    } catch (error) {
      status.textContent = error.message || "Modification non enregistrée.";
    }
  };
  document.body.append(dialog);
  dialog.showModal();
}
function agendaRecurringConfigure() {
  if ($("agenda-week-template")?.open) return;
  const owner = activeCoach.id,
    stored = agendaRecurringRead(),
    revision = stored?.revision || 0,
    { dialog, close } = agendaRecurringDialog(
      "Ma semaine type",
      "agenda-week-template",
    );
  dialog.append(
    el(
      "p",
      "hint",
      "Vos créneaux se répètent sans date de fin, jusqu’à votre modification ou suppression. Les modifications ci-dessous s’appliquent à partir de la date choisie ; le passé reste conservé.",
    ),
  );
  const form = el("form"),
    fields = el("div", "recurring-period"),
    today = agendaCalendarToday(),
    month = $("coach-agenda-month").value || today.slice(0, 7);
  let dirty = false,
    slotsDirty = false;
  function field(label, type, value) {
    const wrap = el("label", "report-field", label),
      input = el("input");
    input.type = type;
    input.value = value;
    wrap.append(input);
    fields.append(wrap);
    return input;
  }
  const from = field(
      "À partir du",
      "date",
      month + "-01" > today ? month + "-01" : today,
    ),
    category = field(
      "Catégorie / équipe",
      "text",
      stored?.category ||
        activeCoachTeam.category ||
        getCompositionBoard().category ||
        "",
    );
  from.required = true;
  if (stored) from.min = today;
  category.maxLength = 30;
  const activeLabel = el("label", "recurring-enabled"),
    active = el("input");
  active.type = "checkbox";
  active.checked = stored?.enabled ?? true;
  active.setAttribute("aria-label", "Activer la récurrence");
  activeLabel.append(
    active,
    document.createTextNode(" Activer la récurrence sans date de fin"),
  );
  const list = el("div", "recurring-slots"),
    add = el("button", "export", "+ Ajouter un créneau"),
    preview = el("p", "hint"),
    status = el("p", "hint"),
    save = el("button", "primary", "Enregistrer ma semaine type");
  add.type = "button";
  save.type = "submit";
  preview.setAttribute("role", "status");
  status.setAttribute("role", "alert");
  const rows = [];
  function select(label, name, options, value) {
    const wrap = el("label", "report-field", label),
      input = el("select");
    input.name = name;
    input.required = true;
    input.append(
      new Option("Choisir…", ""),
      ...options.map(([key, text]) => new Option(text, String(key))),
    );
    input.value = value || "";
    wrap.append(input);
    return { wrap, input };
  }
  function addSlot(value = {}) {
    if (rows.length >= 20) {
      status.textContent = "20 créneaux maximum.";
      return;
    }
    const row = el("fieldset", "recurring-slot"),
      legend = el("legend", "", "Créneau " + (rows.length + 1));
    row.append(legend);
    const day = select(
        "Jour",
        "day",
        [
          [1, "Lundi"],
          [2, "Mardi"],
          [3, "Mercredi"],
          [4, "Jeudi"],
          [5, "Vendredi"],
          [6, "Samedi"],
          [7, "Dimanche"],
        ],
        value.day,
      ),
      type = select(
        "Type",
        "type",
        Object.entries(agendaRecurringTypes).map(([k, v]) => [k, v.label]),
        value.type,
      ),
      state = select(
        "État du créneau",
        "status",
        [
          ["pending", "À préparer"],
          ["confirmed", "Confirmé"],
        ],
        value.status || "pending",
      );
    const timeLabel = el("label", "report-field", "Horaire"),
      time = el("input");
    time.type = "time";
    time.name = "time";
    time.required = true;
    time.value = value.time || "";
    timeLabel.append(time);
    const titleLabel = el("label", "report-field", "Nom (facultatif)"),
      title = el("input");
    title.name = "title";
    title.maxLength = 100;
    title.value = value.title || "";
    titleLabel.append(title);
    const remove = el(
      "button",
      "export recurring-remove",
      "Retirer ce créneau",
    );
    remove.type = "button";
    const item = {
      id: value.id || crypto.randomUUID(),
      row,
      day: day.input,
      type: type.input,
      status: state.input,
      time,
      title,
      location: value.location || "",
    };
    remove.onclick = () => {
      slotsDirty = true;
      rows.splice(rows.indexOf(item), 1);
      row.remove();
      dirty = true;
      refresh();
    };
    row.append(day.wrap, type.wrap, timeLabel, titleLabel, state.wrap, remove);
    rows.push(item);
    list.append(row);
    refresh();
  }

  function values() {
    return rows.map((r) => ({
      id: r.id,
      day: Number(r.day.value),
      type: r.type.value,
      time: r.time.value,
      title: r.title.value.trim(),
      status: r.status.value,
      location: r.location || "",
    }));
  }
  function draft() {
    return agendaRecurringReplace(
      stored,
      values(),
      from.value,
      active.checked,
      category.value.trim(),
    );
  }
  function refresh() {
    add.disabled = rows.length >= 20;
    if (
      !trainingDateValid(from.value) ||
      (active.checked && !rows.length) ||
      rows.some((r) => !r.day.value || !r.type.value || !r.time.value)
    ) {
      preview.textContent =
        "Choisissez les jours, les types et les horaires de vos créneaux.";
      return;
    }
    preview.textContent = active.checked
      ? rows.length +
        " créneau(x) par semaine · sans date de fin. Les rendez-vous déjà enregistrés prennent leur place."
      : "Arrêt des occurrences futures à la date choisie. Les rendez-vous passés et les documents enregistrés restent conservés.";
  }
  add.onclick = () => {
    slotsDirty = true;
    addSlot();
    dirty = true;
  };
  form.append(fields, activeLabel, list, add, preview, status, save);
  dialog.append(form);
  function loadSlots() {
    let selected =
      stored?.slots.filter(
        (s) => s.from <= from.value && (!s.to || s.to >= from.value),
      ) || [];
    if (stored && !stored.enabled) {
      const latest = new Map();
      for (const slot of stored.slots)
        if (
          !latest.has(slot.seriesId) ||
          latest.get(slot.seriesId).from < slot.from
        )
          latest.set(slot.seriesId, slot);
      selected = stored.templateSlots?.length
        ? stored.templateSlots
        : [...latest.values()];
    }
    list.replaceChildren();
    rows.length = 0;
    for (const slot of selected) addSlot(slot);
  }
  loadSlots();
  from.addEventListener("change", () => {
    if (stored && !slotsDirty) loadSlots();
    refresh();
  });
  refresh();
  form.addEventListener("input", (event) => {
    if (list.contains(event.target)) slotsDirty = true;
    dirty = true;
    refresh();
  });
  form.addEventListener("change", () => {
    dirty = true;
    refresh();
  });
  const mayClose = () =>
    !dirty ||
    confirm("Fermer sans enregistrer les changements de votre semaine type ?");
  close.onclick = () => {
    if (mayClose()) dialog.close();
  };
  dialog.addEventListener("cancel", (e) => {
    if (!mayClose()) e.preventDefault();
  });
  form.onsubmit = (e) => {
    e.preventDefault();
    if (activeCoach.id !== owner || !form.reportValidity()) return;
    const slots = values(),
      keys = slots.map((s) => [s.day, s.type, s.time].join("|"));
    if (
      (active.checked && !slots.length) ||
      new Set(keys).size !== keys.length ||
      slots.some((s) => !s.day || !s.type || !s.time)
    ) {
      status.textContent =
        "Ajoutez des créneaux complets et distincts, ou désactivez la récurrence.";
      return;
    }
    try {
      const plan = draft();
      agendaRecurringCommit(plan, revision);
      dirty = false;
      dialog.close();
      renderCoachAgenda();
      notify(
        active.checked
          ? "Semaine type enregistrée sans date de fin sur cet appareil."
          : "Récurrence arrêtée à partir du " +
              from.value +
              ". Le passé reste conservé.",
      );
    } catch (error) {
      status.textContent =
        error.message ||
        "Enregistrement impossible. Les réglages précédents sont conservés.";
    }
  };
  document.body.append(dialog);
  dialog.showModal();
}
document.addEventListener("DOMContentLoaded", () => {
  const source = agendaCalendarEvents;
  agendaCalendarEvents = function () {
    const real = source(),
      normalize = (s) =>
        (s || "")
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .trim()
          .toLowerCase();
    const repeated = agendaRecurringOccurrences().filter((e) =>
      agendaCalendarMatches(e.date, e.category, activeCoach.name),
    );
    const generated = repeated.filter(
      (e) =>
        !real.some(
          (r) =>
            r.kind === e.kind &&
            r.date === e.date &&
            (!e.category || normalize(r.category) === normalize(e.category)) &&
            (e.kind === "match" || r.time === e.time),
        ),
    );
    return [...real, ...generated].sort(
      (a, b) =>
        (a.date + a.time).localeCompare(b.date + b.time) ||
        a.id.localeCompare(b.id),
    );
  };
  const button = el("button", "export", "Ma semaine type");
  button.id = "agenda-week-template-open";
  button.type = "button";
  button.onclick = agendaRecurringConfigure;
  $("coach-agenda")
    .querySelector(".reports-heading .report-actions")
    .append(button);
  const intro = el("aside", "recurring-intro");
  intro.id = "agenda-week-template-intro";
  $("coach-agenda-list").before(intro);
  const render = renderCoachAgenda;
  renderCoachAgenda = function () {
    const previousRange = window.agendaRecurringQueryRange;
    window.agendaRecurringQueryRange = previousRange || agendaRecurringWindow();
    try {
      render();
      const plan = agendaRecurringRead();
      intro.replaceChildren(
        el(
          "strong",
          "",
          plan
            ? plan.enabled
              ? "Votre semaine type est active"
              : "Vos occurrences futures sont arrêtées"
            : "Quand ont lieu vos séances ?",
        ),
        el(
          "p",
          "hint",
          plan
            ? plan.slots.filter((s) => s.to === null).length +
                " créneau(x) sans date de fin. Modifiez une occurrence ou les suivantes depuis le calendrier."
            : "Choisissez vos jours et horaires : vos rendez-vous se répéteront sans date de fin.",
        ),
      );
      const configure = el(
        "button",
        "export",
        plan ? "Modifier ma semaine type" : "Configurer ma semaine type",
      );
      configure.type = "button";
      configure.onclick = agendaRecurringConfigure;
      intro.append(configure);
      if (
        plan &&
        !$("coach-agenda-month").value &&
        !$("coach-agenda-week").value
      ) {
        const range = agendaRecurringWindow();
        intro.append(
          el(
            "p",
            "hint",
            "Vue Tout : récurrences affichées du " +
              range.from +
              " au " +
              range.to +
              ". Choisissez un autre mois pour poursuivre, sans limite de fin.",
          ),
        );
      }
      const events = new Map(agendaCalendarEvents().map((e) => [e.id, e]));
      for (const node of $("coach-agenda-list").querySelectorAll(
        "[data-agenda-event]",
      )) {
        const event = events.get(node.dataset.agendaEvent);
        if (!event) continue;
        const state = agendaRecurringState(event);
        node.dataset.eventStatus = state;
        node.classList.remove(
          "agenda-status-pending",
          "agenda-status-confirmed",
        );
        node.classList.add("agenda-status-" + state);
        node.title +=
          (node.title ? " · " : "") +
          (state === "pending" ? "À préparer / en attente" : "Créé / confirmé");
      }
      const legend = $("coach-agenda-list").querySelector(
        ".agenda-calendar-legend",
      );
      if (legend) {
        legend
          .querySelectorAll("[data-recurring-legend]")
          .forEach((node) => node.remove());
        for (const [state, label] of [
          ["pending", "À préparer"],
          ["confirmed", "Créé / confirmé"],
        ]) {
          const tag = el("span", "agenda-status-" + state, label);
          tag.dataset.recurringLegend = "true";
          legend.append(tag);
        }
      }
    } finally {
      window.agendaRecurringQueryRange = previousRange;
    }
  };
  const clear = clubNetworkClear;
  clubNetworkClear = function () {
    $("agenda-week-template")?.close();
    $("agenda-recurring-event")?.close();
    $("agenda-recurring-edit")?.close();
    return clear();
  };
  renderCoachAgenda();
});

function agendaRecurringDeletedCount() {
  return Object.values(agendaRecurringRead()?.exceptions || {}).filter(
    (x) => x.deleted,
  ).length;
}
function agendaRecurringRestoreDeleted() {
  const plan = agendaRecurringRead();
  if (!plan) return;
  const revision = plan.revision;
  plan.exceptions = Object.fromEntries(
    Object.entries(plan.exceptions).filter(([, x]) => !x.deleted),
  );
  agendaRecurringCommit(plan, revision);
}
