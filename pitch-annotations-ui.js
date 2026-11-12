// Zones & pass lines on « Animations » (simpleState.annotations, shared by every
// step of the animation).
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

  // Zones & passes are an Animations tool only (coach's choice): the tactical
  // placement keeps accepting older documents that carry annotations, without
  // showing or editing them.
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
      // Drawing only happens in the large editor, where the tools are visible.
      isActive: () => active && $("simple-board").classList.contains("tactic-fs"),
      tools,
    });
    c.setPitchId(() => "simple-pitch");
    document.addEventListener("tactic-fs-closed", () => setActive(false));
    renderSimple();
  }
})();
