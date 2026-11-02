// Coach-scoped weekly appointments; recurrence never auto-saves training documents.
const agendaRecurringTypes = {
  training: { label: "Entraînement", short: "Séance", kind: "training" },
  match: { label: "Match", short: "Match", kind: "match" },
  video: { label: "Séance vidéo", short: "Vidéo", kind: "video" },
  meeting: { label: "Réunion / autre", short: "Réunion", kind: "meeting" },
};
const agendaRecurringKey = "vestiaire-agenda-week-template";
function agendaRecurringValid(plan) {
  if (
    !plan ||
    plan.version !== 1 ||
    !["month", "season", "custom"].includes(plan.scope) ||
    !Number.isSafeInteger(plan.revision) ||
    plan.revision < 0 ||
    typeof plan.enabled !== "boolean" ||
    !trainingDateValid(plan.from) ||
    !trainingDateValid(plan.to) ||
    plan.to < plan.from ||
    Date.parse(plan.to + "T12:00:00Z") - Date.parse(plan.from + "T12:00:00Z") >
      399 * 86400000 ||
    typeof plan.category !== "string" ||
    plan.category.length > 30 ||
    !Array.isArray(plan.slots) ||
    plan.slots.length > 20 ||
    (plan.enabled && !plan.slots.length) ||
    !plan.statuses ||
    typeof plan.statuses !== "object" ||
    Array.isArray(plan.statuses) ||
    Object.keys(plan.statuses).length > 2000
  )
    return false;
  const ids = new Set(),
    times = new Set();
  for (const s of plan.slots) {
    if (
      !s ||
      typeof s.id !== "string" ||
      !/^[a-zA-Z0-9-]{1,80}$/.test(s.id) ||
      ids.has(s.id) ||
      !Number.isInteger(s.day) ||
      s.day < 1 ||
      s.day > 7 ||
      !Object.hasOwn(agendaRecurringTypes, s.type) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time) ||
      typeof s.title !== "string" ||
      s.title.length > 100 ||
      !["pending", "confirmed"].includes(s.status)
    )
      return false;
    const key = [s.day, s.type, s.time].join("|");
    if (times.has(key)) return false;
    ids.add(s.id);
    times.add(key);
  }
  return Object.entries(plan.statuses).every(
    ([key, status]) =>
      /^recurring:[a-zA-Z0-9-]{1,80}:\d{4}-\d{2}-\d{2}$/.test(key) &&
      ["pending", "confirmed"].includes(status),
  );
}
function agendaRecurringRead() {
  try {
    const data = JSON.parse(coachStorageGet(agendaRecurringKey) || "null");
    return agendaRecurringValid(data) ? data : null;
  } catch {
    return null;
  }
}
function agendaRecurringOccurrences(plan = agendaRecurringRead()) {
  if (!plan?.enabled || !agendaRecurringValid(plan)) return [];
  const rows = [];
  for (
    let date = plan.from;
    date <= plan.to;
    date = agendaCalendarAdd(date, 1)
  ) {
    const day = new Date(date + "T12:00:00Z").getUTCDay() || 7;
    for (const slot of plan.slots)
      if (slot.day === day) {
        const type = agendaRecurringTypes[slot.type],
          id = "recurring:" + slot.id + ":" + date;
        rows.push({
          id,
          kind: type.kind,
          label: type.short,
          date,
          time: slot.time,
          title: slot.title || type.label,
          category: plan.category,
          status: plan.statuses[id] || slot.status,
          recurring: { slotId: slot.id, originalDate: date, type: slot.type },
          _agendaKeys: ["event:" + id],
          open: () => agendaRecurringOpen(id),
        });
      }
  }
  return rows;
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
  actions.append(toggle, configure);
  dialog.append(state, actions, status);
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
  const month =
      $("coach-agenda-month").value || agendaCalendarToday().slice(0, 7),
    year = Number(month.slice(0, 4)) - (Number(month.slice(5)) < 7 ? 1 : 0);
  dialog.append(
    el(
      "p",
      "hint",
      "Choisissez vos jours, horaires et types de rendez-vous. La récurrence est affichée chaque semaine entre les dates choisies, sans créer de fiches de séance vides. Les documents et rencontres déjà enregistrés sont conservés.",
    ),
  );
  const form = el("form"),
    fields = el("div", "recurring-period");
  let dirty = false;
  function field(label, type, value) {
    const wrap = el("label", "report-field", label),
      input = el("input");
    input.type = type;
    input.value = value;
    input.setAttribute("aria-label", label);
    wrap.append(input);
    fields.append(wrap);
    return input;
  }
  const modeLabel = el("label", "report-field", "Période"),
    mode = el("select");
  mode.setAttribute("aria-label", "Période");
  for (const [value, label] of [
    ["month", "Mois affiché"],
    ["season", "Saison juillet → juin"],
    ["custom", "Dates personnalisées"],
  ])
    mode.append(new Option(label, value));
  mode.value = stored?.scope || "month";
  modeLabel.append(mode);
  fields.append(modeLabel);
  const from = field("Du", "date", stored?.from || month + "-01"),
    to = field(
      "Au",
      "date",
      stored?.to ||
        agendaCalendarAdd(agendaCalendarMonth(month, 1) + "-01", -1),
    ),
    category = field(
      "Catégorie / équipe",
      "text",
      stored?.category || getCompositionBoard().category || "",
    );
  from.required = to.required = true;
  category.maxLength = 30;
  if (
    stored &&
    ((mode.value === "month" &&
      (from.value !== month + "-01" ||
        to.value !==
          agendaCalendarAdd(agendaCalendarMonth(month, 1) + "-01", -1))) ||
      (mode.value === "season" &&
        (from.value !== year + "-07-01" || to.value !== year + 1 + "-06-30")))
  )
    mode.value = "custom";
  const activeLabel = el("label", "recurring-enabled"),
    active = el("input");
  active.type = "checkbox";
  active.checked = stored?.enabled ?? true;
  active.setAttribute("aria-label", "Activer la récurrence");
  activeLabel.append(active, document.createTextNode(" Activer la récurrence"));
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
    };
    remove.onclick = () => {
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
  function draft() {
    return {
      version: 1,
      revision: revision + 1,
      enabled: active.checked,
      scope: mode.value,
      from: from.value,
      to: to.value,
      category: category.value.trim(),
      slots: rows.map((r) => ({
        id: r.id,
        day: Number(r.day.value),
        type: r.type.value,
        time: r.time.value,
        title: r.title.value.trim(),
        status: r.status.value,
      })),
      statuses: Object.fromEntries(
        Object.entries(stored?.statuses || {}).filter(([key]) => {
          const [, id, date] = key.split(":");
          return (
            rows.some((r) => r.id === id) &&
            date >= from.value &&
            date <= to.value
          );
        }),
      ),
    };
  }
  function refresh() {
    const plan = draft();
    add.disabled = rows.length >= 20;
    if (!agendaRecurringValid(plan)) {
      preview.textContent =
        "Renseignez une période valide (400 jours maximum), puis le jour, le type et l’horaire de chaque créneau. Deux créneaux identiques ne peuvent pas être enregistrés.";
      return;
    }
    const occurrences = agendaRecurringOccurrences(plan);
    preview.textContent = plan.enabled
      ? occurrences.length +
        " rendez-vous hebdomadaire(s) sur cette période. Les rendez-vous déjà enregistrés à ces créneaux prennent leur place."
      : "Récurrence en pause. Les rendez-vous déjà enregistrés restent dans votre agenda.";
  }
  mode.onchange = () => {
    if (mode.value === "month") {
      from.value = month + "-01";
      to.value = agendaCalendarAdd(agendaCalendarMonth(month, 1) + "-01", -1);
    } else if (mode.value === "season") {
      from.value = year + "-07-01";
      to.value = year + 1 + "-06-30";
    }
    dirty = true;
    refresh();
  };
  from.onchange = to.onchange = () => {
    mode.value = "custom";
  };
  add.onclick = () => {
    addSlot();
    dirty = true;
  };
  form.append(fields, activeLabel, list, add, preview, status, save);
  dialog.append(form);
  for (const slot of stored?.slots || []) addSlot(slot);
  refresh();
  form.addEventListener("input", () => {
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
    if (!form.reportValidity()) return;
    const plan = draft();
    if (
      activeCoach.id !== owner ||
      (agendaRecurringRead()?.revision || 0) !== revision
    ) {
      status.textContent =
        "Le coach ou la semaine type a changé. Fermez puis rouvrez le réglage.";
      return;
    }
    if (!agendaRecurringValid(plan)) {
      refresh();
      status.textContent =
        "Vérifiez les dates et les créneaux. Ajoutez un créneau ou désactivez la récurrence.";
      return;
    }
    try {
      coachStorageSet(agendaRecurringKey, JSON.stringify(plan));
      dirty = false;
      dialog.close();
      renderCoachAgenda();
      notify(
        "Votre semaine type est enregistrée dans votre agenda sur cet appareil.",
      );
    } catch {
      status.textContent =
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
    render();
    const plan = agendaRecurringRead();
    intro.replaceChildren(
      el(
        "strong",
        "",
        plan
          ? plan.enabled
            ? "Votre semaine type est active"
            : "Votre semaine type est en pause"
          : "Quand ont lieu vos séances ?",
      ),
      el(
        "p",
        "hint",
        plan
          ? plan.slots.length +
              " créneau(x) · du " +
              plan.from +
              " au " +
              plan.to +
              ". Modifiez les créneaux, ou une seule occurrence depuis le calendrier."
          : "Choisissez vos jours et horaires pour afficher automatiquement vos rendez-vous du mois ou de la saison.",
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
    const events = new Map(agendaCalendarEvents().map((e) => [e.id, e]));
    for (const node of $("coach-agenda-list").querySelectorAll(
      "[data-agenda-event]",
    )) {
      const event = events.get(node.dataset.agendaEvent);
      if (!event) continue;
      const state = agendaRecurringState(event);
      node.dataset.eventStatus = state;
      node.classList.remove("agenda-status-pending", "agenda-status-confirmed");
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
  };
  const clear = clubNetworkClear;
  clubNetworkClear = function () {
    $("agenda-week-template")?.close();
    $("agenda-recurring-event")?.close();
    return clear();
  };
  renderCoachAgenda();
});
