// Presentation uses the existing frozen team context and guarded save/switch workflow.
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".header-actions");
  const legacy = document.querySelector(".coach-team-picker");
  if (!header || !legacy) return;
  legacy.hidden = true;
  const picker = el("div", "team-space-picker");
  const trigger = el("button", "team-space-trigger");
  trigger.id = "team-space-trigger";
  trigger.type = "button";
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", "team-space-list");
  const caption = el("small", "", "Mon équipe");
  const name = el("strong", "", activeCoachTeam.label);
  const chevron = el("span", "team-space-chevron", "⌄");
  chevron.setAttribute("aria-hidden", "true");
  trigger.append(caption, name, chevron);
  const list = el("section", "header-dropdown team-space-list");
  list.id = "team-space-list";
  list.hidden = true;
  list.setAttribute("aria-label", "Mes espaces équipes");
  const teams = el("div", "team-space-cards");
  const add = el("button", "team-space-add", "+ Ajouter une équipe");
  add.type = "button";
  add.id = "team-space-add";
  list.append(teams, add);
  picker.append(trigger, list);
  legacy.after(picker);

  const profile = el("div", "coach-profile-menu");
  const profileTrigger = el("button", "coach-profile-trigger");
  profileTrigger.id = "coach-profile-trigger";
  profileTrigger.type = "button";
  profileTrigger.setAttribute("aria-expanded", "false");
  profileTrigger.setAttribute("aria-controls", "coach-profile-options");
  profileTrigger.setAttribute("aria-label", "Ouvrir mon menu de profil");
  const avatar = el("span", "coach-profile-avatar");
  const profileName = el("span", "coach-profile-name");
  profileTrigger.append(avatar, profileName);
  const options = el("div", "header-dropdown coach-profile-options");
  options.id = "coach-profile-options";
  options.hidden = true;
  profile.append(profileTrigger, options);
  header.append(profile);
  const status = el("p", "profile-menu-status");
  status.setAttribute("role", "status");
  const menus = [
    [picker, trigger, list],
    [profile, profileTrigger, options],
  ];
  let hoverOpened = false,
    teamHoverOpened = false,
    teamHoverTimer;
  function closeMenus(focus = false) {
    hoverOpened = false;
    teamHoverOpened = false;
    clearTimeout(teamHoverTimer);
    for (const [, button, panel] of menus) {
      const wasOpen = !panel.hidden;
      panel.hidden = true;
      button.setAttribute("aria-expanded", "false");
      if (focus && wasOpen) button.focus();
    }
  }
  function openMenu(button, panel) {
    closeMenus();
    panel.hidden = false;
    button.setAttribute("aria-expanded", "true");
  }
  for (const [container, button, panel] of menus) {
    button.onclick = () => {
      // A first mouse click keeps the menu that hover has just disclosed open.
      if (button === profileTrigger && hoverOpened && !panel.hidden) {
        hoverOpened = false;
        return;
      }
      if (button === trigger && teamHoverOpened && !panel.hidden) {
        teamHoverOpened = false;
        return;
      }
      panel.hidden ? openMenu(button, panel) : closeMenus();
    };
    container.addEventListener("keydown", (event) => {
      const buttons = [...panel.querySelectorAll("button:not(:disabled)")];
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenus(true);
      } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        if (panel.hidden) openMenu(button, panel);
        const index = buttons.indexOf(document.activeElement);
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? buttons.length - 1
              : (index + (event.key === "ArrowUp" ? -1 : 1) + buttons.length) %
                buttons.length;
        buttons[next]?.focus();
      }
    });
    container.addEventListener("focusout", (event) => {
      if (!container.contains(event.relatedTarget)) {
        panel.hidden = true;
        button.setAttribute("aria-expanded", "false");
      }
    });
  }
  document.addEventListener("pointerdown", (event) => {
    if (!menus.some(([container]) => container.contains(event.target)))
      closeMenus();
  });
  picker.addEventListener("pointerenter", (event) => {
    clearTimeout(teamHoverTimer);
    if (
      event.pointerType === "mouse" &&
      matchMedia("(hover:hover)").matches &&
      !document.querySelector("dialog[open]")
    ) {
      openMenu(trigger, list);
      teamHoverOpened = true;
    }
  });
  picker.addEventListener("pointerleave", () => {
    teamHoverTimer = setTimeout(() => {
      if (!picker.contains(document.activeElement)) {
        list.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
        teamHoverOpened = false;
      }
    }, 160);
  });
  let hoverTimer;
  profile.addEventListener("pointerenter", (event) => {
    clearTimeout(hoverTimer);
    if (
      event.pointerType === "mouse" &&
      matchMedia("(hover:hover)").matches &&
      !document.querySelector("dialog[open]")
    ) {
      openMenu(profileTrigger, options);
      hoverOpened = true;
    }
  });
  profile.addEventListener("pointerleave", () => {
    hoverTimer = setTimeout(() => {
      if (!profile.contains(document.activeElement)) {
        options.hidden = true;
        profileTrigger.setAttribute("aria-expanded", "false");
      }
    }, 160);
  });
  function refreshTeams() {
    const activeLabel =
      activeCoachTeam.id === "unassigned"
        ? "Choisir une équipe"
        : activeCoachTeam.label;
    name.textContent = activeLabel + (activeCoachTeam.id === "unassigned" ? "" : " · Football à 11");
    trigger.title = name.textContent;
    trigger.setAttribute(
      "aria-label",
      "Mon équipe : " + name.textContent + ". Changer d’équipe",
    );
    teams.replaceChildren(
      ...coachTeams
        .filter((team) => team.id !== "unassigned")
        .map((team) => {
          const button = el("button", "team-space-card");
          button.type = "button";
          button.dataset.teamId = team.id;
          button.setAttribute(
            "aria-pressed",
            String(team.id === activeCoachTeam.id),
          );
          button.append(el("strong", "", team.label));
          button.onclick = () => {
            closeMenus();
            coachTeamSwitch(team.id);
          };
          return button;
        }),
    );
  }
  add.onclick = () => {
    closeMenus();
    coachTeamAddDialog();
  };
  function option(label, action) {
    const button = el("button", "", label);
    button.type = "button";
    button.onclick = action;
    options.append(button);
    return button;
  }
  option("Mon Profil", () => {
    closeMenus();
    coachAccountOpen("profile");
  });
  option("Mes Préférences", () => {
    closeMenus();
    coachAccountOpen("preferences");
  });
  const logout = option("Se Déconnecter", async () => {
    logout.disabled = true;
    status.textContent = "";
    try {
      if (clubNetworkBound()) await clubNetworkLogout();
      else if (flushCoachWorkspace()) {
        clubNetworkClear();
        location.assign("accueil.html");
      } else
        status.textContent =
          "Enregistrez votre travail avant de vous déconnecter.";
      if (clubNetworkBound())
        status.textContent =
          "Enregistrez votre travail avant de vous déconnecter.";
    } catch (error) {
      status.textContent = clubNetworkMessage(error);
    } finally {
      logout.disabled = false;
    }
  });
  logout.className = "coach-profile-logout";
  options.append(status);
  function refreshProfile() {
    const data = coachAccountRead().profile;
    const label = coachAccountDisplayName() || activeCoach.name;
    profileName.textContent = label;
    avatar.replaceChildren();
    if (data.photo) {
      const img = el("img");
      img.src = data.photo;
      img.alt = "";
      avatar.append(img);
    } else
      avatar.textContent = label
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();
  }
  const saveProfile = coachAccountSaveSection;
  coachAccountSaveSection = function (...args) {
    const value = saveProfile.apply(this, args);
    refreshProfile();
    return value;
  };
  window.addEventListener("storage", refreshProfile);
  document.addEventListener("coach-teams-updated", refreshTeams);
  document.addEventListener("club-session-ready", () => {
    closeMenus();
    refreshTeams();
    refreshProfile();
  });
  const settings = $("coach-account-open");
  if (settings) {
    document.body.append(settings);
    settings.classList.add("coach-settings-dock");
    settings.setAttribute("aria-label", "Paramètres");
    settings.title = "Paramètres";
    settings.querySelector("span").textContent = "Paramètres";
    settings.onclick = () => {
      closeMenus();
      coachAccountOpen();
    };
  }
  refreshTeams();
  refreshProfile();
});
