// A directory profile embeds the existing folders; it never creates another document store.
const clubEducatorTeams = new Map();
const clubEducatorInitialNavigation = history.state?.clubNavigation;
const clubEducatorState = {
  owner: "",
  team: "",
  tab: "profile",
  loading: false,
  error: "",
};
function clubEducatorTeamKey(row) {
  return (
    (clubNetworkSession?.user.id || "") + ":" + row.id + ":" + row.revision
  );
}
function clubEducatorDocumentMatches(row) {
  if (
    !clubNetworkBound() ||
    row.owner_id !== clubEducatorState.owner ||
    !clubEducatorState.team
  )
    return false;
  const team = clubEducatorTeams.get(clubEducatorTeamKey(row));
  return clubEducatorState.team === "__unknown"
    ? !team
    : team?.id === clubEducatorState.team;
}
const clubEducatorPreviousKind = clubNetworkKindMatches;
clubNetworkKindMatches = function (row, kind) {
  return (
    clubEducatorPreviousKind(row, kind) && clubEducatorDocumentMatches(row)
  );
};
document.addEventListener("DOMContentLoaded", () => {
  const flow = workspaceFlows.club,
    page = flow.pages[1],
    author = $("club-network-author"),
    kind = $("club-network-kind"),
    shell = el("section", "educator-profile"),
    head = el("div", "educator-profile-heading"),
    back = el("button", "export", "← Tous les éducateurs"),
    identity = el("div", "educator-profile-identity"),
    avatar = el("span", "educator-profile-avatar"),
    copy = el("div"),
    name = el("h2"),
    role = el("p", "hint"),
    teamLabel = el("label", "report-field", "Équipe consultée"),
    teamSelect = el("select"),
    useTeam = el("button", "export", "Utiliser cette équipe pour mon travail"),
    status = el("p", "hint"),
    retry = el("button", "export", "Réessayer la lecture des équipes"),
    tabs = el("div", "educator-profile-tabs"),
    profile = el("section", "educator-profile-info"),
    documents = el("section", "educator-profile-documents");
  shell.id = "club-educator-profile";
  name.id = "club-educator-title";
  shell.setAttribute("aria-labelledby", name.id);
  teamSelect.id = "club-educator-team";
  teamSelect.setAttribute("aria-label", "Équipe consultée");
  teamLabel.append(teamSelect);
  back.type = useTeam.type = retry.type = "button";
  status.setAttribute("role", "status");
  identity.append(avatar, copy);
  copy.append(name, role);
  head.append(back, identity, teamLabel, useTeam, status, retry);
  profile.id = "club-educator-profile-info";
  documents.id = "club-educator-profile-documents";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Profil de l’éducateur");
  const buttons = new Map();
  for (const [id, label, panel] of [
    ["profile", "Profil", profile],
    ["documents", "Documents partagés", documents],
  ]) {
    const button = el("button", "", label);
    button.type = "button";
    button.id = "educator-profile-tab-" + id;
    button.setAttribute("role", "tab");
    button.setAttribute("aria-controls", panel.id);
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", button.id);
    button.onclick = () => {
      clubEducatorState.tab = id;
      paint();
      if (window.workspaceFraming)
        workspaceFraming.request({ target: id === "documents" ? tabs : shell });
    };
    tabs.append(button);
    buttons.set(id, button);
  }
  tabs.onkeydown = (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const id =
      event.key === "Home"
        ? "profile"
        : event.key === "End"
          ? "documents"
          : clubEducatorState.tab === "profile"
            ? "documents"
            : "profile";
    const button = buttons.get(id);
    if (!button.disabled) {
      button.click();
      button.focus();
    }
  };
  // Move the original controls and handlers, not copies of their content.
  documents.append(...[...page.children]);
  const documentContext = el("p", "educator-profile-context");
  documents.prepend(documentContext);
  shell.append(head, tabs, profile, documents);
  page.append(shell);
  document.body.classList.add("educator-profiles-ready");
  author.closest("label").hidden = true;
  kind.closest("label").firstChild.textContent = "Dossier";
  const myProfile = el("button", "export", "Mon profil d’éducateur");
  myProfile.type = "button";
  myProfile.id = "club-my-educator-profile";
  $("club-network-coach-cards").before(myProfile);
  let run = 0,
    signature = "",
    restoringTeam = false,
    pendingRestore =
      window.clubEducatorPendingRestore ||
      history.state?.clubNavigation?.page?.educator ||
      null;
  delete window.clubEducatorPendingRestore;
  function rows() {
    return clubNetworkRows.filter(
      (row) => row.owner_id === clubEducatorState.owner,
    );
  }
  function availableTeams() {
    const result = new Map();
    if (clubEducatorState.owner === clubNetworkSession?.user.id)
      for (const team of coachTeams) result.set(team.id, team);
    for (const row of rows()) {
      const team = clubEducatorTeams.get(clubEducatorTeamKey(row));
      if (team) result.set(team.id, result.get(team.id) || team);
    }
    return [...result.values()];
  }
  function paint() {
    const member = clubNetworkMembers.find(
        (m) => m.user_id === clubEducatorState.owner,
      ),
      own = !!member && member.user_id === clubNetworkSession?.user.id,
      personal = own ? coachAccountRead() : null;
    name.textContent = member?.display_name || "Choisir un éducateur";
    role.textContent = own
      ? personal.profile.role || "Éducateur du club"
      : "Éducateur du club";
    avatar.replaceChildren();
    if (personal?.profile.photo) {
      const image = el("img");
      image.src = personal.profile.photo;
      image.alt = "";
      avatar.append(image);
    } else
      avatar.textContent = (member?.display_name || "?")
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    const teams = availableTeams(),
      unknown = rows().some(
        (row) => !clubEducatorTeams.has(clubEducatorTeamKey(row)),
      ),
      value = clubEducatorState.team;
    teamSelect.replaceChildren(
      new Option("Choisir une équipe…", ""),
      ...teams.map(
        (team) =>
          new Option(
            team.label +
              (team.category && team.label !== team.category
                ? " · " + team.category
                : ""),
            team.id,
          ),
      ),
    );
    if (unknown && !clubEducatorState.loading)
      teamSelect.append(
        new Option("Documents dont l’équipe reste à identifier", "__unknown"),
      );
    if (value && [...teamSelect.options].some((o) => o.value === value))
      teamSelect.value = value;
    else if (!clubEducatorState.loading && !restoringTeam) {
      clubEducatorState.team =
        own && teams.some((t) => t.id === activeCoachTeam.id)
          ? activeCoachTeam.id
          : teams.length === 1
            ? teams[0].id
            : "";
      teamSelect.value = clubEducatorState.team;
    }
    teamSelect.disabled = !member || clubEducatorState.loading;
    useTeam.hidden =
      !own ||
      !clubEducatorState.team ||
      clubEducatorState.team === "__unknown" ||
      clubEducatorState.team === activeCoachTeam.id;
    status.textContent = clubEducatorState.loading
      ? "Lecture des équipes de cet éducateur…"
      : clubEducatorState.error ||
        (!member
          ? "Choisissez un éducateur dans le répertoire."
          : teams.length > 1 && !clubEducatorState.team
            ? "Choisissez explicitement l’équipe à consulter."
            : "Les dossiers sont filtrés pour l’équipe consultée. Votre équipe de travail reste inchangée.");
    retry.hidden = !clubEducatorState.error;
    profile.replaceChildren();
    if (member) {
      profile.append(
        el("h3", "", "Ses équipes"),
        el(
          "p",
          "hint",
          "Équipes identifiées à partir des documents partagés" +
            (own ? " et de votre configuration." : "."),
        ),
      );
      const list = el("ul", "educator-team-list");
      for (const team of teams) {
        const item = el("li"),
          choose = el("button", "export", team.label);
        choose.type = "button";
        choose.setAttribute(
          "aria-pressed",
          String(clubEducatorState.team === team.id),
        );
        choose.onclick = () => {
          clubEducatorState.team = team.id;
          teamSelect.value = team.id;
          kind.value = "";
          clubDocumentReset();
          clubNetworkRenderRows();
        };
        item.append(choose);
        list.append(item);
      }
      profile.append(list);
      if (!teams.length && !clubEducatorState.loading)
        profile.append(
          el(
            "p",
            "hint",
            "Aucune équipe renseignée dans les documents partagés.",
          ),
        );
      const contact = el(
        "p",
        "hint",
        own
          ? [personal.profile.contactEmail, personal.profile.phone]
              .filter(Boolean)
              .join(" · ") ||
              "Vos coordonnées sont modifiables dans les paramètres."
          : "Les coordonnées personnelles de cet éducateur ne sont pas publiées ici.",
      );
      profile.append(contact);
    }
    for (const [id, button] of buttons) {
      button.disabled =
        id === "documents" &&
        (!clubEducatorState.team || clubEducatorState.loading);
      const active = id === clubEducatorState.tab;
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    }
    shell.dataset.tab = clubEducatorState.tab;
    const selectedTeam = teams.find((t) => t.id === clubEducatorState.team);
    documentContext.textContent = [
      member?.display_name,
      selectedTeam?.label ||
        (clubEducatorState.team === "__unknown" ? "Équipe à identifier" : ""),
    ]
      .filter(Boolean)
      .join(" · ");
    profile.hidden = clubEducatorState.tab !== "profile";
    documents.hidden = clubEducatorState.tab !== "documents";
  }
  async function load(force = false) {
    if (
      !clubNetworkBound() ||
      !clubEducatorState.owner ||
      !document.body.classList.contains("club-network-mode") ||
      flow.index() !== 1
    )
      return;
    const owner = clubEducatorState.owner,
      stamp = JSON.stringify(
        rows()
          .map((row) => [row.id, row.revision])
          .sort(),
      ),
      key = owner + ":" + stamp;
    if (!force && signature === key) return;
    signature = key;
    const token = ++run,
      account = clubNetworkSession.user.id,
      generation = clubNetworkGeneration;
    clubEducatorState.loading = true;
    clubEducatorState.error = "";
    paint();
    try {
      let offset = 0;
      while (true) {
        const params = new URLSearchParams({
            select:
              "id,owner_id,kind,source_id,revision,teamContext:payload->teamContext,category:payload->category,team:payload->team,reportCategory:payload->info->category,reportTeam:payload->info->team",
            owner_id: "eq." + owner,
            order: "id.asc",
            limit: "100",
            offset: String(offset),
          }),
          data = await clubNetworkRequest("/rest/v1/club_documents?" + params);
        if (
          token !== run ||
          clubNetworkGeneration !== generation ||
          clubNetworkSession?.user.id !== account ||
          clubEducatorState.owner !== owner
        )
          return;
        if (!Array.isArray(data))
          throw Error("Réponse de lecture des équipes invalide.");
        for (const row of data) {
          const current = rows().find(
            (r) => r.id === row.id && r.revision === row.revision,
          );
          if (!current || row.owner_id !== owner) continue;
          let team;
          if (row.payload) team = coachTeamDescriptor(row.payload);
          else if (
            ["teamContext", "category", "reportCategory"].some((k) =>
              Object.hasOwn(row, k),
            )
          )
            team = coachTeamDescriptor({
              teamContext: row.teamContext,
              category: row.category || row.reportCategory || "",
              team: row.team || row.reportTeam || "",
            });
          if (team) {
            clubEducatorTeams.set(clubEducatorTeamKey(current), team);
            if (owner === account) coachTeamDiscover(team, true);
          }
        }
        if (data.length < 100) break;
        offset += 100;
        if (offset >= 10000)
          throw Error("Trop de documents à identifier en une fois.");
      }
    } catch (error) {
      if (token !== run) return;
      clubEducatorState.error =
        "Certaines équipes n’ont pas pu être identifiées. Réessayez ou consultez les documents restant à identifier.";
    } finally {
      if (token === run && clubNetworkSession?.user.id === account) {
        clubEducatorState.loading = false;
        restoringTeam = false;
        paint();
        clubNetworkRenderRows();
      }
    }
  }
  function syncOwner() {
    if (
      pendingRestore &&
      clubNetworkMembers.some((m) => m.user_id === pendingRestore.owner)
    ) {
      author.value = pendingRestore.owner;
      clubEducatorState.owner = pendingRestore.owner;
      restoringTeam = true;
      clubEducatorState.team =
        typeof pendingRestore.team === "string"
          ? pendingRestore.team.slice(0, 100)
          : "";
      clubEducatorState.tab =
        pendingRestore.tab === "documents" ? "documents" : "profile";
      pendingRestore = null;
      signature = "";
    }
    if (author.value !== clubEducatorState.owner) {
      run++;
      restoringTeam = false;
      signature = "";
      clubEducatorState.owner = author.value;
      clubEducatorState.team = "";
      clubEducatorState.tab = "profile";
      clubEducatorState.loading = false;
      clubEducatorState.error = "";
      kind.value = "";
    }
  }
  const render = clubNetworkRenderRows;
  clubNetworkRenderRows = function () {
    syncOwner();
    paint();
    render();
    if (clubNetworkBound() && clubEducatorState.owner) load();
  };
  const go = flow.go;
  flow.go = function (index) {
    if (index === 1 && !author.value) {
      go(0);
      return false;
    }
    const result = go(index);
    if (index === 1) {
      syncOwner();
      paint();
      load();
    }
    return result;
  };
  back.onclick = () => {
    run++;
    author.value = "";
    kind.value = "";
    author.dispatchEvent(new Event("change"));
    flow.go(0);
  };
  myProfile.onclick = () => {
    clubEducatorState.tab = "profile";
    author.value = clubNetworkSession?.user.id || "";
    author.dispatchEvent(new Event("change"));
    flow.go(1);
  };
  retry.onclick = () => load(true);
  teamSelect.onchange = () => {
    clubEducatorState.team = teamSelect.value;
    kind.value = "";
    $("club-document-title").value = "";
    clubDocumentReset();
    clubNetworkRenderRows();
  };
  useTeam.onclick = () => {
    if (clubEducatorState.owner !== clubNetworkSession?.user.id) return;
    const team = availableTeams().find((t) => t.id === clubEducatorState.team);
    if (team) {
      coachTeamDiscover(team, true);
      coachTeamSwitch(team.id);
    }
  };
  window.clubEducatorProfile = {
    getState: () => ({
      owner: clubEducatorState.owner,
      team: clubEducatorState.team,
      tab: clubEducatorState.tab,
    }),
    restore(value) {
      if (!value || typeof value.owner !== "string" || value.owner.length > 100)
        return;
      pendingRestore = { owner: value.owner, team: value.team, tab: value.tab };
      syncOwner();
      paint();
    },
    refresh: () => load(true),
  };
  const clear = clubNetworkClear;
  clubNetworkClear = function () {
    run++;
    signature = "";
    pendingRestore = null;
    restoringTeam = false;
    clubEducatorTeams.clear();
    Object.assign(clubEducatorState, {
      owner: "",
      team: "",
      tab: "profile",
      loading: false,
      error: "",
    });
    clear();
    paint();
  };
  // Reauthentication returns to Home in the legacy shell. Restore only an authorized profile that was actually open.
  document.addEventListener("club-session-ready", () => {
    const saved = clubEducatorInitialNavigation;
    if (
      saved?.coach !== activeCoach.id ||
      saved.team !== activeCoachTeam.id ||
      saved.page?.view !== "club" ||
      saved.page.index !== 1 ||
      !saved.page.educator ||
      !clubNetworkMembers.some((m) => m.user_id === saved.page.educator.owner)
    )
      return;
    clubEducatorProfile.restore(saved.page.educator);
    const folder = saved.page.filters?.["club-network-kind"];
    if ([...kind.options].some((o) => o.value === folder)) kind.value = folder;
    $("club-document-title").value = String(
      saved.page.filters?.["club-document-title"] || "",
    ).slice(0, 300);
    workspaceNavigation.run("view-club-network", () => flow.go(1));
    clubNetworkRenderRows();
  });
  $("club-network-coach-cards").addEventListener(
    "click",
    (event) => {
      if (event.target.closest("button[data-user-id]"))
        clubEducatorState.tab = "profile";
    },
    true,
  );
  clubNetworkRenderRows();
});
