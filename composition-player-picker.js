// Composition slots choose directory players; the existing Vestiaire header is untouched.
document.addEventListener("DOMContentLoaded", () => {
  let activeDialog = null,
    gesture = null;
  // New players can be added from any terrain step of a composition (the add
  // buttons live on the second step); slot editing stays on the first step.
  const compositionOpen = () =>
    terrainBoardKind === "composition" &&
    ![
      "resources-mode",
      "home-mode",
      "training-mode",
      "reports-mode",
      "coach-agenda-mode",
      "club-network-mode",
      "squad-mode",
      "simple-mode",
    ].some((c) => document.body.classList.contains(c));
  const compositionVisible = () =>
    compositionOpen() && workspaceFlows.terrain.index() === 0;
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
  function openSlot(id, extra = null) {
    if (activeDialog && !activeDialog.open) {
      activeDialog.remove();
      activeDialog = null;
    }
    const usable = () => (extra ? compositionOpen() : compositionVisible());
    if (activeDialog?.open || !usable()) return;
    const board = getCompositionBoard(),
      slot =
        board.players.find((p) => p.id === id) ||
        compositionEmptySlots(board).find((p) => p.id === id) ||
        (extra?.id === id ? extra : null);
    const virtual = !board.players.some((p) => p.id === id);
    // The number belongs to this match only: never copied from the player profile.
    const keeperSlot =
      slot?.role !== "sub" &&
      Number.isInteger(slot?.formationSlot) &&
      slot.formationSlot ===
        (layouts[board.formation] || layouts["4-3-3"]).length - 1;
    const defaultNumber = virtual
      ? compositionFreeNumber(board, keeperSlot ? 1 : undefined)
      : slot?.number;
    if (!slot) return;
    const owner = activeCoach.id,
      generation = clubNetworkGeneration,
      documentId = board.documentId || "draft",
      baseline = JSON.stringify(slot);
    const dialog = el("dialog", "composition-player-picker");
    dialog.id = "composition-player-picker";
    dialog.setAttribute("aria-labelledby", "composition-player-picker-title");
    activeDialog = dialog;
    let createdId = null;
    const alive = () =>
      owner === activeCoach.id &&
      generation === clubNetworkGeneration &&
      usable() &&
      (getCompositionBoard().documentId || "draft") === documentId &&
      JSON.stringify(
        getCompositionBoard().players.find((p) => p.id === id) ||
          compositionEmptySlots(getCompositionBoard()).find(
            (p) => p.id === id,
          ) ||
          (extra?.id === id ? extra : undefined),
      ) === baseline;
    const heading = el("div", "section-heading"),
      title = el("h2", "", extra ? "Ajouter un joueur" : "Choisir le joueur");
    title.id = "composition-player-picker-title";
    const close = el("button", "export", "Fermer");
    close.type = "button";
    close.onclick = () => dialog.close();
    heading.append(title, close);
    const context = el(
      "p",
      "hint",
      extra
        ? "Nouveau joueur " +
            (slot.role === "sub" ? "sur le banc" : "sur le terrain") +
            " · choisissez-le dans votre effectif ou créez sa fiche."
        : virtual
        ? "Emplacement libre · choisissez un joueur de votre effectif."
        : "Emplacement de " +
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
    let matchNumberDirty = false;
    const matchNumberLabel = el(
        "label",
        "report-field",
        "Numéro pour ce match",
      ),
      matchNumber = el("input");
    matchNumber.type = "number";
    matchNumber.min = 1;
    matchNumber.max = 99;
    matchNumber.step = 1;
    matchNumber.value = defaultNumber;
    matchNumber.oninput = () => (matchNumberDirty = true);
    matchNumber.setAttribute("aria-label", "Numéro pour ce match");
    matchNumberLabel.append(matchNumber);
    const matchNumberBox = el("div", "composition-picker-number");
    matchNumberBox.append(matchNumberLabel);
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
        (x) => x.id !== id && squadPionIsPlayer(x, p),
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
      if (
        matchNumber.value &&
        !/^(?:[1-9]|[1-9][0-9])$/.test(matchNumber.value)
      ) {
        status.textContent = "Choisissez un numéro entier de 1 à 99.";
        return false;
      }
      const next = structuredClone(getCompositionBoard());
      const other = assignedPlayer(actual);
      let target = next.players.find((x) => x.id === id);
      if (virtual) {
        if (other) next.players = next.players.filter((p) => p.id !== other.id);
        if (next.players.length >= 30) {
          status.textContent = "30 joueurs maximum.";
          return false;
        }
        target = { ...slot, id: crypto.randomUUID() };
        next.players.push(target);
      }
      const old = {
        name: target.name,
        number: target.number,
        photo: target.photo,
        // A legacy pion whose id is a profile id keeps that identity when swapped.
        squadPlayerId:
          target.squadPlayerId ??
          (squadPlayers().some((x) => x.id === target.id)
            ? target.id
            : undefined),
      };
      if (other && !virtual) {
        const counterpart = next.players.find((x) => x.id === other.id);
        Object.assign(counterpart, old);
        if (!old.squadPlayerId) {
          delete counterpart.squadPlayerId;
          // An unlinked identity must not keep a legacy pion id that names another profile.
          if (squadPlayers().some((x) => x.id === counterpart.id))
            counterpart.id = crypto.randomUUID();
        }
      }
      Object.assign(target, {
        name: actual.name,
        number:
          matchNumberDirty && matchNumber.value
            ? Number(matchNumber.value)
            : (other?.number ?? defaultNumber),
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
    if (!virtual) {
      const updateNumber = el("button", "export", "Enregistrer le numéro");
      updateNumber.type = "button";
      updateNumber.onclick = () => {
        if (!alive())
          return (status.textContent =
            "La composition a changé. Rouvrez cet emplacement.");
        if (!/^(?:[1-9]|[1-9][0-9])$/.test(matchNumber.value))
          return (status.textContent =
            "Choisissez un numéro entier de 1 à 99.");
        const next = structuredClone(getCompositionBoard());
        next.players.find((p) => p.id === id).number = Number(
          matchNumber.value,
        );
        try {
          coachStorageSet("vestiaire-draft", JSON.stringify(next));
        } catch {
          return (status.textContent =
            "Numéro non enregistré : stockage indisponible.");
        }
        state = next;
        compositionBoard = next;
        terrainKnownState = next;
        render();
        dialog.close();
      };
      matchNumberBox.append(updateNumber);
    }
    const normal = (s) =>
      String(s)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();
    function renderList() {
      list.replaceChildren();
      const rows = squadPlayers().filter((p) =>
        normal(
          p.name +
            " " +
            (p.nickname || "") +
            " " +
            squadPlayerPositions(p).join(" "),
        ).includes(normal(search.value.trim())),
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
            (p.nickname ? "« " + p.nickname + " » · " : "") +
              squadPositionsLabel(p),
          ),
        );
        row.append(squadCardAvatar(p), info, select);
        select.onclick = () => assign(p);
        list.append(row);
      }
    }
    search.oninput = renderList;
    const form = el("form", "composition-picker-form");
    const submit = el("button", "primary", "Enregistrer et placer le joueur");
    submit.type = "submit";
    // Same profile form as « Mes joueurs »: the record is created in the squad first.
    const profile = squadPlayerForm({
      message: (text) => (status.textContent = text),
      onBusy: (on) => {
        submit.disabled = on;
        if (on) status.textContent = "Préparation de la photo…";
        else if (status.textContent === "Préparation de la photo…")
          status.textContent = "";
      },
      alive: () =>
        dialog.open &&
        owner === activeCoach.id &&
        generation === clubNetworkGeneration,
    });
    profile.fill(null);
    form.append(
      profile.root,
      el(
        "p",
        "hint",
        "Le joueur sera enregistré dans Votre effectif. Son numéro se choisit pour ce match, au-dessus.",
      ),
      submit,
    );
    create.append(form);
    form.onsubmit = (e) => {
      e.preventDefault();
      if (profile.busy() || !form.reportValidity()) return;
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
      const problem = profile.validate();
      if (problem) {
        status.textContent = problem;
        return;
      }
      if (
        matchNumber.value &&
        !/^(?:[1-9]|[1-9][0-9])$/.test(matchNumber.value)
      ) {
        status.textContent = "Choisissez un numéro entier de 1 à 99.";
        return;
      }
      if (squadPlayers().length >= 100) {
        status.textContent = "Votre effectif contient déjà 100 joueurs.";
        return;
      }
      const player = { id: crypto.randomUUID(), ...profile.value() };
      // Directory first: if placement fails, the new player's record still safely exists.
      if (!squadSave([...squadPlayers(), player])) {
        status.textContent =
          "Le joueur n’a pas pu être enregistré. Votre effectif et la composition sont conservés.";
        return;
      }
      createdId = player.id;
      profile.disable();
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
        if (key === "existing") search.focus();
        else profile.focus();
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
    settings.hidden = virtual;
    settings.onclick = () => {
      if (!alive()) {
        status.textContent =
          "La composition a changé. Rouvrez cet emplacement.";
        return;
      }
      dialog.close();
      legacyEditor(id);
    };
    dialog.append(
      heading,
      context,
      matchNumberBox,
      tabs,
      existing,
      create,
      status,
      settings,
    );
    document.body.append(dialog);
    dialog.addEventListener(
      "close",
      () => {
        dialog.remove();
        if (activeDialog === dialog) activeDialog = null;
      },
      { once: true },
    );
    renderList();
    dialog.showModal();
    tabs.firstElementChild.click();
  }
  // « Ajouter un joueur » / « + Impacteur » open the same picker on a new place.
  function openNew(role = "starter") {
    if (!compositionOpen()) return false;
    const board = getCompositionBoard();
    if (board.players.length >= 30) {
      notify("30 joueurs maximum sur ce tableau.");
      return true;
    }
    // Reuse a free formation / bench place so two players never share one slot.
    const free = compositionEmptySlots(board).find((s) =>
      role === "sub" ? s.role === "sub" : s.role !== "sub",
    );
    if (free) {
      openSlot(free.id, structuredClone(free));
      return true;
    }
    const id = "new-player-" + crypto.randomUUID(),
      same = board.players.filter((p) =>
        role === "sub" ? p.role === "sub" : p.role !== "sub",
      ),
      key = role === "sub" ? "subSlot" : "formationSlot",
      used = new Set(
        same.map((p, i) => (Number.isInteger(p[key]) ? p[key] : i)),
      );
    let index = 0;
    while (used.has(index)) index++;
    openSlot(id, {
      id,
      role,
      x: 50,
      y: 50,
      ...(board.matchCreation === "blank" || role === "sub"
        ? { [key]: index }
        : {}),
      name: "",
      number: "",
      photo: "",
    });
    return true;
  }
  const legacyEditor = openEditor;
  openEditor = function (id, role = "starter") {
    if (id === null && openNew(role)) return;
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
      const p =
        state.players.find((p) => p.id === token.dataset.id) ||
        compositionEmptySlots(state).find((p) => p.id === token.dataset.id);
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
  window.compositionPlayerPicker = { open: openSlot, openNew };
  refresh();
});
