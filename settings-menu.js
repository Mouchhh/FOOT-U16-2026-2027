// Lightweight settings disclosure. Existing account forms remain available from the profile.
document.addEventListener("DOMContentLoaded", () => {
  const gear = $("coach-account-open"),
    nav = $("workspace-navigation");
  if (!gear || !nav) return;
  const dock = el("div", "settings-navigation-footer");
  dock.id = "settings-navigation-footer";
  nav.append(dock);
  dock.append(gear);
  gear.setAttribute("aria-haspopup", "false");
  gear.setAttribute("aria-controls", "settings-menu");
  gear.setAttribute("aria-expanded", "false");
  const panel = el("section", "settings-menu");
  panel.id = "settings-menu";
  panel.hidden = true;
  panel.setAttribute("aria-label", "Paramètres");
  const options = el("div");
  options.id = "settings-menu-options";
  const preferences = el("button", "", "Préférences"),
    logout = el("button", "settings-logout", "Déconnexion");
  preferences.type = logout.type = "button";
  options.append(preferences, logout);
  const form = el("form", "settings-preferences");
  form.hidden = true;
  const back = el("button", "settings-back", "← Paramètres");
  back.type = "button";
  back.onclick = () => {
    form.hidden = true;
    options.hidden = false;
    preferences.focus();
  };
  const heading = el("h2", "", "Préférences");
  const label = el("label", "report-field", "Page d’accueil par défaut"),
    page = el("select");
  page.setAttribute("aria-label", "Page d’accueil par défaut");
  for (const [value, title] of Object.entries(coachAccountPages))
    page.append(new Option(title, value));
  label.append(page);
  function checkbox(title) {
    const label = el("label", "settings-check"),
      input = el("input");
    input.type = "checkbox";
    input.setAttribute("aria-label", title);
    label.append(input, document.createTextNode(title));
    return { label, input };
  }
  const compact = checkbox("Affichage compact"),
    motion = checkbox("Réduire les animations");
  const save = el("button", "primary", "Enregistrer");
  save.type = "submit";
  const status = el("p", "settings-menu-status");
  status.setAttribute("role", "status");
  form.append(back, heading, label, compact.label, motion.label, save);
  panel.append(options, form, status);
  document.body.append(panel);
  let timer,
    hoverOpened = false;
  function place() {
    if (panel.hidden) return;
    const rect = gear.getBoundingClientRect();
    const desktop = nav.dataset.dock === "left";
    panel.style.left =
      Math.max(
        8,
        Math.min(
          desktop ? rect.right + 12 : rect.left,
          innerWidth - panel.offsetWidth - 8,
        ),
      ) + "px";
    panel.style.bottom =
      Math.max(8, innerHeight - (desktop ? rect.bottom : rect.top) + 8) + "px";
  }
  function close(focus = false) {
    panel.hidden = true;
    gear.setAttribute("aria-expanded", "false");
    hoverOpened = false;
    clearTimeout(timer);
    if (focus) gear.focus();
  }
  function open() {
    document
      .querySelectorAll(".header-dropdown")
      .forEach((p) => (p.hidden = true));
    document
      .querySelectorAll("#team-space-trigger,#coach-profile-trigger")
      .forEach((b) => b.setAttribute("aria-expanded", "false"));
    options.hidden = false;
    form.hidden = true;
    status.textContent = "";
    panel.hidden = false;
    gear.setAttribute("aria-expanded", "true");
    place();
  }
  gear.onclick = () => {
    if (hoverOpened && !panel.hidden) {
      hoverOpened = false;
      return;
    }
    panel.hidden ? open() : close();
  };
  gear.addEventListener("pointerenter", (event) => {
    clearTimeout(timer);
    if (
      event.pointerType === "mouse" &&
      matchMedia("(hover:hover)").matches &&
      !document.querySelector("dialog[open]")
    ) {
      open();
      hoverOpened = true;
    }
  });
  function leave() {
    timer = setTimeout(() => {
      if (
        !panel.contains(document.activeElement) &&
        document.activeElement !== gear
      )
        close();
    }, 180);
  }
  gear.addEventListener("pointerleave", leave);
  panel.addEventListener("pointerenter", () => clearTimeout(timer));
  panel.addEventListener("pointerleave", leave);
  document.addEventListener("pointerdown", (event) => {
    if (!panel.contains(event.target) && !gear.contains(event.target)) close();
  });
  function keydown(event) {
    if (event.key === "Escape" && !panel.hidden) {
      event.preventDefault();
      close(true);
    }
    if (!panel.hidden && !form.hidden) return;
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (panel.hidden) open();
      const buttons = [preferences, logout],
        index = buttons.indexOf(document.activeElement);
      buttons[
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? 1
            : (index + (event.key === "ArrowUp" ? -1 : 1) + 2) % 2
      ].focus();
    }
  }
  gear.addEventListener("keydown", keydown);
  panel.addEventListener("keydown", keydown);
  panel.addEventListener("focusout", (event) => {
    if (!panel.contains(event.relatedTarget) && event.relatedTarget !== gear)
      close();
  });
  gear.addEventListener("focusout", (event) => {
    if (!panel.contains(event.relatedTarget)) close();
  });
  preferences.onclick = () => {
    const saved = coachAccountRead().preferences;
    page.value = saved.startPage;
    compact.input.checked = saved.compact;
    motion.input.checked = saved.reducedMotion;
    options.hidden = true;
    form.hidden = false;
    status.textContent = "";
    place();
    page.focus();
  };
  form.onsubmit = (event) => {
    event.preventDefault();
    try {
      coachAccountSaveSection("preferences", {
        startPage: page.value,
        compact: compact.input.checked,
        reducedMotion: motion.input.checked,
      });
      status.textContent = "Préférences enregistrées.";
      place();
    } catch {
      status.textContent =
        "Enregistrement impossible. Vos préférences précédentes sont conservées.";
    }
  };
  logout.onclick = async () => {
    logout.disabled = true;
    try {
      if (clubNetworkBound()) {
        await clubNetworkLogout();
        if (clubNetworkBound())
          status.textContent =
            "Enregistrez votre travail avant de vous déconnecter.";
      } else if (flushCoachWorkspace()) {
        clubNetworkClear();
        location.assign("accueil.html");
      } else
        status.textContent =
          "Enregistrez votre travail avant de vous déconnecter.";
    } catch (error) {
      status.textContent = clubNetworkMessage(error);
    } finally {
      logout.disabled = false;
    }
  };
  window.addEventListener("resize", place);
  window.addEventListener("scroll", place, { passive: true });
  new ResizeObserver(place).observe(panel);
  document.addEventListener("club-session-ready", () => close());
  const clear = clubNetworkClear;
  clubNetworkClear = function (...args) {
    close();
    return clear.apply(this, args);
  };
});
