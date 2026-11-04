// Category labels describe the player; team switching still uses separate scoped rosters.
function squadPlayerCategory(player) {
  return (
    player.primaryCategory || activeCoachTeam.category || "Catégorie à préciser"
  );
}
function squadIdentityBadges(player, stats = null) {
  const strip = el("div", "squad-identity-badges");
  strip.append(
    el("span", "squad-primary-category", squadPlayerCategory(player)),
  );
  const latest = stats?.attendance.entries
    .slice()
    .sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time))[0];
  const attendance = latest
    ? latest.status === "present"
      ? "Présent à la dernière séance"
      : latest.status === "absent"
        ? "Absent à la dernière séance"
        : "Présence à confirmer"
    : "";
  const status = el(
    "span",
    "squad-availability",
    player.availability || attendance || "À renseigner",
  );
  status.dataset.availability = player.availability || "";
  status.title = player.availability
    ? "Disponibilité déclarée par le coach"
    : latest
      ? "Dernier pointage enregistré"
      : "Statut non renseigné";
  strip.append(status);
  return strip;
}
document.addEventListener("DOMContentLoaded", () => {
  // Keep historical jersey data for Match, but remove it from Effectif's form and cards.
  squadNumber.type = "hidden";
  squadNumber.closest("label").hidden = true;
  const categoryLabel = el("label", "report-field", "Catégorie principale"),
    category = el("input");
  category.maxLength = 30;
  category.setAttribute("aria-label", "Catégorie principale");
  category.setAttribute("list", "squad-category-suggestions");
  const suggestions = el("datalist");
  suggestions.id = "squad-category-suggestions";
  categoryLabel.append(category, suggestions);
  const statusLabel = el("label", "report-field", "Disponibilité"),
    status = el("select");
  status.setAttribute("aria-label", "Disponibilité");
  for (const value of ["", "Disponible", "À confirmer", "Indisponible"])
    status.append(new Option(value || "À renseigner", value));
  statusLabel.append(status);
  squadPostLabel.after(categoryLabel, statusLabel);
  window.squadProfileFields = {
    fill(player) {
      category.value =
        player?.primaryCategory || activeCoachTeam.category || "";
      status.value = player?.availability || "";
    },
    value() {
      return {
        primaryCategory: category.value.trim(),
        availability: status.value,
      };
    },
  };
  const context = el(
      "label",
      "report-field squad-team-filter",
      "Effectif de l’équipe",
    ),
    team = el("select");
  team.id = "squad-team-filter";
  team.setAttribute("aria-label", "Effectif de l’équipe");
  context.append(team);
  squadHeading.after(context);
  const filterLabel = el(
      "label",
      "report-field squad-category-filter",
      "Catégorie principale",
    ),
    filter = el("select");
  filter.setAttribute("aria-label", "Filtrer par catégorie principale");
  filterLabel.append(filter);
  context.after(filterLabel);
  function setupTeams() {
    const entries = coachTeams.filter((t) => t.id !== "unassigned");
    context.hidden = entries.length < 2;
    team.replaceChildren(...entries.map((t) => new Option(t.label, t.id)));
    if (activeCoachTeam.id === "unassigned")
      team.prepend(new Option("Choisir une équipe", ""));
    team.value = activeCoachTeam.id === "unassigned" ? "" : activeCoachTeam.id;
    suggestions.replaceChildren(
      ...[...new Set(entries.map((t) => t.category).filter(Boolean))].map(
        (c) => new Option(c, c),
      ),
    );
  }
  team.onchange = () => {
    const id = team.value;
    if (id) coachTeamSwitch(id);
  };
  function decorate() {
    const previous = filter.value;
    const values = [...new Set(squadPlayers().map(squadPlayerCategory))].sort(
      (a, b) => a.localeCompare(b, "fr"),
    );
    filter.replaceChildren(
      new Option("Toutes les catégories", ""),
      ...values.map((c) => new Option(c, c)),
    );
    filter.value = values.includes(previous) ? previous : "";
    filterLabel.hidden = values.length < 2;
    const statistics = playerStatsSeasonSnapshot(
      playerStatsCurrentSeason(),
    ).players;
    for (const card of squadList.querySelectorAll(
      "[data-player-id], [data-composition-player-id]",
    )) {
      const player = card.dataset.playerId
        ? squadPlayers().find((p) => p.id === card.dataset.playerId)
        : getCompositionBoard().players.find(
            (p) => p.id === card.dataset.compositionPlayerId,
          );
      if (!player) continue;
      card.querySelector(".squad-identity-badges")?.remove();
      card
        .querySelector(".squad-player-info")
        ?.append(squadIdentityBadges(player, statistics.get(player.id)));
      card.hidden =
        !!filter.value && squadPlayerCategory(player) !== filter.value;
    }
    squadCategory.textContent =
      "VOTRE EFFECTIF" +
      (activeCoachTeam.category ? " · " + activeCoachTeam.category : "");
  }
  filter.onchange = decorate;
  const before = squadRender;
  squadRender = function (...args) {
    const result = before.apply(this, args);
    decorate();
    return result;
  };
  document.addEventListener("coach-teams-updated", setupTeams);
  document.addEventListener("club-session-ready", setupTeams);
  setupTeams();
  decorate();
});
