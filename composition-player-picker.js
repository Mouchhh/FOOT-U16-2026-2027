// Composition slots choose directory players; the existing Vestiaire header is untouched.
document.addEventListener("DOMContentLoaded", () => {
  let activeDialog = null,
    gesture = null;
  const compositionVisible = () =>
    terrainBoardKind === "composition" &&
    workspaceFlows.terrain.index() === 0 &&
    ![
      "home-mode",
      "training-mode",
      "reports-mode",
      "coach-agenda-mode",
      "club-network-mode",
      "squad-mode",
      "simple-mode",
    ].some((c) => document.body.classList.contains(c));
  function refresh() {
    const on = compositionVisible();
    if (document.body.classList.contains("composition-slot-editing") !== on)
      document.body.classList.toggle("composition-slot-editing", on);
    if (on)
      for (const token of $("players").querySelectorAll(".player")) {
        const player = state.players.find((p) => p.id === token.dataset.id);
        if (player)
          token.setAttribute(
            "aria-label",
            player.name +
              ", numéro " +
              player.number +
              ". Cliquer pour choisir ou créer un joueur. Flèches pour déplacer.",
          );
      }
  }
  function openSlot(id) {
    if (activeDialog && !activeDialog.open) {
      activeDialog.remove();
      activeDialog = null;
    }
    if (activeDialog?.open || !compositionVisible()) return;
    const board = getCompositionBoard(),
      slot = board.players.find((p) => p.id === id);
    if (!slot) return;
    const owner = activeCoach.id,
      generation = clubNetworkGeneration,
      documentId = board.documentId || "draft",
      baseline = JSON.stringify(slot);
    const dialog = el("dialog", "composition-player-picker");
    dialog.id = "composition-player-picker";
    dialog.setAttribute("aria-labelledby", "composition-player-picker-title");
    activeDialog = dialog;
    let photoValue = "",
      photoVersion = 0,
      photoPending = false,
      createdId = null;
    const alive = () =>
      owner === activeCoach.id &&
      generation === clubNetworkGeneration &&
      compositionVisible() &&
      (getCompositionBoard().documentId || "draft") === documentId &&
      JSON.stringify(getCompositionBoard().players.find((p) => p.id === id)) ===
        baseline;
    const heading = el("div", "section-heading"),
      title = el("h2", "", "Choisir le joueur");
    title.id = "composition-player-picker-title";
    const close = el("button", "export", "Fermer");
    close.type = "button";
    close.onclick = () => dialog.close();
    heading.append(title, close);
    const context = el(
      "p",
      "hint",
      "Emplacement de " +
        slot.name +
        " · N° " +
        slot.number +
        ". Le placement et le rôle sur le terrain sont conservés.",
    );
    const tabs = el("div", "composition-picker-tabs");
    tabs.setAttribute("role", "tablist");
    tabs.setAttribute("aria-label", "Affecter un joueur");
    const existing = el("section", "composition-picker-panel"),
      create = el("section", "composition-picker-panel");
    existing.id = "composition-picker-existing";
    create.id = "composition-picker-create";
    existing.setAttribute("role", "tabpanel");
    create.setAttribute("role", "tabpanel");
    const status = el("p", "composition-picker-status");
    status.setAttribute("role", "status");
    const searchLabel = el(
        "label",
        "report-field",
        "Rechercher dans votre effectif",
      ),
      search = el("input");
    search.type = "search";
    search.maxLength = 100;
    searchLabel.append(search);
    const list = el("ul", "composition-picker-list");
    existing.append(searchLabel, list);
    function assignedPlayer(p) {
      return getCompositionBoard().players.find(
        (x) =>
          x.id !== id &&
          (x.squadPlayerId === p.id ||
            (!x.squadPlayerId &&
              x.name === p.name &&
              x.number === p.number &&
              x.photo === p.photo)),
      );
    }
    function assign(p) {
      if (!alive()) {
        status.textContent =
          "La composition ou le compte a changé. Fermez puis rouvrez cet emplacement.";
        return false;
      }
      const actual = squadPlayers().find((x) => x.id === p.id);
      if (!actual || JSON.stringify(actual) !== JSON.stringify(p)) {
        status.textContent =
          "Cette fiche a changé. Choisissez à nouveau le joueur.";
        renderList();
        return false;
      }
      const next = structuredClone(getCompositionBoard()),
        target = next.players.find((x) => x.id === id),
        other = assignedPlayer(actual),
        old = {
          name: target.name,
          number: target.number,
          photo: target.photo,
          squadPlayerId: target.squadPlayerId,
        };
      if (other) {
        const counterpart = next.players.find((x) => x.id === other.id);
        Object.assign(counterpart, old);
        if (!old.squadPlayerId) delete counterpart.squadPlayerId;
      }
      Object.assign(target, {
        name: actual.name,
        number: actual.number,
        photo: actual.photo,
        squadPlayerId: actual.id,
      });
      if (!valid(next)) {
        status.textContent =
          "Ces informations ne peuvent pas être placées dans la composition.";
        return false;
      }
      try {
        coachStorageSet("vestiaire-draft", JSON.stringify(next));
      } catch {
        status.textContent = createdId
          ? "Le joueur est enregistré dans Votre effectif, mais son placement n’a pas pu être sauvegardé. Réessayez."
          : "Le placement n’a pas été enregistré. La composition est conservée.";
        return false;
      }
      compositionBoard = next;
      state = next;
      terrainKnownState = next;
      render();
      if (typeof terrainHistoryRecord === "function")
        terrainHistoryRecord(terrainHistoryContext(false));
      dialog.close();
      notify(
        other
          ? "Joueurs échangés dans la composition."
          : actual.name + " affecté à cet emplacement.",
      );
      return true;
    }
    const normal = (s) =>
      String(s)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    function renderList() {
      list.replaceChildren();
      const rows = squadPlayers().filter((p) =>
        normal(p.name + " " + p.number).includes(normal(search.value.trim())),
      );
      if (!rows.length)
        list.append(
          el(
            "li",
            "hint",
            squadPlayers().length
              ? "Aucun joueur ne correspond à votre recherche."
              : "Aucun joueur enregistré. Utilisez « Créer un joueur ».",
          ),
        );
      for (const p of rows) {
        const row = el("li", "composition-picker-row"),
          info = el("div"),
          select = el(
            "button",
            "primary",
            assignedPlayer(p) ? "Échanger" : "Sélectionner",
          );
        select.type = "button";
        select.setAttribute(
          "aria-label",
          (assignedPlayer(p) ? "Échanger avec " : "Sélectionner ") + p.name,
        );
        info.append(
          el("strong", "", p.name),
          el(
            "p",
            "hint",
            "N° " + p.number + (p.position ? " · " + p.position : ""),
          ),
        );
        row.append(squadCardAvatar(p), info, select);
        select.onclick = () => assign(p);
        list.append(row);
      }
    }
    search.oninput = renderList;
    const form = el("form", "composition-picker-form");
    function field(label, type, max) {
      const wrap = el("label", "report-field", label),
        input = el("input");
      input.type = type;
      if (max) input.maxLength = max;
      wrap.append(input);
      form.append(wrap);
      return input;
    }
    const first = field("Prénom", "text", 25),
      last = field("Nom", "text", 25),
      number = field("Numéro", "number");
    first.required = last.required = number.required = true;
    number.min = 1;
    number.max = 99;
    number.value = slot.number;
    first.autocomplete = "given-name";
    last.autocomplete = "family-name";
    number.inputMode = "numeric";
    const file = field("Photo du joueur (facultatif)", "file");
    file.accept = "image/*";
    const preview = el("img", "composition-picker-photo");
    preview.alt = "Photo du nouveau joueur";
    preview.hidden = true;
    const removePhoto = el("button", "export", "Retirer la photo");
    removePhoto.type = "button";
    removePhoto.hidden = true;
    const submit = el("button", "primary", "Enregistrer et placer le joueur");
    submit.type = "submit";
    form.append(
      el(
        "p",
        "hint",
        "Prénom et nom : 25 caractères maximum au total. Le joueur sera enregistré dans Votre effectif.",
      ),
      preview,
      removePhoto,
      submit,
    );
    create.append(form);
    removePhoto.onclick = () => {
      photoVersion++;
      photoPending = false;
      photoValue = "";
      file.value = "";
      preview.hidden = removePhoto.hidden = true;
      submit.disabled = false;
    };
    file.onchange = async () => {
      const image = file.files[0];
      if (!image) return;
      if (!image.type.startsWith("image/") || image.size > 15 * 1024 * 1024) {
        status.textContent = "Choisissez une photo de moins de 15 Mo.";
        return;
      }
      const version = ++photoVersion;
      photoPending = true;
      status.textContent = "Préparation de la photo…";
      submit.disabled = true;
      let bitmap;
      try {
        bitmap = await createImageBitmap(image);
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 180;
        const side = Math.min(bitmap.width, bitmap.height);
        canvas
          .getContext("2d")
          .drawImage(
            bitmap,
            (bitmap.width - side) / 2,
            (bitmap.height - side) / 2,
            side,
            side,
            0,
            0,
            180,
            180,
          );
        if (
          version !== photoVersion ||
          !dialog.open ||
          owner !== activeCoach.id ||
          generation !== clubNetworkGeneration
        )
          return;
        photoValue = canvas.toDataURL("image/jpeg", 0.72);
        preview.src = photoValue;
        preview.hidden = removePhoto.hidden = false;
        status.textContent = "";
      } catch {
        if (version === photoVersion)
          status.textContent = "Photo illisible : essayez un JPEG ou PNG.";
      } finally {
        bitmap?.close();
        if (version === photoVersion) {
          photoPending = false;
          submit.disabled = false;
        }
      }
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      if (photoPending || !form.reportValidity()) return;
      if (!alive()) {
        status.textContent =
          "La composition ou le compte a changé. Fermez puis rouvrez cet emplacement.";
        return;
      }
      if (createdId) {
        const p = squadPlayers().find((x) => x.id === createdId);
        if (p) assign(p);
        else
          status.textContent =
            "La fiche créée n’est plus disponible dans Votre effectif.";
        return;
      }
      if (!first.value.trim() || !last.value.trim()) {
        status.textContent = "Renseignez le prénom et le nom du joueur.";
        return;
      }
      const name = (first.value.trim() + " " + last.value.trim()).trim();
      if (name.length > 25) {
        status.textContent =
          "Le prénom et le nom réunis doivent tenir sur 25 caractères.";
        return;
      }
      if (squadPlayers().length >= 100) {
        status.textContent = "Votre effectif contient déjà 100 joueurs.";
        return;
      }
      const player = {
        id: crypto.randomUUID(),
        name,
        number: Number(number.value),
        photo: photoValue,
        position: "",
        foot: "",
      };
      // Directory first: if placement fails, the new player's record still safely exists.
      if (!squadSave([...squadPlayers(), player])) {
        status.textContent =
          "Le joueur n’a pas pu être enregistré. Votre effectif et la composition sont conservés.";
        return;
      }
      createdId = player.id;
      for (const input of form.querySelectorAll("input")) input.disabled = true;
      submit.textContent = "Réessayer le placement";
      squadRender();
      assign(player);
      renderList();
    };
    for (const [key, label, panel] of [
      ["existing", "Choisir un joueur", existing],
      ["create", "Créer un joueur", create],
    ]) {
      const tab = el("button", "", label);
      tab.type = "button";
      tab.id = "composition-picker-tab-" + key;
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-controls", panel.id);
      panel.setAttribute("aria-labelledby", tab.id);
      tab.onclick = () => {
        for (const t of tabs.children) {
          const selected = t === tab;
          t.setAttribute("aria-selected", String(selected));
          t.tabIndex = selected ? 0 : -1;
        }
        existing.hidden = key !== "existing";
        create.hidden = key !== "create";
        (key === "existing" ? search : first).focus();
        status.textContent = "";
      };
      tab.onkeydown = (e) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
        e.preventDefault();
        const items = [...tabs.children],
          index = items.indexOf(tab),
          next =
            e.key === "Home"
              ? 0
              : e.key === "End"
                ? items.length - 1
                : (index + (e.key === "ArrowRight" ? 1 : items.length - 1)) %
                  items.length;
        items[next].click();
        items[next].focus();
      };
      tabs.append(tab);
    }
    const settings = el("button", "export", "Autres réglages du pion");
    settings.type = "button";
    settings.onclick = () => {
      if (!alive()) {
        status.textContent =
          "La composition a changé. Rouvrez cet emplacement.";
        return;
      }
      dialog.close();
      legacyEditor(id);
    };
    dialog.append(heading, context, tabs, existing, create, status, settings);
    document.body.append(dialog);
    dialog.addEventListener(
      "close",
      () => {
        photoVersion++;
        dialog.remove();
        if (activeDialog === dialog) activeDialog = null;
      },
      { once: true },
    );
    renderList();
    dialog.showModal();
    tabs.firstElementChild.click();
  }
  const legacyEditor = openEditor;
  openEditor = function (id, role = "starter") {
    if (
      compositionVisible() &&
      getCompositionBoard().players.some((p) => p.id === id)
    )
      return openSlot(id);
    return legacyEditor(id, role);
  };
  const pitch = $("pitch");
  pitch.addEventListener(
    "pointerdown",
    (e) => {
      gesture = null;
      if (e.button !== 0 || mode !== "move" || !compositionVisible()) return;
      const token = e.target.closest(".player");
      if (!token || token.dataset.side === "opponent") return;
      const p = state.players.find((p) => p.id === token.dataset.id);
      if (!p) return;
      gesture = {
        id: p.id,
        pointer: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        owner: activeCoach.id,
        moved: false,
        px: p.x,
        py: p.y,
      };
    },
    true,
  );
  pitch.addEventListener(
    "pointermove",
    (e) => {
      if (
        gesture &&
        gesture.pointer === e.pointerId &&
        Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 6
      )
        gesture.moved = true;
    },
    true,
  );
  pitch.addEventListener(
    "pointerup",
    (e) => {
      const g = gesture;
      gesture = null;
      if (
        !g ||
        g.pointer !== e.pointerId ||
        g.moved ||
        Math.hypot(e.clientX - g.x, e.clientY - g.y) > 6 ||
        g.owner !== activeCoach.id ||
        !compositionVisible() ||
        mode !== "move"
      )
        return;
      const p = state.players.find((p) => p.id === g.id);
      if (p) {
        p.x = g.px;
        p.y = g.py;
        const token = $("players").querySelector('[data-id="' + p.id + '"]');
        if (token) {
          token.style.left = p.x + "%";
          token.style.top = p.y + "%";
        }
      }
      queueMicrotask(() => {
        if (g.owner === activeCoach.id) openSlot(g.id);
      });
    },
    true,
  );
  pitch.addEventListener("pointercancel", () => (gesture = null), true);
  pitch.addEventListener(
    "click",
    (e) => {
      if (e.detail !== 0 || !compositionVisible() || mode !== "move") return;
      const token = e.target.closest(".player");
      if (token && token.dataset.side !== "opponent") {
        e.preventDefault();
        openSlot(token.dataset.id);
      }
    },
    true,
  );
  const renderBefore = render;
  render = function () {
    renderBefore();
    refresh();
  };
  new MutationObserver(refresh).observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
  });
  new MutationObserver(refresh).observe(workspaceFlows.terrain.root, {
    attributes: true,
    attributeFilter: ["data-step"],
  });
  const clear = clubNetworkClear;
  clubNetworkClear = function () {
    activeDialog?.close();
    gesture = null;
    clear();
    refresh();
  };
  window.compositionPlayerPicker = { open: openSlot };
  refresh();
});
