// Active report layout. Legacy fields remain readable without adding empty inputs.
function reportGrowingField(label, value, setter, options = {}) {
  const field = reportField(label, value, setter, {
      area: true,
      rows: 3,
      ...options,
    }),
    input = field.querySelector("textarea");
  const size = () => {
    input.style.height = "auto";
    input.style.height =
      Math.max(100, Math.min(input.scrollHeight, 300)) + "px";
  };
  input.addEventListener("input", size);
  requestAnimationFrame(() => {
    if (input.isConnected) size();
  });
  return field;
}
function reportPreviousNotes(title, entries) {
  const filled = entries.filter(
    ([, value]) => typeof value === "string" && value.trim(),
  );
  if (!filled.length) return null;
  const details = el("details", "report-previous-notes");
  details.append(el("summary", "", title));
  for (const [label, value] of filled) {
    const item = el("div", "report-text-block");
    item.append(el("h3", "", label), el("p", "", value));
    details.append(item);
  }
  return details;
}
function reportRenderAnalysis(root) {
  const blocks = el("div", "report-tactical-blocks");
  for (const [title, top, improve] of [
    ["Top Offensivement (Avec le ballon)", "topAttack", "improveAttack"],
    ["Top Défensif (Sans le ballon)", "topDefence", "improveDefence"],
  ]) {
    const panel = reportSection(title);
    panel.dataset.reportAnalysis = top;
    panel.append(
      reportGrowingField(
        "Points forts",
        currentReport.analysis[top],
        (v) => (currentReport.analysis[top] = v),
        { placeholder: "Les points forts et les faits qui les illustrent…" },
      ),
      reportGrowingField(
        "À améliorer",
        currentReport.analysis[improve],
        (v) => (currentReport.analysis[improve] = v),
        { placeholder: "Une ou deux pistes de progrès concrètes…" },
      ),
    );
    blocks.append(panel);
  }
  root.append(blocks);
  const extra = el("details", "report-analysis-details");
  extra.append(el("summary", "", "Compléments et évaluations sportives"));
  const ratings = reportSection("Évaluations sportives");
  reportRatings(ratings, reportSport);
  extra.append(ratings);
  const fields = el("div", "report-grid");
  for (const key of ["withBall", "withoutBall", "transitions", "setPieces"])
    fields.append(
      reportGrowingField(
        reportAnalysis[key],
        currentReport.analysis[key],
        (v) => (currentReport.analysis[key] = v),
      ),
    );
  extra.append(fields);
  root.append(extra);
  const previous = reportPreviousNotes("Notes conservées des anciens bilans", [
    ["Première période", currentReport.analysis.firstHalf],
    ["Seconde période", currentReport.analysis.secondHalf],
  ]);
  if (previous) root.append(previous);
}
function reportGroupMessagePanel() {
  const panel = reportSection("Message à transmettre au groupe");
  panel.id = "report-group-message";
  const field = reportGrowingField(
    "Message au groupe",
    currentReport.plan.summary,
    (v) => {
      currentReport.plan.summary = v;
      copy.disabled = !v.trim();
    },
  );
  const input = field.querySelector("textarea");
  input.id = "report-group-message-text";
  const copy = el("button", "export", "Copier le message");
  copy.type = "button";
  copy.id = "report-group-message-copy";
  copy.disabled = !currentReport.plan.summary.trim();
  const status = el("p", "hint");
  status.setAttribute("role", "status");
  copy.onclick = async () => {
    const text = input.value;
    if (!text.trim()) return;
    try {
      if (!navigator.clipboard?.writeText) throw Error();
      await navigator.clipboard.writeText(text);
      if (status.isConnected) status.textContent = "Message copié.";
    } catch {
      if (input.isConnected) {
        input.focus();
        input.select();
        status.textContent =
          "Copie automatique indisponible : le texte est sélectionné. Utilisez Copier sur votre appareil.";
      }
    }
  };
  panel.append(field, copy, status);
  return panel;
}
function reportRenderPlan(root) {
  const context = reportSection("Plan d’action");
  context.append(
    reportGrowingField(
      reportPlan.priority,
      currentReport.plan.priority,
      (v) => (currentReport.plan.priority = v),
    ),
  );
  const review = el("details", "report-analysis-details");
  review.append(
    el("summary", "", "Programmer un point de suivi"),
    reportField(
      reportPlan.reviewDate,
      currentReport.plan.reviewDate,
      (v) => (currentReport.plan.reviewDate = v),
      { type: "date" },
    ),
  );
  context.append(review);
  root.append(context);
  const sessions = reportSection("Séances");
  sessions.id = "report-session-plan";
  const grid = el("div", "report-grid");
  for (const [key, label] of [
    ["sessionObjective", "Objectif"],
    ["sessionExercise", "Exercice prévu"],
  ])
    grid.append(
      reportGrowingField(
        label,
        currentReport.plan[key] || "",
        (v) => (currentReport.plan[key] = v),
        {
          placeholder:
            key === "sessionObjective"
              ? "Ce que vous souhaitez travailler…"
              : "Exercice retenu ou organisation envisagée…",
        },
      ),
    );
  sessions.append(grid);
  root.append(sessions, reportGroupMessagePanel());
  const legacy = reportPreviousNotes(
    "Notes conservées des anciens plans d’action",
    [
      ["Séance archivée 1", currentReport.plan.session1],
      ["Séance archivée 2", currentReport.plan.session2],
      ["Séance archivée 3", currentReport.plan.session3],
      ["Ancienne note de réussite", currentReport.plan.success],
      ["Ancienne attribution du suivi", currentReport.plan.owner],
    ],
  );
  if (legacy) root.append(legacy);
}
function reportSportDocument() {
  const section = el("section");
  section.append(el("h2", "", "2. Analyse tactique"));
  for (const [title, top, improve] of [
    ["Top Offensivement (Avec le ballon)", "topAttack", "improveAttack"],
    ["Top Défensif (Sans le ballon)", "topDefence", "improveDefence"],
  ]) {
    const block = el("div", "report-doc-tactical");
    block.append(el("h3", "", title));
    for (const [label, key] of [
      ["Points forts", top],
      ["À améliorer", improve],
    ])
      if (currentReport.analysis[key].trim())
        reportPrintText(block, label, currentReport.analysis[key]);
    if (
      !currentReport.analysis[top].trim() &&
      !currentReport.analysis[improve].trim()
    )
      block.append(el("p", "", "Non renseigné"));
    section.append(block);
  }
  if (
    Object.keys(reportSport).some(
      (k) =>
        currentReport.ratings[k].score || currentReport.ratings[k].note.trim(),
    )
  )
    section.append(reportRatingTable(reportSport));
  for (const key of [
    "withBall",
    "withoutBall",
    "transitions",
    "setPieces",
    "firstHalf",
    "secondHalf",
  ])
    if (currentReport.analysis[key].trim())
      reportPrintText(
        section,
        reportAnalysis[key],
        currentReport.analysis[key],
      );
  return section;
}
function reportPlanDocument() {
  const section = el("section");
  section.append(el("h2", "", "5. Plan d’action"));
  for (const key of ["priority", "reviewDate"])
    if (currentReport.plan[key].trim())
      reportPrintText(section, reportPlan[key], currentReport.plan[key]);
  const sessions = el("div");
  sessions.append(el("h3", "", "Séances"));
  for (const [key, label] of [
    ["sessionObjective", "Objectif"],
    ["sessionExercise", "Exercice prévu"],
  ])
    if (currentReport.plan[key]?.trim())
      reportPrintText(sessions, label, currentReport.plan[key]);
  if (sessions.children.length > 1) section.append(sessions);
  if (currentReport.plan.summary.trim())
    reportPrintText(
      section,
      "Message à transmettre au groupe",
      currentReport.plan.summary,
    );
  // Preserve non-empty historical text in exports, without reviving removed fields.
  const legacy = [
    ["Séance archivée 1", currentReport.plan.session1],
    ["Séance archivée 2", currentReport.plan.session2],
    ["Séance archivée 3", currentReport.plan.session3],
    ["Ancienne note de réussite", currentReport.plan.success],
    ["Ancienne attribution du suivi", currentReport.plan.owner],
  ].filter(([, v]) => v.trim());
  if (legacy.length) {
    section.append(el("h3", "", "Notes antérieures"));
    for (const [label, value] of legacy) reportPrintText(section, label, value);
  }
  return section;
}
