// Destructive actions share one accessible confirmation, using existing scoped storage/outbox.
(() => {
  "use strict";
  const identity = () =>
    [
      activeCoach.id,
      activeCoachTeam.id,
      typeof clubNetworkSession !== "undefined"
        ? clubNetworkSession?.user?.id || ""
        : "",
    ].join(":");
  const current = (kind) =>
    kind === "report" ? currentReport : getCompositionBoard();
  const id = (kind, value) =>
    kind === "report" ? value.id : value.documentId || "draft";
  function cleanTalk(board) {
    const next = structuredClone(board),
      old = next.matchPreparation || {};
    delete next.causerieAnimations;
    delete next.causerieSlideAnimations;
    delete next.causerieAnimationVariant;
    next.matchPreparation = {
      ...newMatchPreparation(),
      date: old.date || "",
      match: old.match || "",
      opponent: old.opponent || "",
    };
    if (next.documentCompletion?.kind === "causerie")
      delete next.documentCompletion;
    return next;
  }
  // Restore earlier writes if a later storage operation fails; never clear the editor on failure.
  function commit(writes) {
    const previous = writes.map(([key]) => [key, coachStorageGet(key)]),
      done = [];
    try {
      for (let i = 0; i < writes.length; i++) {
        const [key, value] = writes[i];
        if (previous[i][1] === value) continue;
        coachStorageSet(key, value);
        done.push(previous[i]);
      }
    } catch (error) {
      let restored = true;
      for (const [key, value] of done.reverse()) {
        try {
          if (value === null) localStorage.removeItem(coachStorageKey(key));
          else coachStorageSet(key, value);
        } catch {
          restored = false;
        }
      }
      throw Error(
        restored
          ? "Suppression non enregistrée. Votre document reste ouvert. Réessayez après avoir vérifié la connexion et le stockage."
          : "La suppression est incomplète. Votre document reste ouvert : vérifiez les sauvegardes avant de réessayer.",
      );
    }
  }
  function remove(kind, payload) {
    const target = id(kind, payload),
      recovery = workspaceRecoveryEntries(),
      versions = documentEntryArchives();
    if (kind === "report") {
      clearTimeout(reportAutosaveTimer);
      const next = reportLibrary.filter((r) => r.id !== target),
        blank = newReport();
      if (recovery.report?.payload.id === target) delete recovery.report;
      commit([
        ["vestiaire-report-draft", JSON.stringify(blank)],
        ["vestiaire-recovery", JSON.stringify(recovery)],
        [
          "vestiaire-document-versions",
          JSON.stringify(
            versions.filter(
              (v) => v.kind !== "report" || v.payload.id !== target,
            ),
          ),
        ],
        ["vestiaire-reports", JSON.stringify(next)],
      ]);
      reportLibrary = next;
      currentReport = blank;
      reportTab = "general";
      documentCompletionEndEdit("report");
      renderReportTabs();
      renderReportContent();
      renderReportLibrary();
      $("report-save-status").textContent = "Bilan supprimé.";
    } else {
      const matches = (b) =>
        b &&
        (id("causerie", b) === target ||
          (target !== "draft" && b.sourceCompositionId === target));
      const nextBoard = cleanTalk(getCompositionBoard());
      const nextPlan = matches(getGamePlanBoard())
        ? cleanTalk(getGamePlanBoard())
        : getGamePlanBoard();
      const nextSaves = saves.map((entry) =>
        matches(entry.state)
          ? { ...entry, state: cleanTalk(entry.state) }
          : entry,
      );
      for (const entry of Object.values(recovery))
        if (matches(entry.payload) && entry.payload.matchPreparation)
          entry.payload = cleanTalk(entry.payload);
      const nextVersions = versions.map((v) =>
        v.kind === "causerie" && matches(v.payload)
          ? { ...v, payload: cleanTalk(v.payload) }
          : v,
      );
      const writes = [
        ["vestiaire-draft", JSON.stringify(nextBoard)],
        ["vestiaire-recovery", JSON.stringify(recovery)],
        ["vestiaire-document-versions", JSON.stringify(nextVersions)],
      ];
      if (nextPlan && nextPlan !== getGamePlanBoard())
        writes.push(["vestiaire-gameplan-draft", JSON.stringify(nextPlan)]);
      writes.push(["vestiaire-saves", JSON.stringify(nextSaves)]);
      commit(writes);
      compositionBoard = nextBoard;
      gamePlanBoard = nextPlan;
      saves = nextSaves;
      state = terrainBoardKind === "plan" ? gamePlanBoard : compositionBoard;
      documentCompletionEndEdit("causerie");
      render();
      renderSaves();
      renderMatchPreparation();
      $("match-plan-status").textContent =
        "Causerie supprimée. Le match et la composition sont conservés.";
      window.causerieAnimations?.clearCurrent?.();
    }
    documentCompletionRefresh();
    documentEntry.refresh();
    if (typeof renderCoachAgenda === "function") renderCoachAgenda();
  }
  document.addEventListener("DOMContentLoaded", () => {
    const dialog = el("dialog", "document-delete-dialog");
    dialog.id = "document-delete-dialog";
    dialog.setAttribute("aria-labelledby", "document-delete-heading");
    dialog.setAttribute("aria-describedby", "document-delete-message");
    const heading = el("div", "section-heading"),
      title = el("h2");
    title.id = "document-delete-heading";
    const close = el("button", "icon-button", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Fermer la confirmation de suppression");
    heading.append(title, close);
    const message = el("p");
    message.id = "document-delete-message";
    const detail = el("p", "hint"),
      status = el("p", "hint");
    status.setAttribute("role", "alert");
    const actions = el("div", "document-delete-actions"),
      cancel = el("button", "export", "Annuler"),
      confirm = el("button", "document-delete-button", "Oui, supprimer");
    cancel.type = confirm.type = "button";
    cancel.autofocus = true;
    actions.append(cancel, confirm);
    dialog.append(heading, message, detail, status, actions);
    document.body.append(dialog);
    let pending = null;
    close.onclick = cancel.onclick = () => dialog.close();
    dialog.addEventListener("close", () => {
      pending = null;
      status.textContent = "";
    });
    function ask(kind) {
      if (kind === "report") flushReportDraft();
      const payload = current(kind);
      pending = {
        kind,
        owner: identity(),
        target: id(kind, payload),
        fingerprint: JSON.stringify(payload),
      };
      const name = kind === "report" ? "ce bilan" : "cette causerie";
      title.textContent =
        kind === "report" ? "Supprimer le bilan" : "Supprimer la causerie";
      message.textContent =
        "Êtes-vous sûr de vouloir supprimer " +
        name +
        " ? Cette action est irréversible.";
      detail.textContent =
        kind === "report"
          ? "Le bilan, son brouillon et ses copies locales de récupération seront retirés. Les autres bilans sont conservés."
          : "Le contenu de la causerie sera effacé, y compris dans ses versions locales. Le match, la composition et les joueurs sont conservés.";
      status.textContent = "";
      dialog.showModal();
      cancel.focus();
    }
    confirm.onclick = () => {
      if (!pending) return;
      const { kind, owner, target, fingerprint } = pending,
        payload = current(kind);
      if (
        owner !== identity() ||
        target !== id(kind, payload) ||
        fingerprint !== JSON.stringify(payload)
      ) {
        status.textContent =
          "Le compte ou le document a changé. Annulez puis rouvrez la confirmation.";
        return;
      }
      confirm.disabled = true;
      try {
        documentEntry.perform(() => remove(kind, payload));
        dialog.close();
        notify(kind === "report" ? "Bilan supprimé." : "Causerie supprimée.");
      } catch (error) {
        status.textContent = error.message;
      } finally {
        confirm.disabled = false;
      }
    };
    for (const kind of ["causerie", "report"]) {
      const root = $(kind === "report" ? "after-match" : "task-causerie");
      const toolbar = el("div", "document-delete-toolbar");
      const button = kind === "report" ? $("report-delete") : el("button");
      button.type = "button";
      button.className = "document-delete-button";
      button.textContent =
        kind === "report" ? "Supprimer le bilan" : "Supprimer la causerie";
      button.hidden = false;
      if (kind === "causerie") button.id = "causerie-delete";
      button.onclick = () => ask(kind);
      toolbar.append(button);
      root.prepend(toolbar);
    }
    window.documentDeletion = { ask };
  });
})();
