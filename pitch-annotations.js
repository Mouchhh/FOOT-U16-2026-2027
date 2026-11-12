// Coloured transparent zones and pass lines drawn on a pitch (0–100 coordinates),
// shared by « Placement tactique » and « Animations ». Optional on every document.
const pitchAnnotationColors = {
  red: "#e41f28",
  yellow: "#ffd23f",
  blue: "#2373d7",
  green: "#2fa84f",
  white: "#ffffff",
};
const pitchAnnotationColorLabels = { red: "Rouge", yellow: "Jaune", blue: "Bleu", green: "Vert", white: "Blanc" };
const pitchAnnotationLimits = { zones: 40, passes: 60 };
function pitchAnnotationsEmpty() {
  return { zones: [], passes: [] };
}
function pitchAnnotationsValid(a) {
  if (a === undefined) return true;
  const n = (v) => Number.isFinite(v) && v >= 0 && v <= 100,
    id = (v) => typeof v === "string" && v.length > 0 && v.length <= 100,
    color = (v) => Object.hasOwn(pitchAnnotationColors, v);
  return (
    !!a &&
    typeof a === "object" &&
    Array.isArray(a.zones) &&
    Array.isArray(a.passes) &&
    a.zones.length <= pitchAnnotationLimits.zones &&
    a.passes.length <= pitchAnnotationLimits.passes &&
    a.zones.every(
      (z) =>
        z && id(z.id) && ["rect", "ellipse"].includes(z.shape) && n(z.x) && n(z.y) &&
        Number.isFinite(z.w) && Number.isFinite(z.h) && z.w >= 2 && z.h >= 2 &&
        z.x + z.w <= 100.0001 && z.y + z.h <= 100.0001 && color(z.color),
    ) &&
    a.passes.every((p) => p && id(p.id) && n(p.x1) && n(p.y1) && n(p.x2) && n(p.y2) && color(p.color)) &&
    new Set([...a.zones, ...a.passes].map((x) => x.id)).size === a.zones.length + a.passes.length
  );
}
// A drag from (x1,y1) to (x2,y2) becomes a zone or a pass; too small a drag gives null.
function pitchAnnotationFromDrag(tool, shape, color, x1, y1, x2, y2) {
  const clamp = (v) => Math.max(0, Math.min(100, v));
  [x1, y1, x2, y2] = [x1, y1, x2, y2].map(clamp);
  if (tool === "zone") {
    const w = Math.abs(x2 - x1),
      h = Math.abs(y2 - y1);
    if (w < 2 || h < 2) return null;
    return { kind: "zones", item: { id: crypto.randomUUID(), shape, x: Math.min(x1, x2), y: Math.min(y1, y2), w, h, color } };
  }
  if (tool === "pass") {
    if (Math.hypot(x2 - x1, y2 - y1) < 2) return null;
    return { kind: "passes", item: { id: crypto.randomUUID(), x1, y1, x2, y2, color } };
  }
  return null;
}
// SVG rendering: zones under, passes over; every element carries its id for the eraser.
function pitchAnnotationsRender(group, a, preview = null) {
  const ns = "http://www.w3.org/2000/svg";
  group.replaceChildren();
  const items = { zones: [...(a?.zones || [])], passes: [...(a?.passes || [])] };
  if (preview) items[preview.kind].push({ ...preview.item, preview: true });
  for (const z of items.zones) {
    const shape = document.createElementNS(ns, z.shape === "ellipse" ? "ellipse" : "rect"),
      fill = pitchAnnotationColors[z.color];
    if (z.shape === "ellipse")
      for (const [k, v] of Object.entries({ cx: z.x + z.w / 2, cy: z.y + z.h / 2, rx: z.w / 2, ry: z.h / 2 })) shape.setAttribute(k, v);
    else for (const [k, v] of Object.entries({ x: z.x, y: z.y, width: z.w, height: z.h, rx: 0.8 })) shape.setAttribute(k, v);
    shape.setAttribute("fill", fill);
    shape.setAttribute("fill-opacity", "0.28");
    shape.setAttribute("stroke", fill);
    shape.setAttribute("stroke-width", "2");
    shape.setAttribute("vector-effect", "non-scaling-stroke");
    shape.classList.add("pitch-annotation", "pitch-zone");
    shape.dataset.annotationId = z.id;
    if (z.preview) shape.setAttribute("stroke-dasharray", "1 1");
    group.append(shape);
  }
  for (const p of items.passes) {
    const color = pitchAnnotationColors[p.color],
      line = document.createElementNS(ns, "line"),
      angle = Math.atan2(p.y2 - p.y1, p.x2 - p.x1),
      head = document.createElementNS(ns, "path"),
      size = 2.2;
    for (const [k, v] of Object.entries({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2 })) line.setAttribute(k, v);
    line.setAttribute("stroke", color);
    // Pixel widths: the pitch SVG is stretched (preserveAspectRatio none).
    line.setAttribute("stroke-width", "3");
    line.setAttribute("vector-effect", "non-scaling-stroke");
    line.setAttribute("stroke-dasharray", "9 6");
    line.setAttribute("stroke-linecap", "round");
    const a1 = angle + Math.PI - 0.45,
      a2 = angle + Math.PI + 0.45;
    head.setAttribute(
      "d",
      "M" + (p.x2 + Math.cos(a1) * size) + " " + (p.y2 + Math.sin(a1) * size) + "L" + p.x2 + " " + p.y2 + "L" + (p.x2 + Math.cos(a2) * size) + " " + (p.y2 + Math.sin(a2) * size),
    );
    head.setAttribute("fill", "none");
    head.setAttribute("stroke", color);
    head.setAttribute("stroke-width", "3");
    head.setAttribute("vector-effect", "non-scaling-stroke");
    head.setAttribute("stroke-linejoin", "round");
    head.setAttribute("stroke-linecap", "round");
    // A wide transparent stroke makes the dashed line easy to hit with the eraser.
    const hit = document.createElementNS(ns, "line");
    for (const [k, v] of Object.entries({ x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2 })) hit.setAttribute(k, v);
    hit.setAttribute("stroke", "transparent");
    hit.setAttribute("stroke-width", "14");
    hit.setAttribute("vector-effect", "non-scaling-stroke");
    const g = document.createElementNS(ns, "g");
    g.classList.add("pitch-annotation", "pitch-pass");
    g.dataset.annotationId = p.id;
    g.append(hit, line, head);
    group.append(g);
  }
}
// Canvas rendering for image exports; xy maps pitch coordinates to canvas pixels.
function pitchAnnotationsDrawCanvas(ctx, a, xy, scale = 1) {
  if (!a) return;
  ctx.save();
  for (const z of a.zones) {
    const [x1, y1] = xy(z.x, z.y),
      [x2, y2] = xy(z.x + z.w, z.y + z.h),
      color = pitchAnnotationColors[z.color],
      left = Math.min(x1, x2),
      top = Math.min(y1, y2),
      w = Math.abs(x2 - x1),
      h = Math.abs(y2 - y1);
    ctx.beginPath();
    if (z.shape === "ellipse") ctx.ellipse(left + w / 2, top + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    else ctx.rect(left, top, w, h);
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2 * scale;
    ctx.stroke();
  }
  for (const p of a.passes) {
    const [ax, ay] = xy(p.x1, p.y1),
      [bx, by] = xy(p.x2, p.y2),
      angle = Math.atan2(by - ay, bx - ax),
      color = pitchAnnotationColors[p.color],
      size = 14 * scale;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3 * scale;
    ctx.lineCap = "round";
    ctx.setLineDash([10 * scale, 7 * scale]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(bx + Math.cos(angle + Math.PI - 0.45) * size, by + Math.sin(angle + Math.PI - 0.45) * size);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx + Math.cos(angle + Math.PI + 0.45) * size, by + Math.sin(angle + Math.PI + 0.45) * size);
    ctx.stroke();
  }
  ctx.restore();
}
// Geometric hit test (the drawing layers ignore pointer events): topmost element at (x, y).
function pitchAnnotationAt(a, x, y) {
  if (!a) return null;
  const distance = (p) => {
    const dx = p.x2 - p.x1,
      dy = p.y2 - p.y1,
      t = Math.max(0, Math.min(1, ((x - p.x1) * dx + (y - p.y1) * dy) / Math.max(1e-6, dx * dx + dy * dy)));
    return Math.hypot(x - (p.x1 + t * dx), y - (p.y1 + t * dy));
  };
  for (const p of [...a.passes].reverse()) if (distance(p) <= 2.5) return p.id;
  for (const z of [...a.zones].reverse()) {
    if (z.shape === "ellipse") {
      const nx = (x - (z.x + z.w / 2)) / (z.w / 2),
        ny = (y - (z.y + z.h / 2)) / (z.h / 2);
      if (nx * nx + ny * ny <= 1) return z.id;
    } else if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) return z.id;
  }
  return null;
}
function pitchAnnotationsRemove(a, id) {
  return { zones: a.zones.filter((z) => z.id !== id), passes: a.passes.filter((p) => p.id !== id) };
}
// Toolbar shared by both boards. Returns the current choice ({tool, shape, color}).
function pitchAnnotationsToolbar(prefix, { onChange, onClear }) {
  const bar = el("div", "pitch-annotation-tools");
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Zones et lignes de passe");
  const state = { tool: "zone", shape: "rect", color: "yellow" };
  const toolButton = (tool, shape, label, aria) => {
    const b = el("button", "tool pitch-annotation-tool", label);
    b.type = "button";
    b.id = prefix + "-" + tool + (shape ? "-" + shape : "");
    b.dataset.tool = tool;
    if (shape) b.dataset.shape = shape;
    b.setAttribute("aria-label", aria);
    b.onclick = () => {
      state.tool = tool;
      if (shape) state.shape = shape;
      paint();
      onChange?.(state);
    };
    return b;
  };
  const tools = [
    toolButton("zone", "rect", "▭ Zone", "Tracer une zone rectangulaire"),
    toolButton("zone", "ellipse", "◯ Zone ronde", "Tracer une zone ronde"),
    toolButton("pass", null, "⇢ Ligne de passe", "Tracer une ligne de passe"),
    toolButton("erase", null, "⌫ Gomme", "Gomme : cliquer sur une zone ou une passe pour la retirer"),
  ];
  const colors = el("div", "pitch-annotation-colors");
  colors.setAttribute("role", "radiogroup");
  colors.setAttribute("aria-label", "Couleur");
  const swatches = Object.entries(pitchAnnotationColors).map(([key, hex]) => {
    const b = el("button", "pitch-annotation-swatch");
    b.type = "button";
    b.style.setProperty("--swatch", hex);
    b.dataset.color = key;
    b.setAttribute("role", "radio");
    b.setAttribute("aria-label", "Couleur " + pitchAnnotationColorLabels[key]);
    b.onclick = () => {
      state.color = key;
      if (state.tool === "erase") state.tool = "zone";
      paint();
      onChange?.(state);
    };
    colors.append(b);
    return b;
  });
  const clear = el("button", "tool pitch-annotation-clear", "Tout effacer");
  clear.type = "button";
  clear.id = prefix + "-clear";
  clear.setAttribute("aria-label", "Effacer toutes les zones et lignes de passe");
  clear.onclick = () => {
    if (confirm("Effacer toutes les zones et lignes de passe ?")) onClear?.();
  };
  function paint() {
    for (const b of tools) {
      const on = b.dataset.tool === state.tool && (!b.dataset.shape || b.dataset.shape === state.shape);
      b.classList.toggle("active", on);
      b.setAttribute("aria-pressed", String(on));
    }
    for (const b of swatches) b.setAttribute("aria-checked", String(b.dataset.color === state.color));
  }
  bar.append(...tools, colors, clear);
  paint();
  return { bar, state };
}
