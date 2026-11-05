// One editor, reusing canonical inputs, archive actions and export handlers.
document.addEventListener("DOMContentLoaded", () => {
  const root = $("task-causerie"),
    form = $("match-plan-form"),
    options = $("causerie-eleven-options");
  if (!root || !form || !options) return;
  root.classList.add("causerie-clean-editor");
  const legacy = el("div");
  legacy.id = "causerie-legacy-fields";
  legacy.hidden = true;
  const header = form.querySelector(".section-heading"),
    actions = el("div", "causerie-clean-actions");
  const submit = form.querySelector("[type=submit]"),
    close = $("match-plan-close"),
    ppt = $("causerie-download"),
    oldActions = form.querySelector(".causerie-direct-actions"),
    canva = oldActions?.querySelector("[data-causerie-export]");
  submit.textContent = "Valider";
  ppt.textContent = "Télécharger en PPT";
  close.textContent = "Fermer la causerie";
  close.setAttribute("aria-label", "Fermer la causerie");
  if (canva) {
    canva.textContent = "Mon Canva ↗";
    canva.className = "causerie-canva-badge";
    canva.setAttribute(
      "aria-label",
      "Mon Canva · créer ou ouvrir ma présentation",
    );
    header.append(canva);
  }
  actions.append(ppt, submit, close);
  actions.setAttribute("aria-label", "Actions de la causerie");
  actions.setAttribute("role", "group");
  const info = el("div", "causerie-clean-match");
  for (const [id, title] of [
    ["match-plan-date", "Date du match"],
    ["match-plan-match", "Match"],
  ]) {
    const input = $(id),
      label = input.closest("label");
    label.firstChild.textContent = title;
    info.append(label);
  }
  const opponent = el("section", "causerie-clean-opponent"),
    opponentLabel = $("match-plan-opponent").closest("label");
  opponentLabel.firstChild.textContent = "Information adversaire";
  $("match-plan-opponent").rows = 7;
  $("match-plan-opponent").placeholder =
    "Organisation, forces et points à exploiter…";
  opponent.append(opponentLabel);
  const grid = el("div", "causerie-clean-grid"),
    cards = new Map();
  const definitions = [
    ["defensive", "Animation Défensive", $("match-plan-defensive")],
    ["offensive", "Animation Offensive", $("match-plan-offensive")],
    [
      "offDef",
      "Transition OFF / DEF",
      options.querySelector('[aria-label="Transition OFF / DEF · À la perte"]'),
    ],
    [
      "defOff",
      "Transition DEF / OFF",
      options.querySelector(
        '[aria-label="Transition DEF / OFF · À la récupération"]',
      ),
    ],
    [
      "setPiecesAgainst",
      "CPA Défensif",
      options.querySelector('[aria-label="CPA défensifs"]'),
    ],
    [
      "setPiecesFor",
      "CPA Offensif",
      options.querySelector('[aria-label="CPA offensifs"]'),
    ],
    [
      "closingMessage",
      "Mot d’ordre final",
      options.querySelector('[aria-label="Mot d’ordre final"]'),
    ],
  ];
  for (const [key, title, input] of definitions) {
    const card = el("section", "causerie-clean-card");
    card.dataset.phase = key;
    card.append(el("h3", "", title));
    const label = input.closest("label");
    label.firstChild.textContent = "Consignes";
    input.rows = 8;
    input.setAttribute("aria-label", title + " · Consignes");
    input.placeholder =
      key === "closingMessage"
        ? "Le message à transmettre au groupe…"
        : "Vos consignes essentielles…";
    card.append(label);
    grid.append(card);
    cards.set(key, card);
  }
  // Move unused controls rather than deleting their saved values or DOM hooks.
  for (const selector of [
    ".match-plan-top",
    ".match-plan-context-grid",
    ".match-plan-objectives",
    ".match-plan-animations",
  ]) {
    const node = form.querySelector(selector);
    if (node) legacy.append(node);
  }
  legacy.append(options.querySelector(".causerie-eleven-fields"));
  const format = options
    .querySelector('select[aria-label="Format des animations des 11 slides"]')
    .closest("label");
  format.classList.add("causerie-clean-format");
  const body = el("div", "causerie-clean-body");
  const exportOptions = el("details", "causerie-export-options");
  exportOptions.append(el("summary", "", "Options d’export"), format);
  header.append(exportOptions);
  body.append(info, opponent, grid, actions);
  header.after(body);
  form.append(legacy);
  const status = $("causerie-ppt-status");
  if (status) actions.before(status);
  for (const button of root.querySelectorAll("button"))
    if (button.textContent.trim() === "Gérer mes visuels") button.remove();
  $("causerie-demos-open")?.remove();
  $("workflow-match-links")?.remove();
  $("personal-canva-download")?.setAttribute("hidden", "");
  root.querySelector(".tactical-animation-attach")?.setAttribute("hidden", "");
  options.hidden = true;
  function integrate() {
    for (const section of options.querySelectorAll(
      ".causerie-eleven-phases>section",
    )) {
      const key = section.dataset.phase,
        card = cards.get(key);
      if (!card) continue;
      const wasOpen = card.querySelector(".causerie-clean-library")?.open;
      card.querySelector(".causerie-clean-library")?.remove();
      const drawer = el("details", "causerie-clean-library"),
        summary = el("summary", "", "Exercices & animations · Mon Club");
      drawer.open = !!wasOpen;
      drawer.append(summary);
      section.querySelector("h4")?.remove();
      drawer.append(section);
      card.append(drawer);
      const count = () => {
        const n = section.querySelectorAll(
          "input[type=checkbox]:checked",
        ).length;
        summary.textContent = n
          ? n +
            " contenu" +
            (n > 1 ? "s" : "") +
            " sélectionné" +
            (n > 1 ? "s" : "") +
            " · Mon Club"
          : "Choisir dans Mon Club";
      };
      section.addEventListener("change", count);
      count();
    }
  }
  document.addEventListener("causerie:options-rendered", integrate);
  integrate();
  // Preserve the options module status even though its old container is hidden.
  const optionStatus = options.querySelector("[role=status]");
  if (optionStatus) actions.before(optionStatus);
  const leftovers = form.querySelector(":scope>.report-actions");
  if (leftovers && !leftovers.querySelector("button")) leftovers.hidden = true;
});
