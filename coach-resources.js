// Curated reference documents. Files are static; no coach documents are moved.
(() => {
  const categories = [
    ["exercises", "Fiches d’exercices"],
    ["club", "Documents du club"],
    ["tactics", "Guides tactiques"],
    ["protocols", "Protocoles de séance"],
    ["media", "Vidéos et animations"],
  ];
  const documents = [
    {
      id: "coups-de-pied-arretes",
      title: "Les coups de pied arrêtés",
      category: "tactics",
      description:
        "Repères, rôles et schémas pour travailler les coups de pied arrêtés.",
      kind: "html",
      format: "Guide",
      tags: ["CPA", "Corners", "Coups francs"],
      url: "assets/resources/coups-de-pied-arretes.html",
    },
    {
      id: "preparation-physique",
      title: "La préparation physique",
      category: "protocols",
      description:
        "Qualités physiques, reprise et progression du travail avec ballon.",
      kind: "html",
      format: "Guide",
      tags: ["Physique", "Reprise", "Préparation"],
      url: "assets/resources/preparation-physique.html",
    },
    {
      id: "planification-par-blocs",
      title: "La planification par blocs",
      category: "protocols",
      description:
        "Organiser la saison et construire une progression par blocs.",
      kind: "html",
      format: "Guide",
      tags: ["Planification", "Saison", "Progression"],
      url: "assets/resources/planification-par-blocs.html",
    },
    {
      id: "construire-une-seance",
      title: "Construire une séance",
      category: "protocols",
      description: "Préparer, structurer et animer une séance d’entraînement.",
      kind: "html",
      format: "Guide",
      tags: ["Séance", "Exercice", "Situation", "Jeu"],
      url: "assets/resources/construire-une-seance.html",
    },
    {
      id: "echauffement-avant-match",
      title: "L’échauffement d’avant-match",
      category: "protocols",
      description:
        "Déroulé et étapes pour préparer les joueurs avant le match.",
      kind: "html",
      format: "Guide",
      tags: ["Échauffement", "Avant-match", "Préparation"],
      url: "assets/resources/echauffement-avant-match.html",
    },
    {
      id: "analyse-video",
      title: "L’analyse vidéo",
      category: "media",
      description:
        "Filmer, découper et partager les séquences utiles au groupe.",
      kind: "html",
      format: "Guide",
      tags: ["Vidéo", "Analyse", "Adversaire"],
      url: "assets/resources/analyse-video.html",
    },

    {
      id: "progression-crm-foot",
      title: "Progression CRM foot",
      category: "protocols",
      description:
        "Repères sur les durées, les séquences, la récupération, les espaces et les intérêts des jeux à effectif réduit.",
      kind: "pdf",
      format: "PDF",
      pages: 1,
      tags: ["CRM", "Jeux réduits", "Entraînement"],
      url: "assets/resources/progression-crm-foot.pdf",
      preview: "assets/resources/progression-crm-foot.webp",
      previewAlt:
        "Tableau de progression des jeux, de 1 contre 1 à 8 contre 8 et plus.",
    },
  ];
  const nav = document.querySelector(".app-navigation");
  const button = el("button", "", "Ressources");
  button.id = "view-resources";
  button.type = "button";
  button.setAttribute("aria-controls", "coach-resources");
  button.setAttribute("aria-pressed", "false");
  nav.insertBefore(button, $("view-club-network"));
  const root = el("section", "coach-resources");
  root.id = "coach-resources";
  root.hidden = true;
  root.setAttribute("aria-labelledby", "resources-heading");
  root.innerHTML = `<div class="resources-heading"><p class="eyebrow">LA BOÎTE À OUTILS DES COACHS</p><h1 id="resources-heading">Ressources</h1><p>Vos documents de référence pour préparer et encadrer les séances.</p></div>
    <div class="resources-search"><label for="resources-search">Rechercher une ressource</label><input id="resources-search" type="search" placeholder="Un titre, un mot-clé…" maxlength="300"><input id="resources-category" type="hidden" value=""></div>
    <div id="resources-categories" class="resources-categories" role="group" aria-label="Catégories de ressources"></div>
    <p id="resources-count" class="hint" role="status" aria-live="polite"></p><div id="resources-grid" class="resources-grid"></div>`;
  document.querySelector("main").append(root);
  const normalize = (value) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  function render() {
    const category = $("resources-category").value;
    const query = normalize($("resources-search").value.trim());
    const filtered = documents.filter(
      (d) =>
        (!category || d.category === category) &&
        normalize([d.title, d.description, ...d.tags].join(" ")).includes(
          query,
        ),
    );
    const groups = $("resources-categories");
    groups.replaceChildren();
    for (const [key, label] of [["", "Tout"], ...categories]) {
      const count = documents.filter((d) => !key || d.category === key).length;
      const tab = el("button", "export", label + " · " + count);
      tab.type = "button";
      tab.dataset.category = key;
      tab.setAttribute("aria-pressed", String(key === category));
      tab.onclick = () => {
        $("resources-category").value = key;
        render();
        $("resources-category").dispatchEvent(
          new Event("change", { bubbles: true }),
        );
      };
      groups.append(tab);
    }
    $("resources-count").textContent =
      filtered.length + " ressource" + (filtered.length > 1 ? "s" : "");
    const grid = $("resources-grid");
    grid.replaceChildren();
    for (const doc of filtered) {
      const card = el("article", "resource-card");
      card.dataset.resource = doc.id;
      const preview = el("button", "resource-preview");
      preview.type = "button";
      preview.setAttribute("aria-label", "Consulter " + doc.title);
      preview.onclick = () => openDocument(doc);
      if (doc.preview) {
        const image = document.createElement("img");
        image.src = doc.preview;
        image.alt = doc.previewAlt || doc.title;
        image.loading = "lazy";
        preview.append(image);
      } else preview.append(resourceIllustration(doc.id));
      const content = el("div", "resource-card-content");
      content.append(
        el("p", "eyebrow", categories.find((c) => c[0] === doc.category)[1]),
        el("h2", "", doc.title),
        el("p", "", doc.description),
      );
      if (doc.pages)
        content.append(el("p", "resource-meta", doc.pages + " page"));
      const category = content.querySelector(".eyebrow");
      category.prepend(
        resourceCategoryIcon(
          resourcePreviewArt[doc.id]?.icon ||
            (doc.category === "protocols" ? "planning" : "tactics"),
        ),
      );
      const actions = el("div", "resource-actions");
      const view = el("button", "primary", "Consulter");
      view.type = "button";
      view.onclick = () => openDocument(doc);
      actions.append(view);
      if (doc.kind !== "link") actions.append(downloadLink(doc));
      content.append(actions);
      card.append(preview, content);
      grid.append(card);
    }
    if (!filtered.length) {
      const empty = el("div", "resources-empty");
      empty.append(
        el("h2", "", "Aucune ressource dans cette sélection"),
        el(
          "p",
          "",
          "Choisissez une autre catégorie ou modifiez votre recherche.",
        ),
      );
      const reset = el("button", "export", "Voir toutes les ressources");
      reset.type = "button";
      reset.onclick = () => {
        $("resources-category").value = "";
        $("resources-search").value = "";
        render();
        $("resources-search").dispatchEvent(
          new Event("input", { bubbles: true }),
        );
      };
      empty.append(reset);
      grid.append(empty);
    }
  }
  function downloadLink(doc) {
    const link = el(
      "a",
      "export",
      doc.kind === "pdf" ? "Télécharger le PDF" : "Télécharger le document",
    );
    link.href = doc.url;
    link.download = doc.url.split("/").pop().split("?")[0];
    return link;
  }
  function openDocument(doc) {
    if (doc.kind === "link") {
      window.open(doc.url, "_blank", "noopener");
      return;
    }
    $("resource-viewer")?.remove();
    const dialog = el("dialog", "resource-viewer");
    dialog.id = "resource-viewer";
    dialog.setAttribute("aria-labelledby", "resource-viewer-title");
    const head = el("div", "resource-viewer-heading");
    const title = el("h2", "", doc.title);
    title.id = "resource-viewer-title";
    const close = el("button", "export", "Fermer");
    close.type = "button";
    close.onclick = () => dialog.close();
    head.append(title, close);
    const actions = el("div", "resource-actions");
    const original = el(
      "a",
      "export",
      doc.kind === "pdf" ? "Ouvrir le PDF" : "Ouvrir le document",
    );
    original.href = doc.url;
    original.target = "_blank";
    original.rel = "noopener";
    const zoom = el("button", "export", "Agrandir le tableau");
    zoom.type = "button";
    zoom.setAttribute("aria-pressed", "false");
    const canvas = el("div", "resource-viewer-canvas");
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "region");
    canvas.setAttribute(
      "aria-label",
      "Aperçu du document, défilable après agrandissement",
    );
    if (doc.kind === "html") {
      // An isolated document preserves the supplied layout and diagrams.
      const frame = document.createElement("iframe");
      frame.className = "resource-html-frame";
      frame.title = doc.title;
      frame.setAttribute("sandbox", "allow-scripts");
      frame.src = doc.url;
      canvas.classList.add("resource-html-canvas");
      canvas.append(frame);
      zoom.hidden = true;
    } else if (doc.kind === "video") {
      const video = document.createElement("video");
      video.controls = true;
      video.preload = "metadata";
      video.src = doc.url;
      video.style.width = "100%";
      canvas.append(video);
      zoom.hidden = true;
    } else {
      const image = document.createElement("img");
      image.src = doc.preview || doc.url;
      image.alt = doc.previewAlt || doc.title;
      canvas.append(image);
    }
    zoom.onclick = () => {
      const on = canvas.classList.toggle("resource-zoomed");
      zoom.setAttribute("aria-pressed", String(on));
      zoom.textContent = on ? "Adapter à l’écran" : "Agrandir le tableau";
    };
    actions.append(zoom, original, downloadLink(doc));
    dialog.append(head, actions, canvas);
    document.body.append(dialog);
    dialog.addEventListener(
      "close",
      () => {
        dialog.remove();
        if (root.getClientRects().length)
          root
            .querySelector(
              `[data-resource="${doc.id}"] .resource-card-content button`,
            )
            ?.focus({ preventScroll: true });
      },
      { once: true },
    );
    dialog.showModal();
  }
  function hide() {
    document.body.classList.remove("resources-mode");
    root.hidden = true;
    button.classList.remove("active");
    button.setAttribute("aria-pressed", "false");
  }
  function open() {
    if (
      !workspaceNavigationCanLeave() ||
      (clubNetworkPrivateRequested && !clubNetworkBound())
    )
      return false;
    window.workspaceMenus?.close();
    hideClubHome();
    setTrainingView(false);
    setReportView(false);
    setCoachAgenda(false);
    clubNetworkShowView(false);
    stopAnimation();
    document.body.classList.remove("squad-mode");
    $("coach-squad-dialog").hidden = true;
    document.body.classList.add("resources-mode");
    root.hidden = false;
    for (const item of nav.querySelectorAll(":scope>button")) {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    }
    render();
    window.workspaceFraming?.request({ scope: "main" });
    return true;
  }
  button.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...nav.querySelectorAll(":scope>button:not([disabled])")];
    const index = buttons.indexOf(button);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? buttons.length - 1
          : (index + (event.key === "ArrowRight" ? 1 : buttons.length - 1)) %
            buttons.length;
    buttons[next]?.focus({ preventScroll: true });
  });
  button.onclick = () =>
    workspaceNavigationRouting ? open() : workspaceNavigation.run(button.id);
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target.closest(
        "#workspace-navigation>button,.brand",
      );
      if (
        target &&
        target !== button &&
        document.body.classList.contains("resources-mode") &&
        workspaceNavigationCanLeave()
      )
        hide();
    },
    true,
  );
  $("resources-search").addEventListener("input", render);
  window.coachResources = {
    open,
    render,
    documents: () => documents.map((d) => ({ ...d, tags: [...d.tags] })),
  };
  render();
})();
