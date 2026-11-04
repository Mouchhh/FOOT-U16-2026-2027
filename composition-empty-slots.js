// Unassigned positions are visual slots, never fake players in the match or statistics.
function compositionEmptySlots(board) {
  if (board.matchCreation !== "blank") return [];
  const positions = layouts[board.formation] || layouts["4-3-3"];
  const occupied = new Set(
    board.players
      .filter((p) => p.role !== "sub")
      .map((p, i) => (Number.isInteger(p.formationSlot) ? p.formationSlot : i)),
  );
  return positions.flatMap(([x, y], index) =>
    occupied.has(index)
      ? []
      : [
          {
            id: "empty-slot-" + index,
            formationSlot: index,
            x,
            y,
            name: "",
            number: "",
            photo: "",
            role: "starter",
          },
        ],
  );
}
document.addEventListener("DOMContentLoaded", () => {
  function paint() {
    $("players")
      .querySelectorAll(".player-empty-slot")
      .forEach((node) => node.remove());
    if (terrainBoardKind !== "composition") return;
    for (const slot of compositionEmptySlots(getCompositionBoard())) {
      const token = el("button", "player player-empty-slot");
      token.type = "button";
      token.dataset.id = slot.id;
      token.style.left = slot.x + "%";
      token.style.top = slot.y + "%";
      token.setAttribute("aria-label", "Emplacement libre : choisir un joueur");
      token.append(el("span", "token"));
      $("players").append(token);
    }
  }
  const before = render;
  render = function (...args) {
    const value = before.apply(this, args);
    paint();
    return value;
  };
  paint();
});
