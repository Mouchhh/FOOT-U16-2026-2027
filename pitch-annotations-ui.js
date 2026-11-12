// Zones & pass lines on « Placement tactique » (state.annotations) and on
// « Animations » (simpleState.annotations, shared by every step of the animation).
// Annotation gestures are captured on an ancestor of the pitch, before the token
// handlers, so a zone or a pass drawn from a token never moves it.
(() => {
  const ns = "http://www.w3.org/2000/svg";
  const has = (a) => !!a && (a.zones.length > 0 || a.passes.length > 0);

  // Validation: annotations are optional on both document types.
  const validBefore = valid;
  valid = function (s) {
    return validBefore(s) && pitchAnnotationsValid(s?.annotations);
  };
  const simpleValidBefore = simpleValid;
  simpleValid = function (s) {
    return simpleValidBefore(s) && pitchAnnotationsValid(s?.annotations);
  };

  // Generic drawing controller for one pitch.
  function controller({ host, layer, pointFn, read, write, isActive, tools }) {
    let drag = null;
    const paint = (preview = null) => pitchAnnotationsRender(layer, read() || pitchAnnotationsEmpty(), preview);
    host.addEventListener(
      "pointerdown",
      (e) => {
        if (e.button !== 0 || !isActive() || !e.target.closest("#" + pitchId())) return;
        e.preventDefault();
        e.stopPropagation();
        const [x, y] = pointFn(e),
          current = read() || pitchAnnotationsEmpty();
        if (tools.state.tool === "erase") {
          const id = pitchAnnotationAt(current, x, y);
          if (id) write(pitchAnnotationsRemove(current, id));
          return;
        }
        drag = { pointer: e.pointerId, x, y };
        try {
          host.setPointerCapture(e.pointerId);
        } catch {}
      },
      true,
    );
    host.addEventListener(
      "pointermove",
      (e) => {
        if (!drag || drag.pointer !== e.pointerId) return;
        e.preventDefault();
        e.stopPropagation();
        const [x, y] = pointFn(e);
        paint(pitchAnnotationFromDrag(tools.state.tool, tools.state.shape, tools.state.color, drag.x, drag.y, x, y));
      },
      true,
    );
    for (const type of ["pointerup", "pointercancel"])
      host.addEventListener(
        type,
        (e) => {
          if (!drag || drag.pointer !== e.pointerId) return;
          e.preventDefault();
          e.stopPropagation();
          const [x, y] = pointFn(e),
            made = type === "pointerup" ? pitchAnnotationFromDrag(tools.state.tool, tools.state.shape, tools.state.color, drag.x, drag.y, x, y) : null;
          drag = null;
          const current = read() || pitchAnnotationsEmpty();
          if (made && current[made.kind].length < pitchAnnotationLimits[made.kind])
            write({ ...current, [made.kind]: [...current[made.kind], made.item] });
          else {
            if (made) notify("Nombre maximum de zones ou de passes atteint.");
            paint();
          }
        },
        true,
      );
    let pitchId = () => "";
    return { paint, setPitchId: (fn) => (pitchId = fn) };
  }

  // ---------- Placement tactique ----------
  {
    const svg = $("arrows"),
      zones = document.createElementNS(ns, "g");
    zones.id = "zones";
    svg.insertBefore(zones, $("lines"));
    const tab = document.createElement("button");
    tab.id = "annotate";
    tab.type = "button";
    tab.className = $("arrow").className.replace(/\bactive\b/, "").trim();
    tab.setAttribute("role", $("arrow").getAttribute("role") || "tab");
    tab.setAttribute("aria-selected", "false");
    tab.textContent = "▭ Zones & passes";
    $("arrow").after(tab);
    const panel = document.createElement("div");
    panel.id = "tactic-panel-annotate";
    panel.className = "tactic-tool-panel";
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", "annotate");
    panel.hidden = true;
    panel.append(el("p", "", "Glissez sur le terrain pour tracer une zone colorée transparente ou une ligne de passe. Gomme : touchez un élément pour le retirer."));
    $("tactic-panel-arrow").after(panel);
    tacticToolTabs.push({ id: "annotate", name: "annotate" });
    const tools = pitchAnnotationsToolbar("tactic-annotation", {
      onClear: () => {
        state.annotations = pitchAnnotationsEmpty();
        drawArrows();
        persist();
      },
    });
    panel.append(tools.bar);
    tab.addEventListener("click", () => {
      mode = "annotate";
      $("move").classList.remove("active");
      $("arrow").classList.remove("active");
      $("pitch").style.cursor = "crosshair";
      showTacticTool("annotate");
      tab.classList.add("active");
    });
    for (const id of ["move", "arrow", "tactic-opponents-tab"]) $(id).addEventListener("click", () => tab.classList.remove("active"));
    const drawBefore = drawArrows;
    drawArrows = function () {
      drawBefore();
      pitchAnnotationsRender(zones, state.annotations);
    };
    const c = controller({
      host: $("pitch").parentElement,
      layer: zones,
      pointFn: point,
      read: () => state.annotations,
      write: (a) => {
        state.annotations = a;
        drawArrows();
        persist();
        if (typeof terrainHistoryRecord === "function" && typeof terrainHistoryContext === "function")
          try {
            terrainHistoryRecord(terrainHistoryContext(false));
          } catch {}
      },
      isActive: () => mode === "annotate",
      tools,
    });
    c.setPitchId(() => "pitch");
    drawArrows();
  }

  // ---------- Animations ----------
  {
    // simpleState.annotations is the only source of truth: opening an animation (own
    // library, club library, shared import, draft recovery) or undo/redo brings its own
    // annotations. Only state rebuilt by step changes or by turning the board into a
    // custom sequence carries the previous annotations over.
    let active = false,
      carry = null;
    const zones = document.createElementNS(ns, "g");
    zones.id = "simple-zones";
    simpleSvg.insertBefore(zones, simpleLines);
    const adoptCarry = () => {
      if (carry && simpleState && simpleState.annotations === undefined) simpleState.annotations = structuredClone(carry);
    };
    const write = (a) => {
      if (typeof stopAnimation === "function") stopAnimation(true);
      simpleState.annotations = a;
      if (typeof animationStart !== "undefined" && animationStart) animationStart.annotations = structuredClone(a);
      renderSimple();
      saveSimple();
    };
    const tools = pitchAnnotationsToolbar("simple-annotation", {
      onChange: () => setActive(true),
      onClear: () => write(pitchAnnotationsEmpty()),
    });
    const off = el("button", "tool pitch-annotation-off", "✕ Fermer les zones");
    off.type = "button";
    off.id = "simple-annotation-off";
    off.onclick = () => setActive(false);
    tools.bar.append(off);
    const box = el("div", "simple-annotation-box");
    box.append(el("strong", "", "Zones & lignes de passe"), tools.bar);
    $("custom-arrow").closest("div, section").after(box);
    function setActive(on) {
      active = on;
      box.classList.toggle("active", on);
      $("simple-pitch").style.cursor = on ? "crosshair" : "";
      for (const b of box.querySelectorAll(".pitch-annotation-tool")) if (!on) b.classList.remove("active");
    }
    setActive(false);
    for (const id of ["custom-move", "custom-arrow"]) $(id).addEventListener("click", () => setActive(false));
    const renderBefore = renderSimple;
    renderSimple = function (...args) {
      adoptCarry();
      const value = renderBefore.apply(this, args);
      pitchAnnotationsRender(zones, simpleState?.annotations);
      return value;
    };
    const saveBefore = saveSimple;
    saveSimple = function (...args) {
      adoptCarry();
      return saveBefore.apply(this, args);
    };
    const withCarry = (fn, keep) =>
      function (...args) {
        const previous = carry;
        carry = keep(...args) ? simpleState?.annotations || null : null;
        try {
          return fn.apply(this, args);
        } finally {
          adoptCarry();
          carry = previous;
        }
      };
    // Steps of a predefined scenario: the rebuilt board keeps the annotations.
    loadSimple = withCarry(loadSimple, () => true);
    // A board turned into a custom sequence keeps them; a new animation starts empty.
    createCustomSequence = withCarry(createCustomSequence, (options = {}) => !options.fresh);
    const c = controller({
      host: $("simple-pitch").parentElement,
      layer: zones,
      pointFn: simplePoint,
      read: () => simpleState?.annotations,
      write,
      isActive: () => active,
      tools,
    });
    c.setPitchId(() => "simple-pitch");
    renderSimple();
  }
})();
