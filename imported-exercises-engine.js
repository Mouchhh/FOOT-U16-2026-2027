// Exercise content and animation engine supplied by the coach: Exos foot.html.
window.clubImportedExercises=(()=>{

'use strict';
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const BOOL_PROPS = new Set(['checked', 'selected', 'disabled', 'hidden', 'open', 'required', 'readOnly', 'multiple']);

function append(el, kids) {
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false || c === true) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  let value;
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'value') value = v;
    else if (BOOL_PROPS.has(k)) el[k] = true;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, kids);
  if (value !== undefined) el.value = value;
  return el;
}
const SVGNS = 'http://www.w3.org/2000/svg';
function s(tag, attrs, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  }
  append(el, kids);
  return el;
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const clone = o => JSON.parse(JSON.stringify(o));
const pad = n => String(n).padStart(2, '0');
const todayISO = (d = new Date()) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const norm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const plural = (n, word, many = word + 's') => n + ' ' + (n > 1 ? many : word);
function fmtDate(iso, opts = { weekday: 'long', day: 'numeric', month: 'long' }) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return isNaN(d) ? iso : d.toLocaleDateString('fr-FR', opts);
}
function addMinutes(time, minutes) {
  const [hh, mm] = String(time || '00:00').split(':').map(Number);
  const t = (hh * 60 + mm + minutes) % 1440;
  return pad(Math.floor(t / 60)) + 'h' + pad(t % 60);
}
function safeName(n) { return String(n || 'document').replace(/[\\/:*?"<>|]+/g, '-').trim().slice(0, 80) || 'document'; }
function download(blob, name) {
  const a = h('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3000);
}

// ---------- Stockage : tout reste dans le navigateur de cet appareil ----------
const ICONS = {
  home: 'M3 11 12 4l9 7v9h-6v-6H9v6H3z',
  pitch: 'M4 4h16v16H4zM4 12h16M15 12a3 3 0 1 1-6 0 3 3 0 1 1 6 0',
  clip: 'M9 3h6v3H9zM7 5H5v16h14V5h-2M9 11h6M9 15h4',
  cal: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
  chart: 'M5 20V11M11 20V5M17 20v-6M3 20h18',
  users: 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM2 21c0-4 3-6 7-6s7 2 7 6M16 3.5a4 4 0 0 1 0 7.5M22 21c0-3-1.5-5-4-5.6',
  chat: 'M4 5h16v11H9l-5 4z',
  play: 'M7 5v14l12-7z',
  plus: 'M12 5v14M5 12h14'
};
function icon(name) {
  return s('svg', { viewBox: '0 0 24 24', class: 'ico', 'aria-hidden': 'true' },
    s('path', { d: ICONS[name] || '', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
}
function btn(label, onclick, cls = 'btn') { return h('button', { class: cls, type: 'button', onclick }, label); }
function field(label, input, hint) { return h('label', { class: 'field' }, h('span', {}, label), input, hint ? h('small', {}, hint) : null); }

// Terrain interactif partagé par la compo, la tactique animée et les exercices.
// Modèle : { kind:'pitch'|'field', W, H, tokens:[{id,type,label,name,color,rot}], frames:[{id:[x,y]}], arrows:[[x1,y1,x2,y2,'c'|'p']] }
// frames[0] est le placement de départ ; chaque étape suivante est un instantané des positions.

const TEAM_COLORS = { home: '#214fa0', away: '#d62828', keeper: '#f2c230', neutral: '#eef2f7' };
const TOKEN_LABELS = { home: 'Joueur bleu', away: 'Joueur rouge', keeper: 'Gardien', neutral: 'Appui', ball: 'Ballon', cone: 'Plot', disc: 'Coupelle', mini: 'Mini-but', goal: 'But' };
const DRAW_ORDER = { disc: 0, cone: 1, goal: 1, mini: 1, neutral: 2, away: 3, home: 3, keeper: 3, ball: 4 };

// Positions (en % : x de gauche à droite, y du haut vers le bas, notre but en bas).
const FORMATIONS = {
  '4-3-3': [[50, 93], [14, 74], [37, 78], [63, 78], [86, 74], [28, 56], [50, 61], [72, 56], [16, 32], [50, 26], [84, 32]],
  '4-4-2': [[50, 93], [14, 74], [37, 78], [63, 78], [86, 74], [12, 52], [37, 56], [63, 56], [88, 52], [38, 29], [62, 29]],
  '4-2-3-1': [[50, 93], [14, 74], [37, 78], [63, 78], [86, 74], [38, 62], [62, 62], [16, 41], [50, 43], [84, 41], [50, 24]],
  '4-1-4-1': [[50, 93], [14, 74], [37, 78], [63, 78], [86, 74], [50, 64], [12, 46], [37, 48], [63, 48], [88, 46], [50, 25]],
  '3-5-2': [[50, 93], [26, 77], [50, 79], [74, 77], [9, 52], [32, 59], [50, 52], [68, 59], [91, 52], [38, 29], [62, 29]],
  '3-4-3': [[50, 93], [26, 77], [50, 79], [74, 77], [12, 54], [38, 58], [62, 58], [88, 54], [18, 31], [50, 25], [82, 31]],
  '5-3-2': [[50, 93], [8, 66], [28, 77], [50, 79], [72, 77], [92, 66], [30, 53], [50, 57], [70, 53], [38, 29], [62, 29]],
  '5-4-1': [[50, 93], [8, 68], [28, 77], [50, 79], [72, 77], [92, 68], [14, 52], [38, 55], [62, 55], [86, 52], [50, 30]]
};

function pitchModel() { return { kind: 'pitch', W: 100, H: 154, tokens: [], frames: [{}], arrows: [], lanes: false }; }
function fieldModel(lengthM, widthM) {
  return { kind: 'field', W: 100, H: Math.round(1000 * widthM / lengthM) / 10, len: lengthM, wid: widthM, tokens: [], frames: [{}], arrows: [] };
}
function addToken(model, tok, x, y) {
  tok.id = tok.id || uid(); model.tokens.push(tok);
  for (const f of model.frames) f[tok.id] = [x, y];
  return tok;
}
function removeToken(model, id) {
  model.tokens = model.tokens.filter(t => t.id !== id);
  for (const f of model.frames) delete f[id];
}

// Exercices : fond blanc, quadrillage bleu vif d'un mètre (trait fort tous les 5 m), cotes en marge.
const PAD = 10;
function drawLab(m, id) {
  const g = s('g'), { W, H } = m, u = W / (m.len || 30), x0 = -PAD, y0 = -PAD, w = W + 2 * PAD, hh = H + 2 * PAD;
  g.append(s('defs', {},
    s('pattern', { id: id + '-g1', width: u, height: u, patternUnits: 'userSpaceOnUse', x: 0, y: 0 }, s('path', { d: `M ${u} 0 L 0 0 0 ${u}`, fill: 'none', stroke: 'rgba(31,107,255,.2)', 'stroke-width': .12 })),
    s('pattern', { id: id + '-g5', width: u * 5, height: u * 5, patternUnits: 'userSpaceOnUse', x: 0, y: 0 }, s('path', { d: `M ${u * 5} 0 L 0 0 0 ${u * 5}`, fill: 'none', stroke: 'rgba(31,107,255,.55)', 'stroke-width': .22 })),
    s('radialGradient', { id: id + '-glow', cx: '50%', cy: '50%', r: '60%' }, s('stop', { offset: '0%', 'stop-color': '#dfeaff', 'stop-opacity': .9 }), s('stop', { offset: '100%', 'stop-color': '#ffffff', 'stop-opacity': 0 }))));
  g.append(s('rect', { x: x0, y: y0, width: w, height: hh, fill: '#ffffff' }), s('rect', { x: x0, y: y0, width: w, height: hh, fill: `url(#${id}-glow)` }),
    s('rect', { x: x0, y: y0, width: w, height: hh, fill: `url(#${id}-g1)` }), s('rect', { x: x0, y: y0, width: w, height: hh, fill: `url(#${id}-g5)` }),
    s('rect', { x: 0, y: 0, width: W, height: H, fill: 'rgba(40,170,100,.06)', stroke: '#0d1b36', 'stroke-width': .45 }));
  for (const [zx, zy, zw, zh, label] of m.zones || []) {
    if (zw < .5 || zh < .5) g.append(s('line', { x1: zx, y1: zy, x2: zx + zw, y2: zy + zh, stroke: '#1f6bff', 'stroke-width': .3, 'stroke-dasharray': '1.2 1' }));
    else g.append(s('rect', { x: zx, y: zy, width: zw, height: zh, fill: 'rgba(31,107,255,.07)', stroke: '#1f6bff', 'stroke-width': .25, 'stroke-dasharray': '1.2 1' }),
      label ? s('text', { x: zx + zw / 2, y: zy + 3, 'text-anchor': 'middle', class: 'lab-mono', 'font-size': 1.9, fill: '#1f4fb0' }, label.toUpperCase()) : null);
  }
  const mono = { class: 'lab-mono', 'font-size': 2.5, fill: '#1f4fb0' }, tick = { stroke: '#1f6bff', 'stroke-width': .22 };
  g.append(s('line', { x1: 0, y1: -4, x2: W, y2: -4, ...tick }), s('line', { x1: 0, y1: -5.2, x2: 0, y2: -2.8, ...tick }), s('line', { x1: W, y1: -5.2, x2: W, y2: -2.8, ...tick }),
    s('rect', { x: W / 2 - 5, y: -5.6, width: 10, height: 3.2, fill: '#ffffff' }), s('text', { x: W / 2, y: -3.2, 'text-anchor': 'middle', ...mono }, (m.len || '') + ' m'),
    s('line', { x1: -4, y1: 0, x2: -4, y2: H, ...tick }), s('line', { x1: -5.2, y1: 0, x2: -2.8, y2: 0, ...tick }), s('line', { x1: -5.2, y1: H, x2: -2.8, y2: H, ...tick }),
    s('g', { transform: `translate(-3.2 ${H / 2}) rotate(-90)` }, s('rect', { x: -5, y: -2.4, width: 10, height: 3.2, fill: '#ffffff' }), s('text', { x: 0, y: 0, 'text-anchor': 'middle', ...mono }, (m.wid || '') + ' m')),
    s('text', { x: W, y: H + 5.5, 'text-anchor': 'end', ...mono, 'font-size': 1.8, fill: '#5d7ab8' }, '1 carreau = 1 m'));
  return g;
}
function drawField(m, id) {
  if (m.kind !== 'pitch') return drawLab(m, id);
  const g = s('g'), { W, H } = m;
  g.append(s('rect', { x: 0, y: 0, width: W, height: H, fill: '#2f7a4a' }));
  const stripes = m.kind === 'pitch' ? 10 : 8;
  for (let i = 1; i < stripes; i += 2) g.append(m.kind === 'pitch'
    ? s('rect', { x: 0, y: i * H / stripes, width: W, height: H / stripes, fill: '#358453' })
    : s('rect', { x: i * W / stripes, y: 0, width: W / stripes, height: H, fill: '#358453' }));
  const L = { fill: 'none', stroke: 'rgba(255,255,255,.85)', 'stroke-width': .45 };
  const x0 = 3, y0 = 3, w = 94, hh = 148, mid = y0 + hh / 2, sx = w / 68, sy = hh / 105;
  if (m.lanes) for (const x of [x0 + w * .2, x0 + w * .37, x0 + w * .63, x0 + w * .8])
    g.append(s('line', { x1: x, y1: y0, x2: x, y2: y0 + hh, stroke: 'rgba(255,255,255,.4)', 'stroke-width': .3, 'stroke-dasharray': '1.5 1.5' }));
  g.append(s('rect', { ...L, x: x0, y: y0, width: w, height: hh }), s('line', { ...L, x1: x0, y1: mid, x2: x0 + w, y2: mid }),
    s('circle', { ...L, cx: 50, cy: mid, r: 9.15 * sx }), s('circle', { cx: 50, cy: mid, r: .6, fill: '#fff' }));
  for (const top of [true, false]) {
    const y = top ? y0 : y0 + hh, d = top ? 1 : -1, pa = 40.3 * sx, pd = 16.5 * sy, ga = 18.32 * sx, gd = 5.5 * sy;
    g.append(s('rect', { ...L, x: 50 - pa / 2, y: top ? y : y - pd, width: pa, height: pd }),
      s('rect', { ...L, x: 50 - ga / 2, y: top ? y : y - gd, width: ga, height: gd }),
      s('circle', { cx: 50, cy: y + d * 11 * sy, r: .5, fill: '#fff' }));
    const r = 9.15 * sx, cy = y + d * 11 * sy, yy = y + d * pd, dx = Math.sqrt(Math.max(0, r * r - (yy - cy) ** 2));
    g.append(s('path', { ...L, d: `M${50 - dx} ${yy} A ${r} ${r} 0 0 ${top ? 0 : 1} ${50 + dx} ${yy}` }));
    const gw = 7.32 * sx;
    g.append(s('rect', { x: 50 - gw / 2, y: top ? y - 1.6 : y, width: gw, height: 1.6, fill: 'none', stroke: '#fff', 'stroke-width': .4 }));
  }
  return g;
}

const LAB_COLORS = { home: '#1f5fe0', away: '#e5383b', keeper: '#f2b705', neutral: '#ffffff' };
function drawToken(t, [x, y], m, selected) {
  const r = m.kind === 'pitch' ? 3.6 : 2.7, lab = m.kind !== 'pitch';
  const g = s('g', { class: 'tok tok-' + t.type + (selected ? ' sel' : '') + (t.ghost ? ' ghost' : ''), transform: `translate(${x} ${y})`, 'data-id': t.id });
  if (lab && ['home', 'away', 'keeper', 'neutral'].includes(t.type)) {
    const c = t.color && t.color !== '#214fa0' ? t.color : LAB_COLORS[t.type], dark = t.type === 'keeper' || t.type === 'neutral';
    g.append(s('circle', { r: r + 1.3, fill: c, opacity: .16 }),
      s('circle', { class: 'tok-body', r, fill: c, stroke: dark ? '#0d1b36' : '#ffffff', 'stroke-width': dark ? .3 : .4, 'stroke-dasharray': t.ghost ? '.8 .6' : null }),
      s('text', { y: r * .36, 'text-anchor': 'middle', 'font-size': r * .98, 'font-weight': 700, fill: dark ? '#0d1b36' : '#fff' }, t.label || ''));
  } else if (['home', 'away', 'keeper', 'neutral'].includes(t.type)) {
    const dark = t.type === 'keeper' || t.type === 'neutral';
    g.append(s('circle', { r: r + .4, cy: .6, fill: 'rgba(0,0,0,.28)' }),
      s('circle', { class: 'tok-body', r, fill: t.color || TEAM_COLORS[t.type], stroke: dark ? '#5b6b82' : '#fff', 'stroke-width': .5 }),
      s('text', { y: r * .38, 'text-anchor': 'middle', 'font-size': r * 1.02, 'font-weight': 700, fill: dark ? '#14213d' : '#fff' }, t.label || ''));
    if (t.name) {
      const label = t.name.slice(0, 14), w = Math.max(8, label.length * 1.45 + 2.4);
      g.append(s('rect', { x: -w / 2, y: r + .9, width: w, height: 3.5, rx: 1.2, fill: 'rgba(10,20,40,.8)' }),
        s('text', { y: r + 3.5, 'text-anchor': 'middle', 'font-size': 2.25, fill: '#fff', 'font-weight': 600 }, label));
    }
  } else if (t.type === 'ball') {
    g.append(s('circle', { r: lab ? 1.3 : 1.55, fill: '#fff', stroke: '#14213d', 'stroke-width': .3 }), s('circle', { r: .5, fill: '#14213d' }));
  } else if (t.type === 'cone') {
    g.append(s('path', { d: 'M0 -2.4 L1.9 1.6 L-1.9 1.6Z', fill: '#ff8a1f', stroke: '#fff', 'stroke-width': .25 }));
  } else if (t.type === 'disc') {
    g.append(s('ellipse', { rx: 1.4, ry: .8, fill: '#ffd23f', stroke: '#a07a00', 'stroke-width': .2 }));
  } else if (t.type === 'goal' || t.type === 'mini') {
    const w = t.type === 'goal' ? 11 : 6, d = t.type === 'goal' ? 2.6 : 1.8, gg = s('g', { transform: `rotate(${t.rot || 0})` });
    gg.append(s('rect', { x: -w / 2, y: -d / 2, width: w, height: d, fill: 'rgba(255,255,255,.2)', stroke: '#fff', 'stroke-width': .5 }));
    for (let i = 1; i < 5; i++) gg.append(s('line', { x1: -w / 2 + i * w / 5, y1: -d / 2, x2: -w / 2 + i * w / 5, y2: d / 2, stroke: 'rgba(255,255,255,.55)', 'stroke-width': .15 }));
    g.append(gg);
  }
  g.append(s('circle', { r: r + 1.2, fill: 'transparent' })); // zone de saisie plus large au doigt
  return g;
}

function arrowDefs(id, kind) {
  const set = kind === 'pitch' ? ARROWS : LAB_ARROWS;
  const marker = (suffix, fill) => s('marker', { id: id + suffix, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 4.5, markerHeight: 4.5, orient: 'auto' },
    s('path', { d: 'M0 0 10 5 0 10z', fill }));
  return s('defs', {}, ...Object.entries(set).map(([k, a]) => marker('-' + k, a.color)));
}
const ARROWS = { c: { color: '#ffffff', dash: null, w: .55 }, p: { color: '#ffd23f', dash: '1.6 1.1', w: .55 }, d: { color: '#7ee0a8', dash: '.35 .8', w: .7 }, s: { color: '#ffd23f', dash: null, w: .9 } };
const LAB_ARROWS = { c: { color: '#0d1b36', dash: null, w: .5 }, p: { color: '#f08c00', dash: '1.6 1.1', w: .6 }, d: { color: '#16a34a', dash: '.35 .8', w: .75 }, s: { color: '#f08c00', dash: null, w: .95 } };
function drawArrow([x1, y1, x2, y2, k = 'c'], id, kind = 'pitch') {
  const set = kind === 'pitch' ? ARROWS : LAB_ARROWS, a = set[k] || set.c;
  return s('line', { x1, y1, x2, y2, stroke: a.color, 'stroke-width': a.w, 'stroke-linecap': 'round', 'stroke-dasharray': a.dash, 'marker-end': `url(#${id}-${set[k] ? k : 'c'})` });
}

function exportPNG(svg, name) {
  const vb = svg.viewBox.baseVal, scale = 16, copy = svg.cloneNode(true);
  copy.setAttribute('width', vb.width * scale); copy.setAttribute('height', vb.height * scale);
  copy.setAttribute('xmlns', SVGNS); copy.setAttribute('font-family', 'Inter, Arial, sans-serif');
  const img = new Image();
  img.onload = () => {
    const canvas = h('canvas', { width: vb.width * scale, height: vb.height * scale });
    canvas.getContext('2d').drawImage(img, 0, 0);
    canvas.toBlob(b => { download(b, safeName(name) + '.png'); toast('Image téléchargée.'); }, 'image/png');
  };
  img.onerror = () => toast('Export impossible dans ce navigateur.');
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(copy));
}

function createBoard(model, opts = {}) {
  // lines: false masque flèches et traces (jeux), on les garde pour les circuits de passes.
  const { onChange = () => {}, editable = true, toolbar = true, palette = false, animate = true, title = 'Terrain', viewer = false, lines = true } = opts;
  const id = 'b' + Math.random().toString(36).slice(2, 8);
  let cur = 0, tool = 'move', sel = null, playing = null, drag = null, speed = 1;
  const pad = model.kind === 'pitch' ? 0 : PAD;
  const svg = s('svg', { viewBox: `${-pad} ${-pad} ${model.W + 2 * pad} ${model.H + 2 * pad}`, class: 'board-svg ' + model.kind, role: 'img', 'aria-label': title });
  const fieldLayer = s('g'), arrowLayer = s('g'), trailLayer = s('g'), tokLayer = s('g');
  svg.append(arrowDefs(id, model.kind), fieldLayer, arrowLayer, trailLayer, tokLayer);
  const tools = h('div', { class: 'board-tools' }), frameBar = h('div', { class: 'frame-bar' });
  const showViewer = viewer && !editable && model.frames.length > 1, viewBar = h('div', { class: 'view-bar' });
  const wrap = h('div', { class: 'board' + (editable ? ' editable' : '') }, toolbar && editable ? tools : null, h('div', { class: 'board-stage' }, svg), animate && editable ? frameBar : null, showViewer ? viewBar : null);

  const pos = (tid, f = cur) => model.frames[f]?.[tid] || model.frames[0][tid] || [model.W / 2, model.H / 2];
  const sorted = () => [...model.tokens].sort((a, b) => (DRAW_ORDER[a.type] ?? 2) - (DRAW_ORDER[b.type] ?? 2));
  const drawArrows = () => arrowLayer.replaceChildren(...model.arrows.map(a => drawArrow(a, id, model.kind)));

  function render(positions) {
    if (!lines || (showViewer && (cur > 0 || positions))) arrowLayer.replaceChildren(); else drawArrows();
    trailLayer.replaceChildren();
    if (lines && !positions && cur > 0) {
      const moved = model.tokens.filter(t => { const a = pos(t.id, cur - 1), b = pos(t.id, cur); return Math.hypot(a[0] - b[0], a[1] - b[1]) > 1.5; });
      const together = (x, y) => Math.hypot(pos(x.id, cur - 1)[0] - pos(y.id, cur - 1)[0], pos(x.id, cur - 1)[1] - pos(y.id, cur - 1)[1]) < 5 && Math.hypot(pos(x.id, cur)[0] - pos(y.id, cur)[0], pos(x.id, cur)[1] - pos(y.id, cur)[1]) < 5;
      for (const t of moved) {
        const isBall = t.type === 'ball', mate = moved.find(o => (o.type === 'ball') !== isBall && together(t, o));
        if (isBall && mate) continue;
        const a = pos(t.id, cur - 1), b = pos(t.id, cur);
        trailLayer.append(drawArrow([a[0], a[1], b[0], b[1], isBall ? 'p' : mate ? 'd' : 'c'], id, model.kind));
      }
    }
    tokLayer.replaceChildren(...sorted().map(t => drawToken(t, positions?.[t.id] || pos(t.id), model, t.id === sel)));
    if (!positions) { renderFrames(); renderTools(); renderViewer(); }
  }
  function renderViewer() {
    if (!showViewer) return;
    const n = model.frames.length - 1;
    viewBar.replaceChildren(btn(playing ? '❚❚' : '▶', () => (playing ? stop() : play()), 'btn primary sm view-play'),
      btn('↺', () => { stop(); cur = 0; render(); }, 'btn ghost sm'),
      h('div', { class: 'view-steps' }, model.frames.map((_, i) => h('button', { type: 'button', class: 'view-dot' + (i === cur ? ' on' : i < cur ? ' done' : ''), 'aria-label': 'Étape ' + i, onclick: () => { stop(); cur = i; render(); } }))),
      h('span', { class: 'view-caption' }, h('b', {}, cur === 0 ? 'Départ' : cur + '/' + n), ' ', model.labels?.[cur] && cur ? model.labels[cur] : 'Placement initial'));
  }

  function point(e) {
    const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
    const q = p.matrixTransform(svg.getScreenCTM().inverse());
    return [Math.max(0, Math.min(model.W, q.x)), Math.max(0, Math.min(model.H, q.y))];
  }
  if (editable) {
    svg.tabIndex = 0;
    svg.addEventListener('pointerdown', e => {
      if (playing || e.button > 0) return;
      const g = e.target.closest('.tok'), p = point(e);
      if (tool === 'move' && g) {
        const tid = g.dataset.id, [x, y] = pos(tid);
        sel = tid; model.frames[cur][tid] = [x, y];
        drag = { tid, dx: x - p[0], dy: y - p[1], moved: false };
      } else if (tool === 'move') { sel = null; render(); return; }
      else { drag = { arrow: [p[0], p[1], p[0], p[1], tool === 'pass' ? 'p' : 'c'] }; model.arrows.push(drag.arrow); }
      svg.setPointerCapture(e.pointerId); e.preventDefault(); if (drag.tid) render();
    });
    svg.addEventListener('pointermove', e => {
      if (!drag) return;
      const p = point(e);
      if (drag.arrow) { drag.arrow[2] = p[0]; drag.arrow[3] = p[1]; drawArrows(); return; }
      const np = [Math.max(1, Math.min(model.W - 1, p[0] + drag.dx)), Math.max(1, Math.min(model.H - 1, p[1] + drag.dy))];
      model.frames[cur][drag.tid] = np; drag.moved = true;
      tokLayer.querySelector(`[data-id="${CSS.escape(drag.tid)}"]`)?.setAttribute('transform', `translate(${np[0]} ${np[1]})`);
    });
    const end = () => {
      if (!drag) return;
      let changed = drag.moved;
      if (drag.arrow) { const a = drag.arrow; if (Math.hypot(a[2] - a[0], a[3] - a[1]) < 2.5) model.arrows.pop(); else changed = true; }
      drag = null; render(); if (changed) onChange();
    };
    svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
    svg.addEventListener('keydown', e => {
      const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
      if (d && sel) { e.preventDefault(); const [x, y] = pos(sel); model.frames[cur][sel] = [x + d[0], y + d[1]]; render(); onChange(); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel && palette) { e.preventDefault(); removeToken(model, sel); sel = null; render(); onChange(); }
    });
  }

  function segmented(options, value, onpick) {
    return h('div', { class: 'seg' }, options.map(([v, l]) => h('button', { type: 'button', class: v === value ? 'on' : '', 'aria-pressed': String(v === value), onclick: () => onpick(v) }, l)));
  }
  function addFromPalette(type) {
    const same = model.tokens.filter(t => t.type === type).length;
    const label = ['home', 'away'].includes(type) ? String(same + 1) : type === 'keeper' ? 'G' : type === 'neutral' ? 'A' : '';
    const t = addToken(model, { type, label, rot: ['goal', 'mini'].includes(type) ? 90 : 0 }, model.W / 2 + (same % 5) * 3, model.H / 2 + (same % 3) * 3);
    sel = t.id; render(); onChange();
  }
  function renderTools() {
    if (!toolbar || !editable) return;
    const items = [segmented([['move', 'Déplacer'], ['course', 'Course →'], ['pass', 'Passe ⇢']], tool, v => { tool = v; svg.dataset.tool = v; renderTools(); })];
    if (palette) {
      const menu = h('details', { class: 'palette' }, h('summary', { class: 'btn ghost sm' }, '+ Ajouter'),
        h('div', { class: 'palette-menu' }, Object.entries(TOKEN_LABELS).map(([type, label]) =>
          h('button', { type: 'button', onclick: () => { menu.open = false; addFromPalette(type); } }, h('i', { class: 'swatch sw-' + type }), label))));
      items.push(menu);
      if (sel) {
        const t = model.tokens.find(t => t.id === sel);
        if (t && ['goal', 'mini'].includes(t.type)) items.push(btn('↻ Pivoter', () => { t.rot = ((t.rot || 0) + 45) % 360; render(); onChange(); }, 'btn ghost sm'));
        if (t && ['home', 'away', 'keeper', 'neutral'].includes(t.type)) {
          const lab = h('input', { class: 'tiny-input', value: t.label, maxlength: 3, 'aria-label': 'Numéro de l’élément' });
          lab.oninput = () => { t.label = lab.value; tokLayer.querySelector(`[data-id="${CSS.escape(t.id)}"] text`).textContent = lab.value; onChange(); };
          items.push(lab);
        }
        items.push(btn('Supprimer', () => { removeToken(model, sel); sel = null; render(); onChange(); }, 'btn ghost sm danger'));
      }
    }
    items.push(model.arrows.length ? btn('Effacer les flèches', () => { model.arrows = []; render(); onChange(); }, 'btn ghost sm') : null,
      btn('↓ Image', () => exportPNG(svg, title), 'btn ghost sm'));
    tools.replaceChildren(); append(tools, items);
  }

  function renderFrames() {
    if (!animate || !editable) return;
    const n = model.frames.length;
    const speedSel = h('select', { class: 'sm-select', 'aria-label': 'Vitesse' }, [['0.5', 'Lent'], ['1', 'Normal'], ['1.6', 'Rapide']].map(([v, l]) => h('option', { value: v }, l)));
    speedSel.value = String(speed); speedSel.onchange = () => { speed = Number(speedSel.value); };
    frameBar.replaceChildren(); append(frameBar, [h('span', { class: 'fb-label' }, 'Animation'),
      h('div', { class: 'chips' }, model.frames.map((_, i) => h('button', { type: 'button', class: 'chip' + (i === cur ? ' on' : ''), onclick: () => { stop(); cur = i; render(); } }, i === 0 ? 'Départ' : 'Étape ' + i))),
      n < 12 ? btn('+ Étape', () => { stop(); model.frames.splice(cur + 1, 0, clone(model.frames[cur])); cur++; render(); onChange(); toast('Étape ' + cur + ' créée : déplacez les joueurs et le ballon.'); }, 'btn ghost sm') : null,
      cur > 0 ? btn('Retirer l’étape', () => { model.frames.splice(cur, 1); cur--; render(); onChange(); }, 'btn ghost sm') : null,
      n > 1 ? btn(playing ? '■ Stop' : '▶ Lire', () => (playing ? stop() : play()), 'btn primary sm') : h('span', { class: 'hint' }, 'Ajoutez une étape pour animer vos déplacements.'),
      n > 1 ? speedSel : null]);
  }
  function play() {
    const n = model.frames.length - 1; if (n < 1) return;
    const per = (showViewer ? 1700 : 1400) / speed; let start = null; sel = null;
    const step = ts => {
      if (start == null) start = ts;
      const t = Math.min(n, (ts - start) / per), i = Math.min(n - 1, Math.floor(t)), f = t - i, e = f * f * (3 - 2 * f), P = {};
      for (const tk of model.tokens) { const a = pos(tk.id, i), b = pos(tk.id, i + 1); P[tk.id] = [a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e]; }
      render(P); frameBar.querySelectorAll('.chip').forEach((c, k) => c.classList.toggle('on', k === Math.round(t)));
      if (showViewer) { viewBar.querySelectorAll('.view-dot').forEach((c, k) => { c.classList.toggle('on', k === i + 1); c.classList.toggle('done', k <= i); }); const cap = viewBar.querySelector('.view-caption'); if (cap) cap.replaceChildren(h('b', {}, (i + 1) + '/' + n), ' ', model.labels?.[i + 1] || ''); }
      if (t < n && svg.isConnected) playing = requestAnimationFrame(step); else { playing = null; cur = n; render(); }
    };
    if (cur >= n) cur = 0;
    playing = requestAnimationFrame(step); renderFrames(); renderViewer();
  }
  function stop() { if (playing) { cancelAnimationFrame(playing); playing = null; render(); } }

  fieldLayer.replaceChildren(drawField(model, id));
  render();
  return { el: wrap, svg, render: () => render(), redrawField: () => fieldLayer.replaceChildren(drawField(model, id)), stop, play, get frame() { return cur; }, set frame(v) { cur = v; render(); } };
}

// Schéma d'un exercice de la Bible, redessiné pour l'atelier réel (voir adapt.js).
function exerciseBoard(ex, plan, viewer = false) { return createBoard(buildExerciseModel(plan || adapt(ex, currentCtx())), { editable: false, viewer, title: ex.title }); }
function exerciseDiagram(ex, plan) { return exerciseBoard(ex, plan).svg; }


// Adaptation d'un exercice au groupe réel : catégorie d'âge, niveau, effectif, gardiens, espace et moment de la semaine.
// Les exercices « procéduraux » (rondo, possession, jeu…) sont redessinés pour le nombre exact de joueurs ;
// les situations (vagues, circuits, CPA) gardent leur scénario et placent les joueurs en plus en rotation.

const AGE_BANDS = [
  { max: 11, key: 'u11', label: 'U10-U11', space: .6, workMul: .6, note: 'Apprendre en jouant : un ballon par joueur dès que possible, défis courts, aucune file d’attente.' },
  { max: 13, key: 'u13', label: 'U12-U13', space: .72, workMul: .7, note: 'Le jeu avant tout : beaucoup de ballons, consignes courtes, démonstration plutôt qu’explication.' },
  { max: 15, key: 'u15', label: 'U14-U15', space: .85, workMul: .8, note: 'Période de croissance : charges dosées, technique sous pression, valoriser l’effort et la réussite.' },
  { max: 19, key: 'u19', label: 'U16-U19', space: .95, workMul: .9, note: 'Exigence tactique croissante : responsabiliser les joueurs et leur faire verbaliser leurs choix.' },
  { max: 99, key: 'sen', label: 'Seniors', space: 1, workMul: 1, note: 'Intensité proche du match : la charge se règle selon le calendrier et l’état de forme.' }
];
const LEVEL_ADAPT = {
  decouverte: { space: 1.15, variant: 'easier', label: 'Découverte' },
  dev: { space: 1, variant: null, label: 'En développement' },
  confirme: { space: .9, variant: 'harder', label: 'Confirmé' }
};
const INTENSITY = {
  1: { label: 'Faible', color: '#3fb27f', work: 0, rest: 0 },
  2: { label: 'Modérée', color: '#e8b23a', work: 240, rest: 45 },
  3: { label: 'Élevée', color: '#f07b2f', work: 180, rest: 60 },
  4: { label: 'Très élevée', color: '#e23b3b', work: 75, rest: 75 }
};
const MOMENTS = {
  libre: { label: 'Pas de match proche', max: 4, curve: 'Montée progressive jusqu’au cœur de séance, puis retour au calme.' },
  j1: { label: 'J+1 · récupération', max: 2, curve: 'Séance légère : beaucoup de ballons, peu de duels, pas de sprint répété.' },
  dev: { label: 'J-4 / J-3 · développement', max: 4, curve: 'Le jour le plus chargé : situations intenses et jeu à effectif réduit.' },
  j2: { label: 'J-2 · vitesse & placement', max: 3, curve: 'Séries courtes et vives, récupération complète, travail tactique.' },
  jm1: { label: 'J-1 · activation', max: 2, curve: 'Court et tonique : vitesse sans fatigue, coups de pied arrêtés, confiance.' }
};

function ageBand(category) {
  const m = String(category || '').match(/U\s*(\d{1,2})/i);
  const age = m ? Number(m[1]) : 30;
  return AGE_BANDS.find(b => age <= b.max);
}
function fmtSec(sec) { const m = Math.floor(sec / 60), s = Math.round(sec % 60); return m ? m + ' min' + (s ? ' ' + pad(s) : '') : s + ' s'; }
function intensityMeter(level, withLabel = true) {
  const it = INTENSITY[level];
  const el = h('span', { class: 'intensity', title: 'Intensité ' + it.label.toLowerCase() },
    h('span', { class: 'int-bars' }, [1, 2, 3, 4].map(i => h('i', { class: i <= level ? 'on' : '' }))), withLabel ? it.label : null);
  el.style.setProperty('--int', it.color); // une variable CSS ne passe pas par Object.assign(style)
  return el;
}
// Découpage d'un bloc en séries selon l'intensité et l'âge.
function seriesOf(ex, minutes, band) {
  // Une fiche peut imposer ses propres séries (travail, récupération en secondes).
  const it = ex.series ? { work: ex.series[0], rest: ex.series[1] } : INTENSITY[ex.intensity], total = minutes * 60;
  if (!it.work) return { reps: 1, work: total, rest: 0, text: fmtSec(total) + ' en continu' };
  const rest = it.rest, target = Math.round(it.work * band.workMul);
  const reps = Math.max(1, Math.floor((total + rest) / (target + rest)));
  const work = reps === 1 ? total : Math.round((total - (reps - 1) * rest) / reps / 5) * 5;
  return { reps, work, rest, text: reps === 1 ? fmtSec(work) + ' en continu' : reps + ' × ' + fmtSec(work) + ' · récup ' + fmtSec(rest) };
}

function planGroups(ex, N, K) {
  const [mn, ideal, mx] = ex.players;
  let g = Math.max(1, Math.round(N / ideal));
  while (g > 1 && N / g < mn) g--;
  while (N / g > mx && g < 8) g++;
  const base = Math.floor(N / g), rest = N % g;
  const groups = Array.from({ length: g }, (_, i) => ({ n: base + (i < rest ? 1 : 0), k: 0 }));
  for (let i = 0; i < K; i++) groups[i % g].k++;
  return groups;
}
const keepersNeeded = ex => ex.template === 'game' ? (ex.params?.targets === 'goals' ? 2 : 0) : (ex.keepers || 0);

// Répartition des rôles pour un atelier de `field` joueurs de champ.
function splitRoles(ex, field, keepers) {
  const p = ex.params || {}, L = ex.layout || {};
  const r = { home: 0, away: 0, neutral: 0, queue: 0, third: 0, keepers };
  let text;
  if (ex.template === 'free') {
    if (p.hunters) { r.away = Math.max(1, Math.round(field * p.hunters / 12)); r.home = field - r.away; text = r.home + ' joueurs avec ballon · ' + r.away + ' chasseur' + (r.away > 1 ? 's' : ''); }
    else { r.home = field; text = p.pairs ? Math.floor(field / 2) + ' binômes' + (field % 2 ? ' + 1 trio' : '') : field + ' joueurs, un ballon chacun'; }
  }
  else if (ex.template === 'circuit') { const a = (L.home || []).length; r.home = Math.min(a, field); r.queue = Math.max(0, field - a); text = r.home + ' postes' + (r.queue ? ' + ' + r.queue + ' en file' : ''); }
  else if (ex.template === 'rondo') { const d = p.def ? p.def(field) : field <= 5 ? 1 : field <= 8 ? 2 : 3; r.away = d; r.home = field - d; text = r.home + ' contre ' + d; }
  else if (ex.template === 'possession' || ex.template === 'zones') {
    // Au moins 3 contre 3 dès que possible : les appuis s'effacent devant les joueurs d'équipe.
    let nn = p.thirds ? Math.round(field / 3) : (p.neutral || 0);
    nn = Math.min(nn, Math.max(field % 2, field - 6));
    if ((field - nn) % 2) nn += nn === 0 || nn < field - 6 ? 1 : -1;
    r.neutral = nn; r.home = r.away = (field - nn) / 2;
    text = r.home + ' contre ' + r.away + (nn ? ' + ' + nn + (p.thirds ? ' en appui (3e équipe)' : nn > 1 ? ' appuis' : ' appui') : '');
  } else if (ex.template === 'game') {
    if (p.third) { const t = Math.floor(field / 3); r.home = r.away = t; r.third = field - 2 * t; text = t + ' contre ' + t + ' · ' + r.third + ' en attente (3e équipe)'; }
    else if (p.support || p.adv) {
      r.neutral = Math.min(p.support || 0, Math.max(0, field - 4)); const rest = field - r.neutral;
      r.home = Math.ceil((rest + (p.adv || 0)) / 2); r.away = rest - r.home;
      text = r.home + ' contre ' + r.away + (r.neutral ? ' + ' + r.neutral + ' appuis' : '');
    } else { r.home = r.away = Math.floor(field / 2); r.neutral = field % 2; text = r.home + ' contre ' + r.away + (r.neutral ? ' + 1 joker' : ''); }
  } else if (ex.template === 'match') { // jeu à effectif complet : tout le monde joue, appuis éventuels
    // Appuis fixes de la fiche. Option oddJoker (choisie fiche par fiche) : à effectif impair, le joueur en plus est joker ;
    // sans elle, l'équipe en plus a un joueur de plus.
    const fixed = Math.min((L.supports || []).length, Math.max(0, field - 4)), jok = ex.oddJoker ? (field - fixed) % 2 : 0;
    r.neutral = fixed + jok; r.joker = jok; r.home = Math.ceil((field - r.neutral) / 2); r.away = field - r.neutral - r.home;
    text = r.home + ' contre ' + r.away + (fixed ? ' + ' + fixed + ' ' + (p.supportName || (fixed > 1 ? 'appuis' : 'appui')) : '') + (jok ? ' + 1 joker' : '');
  } else { // wave, cpa : scénario fixe, joueurs en plus en rotation
    let hN = (L.home || []).length, aN = (L.away || []).length;
    if (field < hN + aN) { const ratio = field / (hN + aN); hN = Math.max(1, Math.round(hN * ratio)); aN = Math.max(aN ? 1 : 0, field - hN); }
    r.home = hN; r.away = aN; r.queue = Math.max(0, field - hN - aN);
    text = (aN ? hN + ' contre ' + aN : hN + ' joueur' + (hN > 1 ? 's' : '') + ' en action') + (r.queue ? ' + ' + r.queue + ' en rotation' : '');
  }
  if (keepers) text += ' + ' + plural(keepers, 'gardien');
  r.text = text;
  return r;
}

function fitsSpace(groups, [w, l], [W, L]) {
  for (const [a, b] of [[w, l], [l, w]]) for (let cols = 1; cols <= groups; cols++) {
    const rows = Math.ceil(groups / cols);
    if (cols * b + (cols - 1) * 3 <= L && rows * a + (rows - 1) * 3 <= W) return true;
  }
  return false;
}

// ctx : { players, keepers, category, level, moment, space:[largeur, longueur] }
function adapt(ex, ctx) {
  const band = ageBand(ctx.category), lv = LEVEL_ADAPT[ctx.level] || LEVEL_ADAPT.dev;
  const groups = ctx.singleGroup ? [{n:ctx.players,k:ctx.keepers}] : planGroups(ex, Math.max(1, ctx.players), Math.max(0, ctx.keepers));
  const g0 = groups[0], need = keepersNeeded(ex), useK = Math.min(g0.k, need), field = g0.n - useK;
  const procedural = ['free', 'rondo', 'possession', 'zones', 'game', 'match'].includes(ex.template) || !!ex.params?.scale;
  const ref = Math.max(2, ex.players[1] - need);
  const scale = (procedural ? Math.sqrt(Math.max(2, field) / ref) : 1) * band.space * lv.space;
  const size = [Math.max(8, Math.round(ex.size[0] * scale)), Math.max(8, Math.round(ex.size[1] * scale))];
  const roles = splitRoles(ex, field, useK), warn = [];
  if (g0.n < ex.players[0]) warn.push('Prévu pour ' + ex.players[0] + ' joueurs minimum par atelier : rôles réduits, à faire tourner souvent.');
  if (need > useK) warn.push(need === 2 ? 'Sans deux gardiens : on joue vers des mini-buts.' : 'Pas de gardien dans cet atelier : le but est remplacé par deux mini-buts.');
  if (ctx.space && !fitsSpace(groups.length, size, ctx.space)) warn.push('Espace juste : ' + groups.length + ' × ' + size[0] + '×' + size[1] + ' m dans ' + ctx.space[0] + '×' + ctx.space[1] + ' m. Réduisez les ateliers ou alternez.');
  if(g0.k>useK)warn.push((g0.k-useK)+' gardien(s) supplémentaire(s) participent comme joueurs de champ.');
  const moment = MOMENTS[ctx.moment] || MOMENTS.libre;
  if (ex.ages && !ex.ages.includes(band.key)) warn.push('Fiche conçue pour ' + ex.ages.map(k => AGE_BANDS.find(b => b.key === k).label).join(', ') + ' : à adapter pour les ' + band.label + '.');
  if (ex.intensity > moment.max) warn.push('Intensité ' + INTENSITY[ex.intensity].label.toLowerCase() + ' : déconseillée en ' + moment.label + '.');
  const li = { decouverte: 0, dev: 1, confirme: 2 }[ctx.level] ?? 1;
  return { ex, ctx, band, lv, groups, field, useK, needK: need, size, roles, warn,
    variant: lv.variant ? ex[lv.variant] : null, expected: ex.expect?.[li] || ex.success,
    orgText: (groups.length === 1 ? 'Un atelier' : groups.length + ' ateliers en parallèle') + ' · ' + roles.text };
}

// ---------- Construction du schéma pour l'atelier réel ----------
function gridPoints(count, x0, y0, x1, y1) {
  if (!count) return [];
  const cols = Math.max(1, Math.round(Math.sqrt(count * (x1 - x0) / Math.max(1, y1 - y0)))), rows = Math.ceil(count / cols), pts = [];
  for (let i = 0; i < count; i++) {
    const c = i % cols, r = Math.floor(i / cols), inRow = r === rows - 1 ? count - r * cols : cols;
    pts.push([x0 + (x1 - x0) * (c + .5 + (r % 2 ? .22 : -.22) * (inRow > 1 ? 1 : 0)) / inRow, y0 + (y1 - y0) * (r + .5) / rows]);
  }
  return pts;
}
function perimeterPoints(count, inset = 7) {
  const a = inset, b = 100 - inset;
  return Array.from({ length: count }, (_, i) => {
    const t = ((i / count) + .125) % 1 * 4, side = Math.floor(t), f = t - side;
    return side === 0 ? [a + (b - a) * f, a] : side === 1 ? [b, a + (b - a) * f] : side === 2 ? [b - (b - a) * f, b] : [a, b - (b - a) * f];
  });
}
function linePoints(count, x, y0, y1) { return Array.from({ length: count }, (_, i) => [x, count === 1 ? (y0 + y1) / 2 : y0 + (y1 - y0) * i / (count - 1)]); }
function teamShape(count, x0, x1) {
  const cols = Math.max(1, Math.ceil(count / 3)), pts = [];
  let left = count;
  for (let c = 0; c < cols; c++) {
    const inCol = Math.ceil(left / (cols - c)); left -= inCol;
    const x = cols === 1 ? (x0 + x1) / 2 : x0 + (x1 - x0) * c / (cols - 1);
    linePoints(inCol, x, inCol === 1 ? 50 : 18 + (c % 2) * 6, inCol === 1 ? 50 : 82 - (c % 2) * 6).forEach(p => pts.push(p));
  }
  return pts;
}

function buildExerciseModel(plan) {
  const { ex, size, roles } = plan, p = ex.params || {}, L = ex.layout || {};
  const m = fieldModel(size[1], size[0]), P = ([x, y]) => [x * m.W / 100, y * m.H / 100];
  const put = (type, pt, extra = {}) => addToken(m, { type, label: '', ...extra }, ...P(pt));
  const zones = [], moves = [];
  const home = [], away = [], neutral = [];
  let ball = null;
  const ghostRow = (count, start, step, type) => { for (let i = 0; i < Math.min(count, 6); i++) put(type, [start[0] + step * i, start[1]], { ghost: true, label: i === 5 && count > 6 ? '+' + (count - 5) : '' }); };

  if (ex.template === 'free') {
    const all = gridPoints(roles.home + roles.away, 10, 12, 90, 88), step = all.length / Math.max(1, roles.away);
    const hunterIdx = new Set(Array.from({ length: roles.away }, (_, i) => Math.floor(i * step + step / 2)));
    const mine = all.filter((_, i) => !hunterIdx.has(i)), hunters = all.filter((_, i) => hunterIdx.has(i));
    mine.forEach((pt, i) => home.push(put('home', pt, { label: String(i + 1) })));
    hunters.forEach((pt, i) => away.push(put('away', pt, { label: String(i + 1) })));
    [[3, 4], [97, 4], [3, 96], [97, 96]].forEach(pt => put('disc', pt));
    const clampPt = (x, y) => [Math.min(94, Math.max(6, x)), Math.min(92, Math.max(8, y))];
    if (p.pairs) {
      const pairs = []; for (let i = 0; i + 1 < mine.length; i += 2) pairs.push([mine[i], mine[i + 1]]);
      pairs.forEach(([a]) => put('ball', [a[0] + 2.2, a[1] + 2.6]));
      pairs.forEach(([a, b], i) => moves.push([...a, ...b, i ? 'p+' : 'p', 'Passe au partenaire']));
      pairs.forEach(([a], i) => moves.push([...a, ...clampPt(a[0] + (i % 2 ? -12 : 12), a[1] + (i % 3 ? 10 : -10)), i ? 'c+' : 'c', 'Je me déplace après la passe']));
      pairs.forEach(([a, b], i) => moves.push([...b, ...clampPt(a[0] + (i % 2 ? -12 : 12), a[1] + (i % 3 ? 10 : -10)), i ? 'p+' : 'p', 'Passe dans la course']));
    } else {
      mine.forEach(pt => put('ball', [pt[0] + 2.2, pt[1] + 2.6]));
      const waves = [[14, -12], [-16, 14]];
      waves.forEach(([dx, dy], w) => { let prev = mine.map(pt => pt); mine.forEach((pt, i) => { const from = w ? clampPt(pt[0] + waves[0][0] * (i % 2 ? -1 : 1), pt[1] + waves[0][1] * (i % 3 ? -1 : 1)) : pt;
        const to = clampPt(from[0] + dx * (i % 2 ? -1 : 1), from[1] + dy * (i % 3 ? -1 : 1)); moves.push([...from, ...to, i ? 'd+' : 'd', w ? 'Changement de direction au signal' : 'Conduite vers un espace libre']); }); });
      hunters.forEach((pt, i) => { const target = mine[i % mine.length]; moves.push([...pt, ...clampPt(target[0] + 6, target[1]), 'c+', 'Le chasseur attaque un ballon']); });
    }
  } else if (ex.template === 'rondo') {
    const outs = perimeterPoints(roles.home);
    outs.forEach((pt, i) => home.push(put('home', pt, { label: String(i + 1) })));
    gridPoints(roles.away, 36, 38, 64, 62).forEach((pt, i) => away.push(put('away', pt, { label: String(i + 1) })));
    [[1, 1], [99, 1], [1, 99], [99, 99]].forEach(pt => put('disc', pt));
    if (p.gates) [[100, 38], [100, 62]].forEach(pt => put('cone', pt));
    ball = [outs[0][0] + 3, outs[0][1] + 4];
    const o = i => outs[i % outs.length], d0 = gridPoints(roles.away, 36, 38, 64, 62)[0];
    moves.push([...o(0), ...o(1), 'p', 'Passe au soutien'], [...d0, (d0[0] + o(1)[0]) / 2, (d0[1] + o(1)[1]) / 2, 'c+', 'Le défenseur sort']);
    if (outs.length > 3) moves.push([...o(1), ...o(3), 'p', 'Passe qui casse la ligne']);
    moves.push([...o(outs.length > 3 ? 3 : 1), ...o(outs.length > 3 ? 4 : 2), 'p', 'On conserve']);
  } else if (ex.template === 'possession' || ex.template === 'zones') {
    const total = roles.home + roles.away, pts = gridPoints(total, 12, 14, 88, 86);
    pts.forEach((pt, i) => ((i % 2 === 0 && home.length < roles.home) || away.length >= roles.away ? home : away).push(put(((i % 2 === 0 && home.length < roles.home) || away.length >= roles.away) ? 'home' : 'away', pt)));
    home.forEach((t, i) => { t.label = String(i + 1); }); away.forEach((t, i) => { t.label = String(i + 1); });
    const nPts = roles.neutral === 1 ? [[50, 50]] : roles.neutral === 2 ? [[2, 50], [98, 50]] : roles.neutral === 3 ? [[2, 50], [98, 50], [50, 50]] : gridPoints(roles.neutral, 2, 2, 98, 98);
    if (roles.neutral > 4) nPts.splice(0, nPts.length, ...perimeterPoints(roles.neutral, 2));
    nPts.forEach(pt => neutral.push(put('neutral', pt, { label: 'A' })));
    // Un joueur ne se superpose jamais à un appui : on le décale à côté.
    for (const t of [...home, ...away]) { const q = m.frames[0][t.id]; if (nPts.some(([x, y]) => Math.hypot(q[0] * 100 / m.W - x, q[1] * 100 / m.H - y) < 8)) q[0] += 10 * m.W / 100; }
    if (ex.template === 'zones') {
      const z = p.zones || 'thirds';
      if (z === 'thirds') { zones.push([33.3, 0, .01, 100, ''], [66.6, 0, .01, 100, '']); [[33.3, 2], [33.3, 98], [66.6, 2], [66.6, 98]].forEach(pt => put('disc', pt)); }
      if (z === 'end') zones.push([0, 0, 12, 100, 'Zone cible'], [88, 0, 12, 100, 'Zone cible']);
      if (z === 'halves') zones.push([0, 0, 48, 100, 'Carré A'], [52, 0, 48, 100, 'Carré B']);
      if (z === 'lanes') zones.push([0, 0, 100, 18, 'Couloir'], [0, 82, 100, 18, 'Couloir']);
      if (z === 'quad') zones.push([0, 0, 50, 50, ''], [50, 0, 50, 50, ''], [0, 50, 50, 50, ''], [50, 50, 50, 50, '']);
    } else [[1, 1], [99, 1], [1, 99], [99, 99]].forEach(pt => put('disc', pt));
    const hp = home.map(t => m.frames[0][t.id]).map(([x, y]) => [x * 100 / m.W, y * 100 / m.H]);
    if (hp.length === 2) {
      ball = [hp[0][0] + 2.5, hp[0][1] + 3];
      const n0 = neutral.length ? m.frames[0][neutral[0].id].map((v, i) => v * 100 / (i ? m.H : m.W)) : null;
      moves.push([...hp[0], ...hp[1], 'p', 'Passe au partenaire'], ...(n0 ? [[...hp[1], ...n0, 'p', 'Jouer avec l’appui'], [...n0, ...hp[0], 'p', 'Retour au partenaire démarqué']] : [[...hp[0], Math.min(92, hp[0][0] + 14), hp[0][1], 'c', 'Se démarquer']]));
    } else if (hp.length >= 3) {
      ball = [hp[0][0] + 2.5, hp[0][1] + 3];
      const target = p.zones === 'end' ? [93, hp[2][1]] : p.zones === 'lanes' ? [hp[2][0], 9] : [Math.min(92, hp[2][0] + 10), Math.max(8, hp[2][1] - 8)];
      moves.push([...hp[0], ...hp[1], 'p', 'Passe au partenaire libre'], [...hp[2], ...target, 'c+', 'Appel dans l’espace']);
      const ap = away.map(t => m.frames[0][t.id]).map(([x, y]) => [x * 100 / m.W, y * 100 / m.H]);
      ap.slice(0, 2).forEach((a, i) => { const tgt = i ? hp[2] : hp[1]; moves.push([...a, (a[0] + tgt[0]) / 2, (a[1] + tgt[1]) / 2, 'c+', '']); });
      const n0 = neutral.length ? m.frames[0][neutral[0].id].map((v, i) => v * 100 / (i ? m.H : m.W)) : null;
      if (n0) moves.push([...hp[1], ...n0, 'p', 'Appui de l’appui'], [...n0, ...target, 'p', 'Trouver l’appel']);
      else moves.push([...hp[1], ...target, 'p', 'Trouver l’appel']);
    }
  } else if (ex.template === 'game') {
    const goals = p.targets === 'goals' && plan.useK >= 2;
    teamShape(roles.home, 14, 42).forEach((pt, i) => home.push(put('home', pt, { label: String(i + 1) })));
    teamShape(roles.away, 86, 58).forEach((pt, i) => away.push(put('away', pt, { label: String(i + 1) })));
    if (roles.neutral && (p.support || p.adv)) { // appuis répartis sur les deux lignes de côté
      const perSide = Math.ceil(roles.neutral / 2);
      for (let i = 0; i < roles.neutral; i++) { const idx = Math.floor(i / 2); neutral.push(put('neutral', [perSide === 1 ? 50 : 25 + 50 * idx / (perSide - 1), i % 2 ? 98 : 2], { label: 'A' })); }
    }
    else if (roles.neutral) neutral.push(put('neutral', [50, 50], { label: 'J' }));
    if (p.zones === 'thirds') { zones.push([33.3, 0, .01, 100, ''], [66.6, 0, .01, 100, '']); }
    if (p.zones === 'halves') zones.push([50, 0, .01, 100, '']);
    if (goals) { put('goal', [1.5, 50], { rot: 90 }); put('goal', [98.5, 50], { rot: 90 }); put('keeper', [5, 50], { label: 'G' }); put('keeper', [95, 50], { label: 'G' }); }
    else if (p.targets === 'gates') [[99, 22], [99, 34], [99, 66], [99, 78], [1, 22], [1, 34], [1, 66], [1, 78]].forEach(pt => put('cone', pt));
    else if (p.targets === 'three') [[99, 20], [99, 50], [99, 80], [1, 20], [1, 50], [1, 80]].forEach(pt => put('mini', pt, { rot: 90 }));
    else [[99, 25], [99, 75], [1, 25], [1, 75]].forEach(pt => put('mini', pt, { rot: 90 }));
    if (p.lanes) zones.push([0, 0, 100, 18, 'Couloir protégé'], [0, 82, 100, 18, 'Couloir protégé']);
    if (roles.third) ghostRow(roles.third, [30, 106], 5, 'neutral');
    const hp = home.map(t => m.frames[0][t.id]).map(([x, y]) => [x * 100 / m.W, y * 100 / m.H]);
    const back = hp[0], front = hp[hp.length - 1], mid = hp[Math.floor(hp.length / 2)] || front;
    ball = [back[0] + 2.5, back[1] + 3];
    const goalPt = goals ? [99, 50] : p.targets === 'gates' ? [99, 28] : [99, 25];
    moves.push([...back, ...mid, 'p', 'Relance vers le relais'], [...front, Math.min(88, front[0] + 22), front[1] < 50 ? 28 : 72, 'c+', 'Appel en profondeur'],
      [...mid, Math.min(88, front[0] + 22), front[1] < 50 ? 28 : 72, 'p', 'Passe dans la course'], [Math.min(88, front[0] + 22), front[1] < 50 ? 28 : 72, ...goalPt, 's', 'Finition']);
  } else if (ex.template === 'match') {
    ball = buildMatch(plan, L, put, zones, moves);
  } else { // wave, circuit, cpa : scénario dessiné à la main
    const hList = (L.home || []).slice(0, roles.home), aList = (L.away || []).slice(0, roles.away);
    (L.discs || []).forEach(pt => put('disc', pt)); (L.cones || []).forEach(pt => put('cone', pt));
    const keeperPts = L.keepers || [], noKeeper = plan.needK > plan.useK;
    (L.goals || []).forEach(g => { if (noKeeper && ex.keepers) { put('mini', [g[0], g[1] - 18], { rot: g[2] || 0 }); put('mini', [g[0], g[1] + 18], { rot: g[2] || 0 }); } else put('goal', g, { rot: g[2] || 0 }); });
    (L.minis || []).forEach(g => put('mini', g, { rot: g[2] || 0 }));
    hList.forEach((pt, i) => home.push(put('home', pt, { label: String(i + 1) })));
    aList.forEach((pt, i) => away.push(put('away', pt, { label: String(i + 1) })));
    (L.neutral || []).forEach(pt => neutral.push(put('neutral', pt, { label: 'A' })));
    if (!noKeeper) keeperPts.forEach(pt => put('keeper', pt, { label: 'G' }));
    (L.zones || []).forEach(z => zones.push(z));
    ball = L.ball || null;
    // Sans gardien, ce qu'il faisait part du défenseur le plus proche.
    const remap = pt => { if (!noKeeper || !hList.length) return pt; const k = keeperPts.find(kp => Math.hypot(kp[0] - pt[0], kp[1] - pt[1]) < 7); return k ? [...hList.slice().sort((a, b) => Math.hypot(a[0] - k[0], a[1] - k[1]) - Math.hypot(b[0] - k[0], b[1] - k[1]))[0]] : pt; };
    if (ball && noKeeper && keeperPts.some(kp => Math.hypot(kp[0] - ball[0], kp[1] - ball[1]) < 7)) { const r = remap(keeperPts[0]); ball = [r[0] + 2.5, r[1] + 3]; }
    // Un déplacement n'est gardé que si un joueur présent se trouve à son point de départ (position initiale ou déjà atteinte).
    const reach = [...hList, ...aList, ...(L.neutral || []), ...(noKeeper ? [] : keeperPts)], near = (pt, list) => list.some(a => Math.hypot(a[0] - pt[0], a[1] - pt[1]) < 7);
    for (const raw of L.moves || []) {
      const isBall = ['p', 's', 'p+', 's+'].includes(raw[4] || 'c');
      if (!isBall && noKeeper && near([raw[0], raw[1]], keeperPts) && !near([raw[0], raw[1]], reach)) continue; // le gardien absent ne bouge pas
      const mv = [...remap([raw[0], raw[1]]), ...raw.slice(2)];
      if (Math.hypot(mv[2] - mv[0], mv[3] - mv[1]) <= 2 || !(isBall || near([mv[0], mv[1]], reach))) continue;
      moves.push(mv); if (!isBall) reach.push([mv[2], mv[3]]);
    }
    if (roles.queue) {
      if (ex.template === 'circuit') ghostRow(roles.queue, [(L.start || hList[0] || [5, 50])[0] - 5, (L.start || hList[0] || [5, 50])[1] + 8], -4.5, 'home');
      else { const aShare = aList.length / Math.max(1, hList.length + aList.length), qa = Math.round(roles.queue * aShare), qh = roles.queue - qa;
        ghostRow(qh, (L.queue?.home) || [6, 106], 5, 'home'); if (qa) ghostRow(qa, (L.queue?.away) || [94, 106], -5, 'away'); }
    }
  }
  if (ball) put('ball', ball);
  m.zones = zones.map(([x, y, w, hh, label]) => [x * m.W / 100, y * m.H / 100, w * m.W / 100, hh * m.H / 100, label]);
  applyMoves(m, moves.map(([x1, y1, x2, y2, k, label]) => [...P([x1, y1]), ...P([x2, y2]), k || 'c', label]));
  return m;
}

// Jeu à effectif complet : équipes en formation (les bleus attaquent vers la droite), puis scénario écrit joueur par joueur.
// L.formations = { 5: [[x, y], ...] } pour les bleus de la défense à l'attaque ; les rouges sont le miroir.
// L.script = [[qui, vers, type, légende]] : qui = 'b2', 'r1', 'a1' (appui), 'j' (joker), 'gb' (gardien bleu), 'gr' ; vers = joueur, [x, y], 'butR' ou 'butB'.
// Type : 'p' passe, 'c' course, 'd' conduite, 's' frappe, 'bloc' (toute l'équipe avance de vers mètres-%) ; '+' = en même temps.
function buildMatch(plan, L, put, zones, moves) {
  const { roles } = plan, noKeeper = plan.needK > plan.useK, F = L.formations;
  const near = n => F[n] || F[Object.keys(F).map(Number).reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a)];
  const pos = {};
  (L.goals || []).forEach(g => { if (noKeeper) { put('mini', [g[0], g[1] - 18], { rot: g[2] || 0 }); put('mini', [g[0], g[1] + 18], { rot: g[2] || 0 }); } else put('goal', g, { rot: g[2] || 0 }); });
  (L.cones || []).forEach(pt => put('cone', pt)); (L.zones || []).forEach(z => zones.push(z));
  near(roles.home).slice(0, roles.home).forEach((pt, i) => { put('home', pt, { label: String(i + 1) }); pos['b' + (i + 1)] = pt; });
  near(roles.away).slice(0, roles.away).forEach(([x, y], i) => { put('away', [100 - x, y], { label: String(i + 1) }); pos['r' + (i + 1)] = [100 - x, y]; });
  (L.supports || []).slice(0, roles.neutral - roles.joker).forEach(([x, y, label], i) => { put('neutral', [x, y], { label: label || 'A' }); pos['a' + (i + 1)] = [x, y]; });
  if (roles.joker) { put('neutral', L.jokerAt || [50, 50], { label: 'J' }); pos.j = L.jokerAt || [50, 50]; }
  if (!noKeeper) { put('keeper', [5, 50], { label: 'G' }); put('keeper', [95, 50], { label: 'G' }); pos.gb = [5, 50]; pos.gr = [95, 50]; }
  else { pos.gb = pos.b1; pos.gr = pos.r1; } // sans gardien, le défenseur le plus reculé relance
  const target = { butR: noKeeper ? [98.5, 34] : [98.5, 46], butB: noKeeper ? [1.5, 66] : [1.5, 54] };
  const feet = ([x, y]) => [x + 1.8, y + 2.4];
  let ballPos = L.ball && pos[L.ball] ? feet(pos[L.ball]) : null;
  const ballStart = ballPos;
  for (const [who, to, kind, label = ''] of L.script || []) {
    const k = kind.replace('+', ''), plus = kind.endsWith('+') ? '+' : '';
    if (k === 'bloc') { // toute l'équipe (hors gardien) avance ensemble
      Object.keys(pos).filter(id => id[0] === who && /^\w\d+$/.test(id)).forEach((id, i) => {
        const [x, y] = pos[id], nx = Math.max(6, Math.min(92, x + to));
        const carrier = ballPos && Math.hypot(ballPos[0] - x, ballPos[1] - y) < 5; // le porteur avance balle au pied
        moves.push([x, y, nx, y, (carrier ? 'd' : 'c') + (i || plus ? '+' : ''), i ? '' : label]); pos[id] = [nx, y];
        if (carrier) ballPos = [ballPos[0] + nx - x, ballPos[1]];
      });
      continue;
    }
    const from = pos[who]; if (!from) continue;
    const dest = typeof to === 'string' ? (target[to] || (pos[to] && feet(pos[to]))) : to; if (!dest) continue;
    if (k === 'p' || k === 's') { if (!ballPos) continue; moves.push([...ballPos, ...dest, k + plus, label]); ballPos = dest; }
    else { moves.push([...from, ...dest, k + plus, label]); if (k === 'd' && ballPos) ballPos = [dest[0] + ballPos[0] - from[0], dest[1] + ballPos[1] - from[1]]; pos[who] = dest; }
  }
  return ballStart;
}

// Transforme la liste des déplacements en étapes animées (un « + » joue en même temps que l'étape précédente).
const MOVE_LABELS = { p: 'Passe', c: 'Course', d: 'Conduite', s: 'Frappe' };
function applyMoves(m, moves) {
  const balls = m.tokens.filter(t => t.type === 'ball'), actors = m.tokens.filter(t => ['home', 'away', 'keeper', 'neutral'].includes(t.type) && !t.ghost);
  const nearest = (list, f, x, y) => list.map(a => ({ a, d: Math.hypot(f[a.id][0] - x, f[a.id][1] - y) })).sort((p, q) => p.d - q.d)[0];
  m.arrows = moves.map(([x1, y1, x2, y2, k]) => [x1, y1, x2, y2, k.replace('+', '')]);
  m.labels = ['Départ']; m.unmatched = 0;
  for (const [x1, y1, x2, y2, kind, label] of moves) {
    const k = kind.replace('+', ''), together = kind.endsWith('+') && m.frames.length > 1;
    const f = together ? m.frames[m.frames.length - 1] : clone(m.frames[m.frames.length - 1]);
    if (k === 'p' || k === 's') { const b = nearest(balls, f, x1, y1); if (b && b.d < 12) f[b.a.id] = [x2, y2]; else m.unmatched++; }
    else {
      const t = nearest(actors, f, x1, y1);
      if (t && t.d < 9) {
        const [ax, ay] = f[t.a.id], b = k === 'd' ? nearest(balls, f, ax, ay) : null;
        if (b && b.d < 8) f[b.a.id] = [x2 + f[b.a.id][0] - ax, y2 + f[b.a.id][1] - ay];
        f[t.a.id] = [x2, y2];
      } else m.unmatched++;
    }
    if (together) { if (label && !m.labels[m.labels.length - 1].includes(label)) m.labels[m.labels.length - 1] += ' · ' + label; }
    else { m.frames.push(f); m.labels.push(label || MOVE_LABELS[k]); }
  }
}

// Matériel pour l'ensemble des ateliers.
function materialOf(plan, model) {
  const count = type => model.tokens.filter(t => t.type === type && !t.ghost).length, g = plan.groups.length, items = [];
  const balls = plan.ex.template === 'free' ? plan.field : plan.ex.template === 'circuit' ? Math.ceil(plan.field / 2) : 3;
  const add = (n, one, many) => { if (n > 0) items.push(n + ' ' + (n > 1 ? many : one)); };
  add(balls * g, 'ballon', 'ballons'); add(count('cone') * g, 'plot', 'plots'); add((count('disc') || 4) * g, 'coupelle', 'coupelles');
  add(count('mini') * g, 'mini-but', 'mini-buts'); add(count('goal') * g, 'but', 'buts');
  const bibs = [['bleues', plan.roles.home + (plan.roles.queue && plan.ex.template !== 'circuit' ? plan.roles.queue : 0)], ['rouges', plan.roles.away], ['blanches', plan.roles.neutral + plan.roles.third]].filter(([, n]) => n && plan.ex.template !== 'free' && plan.ex.template !== 'circuit');
  if (bibs.length) items.push('chasubles : ' + bibs.map(([c, n]) => n * g + ' ' + c).join(', '));
  return items.join(' · ');
}

const LOGO = 'data:image/jpeg;base64,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+dvlqKw/Amif2NppJXb5ig1z3xJ8QLCkmn7uXHSuOo3iK9lsbwXsqd+p5j4m1P8AtrW3vA24N3rLpkabFxT69lRUVyrocF76sKKKKYBRRRQAUUUUAFFFFABRRRQAV2Xgz/j6P0rja7LwZ/x9H6V5ua/7rI68D/Gib3iH/UD6VwEn+sb613/iH/UD6VwEn+sb618XDY/Tcm/hDaKKKs9gKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAY+CQO54FeifD7w01y5nu48bTlK4/QNKk1q/VIlzsYE19A6Pp8dhYxIq4baM104anzO7PBz3H+xpexh8TJb2zW505rYjKlcV4P4w0GTStWby0xCM5NfQlcl420EalpMzRJmY9DXVXp88dD5/Jse8NX5X8LPCFYMMilpZraTT5zazDEi9aSvMPvtHqtgooooAKKKKACiiigAooooAKKKKACg9KKD0oA0dB/wCPn/gVd9ef8gx/9yuB0H/j5/4FXfXn/IMf/cpf8vF6ny+e/wAT5HlOpf8AH5VerGpf8flV6/QafwI/OZ/GwoooqyQooooAKKKKACiiigAooooAZKpZCBXrnwy8R7/K0tn+6BxmvJq0fD2qf2Jqou923oM1jiKXtabRdOfJNM958Z6Gut6ZtK52AnpXzveQvb388JGPLbAr6b0a9GpaJHLnPmIa8V+I2hnS7sTou3zWya4cBVcZOkzoxUE1zo1fhfrzWga2lbBc4Az717SpyoPqM18taPeyWer2sgbChsmvpHQNTj1TT1lQ5wAKzzCjyz511LwtS8eXsatFFFecdYUUUUAFFFFABVHVb5LCzaVzxzV6vPfibrQttEaKNsOCenWtKMOeaiROXLFs8i8R6i99rlzlspngVreAdHGr6gWZM+U2ea5VpvMmVyMl2Ar3P4c6GLC2+0Mv+sXNe3iaipUrI86jHnnc66+lXT9Dd+B5cYr538T6sdY1MzBshSRXrHxG14WFu1oG/wBauK8NVSGYk5yc1hl9KydRmuKnryodRRRXonKFFFFABRRRQAUUUUAFFFFABRRRQAV2Xgz/AI+j9K42uy8Gf8fR+lebmv8AusjrwP8AGib3iH/UD6VwEn+sb613/iH/AFA+lcBJ/rG+tfFw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R/wvnxT/AM+Gj/8AfmX/AOOUUUAH/C+fFP8Az4aP/wB+Zf8A45R/wvnxT/z4aP8A9+Zf/jlFFAB/wvnxT/z4aP8A9+Zf/jlH/C+fFP8Az4aP/wB+Zf8A45RRQAf8L58U/wDPho//AH5l/wDjlH/C+fFP/Pho/wD35l/+OUUUAH/C+fFP/Pho/wD35l/+OUf8L58U/wDPho//AH5l/wDjlFFAB/wvnxT/AM+Gj/8AfmX/AOOUf8L58U/8+Gj/APfmX/45RRQAf8L58U/8+Gj/APfmX/45R/wvnxT/AM+Gj/8AfmX/AOOUUUAH/C+fFP8Az4aP/wB+Zf8A45R/wvnxT/z4aP8A9+Zf/jlFFAB/wvnxT/z4aP8A9+Zf/jlH/C+fFP8Az4aP/wB+Zf8A45RRQAf8L58U/wDPho//AH5l/wDjlH/C+fFP/Pho/wD35l/+OUUUAH/C+fFP/Pho/wD35l/+OUf8L58U/wDPho//AH5l/wDjlFFAB/wvnxT/AM+Gj/8AfmX/AOOUf8L58U/8+Gj/APfmX/45RRQAf8L58U/8+Gj/APfmX/45R/wvnxT/AM+Gj/8AfmX/AOOUUUAH/C+fFP8Az4aP/wB+Zf8A45R/wvnxT/z4aP8A9+Zf/jlFFAB/wvnxT/z4aP8A9+Zf/jlH/C+fFP8Az4aP/wB+Zf8A45RRQAf8L58U/wDPho//AH5l/wDjlH/C+fFP/Pho/wD35l/+OUUUAH/C+fFP/Pho/wD35l/+OUf8L58U/wDPho//AH5l/wDjlFFAB/wvnxT/AM+Gj/8AfmX/AOOUf8L58U/8+Gj/APfmX/45RRQAf8L58U/8+Gj/APfmX/45R/wvnxT/AM+Gj/8AfmX/AOOUUUAf/9k=';

// Famille Banide : terrain commun à toutes les versions (double surface, deux buts, médiane).
// Les bleus attaquent vers la droite. Formations des bleus de la défense à l'attaque ; les rouges sont le miroir.
const BANIDE = {
  game: 'Banide',
  family: ['Zone 1 · Construire le jeu', 'Zone 3 / Box · Finition', 'Zone 1 · Jouer vers l’avant', 'Zone 1 / Box · Défendre le but', 'Zone 3 · Défendre haut', 'Zone 1 / Box · Défendre bas', 'Version simple'],
  players: [10, 12, 18], keepers: 2, size: [40, 40], ages: ['u15', 'u19', 'sen'], refCategory: 'Seniors',
  src: { label: 'magazine Vestiaires, « Jeu à 5 contre 5 type Banide »' },
  template: 'match',
  oddJoker: true, // jeu d'opposition : à effectif impair, le joueur en plus est joker
  terrain: {
    goals: [[1.5, 50, 90], [98.5, 50, 90]],
    zones: [[0, 0, 50, 100, 'Camp bleu'], [50, 0, 50, 100, 'Camp rouge'], [0, 27, 13.75, 46, ''], [86.25, 27, 13.75, 46, '']],
    formations: {
      4: [[16, 50], [29, 24], [29, 76], [42, 50]],
      5: [[17, 30], [17, 70], [29, 50], [41, 25], [41, 75]],
      6: [[17, 32], [17, 68], [29, 18], [29, 50], [29, 82], [42, 50]],
      7: [[16, 22], [16, 50], [16, 78], [29, 20], [29, 50], [29, 80], [42, 50]],
      8: [[15, 22], [15, 50], [15, 78], [28, 20], [28, 50], [28, 80], [41, 35], [41, 65]]
    }
  }
};

const EXOS = [];
EXOS.push((() => {

// famille: banide
// Zone 1 / Box · Défendre bas (famille Banide)
const EXO = {
  ...BANIDE, moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', obj: 'Protéger son but',
  id: 'banide-proteger', title: 'Banide en infériorité', theme: 'Défense', phase: 'sans', type: 'Jeu',
  duration: 24, intensity: 3, series: [300, 90], players: [11, 13, 19],
  goal: 'Défendre son but en restant compact, même en infériorité, puis ressortir le ballon au-delà de la médiane.',
  rules: [
    'Effectif impair : le joueur en plus est joker et attaque toujours avec l’équipe qui a le ballon. On défend en infériorité.',
    'Les bleus marquent 1 point en ressortant le ballon conduit au-delà de la médiane.',
    'Si un bleu est resté dans le camp rouge quand son équipe encaisse, le but compte double.',
    'Dans son camp : 2 touches maximum pour les bleus. On change d’équipe qui défend toutes les 4 minutes.'
  ],
  coach: ['Reculer ensemble et se resserrer devant le but.', 'Le plus proche sort sur le porteur, les autres couvrent.', 'Après la récupération, sortir vite par le côté libre.'],
  posture: 'Derrière le but défendu, décalé : il voit l’alignement et les distances entre défenseurs. Il parle peu pendant le jeu ; à l’arrêt, il fait replacer le bloc à la position du ballon.',
  expect: ['Rester compact sans se jeter.', 'Sortir sur le porteur au bon moment et couvrir.', 'Récupérer puis ressortir balle au pied au-delà de la médiane.'],
  easier: 'Effectif pair, sans joker : on défend à égalité.',
  harder: 'Deux jokers attaquent avec les rouges.',
  success: 'Peu de frappes concédées et plusieurs sorties balle au pied.',
  layout: { ...BANIDE.terrain, ball: 'gr', script: [
    ['gr', 'r2', 'p', 'Relance rouge'],
    ['r', -34, 'bloc', 'Les rouges et le joker montent'],
    ['j', [32, 42], 'c+', ''],
    ['b', -8, 'bloc+', 'Les bleus reculent et se resserrent'],
    ['r2', 'j', 'p', 'Passe au joker'],
    ['b3', [28, 46], 'c+', 'Le 3 sort sur le joker'],
    ['j', 'r4', 'p', 'Le joker cherche le 4'],
    ['b1', [24, 27], 'c+', 'Le défenseur coupe et récupère'],
    ['b1', [56, 30], 'd', 'Sortie balle au pied au-delà de la médiane : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: banide
// Zone 3 / Box · Finition (famille Banide)
const EXO = {
  ...BANIDE, moment: 'possede', sub: 'Zone 3 / Box · Finition', obj: 'Finir en supériorité',
  id: 'banide-joker', title: 'Banide avec joker offensif', theme: 'Finition', phase: 'ballon', type: 'Jeu',
  duration: 24, intensity: 3, series: [300, 90], players: [11, 13, 19],
  goal: 'Exploiter le joueur en plus dans le camp adverse pour se créer des occasions et frapper vite.',
  rules: [
    'Effectif impair : le joueur en plus est joker (chasuble blanche). Il joue avec l’équipe qui attaque, uniquement dans le camp adverse.',
    'Dans son camp : 2 touches maximum. Dans le camp adverse : jeu libre, le joker joue en 2 touches.',
    'Un but ne compte que si tous les joueurs de l’équipe qui attaque ont franchi la médiane.',
    'Frappe en une touche : 2 points. But sur une passe du joker : 2 points. Les bonus s’additionnent.'
  ],
  coach: ['Fixer un défenseur pour libérer un partenaire.', 'Chercher le joker entre les lignes, puis attaquer l’espace.', 'Frapper dès que l’angle s’ouvre.'],
  posture: 'Derrière le but attaqué, décalé : il voit les appels et la qualité de frappe. Il compte les points à voix haute pour valoriser les frappes en une touche.',
  expect: ['Trouver le joker dans le camp adverse.', 'Frapper en une touche après une passe du joker.', 'Marquer en moins de 10 secondes après le passage de la médiane.'],
  easier: 'Le joker joue avec les deux équipes partout, en touches libres.',
  harder: 'Le joker joue en une touche ; seuls les buts en une touche comptent.',
  success: 'Beaucoup de frappes cadrées, dont une majorité en une touche.',
  layout: { ...BANIDE.terrain, ball: 'gb', script: [
    ['gb', 'b1', 'p', 'Relance courte'],
    ['b1', 'b3', 'p', 'Le jeu avance par le milieu'],
    ['b', 34, 'bloc', 'Le bloc franchit la médiane'],
    ['j', [72, 40], 'c+', 'Le joker se place entre les lignes'],
    ['b3', 'j', 'p', 'Passe au joker'],
    ['b4', [86, 32], 'c+', 'Appel dans le dos'],
    ['j', 'b4', 'p', 'Le joker sert dans la course'],
    ['b4', 'butR', 's', 'Frappe en une touche après le joker : 4 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: banide
// Version simple (famille Banide)
const EXO = {
  ...BANIDE, moment: 'ludique', sub: 'Version simple', obj: 'Jouer tous ensemble', ages: ['u13', 'u15', 'u19', 'sen'],
  id: 'banide-ludique', title: 'Banide, version simple', theme: 'Ludique', phase: 'complement', type: 'Jeu',
  duration: 20, intensity: 2, series: [300, 60],
  goal: 'S’amuser en apprenant à monter tous ensemble pour marquer.',
  rules: [
    'Match libre, toutes les touches sont autorisées.',
    'Pour que le but compte, toute l’équipe doit être dans le camp adverse.',
    'Si un adversaire est resté dans ce camp au moment du but, il compte double. Le coach annonce le score à voix haute.'
  ],
  coach: ['Tout le monde suit le ballon.', 'Encourager plutôt que corriger.'],
  posture: 'Au bord du terrain avec les ballons. Il arbitre peu, félicite les montées collectives et relance tout de suite.',
  expect: ['Monter avec son équipe.', 'Marquer avec toute l’équipe passée.', 'Marquer double en surprenant l’adversaire.'],
  easier: 'Le but compte si la moitié de l’équipe a passé la médiane.',
  harder: 'Deux touches maximum dans son camp.',
  success: 'Tout le monde participe, les buts refusés deviennent rares.',
  layout: { ...BANIDE.terrain, ball: 'gb', script: [
    ['gb', 'b2', 'p', 'Le gardien relance'],
    ['b2', [36, 66], 'd', 'Conduite'],
    ['b', 36, 'bloc', 'Tout le monde monte !'],
    ['r', 8, 'bloc+', 'Les rouges reculent'],
    ['b2', 'b5', 'p', 'Passe vers l’avant'],
    ['b5', 'butR', 's', 'But : toute l’équipe est passée']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: banide
// Zone 3 · Défendre haut (famille Banide)
const EXO = {
  ...BANIDE, moment: 'nepossede', sub: 'Zone 3 · Défendre haut', obj: 'Récupérer haut',
  id: 'banide-pressing', title: 'Banide sur relance adverse', theme: 'Pressing', phase: 'sans', type: 'Jeu',
  duration: 24, intensity: 4, series: [240, 120],
  src: { label: 'magazine Vestiaires (jeu Banide) et FIFA Training Centre, Dortmund U17 : pressing haut en 5 contre 5', url: 'https://www.fifatrainingcentre.com/media/native/practice/Dortmund-2-FR.pdf' },
  goal: 'Presser ensemble la relance adverse pour récupérer le ballon dans le camp adverse et marquer vite.',
  rules: [
    'Chaque action part du gardien adverse, relance au sol. L’équipe qui relance joue en 3 touches maximum dans son camp.',
    'Le pressing se déclenche sur un signal : passe latérale, contrôle raté ou passe en retrait.',
    'Ballon récupéré dans le camp adverse puis but en moins de 8 secondes : 3 points.',
    'La règle de la médiane reste : tous les attaquants l’ont franchie au moment du but.'
  ],
  coach: ['Un presse le porteur, le deuxième ferme l’axe, les autres coupent les passes.', 'Presser en courbe pour pousser le jeu vers la touche.', 'Si la pression est battue, tout le monde redescend ensemble.'],
  posture: 'Derrière les attaquants qui pressent, dans leur camp : il voit les distances entre eux. Il crie le signal pendant les premières séquences (« Latérale ! »), puis laisse les joueurs le reconnaître seuls.',
  expect: ['Presser ensemble au signal, sans partir seul.', 'Récupérer dans le camp adverse au moins une fois par séquence.', 'Récupérer haut et marquer en moins de 8 secondes.'],
  easier: 'L’équipe qui relance n’a que 2 touches dans son camp.',
  harder: 'L’équipe qui relance peut revenir au gardien et jouer libre dans son camp.',
  success: 'Plusieurs récupérations hautes par séquence, suivies d’une frappe rapide.',
  layout: { ...BANIDE.terrain, ball: 'gr', script: [
    ['gr', 'r1', 'p', 'Le gardien rouge relance court'],
    ['b', 22, 'bloc', 'Les bleus montent ensemble pour presser'],
    ['r1', 'r2', 'p', 'Passe latérale : c’est le signal'],
    ['b5', [79, 64], 'c+', 'Le 5 presse le receveur'],
    ['b4', [72, 44], 'c+', 'Le 4 ferme l’axe'],
    ['r2', 'r3', 'p', 'Passe forcée vers l’axe'],
    ['b3', [72, 54], 'c+', 'Le 3 intercepte'],
    ['b', 14, 'bloc', 'Tout le bloc suit dans le camp rouge'],
    ['b3', 'butR', 's', 'Récupération haute et but en moins de 8 secondes : 3 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: banide
// Zone 1 · Construire le jeu (famille Banide)
const EXO = {
  ...BANIDE, moment: 'possede', sub: 'Zone 1 · Construire le jeu', obj: 'Ressortir proprement',
  id: 'banide-appuis', title: 'Banide avec appuis', theme: 'Relance', phase: 'ballon', type: 'Jeu',
  duration: 24, intensity: 3, series: [300, 90], players: [12, 14, 20], params: { supportName: 'appuis' },
  goal: 'Ressortir proprement depuis le gardien et faire progresser le bloc en s’appuyant sur les joueurs libres.',
  rules: [
    'Deux appuis se tiennent sur chaque ligne de touche, à hauteur de la médiane. Ils jouent en une touche avec l’équipe qui a le ballon.',
    'Chaque action part du gardien, relance au sol obligatoire. Dans son camp : 2 touches maximum.',
    'Un but ne compte que si tous les joueurs de l’équipe qui attaque ont franchi la médiane.',
    'Un but après une sortie par un appui compte double.'
  ],
  coach: ['Écarter les défenseurs à la relance pour ouvrir l’angle.', 'Regarder l’appui avant de recevoir.', 'Après la remise de l’appui, toute l’équipe monte.'],
  posture: 'Derrière la ligne de relance, côté appui : il voit les angles des défenseurs et la position du gardien. Il intervient à l’arrêt sur la relance seulement : « Où était le joueur libre ? »',
  expect: ['Relancer au sol sans perdre le ballon.', 'Utiliser l’appui pour sortir de la pression.', 'Sortir par l’appui puis marquer en moins de 6 passes.'],
  easier: 'Appuis en deux touches ; l’adversaire ne presse pas dans la surface.',
  harder: 'Appuis en une touche et ils ne peuvent pas se faire de passe entre eux.',
  success: 'Les relances au sol aboutissent : le bloc franchit la médiane ensemble.',
  layout: { ...BANIDE.terrain, supports: [[50, 2, 'A'], [50, 98, 'A']], ball: 'gb', script: [
    ['gb', 'b2', 'p', 'Relance au sol vers le défenseur'],
    ['r5', [36, 66], 'c+', 'Un rouge presse le relanceur'],
    ['b2', 'a2', 'p', 'Sortie par l’appui'],
    ['a2', 'b5', 'p', 'L’appui remet en une touche'],
    ['b', 34, 'bloc', 'Le bloc suit le ballon et franchit la médiane'],
    ['b3', [80, 44], 'c+', 'Appel dans l’axe'],
    ['b5', 'b3', 'p', 'Passe dans la course'],
    ['b3', 'butR', 's', 'But double : sortie par l’appui, tout le bloc est passé']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: banide
// Zone 1 / Box · Défendre le but (famille Banide)
const EXO = {
  ...BANIDE, moment: 'perd', sub: 'Zone 1 / Box · Défendre le but', obj: 'Redescendre en bloc',
  id: 'banide-base', title: 'Banide · jeu de base', theme: 'Transition défensive', phase: 'complement', type: 'Jeu',
  duration: 30, intensity: 3, series: [360, 90],
  goal: 'Attaquer et défendre en bloc : toute l’équipe monte quand on attaque et redescend quand on perd le ballon.',
  rules: [
    'Deux équipes et deux gardiens sur une double surface de réparation, deux grands buts.',
    'Un but ne compte que si tous les joueurs de l’équipe qui attaque ont franchi la médiane.',
    'Si un défenseur est resté dans le camp adverse quand son équipe encaisse, le but compte double.',
    'Dans son camp : 2 touches maximum. Dans le camp adverse : jeu libre. Gardiens : 1 ou 2 touches.',
    'Ballon sorti : l’entraîneur relance aussitôt à la médiane.'
  ],
  coach: ['Le ballon avance, le bloc avance : le dernier joueur pousse jusqu’à la médiane.', 'À la perte, tout le monde repasse la médiane.', 'Dans son camp, simple et vite ; dans le camp adverse, oser.'],
  posture: 'Sur la médiane, côté touche, avec les ballons de réserve. Il laisse jouer, relance sans temps mort et annonce à voix haute « but valable » ou « but refusé, le 2 n’a pas suivi ».',
  expect: ['Comprendre la règle de la médiane.', 'Monter et redescendre en bloc à chaque changement de possession.', 'Punir le défenseur resté devant : attaquer vite pour marquer double.'],
  easier: 'But valable si 4 joueurs sur 5 ont franchi la médiane ; touches libres partout.',
  harder: 'Une touche dans son camp, 3 touches maximum dans le camp adverse.',
  success: 'Peu de buts refusés : les deux équipes jouent en bloc.',
  layout: { ...BANIDE.terrain, ball: 'gb', script: [
    ['gb', 'b1', 'p', 'Le gardien relance court'],
    ['r5', [42, 66], 'c+', 'Le rouge 5 presse haut…'],
    ['b1', 'b3', 'p', 'Le jeu avance par le milieu'],
    ['b', 34, 'bloc', 'Le ballon avance : tout le bloc bleu franchit la médiane'],
    ['r4', [70, 30], 'c+', ''], ['r3', [77, 46], 'c+', ''],
    ['b3', 'b4', 'p', 'Ouverture côté gauche'],
    ['b5', [85, 60], 'c+', 'Appel au second poteau'],
    ['b4', 'b5', 'p', 'Passe vers le 5'],
    ['b5', 'butR', 's', 'But double : tout le bloc bleu est passé et le rouge 5 est resté devant']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: banide
// Zone 1 · Jouer vers l’avant (famille Banide)
const EXO = {
  ...BANIDE, moment: 'recupere', sub: 'Zone 1 · Jouer vers l’avant', obj: 'Attaquer vite après la récupération',
  id: 'banide-contre', title: 'Banide en contre-attaque', theme: 'Transition offensive', phase: 'transition', type: 'Jeu',
  duration: 24, intensity: 4, series: [240, 120],
  goal: 'Dès la récupération, jouer vers l’avant et frapper avant que l’adversaire soit revenu.',
  rules: [
    'Règle de base : un but ne compte que si tous les attaquants ont franchi la médiane.',
    'Exception : pendant 8 secondes après une récupération, la règle est levée. Un but marqué dans ce délai compte double.',
    'Première passe après la récupération vers l’avant ou en conduite : pas de passe en retrait.',
    'Dans son camp : 2 touches maximum. Effectif impair : le joueur en plus est joker.'
  ],
  coach: ['À la récupération, regarder devant avant de jouer.', 'Les joueurs les plus hauts attaquent la profondeur tout de suite.', 'Finir l’action : une frappe vaut mieux qu’une passe de trop.'],
  posture: 'Sur la médiane, côté touche : il compte les 8 secondes à voix haute après chaque récupération, puis se tait dès que les joueurs ont pris le rythme.',
  expect: ['Jouer vers l’avant après la récupération.', 'Frapper en moins de 8 secondes.', 'Marquer double au moins une fois par séquence.'],
  easier: 'Délai de 12 secondes après la récupération.',
  harder: 'Délai de 6 secondes, et 3 touches maximum dans le camp adverse.',
  success: 'Plusieurs contres conclus par une frappe dans le délai.',
  layout: { ...BANIDE.terrain, ball: 'gr', script: [
    ['gr', 'r2', 'p', 'Relance rouge'],
    ['r', -34, 'bloc', 'Les rouges attaquent dans le camp bleu'],
    ['b', -6, 'bloc+', 'Les bleus défendent'],
    ['r2', 'r3', 'p', 'Passe dans l’axe…'],
    ['b3', [39, 58], 'c+', '… le 3 intercepte'],
    ['b5', [44, 72], 'c+', 'Le 5 se montre'],
    ['b3', 'b5', 'p', 'Première passe vers l’avant'],
    ['b5', [68, 68], 'd', 'Conduite rapide'],
    ['b4', [80, 40], 'c+', 'Appel en profondeur'],
    ['b5', 'b4', 'p', 'Passe dans la course'],
    ['b4', 'butR', 's', 'But en moins de 8 secondes : il compte double']
  ] }
};

return EXO;
})());

// Fiche d'exercice autonome : une carte épurée, couleur de son thème, schéma animé, deux onglets.

// Les cinq thèmes du club, avec leurs sous-thèmes par zone. Bandeau aux couleurs du schéma de référence (vert = ballon, rouge = sans ballon).
const FICHE_MOMENTS = {
  possede: { label: 'Mon équipe possède le ballon', band: '#7ab929', accent: '#4f8a10', subs: ['Zone 1 · Construire le jeu', 'Zone 2 · Maîtriser et déstabiliser', 'Zone 3 / Box · Finition'] },
  perd: { label: 'Mon équipe perd le ballon', band: 'linear-gradient(90deg, #7ab929, #e2001a)', accent: '#c2410c', subs: ['Zone 1 / Box · Défendre le but', 'Zone 2 · Freiner l’attaque', 'Zone 3 · Pressing'] },
  recupere: { label: 'Mon équipe récupère le ballon', band: 'linear-gradient(90deg, #e2001a, #7ab929)', accent: '#3f8a1a', subs: ['Zone 1 · Jouer vers l’avant', 'Zone 2 · Chercher la zone 3', 'Zone 3 / Box · Marquer le but'] },
  nepossede: { label: 'Mon équipe ne possède pas le ballon', band: '#e2001a', accent: '#c4001a', subs: ['Zone 1 / Box · Défendre bas', 'Zone 2 · Contrôler l’adversaire', 'Zone 3 · Défendre haut'] },
  ludique: { label: 'Ludique', band: '#214fa0', accent: '#214fa0', subs: [] }
};
const FICHE_LEVELS = { decouverte: 'Découverte', dev: 'En développement', confirme: 'Confirmé' };
const FICHE_CATEGORIES = ['U11', 'U13', 'U15', 'U17', 'U19', 'Seniors'];

// onBack : dans le fichier qui regroupe toutes les fiches, bouton de retour au rangement.
function renderFiche(e, onBack, context = {}) {
  const mo = FICHE_MOMENTS[e.moment];
  const sim = { category: e.refCategory || 'Seniors', players: e.players[1], keepers: e.keepers || 0, level: 'dev', moment: 'libre', space: [68, 105], ...context };
  const ctl = (label, input) => h('label', { class: 'sim-field' }, h('span', {}, label), input);
  const cat = h('select', { id: 'sim-cat' }, FICHE_CATEGORIES.map(c => h('option', { value: c }, c))); cat.value = sim.category;
  const pl = h('input', { id: 'sim-players', type: 'number', min: 2, max: 40, value: sim.players, inputmode: 'numeric' });
  const gk = h('input', { id: 'sim-keepers', type: 'number', min: 0, max: 6, value: sim.keepers, inputmode: 'numeric' });
  const lv = h('select', { id: 'sim-level' }, Object.entries(FICHE_LEVELS).map(([k, v]) => h('option', { value: k }, v))); lv.value = sim.level;
  for (const [el, key, num] of [[cat, 'category'], [pl, 'players', true], [gk, 'keepers', true], [lv, 'level']])
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { sim[key] = num ? Math.max(0, Number(el.value) || 0) : el.value; paint(); });
  const simRow = h('div', { class: 'f-sim', hidden: true }, ctl('Catégorie', cat), ctl('Joueurs', pl), ctl('Gardiens', gk), ctl('Niveau', lv));
  const simBtn = h('button', { type: 'button', class: 'f-adapt', 'aria-expanded': 'false', onclick: () => { simRow.hidden = !simRow.hidden; simBtn.setAttribute('aria-expanded', String(!simRow.hidden)); } }, 'Adapter');

  const info = h('div', { class: 'f-info' }), pic = h('div', { class: 'xs-board' }), tabs = h('div', { class: 'xs-tabs', role: 'tablist' }), panel = h('div', { class: 'xs-panel' });
  const ul = items => h('ul', {}, items.map(i => h('li', {}, i)));
  let tab = 'consignes';

  function paint() {
    const plan = adapt(e, { ...sim, players: Math.max(2, sim.players) }), model = buildExerciseModel(plan), series = seriesOf(e, e.duration, plan.band);
    const li = { decouverte: 0, dev: 1, confirme: 2 }[sim.level] ?? 1;
    const chip = text => h('span', { class: 'f-chip' }, text);
    info.replaceChildren(chip(plan.roles.text.replace(' contre ', ' c ').replace(/gardiens?/, 'G')), chip(plan.size[0] + ' × ' + plan.size[1] + ' m'), chip(series.text.replace(' · récup ', ' / récup ')),
      intensityMeter(e.intensity, true), simBtn,
      ...(plan.warn.length ? [h('p', { class: 'warn' }, plan.warn[0])] : []));
    pic.replaceChildren(createBoard(model, { editable: false, viewer: true, title: e.title, lines: e.template === 'circuit' }).el);
    const PANELS = {
      consignes: ['Consignes', () => [h('p', { class: 'lead' }, e.goal), h('ol', { class: 'f-rules' }, e.rules.map(r => h('li', {}, r))),
        h('p', { class: 'f-mat' }, h('b', {}, 'Matériel : '), materialOf(plan, model))]],
      coaching: ['Coaching', () => [h('p', { class: 'f-posture' }, e.posture), ul(e.coach),
        h('p', { class: 'f-expect' }, h('b', {}, 'Attendu (' + FICHE_LEVELS[sim.level].toLowerCase() + ') : '), e.expect[li]),
        h('p', { class: 'f-var' }, h('b', {}, '− '), e.easier), h('p', { class: 'f-var' }, h('b', {}, '+ '), e.harder)]]
    };
    tabs.replaceChildren(...Object.entries(PANELS).map(([k, [label]]) => h('button', { type: 'button', role: 'tab', class: 'xs-tab' + (tab === k ? ' on' : ''), 'aria-selected': String(tab === k), onclick: () => { tab = k; paint(); } }, label)));
    panel.replaceChildren(...PANELS[tab][1]().filter(Boolean));
  }
  paint();


  const family = (e.family || []).filter(r => r !== e.sub);
  const card = h('article', { class: 'f-card' },
    h('header', { class: 'f-top' }, onBack ? h('button', { type: 'button', class: 'f-back', onclick: onBack, 'aria-label': 'Retour aux exos' }, '←') : null, h('img', { src: LOGO, alt: '' }),
      h('div', {}, h('small', {}, mo.label), h('b', {}, e.sub)), h('span', { class: 'f-num' }, e.game)),
    h('div', { class: 'xs' },
      h('h1', { class: 'f-title' }, e.title), e.obj ? h('p', { class: 'f-obj' }, h('b', {}, 'Obj : '), e.obj) : null, info, simRow,
      h('div', { class: 'xs-main' }, h('div', { class: 'xs-left' }, pic), h('div', { class: 'xs-right' }, tabs, panel)),
      h('footer', { class: 'xs-foot' },
        h('span', { class: 'xs-src' }, e.src ? 'Source : ' + e.src.label : 'Fiche originale du Vestiaire'),
        family.length ? h('span', { class: 'xs-src' }, 'Autres variantes du ' + e.game + ' : ' + family.join(' · ')) : null)));
  card.style.setProperty('--theme', mo.accent); card.style.setProperty('--band', mo.band);
  return card;
}

// Toutes les fiches dans un seul fichier : rangement thème › jeu › variante, puis la fiche choisie.
function renderBundle(list) {
  const show = () => {
    const i = Number(location.hash.slice(1));
    if (location.hash && list[i]) { document.body.replaceChildren(renderFiche(list[i], () => history.back())); return; }
    document.title = 'Exos foot';
    const themes = Object.entries(FICHE_MOMENTS).map(([key, mo]) => {
      const mine = list.map((e, i) => ({ e, i })).filter(({ e }) => e.moment === key).sort((a, b) => a.e.sub.localeCompare(b.e.sub, 'fr'));
      if (!mine.length) return null;
      const games = [...new Set(mine.map(({ e }) => e.game))];
      const sec = h('section', { class: 'b-theme' }, h('h2', {}, mo.label),
        games.map(g => h('div', { class: 'b-game' }, h('h3', {}, g),
          h('div', { class: 'b-list' }, mine.filter(({ e }) => e.game === g).map(({ e, i }) =>
            h('a', { href: '#' + i }, h('b', {}, e.sub), h('span', {}, e.obj || e.title)))))));
      sec.style.setProperty('--band', mo.band); sec.style.setProperty('--theme', mo.accent);
      return sec;
    });
    document.body.replaceChildren(h('main', { class: 'b-home' }, h('header', { class: 'b-head' }, h('img', { src: LOGO, alt: '' }), h('h1', {}, 'Exos foot')), ...themes.filter(Boolean)));
    scrollTo(0, 0);
  };
  addEventListener('hashchange', show);
  show();
}

return {exercises:EXOS,adapt,buildExerciseModel,renderFiche,materialOf,seriesOf,createBoard,fitsSpace};
})();
