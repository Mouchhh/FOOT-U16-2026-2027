// Original MyCoach exercise data and functions, untouched; standalone page autostart omitted.
window.suppliedMyCoachExerciseEngine=(()=>{
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
    gg.append(s('rect', { x: -w / 2, y: -d / 2, width: w, height: d, fill: 'rgba(255,255,255,.85)', stroke: '#1d2b4f', 'stroke-width': .5 })); // visible sur le terrain vert comme sur le fond blanc des fiches
    for (let i = 1; i < 5; i++) gg.append(s('line', { x1: -w / 2 + i * w / 5, y1: -d / 2, x2: -w / 2 + i * w / 5, y2: d / 2, stroke: 'rgba(29,43,79,.45)', 'stroke-width': .15 }));
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
// Cadences des jeux à effectif égal (référence fournie par le coach) : durée de séquence, nombre, récupération (secondes),
// surface (m²) et intérêt athlétique, selon le nombre de joueurs par équipe.
const CADENCES = {
  1: { work: [30, 90], reps: [2, 4], rest: [30, 210], area: [5, 25], phys: 'anaérobie, musculation du bas du corps' },
  2: { work: [45, 120], reps: [2, 5], rest: [45, 210], area: [12, 30], phys: 'anaérobie, muscles du bas du corps' },
  3: { work: [120, 240], reps: [2, 5], rest: [60, 210], area: [100, 225], phys: 'majoritairement anaérobie, aérobie, vivacité' },
  4: { work: [150, 360], reps: [2, 6], rest: [60, 240], area: [300, 1200], phys: 'mixte anaérobie-aérobie / PMA, vivacité' },
  5: { work: [240, 420], reps: [2, 6], rest: [60, 240], area: [600, 1400], phys: 'mixte anaérobie-aérobie / PMA, vivacité' },
  6: { work: [300, 480], reps: [1, 4], rest: [60, 240], area: [900, 2000], phys: 'mixte anaérobie-aérobie / PMA, vivacité' },
  7: { work: [480, 900], reps: [1, 3], rest: [60, 240], area: [1600, 2500], phys: 'majoritairement aérobie, anaérobie' },
  8: { work: [600, 1200], reps: [1, 3], rest: [60, 240], area: [1600, 3000], phys: 'majoritairement aérobie, anaérobie' }
};
// Place d'une catégorie dans les fourchettes : les plus jeunes en bas, les seniors en haut.
const CADENCE_T = { u11: 0, u13: .25, u15: .5, u19: .8, sen: 1 };
const cadenceOf = plan => plan?.ex.cadence && plan.roles.away ? CADENCES[Math.min(8, Math.max(1, Math.min(plan.roles.home, plan.roles.away)))] : null;

// Découpage d'un bloc en séries selon l'intensité et l'âge (ou la table des cadences pour les jeux à effectif égal).
function seriesOf(ex, minutes, band, plan) {
  const cad = cadenceOf(plan);
  if (cad) {
    const t = CADENCE_T[band.key] ?? 1, lerp = ([a, b], k) => a + (b - a) * k, total = minutes * 60;
    const rest = Math.round(lerp(cad.rest, 1 - t) / 15) * 15, target = lerp(cad.work, t);
    // Nombre de séquences qui remplit le mieux la durée du bloc en restant dans les fourchettes de la table.
    let best = null;
    for (let n = cad.reps[0]; n <= cad.reps[1]; n++) {
      const w = Math.max(cad.work[0], Math.min(cad.work[1], Math.round((total - (n - 1) * rest) / n / 15) * 15));
      const score = Math.abs(n * w + (n - 1) * rest - total) + Math.abs(w - target) / 4;
      if (!best || score < best.score) best = { n, w, score };
    }
    const reps = best.n, work = best.w;
    return { reps, work, rest, text: reps === 1 ? fmtSec(work) : reps + ' × ' + fmtSec(work) + ' · récup ' + fmtSec(rest) };
  }
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
  else if (ex.template === 'circuit') { const a = (L.home || []).length; r.home = Math.min(a, field); r.queue = Math.max(0, field - a); text = r.home + ' ' + (p.unit || 'postes') + (r.queue ? ' + ' + r.queue + ' en file' : ''); } // unit : « coureurs », « joueurs »…
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
    if (ex.defenders != null) { // toros : nombre de chasseurs fixé par la fiche, les autres conservent
      r.away = Math.max(0, Math.min(field - r.neutral - 2, typeof ex.defenders === 'function' ? ex.defenders(field) : ex.defenders)); r.home = field - r.neutral - r.away;
    }
    text = (r.away ? r.home + ' contre ' + r.away : r.home + ' joueurs, sans adversaire') + (fixed ? ' + ' + fixed + ' ' + (p.supportName || (fixed > 1 ? 'appuis' : 'appui')) : '') + (jok ? ' + 1 joker' : '');
    if (L.thirdTeam) { const g = Math.floor(r.home / 2); text = (r.home - g) + ' + ' + g + ' contre ' + r.away + (r.neutral ? ' + ' + r.neutral + ' ' + (p.supportName || 'appuis') : ''); } // deux équipes ensemble contre la troisième
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
  const groups = planGroups(ex, Math.max(1, ctx.players), Math.max(0, ctx.keepers));
  const g0 = groups[0], need = keepersNeeded(ex), useK = Math.min(g0.k, need), field = g0.n - useK;
  const procedural = ['free', 'rondo', 'possession', 'zones', 'game', 'match'].includes(ex.template) || !!ex.params?.scale;
  const ref = Math.max(2, ex.players[1] - need);
  const roles = splitRoles(ex, field, useK), warn = [];
  const scale = (procedural ? Math.sqrt(Math.max(2, field) / ref) : 1) * band.space * lv.space;
  let size = [Math.max(8, Math.round(ex.size[0] * scale)), Math.max(8, Math.round(ex.size[1] * scale))];
  const cad = cadenceOf({ ex, roles });
  if (cad && ex.cadence !== 'series') { // surface tirée de la table des cadences (cadence: 'series' = séries seulement, terrain de la fiche)
    const t = CADENCE_T[band.key] ?? 1, area = (cad.area[0] + (cad.area[1] - cad.area[0]) * t) * lv.space * lv.space, ratio = ex.size[0] / ex.size[1];
    const len = Math.sqrt(area / ratio); size = [Math.max(8, Math.round(len * ratio)), Math.max(8, Math.round(len))];
  }
  if (g0.n < ex.players[0]) warn.push('Prévu pour ' + ex.players[0] + ' joueurs minimum par atelier : rôles réduits, à faire tourner souvent.');
  if (need > useK) warn.push(need === 2 ? 'Sans deux gardiens : on joue vers des mini-buts.' : 'Pas de gardien dans cet atelier : le but est remplacé par deux mini-buts.');
  if (ctx.space && !fitsSpace(groups.length, size, ctx.space)) warn.push('Espace juste : ' + groups.length + ' × ' + size[0] + '×' + size[1] + ' m dans ' + ctx.space[0] + '×' + ctx.space[1] + ' m. Réduisez les ateliers ou alternez.');
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
    (L.balls || []).forEach(pt => put('ball', pt)); // circuits à plusieurs ballons
    // Sans gardien, ce qu'il faisait part du défenseur le plus proche.
    const remap = pt => { if (!noKeeper || !hList.length) return pt; const k = keeperPts.find(kp => Math.hypot(kp[0] - pt[0], kp[1] - pt[1]) < 7); return k ? [...hList.slice().sort((a, b) => Math.hypot(a[0] - k[0], a[1] - k[1]) - Math.hypot(b[0] - k[0], b[1] - k[1]))[0]] : pt; };
    if (ball && noKeeper && keeperPts.some(kp => Math.hypot(kp[0] - ball[0], kp[1] - ball[1]) < 7)) { const r = remap(keeperPts[0]); ball = [r[0] + 2.5, r[1] + 3]; }
    // Un déplacement n'est gardé que si un joueur présent se trouve à son point de départ (position initiale ou déjà atteinte).
    const reach = [...hList, ...aList, ...(L.neutral || []), ...(noKeeper ? [] : keeperPts)], near = (pt, list) => list.some(a => Math.hypot(a[0] - pt[0], a[1] - pt[1]) < (L.exact ? 1 : 7)); // exact : joueurs serrés, le départ doit tomber pile sur un joueur présent
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
// L.script = [[qui, vers, type, légende]] : qui = 'b2', 'r1', 'a1' (appui), 'j' (joker), 'gb' (gardien bleu), 'gr' ; vers = joueur, [x, y], 'butR', 'butB' ou un nombre (avance en largeur).
// Type : 'p' passe, 'c' course, 'd' conduite, 's' frappe, 'bloc' (toute l'équipe avance de vers mètres-%) ; '+' = en même temps.
function buildMatch(plan, L, put, zones, moves) {
  const { roles } = plan, noKeeper = plan.needK > plan.useK, hasK = plan.needK > 0 && !noKeeper;
  // Formations : objet { effectif: positions } ou fonction (effectif) => positions ; rouges en miroir sauf formationsAway.
  const pick = (F, n) => typeof F === 'function' ? F(n, roles) : F[n] || F[Object.keys(F).map(Number).reduce((a, b) => Math.abs(b - n) < Math.abs(a - n) ? b : a)];
  const near = n => pick(L.formations, n), awayAt = n => L.formationsAway ? pick(L.formationsAway, n) : near(n).map(([x, y]) => [100 - x, y]);
  const pos = {};
  (L.goals || []).forEach(g => { if (noKeeper) { put('mini', [g[0], g[1] - 18], { rot: g[2] || 0 }); put('mini', [g[0], g[1] + 18], { rot: g[2] || 0 }); } else put('goal', g, { rot: g[2] || 0 }); });
  (L.minis || []).forEach(g => put('mini', g, { rot: g[2] || 0 }));
  (L.cones || []).forEach(pt => put('cone', pt)); (L.zones || []).forEach(z => zones.push(z));
  // thirdTeam : la seconde moitié des joueurs « bleus » forme une troisième équipe (en vert), numérotée à part.
  const third = L.thirdTeam ? Math.floor(roles.home / 2) : 0, firstGreen = roles.home - third; roles.green = third;
  near(roles.home).slice(0, roles.home).forEach((pt, i) => { put('home', pt, i >= firstGreen ? { label: String(i - firstGreen + 1), color: THIRD_COLOR } : { label: String(i + 1) }); pos['b' + (i + 1)] = pt; });
  awayAt(roles.away).slice(0, roles.away).forEach((pt, i) => { put('away', pt, { label: String(i + 1) }); pos['r' + (i + 1)] = pt; });
  (L.supports || []).slice(0, roles.neutral - roles.joker).forEach(([x, y, label], i) => { put('neutral', [x, y], { label: label || 'A' }); pos['a' + (i + 1)] = [x, y]; });
  if (roles.joker) { put('neutral', L.jokerAt || [50, 50], { label: 'J' }); pos.j = L.jokerAt || [50, 50]; }
  if (hasK) { const [kb, kr] = L.keepersAt || [[5, 50], [95, 50]]; // demi-terrain : un seul gardien
    put('keeper', kb, { label: 'G' }); pos.gb = kb; if (kr) { put('keeper', kr, { label: 'G' }); pos.gr = kr; } else pos.gr = pos.r1; }
  else { pos.gb = pos.b1; pos.gr = pos.r1; } // sans gardien, le défenseur le plus reculé relance
  const target = { butR: noKeeper ? [98.5, 34] : [98.5, 46], butB: noKeeper ? [1.5, 66] : [1.5, 54] };
  const feet = ([x, y]) => [x + 1.8, y + 2.4];
  let ballPos = L.ball && pos[L.ball] ? feet(pos[L.ball]) : null;
  (L.balls || []).forEach(pt => put('ball', pt)); // ballons de réserve (ex. le coach sert la vague suivante)
  // ballsFor : un ballon chacun ('b' = tous les bleus, ou liste de joueurs), en plus du ballon suivi par le scénario.
  const own = L.ballsFor ? Object.keys(pos).filter(id => /^[br]\d+$/.test(id) && id !== L.ball && (typeof L.ballsFor === 'string' ? L.ballsFor.includes(id[0]) : L.ballsFor.includes(id))) : [];
  own.forEach(id => put('ball', feet(pos[id])));
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
    // qui = [x, y] : un ballon posé à cet endroit est joué (le coach sert)
    const from = Array.isArray(who) ? who : pos[who]; if (!from) continue;
    if (Array.isArray(who) && (k === 'p' || k === 's')) ballPos = who;
    const dest = typeof to === 'number' ? [Math.max(2, Math.min(98, from[0] + to)), from[1]] : typeof to === 'string' ? (target[to] || (pos[to] && feet(pos[to]))) : to; if (!dest) continue;
    if (k === 'p' || k === 's') { if (!ballPos) continue; moves.push([...ballPos, ...dest, k + plus, label]); ballPos = dest; }
    else { moves.push([...from, ...dest, k + plus, label]); if (k === 'd' && ballPos && Math.hypot(ballPos[0] - from[0], ballPos[1] - from[1]) < 6) ballPos = [dest[0] + ballPos[0] - from[0], dest[1] + ballPos[1] - from[1]]; pos[who] = dest; } // seul le porteur emmène le ballon
  }
  return ballStart;
}

const THIRD_COLOR = '#2f9e44'; // troisième équipe (vert)

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
  const balls = plan.ex.template === 'free' ? plan.field : plan.ex.layout?.ballsFor ? count('ball') : plan.ex.template === 'circuit' ? Math.ceil(plan.field / 2) : 3;
  const add = (n, one, many) => { if (n > 0) items.push(n + ' ' + (n > 1 ? many : one)); };
  add(balls * g, 'ballon', 'ballons'); add(count('cone') * g, 'plot', 'plots'); add((count('disc') || 4) * g, 'coupelle', 'coupelles');
  add(count('mini') * g, 'mini-but', 'mini-buts'); add(count('goal') * g, 'but', 'buts');
  const bibs = [['bleues', plan.roles.home - (plan.roles.green || 0) + (plan.roles.queue && plan.ex.template !== 'circuit' ? plan.roles.queue : 0)], ['vertes', plan.roles.green || 0], ['rouges', plan.roles.away], ['blanches', plan.roles.neutral + plan.roles.third]].filter(([, n]) => n && plan.ex.template !== 'free' && plan.ex.template !== 'circuit');
  if (bibs.length) items.push('chasubles : ' + bibs.map(([c, n]) => n * g + ' ' + c).join(', '));
  return items.join(' · ');
}

const LOGO = 'data:image/jpeg;base64,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+dvlqKw/Amif2NppJXb5ig1z3xJ8QLCkmn7uXHSuOo3iK9lsbwXsqd+p5j4m1P8AtrW3vA24N3rLpkabFxT69lRUVyrocF76sKKKKYBRRRQAUUUUAFFFFABRRRQAV2Xgz/j6P0rja7LwZ/x9H6V5ua/7rI68D/Gib3iH/UD6VwEn+sb613/iH/UD6VwEn+sb618XDY/Tcm/hDaKKKs9gKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAY+CQO54FeifD7w01y5nu48bTlK4/QNKk1q/VIlzsYE19A6Pp8dhYxIq4baM104anzO7PBz3H+xpexh8TJb2zW505rYjKlcV4P4w0GTStWby0xCM5NfQlcl420EalpMzRJmY9DXVXp88dD5/Jse8NX5X8LPCFYMMilpZraTT5zazDEi9aSvMPvtHqtgooooAKKKKACiiigAooooAKKKKACg9KKD0oA0dB/wCPn/gVd9ef8gx/9yuB0H/j5/4FXfXn/IMf/cpf8vF6ny+e/wAT5HlOpf8AH5VerGpf8flV6/QafwI/OZ/GwoooqyQooooAKKKKACiiigAooooAZKpZCBXrnwy8R7/K0tn+6BxmvJq0fD2qf2Jqou923oM1jiKXtabRdOfJNM958Z6Gut6ZtK52AnpXzveQvb388JGPLbAr6b0a9GpaJHLnPmIa8V+I2hnS7sTou3zWya4cBVcZOkzoxUE1zo1fhfrzWga2lbBc4Az717SpyoPqM18taPeyWer2sgbChsmvpHQNTj1TT1lQ5wAKzzCjyz511LwtS8eXsatFFFecdYUUUUAFFFFABVHVb5LCzaVzxzV6vPfibrQttEaKNsOCenWtKMOeaiROXLFs8i8R6i99rlzlspngVreAdHGr6gWZM+U2ea5VpvMmVyMl2Ar3P4c6GLC2+0Mv+sXNe3iaipUrI86jHnnc66+lXT9Dd+B5cYr538T6sdY1MzBshSRXrHxG14WFu1oG/wBauK8NVSGYk5yc1hl9KydRmuKnryodRRRXonKFFFFABRRRQAUUUUAFFFFABRRRQAV2Xgz/AI+j9K42uy8Gf8fR+lebmv8AusjrwP8AGib3iH/UD6VwEn+sb613/iH/AFA+lcBJ/rG+tfFw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R/wvnxT/AM+Gj/8AfmX/AOOUUUAH/C+fFP8Az4aP/wB+Zf8A45R/wvnxT/z4aP8A9+Zf/jlFFAB/wvnxT/z4aP8A9+Zf/jlH/C+fFP8Az4aP/wB+Zf8A45RRQAf8L58U/wDPho//AH5l/wDjlH/C+fFP/Pho/wD35l/+OUUUAH/C+fFP/Pho/wD35l/+OUf8L58U/wDPho//AH5l/wDjlFFAB/wvnxT/AM+Gj/8AfmX/AOOUf8L58U/8+Gj/APfmX/45RRQAf8L58U/8+Gj/APfmX/45R/wvnxT/AM+Gj/8AfmX/AOOUUUAH/C+fFP8Az4aP/wB+Zf8A45R/wvnxT/z4aP8A9+Zf/jlFFAB/wvnxT/z4aP8A9+Zf/jlH/C+fFP8Az4aP/wB+Zf8A45RRQAf8L58U/wDPho//AH5l/wDjlH/C+fFP/Pho/wD35l/+OUUUAH/C+fFP/Pho/wD35l/+OUf8L58U/wDPho//AH5l/wDjlFFAB/wvnxT/AM+Gj/8AfmX/AOOUf8L58U/8+Gj/APfmX/45RRQAf8L58U/8+Gj/APfmX/45R/wvnxT/AM+Gj/8AfmX/AOOUUUAH/C+fFP8Az4aP/wB+Zf8A45R/wvnxT/z4aP8A9+Zf/jlFFAB/wvnxT/z4aP8A9+Zf/jlH/C+fFP8Az4aP/wB+Zf8A45RRQAf8L58U/wDPho//AH5l/wDjlH/C+fFP/Pho/wD35l/+OUUUAH/C+fFP/Pho/wD35l/+OUf8L58U/wDPho//AH5l/wDjlFFAB/wvnxT/AM+Gj/8AfmX/AOOUf8L58U/8+Gj/APfmX/45RRQAf8L58U/8+Gj/APfmX/45R/wvnxT/AM+Gj/8AfmX/AOOUUUAf/9k=';
const BUNDLE_LABEL = 'MyCoach';

// Famille MyCoach : exercices choisis dans la banque MyCoach by FFF (fiches U15 à U17/19 les plus appréciées),
// réécrits et redessinés au format du club. Les bleus attaquent vers la droite.
const MYCOACH = {
  game: 'MyCoach', template: 'match', keepers: 0, cadence: 'series', params: { scale: true }, refCategory: 'U17', ages: ['u15', 'u19', 'sen'],
  family: [], // banque trop large pour lister les variantes en pied de fiche
  goal: [[98.5, 50, 90]], keeper: [[94, 50]],
  src: (titre, auteur, club) => ({ label: 'MyCoach by FFF, « ' + titre + ' » (' + auteur + (club ? ', ' + club : '') + '), réécrit et redessiné', url: 'https://app-fff.mycoachfootball.com/exercises/consultation' }),
  // n joueurs en grille régulière dans un rectangle (en %).
  grid(n, x0, y0, x1, y1) {
    const cols = Math.max(1, Math.round(Math.sqrt(n * (x1 - x0) / (y1 - y0)))), rows = Math.ceil(n / cols), cw = (x1 - x0) / cols, ch = (y1 - y0) / rows;
    return Array.from({ length: n }, (_, i) => { const r = Math.floor(i / cols), inRow = r === rows - 1 ? n - r * cols : cols, c = i % cols + (cols - inRow) / 2;
      return [Math.round(x0 + cw * (c + .5)), Math.round(y0 + ch * (r + .5))]; });
  },
  // Vues communes des circuits : même exercice en mise en route, ou en intermittent.
  echauffement: (obj, posture) => ({ moment: 'echauffement', sub: 'Mise en route', obj, posture,
    coach: ['Commencer doucement, accélérer à chaque passage.', 'Contrôle orienté et passe appuyée dès le début.'],
    expect: ['Se mettre en route sans faute.', 'Augmenter le rythme progressivement.', 'Finir à vitesse de match.'] }),
  physique: (obj, posture) => ({ moment: 'physique', sub: 'Intermittent avec ballon', obj, posture,
    coach: ['Rythme constant pendant tout le temps de travail.', 'La qualité de geste ne baisse pas avec la fatigue.'],
    expect: ['Tenir le rythme sur une série.', 'Tenir le rythme sur toutes les séries.', 'Garder des gestes justes jusqu’à la fin.'] })
};

const EXOS = [];
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Seul ou ça vient', obj: 'Annoncer et lire l’annonce',
  id: 'mc-seul-ca-vient', likes: 224, title: 'Seul ou ça vient', theme: 'Communication', phase: 'ballon', type: 'Exercice',
  players: [6, 6, 9], size: [20, 20], duration: 12, intensity: 1, params: { unit: 'joueurs' },
  src: MYCOACH.src('Seul! ou ça vient!', 'Sébastien Languille', 'US Moyenne Durance'),
  goal: 'Le passeur annonce la situation au receveur, qui agit selon l’annonce.',
  rules: [
    'Par trois sur une ligne, 7 m entre chaque joueur : deux passeurs aux bouts, un receveur au milieu.',
    'En passant, le passeur crie « Seul ! » ou « Ça vient ! ».',
    '« Ça vient ! » : le receveur remet au passeur. « Seul ! » : il se retourne et sert le passeur d’en face.',
    'Séquences d’1 min 30, puis on change le joueur du milieu.'
  ],
  coach: ['Annoncer au moment où le ballon part.', 'Passe cheville bloquée, appuis fixes.', 'Le receveur s’ouvre avant de recevoir quand il est seul.'],
  posture: 'Sur le côté des lignes : il écoute les annonces et corrige celles qui arrivent trop tard.',
  expect: ['Annoncer à chaque passe.', 'Se retourner en un contrôle sur « Seul ».', 'Tout en deux touches maximum.'],
  easier: 'Le receveur a deux touches sur « Ça vient ».', harder: 'Une touche sur « Ça vient », deux sur « Seul ».',
  success: 'Pas une passe sans annonce.',
  also: [{ moment: 'possede', sub: 'Zone 1 · Construire le jeu', obj: 'Communiquer pour se retourner',
    posture: 'Sur le côté : il relie l’annonce au match (le latéral qui prévient son milieu).',
    coach: ['Annoncer tôt et fort.', 'Se retourner seulement sur « Seul ».'],
    expect: ['Annoncer à chaque passe.', 'Se retourner vite.', 'Enchaîner en une touche quand « Ça vient ».'] }],
  layout: { home: [[10, 30], [50, 30], [90, 30], [10, 70], [50, 70], [90, 70]], start: [10, 30], ball: [13, 33], balls: [[13, 73]], moves: [
    [10, 30, 47, 30, 'p', 'Passe et annonce « Ça vient ! »'],
    [50, 30, 13, 32, 'p', 'Remise au passeur'],
    [13, 73, 47, 70, 'p+', 'Autre ligne : « Seul ! »'],
    [50, 70, 54, 70, 'c', 'Le receveur se retourne'],
    [52, 72, 88, 70, 'p', 'Passe au joueur d’en face']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'L’horloge', obj: 'Faire tourner le ballon sans arrêt',
  id: 'mc-horloge', likes: 95, title: 'L’horloge', theme: 'Passe', phase: 'ballon', type: 'Exercice',
  players: [6, 10, 12], size: [20, 20], duration: 15, intensity: 2, params: { unit: 'plots' },
  src: MYCOACH.src('L’Horloge', 'Loïc Raybaudi', 'ET. de Lusigny'),
  goal: 'Cinq plots en cercle : passe au plot suivant et je suis ma passe, le ballon ne s’arrête jamais.',
  rules: [
    'Cinq plots en cercle (rayon de 5 à 15 m), deux joueurs par plot.',
    'Je passe au plot suivant et je cours prendre sa place.',
    'Série 1 : contrôle et passe. Série 2 : une touche. Série 3 : mauvais pied, puis changement de sens.',
    'Deuxième ballon quand le groupe est en place.'
  ],
  coach: ['Le receveur s’oriente vers le plot suivant avant que le ballon arrive.', 'Passe dans le bon pied.', 'Courir après la passe, pas avant.'],
  posture: 'Au centre du cercle : il annonce les changements de série et de sens.',
  expect: ['Le ballon ne s’arrête pas.', 'Toute une série en une touche.', 'Deux ballons sans faute.'],
  easier: 'Rayon de 5 m, contrôle libre.', harder: 'Deux ballons, une touche.',
  success: 'Le ballon tourne sans arrêt.',
  also: [MYCOACH.physique('Enchaîner passes et courses', 'Au centre : il impose un grand rayon et des courses rapides, et chronomètre les séries.')],
  layout: { cones: [[50, 12], [86, 38], [72, 81], [28, 81], [14, 38]], start: [50, 12], home: [[50, 12], [86, 38], [72, 81], [28, 81], [14, 38]], ball: [53, 15], moves: [
    [50, 12, 83, 36, 'p', 'Passe au plot suivant'], [50, 12, 82, 34, 'c+', 'Je suis ma passe'],
    [86, 38, 70, 78, 'p', 'Une touche'], [86, 38, 70, 76, 'c+', ''],
    [72, 81, 30, 79, 'p', 'Le ballon ne s’arrête pas'], [72, 81, 31, 78, 'c+', ''],
    [28, 81, 16, 41, 'p', ''], [28, 81, 17, 42, 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
// Chaque équipe : la moitié dedans, la moitié en appuis sur les côtés, couleurs alternées.
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Carré infernal', obj: 'Créer le surnombre avec ses appuis',
  id: 'mc-carre-infernal', likes: 92, title: 'Carré infernal', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [12, 16, 16], size: [30, 30], duration: 20, intensity: 3,
  src: MYCOACH.src('Carré infernal', 'Kevin Senas', 'Les Labourdins d’Ustaritz'),
  goal: 'Conserver avec ses appuis et les faire entrer un par un dans le carré.',
  rules: [
    '2 équipes de 8 : 4 dans le carré, 4 en appuis sur les côtés, couleurs alternées.',
    'On conserve avec ses propres appuis. L’appui qui joue en une touche entre dans le carré ; en deux touches, il reste dehors.',
    'Gagné quand les 4 appuis sont entrés.',
    'À la perte, les appuis entrés ont 3 secondes pour retrouver leur place. Jeu au sol.'
  ],
  coach: ['Regarder les appuis avant de recevoir.', 'Jouer en une touche avec l’appui pour le faire entrer.', 'Changer de côté quand un côté est fermé.'],
  posture: 'Dans un coin du carré : il compte les appuis entrés à voix haute et surveille le replacement en 3 secondes.',
  expect: ['Faire entrer un appui.', 'Faire entrer deux appuis.', 'Faire entrer les quatre.'],
  easier: 'Deux touches suffisent pour entrer.', harder: 'Le carré se réduit de 5 m.',
  success: 'Les appuis entrent régulièrement, la supériorité est utilisée.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'Empêcher l’entrée des appuis',
    posture: 'Dans un coin : il observe l’équipe sans ballon et sa façon de fermer les appuis.',
    coach: ['Fermer l’appui le plus proche du ballon.', 'Récupérer avant le surnombre.'],
    expect: ['Fermer un appui.', 'Récupérer avant qu’un appui entre.', 'Récupérer et faire entrer les siens.'] }],
  layout: { formations: n => [...MYCOACH.grid(Math.ceil(n / 2), 22, 22, 78, 78), [30, 2], [98, 30], [70, 98], [2, 70], [55, 2], [98, 55]].slice(0, n),
    formationsAway: n => [...MYCOACH.grid(Math.ceil(n / 2), 32, 28, 68, 72).map(([x, y]) => [x + 6, y + 4]), [70, 2], [98, 70], [30, 98], [2, 30], [45, 98], [2, 45]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Conservation dans le carré'],
    ['b2', 'b6', 'p', 'Passe à l’appui'],
    ['b6', 'b4', 'p', 'L’appui joue en une touche'],
    ['b6', [80, 30], 'c+', 'et entre dans le carré : surnombre'],
    ['b4', 'b6', 'p', 'On joue avec le nouvel entrant']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'D’un appui à l’autre', obj: 'Renverser le jeu',
  id: 'mc-appui-appui', likes: 30, title: 'D’un appui à l’autre', theme: 'Renversement', phase: 'ballon', type: 'Jeu',
  players: [10, 10, 12], size: [30, 35], duration: 20, intensity: 3, oddJoker: true,
  src: MYCOACH.src('Progresser d’un côté à l’autre', 'Tony Montiel', 'Racing Club de France'),
  goal: 'Emmener le ballon d’un appui à l’appui opposé sans le perdre.',
  rules: [
    '4 contre 4 dans la zone, un appui neutre à chaque bout.',
    'Point marqué quand le ballon va d’un appui à l’autre en restant dans l’équipe.',
    'On peut rejouer plusieurs fois avec le même appui pour créer le décalage.',
    'À la récupération, l’autre équipe attaque tout de suite. Variante : un but derrière chaque appui, tir autorisé après les deux appuis.'
  ],
  coach: ['Occuper toute la largeur et la profondeur.', 'Être patient : revenir à l’appui si l’autre côté est fermé.', 'Accélérer dès que le décalage est créé.'],
  posture: 'Sur le côté, au milieu de la zone : il valorise la patience puis l’accélération.',
  expect: ['Toucher un appui.', 'Aller d’un appui à l’autre.', 'Enchaîner deux renversements.'],
  easier: '5 contre 4 avec un joker.', harder: 'Deux touches maximum.',
  success: 'Des renversements construits, pas forcés.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'Empêcher le renversement',
    posture: 'Sur le côté : il observe le bloc qui coulisse du côté du ballon.',
    coach: ['Coulisser ensemble vers le ballon.', 'Fermer la passe vers l’appui opposé.'],
    expect: ['Rester compact.', 'Empêcher un renversement.', 'Récupérer et renverser à son tour.'] }],
  layout: { supports: [[2, 50], [98, 50]], formations: n => MYCOACH.grid(n, 14, 14, 82, 86), formationsAway: n => MYCOACH.grid(n, 22, 24, 88, 80).map(([x, y]) => [x, y + 4]), ball: 'a1', script: [
    ['a1', 'b1', 'p', 'Départ de l’appui'],
    ['b1', 'b3', 'p', 'Circulation'],
    ['b3', 'a1', 'p', 'Côté fermé : retour à l’appui'],
    ['a1', 'b2', 'p', 'On change de côté'],
    ['b4', [80, 30], 'c+', 'Le décalage est créé'],
    ['b2', 'b4', 'p', ''],
    ['b4', 'a2', 'p', 'Appui opposé : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
// Deux zones aux extrémités (une même équipe), une bande centrale pour les défenseurs.
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Passer la rivière', obj: 'Casser une ligne par la passe',
  id: 'mc-riviere', likes: 12, title: 'Passer la rivière', theme: 'Passe', phase: 'ballon', type: 'Jeu',
  players: [12, 15, 15], size: [32, 15], duration: 18, intensity: 3, defenders: f => Math.round(f / 3),
  src: MYCOACH.src('Passe dans l’intervalle', 'Bastien Loudot', 'US de Rigny-sur-Arroux'),
  goal: 'Faire passer le ballon d’une zone à l’autre à travers la ligne des défenseurs.',
  rules: [
    'Trois zones : deux de 15 × 15 aux bouts, une bande de 2 m au milieu. Les bleus en deux groupes aux bouts, les rouges dans la bande.',
    'Passe qui traverse jusqu’à l’autre zone = 1 point.',
    'Un seul rouge peut sortir de la bande pour presser dans la zone du ballon.',
    'On tourne les rôles toutes les 3 minutes ; le défenseur qui intercepte prend la place du passeur fautif.'
  ],
  coach: ['Faire bouger le ballon vite pour déplacer la ligne.', 'Chercher l’intervalle entre deux défenseurs.', 'Les receveurs se décalent pour ouvrir la ligne de passe.'],
  posture: 'Au bord de la bande centrale : il compte les points et montre les intervalles ouverts.',
  expect: ['Traverser une fois par séquence.', 'Traverser en deux touches.', 'Traverser après trois passes maximum.'],
  easier: 'Pas de presseur dans la zone.', harder: 'Deux touches maximum dans les zones.',
  success: 'Des passes qui traversent sans forcer.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'Fermer les intervalles',
    posture: 'Au bord de la bande : il observe les rouges et la distance entre eux.',
    coach: ['Coulisser ensemble avec le ballon.', 'Le presseur oriente, les autres ferment.'],
    expect: ['Rester groupés.', 'Intercepter une passe.', 'Intercepter deux fois de suite.'] }],
  layout: { zones: [[0, 0, 47, 100, ''], [53, 0, 47, 100, '']],
    formations: n => [...MYCOACH.grid(Math.ceil(n / 2), 6, 12, 40, 88), ...MYCOACH.grid(Math.floor(n / 2), 60, 12, 94, 88)].slice(0, n),
    formationsAway: n => [...Array.from({ length: n }, (_, i) => [50, Math.round(12 + 76 * (i + .5) / n)])], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Circulation'],
    ['r2', [36, 40], 'c+', 'Un rouge sort presser'],
    ['b2', 'b3', 'p', 'Le ballon change de côté'],
    ['b3', 'b5', 'p', 'Passe dans l’intervalle : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
// Trois zones : défenseurs bleus + attaquant rouge à gauche, milieux au centre, défenseurs rouges + attaquant bleu à droite.
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Trouver la cible', obj: 'Trouver le milieu puis l’attaquant',
  id: 'mc-cible', likes: 18, title: 'Trouver la cible', theme: 'Relance', phase: 'ballon', type: 'Jeu',
  players: [10, 10, 12], size: [25, 40], duration: 15, intensity: 2,
  src: MYCOACH.src('Progresser vers la cible', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Relancer depuis la défense, trouver un milieu dans l’intervalle, puis l’attaquant qui fait tomber un plot.',
  rules: [
    'Trois zones : défense (10 m), milieu (10 m partagés), attaque (5 m). Chaque joueur reste dans sa zone.',
    'Le ballon part toujours des défenseurs, une équipe puis l’autre.',
    'Défenseur → milieu → attaquant : l’attaquant tire pour faire tomber un plot = 1 point.',
    'L’attaquant adverse gêne les défenseurs, les milieux adverses ferment les intervalles.'
  ],
  coach: ['Le milieu se place dans l’intervalle, pas derrière un adversaire.', 'Recevoir orienté vers l’avant.', 'Passe au sol, appuyée.'],
  posture: 'Sur le côté, au niveau de la zone du milieu : il montre les intervalles libres.',
  expect: ['Trouver le milieu.', 'Trouver l’attaquant.', 'Faire tomber un plot en trois passes.'],
  easier: 'L’attaquant adverse ne presse pas.', harder: 'Une touche pour le milieu.',
  success: 'Le milieu est trouvé dans l’intervalle à chaque relance.',
  also: [{ moment: 'nepossede', sub: 'Zone 3 · Défendre haut', obj: 'Fermer les intervalles',
    posture: 'Sur le côté : il observe les milieux qui ferment les lignes de passe.',
    coach: ['Se placer entre le ballon et le milieu adverse.', 'L’attaquant oriente la relance.'],
    expect: ['Gêner la relance.', 'Couper une passe vers le milieu.', 'Intercepter et marquer.'] }],
  layout: { zones: [[25, 0, .01, 100, ''], [80, 0, .01, 100, '']], cones: [[99, 30], [99, 50], [99, 70], [1, 30], [1, 50], [1, 70]],
    formations: n => [[10, 30], [10, 70], [45, 25], [45, 75], [88, 50], [45, 50]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Relance entre défenseurs'],
    ['b3', [52, 40], 'c+', 'Le milieu se place dans l’intervalle'],
    ['b2', 'b3', 'p', 'Passe au milieu'],
    ['b3', 'b5', 'p', 'Passe à l’attaquant'],
    ['b5', [99, 50], 's', 'Il fait tomber un plot : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Appui, soutien, troisième', obj: 'Jouer vers l’avant à deux puis à trois',
  id: 'mc-appui-soutien', likes: 33, title: 'Appui, soutien, troisième', theme: 'Jeu à trois', phase: 'ballon', type: 'Exercice',
  players: [4, 4, 8], size: [10, 40], duration: 15, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Relation appui - soutien - 3ème', 'Johan Roubault', 'AS Aix-en-Provence'),
  goal: 'Quatre carrés en ligne, un joueur par carré : enchaîner appui, soutien et troisième homme dans les deux sens.',
  rules: [
    'Quatre carrés de 10 m alignés, un joueur dans chaque carré. Allers-retours.',
    '3 min : contrôle et passe en deux touches, d’un carré à l’autre.',
    '4 min : le 1 joue sur le 3 (appui), le 3 remet au 2 (soutien), le 2 sert le 4 (troisième homme).',
    '4 min : une-deux pour le troisième, puis jeu court-jeu long ; on change de carré à chaque passage.'
  ],
  coach: ['L’appui protège et remet en une touche.', 'Le soutien se montre de face, ouvert vers l’avant.', 'La passe au troisième part sans contrôle.'],
  posture: 'Sur le côté des carrés : il annonce les changements de consigne et corrige l’orientation du soutien.',
  expect: ['Enchaîner sans faute en deux touches.', 'Réussir appui-soutien-troisième.', 'Toute la séquence en une touche.'],
  easier: 'Deux touches partout.', harder: 'Une touche, jeu long au sol pour finir.',
  success: 'Le troisième reçoit sans que le ballon s’arrête.',
  also: [MYCOACH.echauffement('Se mettre en route à trois', 'Sur le côté : il commence en deux touches puis accélère.')],
  layout: { zones: [[0, 0, 25, 100, ''], [25, 0, 25, 100, ''], [50, 0, 25, 100, ''], [75, 0, 25, 100, '']], start: [12, 50], home: [[12, 50], [37, 50], [62, 50], [87, 50]], ball: [15, 53], moves: [
    [12, 50, 59, 50, 'p', 'Le 1 joue sur l’appui (3)'], [37, 50, 37, 34, 'c+', 'Le 2 se montre en soutien'],
    [62, 50, 40, 36, 'p', 'L’appui remet au soutien'],
    [37, 34, 84, 50, 'p', 'Le soutien trouve le troisième (4)']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Couloirs protégés', obj: 'Agrandir l’espace en largeur et en profondeur',
  id: 'mc-couloirs', likes: 53, title: 'Couloirs protégés', theme: 'Largeur', phase: 'ballon', type: 'Jeu',
  players: [12, 14, 16], keepers: 1, size: [40, 45], duration: 20, intensity: 3,
  src: MYCOACH.src('Agrandir l’espace de jeu en largeur et en profondeur', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Les bleus marquent après être passés par un couloir ; les rouges récupèrent et cherchent un joueur lancé dans la zone cible.',
  rules: [
    'Deux couloirs sur les côtés : on y entre seulement par une passe ; on y est inattaquable, 5 secondes maximum.',
    'Bleus : but valable seulement après un passage par un couloir. 3 points si le ballon est passé par les deux couloirs.',
    'Rouges : à la récupération, trouver un partenaire lancé dans la zone cible (derrière la ligne de départ des bleus) = 1 point.',
    'Variante : touches limitées.'
  ],
  coach: ['Un joueur toujours dans chaque couloir, large.', 'Le couloir sert à étirer : rentrer ou renverser vite.', 'Attaquer la surface à plusieurs après le passage.'],
  posture: 'Sur le côté, au niveau du couloir : il compte les 5 secondes et valorise les doubles passages.',
  expect: ['Passer par un couloir.', 'Marquer après le couloir.', 'Marquer après les deux couloirs.'],
  easier: '8 secondes dans le couloir.', harder: 'Deux touches dans le couloir.',
  success: 'Le jeu s’écarte avant d’attaquer le but.',
  also: [{ moment: 'recupere', sub: 'Zone 1 · Jouer vers l’avant', obj: 'Trouver un joueur lancé',
    posture: 'Derrière la zone cible : il observe la première passe après la récupération.',
    coach: ['Un joueur part dans la profondeur au moment de la récupération.', 'Première passe vers l’avant si elle est possible.'],
    expect: ['Regarder devant.', 'Trouver la zone cible.', 'Trouver la zone cible en deux passes.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[0, 0, 100, 16, 'Couloir'], [0, 84, 100, 16, 'Couloir'], [0, 16, 10, 68, 'Zone cible']],
    formations: n => [[20, 50], [35, 30], [35, 70], [50, 50], [55, 8], [55, 92], [70, 40], [70, 60]].slice(0, n), formationsAway: n => [[84, 34], [84, 66], [72, 50], [62, 30], [62, 70], [42, 50], [86, 50]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Circulation'],
    ['b2', 'b5', 'p', 'Passe dans le couloir'],
    ['b5', [78, 8], 'd', 'Inattaquable, 5 secondes'],
    ['b7', [86, 44], 'c+', 'Appel dans la surface'],
    ['b5', 'b7', 'p', 'Centre'],
    ['b7', 'butR', 's', 'But après le couloir']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Combinaison côté gauche', obj: 'Lancer le latéral dans le dos',
  id: 'mc-combi-gauche', likes: 34, title: 'Attaque placée en une touche', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [6, 7, 14], size: [45, 55], duration: 20, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('Attaque placée à une touche de balle', 'Arnaud Lamarle', 'SC Moulins-lès-Metz'),
  goal: 'Une combinaison en une touche pour libérer le latéral dans le dos de la défense, puis attaquer la surface à trois.',
  rules: [
    'Le 6 fait un une-deux avec le 10, puis joue sur l’ailier gauche qui décroche dans l’axe.',
    'L’ailier remet au 10, qui lance le latéral gauche dans le dos (l’ailier a aspiré son défenseur).',
    'Le latéral centre : l’attaquant au premier poteau, l’ailier droit au second, le 10 à l’entrée de la surface.',
    'Postes doublés (deux équipes de 6 + gardien), une touche de balle. On refait la combinaison côté droit.'
  ],
  coach: ['Chaque appel part au moment de la passe précédente.', 'Passes appuyées, dans le bon pied.', 'Trois zones d’arrivée occupées sur le centre.'],
  posture: 'À l’entrée de la surface, côté droit : il voit le timing du latéral et l’arrivée dans la surface.',
  expect: ['Réussir la combinaison.', 'Centrer sur un partenaire.', 'Marquer en une touche.'],
  easier: 'Deux touches autorisées.', harder: 'Un défenseur sur l’ailier.',
  success: 'La combinaison sort sans arrêt du ballon.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, start: [30, 50],
    home: [[30, 50], [50, 60], [62, 14], [36, 10], [72, 50], [70, 88]], ball: [33, 53], moves: [
    [30, 50, 47, 58, 'p', 'Le 6 joue avec le 10'], [50, 60, 36, 48, 'p', 'Une-deux'],
    [62, 14, 58, 34, 'c+', 'L’ailier gauche décroche'],
    [36, 48, 56, 34, 'p', 'Passe à l’ailier'], [56, 34, 50, 58, 'p', 'Remise au 10'],
    [36, 10, 80, 10, 'c+', 'Le latéral part dans le dos'],
    [50, 58, 78, 12, 'p', 'Le 10 lance le latéral'],
    [72, 50, 88, 40, 'c+', 'Premier poteau'], [70, 88, 90, 62, 'c+', 'Second poteau'], [50, 60, 74, 52, 'c+', 'Entrée de surface'],
    [80, 12, 88, 40, 'p', 'Centre'], [88, 40, 98, 46, 's', 'Frappe en une touche']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Dédoublement et centre en retrait', obj: 'Dédoubler au bon moment',
  id: 'mc-dedoublement', likes: 27, title: 'Dédoublement et centre en retrait', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [4, 5, 10], size: [40, 50], duration: 20, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('dédoublement', 'Tony Montiel', 'Racing Club de France'),
  goal: 'Le latéral dédouble, reçoit dans la profondeur et centre en retrait pour le buteur.',
  rules: [
    'Un latéral, deux milieux, un buteur, un gardien.',
    'Le latéral joue sur le milieu reculé, qui fait un une-deux avec le milieu avancé.',
    'Le latéral dédouble le long de la ligne ; le milieu le lance dans la profondeur.',
    'Le buteur fait son appel, le latéral centre au sol en retrait ; finition libre. On tourne les postes.'
  ],
  coach: ['Ne jamais être en avance sur le ballon.', 'Le latéral accélère au moment de la passe.', 'Le buteur attaque le point de penalty, pas le but.'],
  posture: 'Au point de penalty, côté opposé : il voit le tempo de l’appel et le centre.',
  expect: ['Bon tempo d’appel.', 'Centre en retrait réussi.', 'Marquer en une touche.'],
  easier: 'Pas de une-deux, passe directe au latéral.', harder: 'Un défenseur suit le buteur.',
  success: 'Le buteur reçoit lancé, face au but.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, start: [36, 88], home: [[36, 88], [48, 66], [62, 54], [66, 38]], ball: [39, 85], moves: [
    [36, 88, 45, 66, 'p', 'Passe au milieu reculé'],
    [48, 66, 59, 56, 'p', 'Une-deux'], [62, 54, 50, 64, 'p', ''],
    [36, 88, 80, 92, 'c+', 'Le latéral dédouble'],
    [50, 64, 80, 90, 'p', 'Passe dans la profondeur'],
    [66, 38, 82, 52, 'c+', 'Appel du buteur'],
    [80, 90, 82, 54, 'p', 'Centre en retrait'], [82, 54, 98, 50, 's', 'Finition']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Hexagone', obj: 'Conserver avec six appuis',
  id: 'mc-hexagone', likes: 21, title: 'Conserver dans un hexagone', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [12, 12, 14], size: [25, 25], duration: 20, intensity: 3,
  src: MYCOACH.src('conserver dans une structure hexagonale', 'Johan Roubault', 'AS Aix-en-Provence'),
  goal: '3 contre 3 au milieu, chaque équipe a trois appuis sur les côtés de l’hexagone, en alternance.',
  rules: [
    'Deux équipes de 6 : 3 au milieu, 3 en appuis sur les côtés de l’hexagone (une couleur sur deux).',
    'On conserve avec ses appuis.',
    'Variantes : touches limitées, jeu au sol.',
    'Variante : l’appui qui reçoit entre dans le jeu, celui qui lui a donné prend sa place.'
  ],
  coach: ['Toujours un appui libre : le regarder avant de recevoir.', 'Se démarquer après la passe.', 'Changer de côté.'],
  posture: 'Au bord de l’hexagone : il change les variantes.',
  expect: ['Conserver 6 passes.', 'Utiliser trois appuis.', 'Conserver en deux touches.'],
  easier: 'Appuis à trois touches.', harder: 'Une touche pour les appuis.',
  success: 'Le ballon circule entre les appuis.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'S’opposer à la progression',
    posture: 'Au bord : il observe les trois défenseurs.', coach: ['Fermer l’appui le plus proche.', 'Presser à deux.'],
    expect: ['Fermer un appui.', 'Récupérer.', 'Récupérer en moins de 6 passes.'] }],
  layout: { formations: n => [[38, 40], [50, 62], [62, 40], [50, 2], [93, 75], [7, 75]].slice(0, n), formationsAway: n => [[44, 50], [56, 50], [50, 34], [93, 25], [50, 98], [7, 25]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b4', 'p', 'Passe à l’appui'], ['b4', 'b3', 'p', ''], ['b3', 'b5', 'p', 'Autre appui'], ['b5', 'b2', 'p', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Sortie des six mètres', obj: 'Automatiser la relance courte',
  id: 'mc-sortie-6m', likes: 21, title: 'Circuits préférentiels de sortie des six mètres', theme: 'Relance', phase: 'ballon', type: 'Exercice',
  players: [8, 9, 18], size: [50, 64], duration: 24, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('2 Circuits préférentiels sortie de 6m', 'Grégory Joly', 'US Colomiers'),
  goal: 'Deux circuits de relance depuis le gardien, à gauche puis à droite, jusqu’à l’attaquant lancé sur le côté.',
  rules: [
    'Départ du gardien. Un central près de lui dans la surface, l’autre aux 16 m dans l’axe, les latéraux le long de la ligne.',
    'Circuit 1 : gardien → central (ou milieu défensif) en appui-remise → second central → milieu de côté qui rentre pour libérer le couloir → latéral → passe en profondeur à l’attaquant sur le côté.',
    'Circuit 2 : gardien → central → latéral qui s’appuie sur le milieu défensif → central qui allonge sur le milieu de côté → déviation pour le latéral → profondeur pour l’attaquant.',
    'Alterner gauche et droite. Marquer les positions au départ, puis enlever les coupelles.'
  ],
  coach: ['Tout le monde bouge pour libérer des espaces.', 'Justesse et intensité dans chaque passe.', 'Attirer un adversaire imaginaire avant de jouer.'],
  posture: 'Au niveau des 16 m : il fait répéter et corrige les positions.',
  expect: ['Circuit sans faute.', 'Rythme élevé.', 'Les deux circuits enchaînés.'],
  easier: 'Un seul circuit.', harder: 'Deux attaquants qui pressent.',
  success: 'La relance sort proprement jusqu’à l’attaquant.',
  layout: { goals: [[1.5, 50, 90]], keepers: [[6, 50]], start: [6, 50], home: [[14, 40], [26, 54], [20, 6], [20, 94], [36, 50], [46, 18], [70, 10]], ball: [9, 53], moves: [
    [9, 53, 14, 43, 'p', 'Le gardien joue court'], [14, 40, 26, 51, 'p', 'Vers le second central'],
    [46, 18, 44, 30, 'c+', 'Le milieu de côté rentre'], [26, 54, 44, 30, 'p', ''],
    [20, 6, 50, 6, 'c+', 'Le latéral monte dans le couloir'], [44, 30, 50, 6, 'p', 'Passe au latéral'],
    [70, 10, 86, 14, 'c+', 'Appel de l’attaquant'], [50, 6, 86, 14, 'p', 'Profondeur']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Terrain annoncé', obj: 'S’adapter vite à un nouvel espace',
  id: 'mc-terrain-annonce', likes: 20, title: 'Conservation et prise d’information', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [12, 16, 16], size: [40, 50], duration: 25, intensity: 3,
  src: MYCOACH.src('Conservation + prise d’informations', 'Kevin Senas', 'Les Labourdins d’Ustaritz'),
  goal: 'Conservation à 8 contre 8 : le coach annonce sur quel terrain jouer, il faut y emmener le ballon.',
  rules: [
    'Plusieurs terrains de couleur côte à côte.',
    '8 contre 8 maximum, 10 passes = 1 point.',
    'Le coach annonce « terrain rouge ! » : les joueurs y vont en conservant, balle au pied, et continuent.',
    'L’équipe qui défend peut presser pendant le déplacement.'
  ],
  coach: ['Lever la tête : où est le nouveau terrain ?', 'Le porteur progresse, les autres occupent le nouvel espace.', 'S’adapter vite à la nouvelle surface.'],
  posture: 'Entre les terrains : il annonce les couleurs.',
  expect: ['10 passes.', 'Changer de terrain sans perdre le ballon.', 'Marquer juste après le changement.'],
  easier: 'Pas de pression pendant le changement.', harder: 'Deux touches.',
  success: 'Les équipes s’adaptent sans perdre le ballon.',
  layout: { zones: [[0, 0, 50, 100, 'Terrain bleu'], [50, 0, 50, 100, 'Terrain rouge']], formations: n => MYCOACH.grid(n, 6, 10, 46, 90), formationsAway: n => MYCOACH.grid(n, 12, 18, 44, 82).map(([x, y]) => [x + 2, y + 4]), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Conservation'], ['b2', [64, 40], 'd', '« Terrain rouge ! »'], ['b5', [80, 20], 'c+', 'Les autres occupent le nouvel espace'], ['b2', 'b5', 'p', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Finition sol-air', obj: 'Marquer comme ça vient',
  id: 'mc-sol-air', likes: 20, title: 'Finition sol-air en trois temps', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [3, 6, 12], size: [30, 40], duration: 20, intensity: 3, params: { unit: 'joueurs' },
  src: MYCOACH.src('finition sol air', 'Nicolas Gueulle', 'USBS Épône'),
  goal: 'Trois ballons d’affilée : dos au but, puis deux centres en coupant au premier poteau.',
  rules: [
    'Ballon 1 : A reçoit dos au but, contrôle orienté et frappe.',
    'A contourne le plot de gauche et attaque le premier poteau pour couper le centre de B.',
    'Même chose de l’autre côté avec le centre de C.',
    'On tourne les rôles.'
  ],
  coach: ['Contrôle orienté pour se retourner.', 'Couper la trajectoire du centre.', 'Reprendre vers le sol.'],
  posture: 'À côté du but : il enchaîne les trois ballons.',
  expect: ['Trois frappes.', 'Deux cadrées.', 'Deux buts.'],
  easier: 'Centres à la main.', harder: 'Un défenseur sur les centres.',
  success: 'Trois frappes sans temps mort.',
  also: [MYCOACH.physique('Enchaîner les frappes', 'À côté du but : il impose l’enchaînement sans pause.')],
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[64, 30], [64, 70]], start: [72, 50], home: [[72, 50], [80, 6], [80, 94], [50, 50]], ball: [53, 53], balls: [[83, 9], [83, 91]], moves: [
    [53, 53, 70, 50, 'p', 'Ballon dos au but'], [72, 50, 78, 54, 'd', 'Contrôle orienté'], [79, 55, 98, 52, 's', 'Frappe'],
    [78, 54, 62, 26, 'c', 'Il contourne le plot'], [62, 26, 88, 42, 'c', 'Premier poteau'], [83, 9, 88, 42, 'p', 'Centre de B'], [88, 42, 98, 46, 's', 'Reprise']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', name: 'Cadrer à trois', obj: 'Créer la densité autour du porteur',
  id: 'mc-cadrer-trois', likes: 19, title: 'S’organiser pour récupérer collectivement', theme: 'Récupération', phase: 'sans', type: 'Jeu',
  players: [12, 16, 16], size: [18, 18], duration: 18, intensity: 3, oddJoker: true,
  src: MYCOACH.src('Echauffement s’organiser pour récupérer le ballon collectivement', 'Grégory Joly', 'US Colomiers'),
  goal: 'Les bleus conservent avec un joueur central ; les rouges cadrent à trois, ferment les intervalles et récupèrent.',
  rules: [
    'Carré de 18 m, deux mini-buts dans deux coins opposés. Un bleu joue au centre.',
    'Bleus : 8 passes en touchant deux fois le joueur central = 2 points.',
    'Rouges : ballon dégagé hors du carré = 1 point ; récupérer et marquer en moins de 2 passes dans un mini-but = 3 points.',
    'Séquences : libre, puis 3 touches, puis 3 touches et une touche pour le joueur central. Compétition entre équipes.'
  ],
  coach: ['Cadrer à trois : un presse, deux ferment.', 'Fermer les intervalles vers le joueur central.', 'Réagir vite à la récupération.'],
  posture: 'Au bord du carré : il compte les points et observe la densité autour du porteur.',
  expect: ['Cadrer à deux.', 'Cadrer à trois.', 'Récupérer et marquer 3 points.'],
  easier: 'Bleus à 3 touches dès le début.', harder: 'Bleus en jeu libre.',
  success: 'Le porteur est entouré à chaque fois.',
  also: [{ moment: 'echauffement', sub: 'Mise en route', obj: 'S’échauffer en récupérant ensemble', posture: 'Au bord du carré : il fait monter l’intensité.',
    coach: ['Démarrer en jeu libre.', 'Augmenter l’intensité.'], expect: ['Bouger.', 'Presser ensemble.', 'Récupérer.'] }],
  layout: { minis: [[4, 4, 45], [96, 96, 45]], supports: [[50, 50, 'C']], formations: n => MYCOACH.grid(n, 8, 10, 92, 90), formationsAway: n => MYCOACH.grid(n, 22, 24, 78, 76).map(([x, y]) => [x + 5, y + 4]), ball: 'b1', script: [
    ['b1', 'a1', 'p', 'Passe au joueur central'], ['r1', [44, 40], 'c+', 'Trois rouges cadrent'], ['r2', [56, 44], 'c+', ''], ['r3', [50, 60], 'c+', ''],
    ['a1', 'b3', 'p', ''], ['r3', [96, 96], 's', 'Récupération et but : 3 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Triangle et frappe placée', obj: 'Se coordonner à trois et placer sa frappe',
  id: 'mc-triangle-frappe', likes: 19, title: 'Triangle et finition', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [3, 6, 10], size: [15, 25], duration: 15, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Triangle Barcelone - finition', 'Jérôme Mauri', 'JS Istres'),
  goal: 'A sert B, qui remet et choisit un plot ; C le suit, A sert C, qui remet à B pour la frappe.',
  rules: [
    'A passe au sol à B, appuyée ; B remet et choisit le plot bleu ou le plot jaune.',
    'C se déplace vers le même plot que B.',
    'A sert C en diagonale, C remet latéralement à B, qui frappe.',
    'Rotation A → B → C → A.'
  ],
  coach: ['Passes au sol, appuyées.', 'Déplacements coordonnés.', 'Frapper placé, pas fort.'],
  posture: 'À côté du but : il observe le choix de B et le déplacement de C.',
  expect: ['Circuit sans faute.', 'Frappe cadrée.', 'But placé.'],
  easier: 'B annonce son choix.', harder: 'Une touche pour tous.',
  success: 'Des frappes placées à chaque passage.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, discs: [[60, 30], [60, 70]], start: [20, 50], home: [[20, 50], [44, 50], [36, 80]], ball: [23, 53], moves: [
    [23, 53, 41, 50, 'p', 'A sert B'], [44, 50, 25, 54, 'p', 'Remise'], [44, 50, 60, 32, 'c+', 'B choisit un plot'], [36, 80, 56, 40, 'c+', 'C le suit'],
    [25, 54, 54, 42, 'p', 'A sert C'], [56, 40, 62, 34, 'p', 'Remise latérale'], [62, 34, 98, 46, 's', 'Frappe placée']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Cinq ateliers de motricité', obj: 'Améliorer l’habileté motrice',
  id: 'mc-motricite', likes: 19, title: 'Atelier motricité', theme: 'Motricité', phase: 'sans', type: 'Exercice',
  players: [5, 10, 10], size: [20, 30], duration: 15, intensity: 1, params: { unit: 'joueurs' },
  src: MYCOACH.src('Atelier motricité', 'Samy Makhloufi', 'FC Drouais'),
  goal: 'Cinq ateliers de 3 minutes, deux joueurs par atelier.',
  rules: [
    'Échelle : un pied entre chaque latte, bras et jambe opposés.',
    'Cerceaux : rouge pied droit, bleu pied gauche, à cloche-pied.',
    'Piquets : pas chassés latéraux.',
    'Cerceaux codés (rouge droit, bleu gauche, noir pieds joints) sur la pointe des pieds ; coupelles : appuis arrière.'
  ],
  coach: ['Montée de genoux.', 'Sur la pointe des pieds.', 'Bras et jambe opposés.'],
  posture: 'Entre les ateliers : il corrige les appuis.',
  expect: ['Faire chaque atelier.', 'Appuis propres.', 'Appuis rapides et propres.'],
  easier: 'Ateliers plus lents.', harder: 'Ballon à la main.',
  success: 'Des appuis légers et coordonnés.',
  layout: { zones: [[4, 6, 28, 26, 'Échelle'], [36, 6, 28, 26, 'Cerceaux'], [68, 6, 28, 26, 'Piquets'], [20, 68, 28, 26, 'Cerceaux codés'], [52, 68, 28, 26, 'Coupelles']],
    start: [8, 19], home: [[8, 19], [40, 19], [72, 19], [24, 81], [56, 81]], moves: [
    [8, 19, 28, 19, 'c', 'Chacun fait son atelier'], [40, 19, 60, 19, 'c+', ''], [72, 19, 92, 19, 'c+', ''], [24, 81, 44, 81, 'c+', ''], [56, 81, 76, 81, 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', template: 'circuit', keepers: 2, moment: 'physique', sub: 'Circuit d’équipe à deux buts', name: 'Circuit d’équipe à deux buts', obj: 'Entretenir la capacité aérobie en jouant',
  id: 'mc-endurance-equipe', likes: 19, title: 'Travailler l’endurance avec ballon', theme: 'Physique', phase: 'ballon', type: 'Exercice',
  players: [8, 16, 18], size: [64, 100], duration: 20, intensity: 3, series: [240, 90], params: { unit: 'joueurs' },
  src: MYCOACH.src('Travailler l’endurance avec ballon', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Deux équipes font un circuit de passes jusqu’au but, puis tout le monde se replace dans l’autre moitié.',
  rules: [
    'Les deux équipes démarrent leur circuit en même temps, chacune vers un but, selon son système de jeu.',
    'Après les 6 premières passes, tous les joueurs doivent avoir franchi la ligne de la moitié de terrain.',
    'Finition, puis chacun se replace sur l’autre circuit.',
    'Variante : l’équipe qui se replace le plus vite marque 2 points. Varier les postes, alterner gauche et droite.'
  ],
  coach: ['Qualité technique même en fatigue.', 'Tout le monde franchit la ligne.', 'Intensité des courses.'],
  posture: 'Au milieu de terrain : il compte les buts et les replacements.',
  expect: ['Finir le circuit.', 'Tout le monde franchit la ligne.', 'Marquer et se replacer en premier.'],
  easier: 'Circuit plus court.', harder: 'Une touche partout.',
  success: 'Rythme élevé et gestes justes.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], keepers: [[6, 50], [94, 50]], zones: [[50, 0, .01, 100, '']], start: [20, 50], home: [[20, 50], [34, 20], [42, 60], [56, 15], [70, 50]], ball: [23, 53], moves: [
    [23, 53, 32, 22, 'p', 'Circuit de passes'], [34, 20, 40, 58, 'p', ''], [42, 60, 54, 18, 'p', ''], [20, 50, 60, 54, 'c+', 'Tout le monde passe la ligne'],
    [56, 15, 68, 48, 'p', 'Centre'], [70, 50, 98, 48, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', name: 'Jeu aérien et seconds ballons', obj: 'Gagner les duels aériens et les seconds ballons',
  id: 'mc-jeu-aerien', likes: 19, title: 'Jeu aérien défensif et seconds ballons', theme: 'Technique défensive', phase: 'sans', type: 'Situation',
  players: [15, 16, 16], size: [64, 52], duration: 20, intensity: 3, defenders: 7,
  src: MYCOACH.src('situation - jeu aérien défensif en 4-3-3 + 2ème ballons', 'Johan Roubault', 'AS Aix-en-Provence'),
  goal: 'L’action part d’un long ballon bleu vers un attaquant : les rouges gagnent le duel aérien et le second ballon.',
  rules: [
    'Demi-terrain : 4 défenseurs + 3 milieux rouges en zone contre 4 attaquants + milieux bleus (8 contre 7).',
    'Départ : ballon aérien d’un milieu bleu vers un attaquant. On joue tant que le ballon ne sort pas.',
    'Rouges : ballon à un milieu = 1 point, puis une passe au sol entre deux joueurs = 1 point.',
    'Bleus : frappe = 1 point, but = 1 point. Varier les sources, la hauteur du bloc, la position des attaquants.'
  ],
  coach: ['Attaquer le ballon au point le plus haut.', 'Les milieux se placent pour le second ballon.', 'Couvrir le partenaire qui saute.'],
  posture: 'Sur la touche, au niveau de la ligne défensive : il varie les sources de ballons.',
  expect: ['Gagner le duel aérien.', 'Récupérer le second ballon.', 'Ressortir au sol.'],
  easier: 'Ballons plus courts.', harder: 'Deux attaquants sur le duel.',
  success: 'Les seconds ballons sont gagnés.',
  also: [{ moment: 'possede', sub: 'Zone 3 / Box · Finition', obj: 'Jouer long et attaquer le second ballon',
    posture: 'Derrière les attaquants : il observe l’attaque du second ballon.', coach: ['Dévier vers un partenaire.', 'Attaquer la zone du second ballon.'],
    expect: ['Gagner le duel.', 'Récupérer le second ballon.', 'Frapper.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], formations: n => [[34, 50], [44, 30], [44, 70], [66, 20], [70, 42], [70, 58], [66, 80], [56, 50]].slice(0, n),
    formationsAway: n => [[82, 20], [84, 40], [84, 60], [82, 80], [70, 34], [68, 50], [70, 66]].slice(0, n), ball: 'b1', script: [
    ['b1', [74, 44], 'p', 'Ballon aérien'], ['r2', [74, 44], 'c+', 'Le défenseur attaque le ballon'], ['r6', [66, 48], 'c+', 'Le milieu se place pour le second ballon'],
    ['r2', 'r6', 'p', 'Déviation'], ['r6', 'r5', 'p', 'Passe au sol : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Le chiffre à l’opposé', obj: 'Prendre l’information à l’opposé',
  id: 'mc-info-oppose', likes: 19, title: 'La prise d’information à l’opposé', theme: 'Prise d’information', phase: 'ballon', type: 'Exercice',
  players: [3, 3, 9], size: [10, 15], duration: 12, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('La prise d’information (à l’opposé)', 'Jordy Rousseau', 'Draveil FC'),
  goal: 'Avant de recevoir de face, le joueur annonce le chiffre que montre son partenaire derrière lui.',
  rules: [
    'Trois joueurs : un passeur (A) face au joueur en mouvement, un partenaire (B) derrière lui.',
    'B montre un chiffre avec ses doigts.',
    'Avant de recevoir de A, le joueur jette un coup d’œil et annonce le chiffre de B.',
    'Passes de 7 à 10 m. On tourne les rôles.'
  ],
  coach: ['Coup d’œil rapide avant la passe.', 'Annoncer avant de recevoir, pas après.', 'Garder une passe juste.'],
  posture: 'Derrière le passeur : il vérifie les annonces.',
  expect: ['Annoncer le bon chiffre.', 'Annoncer avant la réception.', 'Annoncer et remettre en une touche.'],
  easier: 'B montre le chiffre plus longtemps.', harder: 'B change de chiffre sans arrêt.',
  success: 'Le joueur regarde derrière lui à chaque passe.',
  layout: { cones: [[50, 30], [50, 70], [60, 50]], start: [50, 50], home: [[50, 50], [10, 50], [92, 50]], ball: [13, 53], moves: [
    [50, 50, 50, 34, 'c', 'Coup d’œil vers B, annonce du chiffre'], [13, 53, 48, 36, 'p', 'Passe de A'], [50, 34, 14, 52, 'p', 'Remise']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Seul ou ça vient en finition', obj: 'Déséquilibrer le bloc pour centrer',
  id: 'mc-desequilibrer', likes: 14, title: 'Déséquilibrer le bloc défensif', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [4, 6, 12], size: [45, 50], duration: 20, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('Déséquilibrer le bloc défensif', 'Rodolphe Martins', 'US Lamorlaye'),
  goal: 'Jeu à trois dans l’axe, passe dans la profondeur sur le côté, centre pour deux attaquants.',
  rules: [
    'A sert B qui vient demander ; B joue avec C, qui lui remet dans la course.',
    'B lance D dans la profondeur sur le côté ; D centre.',
    'A et C attaquent la surface et finissent.',
    'Variante : le coach crie « Seul » (même circuit) ou « Ça vient » (B lance A de l’autre côté, C et D attaquent la surface).'
  ],
  coach: ['Le ballon passe vite de A à D.', 'Centre en deux touches maximum si besoin.', 'Les deux attaquants n’arrivent pas au même endroit.'],
  posture: 'Derrière B, au milieu : il donne l’annonce « Seul » ou « Ça vient » au moment où B reçoit.',
  expect: ['Enchaîner sans arrêt.', 'Centre exploitable.', 'Marquer sur le centre.'],
  easier: 'Pas d’annonce, toujours le même côté.', harder: 'Un défenseur dans la surface.',
  success: 'Le centre arrive sur un attaquant lancé.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, start: [30, 50], home: [[30, 50], [50, 50], [62, 62], [58, 12]], ball: [33, 53], moves: [
    [30, 50, 47, 50, 'p', 'A sert B'], [50, 50, 59, 60, 'p', 'B joue avec C'], [50, 50, 56, 40, 'c+', ''],
    [62, 62, 56, 42, 'p', 'Remise dans la course'],
    [58, 12, 84, 10, 'c+', 'D part dans la profondeur'], [56, 40, 82, 12, 'p', 'Passe à D'],
    [30, 50, 86, 44, 'c+', 'A attaque la surface'], [62, 62, 84, 60, 'c+', 'C aussi'],
    [84, 10, 86, 44, 'p', 'Centre'], [86, 44, 98, 50, 's', 'Finition']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Appuis latéraux', obj: 'Passer par les côtés pour progresser',
  id: 'mc-appuis-lateraux', likes: 18, title: 'Jeu avec appuis latéraux', theme: 'Largeur', phase: 'ballon', type: 'Jeu',
  players: [14, 17, 18], size: [36, 45], duration: 18, intensity: 3,
  src: MYCOACH.src('Le jeux avec appuis latéraux', 'Ricardo Cunha', 'FC Espagnol Lausanne'),
  goal: 'Trois équipes : deux jouent, la troisième sert d’appuis sur les côtés. Passage obligatoire par un appui.',
  rules: [
    'Deux équipes jouent l’une contre l’autre vers deux buts ; la troisième est en appuis le long des touches.',
    'Jeu au sol. Passage obligatoire par un appui latéral avant de marquer.',
    'Deux touches dans sa zone défensive ; 3 secondes maximum avec le ballon dans la zone offensive.',
    'On change d’équipe en appui à chaque séquence.'
  ],
  coach: ['Utiliser l’appui pour progresser.', 'Accélérer dans la zone offensive.', 'Jeu au sol.'],
  posture: 'Sur la touche : il fait tourner les équipes.',
  expect: ['Passer par l’appui.', 'Frapper en moins de 3 secondes.', 'Marquer.'],
  easier: 'Pas de limite de temps.', harder: 'Appuis à une touche.',
  success: 'Le jeu passe par les côtés.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[50, 0, .01, 100, '']], supports: [[25, 2], [75, 2], [25, 98], [75, 98], [50, 2], [50, 98]],
    formations: n => [[20, 30], [20, 70], [36, 50], [46, 25], [46, 75]].slice(0, n), ball: 'b3', script: [
    ['b3', 'a2', 'p', 'Passage par l’appui'], ['b4', [72, 30], 'c+', ''], ['a2', 'b4', 'p', ''], ['b4', 'butR', 's', 'Frappe en moins de 3 secondes']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', template: 'circuit', moment: 'physique', sub: 'Traversées en 30-30', name: 'Traversées en 30-30', obj: 'Endurance capacité en traversant',
  id: 'mc-traversees', likes: 18, title: 'Échauffement en 30-30', theme: 'Physique', phase: 'ballon', type: 'Exercice',
  players: [10, 20, 24], size: [64, 100], duration: 15, intensity: 2, series: [30, 30], params: { unit: 'joueurs' },
  src: MYCOACH.src('30/30 Echauffement', 'Timothée Bennoit', 'SO Velleronnais'),
  goal: 'Deux groupes dans les surfaces : 30 secondes pour rejoindre l’autre surface, de façons différentes.',
  rules: [
    'Deux groupes, chacun dans une surface de réparation, un ballon par joueur.',
    'Au signal, 30 secondes pour rejoindre l’autre surface ; 30 secondes de récupération.',
    'Varier les traversées : conduite, contourner un plot, sans ballon, pichenette par-dessus un plot, fixer un plot…',
    'Les deux groupes se croisent au milieu.'
  ],
  coach: ['Allure régulière.', 'Lever la tête au croisement.', 'Ballon maîtrisé même en courant.'],
  posture: 'Au rond central : il annonce la façon de traverser.',
  expect: ['Arriver en 30 secondes.', 'Ballon maîtrisé.', 'Toutes les traversées.'],
  easier: '40 secondes.', harder: '25 secondes.',
  success: 'Tout le monde arrive à temps.',
  layout: { zones: [[0, 20, 16, 60, 'Surface'], [84, 20, 16, 60, 'Surface']], cones: [[35, 30], [50, 50], [65, 70]], start: [8, 40], home: [[8, 40], [8, 60], [92, 40], [92, 60]], ball: [11, 43], balls: [[11, 63], [89, 43], [89, 63]], moves: [
    [8, 40, 88, 40, 'd', '30 s pour traverser'], [8, 60, 88, 60, 'd+', ''], [92, 40, 12, 40, 'd+', ''], [92, 60, 12, 60, 'd+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Rectangle de contrôles orientés', obj: 'Travailler le contrôle orienté',
  id: 'mc-rectangle-co', likes: 17, title: 'Contrôles orientés en rectangle', theme: 'Technique', phase: 'ballon', type: 'Exercice',
  players: [6, 6, 10], size: [12, 20], duration: 12, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Exercice Contrôles orientés Passes 2', 'Rodolphe Martins', 'US Lamorlaye'),
  goal: 'Passe et suit en rectangle : chaque receveur contrôle orienté vers le joueur suivant.',
  rules: [
    'Quatre coupelles en rectangle, un joueur par coupelle, deux aux départs de ballon.',
    'Passe au joueur d’en face ; il s’oriente d’un contrôle vers le suivant. On suit sa passe.',
    'Variante : un appui-remise-passe dans la course sur les petits côtés.',
    'Puis appui-remise sur tout le circuit.'
  ],
  coach: ['Demander le ballon en s’écartant de la coupelle.', 'Contrôle orienté vers le suivant.', 'Passe appuyée.'],
  posture: 'Au centre du rectangle : il corrige les contrôles.',
  expect: ['Contrôles orientés.', 'Deux touches.', 'Appui-remise sans faute.'],
  easier: 'Contrôle libre.', harder: 'Une touche sur les remises.',
  success: 'Le ballon circule sans arrêt.',
  layout: { discs: [[10, 15], [90, 15], [90, 85], [10, 85]], start: [10, 15], home: [[10, 15], [90, 15], [90, 85], [10, 85], [4, 15], [96, 85]], ball: [13, 18], balls: [[93, 82]], moves: [
    [13, 18, 87, 18, 'p', 'Passe'], [10, 15, 84, 20, 'c+', 'et suit'], [90, 15, 88, 30, 'd', 'Contrôle orienté'], [88, 30, 88, 82, 'p', 'Vers le suivant'],
    [93, 82, 13, 82, 'p+', 'Deuxième ballon en même temps']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: '5 contre 3 et mini-buts', obj: 'Conserver en supériorité',
  id: 'mc-5c3-minis', likes: 17, title: 'Conservation en supériorité', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [8, 8, 10], size: [20, 25], duration: 20, intensity: 3, defenders: 3,
  src: MYCOACH.src('Conservation en supériorité', 'Tony Montiel', 'Racing Club de France'),
  goal: 'Cinq conservent (10 passes = 1 point) ; trois récupèrent et marquent dans un des quatre mini-buts.',
  rules: [
    '5 bleus contre 3 rouges, quatre mini-buts autour de la zone.',
    'Bleus : 10 passes = 1 point.',
    'Rouges : récupérer et marquer dans un mini-but = 1 point.',
    'Variante : les bleus doivent faire 10 passes puis marquer dans un mini-but.'
  ],
  coach: ['Occuper tout l’espace, de façon équilibrée.', 'Prendre l’info avant de recevoir.', 'Défenseurs : couper les trajectoires, attaquer vite après la récupération.'],
  posture: 'Au bord de la zone : il compte les passes.',
  expect: ['10 passes.', '10 passes en deux touches.', '10 passes puis mini-but.'],
  easier: '6 contre 3.', harder: 'Deux touches.',
  success: 'La supériorité est bien utilisée.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'Récupérer en infériorité',
    posture: 'Au bord : il observe les trois rouges.', coach: ['Couper les lignes de passe.', 'Frapper vite au mini-but après la récupération.'],
    expect: ['Couper une passe.', 'Récupérer.', 'Marquer.'] }],
  layout: { minis: [[50, 1.5, 0], [98.5, 50, 90], [50, 98.5, 0], [1.5, 50, 90]], formations: () => [[14, 20], [86, 20], [86, 80], [14, 80], [50, 50]], formationsAway: () => [[36, 36], [64, 40], [44, 66]], ball: 'b1', script: [
    ['b1', 'b2', 'p', '1…'], ['b2', 'b5', 'p', '2…'], ['b5', 'b4', 'p', '3…'], ['b4', 'b3', 'p', '… 10 passes : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'ludique', sub: '2 contre 2 avec sources', name: '2 contre 2 avec sources', obj: 'Duels sans temps mort',
  id: 'mc-2c2-sources', likes: 17, title: '2 contre 2 avec sources de balle', theme: 'Ludique', phase: 'ballon', type: 'Jeu',
  players: [8, 8, 8], size: [10, 20], duration: 20, intensity: 4, defenders: 2, series: [60, 60],
  src: MYCOACH.src('2vs2 jeu réduit', 'Kevin Senas', 'Les Labourdins d’Ustaritz'),
  goal: '2 contre 2 sur 20 × 10, deux joueurs derrière chaque but relancent dès que le ballon sort.',
  rules: [
    '2 contre 2 au milieu, deux mini-buts.',
    'Deux joueurs derrière chaque but servent de sources de balle.',
    'Jeu libre, séquences d’1 minute.',
    'Dès que le ballon sort, une source remet en jeu tout de suite. On tourne.'
  ],
  coach: ['Pas de temps mort.', 'Attaquer à deux : une-deux, appel.', 'Défendre à deux : un presse, l’autre couvre.'],
  posture: 'Au bord : il chronomètre et fait tourner les rôles.',
  expect: ['Rester actif.', 'Marquer.', 'Gagner sa séquence.'],
  easier: 'Séquences de 45 s.', harder: 'But en une touche.',
  success: 'Des duels intenses du début à la fin.',
  also: [{ moment: 'physique', sub: '2 contre 2 avec sources', obj: 'Intensité en petit effectif', posture: 'Au bord : il chronomètre récupérations et séquences.',
    coach: ['À fond pendant la minute.', 'Récupération complète.'], expect: ['Tenir la minute.', 'Tenir toutes les séquences.', 'Garder la qualité.'] }],
  layout: { minis: [[1.5, 50, 90], [98.5, 50, 90]], supports: [[3, 20], [3, 80], [97, 20], [97, 80]], formations: () => [[30, 30], [36, 70]], formationsAway: () => [[64, 30], [70, 70]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Une-deux'], ['b2', [70, 56], 'd', ''], ['b2', 'butR', 's', 'But'], ['a3', 'r1', 'p', 'La source relance tout de suite']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Un contre un par zone', obj: 'Se démarquer et chercher le troisième homme',
  id: 'mc-1c1-zones', likes: 17, title: 'Jeu de position : un contre un par zone', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [12, 12, 12], size: [20, 20], duration: 20, intensity: 3,
  src: MYCOACH.src('JEU DE POSITION', 'Jordan Galtier', ''),
  goal: '4 contre 4, chacun dans sa zone face à son adversaire, avec deux jokers intérieurs et deux appuis extérieurs.',
  rules: [
    'Carré de 20 × 20 en quatre zones : un bleu contre un rouge par zone. Deux jokers libres au milieu (3 touches), deux appuis aux bouts (2 touches, inattaquables).',
    'Trois touches, jeu au sol. On conserve avec jokers et appuis.',
    'Après un nombre de passes, possibilité de marquer dans un mini-but (3 points).',
    'À la récupération, but en moins de 3 passes en une touche = 2 points, dans le sens opposé à la récupération.'
  ],
  coach: ['Se démarquer de son adversaire direct.', 'Créer des lignes de passe, chercher l’homme libre.', 'Anticiper la passe suivante.'],
  posture: 'Au bord du carré : il observe les démarquages.',
  expect: ['Se démarquer.', 'Trouver le troisième homme.', 'Marquer après la récupération en 3 passes.'],
  easier: 'Jokers en touches libres.', harder: 'Deux touches.',
  success: 'Des lignes de passe toujours ouvertes.',
  also: [{ moment: 'perd', sub: 'Zone 3 · Pressing', obj: 'Réagir à la perte en duel', posture: 'Au bord : il observe la réaction à la perte.',
    coach: ['Coller son adversaire direct à la perte.', 'Empêcher la passe vers l’avant.'], expect: ['Réagir vite.', 'Récupérer.', 'Récupérer et marquer.'] }],
  layout: { zones: [[0, 0, 50, 50, ''], [50, 0, 50, 50, ''], [0, 50, 50, 50, ''], [50, 50, 50, 50, '']], minis: [[50, 1.5, 0], [50, 98.5, 0]], supports: [[1, 50], [99, 50], [44, 50, 'J'], [56, 50, 'J']],
    formations: () => [[20, 20], [80, 20], [20, 80], [80, 80]], formationsAway: () => [[30, 30], [70, 30], [30, 70], [70, 70]], ball: 'a1', script: [
    ['a1', 'b1', 'p', 'Départ de l’appui'], ['b1', 'a3', 'p', 'Le joker'], ['a3', 'b4', 'p', 'Troisième homme'], ['b4', 'a2', 'p', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'ludique', sub: 'Tennis-ballon', name: 'Tennis-ballon', obj: 'Maîtrise du ballon en jeu',
  id: 'mc-tennis-ballon', likes: 17, title: 'Tennis-ballon', theme: 'Ludique', phase: 'ballon', type: 'Jeu',
  players: [6, 6, 8], size: [8, 26], duration: 20, intensity: 2,
  src: MYCOACH.src('tennis ballon', 'Régis Desnoues', 'CA La Guerche-sur-l’Aubois'),
  goal: 'Par équipes de 3, faire passer le ballon au-dessus du filet ; un rebond par camp, trois touches par équipe.',
  rules: [
    'Terrain de 10 à 16 m de long et 6 à 8 m de large par camp, filet à 1,50 m.',
    'Service de volée (à la main) ou en drop.',
    'Un rebond maximum par camp ; trois touches par équipe, par trois joueurs différents.',
    'Sets de 21 points, deux points d’écart. L’équipe qui gagne le point sert ; le serveur change à chaque service.'
  ],
  coach: ['Se placer avant que le ballon arrive.', 'Préparer pour le partenaire.', 'Viser l’espace libre adverse.'],
  posture: 'Au filet : il arbitre et compte les points.',
  expect: ['Renvoyer le ballon.', 'Utiliser les trois touches.', 'Gagner un set.'],
  easier: 'Deux rebonds autorisés.', harder: 'Aucun rebond.',
  success: 'Des échanges longs.',
  layout: { zones: [[49.5, 0, 1, 100, 'Filet']], formations: () => [[14, 30], [30, 70], [40, 30]], formationsAway: () => [[60, 30], [72, 70], [86, 30]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Première touche'], ['b2', 'b3', 'p', 'Deuxième'], ['b3', [76, 50], 'p', 'Par-dessus le filet']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', name: 'Ligne défensive cohérente', obj: 'Glisser et coulisser en bloc',
  id: 'mc-ligne-def', likes: 17, title: 'Bloc défensif cohérent', theme: 'Bloc', phase: 'sans', type: 'Jeu',
  players: [10, 12, 14], size: [64, 30], duration: 20, intensity: 3, defenders: f => Math.floor(f / 2) - 1,
  src: MYCOACH.src('Bloc défensif', 'Gary Lenzoni', 'Stade Nyonnais'),
  goal: 'La ligne défensive, en infériorité, glisse et coulisse pour fermer les espaces devant quatre mini-buts.',
  rules: [
    'Toute la largeur du terrain sur 25 à 30 m de profondeur. Quatre mini-buts derrière les rouges.',
    'Les bleus, plus nombreux, font circuler et cherchent l’appel entre deux défenseurs pour marquer.',
    'Quand un rouge sort presser, un autre comble l’espace dans son dos.',
    'À la récupération, les rouges ressortent sur un côté et marquent dans un des deux buts opposés.'
  ],
  coach: ['Glisser ensemble vers le ballon.', 'Celui qui sort est couvert.', 'Pas d’espace entre deux défenseurs.'],
  posture: 'Derrière la ligne rouge : il observe les distances entre défenseurs.',
  expect: ['Glisser ensemble.', 'Couvrir celui qui sort.', 'Récupérer et ressortir.'],
  easier: 'Égalité numérique.', harder: 'Deux joueurs de plus chez les bleus.',
  success: 'La ligne reste cohérente.',
  also: [{ moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', obj: 'Trouver la faille entre deux défenseurs',
    posture: 'Derrière les bleus : il observe la circulation.', coach: ['Écarter pour étirer la ligne.', 'Appel entre deux défenseurs.'],
    expect: ['Étirer la ligne.', 'Trouver l’appel.', 'Marquer.'] }],
  layout: { minis: [[98.5, 15, 90], [98.5, 38, 90], [98.5, 62, 90], [98.5, 85, 90], [1.5, 10, 90], [1.5, 90, 90]],
    formations: n => MYCOACH.grid(n, 30, 10, 60, 90), formationsAway: n => Array.from({ length: n }, (_, i) => [78, Math.round(14 + 72 * (i + .5) / n)]), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Circulation'], ['r2', [70, 30], 'c+', 'Un rouge sort'], ['r3', [78, 34], 'c+', 'Le voisin comble l’espace'], ['b2', 'b4', 'p', 'Le jeu change de côté']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Passe longue et finition', obj: 'Maîtriser la passe et finir en une touche',
  id: 'mc-passe-longue-finition', likes: 16, title: 'Maîtrise de la passe et finition', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [4, 6, 12], size: [40, 50], duration: 15, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('MAÎTRISE DE LA PASSE ET FINITION', 'Pierre Beaudi', 'FC de Guignes'),
  goal: 'Deux joueurs se font des passes entre les plots ; le dernier envoie une passe longue au côté et sprinte finir le centre.',
  rules: [
    'Deux joueurs partent ensemble et se passent le ballon entre les plots.',
    'Celui qui reçoit au dernier plot fait une passe longue entre les piquets, à l’opposé.',
    'Il sprinte vers la zone de finition.',
    'Le centre doit arriver dans cette zone ; finition en une touche.'
  ],
  coach: ['Passes courtes précises en mouvement.', 'Passe longue tendue.', 'Arriver lancé dans la zone.'],
  posture: 'À la zone de finition : il juge la qualité du centre.',
  expect: ['Passe longue réussie.', 'Centre dans la zone.', 'But en une touche.'],
  easier: 'Contrôle avant la frappe.', harder: 'Un défenseur dans la zone.',
  success: 'Des centres dans la zone, des reprises en une touche.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, zones: [[78, 36, 12, 28, 'Finition']], cones: [[20, 40], [30, 60], [40, 40], [60, 4], [70, 4]],
    start: [10, 50], home: [[10, 50], [18, 60], [66, 10]], ball: [13, 53], moves: [
    [13, 53, 20, 58, 'p', 'Passes entre les plots'], [18, 60, 36, 44, 'p', ''], [10, 50, 38, 42, 'c+', ''],
    [38, 42, 66, 10, 'p', 'Passe longue au côté'], [38, 42, 82, 48, 'c+', 'Sprint vers la zone'],
    [66, 10, 82, 48, 'p', 'Centre'], [82, 48, 98, 48, 's', 'Reprise en une touche']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Vitesse', template: 'circuit', moment: 'physique', sub: 'Demi-tour explosif', name: 'Demi-tour explosif', obj: 'Se retourner et exploser',
  id: 'mc-demi-tour', likes: 16, title: 'Travail d’explosivité', theme: 'Physique', phase: 'sans', type: 'Exercice',
  players: [2, 2, 12], size: [12, 12], duration: 5, intensity: 4, series: [4, 45], params: { unit: 'joueurs' },
  src: MYCOACH.src('Travail d’explosivité', 'Teddy Becue', 'Av. Courtenay'),
  goal: 'Deux joueurs dos aux portes ; à la couleur annoncée, demi-tour et sprint pour franchir la bonne porte.',
  rules: [
    'Deux joueurs à 30-40 cm l’un de l’autre, dos aux trois portes de couleur, à 12 m.',
    'Le coach annonce une couleur : demi-tour et sprint jusqu’à la porte de cette couleur.',
    '5 passages chacun, récupération complète.',
    'Variantes : départ assis, départ en planche, changement de porte en cours de course.'
  ],
  coach: ['Interdit de regarder les portes avant le signal.', 'Demi-tour en un appui.', 'Premiers pas courts et puissants.'],
  posture: 'Derrière les portes, face aux joueurs : il annonce la couleur.',
  expect: ['Bonne porte.', 'Gagner son duel.', 'Gagner depuis un départ au sol.'],
  easier: 'Départ de face.', harder: 'Changement de porte annoncé en cours de course.',
  success: 'Des départs explosifs.',
  layout: { discs: [[96, 15], [96, 30], [96, 43], [96, 57], [96, 70], [96, 85]], start: [10, 47], home: [[10, 47], [10, 53]], moves: [
    [10, 47, 94, 22, 'c', '« Bleu » : demi-tour et sprint'], [10, 53, 90, 30, 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Centre en retrait', obj: 'Chercher le centre en retrait',
  id: 'mc-centre-retrait', likes: 14, title: 'Centre en retrait', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [4, 8, 16], size: [35, 40], duration: 20, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Centre en Retrait', 'Gary Lenzoni', 'Stade Nyonnais'),
  goal: 'Le côté contrôle vers l’avant et remet en retrait pour le partenaire qui a suivi.',
  rules: [
    'Deux colonnes : A dans l’axe, B sur le côté.',
    'A conduit et passe entre deux plots, puis sert B dans sa course.',
    'B contrôle vers l’avant et centre en retrait avant les plots de fond.',
    'A frappe en deux touches maximum. Troisième colonne pour travailler l’autre côté.'
  ],
  coach: ['Contrôle orienté vers l’avant, en pleine course.', 'Centre au sol, en arrière du point de penalty.', 'A freine pour se rendre disponible en retrait.'],
  posture: 'Au point de penalty : il voit le contrôle de B et l’arrivée de A.',
  expect: ['Centre en retrait au sol.', 'Frappe en deux touches.', 'Frappe en une touche.'],
  easier: 'B a trois touches.', harder: 'Un défenseur gêne A.',
  success: 'A frappe face au but sur chaque centre.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[52, 44], [52, 56], [88, 6], [88, 18]], start: [36, 50], home: [[36, 50], [46, 12]], ball: [39, 53], moves: [
    [36, 50, 56, 50, 'd', 'A conduit entre les plots'],
    [46, 12, 70, 12, 'c+', 'B part'], [59, 53, 72, 14, 'p', 'Passe dans la course'],
    [70, 12, 84, 12, 'd', 'Contrôle vers l’avant'],
    [56, 50, 76, 50, 'c+', 'A suit en retrait'],
    [86, 15, 76, 50, 'p', 'Centre en retrait'], [76, 50, 98, 46, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'perd', sub: 'Zone 3 · Pressing', name: 'Défenseurs de plus en plus nombreux', obj: 'Réagir et s’organiser à la perte',
  id: 'mc-entrer-un-par-un', likes: 16, title: 'Transition : un défenseur de plus toutes les 5 passes', theme: 'Transition', phase: 'transition', type: 'Jeu',
  players: [10, 10, 10], size: [30, 30], duration: 15, intensity: 4, defenders: 1,
  src: MYCOACH.src('Transition off/def', 'Louis Desbourdieux', 'FC Marmande 47'),
  goal: 'Deux équipes de 5 : toutes les 5 passes, un défenseur de plus entre. À la récupération, les rôles s’inversent.',
  rules: [
    'Les bleus conservent à 5 contre 1 rouge ; les autres rouges attendent au bord.',
    'Toutes les 5 passes réussies, un rouge de plus entre : 5 contre 2, 5 contre 3, jusqu’à 5 contre 4.',
    'Ballon sorti ou récupéré et transmis à un partenaire : les rouges passent en possession.',
    'Un bleu entre alors pour défendre, les autres attendent.'
  ],
  coach: ['À la perte, le plus proche presse tout de suite.', 'Attaquants : profiter de la supériorité avant l’arrivée du suivant.', 'Changer de statut immédiatement.'],
  posture: 'Au bord du carré : il fait entrer les défenseurs toutes les 5 passes.',
  expect: ['5 passes.', '10 passes.', 'Récupérer et transmettre.'],
  easier: 'Un défenseur toutes les 8 passes.', harder: 'Un défenseur toutes les 3 passes.',
  success: 'Transitions rapides à chaque perte.',
  also: [{ moment: 'recupere', sub: 'Zone 1 · Jouer vers l’avant', obj: 'Garder le ballon après la récupération',
    posture: 'Au bord : il observe la première passe après récupération.', coach: ['Transmettre tout de suite à un partenaire.', 'S’écarter pour offrir des solutions.'],
    expect: ['Transmettre.', 'Faire 5 passes.', 'Faire 10 passes.'] }],
  layout: { formations: n => MYCOACH.grid(n, 10, 10, 86, 90), formationsAway: () => [[50, 50]], supports: [[98, 20, 'R'], [98, 40, 'R'], [98, 60, 'R'], [98, 80, 'R']], ball: 'b1', script: [
    ['b1', 'b2', 'p', '5 contre 1'], ['b2', 'b4', 'p', ''], ['a1', [80, 22], 'c+', '5 passes : un rouge de plus entre'], ['b4', 'b5', 'p', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Conserver 20 s puis frapper en 10 s', obj: 'Conserver pour progresser vers l’avant',
  id: 'mc-conserver-progresser', likes: 15, title: 'Situation : conserver puis progresser', theme: 'Progression', phase: 'ballon', type: 'Situation',
  players: [12, 14, 14], size: [50, 64], duration: 20, intensity: 3,
  src: MYCOACH.src('SITUATION CONSERVER / PROGRESSER', 'Maxime Gaillac', 'JS Bassin Aveyron'),
  goal: 'Les bleus conservent 20 secondes sur trois zones, puis se projettent et frappent en 10 secondes.',
  rules: [
    'Trois zones. Les bleus attaquent le but et occupent les trois ; les rouges défendent sur deux zones seulement.',
    'Bleus : conserver 20 secondes, puis frapper en moins de 10 secondes. Hors-jeu à la surface.',
    'Rouges : empêcher la progression, récupérer et relancer au-delà de la ligne médiane en 10 secondes.',
    'Variantes : un rouge peut presser dans la troisième zone ; un bleu peut sortir de sa zone.'
  ],
  coach: ['Être une solution en permanence.', 'Éviter les passes latérales inutiles.', 'Rouges : couper les intervalles, recul-frein.'],
  posture: 'Sur la touche : il chronomètre les 20 puis les 10 secondes.',
  expect: ['Conserver 20 secondes.', 'Frapper en 10 secondes.', 'Marquer.'],
  easier: 'Conserver 15 secondes.', harder: 'Frapper en 8 secondes.',
  success: 'La conservation sert à progresser.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'Empêcher la progression',
    posture: 'Derrière la défense : il observe le bloc rouge.', coach: ['Couper les intervalles.', 'Jouer le hors-jeu.'],
    expect: ['Empêcher la progression.', 'Récupérer.', 'Relancer en 10 secondes.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[33, 0, .01, 100, ''], [66, 0, .01, 100, '']],
    formations: n => [[14, 30], [14, 70], [28, 50], [44, 20], [44, 80], [54, 50], [74, 50]].slice(0, n), formationsAway: n => [[86, 30], [86, 70], [80, 50], [62, 30], [62, 70], [50, 40]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b3', 'p', 'Conservation 20 secondes'], ['b3', 'b2', 'p', ''], ['b2', 'b5', 'p', 'On se projette'], ['b7', [86, 60], 'c+', ''], ['b5', 'b7', 'p', ''], ['b7', 'butR', 's', 'Frappe en 10 secondes']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'ludique', sub: 'Duel de la tête', name: 'Duel de la tête', obj: 'Travailler le jeu de tête',
  id: 'mc-jeu-tete', likes: 15, title: 'Jeu de tête en montée-descente', theme: 'Jeu de tête', phase: 'ballon', type: 'Jeu',
  players: [2, 2, 2], size: [5, 8], duration: 15, intensity: 2,
  src: MYCOACH.src('Jeu de tête', 'Ambroise Courtogit', 'ES Azé'),
  goal: '1 contre 1 de la tête uniquement : faire passer le ballon entre les jalons adverses sans rebond.',
  rules: [
    'Terrain de 5 × 8 m, deux jalons de chaque côté.',
    'Jeu uniquement de la tête ; point marqué quand le ballon passe entre les jalons sans rebond.',
    'Ballon au sol : on reprend le jeu.',
    'Matchs de 2 minutes en montée-descente.'
  ],
  coach: ['Frapper avec le front, yeux ouverts.', 'Gainage et mouvement du buste.', 'Diriger vers le bas.'],
  posture: 'Au terrain du haut : il chronomètre les matchs.',
  expect: ['Frapper du front.', 'Diriger sa tête.', 'Gagner son match.'],
  easier: 'Lancer à la main avant chaque tête.', harder: 'Jalons plus serrés.',
  success: 'Des têtes propres et dirigées.',
  layout: { cones: [[1, 35], [1, 65], [99, 35], [99, 65]], formations: () => [[25, 50]], formationsAway: () => [[75, 50]], ball: 'b1', script: [
    ['b1', 'r1', 'p', 'Tête'], ['r1', 'b1', 'p', 'Retour de la tête'], ['b1', [99, 50], 'p', 'Entre les jalons : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Trois zones et jokers', obj: 'Jouer dans les intervalles',
  id: 'mc-trois-zones-jokers', likes: 15, title: 'Jeu dans les intervalles, cadrage et couverture', theme: 'Progression', phase: 'ballon', type: 'Jeu',
  players: [15, 15, 15], size: [40, 50], duration: 20, intensity: 3,
  src: MYCOACH.src('OFF jeu dans les intervalles DEF cadrage et couverture dans un 4-3-3', 'Johan Roubault', 'AS Aix-en-Provence'),
  goal: '6 contre 6 + 3 jokers, trois zones dans la longueur, chacun reste dans la sienne : faire traverser les trois zones.',
  rules: [
    'Trois zones dans la longueur, chaque joueur à son poste dans sa zone. Un joker par zone joue avec l’équipe qui a le ballon.',
    'Jeu au sol obligatoire. 1 point = ballon passé par les trois zones.',
    'Variantes : contrôle obligatoire (pour travailler cadrage et couverture), nombre de jokers.',
    'Pour les défenseurs : un nombre de passes à la récupération, ou stop-ball / mini-buts pour travailler les transitions.'
  ],
  coach: ['Se placer dans l’intervalle entre deux adversaires.', 'Recevoir orienté vers la zone suivante.', 'Défense : un cadre, l’autre couvre.'],
  posture: 'Sur la touche : il montre les intervalles.',
  expect: ['Passer une zone.', 'Traverser les trois.', 'Traverser en moins de 6 passes.'],
  easier: 'Deux jokers par zone.', harder: 'Sans joker.',
  success: 'Le ballon passe par les intervalles.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'Cadrer et couvrir dans sa zone',
    posture: 'Sur la touche : il observe les binômes cadreur-couvreur.', coach: ['Cadrer le porteur.', 'Couvrir l’intervalle.'],
    expect: ['Cadrer.', 'Couvrir.', 'Récupérer.'] }],
  layout: { zones: [[33.3, 0, .01, 100, ''], [66.6, 0, .01, 100, '']], supports: [[16, 50, 'J'], [50, 50, 'J'], [84, 50, 'J']],
    formations: () => [[12, 25], [12, 75], [44, 25], [44, 75], [76, 25], [76, 75]], formationsAway: () => [[24, 30], [24, 70], [56, 30], [56, 70], [90, 30], [90, 70]], ball: 'b1', script: [
    ['b1', 'a1', 'p', 'Zone 1'], ['a1', 'b3', 'p', 'Passe dans l’intervalle'], ['b3', 'a2', 'p', ''], ['a2', 'b6', 'p', 'Zone 3 : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Remises par trois', obj: 'Mise en train : remises au pied',
  id: 'mc-remises-trois', likes: 15, title: 'Échauffement avec ballon par trois', theme: 'Technique', phase: 'ballon', type: 'Exercice',
  players: [3, 3, 12], size: [8, 18], duration: 15, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('échauffement avec ballon par 3', 'Tristan Avenia', 'FC Hermée'),
  goal: 'Le joueur du milieu va d’un plot à l’autre et remet le ballon que lui donnent les deux servants.',
  rules: [
    'Par trois : B et C aux deux bouts avec un ballon chacun, A au milieu.',
    'A va au plot de B, reçoit au pied et remet ; puis il file au plot de C et fait la même chose.',
    'Variante : B et C servent à la main à mi-hauteur, remises intérieur pied gauche et droit, puis de la tête.',
    'Après 5 minutes, on change le joueur du milieu.'
  ],
  coach: ['Les servants donnent des ballons justes.', 'A s’applique sur chaque remise.', 'Appuis vifs entre les plots.'],
  posture: 'Entre les groupes : il change les consignes.',
  expect: ['Remises justes.', 'Remises des deux pieds.', 'Remises de la tête.'],
  easier: 'Plots plus proches.', harder: 'Remises en une touche, rythme élevé.',
  success: 'Beaucoup de touches de balle, peu d’erreurs.',
  layout: { cones: [[30, 50], [70, 50]], start: [50, 50], home: [[50, 50], [6, 50], [94, 50]], ball: [9, 53], balls: [[91, 53]], moves: [
    [50, 50, 32, 50, 'c', 'A va au plot'], [9, 53, 30, 52, 'p', 'B donne'], [30, 52, 10, 52, 'p', 'Remise'],
    [32, 50, 68, 50, 'c', 'A file de l’autre côté'], [91, 53, 70, 52, 'p', 'C donne'], [70, 52, 90, 52, 'p', 'Remise']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'echauffement', sub: 'Mise en route', name: 'Toro aux cages', obj: 'Passer le ballon entre les poteaux',
  id: 'mc-toro-cages', likes: 15, title: 'Toro avec cages', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [8, 8, 10], size: [14, 14], duration: 15, intensity: 2, defenders: 2,
  src: MYCOACH.src('Toro avec cages', 'Luca D’Athis', 'Jacou Clapiers FA'),
  goal: 'Quatre poteaux en carré au centre : les attaquants autour font passer le ballon à travers le carré, deux défenseurs le protègent.',
  rules: [
    'Un carré de 2 m formé par quatre poteaux au centre d’un rond : chaque côté est une cage.',
    'Les attaquants, autour, se passent le ballon et cherchent à le faire traverser le carré, à ras de terre, vers un partenaire en face.',
    'Deux défenseurs protègent les quatre cages.',
    'Duo de défenseurs changé toutes les 2 minutes ; le duo qui encaisse le plus range le matériel.'
  ],
  coach: ['Déplacer le ballon vite pour ouvrir une cage.', 'Passe à ras de terre.', 'Défenseurs : communiquer, se répartir les cages.'],
  posture: 'Au bord du rond : il compte les points.',
  expect: ['Faire traverser.', '5 points en 2 minutes.', 'Défendre : moins de 3 points encaissés.'],
  easier: 'Carré plus grand.', harder: 'Deux touches.',
  success: 'En moyenne 5 points en 2 minutes.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'Protéger l’axe à deux',
    posture: 'Au bord du rond : il observe le duo défensif.', coach: ['Se répartir les cages.', 'Fermer la cage côté ballon.'],
    expect: ['Fermer une cage.', 'Encaisser peu.', 'Intercepter.'] }],
  layout: { cones: [[44, 44], [56, 44], [44, 56], [56, 56]], formations: n => Array.from({ length: n }, (_, i) => { const a = (i / n) * 2 * Math.PI; return [Math.round(50 + 42 * Math.cos(a)), Math.round(50 + 42 * Math.sin(a))]; }),
    formationsAway: () => [[36, 50], [64, 50]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Circulation'], ['b2', 'b6', 'p', 'Le ballon traverse le carré : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'recupere', sub: 'Zone 3 / Box · Marquer le but', name: 'Marquer vite après la récupération', obj: 'Marquer en 4 ou 7 secondes',
  id: 'mc-transition-chrono', likes: 14, title: 'Jeu de transition chronométré', theme: 'Transition offensive', phase: 'transition', type: 'Jeu',
  players: [14, 18, 20], size: [40, 70], duration: 30, intensity: 3,
  src: MYCOACH.src('jeu transition', 'Joachim Merry', 'Lille'),
  goal: 'Match sur la largeur de la surface : un but marqué vite après la récupération vaut 3 points.',
  rules: [
    'Match libre sur la largeur de la surface, hors-jeu à la médiane.',
    'Récupération dans sa moitié (zone basse) puis but en moins de 7 secondes = 3 points.',
    'Récupération dans la moitié adverse (zone haute) puis but en moins de 4 secondes = 3 points.',
    'Autre but = 1 point.'
  ],
  coach: ['Regarder devant dès la récupération.', 'Première passe vers l’avant si possible.', 'Des joueurs partent tout de suite en profondeur.'],
  posture: 'Sur la touche, à la médiane : il compte les secondes après chaque récupération.',
  expect: ['Attaquer vite.', 'Marquer en 7 secondes.', 'Marquer en 4 secondes après une récupération haute.'],
  easier: '10 et 6 secondes.', harder: '6 et 3 secondes.',
  success: 'Des buts de transition.',
  also: [{ moment: 'perd', sub: 'Zone 2 · Freiner l’attaque', obj: 'Freiner le contre',
    posture: 'Derrière un but : il observe l’équipe qui perd le ballon.', coach: ['Freiner le porteur.', 'Repasser derrière le ballon.'],
    expect: ['Freiner.', 'Empêcher le but rapide.', 'Récupérer.'] }],
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[50, 0, .01, 100, '']], formations: n => [[16, 30], [16, 70], [30, 50], [40, 25], [40, 75], [46, 50], [44, 12], [44, 88]].slice(0, n), ball: 'r3', script: [
    ['r3', 'r4', 'p', 'Attaque rouge'], ['b5', [56, 70], 'c+', ''], ['r4', 'b5', 'p', 'Récupération haute'], ['b6', [80, 46], 'c+', 'Appel tout de suite'], ['b5', 'b6', 'p', ''], ['b6', 'butR', 's', 'But en moins de 4 secondes : 3 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: '4 contre 2 sans dribble', obj: 'Déséquilibrer par la passe',
  id: 'mc-4c2-passe', likes: 14, title: 'Progresser par la passe en supériorité', theme: 'Finition', phase: 'ballon', type: 'Situation',
  players: [7, 7, 9], size: [15, 25], duration: 25, intensity: 3, defenders: 2,
  src: MYCOACH.src('Progresser par la passe en supériorité numérique', 'Tristan Messin', 'Athletic Club Augny'),
  goal: 'Quatre attaquants contre deux défenseurs et un gardien : marquer sans dribbler, seulement par la passe.',
  rules: [
    '4 attaquants contre 2 défenseurs + gardien, sur 25 × 15.',
    'Attaquants : interdit d’éliminer en dribble, seulement par la passe.',
    'Défenseurs : récupérer = 1 point ; récupérer puis marquer dans un des petits buts = 3 points.',
    'Variante : touches limitées.'
  ],
  coach: ['Utiliser toute la largeur et la profondeur.', 'Être patient dans la construction.', 'Un appui pour dédoubler ou proposer dans la profondeur.'],
  posture: 'Derrière les attaquants : il valorise la patience.',
  expect: ['Frapper.', 'Marquer.', 'Marquer en deux touches.'],
  easier: '5 contre 2.', harder: 'Deux touches.',
  success: 'Des buts construits par la passe.',
  also: [{ moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', obj: 'Défendre à deux en infériorité',
    posture: 'Derrière le but : il observe les deux défenseurs.', coach: ['Fermer l’axe.', 'Couper la passe vers le joueur le plus dangereux.'],
    expect: ['Retarder.', 'Récupérer.', 'Marquer dans un petit but.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], minis: [[1.5, 25, 90], [1.5, 75, 90]], formations: () => [[30, 50], [50, 18], [50, 82], [64, 50]], formationsAway: () => [[78, 38], [78, 62]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Circulation'], ['b4', [82, 70], 'c+', 'Appel dans la profondeur'], ['b2', 'b3', 'p', ''], ['b3', 'b4', 'p', ''], ['b4', 'butR', 's', 'But par la passe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'ludique', sub: 'Têtes et gardien tournant', name: 'Têtes et gardien tournant', obj: 'Finir de la tête devant le but',
  id: 'mc-tete-gardien', likes: 14, title: 'Jeu de tête en zone de finition', theme: 'Jeu de tête', phase: 'ballon', type: 'Jeu',
  players: [6, 8, 12], size: [12, 15], duration: 6, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Jeu ludique pour le jeu de tête en zone de finition', 'Jimmy Soppo', 'Soas Robertsau'),
  goal: 'Deux colonnes : on marque de la tête, puis on devient gardien face à l’autre colonne.',
  rules: [
    'Deux colonnes (deux équipes), deux passeurs, un but à 5 m.',
    'Le passeur lance à la main pour une tête vers le but, défendu par un joueur.',
    'Celui qui vient de tirer de la tête devient gardien face au joueur de l’autre colonne.',
    'Compter les buts par équipe.'
  ],
  coach: ['Attaquer le ballon, front ouvert.', 'Diriger vers le sol.', 'Gardien : rester sur ses appuis.'],
  posture: 'À côté du but : il compte les points.',
  expect: ['Cadrer de la tête.', 'Marquer.', 'Gagner avec son équipe.'],
  easier: 'Lancers plus courts.', harder: 'Ballons centrés au pied.',
  success: 'Des têtes dirigées vers le bas.',
  also: [{ moment: 'possede', sub: 'Zone 3 / Box · Finition', obj: 'Marquer de la tête', posture: 'À côté du but : il corrige le geste.',
    coach: ['Front, yeux ouverts.', 'Gainage.'], expect: ['Cadrer.', 'Diriger vers le bas.', 'Marquer.'] }],
  layout: { goals: [[98.5, 50, 90]], start: [30, 30], home: [[30, 30], [30, 70], [70, 10], [70, 90], [94, 50]], ball: [73, 13], moves: [
    [73, 13, 70, 34, 'p', 'Lancer à la main'], [30, 30, 68, 36, 'c+', ''], [70, 34, 98, 46, 's', 'Tête'], [70, 36, 92, 48, 'c', 'Le tireur devient gardien']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'perd', sub: 'Zone 2 · Freiner l’attaque', name: 'Reformer le bloc', obj: 'Se replacer à la perte, défendre en zone',
  id: 'mc-reformer-bloc', likes: 14, title: 'Reformer le bloc équipe', theme: 'Bloc', phase: 'transition', type: 'Jeu',
  players: [18, 20, 22], size: [50, 70], duration: 30, intensity: 3,
  src: MYCOACH.src('Reformer le bloc équipe - J14', 'Johan Roubault', 'AS Aix-en-Provence'),
  goal: '10 contre 10 en 4-2-3, terrain en trois zones : le but vaut plus si l’équipe a progressé de zone en zone.',
  rules: [
    '10 contre 10 (4-2-3 + gardien) sur 70 × 50, trois zones dans la profondeur. Hors-jeu en zone offensive.',
    'But sans avoir progressé d’une zone = 1 point.',
    'But après avoir progressé d’une zone = 2 points ; de deux zones = 3 points.',
    'Sans ballon : empêcher l’adversaire de progresser, se replacer à la perte.'
  ],
  coach: ['À la perte, tout le monde se replace derrière le ballon.', 'Bloc court entre les lignes.', 'Défendre en zone, pas en individuel.'],
  posture: 'Sur la touche, à hauteur de la zone médiane : il compte les zones franchies.',
  expect: ['Se replacer vite.', 'Empêcher la progression.', 'Ne pas encaisser de but à 3 points.'],
  easier: 'Deux zones seulement.', harder: 'But à 3 points = 5 points.',
  success: 'Le bloc se reforme à chaque perte.',
  also: [{ moment: 'possede', sub: 'Zone 1 · Construire le jeu', obj: 'Progresser zone par zone',
    posture: 'Sur la touche : il observe la progression.', coach: ['Progresser sans forcer.', 'Chercher l’homme entre les lignes.'],
    expect: ['Passer une zone.', 'Passer deux zones.', 'Marquer 3 points.'] }],
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[33.3, 0, .01, 100, ''], [66.6, 0, .01, 100, '']],
    formations: n => [[16, 15], [14, 38], [14, 62], [16, 85], [30, 35], [30, 65], [44, 15], [46, 50], [44, 85]].slice(0, n), ball: 'b6', script: [
    ['b6', 'b8', 'p', 'Attaque bleue'], ['b8', 'r6', 'p', 'Perte du ballon'], ['b', -12, 'bloc+', 'Tout le bloc se replace'], ['r6', 'r8', 'p', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Centre depuis le couloir', obj: 'Marquer sur un centre',
  id: 'mc-centre-couloir', likes: 110, title: 'Situation centre et finition', theme: 'Finition', phase: 'ballon', type: 'Situation',
  players: [10, 10, 12], size: [50, 50], duration: 15, intensity: 3,
  src: MYCOACH.src('SITUATION / CENTRE - FINITION', 'Maxime Gaillac', 'JS Bassin Aveyron'),
  goal: 'Les bleus doivent marquer sur un centre venu d’un couloir ; les rouges défendent l’axe et ressortent par une porte.',
  rules: [
    'Demi-terrain, deux couloirs. Les bleus y sont inattaquables, 5 secondes maximum.',
    'Bleus : but seulement sur un centre venu d’un couloir. Hors-jeu à la surface.',
    'Rouges : défendre l’axe ballon-but ; à la récupération, passer dans une porte = 1 point.',
    'Variantes : un défenseur peut entrer dans le couloir ; l’ailier peut rentrer et frapper en moins de 5 secondes.'
  ],
  coach: ['Écarter vite vers le couloir.', 'Trois zones d’arrivée sur le centre.', 'Valoriser à voix haute la réussite offensive et défensive.'],
  posture: 'Sur le côté, à hauteur de la surface : il corrige les choix de finition et compte les 5 secondes.',
  expect: ['Centrer depuis le couloir.', 'Reprendre cadré.', 'Marquer sur centre.'],
  easier: '8 secondes dans le couloir.', harder: 'Un défenseur peut entrer dans le couloir.',
  success: 'Des centres exploités, des défenseurs qui ferment l’axe.',
  also: [{ moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', obj: 'Défendre les centres',
    posture: 'Derrière le but : il observe le placement des défenseurs sur les centres.',
    coach: ['Rester entre le ballon et le but.', 'Prendre le premier poteau.'],
    expect: ['Couper l’axe.', 'Gagner le ballon sur un centre.', 'Ressortir par une porte.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[30, 0, 70, 16, 'Couloir'], [30, 84, 70, 16, 'Couloir']], cones: [[2, 20], [2, 34], [2, 66], [2, 80]],
    formations: n => [[34, 50], [50, 32], [50, 68], [62, 8], [62, 92], [70, 50]].slice(0, n), formationsAway: n => [[86, 36], [86, 64], [76, 50], [70, 30], [70, 70]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Circulation'], ['b2', 'b4', 'p', 'Passe dans le couloir'],
    ['b4', [82, 8], 'd', 'Inattaquable, 5 secondes'],
    ['b6', [88, 42], 'c+', 'Premier poteau'], ['b5', [86, 66], 'c+', 'Second poteau'],
    ['b4', 'b6', 'p', 'Centre'], ['b6', 'butR', 's', 'But sur centre']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Trouver le joker dans l’intervalle', obj: 'Jouer dans l’intervalle',
  id: 'mc-joker-intervalle', likes: 14, title: 'Conservation et jeu dans les intervalles', theme: 'Passe', phase: 'ballon', type: 'Jeu',
  players: [10, 10, 13], size: [20, 30], duration: 30, intensity: 2, defenders: 3,
  src: MYCOACH.src('Forme jouée : conservation et jeu dans les intervalles', 'Christophe Marchat', 'ES Douvaine-Loisin'),
  goal: 'Deux équipes de 3 autour du rectangle cherchent le joker à travers les trois défenseurs du milieu.',
  rules: [
    'Rectangle de 30 × 20 : deux équipes de 3 (même couleur) autour, une équipe de 3 dedans, un joker libre dedans.',
    'Les joueurs extérieurs se passent le ballon latéralement en 1-2 touches.',
    'Ils cherchent la passe dans l’intervalle pour le joker ; le joker décide de l’orientation du jeu.',
    'Pas de marquage individuel sur le joker. On tourne les équipes.'
  ],
  coach: ['Déplacer le ballon pour ouvrir l’intervalle.', 'Le joker communique où il veut le ballon.', 'Défenseurs : rester entre ballon et joker.'],
  posture: 'Au bord du rectangle : il valorise les passes dans l’intervalle.',
  expect: ['Trouver le joker.', 'Le joker renverse.', 'Trouver le joker en deux passes.'],
  easier: 'Deux touches.', harder: 'Une touche pour les extérieurs.',
  success: 'Le joker reçoit souvent.',
  layout: { supports: [[50, 50, 'J']], formations: n => [[10, 4], [50, 4], [90, 4], [10, 96], [50, 96], [90, 96]].slice(0, n), formationsAway: () => [[30, 40], [50, 32], [70, 40]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Passe latérale'], ['b2', 'b3', 'p', ''], ['b3', 'a1', 'p', 'Passe dans l’intervalle'], ['a1', 'b5', 'p', 'Le joker oriente le jeu']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Jouer de l’autre côté', obj: 'Recevoir d’un côté et jouer de l’autre',
  id: 'mc-renversements', likes: 14, title: 'Renversements', theme: 'Renversement', phase: 'ballon', type: 'Jeu',
  players: [16, 16, 18], size: [50, 60], duration: 20, intensity: 3,
  src: MYCOACH.src('Renversements', 'Sébastien Languille', 'US Moyenne Durance'),
  goal: 'Interdit de rejouer du côté où l’on reçoit : il faut renverser. Deux jokers fixes dans les couloirs.',
  rules: [
    'Match sur 60 × 50 avec deux buts. Deux jokers fixes dans les couloirs, deux touches maximum.',
    'Interdit de jouer du côté où l’on reçoit le ballon (sauf les jokers).',
    'But = 1 point ; but après avoir touché les deux jokers = 3 points.',
    'Variante : 3 touches maximum.'
  ],
  coach: ['Prendre l’info avant de recevoir : où est l’autre côté ?', 'Corps ouvert pour renverser.', 'Intensité dans les déplacements.'],
  posture: 'Sur la touche : il siffle les passes jouées du mauvais côté.',
  expect: ['Renverser.', 'Toucher les deux jokers.', 'Marquer 3 points.'],
  easier: 'Pas d’interdiction pour les défenseurs.', harder: 'Deux touches pour tous.',
  success: 'Le jeu change de côté en permanence.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[0, 0, 100, 14, 'Couloir'], [0, 86, 100, 14, 'Couloir']], supports: [[50, 6, 'J'], [50, 94, 'J']],
    formations: n => [[18, 30], [18, 70], [32, 50], [44, 28], [44, 72], [52, 50], [60, 35]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b4', 'p', 'Reçu à gauche'], ['b4', 'b5', 'p', 'On joue à droite'], ['b5', 'a2', 'p', 'Joker 2'], ['a2', 'b6', 'p', ''], ['b6', 'a1', 'p', 'Joker 1'], ['a1', 'b7', 'p', ''], ['b7', 'butR', 's', 'But après les deux jokers : 3 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'recupere', sub: 'Zone 1 · Jouer vers l’avant', name: 'Changer de zone avec les jokers', obj: 'Sortir le ballon de la zone de récupération',
  id: 'mc-deux-zones-jokers', likes: 13, title: 'Conservation et transition offensive', theme: 'Transition offensive', phase: 'transition', type: 'Jeu',
  players: [11, 11, 13], size: [30, 50], duration: 25, intensity: 3,
  src: MYCOACH.src('Conservation du ballon et transition offensive', 'Julien Saint Jalmes', 'Stade Hennebontais'),
  goal: 'Deux zones : 8 à 10 passes avec trois jokers sur les côtés, puis on envoie le ballon dans l’autre zone.',
  rules: [
    'Deux zones. 4 contre 4 dans une zone, trois jokers sur les côtés jouent avec l’équipe qui a le ballon.',
    '8 à 10 passes = 1 point, puis envoyer le ballon dans l’autre zone et recommencer.',
    'À la récupération : sortir immédiatement le ballon dans l’autre zone pour marquer 1 point.',
    'Tout le monde suit le ballon dans la nouvelle zone.'
  ],
  coach: ['Voir avant de recevoir, jouer simple.', 'Receveur en mouvement, orienté pour voir un maximum de partenaires.', 'À la récupération : sortir le ballon de la zone tout de suite.'],
  posture: 'Entre les deux zones : il compte les passes.',
  expect: ['8 passes.', 'Changer de zone.', 'Sortir le ballon dès la récupération.'],
  easier: '6 passes.', harder: 'Deux touches.',
  success: 'Le ballon quitte vite la zone de récupération.',
  also: [{ moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', obj: 'Conserver avec les jokers', posture: 'Entre les zones : il observe la conservation.',
    coach: ['Occuper l’espace.', 'Utiliser les jokers.'], expect: ['8 passes.', '10 passes.', '10 passes et changement de zone.'] }],
  layout: { zones: [[0, 0, 100, 48, 'Zone 1'], [0, 52, 100, 48, 'Zone 2']], supports: [[2, 24], [98, 24], [50, 50]],
    formations: () => [[20, 10], [80, 10], [20, 40], [80, 40]], formationsAway: () => [[40, 18], [60, 18], [40, 34], [60, 34]], ball: 'b1', script: [
    ['b1', 'a1', 'p', 'Conservation avec les jokers'], ['a1', 'b3', 'p', ''], ['b3', 'r3', 'p', 'Perte'], ['r3', [60, 76], 'p', 'Récupération : sortie immédiate dans l’autre zone']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Six passes puis on sort', obj: 'Conserver puis attaquer une zone',
  id: 'mc-six-passes-sortie', likes: 13, title: 'Jeu réduit : conserver puis sortir attaquer', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [14, 14, 14], size: [25, 45], duration: 12, intensity: 3,
  src: MYCOACH.src('Jeu réduit', 'Michaël Demerlier', 'ES Roncq'),
  goal: '5 contre 5 au centre ; après 6 passes, un joueur sort avec le ballon attaquer un mini-but défendu par deux joueurs.',
  rules: [
    'Zone centrale : 5 contre 5. De chaque côté, une zone avec un mini-but défendu par deux joueurs.',
    'Après 6 passes de suite, un joueur de l’équipe en possession peut sortir avec le ballon vers une zone latérale.',
    'Il tente de marquer contre les deux défenseurs de cette zone.',
    'On tourne les défenseurs des zones latérales.'
  ],
  coach: ['Conserver calmement jusqu’à 6.', 'Sortir côté libre, en conduite rapide.', 'Fixer un défenseur avant de frapper.'],
  posture: 'Au bord de la zone centrale : il compte les passes.',
  expect: ['6 passes.', 'Sortir avec le ballon.', 'Marquer dans la zone latérale.'],
  easier: '4 passes.', harder: 'Deux touches au centre.',
  success: 'Des sorties dès que les 6 passes sont faites.',
  layout: { zones: [[0, 0, 22, 100, ''], [78, 0, 22, 100, '']], minis: [[1.5, 50, 90], [98.5, 50, 90]], supports: [[12, 35, 'D'], [12, 65, 'D'], [88, 35, 'D'], [88, 65, 'D']],
    formations: n => MYCOACH.grid(n, 26, 10, 74, 90), formationsAway: n => MYCOACH.grid(n, 30, 18, 70, 82).map(([x, y]) => [x + 4, y + 5]), ball: 'b1', script: [
    ['b1', 'b2', 'p', '6 passes au centre'], ['b2', 'b4', 'p', ''], ['b4', [86, 20], 'd', 'Il sort avec le ballon'], ['b4', [98.5, 50], 's', 'Frappe au mini-but']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'ludique', sub: 'Faire tomber les cônes', name: 'Faire tomber les cônes', obj: 'Conduire vite en relais',
  id: 'mc-tomber-cones', likes: 13, title: 'Faire tomber les cônes', theme: 'Conduite', phase: 'ballon', type: 'Jeu',
  players: [4, 8, 16], size: [20, 20], duration: 12, intensity: 3, params: { unit: 'joueurs' },
  src: MYCOACH.src('Faire tomber les cônes', 'Bixintxo Fidelle', 'AS des Églantins d’Hendaye'),
  goal: 'Par binômes : chacun son tour, aller faire tomber un cône et revenir. Le premier binôme à tout faire tomber gagne.',
  rules: [
    'Binômes, chacun sur sa coupelle, une ligne de cônes devant chaque binôme.',
    'Au top, le premier va faire tomber le premier cône et revient ; le second part pour le cône suivant.',
    'Le premier binôme à avoir fait tomber tous ses cônes gagne la manche.',
    'Variantes : en courant, marche arrière, pas chassés, ballon à la main, conduite, pied faible, semelle…'
  ],
  coach: ['Cheville souple, toucher le ballon à chaque appui.', 'Freiner avant le cône.', 'Le partenaire part quand l’autre est revenu.'],
  posture: 'Derrière les cônes : il annonce les variantes.',
  expect: ['Faire tomber son cône.', 'Garder le ballon proche.', 'Gagner une manche.'],
  easier: 'Sans ballon.', harder: 'Conduite pied faible.',
  success: 'Des conduites rapides et maîtrisées.',
  layout: { cones: [[50, 25], [70, 25], [90, 25], [50, 75], [70, 75], [90, 75]], start: [10, 25], home: [[10, 25], [10, 35], [10, 65], [10, 75]], ball: [13, 28], balls: [[13, 78]], moves: [
    [10, 25, 48, 25, 'd', 'Il va faire tomber le cône'], [10, 75, 48, 75, 'd+', ''], [48, 25, 12, 30, 'd', 'Retour'], [48, 75, 12, 70, 'd+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Vitesse', template: 'circuit', moment: 'physique', sub: 'Couleurs du carré', name: 'Couleurs du carré', obj: 'Réagir au signal puis sprinter',
  id: 'mc-couleurs-carre', likes: 13, title: 'Vivacité dans le carré', theme: 'Physique', phase: 'ballon', type: 'Exercice',
  players: [2, 2, 8], size: [6, 30], duration: 10, intensity: 4, series: [15, 60], params: { unit: 'joueurs' },
  src: MYCOACH.src('Vivacité', 'Richard Bervas', 'A. Cavale Blanche Brest'),
  goal: 'Au centre d’un carré de 6 m, toucher la coupelle de la couleur annoncée, puis au « top », sprint et conduite.',
  rules: [
    'Carré de 6 m, une coupelle de couleur à chaque coin. Le joueur au centre, sur ses appuis.',
    'Le coach annonce une couleur (à l’oral puis seulement en la montrant) : toucher la coupelle et revenir au centre.',
    'Au « top » : sprint jusqu’au ballon à 10-15 m, puis conduite jusqu’au partenaire 10 m plus loin.',
    'Le partenaire replace le ballon et prend la place dans le carré.'
  ],
  coach: ['Toujours en mouvement, sur la pointe des pieds.', 'Regarder le coach en face.', 'Rythme de réaction et de replacement.'],
  posture: 'Face au carré : il annonce puis montre les couleurs.',
  expect: ['Bonne couleur.', 'Réaction immédiate au signal visuel.', 'Sprint et conduite sans perdre le ballon.'],
  easier: 'Couleurs à l’oral seulement.', harder: 'Signal visuel seulement.',
  success: 'Pas d’erreur de couleur, départs explosifs.',
  layout: { discs: [[2, 40], [18, 40], [2, 60], [18, 60]], balls: [[55, 50]], start: [10, 50], home: [[10, 50], [96, 50]], moves: [
    [10, 50, 3, 41, 'c', 'Couleur annoncée'], [3, 41, 10, 50, 'c', 'Retour au centre'], [10, 50, 52, 50, 'c', '« Top » : sprint'], [52, 50, 92, 50, 'd', 'Conduite jusqu’au partenaire']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Cerceaux et centre', obj: 'Vitesse puis finition en une touche',
  id: 'mc-cerceaux-centre', likes: 13, title: 'Vitesse et finition sur centre', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [5, 12, 18], size: [35, 40], duration: 15, intensity: 3, params: { unit: 'joueurs' },
  src: MYCOACH.src('Exercice combiné pour travailler la vitesse et la finition', 'Christophe Marchat', 'ES Douvaine-Loisin'),
  goal: 'Appuis rapides dans les cerceaux, puis centre aérien du côté opposé et finition en une touche.',
  rules: [
    'Un centreur de chaque côté du but, deux colonnes à 25 m, six cerceaux devant chaque colonne.',
    'Au signal, un joueur sprinte et pose un appui dans chaque cerceau.',
    'À sa sortie des cerceaux, le centreur opposé centre en l’air ; finition en une touche.',
    'On alterne les côtés. Évolution : centres rentrants.'
  ],
  coach: ['Appuis courts et rapides.', 'Accélérer à la sortie des cerceaux.', 'Attaquer le ballon, une seule touche.'],
  posture: 'À côté du but : il déclenche les départs.',
  expect: ['Appuis propres.', 'Reprise cadrée.', 'But en une touche.'],
  easier: 'Centre au sol.', harder: 'Un défenseur sur la reprise.',
  success: 'Des reprises en une touche à pleine vitesse.',
  also: [MYCOACH.physique('Vitesse avec finition', 'À côté du but : il impose une récupération complète.')],
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, discs: [[30, 36], [36, 36], [42, 36], [30, 64], [36, 64], [42, 64]], start: [16, 36], home: [[16, 36], [16, 64], [84, 4], [84, 96]], ball: [87, 93], balls: [[87, 7]], moves: [
    [16, 36, 46, 36, 'c', 'Appuis dans les cerceaux'], [46, 36, 84, 42, 'c', 'Sprint'], [87, 93, 84, 42, 'p+', 'Centre du côté opposé'], [84, 42, 98, 46, 's', 'Finition en une touche']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
// Trois zones en ligne : deux zones de conservation aux bouts, un couloir central pour l'équipe qui défend.
const EXO = {
  ...MYCOACH, moment: 'perd', sub: 'Zone 3 · Pressing', name: 'Quatre contre deux en trois zones', obj: 'Réagir vite à la perte',
  id: 'mc-4c2-trois-zones', likes: 13, title: 'Conservation et transitions à trois équipes', theme: 'Transition', phase: 'transition', type: 'Jeu',
  players: [12, 12, 12], size: [14, 27], duration: 15, intensity: 4, defenders: 4,
  src: MYCOACH.src('jeu de conservation et transition OFF/DEF ou DEF/OFF', 'Cyrill Terribas', 'FC Valdahon-Vercel'),
  goal: 'Trois équipes de 4 : 5 passes dans sa zone puis transmettre dans l’autre zone. L’équipe qui perd le ballon va au centre.',
  rules: [
    'Terrain de 27 × 14 : deux zones de 12 m aux bouts, un couloir de 3 m au centre. Une équipe par zone, une au centre.',
    'Deux joueurs du centre viennent presser dans la zone du ballon (4 contre 2) ; les autres interceptent les transmissions.',
    '5 passes dans sa zone puis transmission dans l’autre zone = 1 point.',
    'À la perte, l’équipe va au centre ; l’équipe qui récupère prend la zone et commence à conserver.'
  ],
  coach: ['À la perte, se replacer vite dans le couloir central.', 'À la récupération, prendre les positions offensives tout de suite.', 'Verticaliser pour sortir de la densité.'],
  posture: 'Au bord du couloir central : il compte les points.',
  expect: ['5 passes.', 'Transmettre dans l’autre zone.', 'Récupérer en moins de 5 passes.'],
  easier: 'Terrain de 30 × 20.', harder: 'Terrain de 25 × 10, ballon au sol.',
  success: 'Changements de rôle rapides.',
  also: [{ moment: 'recupere', sub: 'Zone 1 · Jouer vers l’avant', obj: 'Sortir de la densité', posture: 'Au bord : il observe la première passe après récupération.',
    coach: ['Première passe vers l’espace libre.', 'Prendre vite les positions.'], expect: ['Garder le ballon.', 'Faire 5 passes.', 'Transmettre.'] }],
  layout: { thirdTeam: true, zones: [[0, 0, 44, 100, ''], [56, 0, 44, 100, '']],
    formations: () => [[6, 15], [38, 15], [6, 85], [38, 85], [62, 15], [94, 15], [62, 85], [94, 85]], formationsAway: () => [[18, 40], [28, 60], [50, 20], [50, 80]], ball: 'b1', script: [
    ['b1', 'b2', 'p', '4 contre 2 dans la zone'], ['b2', 'b4', 'p', ''], ['b4', 'b7', 'p', 'Après 5 passes : transmission'], ['r3', [50, 50], 'c+', 'Le centre tente d’intercepter']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Toucher les deux milieux', obj: 'Rendre disponibles les milieux axiaux',
  id: 'mc-def-milieux', likes: 13, title: 'Relations défenseurs et milieux axiaux', theme: 'Relance', phase: 'ballon', type: 'Jeu',
  players: [16, 18, 18], size: [55, 70], duration: 20, intensity: 3,
  src: MYCOACH.src('Améliorer les relations entre les défenseurs et milieux axiaux', 'Grégory Joly', 'US Colomiers'),
  goal: '8 contre 8 : les bleus doivent toucher deux milieux dans la zone centrale avant de passer dans le camp adverse.',
  rules: [
    '8 contre 8 avec gardiens. Bleus en 1-3-4, rouges en 1-2-3-2. Une zone axiale au centre.',
    'Bleus : toucher deux milieux dans la zone axiale avant d’aller dans le camp adverse ; appui-remise obligatoire pour un milieu dos au jeu.',
    'Séquence 1 : les rouges ne défendent pas dans la zone axiale. Séquence 2 : ils peuvent y défendre.',
    'But bleu après les milieux = 1 point ; récupération rouge et but en moins de 6 s = 2 points.'
  ],
  coach: ['Prise d’info avant de recevoir.', 'Distances entre défenseurs et milieux.', 'Orientation du corps et des épaules.'],
  posture: 'Sur la touche, à hauteur de la zone axiale : il observe la disponibilité des milieux.',
  expect: ['Trouver un milieu.', 'Trouver les deux.', 'Marquer après les deux milieux.'],
  easier: 'Un seul milieu à toucher.', harder: 'Séquence 2 dès le début.',
  success: 'Les milieux reçoivent orientés.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'Couper les milieux',
    posture: 'Sur la touche : il observe les rouges en séquence 2.', coach: ['Fermer les milieux.', 'Presser le défenseur qui relance.'],
    expect: ['Couper une passe.', 'Récupérer.', 'Marquer en 6 secondes.'] }],
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[38, 25, 24, 50, 'Zone axiale']],
    formations: n => [[16, 25], [14, 50], [16, 75], [42, 38], [42, 62], [56, 20], [56, 80], [60, 50]].slice(0, n), ball: 'gb', script: [
    ['gb', 'b2', 'p', 'Relance'], ['b2', 'b4', 'p', 'Premier milieu'], ['b4', 'b2', 'p', 'Appui-remise'], ['b2', 'b5', 'p', 'Second milieu'], ['b5', 'b8', 'p', 'On peut passer'], ['b8', 'butR', 's', 'But : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Appel-contre-appel et finition', obj: 'Se rendre disponible pour finir',
  id: 'mc-finition-rapide', likes: 13, title: 'Finition rapide', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [4, 7, 14], size: [30, 40], duration: 21, intensity: 3, params: { unit: 'postes' },
  src: MYCOACH.src('Finition rapide', 'Grégory Joly', 'US Colomiers'),
  goal: 'L’attaquant fait un appel-contre-appel et un appui-remise ; le milieu lance l’ailier, qui frappe ou centre.',
  rules: [
    'Milieux aux sources de ballons, attaquant au centre, ailiers sur les côtés.',
    'Séquence 1 : appel-contre-appel de l’attaquant, appui-remise avec le milieu, qui lance l’ailier ; frappe sans contrôle. L’attaquant suit.',
    'Séquence 2 : même départ, l’ailier centre pour l’attaquant qui marque sans contrôle (centre et course imposés).',
    'Séquence 3 : l’ailier choisit selon son appel : frappe ou centre. Attention au hors-jeu.'
  ],
  coach: ['Synchroniser les courses.', 'Démarrer fort au bon moment.', 'Passes justes, zones de finition occupées.'],
  posture: 'À l’entrée de la surface : il impose le type de centre.',
  expect: ['Bon timing.', 'Finition sans contrôle.', 'Choisir frappe ou centre juste.'],
  easier: 'Contrôle autorisé.', harder: 'Un défenseur sur l’attaquant.',
  success: 'Des finitions en une touche.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, start: [36, 50], home: [[36, 50], [60, 54], [56, 10], [56, 90]], ball: [39, 53], moves: [
    [60, 54, 68, 60, 'c', 'Appel'], [68, 60, 58, 50, 'c', 'Contre-appel'], [39, 53, 56, 50, 'p', 'Appui'], [58, 50, 42, 52, 'p', 'Remise'],
    [56, 10, 76, 16, 'c+', 'L’ailier part'], [42, 52, 76, 18, 'p', 'Profondeur'], [58, 50, 86, 44, 'c+', 'L’attaquant attaque la surface'], [76, 18, 86, 44, 'p', 'Centre'], [86, 44, 98, 48, 's', 'Sans contrôle']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
// Trois couloirs dans la largeur : 2 contre 1 dans les couloirs extérieurs, appui et meneur dans l'axe.
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: '2 contre 1 en couloirs', obj: 'Finir un 2 contre 1',
  id: 'mc-2c1', likes: 33, title: 'Gérer la supériorité numérique', theme: 'Finition', phase: 'ballon', type: 'Situation',
  players: [9, 9, 12], size: [50, 50], duration: 21, intensity: 4, defenders: f => Math.round(f / 3),
  src: MYCOACH.src('Gestion de la supériorité numérique', 'Timothée Bennoit', 'SO Velleronnais'),
  goal: 'Deux attaquants contre un défenseur : marquer en moins de 8 secondes.',
  rules: [
    'Demi-terrain coupé en trois couloirs dans la largeur.',
    'Couloirs extérieurs : deux attaquants partent de la ligne médiane contre un défenseur, 8 secondes pour marquer.',
    'Couloir central : un attaquant en appui, l’autre en meneur, contre un défenseur.',
    'Puis on ouvre deux couloirs : 4 contre 2.'
  ],
  coach: ['Le porteur fixe le défenseur avant de donner.', 'Le partenaire reste à distance de passe, légèrement en retrait.', 'Frapper dès que la voie est libre.'],
  posture: 'Sur le côté, à hauteur de la surface : il chronomètre les 8 secondes à voix haute.',
  expect: ['Frapper en moins de 8 secondes.', 'Fixer avant de donner.', 'Marquer sur un 2 contre 1 sur deux.'],
  easier: '10 secondes.', harder: '6 secondes.',
  success: 'Les supériorités sont conclues par une frappe.',
  also: [{ moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', obj: 'Gagner du temps en infériorité',
    posture: 'Derrière le but : il observe le défenseur seul.',
    coach: ['Reculer en fermant l’axe.', 'Feinter l’intervention pour ralentir.'],
    expect: ['Ne pas se faire éliminer.', 'Tenir 8 secondes.', 'Récupérer le ballon.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[0, 33, 100, .01, ''], [0, 67, 100, .01, '']],
    formations: n => [[42, 10], [42, 24], [46, 44], [62, 56], [42, 76], [42, 90]].slice(0, n), formationsAway: n => [[72, 17], [76, 50], [72, 83]].slice(0, n), ball: 'b1', script: [
    ['b1', [62, 12], 'd', 'Le porteur fixe'], ['b2', [70, 26], 'c+', ''], ['r1', [66, 16], 'c+', 'Le défenseur sort'],
    ['b1', 'b2', 'p', 'Il donne'], ['b2', 'butR', 's', 'Frappe en moins de 8 secondes']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Changer de rythme pour l’attaquant', obj: 'Garder le temps d’avance',
  id: 'mc-changer-rythme', likes: 12, title: 'Changer de rythme et garder le temps d’avance', theme: 'Animation offensive', phase: 'ballon', type: 'Jeu',
  players: [14, 16, 18], size: [40, 60], duration: 20, intensity: 3, oddJoker: true,
  src: MYCOACH.src('Animation offensive : changer de rythme - garder le temps d’avance dans un 4-3-3', 'Johan Roubault', 'AS Aix-en-Provence'),
  goal: 'Trois zones : 5 contre 5 au milieu, 1 contre 1 dans les zones de bout. Passe à l’attaquant obligatoire avant d’attaquer le but.',
  rules: [
    'Zone défensive, médiane, offensive. 5 contre 5 (+ jokers) au milieu, un attaquant contre un défenseur aux bouts. Jeu au sol.',
    'Passe à l’attaquant en zone offensive obligatoire pour attaquer le but. Hors-jeu en zone offensive.',
    'Deux milieux peuvent monter créer un 3 contre 1.',
    'Variantes : touches limitées, temps limité pour finir, plus ou moins de joueurs aux bouts.'
  ],
  coach: ['Accélérer au moment de la passe à l’attaquant.', 'Les milieux montent au bon moment.', 'Finir vite avant le retour.'],
  posture: 'Sur la touche : il chronomètre les finitions.',
  expect: ['Trouver l’attaquant.', 'Créer le 3 contre 1.', 'Marquer en moins de 8 secondes.'],
  easier: 'Pas de limite de temps.', harder: 'Un seul milieu peut monter.',
  success: 'Des changements de rythme nets.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[25, 0, .01, 100, ''], [75, 0, .01, 100, '']],
    formations: n => [[14, 50], [36, 25], [36, 75], [46, 40], [46, 60], [56, 50], [86, 50]].slice(0, n), ball: 'b2', script: [
    ['b2', 'b4', 'p', 'Circulation au milieu'], ['b4', 'b7', 'p', 'Passe à l’attaquant'], ['b5', [82, 30], 'c+', 'Un milieu monte : 2 contre 1'], ['b7', 'b5', 'p', ''], ['b5', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Trinôme : deux frappes et un centre', obj: 'Enchaîner frappes et centre à trois',
  id: 'mc-trinome', likes: 12, title: 'Frappes puis centre en trinôme', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [3, 6, 12], size: [35, 40], duration: 25, intensity: 3, params: { unit: 'joueurs' },
  src: MYCOACH.src('Exercice de frappe suivi d’un centre en trinôme', 'Arnaud Rouget', 'ASPTT Martinique'),
  goal: 'A dribble un mannequin et frappe ; il remet à B qui frappe ; il lance C qui centre pour A et B.',
  rules: [
    'Trois mannequins à 20 m du but. Par trois.',
    'A conduit, dribble à hauteur du mannequin et frappe.',
    'A reçoit de B et lui remet dans la course : B frappe.',
    'A reçoit de C et le lance dans la profondeur : C centre pour A et B. Trinôme suivant ; on change de rôle à chaque passage.'
  ],
  coach: ['Dribble à vitesse réelle avant la frappe.', 'Remise dans la course.', 'Attaquer le centre à deux, zones différentes.'],
  posture: 'À l’entrée de la surface : il enchaîne les trinômes.',
  expect: ['Trois actions sans arrêt.', 'Deux frappes cadrées.', 'But sur le centre.'],
  easier: 'Sans mannequin.', harder: 'Tout en une touche après le dribble.',
  success: 'Trois finitions par passage.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[60, 50], [60, 30], [60, 70]], start: [36, 50], home: [[36, 50], [40, 30], [40, 82]], ball: [39, 53], balls: [[43, 33], [43, 85]], moves: [
    [36, 50, 58, 52, 'd', 'A dribble le mannequin'], [60, 52, 98, 50, 's', 'Frappe'],
    [43, 33, 58, 44, 'p', 'B passe à A'], [58, 52, 58, 44, 'c+', ''], [58, 44, 66, 36, 'p', 'Remise dans la course'], [40, 30, 66, 36, 'c+', ''], [66, 36, 98, 46, 's', 'B frappe'],
    [43, 85, 60, 62, 'p', 'C passe à A'], [60, 62, 78, 82, 'p', 'A lance C'], [40, 82, 78, 82, 'c+', ''], [78, 82, 88, 46, 'p', 'Centre pour A et B']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', template: 'circuit', moment: 'physique', sub: 'Intermittent force', name: 'Intermittent force', obj: 'Alterner bonds et course à VMA',
  id: 'mc-intermittent-force', likes: 12, title: 'Intermittent force', theme: 'Physique', phase: 'sans', type: 'Exercice',
  players: [5, 10, 20], size: [30, 60], duration: 16, intensity: 4, series: [15, 15], params: { unit: 'joueurs' },
  src: MYCOACH.src('Intermittent Force', 'Loïc Izzo', 'FC Biassais'),
  goal: '15 secondes de bonds, 15 de récupération, 15 de course à VMA, 15 de récupération, et ainsi de suite.',
  rules: [
    'Cinq ateliers de pliométrie : sauts aller-retour au-dessus d’un banc, appuis dans l’échelle, bonds jambes tendues, bonds jambes fléchies, appuis décalés.',
    'Alternance : 15 s d’atelier, 15 s de récupération, 15 s de course à VMA, 15 s de récupération.',
    'On change d’atelier à chaque passage.',
    '2 × 8 minutes, selon la forme des joueurs.'
  ],
  coach: ['Réception souple, gainage.', 'Course à allure VMA, régulière.', 'Qualité avant quantité.'],
  posture: 'Entre les ateliers et la ligne de course : il chronomètre.',
  expect: ['Bonds propres.', 'Tenir la VMA.', 'Tenir les deux séries.'],
  easier: 'Une série.', harder: 'Récupération de 10 s.',
  success: 'Pas de baisse de qualité dans les bonds.',
  layout: { zones: [[4, 8, 16, 30, 'Banc'], [24, 8, 16, 30, 'Échelle'], [44, 8, 16, 30, 'Jambes tendues'], [64, 8, 16, 30, 'Jambes fléchies'], [84, 8, 14, 30, 'Appuis décalés']], discs: [[6, 80], [94, 80]],
    start: [12, 23], home: [[12, 23], [32, 23], [52, 23], [72, 23], [91, 23]], moves: [
    [12, 23, 12, 34, 'c', '15 s de bonds'], [32, 23, 32, 34, 'c+', ''], [12, 34, 10, 80, 'c', 'Récupération puis course à VMA'], [10, 80, 90, 80, 'c', '15 s à VMA']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Une-deux et passe croisée', obj: 'Réussir les passes en une touche',
  id: 'mc-passe-a-trois', likes: 12, title: 'Échauffement : passe à trois', theme: 'Passe', phase: 'ballon', type: 'Exercice',
  players: [4, 6, 15], size: [3, 6], duration: 12, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Echauffement : passe à 3', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Passe et suit à trois : une-deux, puis passe croisée entre les plots, et on enchaîne avec le joueur d’en face.',
  rules: [
    'Deux colonnes face à face, deux plots au milieu, 6 m de long, 3 m de large.',
    'Le premier déclenche un une-deux avec le joueur d’en face.',
    'Troisième passe croisée entre les plots.',
    'On suit sa passe et on enchaîne avec le joueur opposé. Une touche de balle.'
  ],
  coach: ['Une touche, passe dans le bon pied.', 'Suivre sa passe vite.', 'Annoncer avant de passer.'],
  posture: 'À côté des plots : il impose la une touche.',
  expect: ['Deux touches sans faute.', 'Une touche.', 'Une touche à vitesse élevée.'],
  easier: 'Deux touches.', harder: 'Pied faible.',
  success: 'Le ballon ne s’arrête jamais.',
  layout: { cones: [[50, 20], [50, 80]], start: [8, 30], home: [[8, 30], [92, 30], [8, 70], [92, 70]], ball: [11, 33], moves: [
    [11, 33, 89, 32, 'p', 'Une-deux'], [92, 30, 14, 34, 'p', ''], [14, 34, 89, 68, 'p', 'Passe croisée entre les plots'], [8, 30, 88, 66, 'c+', 'Je suis ma passe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'echauffement', sub: 'Mise en route', name: 'Conduite aux couleurs', obj: 'Lever la tête en conduisant',
  id: 'mc-conduite-couleurs', likes: 12, title: 'Prise d’information et conduite', theme: 'Prise d’information', phase: 'ballon', type: 'Exercice',
  players: [8, 14, 20], size: [25, 25], duration: 15, intensity: 2, defenders: 0,
  src: MYCOACH.src('Prise d’information et conduite', 'Mayron Elafati', 'FCSR Haguenau'),
  goal: 'Conduite libre ; au signal, filer à la coupelle de la couleur annoncée, sans aller à la même qu’un autre.',
  rules: [
    'Conduite libre dans la zone (surfaces et gestes variés). Coupelles de couleurs autour.',
    'Le coach annonce une couleur : aller en faire le tour, puis revenir. Interdit d’aller à la même coupelle qu’un autre joueur.',
    'Séquence 2 : par deux, un ballon pour deux. À la couleur annoncée, le porteur conduit vers une coupelle, le partenaire va à une coupelle de même couleur à l’opposé ; passe. Duo le plus rapide = 1 point.',
    'Variante : deux couleurs annoncées, une pour chacun.'
  ],
  coach: ['Lever la tête à chaque touche.', 'Voir son partenaire en conduisant.', 'Changer de rythme au signal.'],
  posture: 'Au bord de la zone : il annonce les couleurs.',
  expect: ['Bonne coupelle.', 'Sans collision.', 'Duo le plus rapide.'],
  easier: 'Une couleur, pas de règle d’exclusivité.', harder: 'Deux couleurs annoncées.',
  success: 'Tête levée en permanence.',
  layout: { ballsFor: 'b', formations: n => MYCOACH.grid(n, 16, 16, 84, 84), cones: [[2, 2], [98, 2], [2, 98], [98, 98], [50, 2], [50, 98], [2, 50], [98, 50]], ball: 'b1', script: [
    ['b1', [30, 30], 'd', 'Conduite libre'], ['b2', [92, 8], 'd+', 'Couleur annoncée : chacun sa coupelle']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Dribble puis double frappe', obj: 'Enchaîner vite en zone de finition',
  id: 'mc-dribble-frappe', likes: 11, title: 'Exercice de finition : dribble et frappes', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [3, 6, 12], size: [30, 25], duration: 22, intensity: 3, params: { unit: 'joueurs' },
  src: MYCOACH.src('Exercice de finition', 'Grégory Joly', 'US Colomiers'),
  goal: 'Contrôle orienté, slalom, fixation du mannequin et frappe au poteau opposé, puis plat du pied ras de terre au point de penalty.',
  rules: [
    'Source de ballons à 25 m dans l’axe, ballon donné à un joueur en mouvement ou de dos.',
    'Contrôle orienté, slalom entre trois coupelles, changement de rythme.',
    'Fixer le mannequin et frapper en sortie de dribble aux 16,5 m, poteau opposé obligatoire.',
    'Accélérer au point de penalty pour un plat du pied ouvert, ras de terre. Alterner droite et gauche ; le tireur devient passeur.'
  ],
  coach: ['Prise de balle orientée.', 'Changement de rythme après le slalom.', 'Équilibre et bonne surface de contact.'],
  posture: 'À l’entrée de la surface : il vérifie le poteau visé.',
  expect: ['Frappe poteau opposé.', 'Deux frappes cadrées.', 'Deux buts.'],
  easier: 'Sans mannequin.', harder: 'Tout en une touche pour la deuxième frappe.',
  success: 'Deux frappes propres à chaque passage.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[64, 44]], discs: [[44, 40], [50, 46], [56, 40]], start: [36, 50], home: [[36, 50], [10, 50]], ball: [13, 53], balls: [[70, 70]], moves: [
    [13, 53, 34, 52, 'p', 'Ballon donné'], [36, 50, 58, 42, 'd', 'Contrôle orienté et slalom'], [58, 42, 66, 36, 'd', 'Fixer le mannequin'], [67, 37, 98, 56, 's', 'Frappe poteau opposé'],
    [66, 36, 84, 54, 'c', 'Accélération au point de penalty'], [70, 70, 84, 54, 'p+', ''], [84, 54, 98, 46, 's', 'Plat du pied ras de terre']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Jouer dans le dos des lignes', obj: 'Jouer dans les intervalles et entre les lignes',
  id: 'mc-dos-des-lignes', likes: 11, title: 'Jouer dans le dos des attaquants et des milieux', theme: 'Progression', phase: 'ballon', type: 'Jeu',
  players: [15, 17, 17], size: [50, 70], duration: 20, intensity: 3,
  src: MYCOACH.src('Améliorer le jeu dans le dos des attaquants et des milieux de terrain adverses', 'Grégory Joly', 'US Colomiers'),
  goal: '8 contre 8 depuis le gardien : les bleus marquent en arrêtant le ballon derrière la ligne, encore mieux après une passe dans une porte.',
  rules: [
    'Départ du gardien. Bleus en 1-4-3 contre rouges en 2-3-3, demi-terrain + 20 m.',
    'Bleus : stop-ball derrière la ligne adverse = 1 point ; +1 si passe dans une porte sur un joueur lancé.',
    'Rouges : 3 touches en zone offensive, but = 1 point.',
    'Variantes : stop-ball + joueur lancé dans un couloir = 3 points ; les rouges pressent haut (récupération haute : marquer en moins de 3 passes ou 8 s).'
  ],
  coach: ['Communiquer pour le timing de l’appel.', 'Trouver le joueur entre les lignes.', 'Justesse technique.'],
  posture: 'Sur la touche : il observe le timing des courses.',
  expect: ['Trouver un joueur entre les lignes.', 'Passe dans une porte.', 'Marquer 3 points.'],
  easier: 'Rouges à un de moins.', harder: 'Pressing haut des rouges.',
  success: 'Des passes dans le dos des lignes.',
  layout: { goals: [[1.5, 50, 90]], keepersAt: [[5, 50]], zones: [[92, 0, 8, 100, 'Stop-ball']], cones: [[60, 30], [60, 40], [60, 60], [60, 70]],
    formations: n => [[18, 15], [16, 38], [16, 62], [18, 85], [34, 30], [34, 50], [34, 70], [48, 50]].slice(0, n), formationsAway: n => [[70, 30], [70, 70], [52, 20], [56, 50], [52, 80], [30, 15], [28, 50], [30, 85]].slice(0, n), ball: 'gb', script: [
    ['gb', 'b2', 'p', 'Relance'], ['b2', 'b6', 'p', 'Entre les lignes'], ['b8', [76, 36], 'c+', 'Appel dans le dos'], ['b6', [76, 36], 'p', 'Passe dans la porte'], ['b8', [94, 36], 'd', 'Stop-ball : 2 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Intervalles en chaîne', obj: 'Améliorer les prises d’intervalles',
  id: 'mc-intervalles-chaine', likes: 11, title: 'Passe et suit dans les intervalles avec finition', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [6, 10, 20], size: [45, 55], duration: 15, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('passe et suit + finition', 'Sébastien Languille', 'US Moyenne Durance'),
  goal: 'De piquet en piquet : appel, remise, appel dans l’intervalle, passe ; le dernier centre pour la frappe.',
  rules: [
    'Le 1 passe au 2, qui fait un appel, remet, puis attaque l’intervalle entre deux piquets.',
    'Le 1 sert le 2 dans l’intervalle ; le 2 enchaîne avec le 3, et ainsi de suite à chaque piquet.',
    'Le 5 centre pour le 6, qui frappe. Rotation : 1 → 2 → 3…, le 6 repart du départ opposé.',
    'Le même circuit démarre en même temps de l’autre côté.'
  ],
  coach: ['Toujours en mouvement.', 'Passe cheville bloquée, dans le bon timing.', 'Rythme d’exécution élevé.'],
  posture: 'Au centre : il garde les deux circuits synchronisés.',
  expect: ['Circuit sans faute.', 'Centre exploitable.', 'But.'],
  easier: 'Deux touches.', harder: 'Une touche partout.',
  success: 'Les intervalles sont attaqués au bon moment.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[30, 20], [30, 34], [52, 12], [52, 26], [70, 20], [70, 34]], start: [10, 27], home: [[10, 27], [24, 27], [46, 19], [64, 27], [80, 10], [72, 56]], ball: [13, 30], moves: [
    [13, 30, 22, 28, 'p', 'Passe au 2'], [24, 27, 14, 30, 'p', 'Remise'], [24, 27, 34, 27, 'c+', 'Appel dans l’intervalle'], [14, 30, 34, 27, 'p', 'Passe dans l’intervalle'],
    [34, 27, 44, 21, 'p', 'Le 2 enchaîne avec le 3'], [46, 19, 62, 27, 'p', ''], [64, 27, 78, 12, 'p', ''], [72, 56, 88, 46, 'c+', 'Appel du 6'], [80, 10, 88, 46, 'p', 'Centre'], [88, 46, 98, 48, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'L’effet miroir', obj: 'Se préparer musculairement avec ballon',
  id: 'mc-effet-miroir', likes: 11, title: 'L’effet miroir', theme: 'Échauffement', phase: 'ballon', type: 'Exercice',
  players: [2, 20, 30], size: [64, 70], duration: 16, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('L’effet miroir', 'Timothée Bennoit', 'SO Velleronnais'),
  goal: 'Par deux, face à face sur les deux lignes des 16 m : on part l’un vers l’autre en conduite et on se croise au milieu.',
  rules: [
    'Situation 1 : au milieu, on échange les ballons et on repart.',
    'Situation 2 : on s’arrête pour deux passes, puis on repart.',
    'Situation 3 : on stoppe les ballons, contact épaule contre épaule, et on repart avec le ballon de l’autre.',
    'Situation 4 : passe, contrôle orienté et retour d’où l’on vient. 4 séries de 4 minutes.'
  ],
  coach: ['Allure progressive.', 'Contact épaule loyal.', 'Contrôle orienté vers où l’on repart.'],
  posture: 'Au rond central : il annonce la situation.',
  expect: ['Croiser sans perdre le ballon.', 'Contacts propres.', 'Allure soutenue sur 4 minutes.'],
  easier: 'Distance plus courte.', harder: 'Situation 3 en continu.',
  success: 'Le groupe est chaud, muscles prêts.',
  layout: { zones: [[0, 20, 16, 60, ''], [84, 20, 16, 60, '']], start: [16, 50], home: [[16, 40], [84, 40], [16, 60], [84, 60]], ball: [19, 43], balls: [[81, 43], [19, 63], [81, 63]], moves: [
    [16, 40, 46, 40, 'd', 'Conduite l’un vers l’autre'], [84, 40, 54, 40, 'd+', ''], [16, 60, 46, 60, 'd+', ''], [84, 60, 54, 60, 'd+', ''],
    [46, 40, 82, 42, 'd', 'Échange des ballons et retour'], [54, 40, 18, 42, 'd+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Trouver l’appui derrière le but', obj: 'Utiliser les appuis pour se projeter',
  id: 'mc-appui-derriere', likes: 11, title: 'Jeu vers l’avant avec appuis', theme: 'Progression', phase: 'ballon', type: 'Jeu',
  players: [8, 8, 8], size: [20, 25], duration: 16, intensity: 3,
  src: MYCOACH.src('Jeu vers l’avant', 'Raphaël Rebelo', 'CJF'),
  goal: '2 contre 2 au milieu, des appuis sur les côtés et derrière chaque but : marquer en trouvant l’appui derrière le but.',
  rules: [
    '2 contre 2 libre au milieu ; deux appuis offensifs sur les côtés et un appui derrière chaque but, 2 touches maximum.',
    'Les passes entre appuis sont autorisées.',
    'Point : un joueur du milieu trouve l’appui derrière le but adverse ; 3 points si l’appui retrouve un joueur du milieu.',
    'Le jeu continue tant que le ballon est dans l’aire de jeu et maîtrisé.'
  ],
  coach: ['Prise de balle avec une intention vers l’avant.', 'Utiliser les appuis pour se projeter.', 'Coordination passeur-receveur.'],
  posture: 'Au bord du terrain : il compte les points.',
  expect: ['Trouver l’appui de côté.', 'Trouver l’appui derrière le but.', 'Marquer 3 points.'],
  easier: 'Appuis à 3 touches.', harder: 'Appuis à une touche.',
  success: 'Le jeu va vers l’avant.',
  layout: { supports: [[50, 2], [50, 98], [99, 50], [1, 50]], formations: () => [[34, 36], [40, 66]], formationsAway: () => [[60, 34], [66, 64]], ball: 'b1', script: [
    ['b1', 'a1', 'p', 'Appui de côté'], ['b2', [70, 50], 'c+', ''], ['a1', 'b2', 'p', ''], ['b2', 'a3', 'p', 'Appui derrière le but : 1 point'], ['a3', 'b1', 'p', 'Il retrouve un joueur du milieu : 3 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Feu d’artifice', obj: 'Enchaîner quatre frappes différentes',
  id: 'mc-feu-artifice', likes: 62, title: 'Feu d’artifice de tirs', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [6, 8, 10], size: [30, 30], duration: 20, intensity: 3, params: { unit: 'postes' },
  src: MYCOACH.src('Feu d’artifice de tir', 'Timothée Bennoit', 'SO Velleronnais'),
  goal: 'Quatre frappes d’affilée, sans temps mort, en revenant au repère entre chaque.',
  rules: [
    'Tir 1 : conduite et frappe.',
    'Tir 2 : centre au sol venu d’un côté, reprise.',
    'Tir 3 : centre aérien de l’autre côté, volée ou demi-volée.',
    'Tir 4 : passe en profondeur, face au gardien. Retour au repère après chaque tir ; on compte les buts sur la série.'
  ],
  coach: ['Revenir vite au repère, prêt à frapper.', 'Adapter la surface de contact au ballon.', 'Face au gardien : regarder avant de frapper.'],
  posture: 'Au repère : il lance chaque tir dès que le précédent est parti.',
  expect: ['Cadrer trois tirs sur quatre.', 'Marquer deux buts.', 'Marquer trois buts.'],
  easier: 'Pause de 5 secondes entre les tirs.', harder: 'Une touche sur les tirs 2 et 3.',
  success: 'Quatre frappes cadrées sans temps mort.',
  also: [MYCOACH.physique('Frapper sous la fatigue', 'Au repère : il impose l’enchaînement sans pause et chronomètre la récupération.')],
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, discs: [[66, 50]], start: [66, 50], home: [[66, 50], [84, 8], [84, 92], [50, 40]], ball: [69, 53], balls: [[87, 11], [87, 89], [53, 43]], moves: [
    [66, 50, 78, 54, 'd', 'Tir 1 : conduite'], [80, 56, 98, 52, 's', 'Frappe'],
    [78, 54, 70, 40, 'c', 'Retour au repère'], [87, 11, 76, 40, 'p', 'Tir 2 : centre au sol'], [76, 40, 98, 46, 's', 'Reprise'],
    [70, 40, 74, 62, 'c', ''], [87, 89, 76, 62, 'p', 'Tir 3 : centre aérien'], [76, 62, 98, 54, 's', 'Volée'],
    [74, 62, 70, 50, 'c', ''], [53, 43, 84, 48, 'p', 'Tir 4 : passe en profondeur'], [70, 50, 84, 48, 'c+', ''], [86, 50, 98, 48, 's', 'Face au gardien']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'recupere', sub: 'Zone 2 · Chercher la zone 3', name: 'Marquer dans une autre zone', obj: 'Changer de zone vite après la récupération',
  id: 'mc-quatre-carres-transition', likes: 11, title: 'Conservation et transition en quatre carrés', theme: 'Transition offensive', phase: 'transition', type: 'Jeu',
  players: [12, 14, 16], size: [40, 40], duration: 30, intensity: 3, oddJoker: true,
  src: MYCOACH.src('conservation transition', 'Joachim Merry', 'Lille'),
  goal: 'Une équipe conserve avec un joueur dans chaque carré ; l’autre récupère et a 7 secondes pour marquer dans une autre zone.',
  rules: [
    '40 × 40 découpé en quatre carrés, un mini-but dans chaque carré (au bord).',
    'L’équipe en possession garde au moins un joueur par carré ; 30 secondes de conservation = 1 point.',
    'L’équipe qui récupère a 7 secondes pour marquer dans un mini-but d’une autre zone que celle de la récupération.',
    'Sinon, elle reste en possession. Trois temps de jeu : j’ai le ballon, je le perds, je le récupère.'
  ],
  coach: ['À la récupération : quitter la zone tout de suite.', 'Regarder la zone la plus libre.', 'À la perte, empêcher la sortie de zone.'],
  posture: 'Au centre : il compte les 7 secondes.',
  expect: ['Quitter la zone.', 'Marquer en 7 secondes.', 'Marquer en moins de 3 passes.'],
  easier: '10 secondes.', harder: '5 secondes.',
  success: 'Des changements de zone rapides.',
  also: [{ moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', obj: 'Conserver en occupant les quatre carrés', posture: 'Au centre : il chronomètre les 30 secondes.',
    coach: ['Un joueur dans chaque carré.', 'Changer de carré quand c’est fermé.'], expect: ['Conserver 15 s.', 'Conserver 30 s.', 'Deux fois 30 s.'] }],
  layout: { zones: [[0, 0, 50, 50, ''], [50, 0, 50, 50, ''], [0, 50, 50, 50, ''], [50, 50, 50, 50, '']], minis: [[1.5, 25, 90], [98.5, 25, 90], [1.5, 75, 90], [98.5, 75, 90]],
    formations: n => MYCOACH.grid(n, 8, 10, 92, 90), formationsAway: n => MYCOACH.grid(n, 18, 20, 82, 80).map(([x, y]) => [x + 4, y + 4]), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Conservation'], ['b2', 'r1', 'p', 'Récupération rouge'], ['r1', 'r4', 'p', 'Vers une autre zone'], ['r4', [98.5, 75], 's', 'But en moins de 7 secondes']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Triangle visuel', obj: 'Garder les deux partenaires dans son champ de vision',
  id: 'mc-triangle-visuel', likes: 10, title: 'Triangle visuel : vision de jeu', theme: 'Prise d’information', phase: 'ballon', type: 'Exercice',
  players: [3, 3, 9], size: [3, 3], duration: 12, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('TRIANGLE VISUEL - VISION DE JEU', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Le joueur du carré reçoit de l’un et remet à l’autre, en gardant toujours les deux partenaires face à lui.',
  rules: [
    'Un carré de 3 × 3 m. Un joueur dedans, deux dehors, qui ne peuvent pas y entrer.',
    'Les extérieurs passent uniquement au joueur du centre, puis changent de position autour du carré.',
    'Le joueur du centre remet à l’autre extérieur, contrôle et passe en moins de 2 secondes.',
    'Il ne doit jamais avoir un partenaire dans son dos : reculer, avancer, tourner le buste plutôt que changer de zone.'
  ],
  coach: ['Buste face aux deux partenaires.', 'Déplacements les plus courts possible.', 'Moins de 2 secondes entre contrôle et passe.'],
  posture: 'À côté du carré : il signale chaque fois qu’un joueur se retrouve dans le dos.',
  expect: ['Contrôle et passe en 2 secondes.', 'Jamais de partenaire dans le dos.', 'Une touche quand c’est possible.'],
  easier: 'Carré plus grand, 3 secondes.', harder: 'Extérieurs qui bougent en permanence.',
  success: 'Le triangle visuel est toujours gardé.',
  layout: { zones: [[35, 35, 30, 30, '']], start: [50, 50], home: [[50, 50], [10, 20], [90, 80]], ball: [13, 23], moves: [
    [13, 23, 48, 48, 'p', 'Passe au joueur du carré'], [10, 20, 30, 90, 'c+', 'Il change de position'], [50, 50, 87, 78, 'p', 'Remise à l’autre extérieur'], [50, 50, 56, 44, 'c+', 'Il se replace pour voir les deux']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', name: 'Mètre de sécurité', obj: 'Anticiper la vitesse des attaquants',
  id: 'mc-metre-securite', likes: 10, title: 'Mètre de sécurité contre une attaque rapide', theme: 'Bloc', phase: 'sans', type: 'Situation',
  players: [10, 12, 14], size: [50, 45], duration: 20, intensity: 3, defenders: 5,
  src: MYCOACH.src('Mètre de sécurité - Travail défensif contre une attaque rapide', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Dès que le ballon est en jeu, la ligne défensive recule en gardant un mètre d’avance sur les attaquants, puis intercepte.',
  rules: [
    'Ligne défensive et attaquants sur la même ligne. Deux milieux bleus servent, pressés par un milieu défensif rouge.',
    'Le coach met en jeu ; les milieux lancent les attaquants en profondeur (lob, gauche, axe, droite).',
    'La ligne recule d’un cran (recul-frein) et garde un mètre d’avance jusqu’à l’entrée de la surface.',
    'À la passe, fin du recul : intercepter, ou le gardien sort. Puis même travail sans repères au sol.'
  ],
  coach: ['Jamais plus d’un mètre d’écart avec l’attaquant.', 'Reculer ensemble, en ligne.', 'Surgir sur la passe pour intercepter.'],
  posture: 'Sur le côté, au niveau de la ligne : il observe l’alignement et l’écart.',
  expect: ['Reculer en ligne.', 'Garder le mètre d’avance.', 'Intercepter la passe.'],
  easier: 'Passes annoncées.', harder: 'Sans repères au sol.',
  success: 'Les attaquants ne prennent jamais la profondeur.',
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[60, 0, .5, 100, ''], [72, 0, .5, 100, '']],
    formations: n => [[40, 40], [40, 60], [58, 20], [58, 44], [58, 70]].slice(0, n), formationsAway: n => [[62, 15], [62, 38], [62, 62], [62, 85], [46, 50]].slice(0, n), ball: 'b1', script: [
    ['r', 10, 'bloc', 'La ligne recule en gardant un mètre'], ['b4', [76, 44], 'c+', 'Les attaquants partent'],
    ['b1', [80, 40], 'p', 'Passe en profondeur'], ['r2', [79, 40], 'c+', 'Interception']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Cheminement en 4-3-3', obj: 'Automatiser un circuit de jeu jusqu’au but',
  id: 'mc-cheminement-433', likes: 10, title: 'Cheminement et dédoublement en 4-3-3', theme: 'Animation offensive', phase: 'ballon', type: 'Exercice',
  players: [10, 10, 20], size: [64, 55], duration: 10, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('animation offensive en 4-3-3 - cheminement dédoublement', 'Johan Roubault', 'AS Aix-en-Provence'),
  goal: 'Les dix joueurs jouent l’action à leur poste : jeu à trois, côté, appui sur l’excentré, dédoublement, centre et frappe.',
  rules: [
    '1. Jeu à trois entre les défenseurs centraux et le milieu défensif.',
    '2. Passe au latéral ; 3. appui sur l’excentré, qui dévie pour le relayeur et libère l’espace.',
    '4. Passe en profondeur pour le latéral qui dédouble ; 5. centre et frappe.',
    'Doubler les postes selon l’effectif. Alterner droite et gauche ; tout le monde se replace à la fin.'
  ],
  coach: ['Chaque joueur à son poste, toute l’équipe bouge.', 'L’excentré rentre pour libérer le couloir.', 'Plusieurs joueurs dans la surface sur le centre.'],
  posture: 'Sur la touche, au milieu : il fait répéter et corrige les positions.',
  expect: ['Circuit sans faute.', 'Dédoublement au bon moment.', 'Frappe sur le centre.'],
  easier: 'Circuit à vide, lentement.', harder: 'Un défenseur sur l’excentré.',
  success: 'L’action ressemble à celle du match.',
  layout: { goals: MYCOACH.goal, keepers: [[94, 50], [6, 50]], start: [16, 40],
    home: [[16, 40], [16, 60], [28, 50], [24, 10], [46, 30], [62, 12], [46, 70], [76, 50], [62, 88], [24, 90]], ball: [19, 43], moves: [
    [19, 43, 16, 57, 'p', 'Jeu à trois derrière'], [16, 60, 26, 52, 'p', ''], [28, 50, 26, 14, 'p', 'Passe au latéral'],
    [26, 14, 60, 16, 'p', 'Appui sur l’excentré'], [62, 12, 50, 28, 'p', 'Il dévie pour le relayeur'], [62, 12, 66, 30, 'c+', 'et libère le couloir'],
    [24, 10, 78, 8, 'c+', 'Le latéral dédouble'], [50, 28, 78, 10, 'p', 'Profondeur'], [76, 50, 88, 44, 'c+', ''], [62, 88, 88, 62, 'c+', ''],
    [78, 10, 88, 44, 'p', 'Centre'], [88, 44, 98, 48, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'recupere', sub: 'Zone 2 · Chercher la zone 3', name: 'Récupérer puis 4 contre 2', obj: 'Profiter du surnombre pour marquer',
  id: 'mc-temps-avance', likes: 10, title: 'Garder le temps d’avance pour aller marquer', theme: 'Transition offensive', phase: 'transition', type: 'Situation',
  players: [10, 10, 14], size: [50, 55], duration: 21, intensity: 4, defenders: 5,
  src: MYCOACH.src('Garder le temps d’avance pour aller marquer', 'Grégory Joly', 'US Colomiers'),
  goal: 'Les rouges récupèrent dans un petit carré, trouvent l’attaquant en appui, et deux partenaires suivent : 4 contre 2 en 10 secondes.',
  rules: [
    'Carré de 12 × 12 au milieu de terrain : deux bleus conservent contre trois rouges.',
    'À la récupération, les rouges cherchent l’appui de leur attaquant ; deux joueurs du carré suivent l’action : 4 contre 2.',
    '10 secondes pour marquer. Ballon sorti du carré sans récupération : le coach lance la situation.',
    'Variantes : un défenseur de l’autre carré revient (4 contre 3) ; marquer en 7 secondes.'
  ],
  coach: ['Jeu vers l’avant tout de suite.', 'Se démarquer dans le bon timing.', 'Courses coordonnées à haute intensité.'],
  posture: 'Dans le rond central : il compte les 10 secondes.',
  expect: ['Trouver l’attaquant.', 'Frapper 7 fois sur 10.', 'Marquer en 7 secondes.'],
  easier: '12 secondes.', harder: 'Un défenseur revient en retard.',
  success: 'Des frappes rapides sur presque chaque récupération.',
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[30, 38, 16, 24, 'Carré']],
    formations: () => [[34, 44], [42, 56], [80, 40], [80, 60]], formationsAway: () => [[36, 54], [40, 44], [44, 50], [66, 50], [52, 30]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Conservation dans le carré'], ['b2', 'r3', 'p', 'Récupération rouge'], ['r3', 'r4', 'p', 'Appui sur l’attaquant'],
    ['r2', [70, 30], 'c+', 'Deux partenaires suivent'], ['r3', [70, 66], 'c+', ''], ['r4', 'r2', 'p', '4 contre 2'], ['r2', [98.5, 46], 's', 'Frappe en moins de 10 secondes']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'perd', sub: 'Zone 3 · Pressing', name: 'Toro qui change de carré', obj: 'Passer d’attaquant à défenseur',
  id: 'mc-toro-deux-carres', likes: 10, title: 'Toro avec passage offensif-défensif', theme: 'Transition', phase: 'transition', type: 'Jeu',
  players: [12, 12, 14], size: [14, 30], duration: 15, intensity: 3, defenders: 6,
  src: MYCOACH.src('Toro avec passage offensif - défensif', 'Gary Lenzoni', 'Stade Nyonnais'),
  goal: 'Six attaquants contre deux défenseurs dans un carré ; à la récupération, les défenseurs jouent avec leurs partenaires dans l’autre carré.',
  rules: [
    'Deux carrés côte à côte. Dans le premier : 6 bleus contre 2 rouges. Dans le second : 4 rouges attendent.',
    'Si les rouges récupèrent (ou si les bleus sortent le ballon), ils jouent tout de suite avec leurs partenaires de l’autre carré.',
    'Deux bleus qui ont perdu le ballon changent de carré et deviennent défenseurs.',
    'On enchaîne sans arrêt.'
  ],
  coach: ['À la perte, les deux plus proches partent presser tout de suite.', 'À la récupération, passe immédiate vers l’autre carré.', 'Conserver avec des passes simples.'],
  posture: 'Entre les deux carrés : il relance un ballon dès qu’il sort.',
  expect: ['Conserver.', 'Changer de carré vite.', 'Récupérer en moins de 6 passes.'],
  easier: 'Trois défenseurs.', harder: 'Deux touches.',
  success: 'Changements de rôle immédiats.',
  also: [{ moment: 'echauffement', sub: 'Mise en route', obj: 'Se mettre en train par un toro', posture: 'Entre les carrés : il fait monter l’intensité.',
    coach: ['Démarrer en touches libres.', 'Accélérer.'], expect: ['Conserver.', 'Changer de rôle.', 'Garder l’intensité.'] }],
  layout: { zones: [[0, 0, 48, 100, ''], [52, 0, 48, 100, '']], formations: () => [[6, 15], [24, 6], [42, 15], [42, 85], [24, 94], [6, 85]], formationsAway: () => [[20, 44], [30, 56], [66, 30], [86, 30], [66, 70], [86, 70]], ball: 'b1', script: [
    ['b1', 'b2', 'p', '6 contre 2'], ['b2', 'r2', 'p', 'Récupération'], ['r2', 'r3', 'p', 'Passe vers l’autre carré'], ['b2', [64, 40], 'c+', 'Deux bleus changent de carré'], ['b3', [80, 50], 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', template: 'circuit', keepers: 1, moment: 'physique', sub: 'Intermittent au poste', name: 'Intermittent au poste', obj: 'Efforts courts au poste de latéral et d’attaquant',
  id: 'mc-intermittent-poste', likes: 10, title: 'Intermittent spécifique : latéraux et attaquants', theme: 'Physique', phase: 'ballon', type: 'Exercice',
  players: [4, 6, 15], size: [50, 64], duration: 14, intensity: 4, series: [15, 30], params: { unit: 'joueurs' },
  src: MYCOACH.src('exercice intermittent spécifique au poste (latéraux et attaquants)', 'Michaël Demerlier', 'ES Roncq'),
  goal: 'Enchaînements de 10 à 15 secondes, 30 secondes de récupération : le latéral finit par un centre, l’attaquant par une frappe.',
  rules: [
    'Latéral : se démarquer en reculant, recevoir et redonner ; course et tête au-dessus d’un mannequin ; une-deux, obstacle (évitement de tacle) et centre.',
    'Attaquant : tête au-dessus d’un mannequin ; appel-contre-appel avec décalage ; accélération, course croisée et frappe sur le centre du latéral.',
    'L’attaquant prend l’information pour régler sa course sur celle du latéral.',
    '10-30 ou 15-30 (secondes de travail - récupération), pendant 7 minutes.'
  ],
  coach: ['Gestes de match à pleine intensité.', 'Ne pas accélérer trop tôt ni trop tard.', 'Récupération réelle entre les passages.'],
  posture: 'Au point de penalty : il chronomètre et donne les départs.',
  expect: ['Enchaînement complet.', 'Centre exploitable.', 'But.'],
  easier: '30 s de travail, 45 s de récupération.', harder: '10-20.',
  success: 'Qualité de geste jusqu’à la dernière répétition.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[40, 14], [60, 40]], discs: [[30, 6], [56, 50]], start: [24, 10], home: [[24, 10], [46, 54], [40, 30]], ball: [43, 33], moves: [
    [24, 10, 40, 20, 'c', 'Le latéral se démarque'], [43, 33, 40, 22, 'p', 'Passe'], [40, 22, 42, 30, 'p', 'Il redonne'],
    [40, 20, 76, 10, 'c', 'Tête, une-deux, obstacle'], [42, 30, 76, 12, 'p', ''],
    [46, 54, 62, 48, 'c+', 'L’attaquant : appel-contre-appel'], [62, 48, 86, 40, 'c', 'Course croisée'], [76, 12, 86, 40, 'p', 'Centre'], [86, 40, 98, 46, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Passe à 10 avec sanction', obj: 'Ne pas perdre le ballon',
  id: 'mc-passe-dix-sanction', likes: 10, title: 'Passe à 10 avec sanction à la perte', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [12, 14, 14], size: [30, 40], duration: 20, intensity: 3,
  src: MYCOACH.src('PASSE À 10 AVEC SANCTION À LA PERTE', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Conservation : celui qui perd le ballon sort, ce qui pénalise son équipe. Après 10 passes, on attaque le but.',
  rules: [
    '5 contre 5 dans une zone, deux joueurs dehors en attente. Celui qui perd le ballon sort ; celui qui attend depuis le plus longtemps entre.',
    'On peut donc se retrouver à 5 contre 3.',
    'Après 10 passes ou au coup de sifflet, l’équipe en possession va marquer sur tout le terrain, l’autre défend.',
    'Après chaque action, on change de zone de conservation.'
  ],
  coach: ['Les joueurs dehors observent pour entrer au bon endroit.', 'Se déplacer dans les intervalles.', 'Pas de passe risquée : la perte coûte cher.'],
  posture: 'Au bord de la zone : il fait entrer et sortir les joueurs.',
  expect: ['10 passes.', 'Ne pas perdre le ballon.', '10 passes puis marquer.'],
  easier: 'Un seul joueur dehors.', harder: 'Deux touches.',
  success: 'Possessions longues et sûres.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[30, 20, 40, 60, 'Zone de conservation']], supports: [[50, 2, 'S'], [50, 98, 'S']],
    formations: n => MYCOACH.grid(n, 34, 24, 66, 76), formationsAway: n => MYCOACH.grid(n, 38, 30, 62, 70).map(([x, y]) => [x + 3, y + 5]), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Conservation'], ['b2', 'r1', 'p', 'Ballon perdu : le passeur sort'], ['b2', [50, 0], 'c+', ''], ['a1', [40, 30], 'c+', 'Le premier en attente entre']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: '5 passes puis un des 4 mini-buts', obj: 'Conserver pour créer le décalage',
  id: 'mc-5-passes-4-minis', likes: 10, title: 'Conservation à 5 contre 5 et quatre mini-buts', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [8, 10, 10], size: [20, 20], duration: 20, intensity: 3,
  src: MYCOACH.src('Conservation du ballon : entraînement à 5 contre 5', 'Gary Lenzoni', 'Stade Nyonnais'),
  goal: '5 contre 5 : 5 passes de suite, puis on peut marquer dans n’importe lequel des quatre mini-buts.',
  rules: [
    'Terrain de 20 × 20, un mini-but au milieu de chaque côté.',
    '5 passes de suite, puis on peut marquer dans un des quatre mini-buts.',
    'Les quatre buts empêchent toute défense fixe : il faut créer le décalage.',
    'Ballon perdu : l’autre équipe recommence à compter.'
  ],
  coach: ['Se démarquer pour créer le décalage.', 'Changer de côté pour trouver le but libre.', 'Frapper vite une fois les 5 passes faites.'],
  posture: 'Au bord : il compte les passes.',
  expect: ['5 passes.', 'Marquer.', 'Marquer dans le but le plus éloigné du ballon.'],
  easier: '3 passes.', harder: 'Deux touches.',
  success: 'Des buts après décalage.',
  layout: { minis: [[50, 1.5, 0], [98.5, 50, 90], [50, 98.5, 0], [1.5, 50, 90]], formations: n => MYCOACH.grid(n, 10, 10, 90, 90), formationsAway: n => MYCOACH.grid(n, 20, 20, 80, 80).map(([x, y]) => [x + 5, y + 5]), ball: 'b1', script: [
    ['b1', 'b2', 'p', '1…'], ['b2', 'b3', 'p', '2…'], ['b3', 'b5', 'p', '… 5 passes'], ['b5', [98.5, 50], 's', 'But libre']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', name: 'Défendre son but sur centre', obj: 'Organiser le marquage sur les centres',
  id: 'mc-defendre-centre', likes: 9, title: 'Organiser le marquage sur centre', theme: 'Protéger le but', phase: 'sans', type: 'Situation',
  players: [9, 10, 12], size: [45, 30], duration: 20, intensity: 3, defenders: 4,
  src: MYCOACH.src('Organiser le marquage pour défendre son but sur centre', 'Grégory Joly', 'US Colomiers'),
  goal: 'Centres répétés depuis la droite et la gauche : les défenseurs gagnent les duels et dégagent.',
  rules: [
    'Départs à droite et à gauche : appui-remise entre le latéral et le milieu de côté, puis débordement.',
    'Centre en première intention pour trois attaquants dans trois zones, ou en retrait pour un milieu axial.',
    'Deuxième temps : le latéral défend modérément pour répéter les centres.',
    'Attaquants : but sur le 1er temps = 2 points, sur le 2e = 1 point. Défenseurs : dégagement = 2 points.'
  ],
  coach: ['Défense mixte ou individuelle : chacun sait qui il prend.', 'Centre en retrait : sortir vite.', 'Timing du saut, gagner son duel.'],
  posture: 'À côté du but : il impose le type de centre (tendu, aérien, ras de terre).',
  expect: ['Prendre son joueur.', 'Gagner le duel.', 'Dégager loin.'],
  easier: 'Deux attaquants seulement.', harder: 'Un attaquant de plus.',
  success: 'Les centres sont repoussés.',
  also: [{ moment: 'possede', sub: 'Zone 3 / Box · Finition', obj: 'Attaquer les trois zones sur centre', posture: 'À côté du but : il observe l’occupation des zones.',
    coach: ['Premier poteau, second poteau, point de penalty.', 'Attaquer le ballon.'], expect: ['Occuper les zones.', 'Reprendre cadré.', 'Marquer.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], formations: () => [[52, 10], [40, 22], [70, 36], [68, 54], [66, 70], [52, 50]], formationsAway: () => [[84, 34], [86, 52], [84, 68], [74, 48]], ball: 'b2', script: [
    ['b2', 'b1', 'p', 'Appui-remise'], ['b1', [82, 8], 'd', 'Débordement'], ['b3', [88, 40], 'c+', 'Premier poteau'], ['r1', [88, 38], 'c+', 'Le défenseur prend son joueur'],
    ['b1', [88, 40], 'p', 'Centre'], ['r1', [60, 20], 'p', 'Dégagement : 2 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', name: 'Deux zones maximum', obj: 'Défendre l’axe ballon-but, en bloc',
  id: 'mc-deux-zones', likes: 67, title: 'Défendre en zone sur deux zones', theme: 'Bloc', phase: 'sans', type: 'Jeu',
  players: [14, 16, 18], size: [30, 40], duration: 20, intensity: 3, oddJoker: true,
  src: MYCOACH.src('Défendre en zone - cadrer couvrir - réduire l’espace entre 2 lignes', 'Johan Roubault', 'AS Aix-en-Provence'),
  goal: 'L’équipe sans ballon doit tenir dans deux zones maximum : cadrer, couvrir, réduire les espaces.',
  rules: [
    '7 contre 7 sur un terrain coupé en quatre zones dans la longueur. Jeu au sol.',
    'Point marqué quand on trouve son capitaine, placé derrière la ligne de fond adverse.',
    'L’équipe qui défend ne doit occuper que deux zones voisines ; un joueur hors bloc = point pour l’adversaire.',
    'Variantes : touches limitées, contrôle obligatoire, jeu aérien autorisé, joker.'
  ],
  coach: ['Le plus proche cadre le porteur, le suivant couvre.', 'Toujours se placer sur l’axe ballon-but.', 'Le bloc avance et recule ensemble.'],
  posture: 'Sur le côté, au milieu : il annonce à voix haute quand le bloc s’étire sur trois zones.',
  expect: ['Rester sur deux zones.', 'Cadrer et couvrir à chaque ballon.', 'Récupérer et trouver son capitaine.'],
  easier: 'Trois zones autorisées.', harder: 'Défenseurs à un de moins.',
  success: 'Un bloc court qui récupère dans l’axe.',
  also: [{ moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', obj: 'Étirer le bloc adverse',
    posture: 'Sur le côté : il observe l’équipe en possession et sa façon d’étirer le bloc.',
    coach: ['Écarter au maximum.', 'Jouer derrière le bloc dès qu’il se casse.'],
    expect: ['Étirer le bloc.', 'Trouver le capitaine.', 'Trouver le capitaine en moins de 6 passes.'] }],
  layout: { zones: [[25, 0, .01, 100, ''], [50, 0, .01, 100, ''], [75, 0, .01, 100, '']], supports: [[99, 50, 'C'], [1, 50, 'C']],
    formations: n => MYCOACH.grid(n, 8, 10, 60, 90), formationsAway: n => MYCOACH.grid(n, 52, 22, 74, 78), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Circulation'],
    ['r', -6, 'bloc+', 'Le bloc rouge glisse sur deux zones'],
    ['b2', 'b4', 'p', ''],
    ['r1', [50, 30], 'c+', 'Un rouge cadre, un autre couvre'],
    ['b4', 'a1', 'p', 'Passe au capitaine : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Finir sous pression', obj: 'Finir les occasions franches',
  id: 'mc-finir-pression', likes: 9, title: 'Pression, finition, attention', theme: 'Finition', phase: 'ballon', type: 'Situation',
  players: [5, 8, 10], size: [30, 40], duration: 15, intensity: 3, params: { unit: 'joueurs' },
  src: MYCOACH.src('Pression Finition Attention', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Le coach annonce droite ou gauche au moment de la passe ; l’attaquant contourne les plots et frappe, poursuivi par un défenseur.',
  rules: [
    'Deux passeurs au centre se font des passes. Un défenseur de chaque côté, derrière une rangée de plots.',
    'Au moment d’une passe, le coach annonce « droite » ou « gauche » : l’attaquant reçoit et contourne la rangée de ce côté.',
    'Le défenseur de ce côté tente de lui prendre le ballon ; tir avant les piquets.',
    'Rotation : file → défenseur droit → passeur → défenseur gauche → tireur → file.'
  ],
  coach: ['Réagir à l’annonce.', 'Protéger le ballon du défenseur.', 'Frapper vite, placé.'],
  posture: 'Derrière les passeurs : il annonce le côté au dernier moment.',
  expect: ['Frapper avant les piquets.', 'Cadrer sous pression.', 'Marquer.'],
  easier: 'Défenseurs plus loin.', harder: 'Défenseurs plus proches.',
  success: 'Des buts malgré la pression.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[56, 30], [62, 30], [56, 70], [62, 70], [80, 30], [80, 70]], start: [36, 50], home: [[36, 50], [30, 40], [30, 60], [66, 20], [66, 80]], ball: [33, 43], moves: [
    [33, 43, 34, 52, 'p', 'Passe : « droite ! »'], [36, 50, 60, 40, 'd', 'L’attaquant contourne les plots'], [66, 80, 66, 52, 'c+', 'Le défenseur de ce côté poursuit'],
    [60, 40, 74, 44, 'd', ''], [75, 45, 98, 48, 's', 'Frappe avant les piquets']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'echauffement', sub: 'Mise en route', name: 'Le chasseur', obj: 'Dribbler pour sortir du carré',
  id: 'mc-chasseur', likes: 9, title: 'Le chasseur', theme: 'Dribble', phase: 'ballon', type: 'Jeu',
  players: [8, 16, 16], size: [20, 20], duration: 15, intensity: 3,
  src: MYCOACH.src('Le Chasseur', 'Ricardo Cunha', 'FC Espagnol Lausanne'),
  goal: 'Par deux dans un grand carré, 1 contre 1 : sortir du carré balle au pied en dribblant son partenaire.',
  rules: [
    'Un grand carré, les joueurs par deux, un ballon pour deux.',
    'Le porteur part de l’intérieur et cherche à sortir du carré balle au pied en dribblant son adversaire : 1 point.',
    'Puis le ballon passe à l’autre, qui repart de l’intérieur.',
    'Dès que le porteur démarre, l’autre peut l’attaquer.'
  ],
  coach: ['Feinte avant d’accélérer.', 'Protéger le ballon avec le corps.', 'Défendre fléchi, sans se jeter.'],
  posture: 'Au bord du carré : il compte les points.',
  expect: ['Sortir une fois.', 'Sortir en dribblant.', 'Gagner son duel.'],
  easier: 'Défenseur passif.', harder: 'Carré plus petit.',
  success: 'Beaucoup de dribbles tentés.',
  layout: { ballsFor: 'b', formations: n => MYCOACH.grid(n, 20, 20, 80, 80).map(([x, y]) => [x - 4, y]), formationsAway: n => MYCOACH.grid(n, 20, 20, 80, 80).map(([x, y]) => [x + 4, y]), ball: 'b1', script: [
    ['b1', [30, 30], 'd', 'Feinte et dribble'], ['r1', [28, 30], 'c+', ''], ['b1', [2, 20], 'd', 'Sortie du carré : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Quatre portes', obj: 'Occuper tout le terrain',
  id: 'mc-quatre-portes', likes: 9, title: 'Occupation du terrain : quatre portes', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [8, 10, 12], size: [25, 25], duration: 15, intensity: 3, oddJoker: true,
  src: MYCOACH.src('Occupation du terrain', 'Katell Jourdrin', 'US Cléder'),
  goal: 'Deux équipes attaquent et défendent les quatre portes : 3 passes minimum, puis marquer en passant une porte balle au pied.',
  rules: [
    'Une porte au milieu de chaque côté ; les deux équipes attaquent et défendent les quatre.',
    '3 passes minimum avant de pouvoir marquer.',
    'But : franchir une porte balle au pied ; le jeu continue, le joueur remet le ballon en jeu par une passe.',
    'Variantes : touches limitées, interdit de marquer deux fois de suite dans la même porte.'
  ],
  coach: ['Se répartir sur toute la surface.', 'Voir et être vu.', 'Jeu court dans les pieds, puis attaquer la porte libre.'],
  posture: 'Au bord : il valorise le jeu sans ballon.',
  expect: ['3 passes.', 'Franchir une porte.', 'Franchir la porte la plus éloignée.'],
  easier: '2 passes.', harder: 'Jamais deux fois la même porte.',
  success: 'Le terrain est occupé partout.',
  layout: { cones: [[44, 1], [56, 1], [99, 44], [99, 56], [44, 99], [56, 99], [1, 44], [1, 56]], formations: n => MYCOACH.grid(n, 10, 10, 90, 90), formationsAway: n => MYCOACH.grid(n, 20, 20, 80, 80).map(([x, y]) => [x + 5, y + 5]), ball: 'b1', script: [
    ['b1', 'b2', 'p', '1'], ['b2', 'b4', 'p', '2'], ['b4', 'b3', 'p', '3'], ['b3', [99, 50], 'd', 'Porte franchie balle au pied']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'recupere', sub: 'Zone 1 · Jouer vers l’avant', name: 'Transmettre au terrain d’à côté', obj: 'Transmettre vite après la récupération',
  id: 'mc-6c4-deux-terrains', likes: 9, title: 'Transition rapide à la récupération', theme: 'Transition offensive', phase: 'transition', type: 'Jeu',
  players: [12, 12, 12], size: [25, 50], duration: 25, intensity: 3, defenders: 6,
  src: MYCOACH.src('Transition rapide à la récupération du ballon', 'Michaël Caubit', 'ES Eysines'),
  goal: 'Sur un terrain, 6 rouges conservent contre 4 bleus ; à la récupération, les bleus transmettent à leurs 2 partenaires de l’autre terrain.',
  rules: [
    'Deux terrains de 25 × 25. Terrain A : 6 rouges contre 4 bleus. Terrain B : 2 bleus en attente.',
    'Les rouges conservent le plus longtemps possible.',
    'À la récupération, les bleus transmettent au plus vite à un bleu du terrain B.',
    'Réussi : tout le monde change de terrain sauf 2 rouges, qui attendent ; les bleus conservent à 6 contre 4. Ordre de passage fixé à l’avance.'
  ],
  coach: ['En possession : écarter le jeu, proposer dans les intervalles.', 'À la récupération : une passe vers le terrain B tout de suite.', 'Sans ballon : presser en bloc.'],
  posture: 'Entre les deux terrains : il surveille l’ordre de passage.',
  expect: ['Récupérer.', 'Transmettre en une passe.', 'Conserver ensuite à 6 contre 4.'],
  easier: 'Terrains plus proches.', harder: 'Deux touches.',
  success: 'Transmissions immédiates.',
  also: [{ moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', obj: 'Conserver en supériorité', posture: 'Entre les terrains : il observe les 6 en possession.',
    coach: ['Écarter le jeu.', 'Jouer dans les intervalles.'], expect: ['10 passes.', '20 passes.', 'Ne jamais perdre le ballon.'] }],
  layout: { zones: [[0, 0, 48, 100, 'Terrain A'], [52, 0, 48, 100, 'Terrain B']],
    formations: () => [[16, 30], [30, 44], [32, 60], [18, 70], [74, 40], [86, 60]], formationsAway: () => [[6, 10], [42, 10], [44, 50], [42, 90], [6, 90], [4, 50]], ball: 'r1', script: [
    ['r1', 'r2', 'p', '6 rouges conservent'], ['r2', 'b1', 'p', 'Récupération bleue'], ['b1', 'b5', 'p', 'Transmission au terrain B'], ['b2', [70, 60], 'c+', 'Tout le monde change de terrain']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', name: 'Coulisser face au ballon', obj: 'Toujours un défenseur face au ballon',
  id: 'mc-bloc-bas', likes: 8, title: 'Organisation défensive en bloc bas', theme: 'Bloc', phase: 'sans', type: 'Situation',
  players: [10, 11, 13], size: [50, 40], duration: 20, intensity: 3, defenders: 5,
  src: MYCOACH.src('ORGANISATION DEFENSIVE AVEC BLOC BAS OU HAUT 3-5-2', 'Jimmy Valentin', 'JS Luronnes'),
  goal: 'Quatre milieux font circuler et cherchent leur attaquant ; les défenseurs coulissent et le prennent en charge. Au sifflet : 10 secondes pour marquer.',
  rules: [
    'Les quatre milieux bleus font circuler le ballon et cherchent l’appui de leur attaquant, qui se déplace sur toute la largeur.',
    'Les défenseurs rouges coulissent pour toujours avoir un joueur face au ballon et prendre l’attaquant en charge.',
    'Au coup de sifflet, les bleus ont 10 secondes pour marquer.',
    'À la récupération, les rouges relancent proprement vers un petit but ou le coach.'
  ],
  coach: ['Communiquer pour se passer l’attaquant.', 'Le latéral opposé rentre dans l’axe quand le ballon est sur une aile.', 'Fermer les intervalles.'],
  posture: 'Derrière le but : il siffle les attaques de 10 secondes.',
  expect: ['Toujours un défenseur face au ballon.', 'Prendre l’attaquant en charge.', 'Récupérer et relancer.'],
  easier: '15 secondes pour les bleus.', harder: 'Deux attaquants bleus.',
  success: 'Pas d’intervalle ouvert.',
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], minis: [[50, 1.5, 0]], formations: () => [[40, 20], [40, 80], [54, 38], [54, 62], [74, 50]], formationsAway: () => [[84, 20], [86, 38], [86, 62], [84, 80], [72, 30]], ball: 'b3', script: [
    ['b3', 'b1', 'p', 'Circulation'], ['b5', [76, 26], 'c+', 'L’attaquant se décale'], ['r1', [80, 26], 'c+', 'Le défenseur le prend en charge'], ['r4', [84, 62], 'c+', 'Le latéral opposé rentre']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Portes de l’orientation', obj: 'Doser la passe et orienter le contrôle',
  id: 'mc-portes-orientation', likes: 8, title: 'Les portes de l’orientation', theme: 'Technique', phase: 'ballon', type: 'Exercice',
  players: [6, 8, 16], size: [20, 20], duration: 15, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Les portes de l’orientation', 'Ricardo Cunha', 'FC Espagnol Lausanne'),
  goal: 'Passe dosée sur un joueur près du plot (prise de balle précise), puis passe appuyée sur le joueur au piquet, qui contrôle orienté à gauche ou à droite.',
  rules: [
    'Une seule équipe, deux ballons.',
    'Passe dosée sur un partenaire qui demande près d’un plot : prise de balle précise.',
    'Passe appuyée sur le joueur placé au piquet central : contrôle orienté vers une porte, à gauche ou à droite.',
    'On suit sa passe ; on change de sens régulièrement.'
  ],
  coach: ['Doser la passe selon la distance.', 'Prise de balle dans la direction du jeu.', 'Contrôle orienté qui franchit la porte.'],
  posture: 'Au centre : il annonce le côté du contrôle orienté.',
  expect: ['Passes bien dosées.', 'Contrôles orientés réussis.', 'Côté annoncé au dernier moment.'],
  easier: 'Portes plus larges.', harder: 'Une touche après le contrôle.',
  success: 'Le ballon arrive toujours dans de bonnes conditions.',
  layout: { cones: [[50, 46], [80, 20], [80, 32], [80, 68], [80, 80]], start: [10, 50], home: [[10, 50], [30, 30], [50, 50], [92, 26], [92, 74]], ball: [13, 53], balls: [[13, 47]], moves: [
    [13, 53, 28, 33, 'p', 'Passe dosée'], [30, 30, 47, 48, 'p', 'Passe appuyée au piquet'], [50, 50, 76, 26, 'd', 'Contrôle orienté dans la porte'], [76, 26, 90, 26, 'p', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'ludique', sub: 'Baseball-foot', name: 'Baseball-foot', obj: 'Jeu ludique : courir les bases',
  id: 'mc-baseball-foot', likes: 8, title: 'Baseball-foot', theme: 'Ludique', phase: 'ballon', type: 'Jeu',
  players: [9, 15, 18], size: [30, 40], duration: 20, intensity: 3, params: { unit: 'joueurs' },
  src: MYCOACH.src('BaseBallFoot', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Un joueur dégage le ballon et court les bases ; les deux autres équipes ramènent le ballon au capitaine par des passes.',
  rules: [
    'Trois équipes, chacune passe à l’attaque pendant 6 minutes.',
    'Le premier attaquant dégage le ballon dans le terrain et sprinte vers la première base, puis les suivantes s’il a le temps.',
    'Les deux autres équipes renvoient le ballon à leur capitaine, dans le cercle, sans se déplacer balle au pied (passes obligatoires).',
    'Attaquant hors d’une base quand le capitaine reçoit : il est « brûlé » et recommence. Dernière base atteinte = 1 point.'
  ],
  coach: ['Dégager loin et dans un espace libre.', 'Défenseurs : se répartir sur le terrain.', 'Passes rapides vers le capitaine.'],
  posture: 'Près du capitaine : il juge les bases.',
  expect: ['Atteindre une base.', 'Faire un tour complet.', 'Gagner avec son équipe.'],
  easier: 'Bases plus proches.', harder: 'Dégagement du pied faible.',
  success: 'Tout le monde court et participe.',
  layout: { discs: [[30, 90], [70, 90], [70, 50], [30, 50]], zones: [[44, 64, 12, 12, 'Capitaine']], start: [10, 90], home: [[10, 90], [50, 30], [30, 20], [70, 20], [50, 70]], ball: [13, 87], moves: [
    [13, 87, 50, 30, 'p', 'Dégagement'], [10, 90, 30, 90, 'c+', 'Course vers la première base'], [50, 30, 50, 68, 'p', 'Passe au capitaine'], [30, 90, 70, 90, 'c+', 'Base suivante si possible']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Toro doublé', obj: 'Occuper l’espace, faire circuler vite',
  id: 'mc-toro-double', likes: 8, title: 'Conservation en toro doublé', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [8, 12, 12], size: [10, 40], duration: 18, intensity: 3, defenders: f => Math.round(f / 3),
  src: MYCOACH.src('Conservation de balle - Intensité', 'Katell Jourdrin', 'US Cléder'),
  goal: 'Deux zones de conservation : 3 passes minimum dans une zone avant d’envoyer le ballon dans l’autre.',
  rules: [
    'Deux zones sur 40 × 10, dans chacune un 4 contre 2 (ou 3 contre 1).',
    '3 passes minimum dans une zone avant d’envoyer le ballon dans l’autre.',
    'Défenseurs : 1 point par récupération ou ballon sorti par erreur.',
    'Variantes : touches limitées ; un attaquant ou un défenseur peut changer de zone.'
  ],
  coach: ['Anticiper la passe suivante.', 'Voir et être vu.', 'Circulation rapide.'],
  posture: 'Entre les deux zones : il compte les points des défenseurs.',
  expect: ['3 passes.', 'Changer de zone.', 'Enchaîner deux changements.'],
  easier: '3 contre 1.', harder: 'Deux touches.',
  success: 'Le ballon change souvent de zone.',
  layout: { zones: [[0, 0, 48, 100, ''], [52, 0, 48, 100, '']], formations: () => [[6, 10], [42, 10], [6, 90], [42, 90], [58, 10], [94, 10], [58, 90], [94, 90]], formationsAway: () => [[20, 44], [30, 56], [70, 44], [80, 56]], ball: 'b1', script: [
    ['b1', 'b2', 'p', '1'], ['b2', 'b4', 'p', '2'], ['b4', 'b3', 'p', '3'], ['b3', 'b7', 'p', 'Vers l’autre zone']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Axe réservé à deux', obj: 'Jouer sur la largeur et la profondeur',
  id: 'mc-axe-reserve', likes: 8, title: 'Jouer sur la largeur et la profondeur', theme: 'Largeur', phase: 'ballon', type: 'Jeu',
  players: [12, 14, 16], size: [40, 55], duration: 20, intensity: 3,
  src: MYCOACH.src('Jeu - jouer sur la largeur - profondeur', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Seuls le porteur et une solution peuvent être dans l’axe : les autres occupent la largeur et la profondeur.',
  rules: [
    'Deux équipes, jeu libre au départ avec communication (« ça vient », « seul »…).',
    'Puis une zone axiale : seuls le porteur et un partenaire de la même équipe peuvent y être.',
    'Pour franchir la ligne de la zone offensive : par une passe uniquement, pas en conduite.',
    'Objectif : toujours un appui devant, jouer la profondeur.'
  ],
  coach: ['Toujours un appui devant le ballon.', 'Écarter pour ouvrir l’axe.', 'Annoncer pour aider le porteur.'],
  posture: 'Sur la touche : il siffle les joueurs en trop dans l’axe.',
  expect: ['Occuper la largeur.', 'Franchir la ligne par une passe.', 'Marquer après une passe en profondeur.'],
  easier: 'Trois joueurs autorisés dans l’axe.', harder: 'Deux touches.',
  success: 'Le jeu s’étire en largeur et en profondeur.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[0, 35, 100, 30, 'Axe'], [70, 0, .01, 100, '']],
    formations: n => [[16, 50], [30, 12], [30, 88], [46, 50], [56, 14], [56, 86], [66, 50]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Le jeu s’écarte'], ['b7', [80, 40], 'c+', 'Appel dans la profondeur'], ['b2', 'b4', 'p', ''], ['b4', [80, 40], 'p', 'Passe qui franchit la ligne'], ['b7', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Entrer par la passe', obj: 'Garder le temps d’avance',
  id: 'mc-entrer-par-passe', likes: 8, title: 'Garder le temps d’avance : zone offensive par la passe', theme: 'Finition', phase: 'ballon', type: 'Jeu',
  players: [12, 14, 16], size: [40, 60], duration: 25, intensity: 3,
  src: MYCOACH.src('Garder le temps d’avance', 'Raphaël Rebelo', 'CJF'),
  goal: 'Conservation dans la zone centrale ; on entre en zone offensive seulement par une passe, puis tout le monde peut suivre.',
  rules: [
    'Une zone centrale de 30 m, une zone offensive de 15 m de chaque côté. Hors-jeu sur la ligne de zone offensive.',
    'On accède à la zone offensive uniquement sur une passe ; ensuite tout le monde peut y entrer et on joue comme en match.',
    'Récupération de l’équipe qui défend : une passe à son gardien arrête l’action, on repart de la zone centrale.',
    'Ballon sorti : le coach remet en jeu dans la zone centrale.'
  ],
  coach: ['Courir vers l’avant pour demander le ballon.', 'Connexion passeur-receveur.', 'Enchaîner vite vers la frappe.'],
  posture: 'Sur la touche, à la ligne de la zone offensive : il juge le hors-jeu.',
  expect: ['Entrer par la passe.', 'Frapper.', 'Marquer.'],
  easier: 'Pas de hors-jeu.', harder: 'Frapper en moins de 8 secondes après l’entrée.',
  success: 'Des entrées dans la zone bien synchronisées.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[25, 0, .01, 100, ''], [75, 0, .01, 100, '']],
    formations: n => [[30, 25], [30, 75], [44, 40], [44, 60], [58, 20], [58, 80], [66, 50]].slice(0, n), ball: 'b3', script: [
    ['b3', 'b4', 'p', 'Conservation au centre'], ['b7', [82, 44], 'c+', 'Appel'], ['b4', [82, 44], 'p', 'Entrée par la passe'], ['b5', [80, 20], 'c+', 'Tout le monde suit'], ['b7', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
// Les bleus relancent depuis leur grand but (à gauche) et attaquent 3 mini-buts + 2 portes à droite ; les rouges ferment l'axe.
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', name: 'Fermer l’axe', obj: 'Orienter le jeu adverse sur un côté',
  id: 'mc-fermer-axe', likes: 37, title: 'Fermer les intervalles', theme: 'Bloc', phase: 'sans', type: 'Jeu',
  players: [14, 16, 17], size: [50, 60], duration: 23, intensity: 3,
  src: MYCOACH.src('Fermer les intervalles', 'Thomas Hammoudi', 'Cosmopolitan Club de Taverny'),
  goal: 'Les rouges ferment l’axe, poussent les bleus vers un couloir et y déclenchent le pressing.',
  rules: [
    'Les bleus partent de leur gardien et attaquent trois mini-buts dans l’axe ou deux portes à franchir en conduite dans les couloirs : 1 point.',
    'Les rouges défendent et attaquent le grand but : but = 1 point.',
    'Récupération des rouges dans un couloir = 2 points.',
    '2 × 10 minutes, 1 min 30 de récupération.'
  ],
  coach: ['Bloc compact, lignes resserrées.', 'Signal de pressing : le ballon arrive au joueur de couloir.', 'Fermer toutes les passes courtes autour de lui.'],
  posture: 'Sur la touche, à hauteur du bloc : il donne le signal de pressing quand le ballon part dans le couloir.',
  expect: ['Fermer l’axe.', 'Presser dans le couloir.', 'Récupérer dans le couloir.'],
  easier: 'Mini-buts plus petits.', harder: 'Bleus à un de plus.',
  success: 'Le jeu bleu part sur les côtés et y est récupéré.',
  also: [{ moment: 'possede', sub: 'Zone 1 · Construire le jeu', obj: 'Ressortir face à un bloc',
    posture: 'Derrière le but bleu : il observe la relance et la recherche de l’axe.',
    coach: ['Chercher l’intervalle avant le couloir.', 'Si le couloir est piégé, revenir et changer de côté.'],
    expect: ['Relancer sans perte.', 'Trouver l’axe.', 'Marquer dans un mini-but.'] }],
  layout: { goals: [[1.5, 50, 90]], keepersAt: [[5, 50]], minis: [[98.5, 30, 90], [98.5, 50, 90], [98.5, 70, 90]], cones: [[98, 4], [98, 16], [98, 84], [98, 96]], zones: [[0, 0, 100, 20, 'Couloir'], [0, 80, 100, 20, 'Couloir']],
    formations: n => [[16, 30], [16, 70], [30, 10], [30, 50], [30, 90], [46, 35], [46, 65], [60, 50]].slice(0, n), formationsAway: n => [[78, 50], [66, 32], [66, 68], [54, 22], [54, 50], [54, 78], [42, 40], [42, 60]].slice(0, n), ball: 'b1', script: [
    ['gb', 'b1', 'p', 'Relance'], ['b1', 'b3', 'p', 'L’axe est fermé : passe au couloir'],
    ['r4', [36, 14], 'c+', 'Signal : pressing sur le couloir'], ['r', -6, 'bloc+', 'Le bloc glisse'],
    ['r4', [32, 10], 'c', 'Récupération dans le couloir : 2 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'echauffement', sub: 'Mise en route', name: 'Toro biathlon', obj: 'S’échauffer techniquement et physiquement',
  id: 'mc-toro-biathlon', likes: 8, title: 'Toro biathlon', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [12, 12, 14], size: [25, 25], duration: 18, intensity: 3,
  src: MYCOACH.src('Toro biathlon', 'Grégory Joly', 'US Colomiers'),
  goal: 'Toro 3 contre 3 dans le rond, six coureurs balle au pied autour : dépasser un adversaire donne un joueur de plus au toro.',
  rules: [
    'Dans le rond central : 3 contre 3. Autour, dans un couloir, 6 joueurs (3 de chaque équipe) avec un ballon.',
    'Les coureurs tournent autour du rond ; celui qui dépasse un adversaire peut entrer donner le surnombre à son équipe.',
    'Le joueur qui perd le ballon dans le toro sort faire 3 tours de pénalité avant de reprendre un ballon et la poursuite.',
    '10 passes = 1 point ; première équipe à 5 points.'
  ],
  coach: ['Conduite tête levée, ballon proche.', 'Conserver calmement dans le toro.', 'Entrer au bon moment pour le surnombre.'],
  posture: 'Au bord du rond : il compte les passes et les tours de pénalité.',
  expect: ['10 passes.', 'Dépasser un adversaire.', 'Atteindre 5 points.'],
  easier: 'Touches libres.', harder: 'Deux touches dans le toro.',
  success: 'Un échauffement intense et joyeux.',
  layout: { zones: [[20, 20, 60, 60, 'Toro']], ballsFor: ['b4', 'b5', 'b6', 'r4', 'r5', 'r6'],
    formations: () => [[35, 35], [65, 40], [45, 65], [10, 10], [90, 50], [10, 90]], formationsAway: () => [[50, 45], [40, 50], [60, 60], [50, 6], [90, 90], [6, 50]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Toro 3 contre 3'], ['b4', [40, 6], 'd+', 'Les coureurs tournent'], ['r6', [6, 20], 'd+', ''], ['b2', 'b3', 'p', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'perd', sub: 'Zone 1 / Box · Défendre le but', name: 'Porteur non cadré', obj: 'Gérer la profondeur en situation de crise',
  id: 'mc-profondeur-crise', likes: 8, title: 'Gérer la profondeur sur un porteur non cadré', theme: 'Transition défensive', phase: 'transition', type: 'Situation',
  players: [8, 9, 15], size: [50, 60], duration: 24, intensity: 3, defenders: 4,
  src: MYCOACH.src('Gestion de la profondeur sur un porteur de balle adverse non cadré', 'Grégory Joly', 'US Colomiers'),
  goal: 'Une perte simulée au milieu : 2 contre 1 puis 2 contre 2. La ligne défensive gère la profondeur, recule et couvre.',
  rules: [
    'Départ d’un milieu bleu (perte simulée) : appui-remise sur l’attaquant puis recherche d’un joueur lancé.',
    'Zone 1 : 2 contre 1, les attaquants ont 8 s pour sortir de la zone par une passe. Zone de finition : 2 contre 2, 6 s et 2 passes maximum pour marquer.',
    'Un défenseur supplémentaire part dès la transmission ; il gère son replacement selon le ballon et les adversaires.',
    'À la récupération : trouver un joueur à la ligne médiane en moins de 3 passes ou 8 s. Alterner gauche et droite.'
  ],
  coach: ['Prendre l’info sur le porteur et les receveurs.', 'Recul-frein, couverture, communication.', 'Épaules orientées pour anticiper la course.'],
  posture: 'Derrière la ligne défensive : il observe la gestion de la profondeur.',
  expect: ['Reculer sans se faire passer.', 'Couvrir le partenaire.', 'Récupérer et relancer en 8 s.'],
  easier: 'Attaquants à 10 s.', harder: 'Défenseur supplémentaire plus loin.',
  success: 'La profondeur n’est presque jamais prise.',
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[40, 0, .01, 100, ''], [70, 0, .01, 100, '']],
    formations: () => [[34, 50], [52, 30], [52, 70], [58, 50]], formationsAway: () => [[62, 38], [78, 40], [78, 60], [50, 50]], ball: 'b1', script: [
    ['b1', 'b4', 'p', 'Appui sur l’attaquant'], ['b4', 'b1', 'p', 'Remise'], ['b2', [80, 26], 'c+', 'Joueur lancé'],
    ['r2', [84, 34], 'c+', 'Le défenseur recule et couvre'], ['r1', [64, 44], 'c+', ''], ['b1', [82, 26], 'p', 'Passe en profondeur'], ['r2', [82, 28], 'c', 'Récupération']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Sortir par l’aile opposée', obj: 'Traverser une zone sans perdre le ballon',
  id: 'mc-zone-contrainte', likes: 7, title: 'Conservation et exploitation des ailes', theme: 'Largeur', phase: 'ballon', type: 'Situation',
  players: [12, 14, 16], size: [50, 64], duration: 20, intensity: 3,
  src: MYCOACH.src('Conservation et exploitation des ailes', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Les attaquants traversent une zone à touches limitées et en sortent par l’aile opposée à leur entrée, puis vont marquer.',
  rules: [
    'Attaque contre défense : les bleus marquent dans le grand but, les rouges en stop-ball sur la ligne opposée.',
    'Dans la zone centrale, touches limitées (3, puis 2, puis 1).',
    'On entre dans la zone par n’importe où, mais on en sort uniquement par l’aile opposée (porte de plots).',
    'Obligation de traverser la zone au moins une fois avant de marquer.'
  ],
  coach: ['Attirer d’un côté pour sortir de l’autre.', 'Changer de côté en peu de passes.', 'Exploiter l’aile après la sortie.'],
  posture: 'Sur la touche : il vérifie les sorties de zone.',
  expect: ['Traverser la zone.', 'Sortir par l’aile opposée.', 'Marquer après la traversée.'],
  easier: '3 touches dans la zone.', harder: '1 touche dans la zone.',
  success: 'Les ailes sont exploitées.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'Fermer la sortie côté opposé',
    posture: 'Sur la touche : il observe les rouges.', coach: ['Glisser vers l’aile opposée.', 'Presser dans la zone.'], expect: ['Fermer la sortie.', 'Récupérer.', 'Stop-ball.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[30, 15, 40, 70, 'Zone contrainte'], [0, 0, 4, 100, '']], cones: [[70, 4], [70, 14], [70, 86], [70, 96]],
    formations: n => [[14, 50], [36, 30], [36, 70], [50, 40], [50, 60], [60, 20], [60, 80]].slice(0, n), formationsAway: n => [[82, 30], [82, 70], [76, 50], [64, 40], [64, 60], [44, 50]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Entrée côté gauche'], ['b2', 'b4', 'p', ''], ['b4', 'b5', 'p', 'Le jeu change de côté'], ['b5', 'b7', 'p', ''], ['b7', [76, 90], 'd', 'Sortie par l’aile opposée'], ['b7', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Trois équipes de trois', obj: 'Dix passes avant de marquer',
  id: 'mc-trois-de-trois', likes: 7, title: 'Passe à 10 et petits buts à trois équipes', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [9, 9, 9], size: [8, 15], duration: 15, intensity: 3, defenders: 3,
  src: MYCOACH.src('Passe à 10 + petits buts', 'Tristan Messin', 'Athletic Club Augny'),
  goal: 'Deux équipes conservent ensemble contre la troisième ; 10 passes, puis marquer dans un petit but au choix.',
  rules: [
    'Trois équipes de 3 sur 15 × 8. Deux conservent ensemble, la troisième chasse.',
    '10 passes obligatoires avant de marquer dans un des petits buts.',
    'L’équipe qui perd le ballon devient chasseuse à la place de celle qui l’a récupéré.',
    '3 touches maximum. Variantes : 2 puis 1 touche, terrain plus petit.'
  ],
  coach: ['Corps orienté face au jeu, dos à la touche.', 'Communiquer pour aider le porteur.', 'Intensité des courses et des passes.'],
  posture: 'Au bord : il compte les passes.',
  expect: ['10 passes.', 'Marquer.', '10 passes en 2 touches.'],
  easier: '6 passes.', harder: 'Une touche.',
  success: 'Possessions longues malgré l’espace réduit.',
  layout: { thirdTeam: true, minis: [[1.5, 50, 90], [98.5, 50, 90]], formations: () => [[10, 15], [50, 6], [90, 15], [10, 85], [50, 94], [90, 85]], formationsAway: () => [[36, 40], [64, 50], [46, 62]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Conservation à deux équipes'], ['b2', 'b5', 'p', ''], ['b5', 'b6', 'p', '… 10 passes'], ['b6', [98.5, 50], 's', 'But au choix']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', moment: 'physique', sub: 'Portes de couleur à 7 contre 7', name: 'Portes de couleur à 7 contre 7', obj: 'Développer l’endurance capacité en jouant',
  id: 'mc-portes-couleur', likes: 7, title: 'Jeu des portes à attaquer', theme: 'Physique', phase: 'ballon', type: 'Jeu',
  players: [12, 14, 16], size: [60, 60], duration: 40, intensity: 3, series: [600, 120],
  src: MYCOACH.src('3/3 Jeu des portes à défendre ou attaquer', 'Olivier Daviet', 'Garches Vaucresson FC'),
  goal: '7 contre 7 sur 60 × 60 : chaque équipe a ses propres portes à traverser par une passe.',
  rules: [
    'Cinq portes jaunes et cinq portes rouges de 3 à 4 m, placées au hasard.',
    'Les jaunes franchissent les portes jaunes, les rouges les rouges, par une passe au sol à un partenaire = 1 point.',
    'Interdit d’attaquer deux fois de suite la même porte. 3 touches maximum, jeu long autorisé.',
    'Variantes : 2 touches ; passe dans une porte en une touche seulement.'
  ],
  coach: ['Changer de porte pour déplacer la défense.', 'Jeu long pour renverser.', 'Rythme élevé et continu.'],
  posture: 'Sur la touche : il chronomètre les séquences.',
  expect: ['Franchir une porte.', 'Changer de porte à chaque point.', 'Tenir le rythme sur toute la séquence.'],
  easier: 'Portes plus larges.', harder: 'Deux touches.',
  success: 'Intensité constante.',
  also: [{ moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', obj: 'Orienter le jeu vers la porte libre', posture: 'Sur la touche : il observe les changements de porte.',
    coach: ['Lever la tête.', 'Renverser vers la porte libre.'], expect: ['Franchir une porte.', 'Renverser.', 'Marquer deux fois de suite.'] }],
  layout: { cones: [[20, 20], [20, 28], [50, 12], [50, 20], [80, 30], [80, 38], [30, 70], [30, 78], [70, 72], [70, 80]],
    formations: n => MYCOACH.grid(n, 8, 10, 56, 90), formationsAway: n => MYCOACH.grid(n, 44, 14, 92, 86), ball: 'b1', script: [
    ['b1', 'b3', 'p', 'Circulation'], ['b5', [36, 74], 'c+', ''], ['b3', [36, 74], 'p', 'Passe dans la porte : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', keepers: 2, moment: 'physique', sub: '4 contre 4 en marquage individuel', name: '4 contre 4 en marquage individuel', obj: 'Développer la puissance aérobie',
  id: 'mc-marquage-individuel', likes: 7, title: 'Jeu de finition en marquage individuel', theme: 'Physique', phase: 'ballon', type: 'Jeu',
  players: [10, 10, 10], size: [35, 35], duration: 24, intensity: 4, series: [240, 120],
  src: MYCOACH.src('Jeu de finition avec du marquage individuel', 'Olivier Daviet', 'Garches Vaucresson FC'),
  goal: '4 contre 4 avec gardiens, chacun suit son adversaire direct : quatre 1 contre 1 en même temps.',
  rules: [
    '4 contre 4 + 2 gardiens sur 35 × 35.',
    'Marquage individuel : chacun ne défend que sur son adversaire attitré.',
    'But = 1 point.',
    'Variantes : 6 secondes pour tirer ; gardiens à 2 touches.'
  ],
  coach: ['Se démarquer de son adversaire direct.', 'Défendre sans lâcher son joueur.', 'Frapper vite.'],
  posture: 'Sur la touche : il chronomètre et encourage l’intensité.',
  expect: ['Rester avec son joueur.', 'Frapper.', 'Marquer.'],
  easier: 'Séquences plus courtes.', harder: '6 secondes pour tirer.',
  success: 'Duels intenses du début à la fin.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], formations: () => [[24, 30], [24, 70], [42, 20], [42, 80]], formationsAway: () => [[32, 30], [32, 70], [48, 26], [48, 74]], ball: 'b1', script: [
    ['b3', [60, 30], 'c', 'Démarquage'], ['r3', [62, 34], 'c+', 'L’adversaire suit'], ['b1', 'b3', 'p', ''], ['b3', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'recupere', sub: 'Zone 3 / Box · Marquer le but', name: 'Couleur annoncée', obj: 'Profiter du déséquilibre adverse',
  id: 'mc-couleur-annoncee', likes: 6, title: 'Profiter du déséquilibre défensif adverse', theme: 'Transition offensive', phase: 'transition', type: 'Jeu',
  players: [12, 14, 16], size: [50, 70], duration: 18, intensity: 4,
  src: MYCOACH.src('Profiter du déséquilibre défensif adverse', 'Grégory Joly', 'US Colomiers'),
  goal: 'Les deux équipes échangent un ballon au centre ; à l’annonce d’une couleur, cette équipe attaque tout de suite, l’autre va défendre.',
  rules: [
    'Terrain divisé en trois dans la largeur. Chaque équipe se passe un ballon dans la zone centrale.',
    'Le coach annonce une couleur : cette équipe attaque vite ; les adversaires lâchent leur ballon et vont défendre leur but.',
    'Variante 1 : 8 secondes pour marquer, ou moins de 4 passes.',
    'Variante 2 : le coach annonce la couleur et le but à attaquer. Possibilité de réversibilité pour travailler la transition.'
  ],
  coach: ['Changement de rythme net.', 'Trouver vite un appui vers l’avant.', 'Courses coordonnées.'],
  posture: 'Au centre : il annonce les couleurs.',
  expect: ['Partir vite.', 'Se procurer une occasion 3 fois sur 5.', 'Marquer en 8 secondes.'],
  easier: '10 secondes.', harder: 'Couleur et but annoncés.',
  success: 'Des occasions sur la plupart des attaques.',
  also: [{ moment: 'perd', sub: 'Zone 1 / Box · Défendre le but', obj: 'Rentrer défendre son but', posture: 'Derrière un but : il observe l’équipe qui doit revenir.',
    coach: ['Courir vers son but par le chemin le plus court.', 'Fermer l’axe d’abord.'], expect: ['Revenir.', 'Retarder.', 'Empêcher le but.'] }],
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[33.3, 0, .01, 100, ''], [66.6, 0, .01, 100, '']], ballsFor: ['r1'],
    formations: n => MYCOACH.grid(n, 36, 14, 50, 86), formationsAway: n => MYCOACH.grid(n, 50, 14, 64, 86), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Échanges au centre'], ['b3', [80, 40], 'c', '« Bleu ! » : les bleus attaquent'], ['r2', [86, 50], 'c+', 'Les rouges rentrent défendre'], ['b2', [80, 40], 'p', ''], ['b3', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', name: 'Défendre deux buts', obj: 'Défendre sur toute la largeur',
  id: 'mc-deux-buts', likes: 6, title: 'Défense des deux buts', theme: 'Technique défensive', phase: 'sans', type: 'Situation',
  players: [4, 4, 12], size: [25, 25], duration: 12, intensity: 4,
  src: MYCOACH.src('Défense des 2 buts', 'Sylvain Castaignau', 'AS Bidache'),
  goal: '2 contre 2 : les attaquants visent deux petits buts, les défenseurs couvrent les deux et contre-attaquent sur un but unique.',
  rules: [
    'À l’annonce d’une couleur, le joueur de cette équipe part avec le ballon, son partenaire l’accompagne.',
    'Ils attaquent les deux petits buts d’en face.',
    'Les deux adversaires défendent les deux buts ; s’ils récupèrent, ils marquent dans le but unique de l’autre côté.',
    'On ne corrige que les défenseurs.'
  ],
  coach: ['Défendre l’axe ballon-but.', 'Un cadre, l’autre couvre le second but.', 'Communiquer.'],
  posture: 'Derrière les deux buts : il observe la répartition des défenseurs.',
  expect: ['Cadrer le porteur.', 'Couvrir l’autre but.', 'Récupérer et marquer.'],
  easier: 'Buts plus rapprochés.', harder: 'Buts plus écartés.',
  success: 'Les deux buts restent protégés.',
  layout: { minis: [[98.5, 20, 90], [98.5, 80, 90], [1.5, 50, 90]], formations: () => [[20, 40], [20, 60]], formationsAway: () => [[76, 34], [76, 66]], ball: 'b1', script: [
    ['b1', [48, 30], 'd', 'Le porteur part'], ['b2', [54, 70], 'c+', 'Son partenaire l’accompagne'], ['r1', [64, 32], 'c+', 'Un défenseur cadre'], ['r2', [80, 54], 'c+', 'L’autre couvre le second but']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Joueur lancé dans la zone', obj: 'Occuper la largeur, trouver le joueur lancé',
  id: 'mc-joueur-lance', likes: 6, title: 'Jeu des quatre zones', theme: 'Largeur', phase: 'ballon', type: 'Jeu',
  players: [12, 12, 14], size: [30, 40], duration: 15, intensity: 3,
  src: MYCOACH.src('Jeu des 4 zones', 'Samy Makhloufi', 'FC Drouais'),
  goal: 'Marquer en trouvant un partenaire lancé dans une des quatre zones de bout, sans y stationner.',
  rules: [
    'Terrain de 40 × 30, une zone à chaque extrémité de chaque côté (quatre zones).',
    'Point : passe à un partenaire lancé dans une zone, qui récupère le ballon dedans.',
    'Interdit de marquer deux fois de suite dans la même zone, et de stationner dans une zone.',
    'Variante : si le joueur lancé retrouve ensuite un partenaire à l’extérieur = 2 points.'
  ],
  coach: ['Prendre l’espace, toujours en mouvement.', 'Limiter les touches.', 'Prise d’information avant la passe.'],
  posture: 'Au bord : il vérifie que personne ne stationne.',
  expect: ['Trouver un joueur lancé.', 'Changer de zone.', 'Marquer 2 points.'],
  easier: 'Zones plus grandes.', harder: 'Deux touches.',
  success: 'La largeur est occupée.',
  layout: { zones: [[0, 0, 12, 40, ''], [0, 60, 12, 40, ''], [88, 0, 12, 40, ''], [88, 60, 12, 40, '']],
    formations: n => MYCOACH.grid(n, 16, 10, 84, 90), formationsAway: n => MYCOACH.grid(n, 22, 18, 78, 82).map(([x, y]) => [x + 4, y + 5]), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Circulation'], ['b5', [92, 20], 'c+', 'Appel lancé dans la zone'], ['b2', [92, 20], 'p', 'Passe dans la course : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'De 2 contre 1 à 7 contre 7', obj: 'Marquer en supériorité, défendre en infériorité',
  id: 'mc-vagues-grossissent', likes: 6, title: 'De 2 contre 1 jusqu’à 7 contre 7', theme: 'Finition', phase: 'ballon', type: 'Situation',
  players: [14, 16, 16], size: [45, 55], duration: 20, intensity: 4,
  src: MYCOACH.src('2 VS 1, 3 vs 2, 4 vs 3, 5 vs 4, 6 vs 5, 7 vs 6, 7 vs 7', 'Jérôme Mauri', 'JS Istres'),
  goal: 'Chaque frappe fait entrer deux adversaires : 2 contre 1, puis 3 contre 2… jusqu’à 7 contre 7.',
  rules: [
    'Un bleu part en conduite et frappe avant la surface adverse.',
    'Dès sa frappe, deux rouges entrent (un avec le ballon) : 2 contre 1 vers le but bleu ; le bleu fait du recul-frein.',
    'Après la frappe rouge, deux bleus entrent : 3 contre 2. Et ainsi de suite jusqu’à ce que tout le monde soit entré.',
    'On compte les buts de chaque équipe.'
  ],
  coach: ['Frapper vite en supériorité.', 'En infériorité : reculer, freiner, fermer l’axe.', 'Les entrants démarrent dès la frappe.'],
  posture: 'Sur la touche, au milieu : il lance les entrées.',
  expect: ['Frapper à chaque vague.', 'Marquer en supériorité.', 'Empêcher la frappe en infériorité.'],
  easier: 'Un seul entrant par vague.', harder: 'Frappe obligatoire en 6 secondes.',
  success: 'Des vagues enchaînées sans temps mort.',
  also: [MYCOACH.physique('Vagues à haute intensité', 'Sur la touche : il enchaîne les vagues et chronomètre la récupération.')],
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], formations: () => [[30, 50], [8, 10], [8, 90], [14, 10], [14, 90], [20, 10], [20, 90]], formationsAway: () => [[92, 8], [92, 92], [86, 8], [86, 92], [80, 8], [80, 92], [74, 8]], ball: 'b1', script: [
    ['b1', [66, 50], 'd', 'Un bleu part en conduite'], ['b1', 'butR', 's', 'Frappe'],
    ['r1', [70, 30], 'c', 'Deux rouges entrent : 2 contre 1'], ['r2', [70, 70], 'c+', ''], ['b1', [50, 50], 'c+', 'Le bleu recule-freine']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'nepossede', sub: 'Zone 3 · Défendre haut', name: 'Presser la relance', obj: 'Récupérer haut pour aller vite vers l’avant',
  id: 'mc-presser-relance', likes: 65, title: 'Pressing sur la relance', theme: 'Pressing', phase: 'sans', type: 'Jeu',
  players: [14, 16, 16], size: [60, 75], duration: 30, intensity: 3,
  src: MYCOACH.src('Pressing', 'Timothée Bennoit', 'SO Velleronnais'),
  goal: 'Trois périodes de plus en plus ouvertes : les rouges pressent la relance bleue et attaquent le but après la récupération.',
  rules: [
    'Le ballon part toujours du gardien bleu ; les défenseurs bleus jouent dans la zone 1.',
    'Période 1 (4 min) : les défenseurs font circuler dans la largeur, sans pressing.',
    'Période 2 (8 min) : ils cherchent le milieu défensif ; les rouges pressent. Milieu trouvé et retourné = 1 point bleu.',
    'Période 3 (8 min) : le latéral peut venir recevoir en zone 2. Récupération rouge en zone 1 puis but = 2 points.'
  ],
  coach: ['Presser au signal : passe vers le latéral, contrôle raté, passe en retrait.', 'L’attaquant coupe la relance d’un côté.', 'À la récupération, frapper vite.'],
  posture: 'Sur la touche, à la ligne de la zone 1 : il annonce les périodes et le signal de pressing.',
  expect: ['Presser ensemble au signal.', 'Empêcher le milieu de se retourner.', 'Récupérer et marquer.'],
  easier: 'Période 2 seulement.', harder: 'Bleus à un de plus en relance.',
  success: 'Des récupérations hautes suivies de frappes.',
  also: [{ moment: 'possede', sub: 'Zone 1 · Construire le jeu', obj: 'Relancer sous pression',
    posture: 'Derrière le but bleu : il observe la relance et le placement du milieu défensif.',
    coach: ['Écarter les défenseurs centraux.', 'Le milieu se montre entre les attaquants.'],
    expect: ['Circuler sans perte.', 'Trouver le milieu.', 'Ressortir en zone 2.'] }],
  layout: { goals: [[1.5, 50, 90]], keepersAt: [[5, 50]], zones: [[0, 0, 35, 100, 'Zone 1'], [35, 0, 30, 100, 'Zone 2']],
    formations: n => [[16, 30], [16, 70], [22, 8], [22, 92], [36, 50], [50, 30], [50, 70], [64, 50]].slice(0, n), formationsAway: n => [[30, 50], [36, 24], [36, 76], [48, 50], [58, 30], [58, 70], [72, 50], [78, 26]].slice(0, n), ball: 'gb', script: [
    ['gb', 'b1', 'p', 'Relance courte'], ['b1', 'b3', 'p', 'Passe au latéral : signal'],
    ['r2', [24, 12], 'c+', 'Pressing sur le latéral'], ['r1', [18, 34], 'c+', 'Le retour est coupé'], ['r4', [34, 40], 'c+', 'Le milieu est pris'],
    ['r2', [22, 10], 'c', 'Récupération haute'], ['r2', 'r1', 'p', ''], ['r1', 'butB', 's', 'Frappe vite']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'recupere', sub: 'Zone 2 · Chercher la zone 3', name: 'Buts de couleur', obj: 'Choisir : conserver ou marquer en 8 secondes',
  id: 'mc-buts-couleur', likes: 5, title: 'Échauffement conservation et transition', theme: 'Transition', phase: 'transition', type: 'Jeu',
  players: [14, 16, 16], size: [30, 30], duration: 20, intensity: 3,
  src: MYCOACH.src('Echauffement conservation / transition', 'Grégory Joly', 'US Colomiers'),
  goal: '8 contre 8, quatre mini-buts de couleur : 10 passes puis but de la couleur annoncée ; à la récupération, but en 8 secondes.',
  rules: [
    'Quatre mini-buts au milieu des côtés, une couleur par paire de buts face à face.',
    'Temps 1 : une équipe conserve ; 10 passes = 1 point, puis elle peut marquer dans le but de la couleur annoncée (+1).',
    'À la récupération, l’autre équipe doit marquer dans un des buts en moins de 8 secondes.',
    'Temps 2 : on inverse. Temps 3 : à la récupération, on choisit de marquer en 8 s ou de repartir en conservation.'
  ],
  coach: ['Occuper l’espace, se démarquer, communiquer.', 'Resserrer sur le porteur à la perte.', 'Réactivité à la récupération.'],
  posture: 'Au bord du carré : il annonce les couleurs et compte les 8 secondes.',
  expect: ['10 passes.', 'Marquer en 8 secondes.', 'Faire le bon choix au temps 3.'],
  easier: '12 secondes.', harder: 'Marquage individuel.',
  success: 'Des transitions rapides et des choix justes.',
  also: [{ moment: 'echauffement', sub: 'Mise en route', obj: 'S’échauffer en conservant', posture: 'Au bord : il fait monter l’intensité.',
    coach: ['Démarrer tranquillement.', 'Accélérer à chaque temps.'], expect: ['Bouger.', '10 passes.', 'Marquer.'] }],
  layout: { minis: [[50, 1.5, 0], [98.5, 50, 90], [50, 98.5, 0], [1.5, 50, 90]], formations: n => MYCOACH.grid(n, 10, 10, 90, 90), formationsAway: n => MYCOACH.grid(n, 18, 18, 82, 82).map(([x, y]) => [x + 5, y + 5]), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Conservation'], ['b2', 'r1', 'p', 'Récupération rouge'], ['r1', 'r3', 'p', ''], ['r3', [98.5, 50], 's', 'But en moins de 8 secondes']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', name: 'Recul-frein en 1 contre 1', obj: 'Freiner sans se jeter',
  id: 'mc-recul-frein', likes: 5, title: 'Animation défensive en 1 contre 1', theme: 'Technique défensive', phase: 'sans', type: 'Jeu',
  players: [6, 6, 8], size: [25, 25], duration: 15, intensity: 4, defenders: 3,
  src: MYCOACH.src('Animation défensive en 1 vs 1', 'Vincent Chollet', 'Fontcouverte'),
  goal: '1 contre 1 au milieu : éliminer son adversaire et passer à travers la porte à son partenaire, qui entre à son tour.',
  rules: [
    'Deux portes face à face, deux joueurs derrière chaque porte, un joueur de chaque équipe au milieu.',
    'Le porteur élimine son adversaire et passe à son partenaire à travers la porte d’en face ; celui-ci entre, le passeur prend sa place.',
    'Si le défenseur récupère, il devient attaquant.',
    'Ballon sorti ou passe ratée : on relance depuis la source derrière les portes.'
  ],
  coach: ['Recul-frein : reculer en freinant, pas se jeter.', 'Fléchi, de côté, sur ses appuis.', 'Intervenir au bon moment.'],
  posture: 'Au bord : il ne corrige que le défenseur.',
  expect: ['Ne pas se jeter.', 'Retarder l’attaquant.', 'Récupérer.'],
  easier: 'Zone plus étroite.', harder: 'Zone plus large.',
  success: 'Le défenseur gagne souvent sans faute.',
  layout: { cones: [[1, 40], [1, 60], [99, 40], [99, 60]], formations: () => [[40, 50], [4, 30], [4, 70]], formationsAway: () => [[60, 50], [96, 30], [96, 70]], ball: 'b1', script: [
    ['b1', [56, 40], 'd', 'L’attaquant attaque son adversaire'], ['r1', [66, 44], 'c+', 'Recul-frein'], ['b1', [72, 30], 'd', ''], ['b1', [99, 50], 'p', 'Passe dans la porte']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'perd', sub: 'Zone 3 · Pressing', name: 'Envahir les carrés', obj: 'Presser à plusieurs dans un espace réduit',
  id: 'mc-carres-taureau', likes: 5, title: 'Taureau et conservation sous pression', theme: 'Pressing', phase: 'sans', type: 'Jeu',
  players: [16, 16, 16], size: [20, 20], duration: 15, intensity: 3,
  src: MYCOACH.src('taureau + conservation sous pression', 'Jérôme Mauri', 'JS Istres'),
  goal: 'Quatre carrés de 4 joueurs qui se passent le ballon en une touche ; au signal, une équipe envoie ses joueurs presser les trois autres carrés.',
  rules: [
    'Quatre carrés, une équipe de 4 par carré, un ballon par carré, passes en une touche.',
    'Le coach désigne une équipe : un joueur part presser un carré, un autre un deuxième carré, les deux derniers le troisième.',
    'But des presseurs : récupérer ou sortir le ballon du carré.',
    'On compte combien de ballons chaque équipe arrive à sortir.'
  ],
  coach: ['Partir tout de suite au signal.', 'Presser en coupant la passe facile.', 'À deux : un presse, l’autre coupe.'],
  posture: 'Au centre des quatre carrés : il désigne l’équipe qui presse.',
  expect: ['Partir vite.', 'Sortir un ballon.', 'Sortir trois ballons.'],
  easier: 'Deux touches dans les carrés.', harder: 'Un seul presseur par carré.',
  success: 'Des ballons sortis vite.',
  also: [{ moment: 'echauffement', sub: 'Mise en route', obj: 'Se mettre en train en conservant', posture: 'Au centre : il fait monter l’intensité.',
    coach: ['Une touche.', 'Bouger après la passe.'], expect: ['Conserver.', 'Une touche.', 'Résister à la pression.'] }],
  layout: { thirdTeam: true, zones: [[0, 0, 46, 46, ''], [54, 0, 46, 46, ''], [0, 54, 46, 46, ''], [54, 54, 46, 46, '']],
    formations: () => [[6, 6], [40, 6], [6, 40], [40, 40], [60, 6], [94, 6], [60, 40], [94, 40]], formationsAway: () => [[6, 60], [40, 60], [6, 94], [40, 94], [60, 60], [94, 60], [60, 94], [94, 94]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Une touche dans chaque carré'], ['r5', [30, 30], 'c+', 'Signal : les rouges envahissent'], ['r6', [76, 30], 'c+', ''], ['r7', [30, 60], 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 0, moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', name: 'Défense à 4, deux par zone', obj: 'Coordonner les déplacements de la ligne',
  id: 'mc-defense-a-quatre', likes: 5, title: 'Déplacement de la défense à 4', theme: 'Bloc', phase: 'sans', type: 'Situation',
  players: [12, 12, 13], size: [50, 64], duration: 30, intensity: 3, defenders: 4,
  src: MYCOACH.src('Déplacement défense à 4', 'Norbert Toscano', ''),
  goal: 'Six attaquants contre quatre défenseurs, toujours deux défenseurs par zone ; le latéral opposé resserre dans l’axe.',
  rules: [
    '6 attaquants (bleus) contre 4 défenseurs (rouges), deux appuis neutres dans la surface (2 touches, ils ne jouent pas entre eux).',
    'Les défenseurs restent toujours deux par zone.',
    'Ballon côté opposé : le latéral resserre dans l’axe.',
    'Les attaquants marquent dans une des trois petites cages.'
  ],
  coach: ['Coulisser ensemble.', 'Deux par zone en permanence.', 'Le latéral opposé ferme l’axe.'],
  posture: 'Derrière la ligne : il compte les défenseurs par zone.',
  expect: ['Deux par zone.', 'Fermer l’axe.', 'Récupérer.'],
  easier: '5 attaquants.', harder: 'Appuis à une touche, jeu plus rapide.',
  success: 'La ligne bouge en bloc.',
  layout: { minis: [[98.5, 25, 90], [98.5, 50, 90], [98.5, 75, 90]], supports: [[90, 40], [90, 60]], zones: [[60, 0, 40, 33.3, ''], [60, 33.3, 40, 33.4, ''], [60, 66.7, 40, 33.3, '']],
    formations: () => [[40, 10], [40, 90], [44, 35], [44, 65], [54, 25], [54, 75]], formationsAway: () => [[74, 20], [76, 40], [76, 60], [74, 80]], ball: 'b1', script: [
    ['b1', 'b5', 'p', 'Le jeu va d’un côté'], ['r1', [70, 18], 'c+', 'La ligne coulisse'], ['r4', [76, 62], 'c+', 'Le latéral opposé resserre']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'recupere', sub: 'Zone 3 / Box · Marquer le but', name: 'Tirer puis défendre', obj: 'Changer de statut sans perdre de temps',
  id: 'mc-tirer-defendre', likes: 5, title: 'Transitions en 1 contre 1', theme: 'Transition', phase: 'transition', type: 'Jeu',
  players: [6, 12, 12], size: [20, 20], duration: 15, intensity: 4, defenders: f => Math.floor(f / 2),
  src: MYCOACH.src('Travail de transition offensif/défensif', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Le jaune conduit et frappe dans un petit but ; au moment de sa frappe, le bleu part attaquer l’autre but et le tireur va défendre.',
  rules: [
    'Deux petits buts face à face, une zone de frappe devant chacun.',
    'Le premier conduit vers un but, il ne peut frapper qu’une fois entré dans la zone de frappe.',
    'Au moment de sa frappe, un joueur adverse part avec un ballon vers l’autre but ; le tireur se retourne et défend.',
    'Et ainsi de suite, beaucoup de ballons pour enchaîner.'
  ],
  coach: ['Concentré au moment du changement de statut.', 'Ne pas perdre de temps après la frappe.', 'Défendre l’axe tout de suite.'],
  posture: 'Entre les deux buts : il garde les ballons prêts.',
  expect: ['Frapper.', 'Revenir défendre tout de suite.', 'Empêcher le but adverse.'],
  easier: 'Buts plus proches.', harder: 'Buts plus éloignés, gardien.',
  success: 'Des changements de statut immédiats.',
  also: [{ moment: 'perd', sub: 'Zone 1 / Box · Défendre le but', obj: 'Défendre juste après avoir tiré', posture: 'Entre les buts : il observe le repli.',
    coach: ['Se retourner tout de suite.', 'Se placer entre le ballon et le but.'], expect: ['Revenir.', 'Retarder.', 'Récupérer.'] }],
  layout: { minis: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[0, 30, 25, 40, 'Frappe'], [75, 30, 25, 40, 'Frappe']], ballsFor: ['r1'],
    formations: n => Array.from({ length: n }, (_, i) => [8 + i * 3, 6]), formationsAway: n => Array.from({ length: n }, (_, i) => [92 - i * 3, 94]), ball: 'b1', script: [
    ['b1', [80, 40], 'd', 'Conduite vers la zone de frappe'], ['b1', [98.5, 50], 's', 'Frappe'], ['r1', [24, 60], 'd+', 'L’adversaire part au même moment'], ['b1', [40, 56], 'c', 'Le tireur revient défendre']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', moment: 'physique', sub: 'Buts dos à dos', name: 'Buts dos à dos', obj: 'Endurance capacité en attaquant une défense placée',
  id: 'mc-buts-dos-a-dos', likes: 5, title: 'Attaquer face à une défense placée', theme: 'Physique', phase: 'ballon', type: 'Jeu',
  players: [14, 16, 16], keepers: 2, size: [50, 85], duration: 30, intensity: 3, series: [480, 120],
  src: MYCOACH.src('2/3 Attaquer face à une défense placée', 'Olivier Daviet', 'Garches Vaucresson FC'),
  goal: 'Deux buts dos à dos au centre : chaque équipe défend dans son camp et attaque dans le camp adverse.',
  rules: [
    '7 contre 7 sur 85 × 50, deux buts dos à dos au centre du terrain.',
    'Chaque équipe défend son but dans son camp et attaque l’autre but dans le camp adverse.',
    'Ballon récupéré dans le camp adverse : passage obligatoire par son joueur soutien (fixe dans le couloir, attaquable) avant d’attaquer.',
    'Variantes : hors-jeu compté ; 2 touches maximum.'
  ],
  coach: ['Attaquer patiemment une défense placée.', 'Utiliser le soutien pour relancer.', 'Rythme continu.'],
  posture: 'Au centre, entre les buts : il chronomètre les séquences.',
  expect: ['Passer par le soutien.', 'Frapper.', 'Tenir l’intensité.'],
  easier: 'Pas de soutien obligatoire.', harder: '2 touches.',
  success: 'Des attaques construites malgré la fatigue.',
  layout: { goals: [[46, 50, 90], [54, 50, 90]], keepersAt: [[42, 50], [58, 50]], zones: [[50, 0, .01, 100, '']],
    formations: n => [[20, 30], [20, 70], [30, 50], [64, 30], [64, 70], [78, 50], [86, 10]].slice(0, n), ball: 'b4', script: [
    ['b4', 'b6', 'p', 'Les bleus attaquent dans le camp rouge'], ['b6', [54, 50], 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', name: 'Empêcher la passe au joueur cible', obj: 'Se placer sur l’axe ballon-but',
  id: 'mc-joueur-cible', likes: 5, title: 'Placement et déplacement sur l’axe ballon-but', theme: 'Bloc', phase: 'sans', type: 'Situation',
  players: [13, 14, 14], size: [40, 30], duration: 15, intensity: 3, defenders: 6,
  src: MYCOACH.src('travailler le placement et le déplacement sur l’axe ballon-but', 'Rochedi Athamnia', ''),
  goal: 'Les attaquants, fixes dans leurs zones, cherchent le joueur cible en 20 secondes ; les défenseurs en deux lignes coulissent sur l’axe ballon-but.',
  rules: [
    'Entre la surface et le rond central. Attaquants fixes autour, un joueur cible devant le but ; défenseurs en deux lignes devant la zone de hors-jeu.',
    'Attaquants : trouver le joueur cible en moins de 20 s = 1 point ; s’il marque en moins de 3 s = 2 points. Passe au cible du côté du ballon, au sol.',
    'Défenseurs : 1 point si pas de passe au cible en 20 s ; récupération et but en 3 s face au gardien = 2 points.',
    '10 ballons puis on inverse. Variantes : un attaquant peut entrer balle au pied, un second se place entre les lignes.'
  ],
  coach: ['Toujours entre le ballon et le but.', 'Coulisser ensemble côté ballon.', 'Fermer la passe vers le cible.'],
  posture: 'Derrière les défenseurs : il observe l’alignement sur l’axe ballon-but.',
  expect: ['Coulisser.', 'Fermer la passe au cible.', 'Récupérer et marquer.'],
  easier: '15 secondes.', harder: '30 secondes.',
  success: 'Le cible est rarement trouvé.',
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], supports: [[86, 50, 'C']], zones: [[78, 0, .01, 100, '']],
    formations: () => [[20, 10], [20, 40], [20, 60], [20, 90], [8, 30], [8, 70]], formationsAway: () => [[46, 25], [46, 50], [46, 75], [62, 30], [62, 50], [62, 70]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Circulation'], ['r1', [42, 18], 'c+', 'Les lignes coulissent côté ballon'], ['r4', [60, 22], 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Arrêt sur image', obj: 'Identifier la meilleure option',
  id: 'mc-scanning', likes: 4, title: 'Scanning : vision du jeu', theme: 'Prise d’information', phase: 'ballon', type: 'Jeu',
  players: [12, 16, 16], size: [40, 55], duration: 20, intensity: 2,
  src: MYCOACH.src('SCANNING : Vision du jeu', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Match normal ; au sifflet, tout le monde s’arrête et le joueur nommé dit, sans regarder, la meilleure option de jeu.',
  rules: [
    'Expliquer le scanning : les très bons joueurs regardent autour d’eux 6 à 8 fois avant de recevoir.',
    'Match normal. Au sifflet, tout le monde s’arrête sur place.',
    'Le coach nomme un joueur, qui le regarde dans les yeux et annonce la meilleure option sans se retourner (retour au gardien, renversement, profondeur, une-deux, frappe…).',
    'On peut aussi demander où se trouve un joueur précis. Le coach corrige, le jeu reprend.'
  ],
  coach: ['Regarder autour de soi avant de recevoir.', 'Connaître la position de ses partenaires.', 'Proposer des solutions visibles.'],
  posture: 'Au bord du terrain : il choisit le moment de siffler.',
  expect: ['Donner une option.', 'Donner la bonne option.', 'Situer un partenaire sans regarder.'],
  easier: 'Le joueur peut regarder une seconde.', harder: 'Deux options demandées.',
  success: 'Les joueurs regardent avant de recevoir.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], formations: n => [[16, 30], [16, 70], [30, 50], [42, 20], [42, 80], [54, 50], [64, 30], [64, 70]].slice(0, n), ball: 'b3', script: [
    ['b3', 'b6', 'p', 'Le jeu se déroule'], ['b6', [56, 50], 'c', 'Sifflet : arrêt sur image']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Onze contre cinq', obj: 'Progresser en supériorité selon nos principes',
  id: 'mc-onze-contre-cinq', likes: 4, title: 'Principe du 11 à 0', theme: 'Animation offensive', phase: 'ballon', type: 'Jeu',
  players: [16, 18, 18], size: [64, 100], duration: 20, intensity: 2, defenders: 5,
  src: MYCOACH.src('principe du 11 à 0', 'Gilles Malfatti', 'FC Marensin'),
  goal: 'Le onze de départ progresse jusqu’au but contre quelques défenseurs ; à la perte, pressing pendant 3 secondes.',
  rules: [
    'Le onze de départ, chacun à son poste, face à 5 défenseurs (10 contre 5 par exemple) et un gardien.',
    'Progresser selon nos principes de jeu jusqu’à la finition.',
    'À la perte, pressing de 3 secondes pour récupérer ; sinon, on repart de la source.',
    '5 départs, puis on ajoute des défenseurs.'
  ],
  coach: ['Se situer par rapport à la progression du ballon.', 'Respecter les principes de jeu.', 'Réagir tout de suite à la perte.'],
  posture: 'Sur la touche : il arrête le jeu pour replacer.',
  expect: ['Progresser sans perte.', 'Finir l’action.', 'Récupérer en 3 secondes à la perte.'],
  easier: '11 contre 3.', harder: '11 contre 7.',
  success: 'Les principes de jeu sont visibles.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], formations: n => [[18, 15], [16, 38], [16, 62], [18, 85], [32, 30], [30, 50], [32, 70], [46, 15], [48, 50], [46, 85], [60, 50]].slice(0, n),
    formationsAway: () => [[80, 35], [80, 65], [66, 30], [66, 70], [70, 50]], ball: 'gb', script: [
    ['gb', 'b2', 'p', 'Départ du gardien'], ['b2', 'b6', 'p', ''], ['b6', 'b8', 'p', 'Progression'], ['b11', [84, 46], 'c+', ''], ['b8', 'b11', 'p', ''], ['b11', 'butR', 's', 'Finition']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'L’appel et la dernière passe', obj: 'Donner le ballon au bon moment',
  id: 'mc-derniere-passe', likes: 4, title: 'Travailler l’appel et la dernière passe', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [5, 8, 12], size: [45, 50], duration: 20, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('Travailler l’appel et la dernière passe', 'Anthony Barreto', 'US Vivo 04'),
  goal: 'Quatre mannequins figurent la défense : trois circuits de dernière passe, entre les centraux, entre latéral et central, par-dessus.',
  rules: [
    'Circuit 1 : A sert B, qui trouve C entre les deux défenseurs centraux ; finition en 2 touches maximum.',
    'Circuit 2 : A’ sert B, qui cherche D lancé entre le latéral et le central.',
    'Circuit 3 : A’ sert B, qui cherche E à l’opposé, par-dessus la défense.',
    'On tourne les postes.'
  ],
  coach: ['Prise de balle orientée vers l’appel.', 'Prendre l’info sur l’appel avant de recevoir.', 'Donner au bon moment, ni trop tôt ni trop tard.'],
  posture: 'Derrière les mannequins : il juge le timing de la passe.',
  expect: ['Bonne prise de balle.', 'Passe au bon moment.', 'But en 2 touches.'],
  easier: 'Appel annoncé.', harder: 'Un défenseur réel à la place d’un mannequin.',
  success: 'Les appels sont servis dans la course.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[72, 20], [74, 40], [74, 60], [72, 80]], start: [30, 50], home: [[30, 50], [50, 50], [62, 45], [62, 28], [62, 88]], ball: [33, 53], moves: [
    [33, 53, 48, 50, 'p', 'A sert B'], [62, 45, 84, 50, 'c+', 'Appel entre les centraux'], [50, 50, 84, 50, 'p', 'Dernière passe'], [84, 50, 98, 48, 's', 'Finition'],
    [62, 28, 84, 30, 'c', 'Circuit 2 : appel entre latéral et central'], [62, 88, 86, 70, 'c+', 'Circuit 3 : appel à l’opposé']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'nepossede', sub: 'Zone 3 · Défendre haut', name: 'Bloc haut', obj: 'Défendre en avançant, récupérer chez l’adversaire',
  id: 'mc-bloc-haut', likes: 20, title: 'Bloc haut et transition', theme: 'Pressing', phase: 'sans', type: 'Jeu',
  players: [16, 18, 18], size: [55, 70], duration: 30, intensity: 3,
  src: MYCOACH.src('défendre avec un bloc haut + transition offensive', 'Johan Roubault', 'AS Aix-en-Provence'),
  goal: 'Récupérer le ballon dans le camp adverse et marquer vite.',
  rules: [
    '8 contre 8 + gardiens, jeu libre, hors-jeu à la ligne médiane.',
    'But = 1 point. Récupération dans le camp adverse = 1 point. Récupération dans le camp adverse puis but = 3 points.',
    'Ballon sorti : on repart du gardien.',
    'Variantes : contrôle obligatoire, jeu au sol ou aérien, joker.'
  ],
  coach: ['Défendre en avançant, ligne défensive haute.', 'Sortir sur le temps de passe.', 'Après la récupération, aller au but tout de suite.'],
  posture: 'Sur la touche, à la ligne médiane : il compte les récupérations dans le camp adverse.',
  expect: ['Récupérer dans le camp adverse.', 'Frapper après la récupération.', 'Marquer 3 points.'],
  easier: 'Récupération dans le camp adverse = 2 points.', harder: 'Les 3 points seulement si le but arrive en moins de 8 secondes.',
  success: 'Le bloc récupère haut et finit vite.',
  also: [{ moment: 'recupere', sub: 'Zone 3 / Box · Marquer le but', obj: 'Marquer vite après une récupération haute',
    posture: 'Derrière le but : il chronomètre le temps entre récupération et frappe.',
    coach: ['Regarder le but dès la récupération.', 'Deux joueurs attaquent la surface.'],
    expect: ['Frapper.', 'Frapper en moins de 8 secondes.', 'Marquer.'] }],
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[50, 0, .01, 100, '']],
    formations: n => [[16, 25], [16, 50], [16, 75], [30, 25], [30, 75], [32, 50], [44, 35], [44, 65]].slice(0, n), ball: 'r2', script: [
    ['b', 14, 'bloc', 'Le bloc bleu avance'], ['r2', 'r4', 'p', 'Relance rouge'],
    ['b6', [70, 30], 'c+', 'Sortie sur le temps de passe'],
    ['b6', [72, 30], 'c', 'Récupération dans le camp adverse'],
    ['b6', 'b8', 'p', ''], ['b8', 'butR', 's', 'But : 3 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'perd', sub: 'Zone 3 · Pressing', name: 'Bonus selon la zone de récupération', obj: 'Réagir à la perte, récupérer haut',
  id: 'mc-bonus-zone', likes: 4, title: 'Réaction à la perte du ballon', theme: 'Transition', phase: 'transition', type: 'Jeu',
  players: [14, 16, 16], size: [45, 55], duration: 15, intensity: 3,
  src: MYCOACH.src('Réaction à la perte du ballon', 'Ibrahim Coulibaly', 'Sarcelles AAS'),
  goal: 'Match en trois zones : un but marqué vite après une récupération vaut plus si elle a eu lieu haut.',
  rules: [
    'Terrain coupé en trois zones dans la longueur.',
    'Récupération en zone offensive puis but en moins de 4 passes = 3 points de bonus ; en zone médiane = 2 ; en zone défensive = 1.',
    'Variante : hors-jeu à la ligne de la zone défensive ; l’équipe sans ballon n’occupe que deux zones.',
    'Puis même chose avec un terrain plus long.'
  ],
  coach: ['Réagir tout de suite à la perte.', 'Presser à plusieurs pour récupérer haut.', 'Être efficace une fois le ballon récupéré.'],
  posture: 'Sur la touche : il annonce les bonus.',
  expect: ['Réagir à la perte.', 'Récupérer en zone médiane.', 'Marquer 3 points de bonus.'],
  easier: 'Moins de 6 passes.', harder: 'Moins de 3 passes.',
  success: 'Des récupérations hautes suivies de buts.',
  also: [{ moment: 'recupere', sub: 'Zone 3 / Box · Marquer le but', obj: 'Marquer vite après une récupération haute', posture: 'Derrière un but : il compte les passes après la récupération.',
    coach: ['Regarder le but tout de suite.', 'Deux joueurs dans la surface.'], expect: ['Frapper.', 'Marquer en 4 passes.', 'Marquer en 2 passes.'] }],
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[33.3, 0, .01, 100, ''], [66.6, 0, .01, 100, '']],
    formations: n => [[16, 30], [16, 70], [30, 50], [44, 25], [44, 75], [56, 50], [64, 30]].slice(0, n), ball: 'r3', script: [
    ['r3', 'r1', 'p', 'Relance rouge'], ['b6', [80, 34], 'c+', 'Pressing'], ['r1', 'b6', 'p', 'Récupération en zone offensive'], ['b6', 'b7', 'p', ''], ['b7', 'butR', 's', 'But : 3 points de bonus']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Relancer malgré le pressing', obj: 'Assurer la relance',
  id: 'mc-relance-pressing', likes: 4, title: 'Assurer la relance malgré le pressing', theme: 'Relance', phase: 'ballon', type: 'Situation',
  players: [11, 12, 14], size: [60, 60], duration: 20, intensity: 3,
  src: MYCOACH.src('Comment assurer la relance malgré un pressing adverse', 'Matthieu Baumann', 'US Carqueiranne-La Crau'),
  goal: 'À partir d’une passe en retrait vers un latéral, les bleus vont marquer dans une des deux portes sans traverser la zone centrale.',
  rules: [
    'Départ : passe en retrait vers un latéral.',
    'Les bleus doivent franchir une des deux portes de côté, sans que le ballon traverse la zone centrale.',
    'Les rouges pressent ; s’ils récupèrent, ils marquent dans le grand but.',
    '10 ballons, bilan avec le groupe, puis on change les rôles.'
  ],
  coach: ['Chacun se déplace en fonction de la position du ballon.', 'Offrir une solution courte et une longue.', 'Ne pas forcer dans l’axe.'],
  posture: 'Près des portes : il fait le bilan après 10 ballons.',
  expect: ['Relancer sans perte.', 'Franchir une porte.', 'Franchir une porte en moins de 6 passes.'],
  easier: 'Presseurs plus loin au départ.', harder: 'Un presseur de plus.',
  success: 'La relance sort proprement.',
  also: [{ moment: 'nepossede', sub: 'Zone 3 · Défendre haut', obj: 'Presser la relance', posture: 'Derrière les presseurs : il observe le déclenchement.',
    coach: ['Presser sur la passe en retrait.', 'Fermer l’axe pour pousser vers un côté.'], expect: ['Presser ensemble.', 'Récupérer.', 'Marquer.'] }],
  layout: { goals: [[1.5, 50, 90]], keepersAt: [[5, 50]], zones: [[30, 30, 40, 40, 'Zone interdite']], cones: [[70, 4], [70, 16], [70, 84], [70, 96]],
    formations: n => [[16, 30], [16, 70], [24, 8], [24, 92], [36, 50], [56, 20]].slice(0, n), formationsAway: n => [[30, 40], [30, 60], [40, 16], [40, 84], [56, 50]].slice(0, n), ball: 'b4', script: [
    ['b4', 'gb', 'p', 'Passe en retrait'], ['r3', [30, 22], 'c+', 'Pressing'], ['gb', 'b1', 'p', ''], ['b1', 'b3', 'p', ''], ['b3', 'b6', 'p', 'Le jeu sort par le côté'], ['b6', [72, 10], 'd', 'Porte franchie']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Combinaison en 4-2-3-1', obj: 'Coordonner les courses de finition',
  id: 'mc-combinaison-4231', likes: 5, title: 'Combinaison et finition en 4-2-3-1', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [5, 10, 14], size: [45, 55], duration: 20, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('Combinaison + finition système 4 2 3 1', 'Samy Makhloufi', 'FC Drouais'),
  goal: 'Passe à l’attaquant, appui-remise, ballon en profondeur sur le côté, puis trois arrivées : premier poteau, second poteau, entrée de surface.',
  rules: [
    'Deux joueurs par poste, source de ballons au milieu de terrain.',
    'Le 6 passe à l’attaquant, qui remet au joueur face à lui ; celui-ci lance le côté en profondeur.',
    'L’attaquant fait une course en arc de cercle et coupe au premier poteau ; le côté opposé ferme au second ; le 10 attaque l’entrée de la surface.',
    'Une fois à droite, une fois à gauche. Deux touches maximum. 3 séquences de 10 ballons.'
  ],
  coach: ['Courses dans le bon timing, appel-contre-appel.', 'Prise d’information avant la passe.', 'Communication.'],
  posture: 'À l’entrée de la surface : il compte les buts par séquence.',
  expect: ['Combinaison sans faute.', 'Trois zones occupées.', 'Marquer 5 fois sur 10.'],
  easier: 'Touches libres.', harder: 'Une touche.',
  success: 'Les trois arrivées sont synchronisées.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, start: [30, 50], home: [[30, 50], [66, 50], [50, 58], [60, 12], [60, 88], [52, 42]], ball: [33, 53], moves: [
    [33, 53, 63, 50, 'p', 'Passe à l’attaquant'], [66, 50, 52, 56, 'p', 'Appui-remise'], [60, 12, 80, 10, 'c+', 'Le côté part'], [52, 56, 80, 12, 'p', 'Profondeur'],
    [66, 50, 88, 40, 'c+', 'Arc de cercle, premier poteau'], [60, 88, 88, 62, 'c+', 'Second poteau'], [52, 42, 76, 50, 'c+', 'Entrée de surface'],
    [80, 12, 88, 40, 'p', 'Centre'], [88, 40, 98, 46, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Perte = gage physique', obj: 'Ne pas perdre le ballon inutilement',
  id: 'mc-perte-gage', likes: 5, title: 'Conservation du ballon et physique', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [12, 14, 16], size: [30, 35], duration: 15, intensity: 3,
  src: MYCOACH.src('Conservation du ballon & physique', 'Gary Lenzoni', 'Stade Nyonnais'),
  goal: 'Conservation à 6 contre 6 ou 7 contre 7 : celui qui perd le ballon sort faire un petit travail physique, puis revient vite.',
  rules: [
    'Conservation libre à 6 contre 6 ou 7 contre 7.',
    'Le joueur qui perd le ballon sort sur le côté : 5 squats, pompes ou abdos, ou un exercice de vivacité.',
    'Il revient tout de suite après : son équipe joue en infériorité pendant ce temps.',
    '10 passes = 1 point.'
  ],
  coach: ['Jouer simple quand on est sous pression.', 'Revenir vite pour aider son équipe.', 'Profiter de la supériorité quand un adversaire est sorti.'],
  posture: 'Au bord du terrain : il fixe le gage.',
  expect: ['10 passes.', 'Perdre peu de ballons.', 'Profiter de la supériorité.'],
  easier: 'Gage plus court.', harder: 'Deux touches.',
  success: 'Peu de pertes inutiles.',
  layout: { formations: n => MYCOACH.grid(n, 8, 10, 92, 90), formationsAway: n => MYCOACH.grid(n, 16, 18, 84, 82).map(([x, y]) => [x + 4, y + 5]), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Conservation'], ['b2', 'r1', 'p', 'Ballon perdu'], ['b2', [98, 50], 'c+', 'Le joueur sort faire son gage']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Jeu à trois en carrés', obj: 'Améliorer le jeu à trois',
  id: 'mc-jeu-a-trois', likes: 4, title: 'Exercice : jeu à trois', theme: 'Jeu à trois', phase: 'ballon', type: 'Exercice',
  players: [8, 10, 12], size: [20, 20], duration: 20, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('Exercice - jeu à 3', 'Johan Roubault', 'FC Annecy'),
  goal: 'Grand carré de 20 m, petit carré de 8 m au centre : remise, passe en diagonale, une-deux avec le soutien, puis passe au coin opposé.',
  rules: [
    'Deux ballons, départs en A et en A’ (coins opposés).',
    'A passe à C (petit carré), qui remet en une touche à B ; B joue en diagonale sur D.',
    'D fait un une-deux avec C, qui est venu en soutien ; D passe en A’, où un une-deux est fait.',
    'Rotation A → B → C → D. Variante : contrôle orienté de B, remise de D dans la course de soutien de C.'
  ],
  coach: ['Passe vers l’avant appuyée, remise freinée.', 'Le troisième homme se place sur une diagonale pour être vu.', 'Coordination porteur-receveur.'],
  posture: 'Au centre : il corrige le dosage des passes.',
  expect: ['Circuit sans faute.', 'Une touche sur les remises.', 'Deux ballons sans collision.'],
  easier: 'Un seul ballon.', harder: 'Une touche partout.',
  success: 'Le jeu à trois est fluide.',
  layout: { zones: [[30, 30, 40, 40, '']], start: [6, 6], home: [[6, 6], [94, 6], [38, 38], [94, 94], [6, 94], [62, 62]], ball: [9, 9], balls: [[91, 91]], moves: [
    [9, 9, 36, 36, 'p', 'A passe à C'], [38, 38, 92, 9, 'p', 'Remise sur B'], [94, 6, 91, 91, 'p', 'B joue en diagonale sur D'],
    [38, 38, 60, 60, 'c+', 'C vient en soutien'], [94, 94, 62, 62, 'p', 'Une-deux'], [62, 62, 92, 92, 'p', ''], [94, 94, 9, 91, 'p', 'Passe au coin opposé']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Finition en quatre étapes', obj: 'Bien finir devant le but',
  id: 'mc-finition-4-etapes', likes: 4, title: 'Spécifique attaquant : finition en quatre étapes', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [2, 4, 8], size: [25, 30], duration: 15, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Spécifique attaquant « Finition en 4 étapes »', 'Frédéric Bianco', 'FC Ponte Leccia Morosaglia'),
  goal: 'Quatre mannequins à l’entrée de la surface, un geste de finition par mannequin, puis les quatre à la suite.',
  rules: [
    'Mannequin 1 (gauche) : appel-contre-appel, contrôle pied gauche, frappe pied gauche.',
    'Mannequin 2 : contrôle orienté de l’intérieur, frappe.',
    'Mannequin 3 : contrôle orienté de l’extérieur, frappe.',
    'Mannequin 4 (droite) : appel-contre-appel, contrôle pied droit, frappe pied droit. D’abord un par un, puis enchaînés.'
  ],
  coach: ['Contrôle qui prépare la frappe.', 'S’appliquer sur la frappe.', 'Utiliser le pied du côté.'],
  posture: 'Au point de passe : il sert chaque étape.',
  expect: ['Contrôles réussis.', 'Frappes cadrées.', 'Les quatre étapes enchaînées.'],
  easier: 'Passes à la main.', harder: 'Enchaîner les quatre sans pause.',
  success: 'Contrôle et frappe propres aux quatre postes.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[70, 20], [70, 40], [70, 60], [70, 80]], start: [62, 20], home: [[62, 20], [40, 50]], ball: [43, 53], moves: [
    [62, 20, 70, 26, 'c', 'Appel-contre-appel'], [43, 53, 72, 28, 'p', 'Passe'], [72, 28, 80, 34, 'd', 'Contrôle pied gauche'], [81, 35, 98, 46, 's', 'Frappe pied gauche']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'perd', sub: 'Zone 3 · Pressing', name: 'Quatre chasseurs chez l’adversaire', obj: 'Sortir de la zone de pression',
  id: 'mc-chasses-camp', likes: 4, title: 'Transitions : sortir de la zone de pression', theme: 'Transition', phase: 'transition', type: 'Jeu',
  players: [14, 14, 14], size: [25, 40], duration: 20, intensity: 4, defenders: 7,
  src: MYCOACH.src('TRANSITIONS', 'Sébastien Languille', 'US Moyenne Durance'),
  goal: 'Deux équipes de 7, chacune dans son camp. L’équipe en possession est chassée par 4 adversaires ; à la récupération, le ballon repart dans l’autre camp.',
  rules: [
    'Terrain de 40 × 25 coupé en deux, une équipe de 7 dans chaque camp.',
    'L’équipe en possession doit faire 10 passes (1 point) contre 4 chasseurs adverses.',
    'À la récupération, les chasseurs renvoient le ballon dans leur camp ; leur équipe conserve à son tour.',
    'Le coach désigne 4 nouveaux chasseurs. Deux touches maximum.'
  ],
  coach: ['Créer des lignes de passe.', 'Utiliser tout l’espace.', 'Chasseurs : partir tout de suite et à quatre.'],
  posture: 'Sur la ligne médiane : il désigne les chasseurs.',
  expect: ['10 passes.', 'Récupérer et renvoyer vite.', 'Récupérer en moins de 10 passes.'],
  easier: '3 chasseurs.', harder: 'Une touche pour le renvoi.',
  success: 'Des transitions rapides entre les camps.',
  also: [{ moment: 'recupere', sub: 'Zone 1 · Jouer vers l’avant', obj: 'Renvoyer le ballon dans son camp', posture: 'Sur la ligne médiane : il observe la première passe.',
    coach: ['Première passe vers son camp.', 'Lever la tête à la récupération.'], expect: ['Renvoyer.', 'Renvoyer en une passe.', 'Puis 10 passes.'] }],
  layout: { zones: [[50, 0, .01, 100, '']], formations: () => [[6, 15], [22, 6], [40, 15], [6, 85], [22, 94], [40, 85], [24, 50]], formationsAway: () => [[18, 34], [30, 40], [18, 64], [32, 62], [80, 30], [80, 70], [94, 50]], ball: 'b1', script: [
    ['b1', 'b2', 'p', '10 passes contre 4 chasseurs'], ['r2', [28, 20], 'c+', 'Les chasseurs pressent'], ['b2', 'r2', 'p', 'Récupération'], ['r2', 'r5', 'p', 'Le ballon repart dans l’autre camp']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'ludique', sub: 'Course d’obstacles et frappe', name: 'Course d’obstacles et frappe', obj: 'Appuis, vitesse et finition en compétition',
  id: 'mc-obstacles-frappe', likes: 4, title: 'Appuis, vitesse et finition en compétition', theme: 'Ludique', phase: 'ballon', type: 'Jeu',
  players: [4, 8, 18], size: [15, 40], duration: 15, intensity: 4, params: { unit: 'joueurs' },
  src: MYCOACH.src('Appuis, vitesse et finition sous forme de compétition', 'Christophe Marchat', 'ES Douvaine-Loisin'),
  goal: 'Deux équipes en duel : slalom, haies, grande haie, puis passe sur une planche et frappe en une touche dans un mini-but.',
  rules: [
    'Deux parcours côte à côte. Au signal, un joueur de chaque équipe part.',
    'Slalom entre trois piquets, trois haies basses (un appui entre chaque), puis une haie haute avant de changer de direction.',
    'Passe sur la planche de rebond, frappe en une touche dans le mini-but.',
    'Le premier qui marque gagne le point pour son équipe.'
  ],
  coach: ['Appuis courts et rapides.', 'Changement de direction après la haie haute.', 'Frappe en une touche, placée.'],
  posture: 'Près des mini-buts : il donne le signal et compte les points.',
  expect: ['Finir le parcours.', 'Marquer.', 'Gagner le duel.'],
  easier: 'Contrôle autorisé avant la frappe.', harder: 'Mauvais pied pour la frappe.',
  success: 'Duels serrés et frappes propres.',
  also: [MYCOACH.physique('Vitesse et appuis avec frappe', 'Près des mini-buts : il impose une récupération complète.')],
  layout: { minis: [[98.5, 30, 90], [98.5, 70, 90]], cones: [[16, 30], [20, 30], [24, 30], [16, 70], [20, 70], [24, 70]], discs: [[40, 30], [44, 30], [48, 30], [40, 70], [44, 70], [48, 70]], zones: [[78, 24, 2, 12, 'Planche'], [78, 64, 2, 12, '']],
    start: [6, 30], home: [[6, 30], [6, 70]], balls: [[70, 30], [70, 70]], moves: [
    [6, 30, 66, 30, 'c', 'Slalom et haies'], [6, 70, 66, 70, 'c+', ''], [70, 30, 78, 30, 'p', 'Passe sur la planche'], [78, 30, 98.5, 30, 's', 'Frappe en une touche']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', keepers: 2, moment: 'physique', sub: '4 contre 4 en zones fixes', name: '4 contre 4 en zones fixes', obj: 'Développer la puissance aérobie',
  id: 'mc-zones-fixes', likes: 4, title: 'Jeu de finition avec des zones', theme: 'Physique', phase: 'ballon', type: 'Jeu',
  players: [10, 10, 10], size: [40, 40], duration: 24, intensity: 4, series: [240, 120],
  src: MYCOACH.src('Jeu de finition avec des zones', 'Olivier Daviet', 'Garches Vaucresson FC'),
  goal: '4 contre 4 + gardiens, terrain en six zones : chacun reste dans sa zone, les joueurs de côté couvrent deux zones.',
  rules: [
    '4 contre 4 + 2 gardiens sur 40 × 40, six zones.',
    'Les joueurs sont fixes dans leur zone ; ceux des côtés se déplacent sur deux zones dans la largeur.',
    'But = 1 point.',
    'Variantes : 6 secondes pour tirer ; gardiens à 2 touches.'
  ],
  coach: ['Rythme élevé en continu.', 'Se démarquer dans sa zone.', 'Frapper vite.'],
  posture: 'Sur la touche : il chronomètre.',
  expect: ['Frapper.', 'Marquer.', 'Tenir le rythme sur toutes les séries.'],
  easier: 'Séquences de 3 minutes.', harder: '6 secondes pour tirer.',
  success: 'Intensité constante.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[33.3, 0, .01, 100, ''], [66.6, 0, .01, 100, ''], [0, 50, 100, .01, '']],
    formations: () => [[20, 25], [20, 75], [50, 25], [80, 75]], formationsAway: () => [[80, 25], [80, 75], [50, 75], [20, 50]], ball: 'b1', script: [
    ['b1', 'b3', 'p', 'Passe dans la zone du milieu'], ['b3', 'b4', 'p', ''], ['b4', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'ludique', sub: 'Jeu du renard', name: 'Jeu du renard', obj: 'Échauffement ludique : attraper les queues',
  id: 'mc-renard', likes: 4, title: 'Jeu du renard', theme: 'Ludique', phase: 'sans', type: 'Jeu',
  players: [8, 16, 20], size: [15, 15], duration: 10, intensity: 2,
  src: MYCOACH.src('Jeu du renard', 'Axel Girard', 'C’Chartres Football'),
  goal: 'Chaque joueur a une chasuble dans le dos : prendre celles des autres équipes sans perdre la sienne.',
  rules: [
    'Deux ou trois équipes, une chasuble glissée à l’arrière de la ceinture, une couleur par équipe.',
    'Au signal, on attrape les chasubles des adversaires.',
    'Celui qui perd la sienne sort du terrain.',
    'La partie s’arrête quand il ne reste qu’une équipe. Ajouter des gammes (montées de genoux, pas chassés…).'
  ],
  coach: ['Prendre l’information autour de soi.', 'Communiquer pour cibler un adversaire.', 'Garder une bonne posture dans les gammes.'],
  posture: 'Au bord du carré : il impose la gamme de déplacement.',
  expect: ['Garder sa queue.', 'Prendre une queue.', 'Gagner avec son équipe.'],
  easier: 'Carré plus grand.', harder: 'Déplacements en pas chassés seulement.',
  success: 'Tout le monde est chaud et attentif.',
  also: [{ moment: 'echauffement', sub: 'Mise en route', obj: 'S’échauffer en jouant', posture: 'Au bord : il varie les gammes.',
    coach: ['Gammes correctes.', 'Ne pas faire durer.'], expect: ['Bouger.', 'Esquiver.', 'Gagner.'] }],
  layout: { formations: n => MYCOACH.grid(n, 10, 10, 90, 90), formationsAway: n => MYCOACH.grid(n, 18, 18, 82, 82).map(([x, y]) => [x + 4, y + 4]), script: [
    ['r1', [24, 22], 'c', 'Un renard attaque'], ['b1', [8, 34], 'c+', 'Le joueur esquive']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', name: 'Couverture alternée', obj: 'Cadrer et couvrir à deux',
  id: 'mc-couverture', likes: 19, title: 'Couverture alternée', theme: 'Technique défensive', phase: 'sans', type: 'Exercice',
  players: [6, 6, 8], size: [20, 20], duration: 20, intensity: 2, defenders: 2,
  src: MYCOACH.src('couverture alternée', 'Gilles Malfatti', 'FC Marensin'),
  goal: 'Deux défenseurs alternent : l’un cadre le porteur, l’autre protège la porte au centre.',
  rules: [
    'Carré de 20 m, quatre attaquants aux coins, une porte au milieu.',
    'Les attaquants se font des passes latérales ou vers l’avant, et passent dans la porte si elle s’ouvre.',
    'Un défenseur cadre le porteur, l’autre défend la porte ; ils échangent à chaque passe.',
    'Défenseurs changés toutes les 2 minutes. Interception seulement, pas de tacle.'
  ],
  coach: ['Sortir sur le temps de passe, freiner, fléchi.', 'Le couvreur se place entre le ballon et la porte.', 'Parler : « je sors », « je couvre ».'],
  posture: 'Près de la porte : il corrige la distance entre cadreur et couvreur.',
  expect: ['Alterner à chaque passe.', 'Aucune passe dans la porte.', 'Intercepter.'],
  easier: 'Porte plus étroite.', harder: 'Deux portes, un défenseur par porte.',
  success: 'L’alternance se fait sans trou.',
  layout: { cones: [[50, 42], [50, 58]], formations: () => [[6, 6], [94, 6], [94, 94], [6, 94]], formationsAway: () => [[30, 22], [50, 50]], ball: 'b1', script: [
    ['r1', [16, 16], 'c', 'Le premier cadre le porteur'],
    ['b1', 'b2', 'p', 'Passe'], ['r2', [80, 18], 'c+', 'Le second sort sur le nouveau porteur'], ['r1', [50, 50], 'c+', 'Le premier revient couvrir la porte'],
    ['b2', 'b3', 'p', ''], ['r1', [80, 80], 'c+', 'On échange encore'], ['r2', [50, 50], 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: '3 + 3 appuis contre 3', obj: 'Attendre le bon moment pour progresser',
  id: 'mc-3-plus-3', likes: 3, title: 'Conserver et marquer avec trois appuis', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [9, 9, 10], size: [20, 25], duration: 25, intensity: 3, defenders: 3,
  src: MYCOACH.src('3+3 (appui) VS 3 ; Conserver et marquer', 'Tristan Messin', 'Athletic Club Augny'),
  goal: 'Trois bleus, aidés de trois appuis (deux en largeur, un pivot), conservent puis marquent ; trois rouges récupèrent et visent les petits buts.',
  rules: [
    'Bleus + appuis (2 touches) contre 3 rouges. Pas de hors-jeu.',
    'Bleus : 1 point toutes les 15 secondes de conservation ; but dans le grand but = 3 points.',
    'Rouges : récupérer puis marquer dans un des petits buts = 1 point.',
    'On tourne les rôles.'
  ],
  coach: ['Utiliser toute la largeur et la profondeur.', 'Patience dans la construction.', 'Intensité dans les passes pour déséquilibrer.'],
  posture: 'Au bord : il chronomètre les 15 secondes.',
  expect: ['Conserver 15 secondes.', 'Trouver le pivot.', 'Marquer 3 points.'],
  easier: 'Appuis en touches libres.', harder: 'Appuis en une touche.',
  success: 'La progression se fait au bon moment.',
  layout: { minis: [[98.5, 50, 90], [1.5, 25, 90], [1.5, 75, 90]], supports: [[50, 2], [50, 98], [90, 50, 'P']],
    formations: () => [[24, 50], [40, 30], [40, 70]], formationsAway: () => [[56, 40], [56, 60], [70, 50]], ball: 'b1', script: [
    ['b1', 'a1', 'p', 'Appui en largeur'], ['a1', 'b3', 'p', ''], ['b3', 'a3', 'p', 'Le pivot'], ['a3', 'b2', 'p', 'Remise'], ['b2', [98.5, 50], 's', 'But : 3 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Six zones occupées', obj: 'Occuper l’espace quand on a le ballon',
  id: 'mc-six-zones', likes: 3, title: 'Conservation avec zones', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [12, 16, 16], size: [45, 55], duration: 35, intensity: 3,
  src: MYCOACH.src('Conservation de balle avec zones', 'Rodolphe Martins', 'US Lamorlaye'),
  goal: 'Conservation sur un demi-terrain en six zones : quand mon équipe a le ballon, chaque zone doit être occupée.',
  rules: [
    'Demi-terrain coupé en six zones, deux équipes.',
    'Quand une équipe a le ballon, chaque zone doit avoir au moins un de ses joueurs ; sinon, ballon rendu.',
    'Variante : passer de six à trois zones.',
    'Puis jeu libre sans zones : l’espace doit rester occupé.'
  ],
  coach: ['Équilibrer l’occupation.', 'Se déplacer vers la zone vide.', 'Garder l’espace occupé même sans repères.'],
  posture: 'Sur la touche : il siffle quand une zone est vide.',
  expect: ['Occuper toutes les zones.', 'Conserver 10 passes.', 'Garder l’occupation en jeu libre.'],
  easier: 'Trois zones.', harder: 'Deux touches.',
  success: 'L’espace est occupé naturellement.',
  layout: { zones: [[33.3, 0, .01, 100, ''], [66.6, 0, .01, 100, ''], [0, 50, 100, .01, '']],
    formations: n => [[16, 25], [16, 75], [50, 25], [50, 75], [84, 25], [84, 75], [30, 50], [70, 50]].slice(0, n), formationsAway: n => [[26, 36], [26, 64], [60, 36], [60, 64], [92, 40], [92, 60], [42, 50], [76, 50]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b3', 'p', 'Une zone, puis une autre'], ['b3', 'b5', 'p', ''], ['b5', 'b6', 'p', 'Toutes les zones occupées']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Quatre capitaines', obj: 'Fixer, trouver le troisième homme',
  id: 'mc-quatre-capitaines', likes: 3, title: 'Jeu des quatre capitaines', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [9, 9, 9], size: [15, 20], duration: 15, intensity: 3, oddJoker: true,
  src: MYCOACH.src('Jeu des 4 capitaines', 'Sébastien Cucheval', 'AS Violaines'),
  goal: '2 contre 2 + joker au centre ; chaque équipe a un capitaine dans chaque zone de bout : aller d’un capitaine à l’autre.',
  rules: [
    'Un capitaine rouge et un capitaine bleu dans chacune des deux zones de bout ; au centre 2 rouges, 2 bleus et le joker.',
    'Les bleus conservent : aller d’un capitaine bleu à l’autre = 1 point.',
    'À la récupération, les rouges trouvent un de leurs capitaines : ils passent en conservation.',
    'Pas de passe directe de capitaine à capitaine. 4 blocs de 4 minutes.'
  ],
  coach: ['Fixer avant de donner.', 'Le troisième homme se prépare pendant la passe.', 'Trouver le joueur lancé.'],
  posture: 'Au bord : il compte les points.',
  expect: ['Trouver un capitaine.', 'Aller d’un capitaine à l’autre.', 'Deux points par bloc.'],
  easier: 'Deux jokers.', harder: 'Capitaines en une touche.',
  success: 'Le ballon traverse souvent.',
  layout: { zones: [[0, 0, 15, 100, ''], [85, 0, 15, 100, '']], formations: () => [[7, 30], [93, 70], [36, 34], [60, 66]], formationsAway: () => [[7, 70], [93, 30], [44, 60], [62, 36]], jokerAt: [50, 50], ball: 'b1', script: [
    ['b1', 'b3', 'p', 'Départ du capitaine'], ['b3', 'j', 'p', 'Joker'], ['j', 'b4', 'p', 'Troisième homme'], ['b4', 'b2', 'p', 'Autre capitaine : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'perd', sub: 'Zone 3 · Pressing', name: 'Rondo à deux rectangles', obj: 'Contre-presser après la perte',
  id: 'mc-deux-rectangles', likes: 3, title: 'Rondo à deux rectangles enchevêtrés', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [9, 9, 12], size: [16, 24], duration: 15, intensity: 3, defenders: 2,
  src: MYCOACH.src('JP Rondo 2 rectangles', 'Franck Bouet', 'SC Narbonne Montplaisir'),
  goal: 'Deux rectangles qui se chevauchent : trois joueurs par rectangle, un quatrième commun aux deux, contre deux chasseurs.',
  rules: [
    'Deux rectangles de 16 × 12 qui se chevauchent. Trois bleus dans chaque rectangle, un bleu joue dans les deux.',
    'Deux chasseurs rouges ; s’ils récupèrent, ils marquent dans un des trois buts.',
    'Version grande (35 × 30) : cinq chasseurs (trois maximum par rectangle) ; à la récupération, stop-ball en moins de 6 s.',
    'Les bleus qui ont perdu le ballon contre-pressent tout de suite.'
  ],
  coach: ['Utiliser le joueur commun pour changer de rectangle.', 'À la perte, presser immédiatement.', 'Fermer le chemin vers les buts.'],
  posture: 'Entre les rectangles : il compte les récupérations.',
  expect: ['Conserver.', 'Changer de rectangle.', 'Récupérer en moins de 6 secondes après la perte.'],
  easier: 'Un seul chasseur.', harder: 'Version grande avec cinq chasseurs.',
  success: 'Contre-pressing immédiat à chaque perte.',
  layout: { zones: [[0, 0, 60, 60, ''], [40, 40, 60, 60, '']], minis: [[98.5, 20, 90], [1.5, 80, 90], [50, 98.5, 0]],
    formations: () => [[6, 8], [54, 8], [6, 52], [94, 46], [94, 94], [46, 94], [50, 50]], formationsAway: () => [[28, 30], [72, 70]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Conservation'], ['b2', 'b7', 'p', 'Le joueur commun'], ['b7', 'b5', 'p', 'Autre rectangle'], ['r2', [86, 80], 'c+', 'Le chasseur suit']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Sortir vers les trois petits buts', obj: 'Sortir du pressing adverse',
  id: 'mc-sortie-trois-minis', likes: 3, title: 'Sortie de balle face au pressing', theme: 'Relance', phase: 'ballon', type: 'Jeu',
  players: [10, 10, 12], size: [50, 60], duration: 20, intensity: 3,
  src: MYCOACH.src('Sortie de balle', 'Michaël Demerlier', 'ES Roncq'),
  goal: 'Les bleus sortent depuis leur gardien et marquent dans un des trois petits buts du milieu ; les rouges pressent haut et finissent vite.',
  rules: [
    'Les bleus se placent devant leur surface, gardien dans les buts ; les rouges en opposition.',
    'Le ballon part toujours du gardien.',
    'Bleus : sortir du pressing et marquer dans un des trois petits buts placés au milieu du terrain.',
    'Rouges : presser haut ; à la récupération, finir le plus vite possible dans le grand but.'
  ],
  coach: ['Lire le pressing : où est l’homme libre ?', 'Renverser le jeu pour sortir.', 'Passer vite de l’attaque à la défense.'],
  posture: 'Derrière le but bleu : il observe la relance.',
  expect: ['Sortir une fois.', 'Marquer dans un petit but.', 'Sortir par un renversement.'],
  easier: 'Rouges à un de moins.', harder: 'Rouges à égalité.',
  success: 'Des sorties propres malgré la pression.',
  also: [{ moment: 'nepossede', sub: 'Zone 3 · Défendre haut', obj: 'Presser haut la relance', posture: 'Au milieu : il observe le pressing rouge.',
    coach: ['Presser ensemble sur la relance.', 'Finir vite après la récupération.'], expect: ['Presser.', 'Récupérer haut.', 'Marquer vite.'] }],
  layout: { goals: [[1.5, 50, 90]], keepersAt: [[5, 50]], minis: [[98.5, 20, 90], [98.5, 50, 90], [98.5, 80, 90]],
    formations: n => [[16, 30], [16, 70], [26, 10], [26, 90], [36, 50]].slice(0, n), formationsAway: n => [[28, 40], [28, 60], [40, 20], [40, 80], [50, 50]].slice(0, n), ball: 'gb', script: [
    ['gb', 'b1', 'p', 'Départ du gardien'], ['r1', [20, 34], 'c+', 'Pressing'], ['b1', 'b2', 'p', 'Renversement'], ['b2', 'b4', 'p', ''], ['b4', [80, 86], 'd', 'Sortie côté libre'], ['b4', [98.5, 80], 's', 'Petit but']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', name: 'Coulissement de la ligne', obj: 'Faire coulisser le bloc défensif',
  id: 'mc-coulissement', likes: 3, title: 'Installation du bloc défensif', theme: 'Bloc', phase: 'sans', type: 'Exercice',
  players: [4, 8, 8], size: [30, 20], duration: 6, intensity: 2, params: { unit: 'défenseurs' },
  src: MYCOACH.src('instalation du bloc défensif', 'Jimmy Valentin', 'JS Luronnes'),
  goal: 'Quatre défenseurs à plat devant quatre porteurs : celui qui sort sur le porteur est remplacé, toute la ligne coulisse.',
  rules: [
    'Base : défense à plat face à quatre plots-porteurs.',
    'Le ballon arrive au porteur face à A : A sort sur lui, B prend la place de A, C celle de B, D celle de C.',
    'Même chose quand le ballon est face à B, C ou D : la ligne coulisse vers le ballon.',
    'Le porteur remet au défenseur sorti, qui recule ensuite sur ses appuis défensifs.'
  ],
  coach: ['Respecter les intervalles.', 'Coulisser au rythme du ballon.', 'Reculer sur des appuis de défenseur.'],
  posture: 'Derrière la ligne : il vérifie les intervalles.',
  expect: ['Bon placement de base.', 'Coulisser au bon moment.', 'Intervalles réguliers à vitesse réelle.'],
  easier: 'Ballon lent.', harder: 'Ballon qui change de côté vite.',
  success: 'La ligne reste compacte.',
  layout: { cones: [[20, 15], [20, 38], [20, 62], [20, 85]], start: [60, 20], home: [[60, 20], [60, 40], [60, 60], [60, 80]], moves: [
    [60, 20, 36, 18, 'c', 'A sort sur le porteur'], [60, 40, 60, 24, 'c+', 'B prend la place de A'], [60, 60, 60, 42, 'c+', 'C coulisse'], [60, 80, 60, 62, 'c+', 'D coulisse']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 0, moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', name: 'Pas de joueur dans le couloir opposé', obj: 'Former un bloc équipe défensif',
  id: 'mc-bloc-couloirs', likes: 3, title: 'Former un bloc équipe défensif', theme: 'Bloc', phase: 'sans', type: 'Situation',
  players: [13, 14, 15], size: [40, 60], duration: 17, intensity: 3, defenders: 7,
  src: MYCOACH.src('FORMER UN BLOC EQUIPE DEFENSIF', 'Matthieu Baumann', 'US Carqueiranne-La Crau'),
  goal: 'À partir d’une relance axiale, les bleus visent trois petits buts ; le bloc rouge coulisse, personne dans le couloir opposé.',
  rules: [
    'Relance axiale bleue ; 3 touches maximum ; hors-jeu à la médiane.',
    'Bleus : marquer dans un des trois petits buts.',
    'Rouges : pénalité si un joueur reste dans le couloir opposé quand le ballon est sur un côté ; récupérer puis 3 passes dans au moins deux couloirs = 1 point.',
    '12 relances de suite, puis on change les rôles.'
  ],
  coach: ['Se déplacer dès la première relance.', 'Fermer l’axe, glisser côté ballon.', 'Arrêts flash pour visualiser les retards.'],
  posture: 'Sur la touche : il fait des arrêts flash.',
  expect: ['Glisser côté ballon.', 'Pas de joueur oublié dans le couloir opposé.', 'Récupérer et ressortir.'],
  easier: '2 touches pour les bleus.', harder: 'Touches libres.',
  success: 'Un bloc compact qui suit le ballon.',
  layout: { minis: [[1.5, 20, 90], [1.5, 50, 90], [1.5, 80, 90]], zones: [[0, 0, 100, 25, 'Couloir'], [0, 75, 100, 25, 'Couloir'], [50, 0, .01, 100, '']],
    formations: n => [[86, 30], [86, 70], [74, 50], [64, 15], [64, 85], [58, 50], [60, 30]].slice(0, n), formationsAway: n => [[30, 20], [30, 40], [30, 60], [30, 80], [42, 35], [42, 65], [52, 50]].slice(0, n), ball: 'b3', script: [
    ['b3', 'b4', 'p', 'Le ballon va sur un côté'], ['r4', [28, 66], 'c+', 'Personne ne reste dans le couloir opposé'], ['r1', [34, 16], 'c+', 'Le bloc glisse']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Joueur lancé et bascule', obj: 'Trouver un joueur lancé et suivre l’action',
  id: 'mc-lance-bascule', likes: 2, title: 'Trouver un joueur lancé et suivre l’action', theme: 'Profondeur', phase: 'ballon', type: 'Jeu',
  players: [12, 12, 15], size: [30, 50], duration: 20, intensity: 3, defenders: f => Math.round(f / 3),
  src: MYCOACH.src('Trouver un joueur lancé et suivre l’action offensive', 'Elyes Atallah', 'Issy-les-Moulineaux FC'),
  goal: 'Deux équipes ensemble contre une : 4 passes minimum, puis trouver un joueur lancé dans la zone opposée ; tout le monde bascule.',
  rules: [
    'Deux zones. Deux équipes conservent ensemble contre la troisième (en rouge).',
    '4 passes minimum avant de trouver un joueur lancé dans l’autre zone = 1 point. Le jeu continue dans l’autre zone : tout le monde bascule.',
    'À la récupération, l’équipe peut trouver un joueur lancé en une passe (sinon elle sécurise) = 1 point.',
    'Variante : joueur lancé trouvé en une touche (déviation ou appui-remise). 3 × 6 minutes.'
  ],
  coach: ['Synchroniser passeur et joueur lancé.', 'Voir avant et choisir le bon moment.', 'Basculer vite dans l’autre zone.'],
  posture: 'Entre les zones : il compte les passes.',
  expect: ['4 passes.', 'Trouver le joueur lancé.', 'Le trouver en une touche.'],
  easier: '3 passes.', harder: 'Une touche pour la passe décisive.',
  success: 'Des joueurs lancés trouvés au bon moment.',
  layout: { thirdTeam: true, zones: [[0, 0, 100, 48, 'Zone 1'], [0, 52, 100, 48, 'Zone 2']],
    formations: n => MYCOACH.grid(n, 8, 6, 92, 44), formationsAway: n => MYCOACH.grid(n, 20, 14, 80, 40).map(([x, y]) => [x + 4, y + 3]), ball: 'b1', script: [
    ['b1', 'b2', 'p', '4 passes'], ['b2', 'b5', 'p', ''], ['b3', [60, 70], 'c+', 'Appel lancé dans l’autre zone'], ['b5', [60, 70], 'p', 'Joueur lancé : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'ludique', sub: 'Le nid', name: 'Le nid', obj: 'Traverser la zone pour voler un ballon',
  id: 'mc-le-nid', likes: 2, title: 'Le nid', theme: 'Ludique', phase: 'ballon', type: 'Jeu',
  players: [8, 8, 12], size: [25, 25], duration: 10, intensity: 3, defenders: 3,
  src: MYCOACH.src('Le nid', 'Alexandre Decorde', 'FC Neufchâtel-en-Bray'),
  goal: 'Les attaquants traversent la zone des défenseurs, prennent un ballon dans le nid et vont marquer dans un mini-but.',
  rules: [
    'Un petit cercle au centre (le nid) avec les ballons ; un grand cercle autour (la zone des défenseurs).',
    '5 attaquants dehors, 3 défenseurs dans la zone.',
    'Les attaquants traversent la zone, prennent un ballon dans le nid et vont marquer dans un des deux mini-buts.',
    'Si un défenseur touche le ballon, le point va aux défenseurs. On tourne les équipes.'
  ],
  coach: ['Attaquants : feinter et accélérer.', 'Défenseurs : se répartir, ne pas tous aller au même endroit.', 'Sortir vite avec le ballon.'],
  posture: 'Au bord : il compte les points.',
  expect: ['Prendre un ballon.', 'Marquer.', 'Défenseurs : toucher deux ballons.'],
  easier: 'Deux défenseurs.', harder: 'Quatre défenseurs.',
  success: 'Beaucoup d’actions et de buts.',
  also: [{ moment: 'echauffement', sub: 'Mise en route', obj: 'S’échauffer en jouant', posture: 'Au bord : il anime le jeu.',
    coach: ['Partir à 70 %.', 'Accélérer.'], expect: ['Bouger.', 'Marquer.', 'Gagner.'] }],
  layout: { zones: [[40, 40, 20, 20, 'Nid'], [20, 20, 60, 60, '']], minis: [[98.5, 50, 90], [1.5, 50, 90]], balls: [[48, 48], [52, 52], [48, 52]],
    formations: () => [[10, 10], [90, 10], [10, 90], [90, 90], [50, 6]], formationsAway: () => [[30, 40], [70, 40], [50, 72]], script: [
    ['b1', [46, 46], 'c', 'L’attaquant traverse la zone'], ['r1', [40, 42], 'c+', 'Un défenseur sort'], ['b1', [86, 50], 'd', 'Il ressort balle au pied'], [[86, 50], [98.5, 50], 's', 'But']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'perd', sub: 'Zone 2 · Freiner l’attaque', name: 'Reformer le bloc en 5 secondes', obj: 'Se replacer vite à la perte',
  id: 'mc-bloc-median', likes: 2, title: 'Bloc médian et reformation à la perte', theme: 'Bloc', phase: 'transition', type: 'Jeu',
  players: [18, 20, 22], size: [55, 80], duration: 18, intensity: 3,
  src: MYCOACH.src('Bloc median et reformation à la perte', 'Samy Makhloufi', 'FC Drouais'),
  goal: 'L’équipe qui défend se place en bloc médian ; à la perte, tout le monde repasse derrière la ligne des 40 m en 5 secondes.',
  rules: [
    'Match sur 80 × 55. L’équipe sans ballon en 4-2-3-1, bloc médian, ligne de pression vers 40-45 m.',
    'À la perte du ballon, tous repassent derrière la ligne des 40 m en 5 secondes, se resserrent et ferment l’axe avant de presser.',
    'But sur centre ou en une touche = 2 points ; autre but = 1 point.',
    'Variantes : pressing autorisé si la perte est haute ; touches limitées pour l’équipe en possession. 3 × 6 minutes.'
  ],
  coach: ['Bloc compact : 10 à 15 m entre les lignes.', 'Aucune passe dans l’axe.', 'Cohérence de la ligne défensive.'],
  posture: 'Sur la touche, à hauteur de la ligne des 40 m : il compte les 5 secondes.',
  expect: ['Se replacer en 5 secondes.', 'Fermer l’axe.', 'Bloc compact toute la séquence.'],
  easier: '7 secondes.', harder: '4 secondes.',
  success: 'Le bloc se reforme à chaque perte.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[50, 0, .01, 100, '']],
    formations: n => [[16, 15], [14, 38], [14, 62], [16, 85], [28, 40], [28, 60], [40, 15], [40, 50], [40, 85], [48, 50]].slice(0, n), ball: 'b8', script: [
    ['b8', 'b9', 'p', 'Attaque bleue'], ['b9', 'r8', 'p', 'Perte du ballon'], ['b', -14, 'bloc+', 'En 5 secondes, tout le monde repasse derrière la ligne'], ['r8', 'r9', 'p', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', name: 'Les cinq portes', obj: 'Se replacer sur l’axe ballon-but',
  id: 'mc-cinq-portes', likes: 14, title: 'Les cinq portes', theme: 'Protéger le but', phase: 'sans', type: 'Situation',
  players: [6, 7, 9], size: [20, 30], duration: 12, intensity: 3,
  src: MYCOACH.src('Les 5 portes - Situation', 'Sylvain Castaignau', 'AS Bidache'),
  goal: 'Les rouges protègent le but et empêchent les bleus de progresser par les portes.',
  rules: [
    'Bleus : but = 2 points ; passe à travers une des 5 portes = 1 point. Le ballon part d’un bleu en soutien, inattaquable.',
    'Rouges : passe à travers une porte = 1 point ; but dans un des deux mini-buts = 2 points.',
    'L’action s’arrête sur un but ou une sortie. 10 passages, puis on tourne.',
    'Variables : franchir une porte en conduite, jeu libre sans départ du soutien.'
  ],
  coach: ['Toujours revenir sur l’axe ballon-but.', 'Fermer la porte la plus dangereuse, pas toutes.', 'Presser quand le porteur est dos au but.'],
  posture: 'Derrière le but : il ne corrige que la défense, avec arrêts et explications si besoin.',
  expect: ['Protéger le but.', 'Fermer les portes axiales.', 'Récupérer et marquer dans un mini-but.'],
  easier: 'Bleus à un de moins.', harder: 'Bleus avec un joker en plus.',
  success: 'Peu de buts encaissés, des récupérations dans l’axe.',
  also: [{ moment: 'possede', sub: 'Zone 3 / Box · Finition', obj: 'Progresser par les portes pour marquer',
    posture: 'Sur le côté : il observe les bleus et le passage par les portes.',
    coach: ['Chercher la porte libre.', 'Frapper dès que l’axe s’ouvre.'],
    expect: ['Passer une porte.', 'Marquer.', 'Porte puis but.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], minis: [[1.5, 25, 90], [1.5, 75, 90]], supports: [[6, 50]],
    cones: [[40, 15], [40, 25], [40, 75], [40, 85], [58, 45], [58, 55], [74, 20], [74, 30], [74, 70], [74, 80]],
    formations: n => [[30, 30], [30, 70], [50, 50], [62, 30]].slice(0, n), formationsAway: n => [[84, 40], [84, 60], [68, 50], [60, 70]].slice(0, n), ball: 'a1', script: [
    ['a1', 'b1', 'p', 'Départ du soutien'], ['r3', [56, 40], 'c+', 'Le rouge revient sur l’axe'],
    ['b1', 'b3', 'p', ''], ['r1', [76, 48], 'c+', 'La porte axiale est fermée'],
    ['r3', [52, 50], 'c', 'Récupération'], ['r3', [1.5, 25], 's', 'Mini-but : 2 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'perd', sub: 'Zone 3 · Pressing', name: 'Récupérer puis donner aux appuis', obj: 'Récupérer le ballon par un pressing collectif',
  id: 'mc-contre-pressing-3', likes: 2, title: 'Exercice de contre-pressing à trois équipes', theme: 'Pressing', phase: 'sans', type: 'Jeu',
  players: [15, 15, 15], size: [20, 30], duration: 20, intensity: 4, defenders: 5,
  src: MYCOACH.src('Exercice contre pressing', 'Fadil Abidogoun', 'CSM Clamart'),
  goal: 'Une équipe en appui autour, une qui conserve dedans, une qui presse ; la récupération doit être transmise aux appuis.',
  rules: [
    'Trois équipes de 5 : A en appui autour du terrain, B conserve à l’intérieur avec A, C presse.',
    'C récupère par un pressing collectif, puis transmet le ballon à l’équipe A.',
    'Les rôles tournent : C passe en appui, A conserve, B devient chasseuse.',
    'Séquences courtes à haute intensité.'
  ],
  coach: ['Pressing collectif : fermer les appuis proches.', 'Intensité des courses.', 'Transmettre vite après la récupération.'],
  posture: 'Au bord du terrain : il fait tourner les rôles.',
  expect: ['Presser ensemble.', 'Récupérer.', 'Transmettre aux appuis.'],
  easier: 'Appuis en une touche seulement pour les conservateurs.', harder: 'Appuis en touches libres.',
  success: 'Récupérations rapides et collectives.',
  layout: { thirdTeam: true, formations: () => [[30, 30], [70, 30], [30, 70], [70, 70], [50, 50], [2, 30], [2, 70], [98, 30], [98, 70], [50, 2]], formationsAway: () => [[40, 40], [60, 40], [40, 60], [60, 60], [50, 30]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Conservation'], ['r1', [64, 30], 'c+', 'Pressing collectif'], ['r2', [70, 40], 'c+', ''], ['b2', 'r2', 'p', 'Récupération'], ['r2', 'b9', 'p', 'Transmission aux appuis']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', name: 'Réduire les angles de passe', obj: 'Réduire les intervalles entre partenaires',
  id: 'mc-reduire-angles', likes: 2, title: 'Réduire les angles de passe et les intervalles', theme: 'Bloc', phase: 'sans', type: 'Jeu',
  players: [10, 10, 12], size: [16, 20], duration: 15, intensity: 3,
  src: MYCOACH.src('Réduire les angles de passes et les intervalles', 'Matthieu Baumann', 'US Carqueiranne-La Crau'),
  goal: 'Chaque équipe dans son camp : marquer dans un but ou trouver le joker entre les deux buts adverses ; l’autre réduit les intervalles.',
  rules: [
    'Deux camps, deux buts de chaque côté avec un joker cible entre eux.',
    'L’équipe en possession, depuis son camp, marque dans un but ou trouve le joker par une passe au sol.',
    'Seul un défenseur peut sortir dans le camp adverse ; les autres réduisent les intervalles et cadrent le porteur.',
    'Deux touches maximum : pas de dribble ni de conduite.'
  ],
  coach: ['Fermer l’intervalle le plus proche du ballon.', 'Celui qui sort cadre, les autres se resserrent.', 'Glisser ensemble.'],
  posture: 'Au bord : il observe les intervalles.',
  expect: ['Réduire les intervalles.', 'Fermer le joker.', 'Ne rien encaisser sur une séquence.'],
  easier: 'Buts plus petits.', harder: 'Touches libres pour l’attaque.',
  success: 'Peu de passes traversent.',
  layout: { zones: [[50, 0, .01, 100, '']], minis: [[98.5, 25, 90], [98.5, 75, 90], [1.5, 25, 90], [1.5, 75, 90]], supports: [[98, 50, 'J'], [2, 50, 'J']],
    formations: () => [[10, 20], [10, 80], [26, 35], [26, 65]], formationsAway: () => [[74, 35], [74, 65], [88, 20], [88, 80]], ball: 'b1', script: [
    ['b1', 'b3', 'p', 'Circulation'], ['r1', [56, 36], 'c+', 'Un défenseur sort cadrer'], ['r2', [76, 52], 'c+', 'Les autres réduisent les intervalles'], ['b3', 'b4', 'p', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'perd', sub: 'Zone 2 · Freiner l’attaque', name: 'Reconstituer le bloc', obj: 'Obliger l’adversaire à multiplier les passes',
  id: 'mc-reconstituer-bloc', likes: 2, title: 'Protéger son but après la perte', theme: 'Bloc', phase: 'transition', type: 'Jeu',
  players: [12, 14, 16], size: [50, 60], duration: 21, intensity: 3,
  src: MYCOACH.src('Protéger son but', 'Matthieu Baumann', 'US Carqueiranne-La Crau'),
  goal: 'Les bleus attaquent deux petits buts depuis la relance du gardien adverse ; à la récupération, les rouges attaquent le grand but en moins de 5 passes.',
  rules: [
    'Relance du gardien rouge : les bleus attaquent les deux petits buts (2 touches) = 1 point.',
    'Les rouges, à la récupération, attaquent le grand but en moins de 5 passes (3 touches).',
    'Hors-jeu appliqué. 12 relances, puis on change les rôles.',
    'Variante : but en moins de 3 passes = points triplés ; touches illimitées.'
  ],
  coach: ['À la perte, se replacer entre le ballon et le but.', 'Obliger l’adversaire à faire plus de 5 passes.', 'Bloc replacé = adversaire qui piétine.'],
  posture: 'Derrière le grand but : il compte les passes des contre-attaques.',
  expect: ['Se replacer.', 'Obliger à 5 passes.', 'Ne pas encaisser.'],
  easier: '6 passes pour les rouges.', harder: '4 passes pour les rouges.',
  success: 'Les contres s’éteignent faute de solution.',
  layout: { goals: [[98.5, 50, 90]], keepersAt: [[95, 50]], minis: [[1.5, 25, 90], [1.5, 75, 90]],
    formations: n => [[60, 30], [60, 70], [44, 20], [44, 80], [36, 50], [26, 40], [26, 60]].slice(0, n), formationsAway: n => [[84, 30], [84, 70], [72, 50], [54, 20], [54, 80], [40, 50], [30, 30]].slice(0, n), ball: 'b5', script: [
    ['b5', 'b6', 'p', 'Attaque des petits buts'], ['b6', 'r6', 'p', 'Perte'], ['b', 14, 'bloc+', 'Les bleus se replacent'], ['r6', 'r4', 'p', 'Le contre doit multiplier les passes']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Porte défensive puis porte offensive', obj: 'Conserver et progresser par les ailes',
  id: 'mc-portes-ailes', likes: 2, title: 'Conserver et progresser sur les ailes', theme: 'Largeur', phase: 'ballon', type: 'Situation',
  players: [14, 16, 16], size: [50, 64], duration: 20, intensity: 3,
  src: MYCOACH.src('Conserver / Progresser sur les ailes #2', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Pour marquer, le ballon passe par une porte défensive puis une porte offensive sur une aile ; les deux milieux défensifs jouent avec l’attaque.',
  rules: [
    'Deux portes sur chaque aile : une défensive, une offensive.',
    'But valable seulement après une porte défensive puis une porte offensive.',
    'Les deux milieux défensifs jouent avec l’équipe qui attaque.',
    'Si les latéraux montent, les milieux offensifs les remplacent. Variantes : touches limitées, milieux qui restent dans leur équipe.'
  ],
  coach: ['Disponibilité et appels dans les couloirs.', 'Vitesse d’exécution.', 'Compensation quand le latéral monte.'],
  posture: 'Sur la touche, entre les portes : il valide les passages.',
  expect: ['Porte défensive.', 'Porte offensive.', 'Marquer après les deux.'],
  easier: 'Une seule porte obligatoire.', harder: 'Deux touches.',
  success: 'Le jeu progresse par les ailes.',
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], cones: [[30, 2], [30, 14], [62, 2], [62, 14], [30, 86], [30, 98], [62, 86], [62, 98]],
    formations: n => [[16, 30], [16, 70], [24, 8], [24, 92], [36, 40], [36, 60], [56, 30], [56, 70], [70, 50]].slice(0, n), formationsAway: n => [[86, 30], [86, 70], [80, 50], [66, 20], [66, 80], [50, 50], [44, 30]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b3', 'p', ''], ['b3', [36, 8], 'd', 'Porte défensive'], ['b7', [68, 10], 'c+', ''], ['b3', [68, 10], 'p', 'Porte offensive'], ['b8', [86, 44], 'c+', ''], ['b7', 'b8', 'p', 'Centre'], ['b8', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Trouver la zone de finition', obj: 'Trouver l’angle de passe pour frapper',
  id: 'mc-entre-lignes-finition', likes: 2, title: 'Jeu entre les lignes avec finition', theme: 'Finition', phase: 'ballon', type: 'Jeu',
  players: [14, 14, 16], size: [40, 40], duration: 20, intensity: 3,
  src: MYCOACH.src('Jeu entre les lignes avec finition', 'Jérôme Mauri', 'JS Istres'),
  goal: 'Quatre joueurs par camp cherchent un des deux attaquants en zone de finition ; une-deux et frappe. Puis le coach relance l’autre équipe.',
  rules: [
    'Carré de 40 m, deux camps, une zone de finition devant chaque but avec deux attaquants.',
    'Les quatre bleus de leur camp cherchent un de leurs attaquants en zone de finition.',
    'L’attaquant qui reçoit remet en une touche à l’autre, qui frappe.',
    'Dès que le ballon entre en zone de finition, un éducateur sert l’autre équipe : les bleus se réorganisent pour empêcher la transmission adverse.'
  ],
  coach: ['Être patient, puis surprendre.', 'Chercher l’angle de passe.', 'Une-deux rapide pour surprendre le gardien.'],
  posture: 'Sur le côté : il relance l’autre équipe au bon moment.',
  expect: ['Trouver un attaquant.', 'Une-deux et frappe.', 'Se réorganiser tout de suite après.'],
  easier: 'Attaquants à deux touches.', harder: 'Un défenseur dans la zone de finition.',
  success: 'Des frappes en une touche.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[78, 25, 14, 50, 'Finition'], [8, 25, 14, 50, 'Finition'], [50, 0, .01, 100, '']],
    formations: () => [[30, 20], [30, 80], [42, 35], [42, 65], [84, 40], [84, 60]], formationsAway: () => [[70, 20], [70, 80], [58, 35], [58, 65], [16, 40], [16, 60]], ball: 'b1', script: [
    ['b1', 'b3', 'p', 'Circulation'], ['b3', 'b5', 'p', 'Passe en zone de finition'], ['b5', 'b6', 'p', 'Remise en une touche'], ['b6', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', name: 'Cadrer sur la ligne des 16 m', obj: 'Cadrer et suivre sans se livrer',
  id: 'mc-cadrer-ligne', likes: 2, title: 'Cadrer et défendre', theme: 'Technique défensive', phase: 'sans', type: 'Situation',
  players: [3, 5, 12], size: [20, 40], duration: 20, intensity: 3, defenders: f => Math.floor(f / 2),
  src: MYCOACH.src('Cadrer et défendre', 'Gilles Malfatti', 'FC Marensin'),
  goal: 'Attaquant et défenseur de chaque côté de la ligne des 16,5 m : l’attaquant cherche à centrer ou frapper, le défenseur suit et intercepte sans franchir la ligne.',
  rules: [
    'Atelier côté : sur la ligne de côté de la surface, l’attaquant cherche une solution pour centrer sans franchir la ligne ; le défenseur cadre et suit.',
    'Atelier face : sur la ligne frontale, même principe, le défenseur empêche la frappe.',
    'Le défenseur ne franchit pas la ligne et ne se livre pas.',
    'On alterne les deux ateliers.'
  ],
  coach: ['Défenseur sur la pointe des pieds.', 'Recul-frein, suivre sans se jeter.', 'Attaquant : feinte de frappe et changement de rythme.'],
  posture: 'Entre les deux ateliers : il juge les interventions.',
  expect: ['Suivre l’attaquant.', 'Empêcher le centre.', 'Intercepter.'],
  easier: 'Attaquant au ralenti.', harder: 'Attaquant libre de franchir la ligne une fois.',
  success: 'Des défenseurs patients qui interceptent.',
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[75, 20, .5, 60, '']],
    formations: () => [[68, 30], [68, 70]], formationsAway: () => [[80, 30], [80, 70]], ball: 'b1', script: [
    ['b1', [70, 44], 'd', 'L’attaquant cherche l’ouverture'], ['r1', [80, 44], 'c+', 'Le défenseur suit de l’autre côté de la ligne'], ['b1', [70, 26], 'd', 'Feinte'], ['r1', [80, 28], 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'L’appui médian', obj: 'Trouver le joueur libre dans l’intervalle',
  id: 'mc-appui-median', likes: 2, title: 'Jeu de progression et fermeture des lignes de passe', theme: 'Progression', phase: 'ballon', type: 'Jeu',
  players: [18, 18, 18], size: [25, 35], duration: 20, intensity: 3, defenders: 6,
  src: MYCOACH.src('jeu de progression - fermeture des lignes de passes', 'Maxime Loustalot', 'Tartas St-Yaguen'),
  goal: 'Les bleus, avec les appuis verts, trouvent leur joueur dans la zone médiane pour jouer à l’opposé ; les rouges ferment les lignes.',
  rules: [
    'Trois équipes de 6. Verts en appui (3 par demi-terrain), bleus et rouges en 3 contre 3 dans chaque moitié, un bleu en appui dans la zone médiane.',
    'Bleus : trouver l’appui médian pour basculer de l’autre côté = 1 point. Il a 2 touches et peut se retourner.',
    'Séquence 2 : les rouges peuvent défendre sur le joueur médian ; il doit alors jouer en appui-remise.',
    'On tourne les rôles.'
  ],
  coach: ['Se montrer dans les intervalles.', 'Déplacer l’adversaire avant de passer.', 'Rouges : cadrer et couvrir.'],
  posture: 'Au bord de la zone médiane : il compte les bascules.',
  expect: ['Trouver le médian.', 'Basculer de l’autre côté.', 'Basculer malgré la pression.'],
  easier: 'Médian intouchable.', harder: 'Médian en une touche.',
  success: 'Des bascules régulières.',
  layout: { thirdTeam: true, zones: [[44, 0, 12, 100, 'Médiane']],
    formations: () => [[20, 30], [30, 62], [72, 30], [80, 62], [50, 50], [16, 76], [2, 20], [2, 80], [98, 20], [98, 80], [50, 2], [50, 98]], formationsAway: () => [[26, 44], [20, 54], [32, 30], [74, 44], [70, 66], [84, 40]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Circulation'], ['b2', 'b5', 'p', 'Passe à l’appui médian'], ['b5', 'b4', 'p', 'Il bascule à l’opposé']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', name: 'Se déformer pour presser', obj: 'Sortir presser, les autres ferment derrière',
  id: 'mc-se-deformer', likes: 2, title: 'Se déformer pour presser', theme: 'Pressing', phase: 'sans', type: 'Jeu',
  players: [9, 9, 9], size: [10, 15], duration: 15, intensity: 3, defenders: 3,
  src: MYCOACH.src('se déformer pour presser', 'Florian Besnard', 'AS Vignoc-Hédé-Guipel'),
  goal: 'Deux rectangles séparés par une rivière, trois couloirs : quand le ballon arrive dans mon couloir, je sors presser et les autres ferment derrière moi.',
  rules: [
    'Deux rectangles de 6 × 10 séparés par une rivière de 2 m, trois couloirs dans la longueur.',
    'Une équipe conserve dans un rectangle et cherche l’équipe d’en face ; les défenseurs sont dans la rivière.',
    'Quand le ballon va au joueur de mon couloir, je sors presser ; les autres ferment les angles de passe derrière moi. Pas d’obligation de presser.',
    'Récupération = 2 points pour les défenseurs ; passe trouvée en face = -1.'
  ],
  coach: ['Choisir le bon moment pour sortir, sans se jeter.', 'Couvrir son partenaire.', 'Se déplacer ensemble, communiquer.'],
  posture: 'Au bord de la rivière : il compte les points.',
  expect: ['Sortir au bon moment.', 'Fermer derrière.', 'Moins de 2 points perdus.'],
  easier: 'Rectangles plus petits.', harder: 'Deux touches pour l’équipe en possession.',
  success: 'Un pressing coordonné.',
  layout: { thirdTeam: true, zones: [[0, 0, 40, 100, ''], [60, 0, 40, 100, ''], [0, 33.3, 100, .01, ''], [0, 66.6, 100, .01, '']],
    formations: () => [[6, 15], [34, 50], [6, 85], [66, 15], [94, 50], [66, 85]], formationsAway: () => [[50, 16], [50, 50], [50, 84]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Ballon dans le couloir central'], ['r2', [38, 48], 'c+', 'Le défenseur du couloir sort presser'], ['r1', [48, 36], 'c+', 'Les autres ferment derrière'], ['r3', [48, 64], 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: '3 contre 2 après la passe tranchante', obj: 'Profiter de la supériorité en zone offensive',
  id: 'mc-3c2-tranchante', likes: 2, title: 'Attaquer en supériorité numérique', theme: 'Finition', phase: 'ballon', type: 'Situation',
  players: [10, 12, 16], size: [50, 70], duration: 8, intensity: 4, defenders: 4,
  src: MYCOACH.src('ATTAQUER EN SUPÉRIORITÉ NUMÉRIQUE', 'Arnaud Mougel', 'FC Le Tholy'),
  goal: 'Le gardien relance sur un défenseur, qui trouve l’attaquant décroché ; sur le temps de passe, deux milieux entrent : 3 contre 2.',
  rules: [
    'Le gardien relance sur un de ses défenseurs, écartés au maximum.',
    'Le défenseur trouve par une passe tranchante l’attaquant qui a décroché.',
    'Sur le temps de passe, les deux milieux excentrés entrent dans la zone : 3 contre 2.',
    'Variante réversible : si les défenseurs récupèrent, les deux joueurs de côté adverses entrent et on rejoue.'
  ],
  coach: ['L’attaquant décroche quand le défenseur prend l’info.', 'Le milieu qui reçoit fixe un défenseur avant de donner.', 'Finir vite.'],
  posture: 'Sur la touche, à la ligne de la zone : il donne le départ.',
  expect: ['Trouver l’attaquant.', 'Créer le 3 contre 2.', 'Marquer.'],
  easier: 'Défenseurs passifs au départ.', harder: 'Un défenseur revient en retard.',
  success: 'Des supériorités conclues.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[60, 0, .01, 100, '']],
    formations: () => [[16, 25], [16, 75], [56, 50], [52, 10], [52, 90], [30, 50]], formationsAway: () => [[80, 40], [80, 60], [50, 30], [50, 70]], ball: 'gb', script: [
    ['gb', 'b1', 'p', 'Relance sur un défenseur'], ['b3', [52, 50], 'c+', 'L’attaquant décroche'], ['b1', 'b3', 'p', 'Passe tranchante'], ['b4', [72, 22], 'c+', 'Les milieux entrent'], ['b5', [72, 78], 'c+', ''],
    ['b3', 'b4', 'p', '3 contre 2'], ['b4', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Appuis et deux buts', obj: 'Créer et utiliser les espaces',
  id: 'mc-appuis-deux-buts', likes: 2, title: 'Jeu pour créer et utiliser les espaces', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [16, 18, 18], size: [35, 45], duration: 25, intensity: 3,
  src: MYCOACH.src('Jeu pour créer et utiliser des espaces', 'Jérôme Mauri', 'JS Istres'),
  goal: '4 contre 4 au centre avec 4 appuis par équipe autour ; on attaque indifféremment les deux buts.',
  rules: [
    '4 contre 4 dans la zone centrale, 4 appuis par équipe autour. Pas de hors-jeu.',
    'Les deux buts peuvent être attaqués par les deux équipes : équilibre offensif et défensif.',
    'Un même joueur ne joue pas deux fois de suite avec le même appui. Appuis à 2 touches, sauf pour finir.',
    'Variantes : un appui entre créer le surnombre puis ressort ; nombre minimum de passes avant l’appui ; appuis qui défendent sur les appuis.'
  ],
  coach: ['Utiliser les appuis pour changer de côté.', 'Créer l’espace avant de l’utiliser.', 'Équilibre : toujours un joueur pour défendre.'],
  posture: 'Au bord : il compte les points sur un temps donné.',
  expect: ['Utiliser un appui.', 'Marquer.', 'Marquer après deux appuis différents.'],
  easier: 'Appuis à 3 touches.', harder: 'Appuis à une touche.',
  success: 'Des espaces créés puis utilisés.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[20, 15, 60, 70, '']],
    formations: () => [[34, 30], [34, 70], [50, 40], [60, 62], [20, 6], [80, 6], [20, 94], [80, 94]], formationsAway: () => [[44, 30], [44, 70], [66, 40], [50, 56], [40, 6], [60, 6], [40, 94], [60, 94]], ball: 'b3', script: [
    ['b3', 'b6', 'p', 'Appui'], ['b6', 'b4', 'p', ''], ['b4', 'b8', 'p', 'Autre appui'], ['b8', 'butR', 's', 'Il finit devant le but']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', name: 'Protéger son but', obj: 'Récupérer près de son but',
  id: 'mc-proteger-but', likes: 28, title: 'Protéger son but en déséquilibre', theme: 'Protéger le but', phase: 'sans', type: 'Jeu',
  players: [12, 12, 14], size: [40, 64], duration: 15, intensity: 3,
  src: MYCOACH.src('Protéger son but en déséquilibre', 'Rochedi Athamnia', ''),
  goal: '4 contre 4 dans l’axe avec deux joueurs de côté par équipe : défendre les centres et l’axe.',
  rules: [
    'Zone axiale de 40 × 40 : 4 contre 4. Couloirs de 12 m : deux joueurs de côté par équipe, inattaquables, 2 touches.',
    'But sur centre = 3 points ; but dans l’axe = 1 point. Hors-jeu appliqué.',
    'Le gardien relance dans la zone axiale.',
    'Variante : si le joueur de côté rentre avec le ballon, son passeur dédouble et prend sa place.'
  ],
  coach: ['Protéger le but avant de chercher le ballon.', 'Sur un centre : prendre les zones, pas regarder le ballon.', 'Réduire l’espace devant le but.'],
  posture: 'Derrière un but : il observe le placement des défenseurs au moment du centre.',
  expect: ['Défendre les centres.', 'Récupérer dans la surface.', 'Encaisser moins de 3 points.'],
  easier: 'Joueurs de côté en 1 touche.', harder: 'But sur centre = 5 points.',
  success: 'Les centres sont repoussés.',
  also: [{ moment: 'possede', sub: 'Zone 3 / Box · Finition', obj: 'Marquer sur centre',
    posture: 'Sur le côté : il observe le jeu vers les côtés et l’arrivée dans la surface.',
    coach: ['Écarter vers le côté libre.', 'Deux attaquants dans la surface sur le centre.'],
    expect: ['Centrer.', 'Reprendre cadré.', 'Marquer sur centre.'] }],
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[0, 0, 100, 18, 'Couloir'], [0, 82, 100, 18, 'Couloir']],
    formations: n => [[20, 35], [20, 65], [38, 40], [38, 60], [60, 8], [60, 92]].slice(0, n), ball: 'b3', script: [
    ['b3', 'b5', 'p', 'Passe au joueur de côté'], ['b5', [80, 8], 'd', 'Inattaquable'],
    ['b4', [86, 42], 'c+', 'Attaque de la surface'], ['r1', [86, 40], 'c+', 'Le défenseur prend la zone'],
    ['b5', [86, 42], 'p', 'Centre'], ['r1', 'r4', 'p', 'Dégagement dans l’axe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'perd', sub: 'Zone 3 · Pressing', name: '7 contre 4 + 3', obj: 'Chasser à quatre, intercepter à trois',
  id: 'mc-7c4-plus-3', likes: 2, title: '7 contre 4 + 3', theme: 'Transition', phase: 'transition', type: 'Jeu',
  players: [21, 21, 21], size: [30, 54], duration: 20, intensity: 4, defenders: 7,
  src: MYCOACH.src('JP sélection Dan 7 vs 4+3', 'Franck Bouet', 'SC Narbonne Montplaisir'),
  goal: 'Trois équipes de 7 : deux conservent chacune dans leur zone, la troisième chasse à 4 et intercepte à 3 dans le couloir central.',
  rules: [
    '54 × 30, coupé par un couloir central de 4 m ; deux mini-buts de chaque côté.',
    'Chaque équipe en possession fait 5 passes minimum puis trouve l’équipe partenaire par une passe au sol à travers le couloir.',
    'L’équipe qui défend : 4 chasseurs face aux 7, 3 joueurs dans le couloir qui interceptent.',
    'À la récupération : marquer dans un mini-but en moins de 2 passes, ou trouver la troisième équipe et prendre la place de celle qui a perdu.'
  ],
  coach: ['Changer les chasseurs quand le ballon change de zone.', 'À la récupération : verticaliser ou sortir de la densité.', 'Passe au sol à travers le couloir.'],
  posture: 'Au bord du couloir central : il compte les passes.',
  expect: ['5 passes.', 'Traverser le couloir.', 'Récupérer et marquer en 2 passes.'],
  easier: '3 chasseurs.', harder: 'Deux touches.',
  success: 'Des récupérations rapides et des changements de rôle.',
  layout: { thirdTeam: true, zones: [[46, 0, 8, 100, 'Couloir']], minis: [[1.5, 25, 90], [1.5, 75, 90], [98.5, 25, 90], [98.5, 75, 90]],
    formations: () => [[6, 15], [22, 6], [40, 15], [6, 85], [22, 94], [40, 85], [24, 50], [60, 15], [78, 6], [94, 15], [60, 85], [78, 94], [94, 85], [76, 50]],
    formationsAway: () => [[18, 34], [30, 40], [18, 64], [32, 62], [50, 20], [50, 50], [50, 80]], ball: 'b1', script: [
    ['b1', 'b2', 'p', '5 passes dans la zone'], ['r1', [28, 20], 'c+', '4 chasseurs'], ['b2', 'b7', 'p', ''], ['b7', 'b14', 'p', 'Passe au sol à travers le couloir'], ['r6', [50, 46], 'c+', 'Les 3 du couloir tentent d’intercepter']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Le passeur entre : 3 contre 2', obj: 'Changer de rythme pour attaquer',
  id: 'mc-rythme-3c2', likes: 1, title: 'Changer de rythme de jeu', theme: 'Finition', phase: 'ballon', type: 'Situation',
  players: [6, 7, 18], size: [40, 50], duration: 20, intensity: 4, defenders: 2,
  src: MYCOACH.src('SITUATION : Changer de rythme de jeu #1', 'Jérôme Maret', 'Ploërmel FC'),
  goal: 'Le porteur donne et entre dans le jeu : 3 contre 2. On entre en zone offensive par une passe à l’attaquant, 10 secondes pour frapper.',
  rules: [
    'Le porteur passe et entre dans le jeu : 3 attaquants contre 2 défenseurs. Jeu au sol.',
    'Entrée en zone offensive seulement par une passe à l’attaquant ; 10 secondes pour tirer.',
    'Défenseurs : relancer dans une des deux portes vers un partenaire en attente = 1 point.',
    'Alterner départ à droite et à gauche. Variantes : retour d’un milieu défensif ; transmettre dans le carré d’à côté pendant la préparation.'
  ],
  coach: ['Changer de rythme au moment de la passe à l’attaquant.', 'Jeu au sol, précis.', 'Frapper vite.'],
  posture: 'Sur le côté : il compte les 10 secondes.',
  expect: ['Trouver l’attaquant.', 'Frapper en 10 secondes.', 'Marquer.'],
  easier: '15 secondes.', harder: 'Retour d’un milieu défensif.',
  success: 'Des accélérations nettes.',
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[66, 0, .01, 100, '']], cones: [[2, 20], [2, 34], [2, 66], [2, 80]],
    formations: () => [[34, 50], [50, 20], [62, 60]], formationsAway: () => [[76, 40], [76, 64]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Le porteur donne'], ['b1', [54, 40], 'c+', 'et entre dans le jeu'], ['b2', 'b3', 'p', 'Passe à l’attaquant : changement de rythme'], ['b3', [80, 52], 'd', ''], ['b3', 'butR', 's', 'Frappe en 10 secondes']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Sortie avec deux jokers', obj: 'Effectuer une sortie de balle maîtrisée',
  id: 'mc-sortie-jokers', likes: 1, title: 'Sortie de balle avec deux milieux jokers', theme: 'Relance', phase: 'ballon', type: 'Jeu',
  players: [16, 18, 18], size: [50, 64], duration: 20, intensity: 3,
  src: MYCOACH.src('Sortie de balle', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Deux milieux jokers jouent avec l’équipe en possession ; seul l’avant-centre adverse peut gêner les quatre défenseurs.',
  rules: [
    'Les deux milieux jokers jouent avec l’équipe qui a le ballon.',
    'Seul l’avant-centre adverse peut aller gêner les quatre défenseurs derrière la ligne ; les centraux ne la dépassent pas.',
    'Ballon sorti : on repart du gardien de l’équipe qui a le ballon.',
    'Variantes : sans avant-centre ; plus de presseurs ; ceux qui perdent le ballon sortent (sauf jokers) ; stop-ball ou petites cages.'
  ],
  coach: ['Écarter les centraux, latéraux hauts.', 'Les jokers se montrent entre les lignes.', 'Sortir proprement puis marquer.'],
  posture: 'Derrière la ligne de relance : il observe les angles de passe.',
  expect: ['Sortir sans perte.', 'Trouver un joker.', 'Sortir puis marquer.'],
  easier: 'Sans avant-centre.', harder: 'Deux presseurs.',
  success: 'Des sorties de balle propres.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[30, 0, .01, 100, '']], supports: [[46, 40, 'J'], [46, 60, 'J']],
    formations: n => [[16, 30], [16, 70], [22, 8], [22, 92], [36, 50], [56, 20], [56, 80], [66, 50]].slice(0, n), ball: 'gb', script: [
    ['gb', 'b1', 'p', 'Relance courte'], ['b1', 'a1', 'p', 'Le joker se montre'], ['a1', 'b6', 'p', ''], ['b6', 'b8', 'p', 'Sortie réussie']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Six passes en zone basse', obj: 'Maîtriser collectivement le ballon',
  id: 'mc-six-passes-zone-basse', likes: 1, title: 'Créer et utiliser des espaces', theme: 'Progression', phase: 'ballon', type: 'Situation',
  players: [12, 12, 14], size: [60, 60], duration: 20, intensity: 3, defenders: 5,
  src: MYCOACH.src('Créer et utiliser des espaces situation', 'Samy Makhloufi', 'FC Drouais'),
  goal: '7 contre 5 : six passes minimum en zone basse, puis aller marquer en stop-ball ; l’équipe qui défend a 7 secondes pour marquer à la récupération.',
  rules: [
    'Bleus à 7 : six passes en zone basse, puis stop-ball derrière la ligne adverse = 1 point.',
    'Rouges à 5 (dont deux attaquants en zone offensive) : récupération puis but en 7 secondes = 1 point.',
    '2 × 10 ballons en attaque placée. Pas de hors-jeu.',
    'Variantes : six passes sur tout le terrain ; un troisième défenseur en zone basse ; attaquants qui partent de la zone médiane.'
  ],
  coach: ['Jouer sur un partenaire qui a du temps et de l’espace.', 'Prendre de la distance avec le porteur.', 'S’éloigner de son adversaire direct.'],
  posture: 'Sur la touche : il compte les passes en zone basse.',
  expect: ['6 passes.', 'Progresser.', 'Stop-ball.'],
  easier: '4 passes.', harder: 'Un troisième défenseur en zone basse.',
  success: 'La possession sert à progresser.',
  layout: { zones: [[0, 0, 33, 100, 'Zone basse'], [92, 0, 8, 100, 'Stop-ball']],
    formations: () => [[12, 30], [12, 70], [24, 10], [24, 90], [28, 50], [50, 30], [50, 70]], formationsAway: () => [[30, 30], [30, 70], [42, 50], [70, 30], [70, 70]], ball: 'b1', script: [
    ['b1', 'b2', 'p', '1'], ['b2', 'b5', 'p', '2'], ['b5', 'b3', 'p', '… 6 passes'], ['b3', 'b6', 'p', 'On progresse'], ['b6', [94, 30], 'd', 'Stop-ball']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', name: 'Densifier l’axe ballon-but', obj: 'Avoir un maximum de joueurs entre le ballon et le but',
  id: 'mc-densifier-axe', likes: 1, title: 'Densifier l’axe ballon-but', theme: 'Bloc', phase: 'sans', type: 'Jeu',
  players: [14, 16, 16], size: [50, 64], duration: 20, intensity: 3,
  src: MYCOACH.src('Densifier l’axe ballon/but', 'Gaétan Dagon', 'FC Wintzfelden-Osenbach'),
  goal: 'Terrain en trois couloirs : l’équipe en possession les occupe tous, l’équipe sans ballon reste sur deux couloirs côté ballon.',
  rules: [
    '8 contre 8 sur un demi-terrain en trois couloirs, trois petits buts de chaque côté.',
    'En possession : occuper les trois couloirs. Sans ballon : deux couloirs maximum, côté ballon.',
    'But central = 3 points ; but sur un côté = 1 point.',
    'Variantes : touches limitées ; passage obligatoire par les deux côtés avant de marquer.'
  ],
  coach: ['Compacité : peu d’espace entre les joueurs et entre les lignes.', 'Glisser vers le côté du ballon.', 'Protéger le but central d’abord.'],
  posture: 'Sur la touche : il observe la distance milieu-défense.',
  expect: ['Deux couloirs maximum.', 'Protéger le but central.', 'Bloc compact toute la séquence.'],
  easier: 'Touches libres pour l’attaque.', harder: '2 touches pour l’attaque, ballon plus rapide.',
  success: 'Peu de buts centraux encaissés.',
  also: [{ moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', obj: 'Occuper la largeur et renverser', posture: 'Sur la touche : il observe la largeur.',
    coach: ['Occuper les trois couloirs.', 'Renverser vite.'], expect: ['Occuper la largeur.', 'Renverser.', 'Marquer au centre.'] }],
  layout: { minis: [[98.5, 15, 90], [98.5, 50, 90], [98.5, 85, 90], [1.5, 15, 90], [1.5, 50, 90], [1.5, 85, 90]], zones: [[0, 33.3, 100, .01, ''], [0, 66.6, 100, .01, '']],
    formations: n => [[16, 30], [16, 70], [30, 10], [30, 90], [36, 50], [52, 20], [52, 80], [60, 50]].slice(0, n), formationsAway: n => [[84, 30], [84, 60], [72, 20], [72, 45], [72, 66], [62, 30], [62, 56], [54, 42]].slice(0, n), ball: 'b6', script: [
    ['b6', 'b3', 'p', 'Le ballon va côté gauche'], ['r2', [80, 34], 'c+', 'Le bloc rouge glisse sur deux couloirs'], ['r5', [70, 52], 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'La catapulte', obj: 'Renverser vite par un lob et marquer',
  id: 'mc-catapulte', likes: 1, title: 'La catapulte', theme: 'Renversement', phase: 'ballon', type: 'Situation',
  players: [6, 8, 15], size: [50, 55], duration: 20, intensity: 3, defenders: 3,
  src: MYCOACH.src('LA CATAPULTE', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Une-deux, puis transversale lobée vers l’avant ; le joueur à l’opposé se démarque, appelle dans le dos et exploite.',
  rules: [
    'Bleus en attaque, rouges en défense.',
    'Une-deux, puis transversale lobée vers l’autre côté ; les défenseurs pressent au moment du lob.',
    'Le joueur opposé se démarque de son défenseur, fait l’appel dans le dos et choisit la meilleure solution (il peut frapper).',
    'Défenseur qui récupère : il peut frapper. Rotation après chaque action ; changement de côté au bout de 10 minutes.'
  ],
  coach: ['Lob tendu, dans la course.', 'Appel dans le dos au moment du lob.', 'Choisir : frappe ou passe.'],
  posture: 'Au point de départ : il lance les actions.',
  expect: ['Lob précis.', 'Appel au bon moment.', 'But.'],
  easier: 'Défenseurs passifs.', harder: 'Défenseurs qui pressent dès la une-deux.',
  success: 'Des renversements rapides et dangereux.',
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], formations: () => [[30, 80], [44, 70], [60, 16], [62, 50]], formationsAway: () => [[70, 22], [74, 50], [64, 76]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Une-deux'], ['b1', [40, 82], 'c+', ''], ['b2', [40, 82], 'p', ''], ['b3', [80, 14], 'c+', 'Appel dans le dos'], ['b1', [80, 14], 'p', 'Transversale lobée'], ['b3', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Projection des pistons', obj: 'Finir après un décalage des pistons',
  id: 'mc-pistons-352', likes: 1, title: 'Finition avec l’apport des pistons en 3-5-2', theme: 'Animation offensive', phase: 'ballon', type: 'Situation',
  players: [12, 13, 14], size: [50, 55], duration: 20, intensity: 3, defenders: 5,
  src: MYCOACH.src('Finition avec l’apport des pistons en 3 5 2', 'Samy Makhloufi', 'FC Drouais'),
  goal: 'Deux attaquants, deux pistons, un 10 et deux 6 contre trois centraux et deux milieux : marquer en 10 secondes après la première passe.',
  rules: [
    'Bleus : 2 attaquants, 2 pistons, un 10, deux 6. Rouges : 3 centraux, 2 milieux défensifs, un gardien. Deux couloirs pour les pistons.',
    'Départ d’un 6 : les attaquants décrochent ou appellent pour recevoir dans l’axe ou en profondeur ; les pistons se projettent.',
    'Bleus : marquer en 10 secondes après la première passe. Rouges : 5 passes après récupération = 1 point.',
    '3 séquences de 10 ballons. Hors-jeu appliqué. Variantes : 6 contre 7 ; possession plus longue.'
  ],
  coach: ['Un attaquant décroche, l’autre prend la profondeur.', 'Pistons : projection dès la première passe.', 'Jeu rapide, prise d’info.'],
  posture: 'Sur la touche, au niveau des couloirs : il compte les 10 secondes.',
  expect: ['Trouver un attaquant.', 'Piston lancé.', 'But en 10 secondes.'],
  easier: '15 secondes.', harder: '6 contre 7.',
  success: 'Les pistons arrivent à chaque attaque.',
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[0, 0, 100, 14, 'Couloir'], [0, 86, 100, 14, 'Couloir']],
    formations: () => [[30, 40], [30, 60], [44, 50], [50, 7], [50, 93], [62, 40], [64, 60]], formationsAway: () => [[84, 30], [86, 50], [84, 70], [72, 40], [72, 60]], ball: 'b1', script: [
    ['b1', 'b3', 'p', 'Départ du 6'], ['b6', [56, 40], 'c+', 'Un attaquant décroche'], ['b4', [80, 7], 'c+', 'Le piston se projette'], ['b3', 'b6', 'p', ''], ['b6', [80, 9], 'p', 'Décalage'], ['b7', [88, 44], 'c+', ''], ['b4', 'b7', 'p', 'Centre'], ['b7', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'recupere', sub: 'Zone 1 · Jouer vers l’avant', name: 'Quatre zones, trois équipes', obj: 'Transmettre vite puis occuper l’espace',
  id: 'mc-possession-transition', likes: 1, title: 'Possession et transition en quatre zones', theme: 'Transition', phase: 'transition', type: 'Jeu',
  players: [12, 12, 12], size: [26, 26], duration: 25, intensity: 3, defenders: 4,
  src: MYCOACH.src('Situation - possession + transition', 'Johan Roubault', 'FC Annecy'),
  goal: '4 contre 2 dans une des quatre zones ; à la récupération, transmettre à un joueur en attente dans une zone libre, puis occuper tout l’espace.',
  rules: [
    'Carré de 26 m en quatre zones. Une équipe conserve en 4 contre 2 dans une zone ; l’équipe qui défend a 2 chasseurs et 2 joueurs au centre.',
    'La troisième équipe occupe les trois zones libres.',
    'À la récupération : transmettre à un joueur en attente dans une zone libre, puis occuper l’espace ; l’autre équipe va conserver dans une zone face à 2 défenseurs.',
    '10 passes = 1 point. Variantes : touches limitées, carré central pour ceux qui ne défendent pas.'
  ],
  coach: ['Jouer et se montrer dans les intervalles.', 'Rythme élevé.', 'Contourner ou transpercer : bien choisir.'],
  posture: 'Au centre : il compte les passes.',
  expect: ['10 passes.', 'Transmettre vite à la récupération.', 'Enchaîner deux transitions.'],
  easier: 'Touches libres.', harder: 'Une touche.',
  success: 'Des transitions fluides.',
  layout: { thirdTeam: true, zones: [[0, 0, 50, 50, ''], [50, 0, 50, 50, ''], [0, 50, 50, 50, ''], [50, 50, 50, 50, '']],
    formations: () => [[6, 6], [44, 6], [6, 44], [44, 44], [75, 25], [75, 75], [25, 75], [60, 60]], formationsAway: () => [[20, 22], [30, 30], [50, 46], [54, 52]], ball: 'b1', script: [
    ['b1', 'b2', 'p', '4 contre 2'], ['b2', 'r2', 'p', 'Récupération'], ['r2', 'b5', 'p', 'Transmission dans une zone libre']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'recupere', sub: 'Zone 2 · Chercher la zone 3', name: 'Trois équipes de trois', obj: 'Déséquilibrer et finir en 3 contre 3',
  id: 'mc-3c3-trois-equipes', likes: 1, title: 'Déséquilibre et finition à 3 contre 3', theme: 'Transition', phase: 'transition', type: 'Jeu',
  players: [11, 13, 13], size: [40, 70], duration: 15, intensity: 4, defenders: 3,
  src: MYCOACH.src('Déséquilibre et finition : 3 contre 3', 'Christophe Marchat', 'ES Douvaine-Loisin'),
  goal: 'Trois équipes de 3 et deux appuis neutres au milieu : on attaque, on marque, puis on repart vers l’autre but.',
  rules: [
    '70 × 40, une zone médiane de 15-20 m avec deux appuis neutres ; un but avec gardien de chaque côté.',
    'Les blancs partent de la zone médiane et attaquent le but défendu par les bleus.',
    'S’ils marquent, ils repartent de la zone médiane attaquer l’autre but, défendu par les rouges.',
    'Si les bleus récupèrent et trouvent un appui neutre, ce sont eux qui attaquent l’autre but ; les blancs tentent de les en empêcher.'
  ],
  coach: ['Attaquer vite pour garder le temps d’avance.', 'À la récupération : trouver l’appui tout de suite.', 'À la perte : couper la passe vers l’appui.'],
  posture: 'Dans la zone médiane : il compte les buts.',
  expect: ['Frapper.', 'Trouver l’appui à la récupération.', 'Marquer deux fois de suite.'],
  easier: 'Trois appuis.', harder: 'Un seul appui.',
  success: 'Des transitions dans les deux sens.',
  layout: { thirdTeam: true, goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[40, 0, 20, 100, 'Zone médiane']], supports: [[50, 20, 'A'], [50, 80, 'A']],
    formations: () => [[46, 40], [50, 60], [54, 50], [24, 30], [24, 70], [86, 50]], formationsAway: () => [[76, 30], [76, 70], [84, 40]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Les bleus partent du milieu'], ['b2', 'b3', 'p', ''], ['b3', [76, 50], 'd', ''], ['b3', 'butR', 's', 'But : ils repartent vers l’autre but']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'perd', sub: 'Zone 2 · Freiner l’attaque', name: 'Le numéro appelé entre', obj: 'Changer de statut vite',
  id: 'mc-changer-statut', likes: 1, title: 'Comment changer de statut', theme: 'Transition', phase: 'transition', type: 'Jeu',
  players: [12, 20, 20], size: [40, 40], duration: 21, intensity: 4,
  src: MYCOACH.src('Comment changer de statut', 'Matthieu Baumann', 'US Carqueiranne-La Crau'),
  goal: '6 contre 6 avec gardiens et six joueurs dehors avec un ballon : l’équipe qui encaisse sort ; un numéro appelé entre en conduite.',
  rules: [
    '6 contre 6 + 2 gardiens, six joueurs autour avec un ballon chacun, sur des plots numérotés.',
    'L’équipe qui encaisse sort au plus vite ; le dernier à son plot fait 10 pompes ou abdos. Le gardien relance avec l’équipe qui entre.',
    'En cours de jeu, le coach appelle un numéro : ce joueur entre en conduite ; l’équipe en possession doit réagir et défendre.',
    'L’équipe qui défendait sort dans les mêmes conditions.'
  ],
  coach: ['Réagir tout de suite au changement.', 'Reformer les sources de ballons.', 'Défendre en priorité l’axe.'],
  posture: 'Au bord : il appelle les numéros quand l’équipe est en déséquilibre.',
  expect: ['Sortir vite.', 'Entrer vite.', 'Réagir au numéro appelé.'],
  easier: 'Pas de numéro appelé.', harder: 'Deux numéros appelés.',
  success: 'Des changements de statut immédiats.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], supports: [[20, 2], [50, 2], [80, 2], [20, 98], [50, 98], [80, 98]],
    formations: n => [[20, 30], [20, 70], [36, 50], [46, 25], [46, 75], [60, 50]].slice(0, n), ball: 'b3', script: [
    ['b3', 'b6', 'p', 'Attaque bleue'], ['a2', [50, 30], 'd', 'Numéro appelé : il entre balle au pied'], ['b4', [44, 34], 'c+', 'Les bleus doivent défendre']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', name: 'Duels', obj: 'Défendre en 1 contre 1',
  id: 'mc-duels', likes: 44, title: 'Les duels', theme: 'Technique défensive', phase: 'sans', type: 'Situation',
  players: [3, 3, 9], size: [20, 25], duration: 20, intensity: 4,
  src: MYCOACH.src('Les duels', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'L’attaquant veut marquer, le défenseur veut récupérer et passer dans une porte.',
  rules: [
    '1 contre 1 : le bleu attaque le but, le rouge défend.',
    'Le défenseur se met en position au départ de l’attaquant.',
    'Rouge : récupérer puis passer dans une des deux portes = 1 point.',
    'Variante : 2 contre 2.'
  ],
  coach: ['Fléchi, de côté, à distance d’intervention.', 'Orienter l’attaquant vers l’extérieur.', 'Intervenir quand le ballon s’éloigne du pied.'],
  posture: 'Sur le côté de la zone : il corrige la position du défenseur et son temps d’intervention.',
  expect: ['Ne pas se faire éliminer.', 'Orienter vers l’extérieur.', 'Récupérer et passer une porte.'],
  easier: 'L’attaquant part de plus loin.', harder: '2 contre 2.',
  success: 'Le défenseur gagne un duel sur deux.',
  also: [{ moment: 'possede', sub: 'Zone 3 / Box · Finition', obj: 'Éliminer en 1 contre 1',
    posture: 'Derrière le but : il observe l’attaquant et sa prise de vitesse.',
    coach: ['Attaquer le défenseur de face.', 'Accélérer après le dribble.'],
    expect: ['Frapper.', 'Éliminer.', 'Marquer.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], cones: [[2, 22], [2, 34], [2, 66], [2, 78]],
    formations: () => [[24, 50], [24, 30], [24, 70]], formationsAway: () => [[66, 50], [66, 30], [66, 70]], ball: 'b1', script: [
    ['b1', [48, 50], 'd', 'L’attaquant part'], ['r1', [58, 50], 'c+', 'Le défenseur se met en position'],
    ['b1', [54, 40], 'd', 'Dribble'], ['r1', [56, 42], 'c+', 'Il l’oriente vers l’extérieur'],
    ['r1', [52, 40], 'c', 'Récupération'], ['r1', [2, 28], 'd', 'Passage dans la porte']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', moment: 'physique', sub: 'Rondo athlétique', name: 'Rondo athlétique', obj: 'Chasser à fond, puis sprinter',
  id: 'mc-rondo-athletique', likes: 1, title: 'Rondo athlétique', theme: 'Physique', phase: 'ballon', type: 'Jeu',
  players: [12, 12, 20], size: [12, 40], duration: 15, intensity: 4, defenders: 2, series: [60, 90],
  src: MYCOACH.src('Rondo Athlétique', 'Nicolas Thomas', 'Avenir Foot Lozère'),
  goal: 'Deux chasseurs sprintent dans le rondo central (4 contre 2), puis se séparent dans les rondos latéraux (3 contre 1), puis sprintent jusqu’aux portes.',
  rules: [
    'Trois carrés de 10-12 m côte à côte : 4 joueurs dans le central, 3 dans chaque carré latéral. Une porte de départ, deux portes d’arrivée.',
    'Au signal, deux chasseurs sprintent dans le carré central : 4 contre 2 (20 secondes maximum).',
    'Puis chacun part dans un carré latéral : 3 contre 1 (20 secondes maximum).',
    'Puis sprint jusqu’à la porte en face de son carré. 6 répétitions par binôme, puis on inverse.'
  ],
  coach: ['Chasser en permanence, pas d’attente.', 'Passes justes pour conserver.', 'Sprint à fond jusqu’à la porte.'],
  posture: 'Entre les carrés : il siffle chaque étape.',
  expect: ['Chasser à fond.', 'Récupérer une fois.', 'Tenir les 6 répétitions.'],
  easier: '15 secondes par étape.', harder: 'Récupération plus courte.',
  success: 'Intensité maximale à chaque passage.',
  layout: { zones: [[0, 0, 30, 100, ''], [35, 0, 30, 100, ''], [70, 0, 30, 100, '']], cones: [[46, 98], [54, 98], [10, 2], [20, 2], [80, 2], [90, 2]],
    formations: () => [[38, 10], [62, 10], [38, 90], [62, 90], [4, 20], [26, 50], [4, 80], [96, 20], [74, 50], [96, 80]], formationsAway: () => [[46, 50], [54, 50]], ball: 'b1', script: [
    ['b1', 'b2', 'p', '4 contre 2'], ['r1', [42, 20], 'c+', 'Les chasseurs pressent'], ['r1', [14, 50], 'c', 'Puis 3 contre 1 sur les côtés'], ['r2', [86, 50], 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'recupere', sub: 'Zone 1 · Jouer vers l’avant', name: 'Appui trouvé = 3 points', obj: 'Jouer vers l’avant après la récupération',
  id: 'mc-appui-3-points', likes: 1, title: 'Jouer vers l’avant après la récupération', theme: 'Transition offensive', phase: 'transition', type: 'Jeu',
  players: [16, 18, 18], size: [30, 40], duration: 20, intensity: 3,
  src: MYCOACH.src('Jouer vers l’avant après la récupération du ballon', 'Matthieu Baumann', 'US Carqueiranne-La Crau'),
  goal: '7 contre 7 : 10 passes = 1 point ; après une récupération, jouer tout de suite sur un de ses deux appuis = 3 points.',
  rules: [
    '7 contre 7, deux appuis par équipe aux deux bouts, 2 touches obligatoires.',
    '10 passes sans que l’adversaire touche le ballon = 1 point.',
    'À la récupération, jouer immédiatement avec un de ses appuis = 3 points, puis conserver en 2 touches.',
    'Variante : appui trouvé en 1re passe = 3 points, en 2e passe = 2 points.'
  ],
  coach: ['Regarder l’appui dès la récupération.', 'Première passe vers l’avant.', 'Puis sécuriser.'],
  posture: 'Au bord : il compte les points.',
  expect: ['Trouver l’appui.', 'Le trouver en une passe.', '3 points par séquence.'],
  easier: 'Appui trouvé en 3 passes.', harder: 'Une touche pour l’appui.',
  success: 'Le jeu va vers l’avant dès la récupération.',
  layout: { supports: [[99, 30], [99, 70], [1, 30], [1, 70]], formations: n => MYCOACH.grid(n, 8, 10, 92, 90), formationsAway: n => MYCOACH.grid(n, 16, 18, 84, 82).map(([x, y]) => [x + 4, y + 5]), ball: 'r1', script: [
    ['r1', 'r2', 'p', 'Conservation rouge'], ['r2', 'b4', 'p', 'Récupération bleue'], ['b4', 'a1', 'p', 'Appui trouvé tout de suite : 3 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Franchir la ligne de cinq', obj: 'Ressortir proprement de la densité',
  id: 'mc-ligne-de-cinq', likes: 1, title: 'Conservation sous pression', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [16, 16, 16], size: [50, 50], duration: 15, intensity: 3,
  src: MYCOACH.src('Conservation sous pression 1', 'Jérôme Mauri', 'JS Istres'),
  goal: '6 contre 6 dans une zone centrale, 4 jokers autour : passer d’un côté à l’autre en franchissant la ligne des défenseurs.',
  rules: [
    'Zone centrale de 30 × 50 dans un carré de 50 × 50 ; 6 contre 6 + 4 jokers à la périphérie. 2 touches maximum.',
    'Objectif : franchir la ligne des défenseurs, ballon au sol, pour passer d’un côté à l’autre.',
    'Un joueur en possession peut sortir de la zone pour solliciter un appui, sans y rester.',
    'À la récupération, transmettre immédiatement à un joker pour passer en possession.'
  ],
  coach: ['Concentration et maîtrise technique.', 'Communiquer pour sortir de la densité.', 'Se replacer après la passe.'],
  posture: 'Au bord de la zone : il compte les traversées.',
  expect: ['Traverser une fois.', 'Traverser en 2 touches.', 'Transmettre au joker à la récupération.'],
  easier: '3 touches.', harder: 'Une touche pour les jokers.',
  success: 'Des sorties de densité propres.',
  layout: { zones: [[20, 0, 60, 100, 'Zone centrale']], supports: [[10, 25], [10, 75], [90, 25], [90, 75]],
    formations: n => MYCOACH.grid(n, 24, 10, 52, 90), formationsAway: n => Array.from({ length: n }, (_, i) => [60, Math.round(10 + 80 * (i + .5) / n)]), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Circulation'], ['b2', 'a1', 'p', 'Appui extérieur'], ['a1', 'b5', 'p', ''], ['b5', 'a3', 'p', 'La ligne est franchie']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: '6 contre 3 dans le rectangle', obj: 'Conserver dans les petits espaces',
  id: 'mc-6c3-rectangle', likes: 1, title: '6 contre 3 et appuis aux bouts', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [9, 13, 13], size: [12, 30], duration: 12, intensity: 3, defenders: 3,
  src: MYCOACH.src('6vs3', 'Gaétan Dagon', 'FC Wintzfelden-Osenbach'),
  goal: 'Dans un rectangle, 6 contre 3 : aller trouver le joueur de l’autre bout en passant par l’intérieur.',
  rules: [
    'Rectangle au centre : 6 bleus contre 3 rouges, qui restent dans leur zone. Deux bleus hors du rectangle à chaque bout.',
    'Départ d’un bleu de bout, passe dans le rectangle ; trouver un joueur de l’autre bout = 3 points ; aller-retour = 5 points.',
    'Les rouges : récupération + une passe = 1 point.',
    'On peut rejouer avec le joueur de bout du même côté pour préparer le décalage. Jeu au sol.'
  ],
  coach: ['Orienter les épaules vers l’autre bout.', 'Préparer le décalage avant de traverser.', 'Jeu court et rapide.'],
  posture: 'Au bord du rectangle : il compte les points.',
  expect: ['Traverser.', 'Aller-retour.', 'Traverser en deux touches.'],
  easier: '7 contre 3.', harder: '6 contre 4.',
  success: 'Des traversées régulières.',
  layout: { zones: [[16, 10, 68, 80, '']], supports: [[4, 35], [4, 65], [96, 35], [96, 65]],
    formations: () => [[24, 20], [50, 16], [76, 20], [24, 80], [50, 84], [76, 80]], formationsAway: () => [[36, 50], [56, 40], [64, 60]], ball: 'a1', script: [
    ['a1', 'b1', 'p', 'Départ du bout'], ['b1', 'b5', 'p', ''], ['b5', 'b3', 'p', ''], ['b3', 'a3', 'p', 'Joueur de l’autre bout : 3 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'perd', sub: 'Zone 3 · Pressing', name: 'Conservation alternée', obj: 'Récupérer puis transmettre de l’autre côté',
  id: 'mc-conservation-alternee', likes: 1, title: 'Conservation alternée à trois équipes', theme: 'Conservation', phase: 'transition', type: 'Jeu',
  players: [12, 18, 18], size: [40, 50], duration: 15, intensity: 4, defenders: 6,
  src: MYCOACH.src('Conservation alternée', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Trois équipes, demi-terrain coupé en deux : on récupère le ballon et on le transmet à l’équipe qui attend de l’autre côté ; celle qui l’a perdu traverse pour presser.',
  rules: [
    'Demi-terrain coupé en deux. Une équipe conserve dans un camp, une équipe la presse, la troisième attend dans l’autre camp.',
    'L’équipe qui récupère le ballon le transmet par une passe à l’équipe en attente.',
    'Elle reste dans son camp ; l’équipe qui a perdu le ballon traverse pour aller le récupérer de l’autre côté.',
    'Et ainsi de suite.'
  ],
  coach: ['Presser ensemble pour récupérer vite.', 'Transmettre au sol, précis.', 'Traverser à fond après la perte.'],
  posture: 'Sur la ligne médiane : il compte les récupérations.',
  expect: ['Conserver.', 'Récupérer et transmettre.', 'Traverser et presser vite.'],
  easier: 'Camps plus grands.', harder: 'Deux touches.',
  success: 'Des transitions intenses.',
  layout: { thirdTeam: true, zones: [[50, 0, .01, 100, '']],
    formations: () => [[10, 15], [24, 6], [40, 15], [10, 85], [24, 94], [40, 85], [60, 30], [76, 20], [90, 40], [60, 70], [76, 80], [90, 60]], formationsAway: () => [[18, 36], [30, 42], [20, 62], [34, 60], [40, 50], [12, 50]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Conservation'], ['b2', 'r2', 'p', 'Récupération'], ['r2', 'b9', 'p', 'Transmission à l’équipe en attente'], ['b1', [70, 30], 'c+', 'L’équipe qui a perdu traverse'], ['b3', [70, 70], 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Bascule par les jokers', obj: 'Changer de côté avant d’attaquer',
  id: 'mc-bascule-jokers', likes: 1, title: 'Conservation avec bascule avant de marquer', theme: 'Renversement', phase: 'ballon', type: 'Jeu',
  players: [18, 20, 20], size: [40, 40], duration: 12, intensity: 3,
  src: MYCOACH.src('Conservation avec bascule avant de marquer', 'Samy Makhloufi', 'FC Drouais'),
  goal: '8 contre 8 avec gardiens et quatre jokers sur les côtés : toucher un joker à droite puis à gauche avant de pouvoir marquer.',
  rules: [
    '8 contre 8 + 2 gardiens, 4 jokers neutres sur les côtés.',
    'L’équipe en possession touche un joker d’un côté puis de l’autre avant d’avoir le droit de marquer.',
    'L’équipe qui défend presse ; si elle récupère, elle peut attaquer directement.',
    '3 séquences de 4 minutes. Variantes : 30 × 30 ; 2 touches.'
  ],
  coach: ['Occuper la largeur.', 'Transmettre vite d’un côté à l’autre.', 'Attaquer dès que la bascule est faite.'],
  posture: 'Sur la touche : il vérifie les deux côtés touchés.',
  expect: ['Toucher un côté.', 'Toucher les deux.', 'Marquer après la bascule.'],
  easier: 'Un joker suffit.', harder: '2 touches.',
  success: 'Le jeu bascule avant chaque attaque.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], supports: [[30, 2], [70, 2], [30, 98], [70, 98]],
    formations: n => [[16, 30], [16, 70], [26, 10], [26, 90], [34, 40], [34, 60], [46, 50], [54, 30]].slice(0, n), ball: 'b5', script: [
    ['b5', 'a1', 'p', 'Joker côté gauche'], ['a1', 'b7', 'p', ''], ['b7', 'a4', 'p', 'Joker côté droit'], ['a4', 'b6', 'p', 'Bascule faite'], ['b6', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Départ du gardien contre un bloc haut', obj: 'Partir du gardien face à un bloc haut',
  id: 'mc-depart-gardien', likes: 1, title: 'Situation de départ d’action', theme: 'Relance', phase: 'ballon', type: 'Jeu',
  players: [14, 15, 16], size: [55, 64], duration: 30, intensity: 3, defenders: 6,
  src: MYCOACH.src('Situation départ d’action', 'Maxime Loustalot', 'Tartas St-Yaguen'),
  goal: '8 bleus contre 6 rouges : les bleus relancent depuis leur gardien et visent trois petits buts ; les rouges pressent haut.',
  rules: [
    'Demi-terrain coupé en deux. 8 bleus contre 6 rouges (3 dans chaque moitié ; un attaquant côté ballon peut venir défendre en zone basse).',
    'Les bleus repartent du gardien et doivent marquer dans un des trois petits buts.',
    'À la récupération : si elle est basse, mettre le ballon en sécurité sur deux soutiens ; si elle est haute, marquer en 3 passes.',
    'Une troisième équipe attend ; les bleus vont ensuite défendre contre elle.'
  ],
  coach: ['Se déplacer dans les intervalles, rompre les alignements.', 'Largeur pour créer des intervalles.', 'Communiquer pour se retourner.'],
  posture: 'Derrière le but bleu : il observe la relance.',
  expect: ['Sortir du pressing.', 'Marquer dans un petit but.', 'Sortir en moins de 6 passes.'],
  easier: 'Rouges à 5.', harder: 'Rouges à 7.',
  success: 'La relance sort face au bloc haut.',
  layout: { goals: [[1.5, 50, 90]], keepersAt: [[5, 50]], minis: [[98.5, 20, 90], [98.5, 50, 90], [98.5, 80, 90]], zones: [[50, 0, .01, 100, '']],
    formations: n => [[14, 30], [14, 70], [24, 8], [24, 92], [30, 50], [44, 30], [44, 70], [56, 50]].slice(0, n), formationsAway: n => [[26, 36], [26, 64], [40, 50], [66, 30], [66, 70], [74, 50]].slice(0, n), ball: 'gb', script: [
    ['gb', 'b1', 'p', 'Départ du gardien'], ['r1', [18, 34], 'c+', 'Bloc haut adverse'], ['b1', 'b3', 'p', 'Largeur'], ['b3', 'b6', 'p', 'Intervalle'], ['b6', 'b8', 'p', ''], ['b8', [98.5, 50], 's', 'Petit but']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Un défenseur de plus toutes les 10 secondes', obj: 'Conserver puis aller finir',
  id: 'mc-quinze-secondes', likes: 1, title: 'Jeu des 15 secondes', theme: 'Conservation', phase: 'ballon', type: 'Situation',
  players: [12, 13, 14], size: [40, 50], duration: 20, intensity: 3, defenders: 6,
  src: MYCOACH.src('Jeu des 15 secondes', 'Morgan Girardet', 'US des Berges du Rhône'),
  goal: 'Les attaquants conservent dans un carré ; toutes les 10 secondes un défenseur entre. Quand tous sont entrés, on sort marquer.',
  rules: [
    'Les bleus conservent dans un carré au milieu ; les rouges attendent dans une zone à côté.',
    'Toutes les 10 secondes, un rouge entre dans le carré pour récupérer.',
    'Quand tous sont entrés, les bleus sortent marquer ; seuls les deux rouges restés devant le but et les deux derniers entrés défendent (6 contre 4).',
    'But = 3 points ; interception = 1 point pour les rouges.'
  ],
  coach: ['Qualité contrôle-passe.', 'Prise d’information.', 'Sortir vite quand c’est le moment.'],
  posture: 'Au bord du carré : il fait entrer les défenseurs.',
  expect: ['Conserver jusqu’au bout.', 'Sortir vite.', 'Marquer.'],
  easier: 'Un défenseur toutes les 15 secondes.', harder: 'Toutes les 7 secondes.',
  success: 'Possession tenue puis attaque rapide.',
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[20, 25, 30, 50, 'Carré'], [0, 0, 16, 24, 'Attente']],
    formations: () => [[24, 30], [46, 30], [24, 70], [46, 70], [35, 40], [35, 60]], formationsAway: () => [[36, 50], [6, 6], [12, 12], [6, 18], [80, 40], [80, 60]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Conservation dans le carré'], ['r2', [30, 34], 'c+', 'Un défenseur entre toutes les 10 secondes'], ['b2', 'b4', 'p', ''], ['b4', [70, 66], 'd', 'Tout le monde est entré : on sort'], ['b4', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Côtés réservés aux jokers', obj: 'Marquer en passant par les côtés',
  id: 'mc-cotes-jokers', likes: 1, title: 'Jeu vers l’avant et finition par les côtés', theme: 'Largeur', phase: 'ballon', type: 'Jeu',
  players: [14, 16, 16], size: [40, 40], duration: 25, intensity: 3,
  src: MYCOACH.src('Jeu vers l’avant et finition en passant par les côtés', 'Jérôme Mauri', 'JS Istres'),
  goal: 'Les joueurs du centre ne vont pas sur les côtés, les jokers latéraux ne rentrent pas : on finit au centre sur un centre.',
  rules: [
    'Terrain de la largeur de la surface sur 40 m, deux couloirs latéraux avec des jokers.',
    'Les joueurs du centre ne vont pas dans les couloirs ; les jokers n’entrent pas dans le terrain.',
    'Variables : les jokers adverses gênent les passes sans intercepter, puis interceptent sans duel, puis duel réel.',
    'Variable : le passeur peut rejoindre le joker pour un 2 contre 1 dans le couloir.'
  ],
  coach: ['Écarter vers le joker, puis attaquer la surface.', 'Passage dans le dos en 2 contre 1.', 'Arriver à plusieurs sur le centre.'],
  posture: 'Sur le côté : il fait évoluer les variables.',
  expect: ['Passer par un côté.', 'Marquer sur centre.', 'Réussir le 2 contre 1 dans le couloir.'],
  easier: 'Jokers non gênés.', harder: 'Opposition réelle dans les couloirs.',
  success: 'Des buts sur centre.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[0, 0, 100, 15, 'Couloir'], [0, 85, 100, 15, 'Couloir']], supports: [[40, 7, 'J'], [70, 7, 'J'], [40, 93, 'J'], [70, 93, 'J']],
    formations: n => [[18, 35], [18, 65], [36, 50], [50, 30], [50, 70]].slice(0, n), ball: 'b3', script: [
    ['b3', 'a2', 'p', 'Passe au joker du couloir'], ['b5', [86, 44], 'c+', 'Attaque de la surface'], ['a2', [86, 44], 'p', 'Centre'], ['b5', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Corners : trois signaux', obj: 'Combiner sur corner',
  id: 'mc-corners-signaux', likes: 1, title: 'Combinaisons sur corner', theme: 'Coups de pied arrêtés', phase: 'ballon', type: 'Exercice',
  players: [8, 11, 14], size: [40, 30], duration: 20, intensity: 2, defenders: 0,
  src: MYCOACH.src('combinaison corner', 'Samy Makhloufi', 'FC Drouais'),
  goal: 'Trois combinaisons de corner annoncées par un signal du tireur.',
  rules: [
    'Bras levé : un joueur au premier poteau vient en appui-remise avec le tireur ; deux joueurs rentrent, deux vont vers le gardien, le troisième fait une course arrondie et reçoit au sol au point de penalty.',
    'Deux bras levés : six joueurs au second poteau, deux à la récupération ; tous partent au premier poteau sur un corner rentrant.',
    'Demi-bras : six joueurs à l’entrée de la surface ; le tireur trouve le joueur de sortie en appui-remise, puis le centreur sert le troisième qui rentre.',
    'Deux joueurs restent toujours à la récupération.'
  ],
  coach: ['Respecter le signal.', 'Courses au même moment, pas avant.', 'Toujours deux joueurs à la récupération.'],
  posture: 'Au point de penalty : il juge le timing des courses.',
  expect: ['Bonne combinaison au signal.', 'Bon timing.', 'Frappe cadrée.'],
  easier: 'Sans défenseur.', harder: 'Avec défenseurs en zone.',
  success: 'Les trois combinaisons sont maîtrisées.',
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], formations: () => [[99, 2], [90, 36], [80, 44], [80, 56], [84, 60], [74, 66], [62, 40], [62, 60], [56, 50]], ball: 'b1', script: [
    ['b2', [94, 14], 'c', 'Appui du premier poteau'], ['b1', [94, 14], 'p', 'Corner court'], ['b2', 'b1', 'p', 'Remise'], ['b5', [82, 50], 'c+', 'Course arrondie au point de penalty'], ['b1', [82, 50], 'p', 'Ballon au sol'], ['b5', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'perd', sub: 'Zone 3 · Pressing', name: 'Réagir à la perte', obj: 'Empêcher l’adversaire de s’organiser',
  id: 'mc-reagir-perte', likes: 15, title: 'Réagir à la perte', theme: 'Transition défensive', phase: 'transition', type: 'Jeu',
  players: [14, 16, 16], size: [40, 65], duration: 10, intensity: 4,
  src: MYCOACH.src('Réaction à la perte / Empêcher l’adversaire de s’organiser', 'Dylan Leverrier', 'AS Verson'),
  goal: 'Dès la perte, cadrer le porteur et fermer ses solutions pour l’empêcher de s’organiser.',
  rules: [
    'Deux équipes en 3-2-3. Quatre portes à attaquer, quatre à défendre, au fond de chaque zone de finition.',
    'Point : passe à un partenaire à travers une porte adverse. Jeu au sol. Hors-jeu dans les zones de finition.',
    'On ne défend que dans la zone axiale : il faut récupérer avant que l’adversaire en sorte.',
    'Dernière variante : le gardien peut servir de soutien.'
  ],
  coach: ['Le plus proche cadre le porteur tout de suite.', 'Les partenaires ferment les passes courtes pendant le cadrage.', 'Récupérer avant la zone de finition.'],
  posture: 'Sur la touche, au milieu de la zone axiale : il crie « perte ! » et compte 5 secondes.',
  expect: ['Cadrer dès la perte.', 'Fermer les passes autour du porteur.', 'Récupérer avant la zone de finition.'],
  easier: 'Portes plus étroites.', harder: 'Équipe qui récupère à un de plus.',
  success: 'L’adversaire ne sort presque jamais de la zone axiale.',
  also: [{ moment: 'recupere', sub: 'Zone 1 · Jouer vers l’avant', obj: 'Sortir du contre-pressing',
    posture: 'Côté de l’équipe qui récupère : il observe la première passe.',
    coach: ['Première passe loin de la pression.', 'Attaquer la zone de finition vite.'],
    expect: ['Garder le ballon.', 'Sortir de la zone axiale.', 'Passer une porte.'] }],
  layout: { zones: [[0, 0, 23, 100, 'Zone de finition'], [77, 0, 23, 100, 'Zone de finition']],
    cones: [[99, 8], [99, 20], [99, 32], [99, 44], [99, 56], [99, 68], [99, 80], [99, 92], [1, 8], [1, 20], [1, 32], [1, 44], [1, 56], [1, 68], [1, 80], [1, 92]],
    formations: n => [[28, 20], [28, 50], [28, 80], [40, 36], [40, 64], [54, 20], [54, 50], [54, 80]].slice(0, n), ball: 'b7', script: [
    ['b7', 'b8', 'p', 'Attaque bleue'], ['r7', [56, 76], 'c+', ''],
    ['b8', 'r7', 'p', 'Passe interceptée : perte du ballon'],
    ['b8', [60, 76], 'c+', 'Le plus proche cadre'], ['b5', [50, 70], 'c+', 'Les autres ferment les passes'], ['b7', [56, 62], 'c+', ''],
    ['b8', 'r7', 'c', 'Récupération immédiate']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Ligne de déséquilibre', obj: 'Fixer d’un côté pour jouer de l’autre',
  id: 'mc-ligne-desequilibre', likes: 1, title: 'Déséquilibrer pour finir', theme: 'Renversement', phase: 'ballon', type: 'Situation',
  players: [12, 13, 14], size: [50, 60], duration: 20, intensity: 3, defenders: 5,
  src: MYCOACH.src('Déséquilibrer pour finir', 'Samy Makhloufi', 'FC Drouais'),
  goal: '6 contre 4 dans la zone médiane, 1 contre 1 en zone de finition : franchir la ligne de déséquilibre par une passe, idéalement après une porte de côté.',
  rules: [
    'Zone médiane : 6 bleus contre 4 rouges, qui ne défendent pas dans le couloir opposé au ballon. Zone de finition : 1 contre 1.',
    'Passage en zone offensive seulement par une passe ; un rouge peut alors venir défendre en zone de finition.',
    'Bleus : but = 1 point ; but précédé d’un passage dans une porte de côté = 3 points.',
    'Rouges : marquer dans un des trois petits buts = 1 point. Rotation tous les 6 ballons.'
  ],
  coach: ['Utiliser la largeur.', 'Fixer puis jouer à l’opposé au bon moment.', 'Changer de rythme.'],
  posture: 'Au rond central, source des ballons : il observe le côté faible.',
  expect: ['Franchir la ligne.', 'Passer par une porte de côté.', 'Marquer 3 points.'],
  easier: '7 contre 4.', harder: 'Deux touches.',
  success: 'Des attaques qui finissent du côté faible.',
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], minis: [[1.5, 20, 90], [1.5, 50, 90], [1.5, 80, 90]], zones: [[66, 0, .01, 100, '']], cones: [[62, 2], [62, 14], [62, 86], [62, 98]],
    formations: () => [[22, 50], [36, 20], [36, 80], [48, 38], [48, 62], [56, 50], [74, 50]], formationsAway: () => [[50, 30], [50, 50], [42, 42], [58, 66], [84, 50]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Fixer à gauche'], ['b2', 'b4', 'p', ''], ['b4', 'b3', 'p', 'Jouer à l’opposé'], ['b3', [64, 92], 'd', 'Porte de côté'], ['b3', 'b7', 'p', 'Passe en zone de finition'], ['b7', 'butR', 's', 'But : 3 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Triangles de l’aile', obj: 'Se positionner pour sortir le ballon par l’aile',
  id: 'mc-triangles-aile', likes: 1, title: 'Relance par les ailes', theme: 'Relance', phase: 'ballon', type: 'Jeu',
  players: [16, 18, 20], size: [50, 64], duration: 20, intensity: 3,
  src: MYCOACH.src('Relance ailes - Densification', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Latéral, ailier, avant-centre et milieux forment des triangles pour amener le ballon à l’avant-centre ; dès qu’il le touche, on peut marquer.',
  rules: [
    '9 contre 9 ; deux milieux défensifs jouent avec l’équipe qui relance.',
    'Des coupelles marquent les zones à couvrir : un joueur par zone, triangles sur l’aile.',
    'Se déplacer pour ne jamais avoir un adversaire entre le ballon et soi ; amener le ballon à l’avant-centre.',
    'Dès que l’avant-centre touche le ballon, on peut aller marquer. Ballon récupéré : on repart du gardien. Alterner les ailes.'
  ],
  coach: ['Se démarquer de la ligne de passe adverse.', 'Triangles : toujours deux solutions.', 'Changer d’aile quand c’est fermé.'],
  posture: 'Sur la touche, côté du travail : il corrige les positions.',
  expect: ['Former le triangle.', 'Trouver l’avant-centre.', 'Marquer après l’avant-centre.'],
  easier: 'Trois milieux avec l’équipe qui relance.', harder: 'Un seul milieu joker.',
  success: 'La relance arrive à l’avant-centre.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], supports: [[34, 40, 'J'], [34, 60, 'J']], discs: [[24, 8], [44, 12], [56, 30], [66, 50]],
    formations: n => [[14, 30], [14, 70], [24, 8], [24, 92], [44, 12], [44, 88], [56, 30], [66, 50]].slice(0, n), ball: 'gb', script: [
    ['gb', 'b1', 'p', 'Relance'], ['b1', 'b3', 'p', 'Latéral'], ['b3', 'b5', 'p', 'Ailier'], ['b5', 'a1', 'p', 'Milieu en soutien'], ['a1', 'b7', 'p', ''], ['b7', 'butR', 's', 'L’avant a touché : on peut marquer']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'recupere', sub: 'Zone 1 · Jouer vers l’avant', name: 'Transmettre en 4 secondes', obj: 'Attaquer vite après la récupération',
  id: 'mc-attaque-rapide', likes: 0, title: 'Attaque rapide après la récupération', theme: 'Transition offensive', phase: 'transition', type: 'Situation',
  players: [16, 17, 18], size: [50, 70], duration: 24, intensity: 4, defenders: 7,
  src: MYCOACH.src('attaque rapide', 'Samy Makhloufi', 'FC Drouais'),
  goal: 'Les rouges attaquent placé ; à la récupération, les bleus ont 4 secondes pour trouver un partenaire en zone médiane, puis 3 contre 1.',
  rules: [
    'Zone défensive bleue : 6 rouges attaquent contre 5 bleus en barrage. Zone médiane : 3 bleus contre 1 rouge.',
    'Les rouges doivent marquer sur attaque placée.',
    'À la récupération, les bleus transmettent en moins de 4 secondes à un partenaire en zone médiane ; les 3 bleus vont finir contre le défenseur.',
    'Hors-jeu appliqué. 3 séquences de 8 ballons.'
  ],
  coach: ['Regarder devant dès la récupération.', 'Passe longue au sol si possible.', 'Finir vite le 3 contre 1.'],
  posture: 'Sur la touche, à la ligne médiane : il compte les 4 secondes.',
  expect: ['Récupérer.', 'Transmettre en 4 secondes.', 'Marquer.'],
  easier: '6 secondes.', harder: '3 secondes.',
  success: 'Des attaques rapides réussies.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], keepersAt: [[5, 50]], zones: [[40, 0, .01, 100, '']],
    formations: () => [[16, 30], [16, 70], [24, 50], [30, 20], [30, 80], [58, 30], [58, 70], [62, 50], [36, 50]], formationsAway: () => [[30, 36], [30, 64], [36, 20], [36, 80], [44, 50], [24, 60], [80, 50]], ball: 'r5', script: [
    ['r5', 'r1', 'p', 'Attaque placée rouge'], ['r1', 'b3', 'p', 'Récupération bleue'], ['b3', 'b8', 'p', 'Transmission en moins de 4 secondes'],
    ['b6', [80, 30], 'c+', ''], ['b8', 'b6', 'p', '3 contre 1'], ['b6', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'ludique', sub: 'Cartes avantage et handicap', name: 'Cartes avantage et handicap', obj: 'Jouer en s’adaptant aux contraintes',
  id: 'mc-cartes', likes: 0, title: 'Jeu avantage-handicap', theme: 'Ludique', phase: 'ballon', type: 'Jeu',
  players: [10, 14, 16], size: [35, 45], duration: 40, intensity: 3,
  src: MYCOACH.src('Jeu - avantage/handicap', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Match sur terrain réduit ; toutes les 3 minutes, une équipe tire une carte avantage ou handicap valable 2 minutes.',
  rules: [
    'Match libre sur un terrain réduit.',
    'Toutes les 3 minutes, un joueur tire une carte (à tour de rôle entre les équipes).',
    'Avantage : par exemple un joueur de plus, but double. Handicap : par exemple 3 touches maximum, sinon ballon à l’adversaire.',
    'L’effet dure 2 minutes, puis retour au jeu libre.'
  ],
  coach: ['S’adapter vite à la règle.', 'Profiter de l’avantage.', 'Rester solide pendant le handicap.'],
  posture: 'Au bord : il garde les cartes et le chrono.',
  expect: ['Respecter la carte.', 'Marquer pendant un avantage.', 'Ne pas encaisser pendant un handicap.'],
  easier: 'Cartes avantage seulement.', harder: 'Cartes handicap plus dures.',
  success: 'Du jeu, du plaisir et de l’adaptation.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], formations: n => [[18, 30], [18, 70], [34, 50], [46, 25], [46, 75], [58, 50]].slice(0, n), ball: 'b3', script: [
    ['b3', 'b4', 'p', 'Jeu libre'], ['b6', [80, 40], 'c+', ''], ['b4', 'b6', 'p', ''], ['b6', 'butR', 's', 'But']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Conserver dans sa surface', obj: 'Garder son calme sous pression près de son but',
  id: 'mc-conserver-surface', likes: 0, title: 'Conservation sous pression près du but', theme: 'Relance', phase: 'ballon', type: 'Jeu',
  players: [12, 13, 14], size: [17, 32], duration: 20, intensity: 3, defenders: 4,
  src: MYCOACH.src('Conservations sous pression 3', 'Jérôme Mauri', 'JS Istres'),
  goal: 'Dans la surface réduite, huit défenseurs et le gardien conservent contre quatre attaquants ; si le ballon sort, les attaquants attaquent tout de suite.',
  rules: [
    'Surface réduite (32 × 16,5) : 8 bleus + gardien au pied contre 4 rouges. 3 touches, puis 2.',
    'Les bleus conservent le ballon.',
    'Ballon sorti (mauvais contrôle, passe ratée…) : l’éducateur donne un ballon aux rouges, qui doivent marquer vite ; les bleus s’organisent.',
    'But marqué : nouveau ballon aux rouges. 6 séquences de 3 minutes, 1 minute de récupération.'
  ],
  coach: ['Rester lucide sous pression.', 'Utiliser le gardien.', 'Se réorganiser vite si le ballon est perdu.'],
  posture: 'Au bord de la surface : il remet les ballons aux rouges.',
  expect: ['Conserver 1 minute.', 'Ne pas perdre de ballon.', 'Défendre vite le ballon donné aux rouges.'],
  easier: '4 touches.', harder: '2 touches.',
  success: 'Calme et précision près du but.',
  layout: { goals: [[1.5, 50, 90]], keepersAt: [[5, 50]], formations: n => MYCOACH.grid(n, 10, 10, 90, 90), formationsAway: () => [[30, 40], [50, 60], [70, 40], [50, 30]], ball: 'gb', script: [
    ['gb', 'b1', 'p', 'Le gardien participe'], ['b1', 'b3', 'p', 'Conservation'], ['b3', 'b6', 'p', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Combinaison et courses croisées', obj: 'Transition rapide jusqu’à la finition',
  id: 'mc-courses-croisees', likes: 0, title: 'Transition offensive, combinaison et finition', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [6, 8, 16], size: [50, 64], duration: 25, intensity: 3, params: { unit: 'postes' },
  src: MYCOACH.src('Transition offensive - combinaison - finition', 'Jérôme Mauri', 'JS Istres'),
  goal: 'Une chaîne de passes rapides, puis le passeur de départ appelle dans le couloir et centre pour deux joueurs qui ont croisé leurs courses.',
  rules: [
    'A sert B, B donne à C, C remet à D qui appelle ; D donne à E, E remet à F.',
    'F sert dans la course de A, qui a temporisé puis appelé dans le couloir ; A centre.',
    'B, passé dans le dos de D, arrive au second poteau ; D, après sa passe, poursuit vers le premier.',
    'Variante : F choisit le couloir droit ou gauche.'
  ],
  coach: ['Passes rapides, peu de touches.', 'Temporiser avant l’appel dans le couloir.', 'Courses croisées dans la surface.'],
  posture: 'À l’entrée de la surface : il observe les courses croisées.',
  expect: ['Chaîne sans faute.', 'Centre exploitable.', 'But.'],
  easier: 'Deux touches partout.', harder: 'Une touche partout.',
  success: 'Deux joueurs dans la surface sur chaque centre.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, start: [20, 80], home: [[20, 80], [32, 60], [44, 70], [46, 48], [60, 56], [62, 36]], ball: [23, 83], moves: [
    [23, 83, 30, 62, 'p', 'A sert B'], [32, 60, 42, 68, 'p', ''], [44, 70, 46, 52, 'p', 'Remise à D'], [46, 48, 58, 54, 'p', ''], [60, 56, 62, 40, 'p', 'Remise à F'],
    [20, 80, 76, 88, 'c+', 'A appelle dans le couloir'], [62, 36, 76, 86, 'p', 'F lance A'], [32, 60, 88, 60, 'c+', 'Second poteau'], [46, 48, 88, 42, 'c+', 'Premier poteau'],
    [76, 86, 88, 60, 'p', 'Centre'], [88, 60, 98, 52, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'nepossede', sub: 'Zone 3 · Défendre haut', name: 'Pressing orienté', obj: 'Forcer la relance sur un côté puis presser fort',
  id: 'mc-pressing-oriente', likes: 0, title: 'Pressing orienté et récupération rapide', theme: 'Pressing', phase: 'sans', type: 'Jeu',
  players: [12, 14, 14], size: [40, 60], duration: 20, intensity: 4, defenders: 7,
  src: MYCOACH.src('Pressing orienté et récupération rapide', 'Samy Makhloufi', 'FC Drouais'),
  goal: 'Les deux attaquants ferment l’axe et orientent la relance sur un côté ; au moment de la passe latérale, le piston sort fort et tout le bloc suit.',
  rules: [
    'Bleus : 3 défenseurs, 2 relayeurs et un gardien. Rouges à 7 : 2 attaquants, 2 pistons, 2 milieux, un 10.',
    'Les attaquants ferment l’axe et la passe vers le 6 ; l’attaquant axial presse en diagonale pour orienter la relance.',
    'Passe vers un latéral : le piston sort sur le temps de passe, le milieu côté ballon ferme l’intérieur, le 10 suit, l’attaquant bloque la passe en retrait.',
    'Rouges : finir en 3 passes après la récupération. Bleus : trouver un joueur cible derrière la ligne, au sol = 1 point.'
  ],
  coach: ['Coordonner le pressing, communiquer.', 'Sortir sur le temps de passe.', 'Course en diagonale de l’attaquant.'],
  posture: 'Sur la touche, côté du pressing : il annonce le déclenchement.',
  expect: ['Orienter vers un côté.', 'Presser sur le temps de passe.', 'Récupérer et finir en 3 passes.'],
  easier: 'Bleus en 2 touches.', harder: 'Bleus en touches libres.',
  success: 'La relance est piégée sur un côté.',
  layout: { goals: [[1.5, 50, 90]], keepersAt: [[5, 50]], supports: [[99, 50, 'C']], zones: [[0, 0, 100, 28, ''], [0, 72, 100, 28, '']],
    formations: () => [[14, 30], [14, 50], [14, 70], [28, 40], [28, 60]], formationsAway: () => [[32, 46], [34, 60], [40, 14], [40, 86], [46, 40], [46, 60], [40, 50]], ball: 'b2', script: [
    ['b2', 'b1', 'p', 'Relance orientée sur un côté'], ['r1', [24, 40], 'c+', 'L’attaquant presse en diagonale'], ['r3', [20, 22], 'c+', 'Le piston sort sur le temps de passe'], ['r5', [24, 34], 'c+', 'Le milieu ferme l’intérieur'], ['r3', [16, 28], 'c', 'Récupération']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'nepossede', sub: 'Zone 3 · Défendre haut', name: 'Pressing haut en 10 secondes', obj: 'Pressing haut organisé',
  id: 'mc-pressing-10s', likes: 0, title: 'Bloc haut', theme: 'Pressing', phase: 'sans', type: 'Jeu',
  players: [18, 20, 20], size: [50, 60], duration: 24, intensity: 4, defenders: 10,
  src: MYCOACH.src('bloc haut', 'Samy Makhloufi', 'FC Drouais'),
  goal: 'L’équipe A relance depuis son gardien ; l’équipe B presse haut et doit récupérer dans les 10 secondes.',
  rules: [
    'Équipe A en 4-3-1 (avec gardien), équipe B en 3-5-2. Départ du gardien A.',
    'B presse haut dès la relance ; zone de pressing à 20 m du but adverse.',
    'B : récupération en moins de 10 secondes puis but = 2 points.',
    'A : sortir et franchir la ligne médiane = 1 point ; puis but = 3 points. Ballon au sol entre centraux et pistons : pressing déclenché.'
  ],
  coach: ['Déclencher ensemble.', 'Couper les passes intérieures.', 'Récupérer vite et finir.'],
  posture: 'Sur la touche, à 20 m du but : il compte les 10 secondes.',
  expect: ['Presser ensemble.', 'Récupérer en 10 secondes.', 'Marquer après la récupération.'],
  easier: '15 secondes.', harder: '8 secondes.',
  success: 'Des récupérations hautes répétées.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[0, 0, 30, 100, 'Zone de pressing'], [50, 0, .01, 100, '']],
    formations: () => [[14, 15], [12, 38], [12, 62], [14, 85], [28, 30], [26, 50], [28, 70], [40, 50]], formationsAway: () => [[24, 40], [24, 60], [34, 10], [34, 90], [38, 30], [36, 50], [38, 70], [56, 30], [56, 50], [56, 70]], ball: 'gb', script: [
    ['gb', 'b2', 'p', 'Relance'], ['r1', [16, 40], 'c+', 'Pressing haut'], ['r5', [30, 34], 'c+', ''], ['b2', 'b5', 'p', ''], ['r5', [28, 30], 'c', 'Récupération en moins de 10 secondes'], ['b5', 'r5', 'p', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'ludique', sub: 'Gestion du score', name: 'Gestion du score', obj: 'Rester lucide sous pression',
  id: 'mc-gestion-score', likes: 0, title: 'Jeu pour travailler le mental et la gestion du score', theme: 'Mental', phase: 'ballon', type: 'Jeu',
  players: [14, 16, 21], size: [50, 60], duration: 24, intensity: 3,
  src: MYCOACH.src('Jeu pour travailler le mental et la gestion du score', 'Samy Makhloufi', 'FC Drouais'),
  goal: 'Trois équipes de 7 ; une équipe commence avec un but d’avance et doit le gérer, en infériorité dans les 2 dernières minutes.',
  rules: [
    'Matchs de 8 minutes ou 2 buts ; la troisième équipe attend (gainage).',
    'Une équipe démarre avec un but d’avance.',
    'À 2 minutes de la fin, l’équipe qui mène joue à 6 contre 7.',
    'Si elle garde son avance, elle reste ; si une équipe encaisse dans la dernière minute, elle commence le match suivant à un de moins.'
  ],
  coach: ['Calmer le jeu, conserver.', 'Communiquer.', 'Rester concentré jusqu’au bout.'],
  posture: 'Au bord : il annonce le temps restant.',
  expect: ['Garder l’avance.', 'Conserver en infériorité.', 'Ne rien encaisser dans la dernière minute.'],
  easier: 'Pas d’infériorité.', harder: 'Infériorité dès 3 minutes de la fin.',
  success: 'Des fins de match maîtrisées.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], formations: n => [[16, 30], [16, 70], [30, 50], [42, 20], [42, 80], [54, 40], [56, 60]].slice(0, n), ball: 'b3', script: [
    ['b3', 'b1', 'p', 'On garde le ballon'], ['b1', 'b2', 'p', ''], ['b2', 'b5', 'p', 'Calmer le jeu']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'recupere', sub: 'Zone 3 / Box · Marquer le but', name: 'Attaquer, défendre, sortir', obj: 'Gérer son temps d’avance',
  id: 'mc-1c1-chaine', likes: 0, title: 'Gestion du temps d’avance en 1 contre 1', theme: 'Transition', phase: 'transition', type: 'Jeu',
  players: [6, 7, 12], size: [25, 30], duration: 20, intensity: 4, defenders: 2,
  src: MYCOACH.src('Gestion du temps d’avance (1 contre 1) et transition', 'Ibrahim Coulibaly', 'Sarcelles AAS'),
  goal: 'Chaque joueur attaque, puis défend sur l’adversaire suivant, puis sort : appui-remise avec l’éducateur, frappe, porte, défense.',
  rules: [
    'Deux équipes, un joueur à la fois.',
    'Pour attaquer, faire un appui-remise avec l’éducateur, puis frapper.',
    'Après sa frappe, traverser la porte et défendre sur l’adversaire qui entre au même moment.',
    'Variante : l’éducateur tourne le dos, l’attaquant doit prendre l’info et entrer en conduite.'
  ],
  coach: ['Aller vers l’espace libre pour garder son avance.', 'Frapper avant le retour.', 'Transition attaque-défense immédiate.'],
  posture: 'Au point d’appui : il fait la remise.',
  expect: ['Frapper.', 'Marquer.', 'Revenir défendre à temps.'],
  easier: 'Défenseur qui part plus tard.', harder: 'Défenseur qui part en même temps.',
  success: 'Des transitions sans temps mort.',
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], cones: [[60, 2], [70, 2]], supports: [[30, 50, 'É']],
    formations: () => [[10, 90], [16, 90]], formationsAway: () => [[90, 90], [84, 90]], ball: 'b1', script: [
    ['b1', 'a1', 'p', 'Appui'], ['a1', [56, 50], 'p', 'Remise'], ['b1', [56, 50], 'c+', ''], ['b1', 'butR', 's', 'Frappe'], ['b1', [65, 4], 'c', 'Il passe la porte et va défendre'], ['r1', [70, 70], 'c+', 'L’adversaire entre']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'perd', sub: 'Zone 2 · Freiner l’attaque', name: 'Couper le jeu direct', obj: 'Se réorganiser à la perte',
  id: 'mc-jeu-direct', likes: 25, title: 'S’organiser à la perte du ballon', theme: 'Transition défensive', phase: 'transition', type: 'Jeu',
  players: [13, 15, 15], size: [40, 50], duration: 20, intensity: 3,
  src: MYCOACH.src('S’organiser à la perte du ballon', 'Arnaud Dubois', 'FC Éloyes'),
  goal: 'À la perte, fermer le couloir de jeu direct vers la zone libre et se réorganiser.',
  rules: [
    'Les bleus attaquent le grand but ; les rouges défendent.',
    'À la récupération, les rouges doivent trouver un partenaire dans la zone libre, à l’opposé du but (il y est inattaquable).',
    'Ballon reçu dans la zone libre : les rouges attaquent à leur tour le grand but, les bleus défendent.',
    'Le jeu ne s’arrête pas : on change de statut à chaque récupération.'
  ],
  coach: ['À la perte, le plus proche ferme la passe vers la zone libre.', 'Les autres reviennent vite, intervalles serrés.', 'Ne pas tous courir au ballon.'],
  posture: 'Sur le côté, à hauteur de la zone libre : il observe le couloir de jeu direct à chaque perte.',
  expect: ['Fermer la passe vers la zone libre.', 'Garder les distances entre défenseurs.', 'Récupérer avant la zone libre.'],
  easier: 'Zone libre plus petite.', harder: 'Deux partenaires dans la zone libre.',
  success: 'La passe vers la zone libre est rarement possible.',
  also: [{ moment: 'recupere', sub: 'Zone 1 · Jouer vers l’avant', obj: 'Trouver la zone libre',
    posture: 'Derrière la zone libre : il observe la première passe après la récupération.',
    coach: ['Regarder la zone libre dès la récupération.', 'Passe longue au sol si elle est ouverte.'],
    expect: ['Regarder devant.', 'Trouver la zone libre.', 'Puis marquer.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[0, 0, 14, 100, 'Zone libre']],
    formations: n => [[34, 30], [34, 70], [50, 50], [62, 20], [62, 80], [72, 40], [72, 60]].slice(0, n), formationsAway: n => [[7, 50], [84, 36], [84, 64], [70, 50], [56, 30], [56, 70], [46, 50]].slice(0, n), ball: 'b3', script: [
    ['b3', 'b6', 'p', 'Attaque bleue'], ['r4', [72, 44], 'c+', ''],
    ['b6', 'r4', 'p', 'Ballon perdu'],
    ['b3', [40, 46], 'c+', 'Le plus proche ferme le jeu direct'], ['b1', [26, 40], 'c+', 'Les autres reviennent'],
    ['r4', 'r6', 'p', 'Passe courte obligée : le contre est freiné']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
// Perte axiale avec les deux latéraux trop hauts : 2 défenseurs en place, 2 en retard, contre 5 attaquants.
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'perd', sub: 'Zone 2 · Freiner l’attaque', name: 'À 4 contre 5', obj: 'Ralentir pour laisser revenir les partenaires',
  id: 'mc-4c5', likes: 13, title: 'S’organiser en infériorité numérique', theme: 'Transition défensive', phase: 'transition', type: 'Situation',
  players: [10, 10, 13], size: [55, 60], duration: 21, intensity: 4, defenders: 4,
  src: MYCOACH.src('S’organiser en situation d’infériorité numérique', 'Grégory Joly', 'US Colomiers'),
  goal: 'Simuler une perte dans l’axe avec les latéraux trop hauts : les deux centraux freinent, les latéraux reviennent.',
  rules: [
    'Départ dans l’axe : appui-remise sur un attaquant, qui lance le 5 contre 4.',
    'Les deux défenseurs centraux défendent tout de suite ; les deux latéraux partent de haut et ne jouent qu’après la remise.',
    'Attaquants : but = 1 point, 2 points si le ballon est passé par la porte axiale.',
    'Défenseurs : dégagement = 1 point, +1 si le ballon passe une porte en moins de 10 secondes. Rotation tous les 4 ballons, côté droit et gauche.'
  ],
  coach: ['Reculer-freiner, densifier l’axe.', 'Orienter le porteur vers le côté, rester à distance d’intervention.', 'Communiquer et jouer le hors-jeu si possible.'],
  posture: 'Sur la touche, à hauteur des centraux : il observe le recul-frein et la communication.',
  expect: ['Ne pas se faire éliminer dans l’axe.', 'Tenir jusqu’au retour des latéraux.', 'Récupérer et passer une porte.'],
  easier: 'Les latéraux partent plus bas.', harder: 'Les latéraux ne reviennent qu’à la passe du milieu axial.',
  success: 'Les attaquants sont poussés sur un côté avant de pouvoir frapper.',
  also: [{ moment: 'recupere', sub: 'Zone 2 · Chercher la zone 3', obj: 'Exploiter la supériorité après la récupération',
    posture: 'Derrière les attaquants : il observe la vitesse d’attaque avant le retour des latéraux.',
    coach: ['Attaquer vite, avant le retour des latéraux.', 'Passer par l’axe si la porte est ouverte.'],
    expect: ['Frapper.', 'Passer par la porte axiale.', 'Marquer 2 points.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], cones: [[70, 44], [70, 56], [6, 20], [6, 30], [6, 70], [6, 80]],
    formations: n => [[40, 50], [52, 22], [52, 78], [56, 40], [58, 60]].slice(0, n), formationsAway: n => [[82, 40], [82, 60], [50, 6], [50, 94]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b4', 'p', 'Appui'], ['b4', 'b1', 'p', 'Remise : la situation démarre'],
    ['r3', [74, 18], 'c+', 'Les latéraux reviennent'], ['r4', [74, 82], 'c+', ''],
    ['r1', [76, 44], 'c+', 'Les centraux reculent et freinent'], ['r2', [76, 58], 'c+', ''],
    ['b1', 'b2', 'p', 'Le jeu est poussé sur le côté']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'recupere', sub: 'Zone 3 / Box · Marquer le but', name: 'Contre en 8 secondes', obj: 'Profiter du déséquilibre adverse',
  id: 'mc-contre-8s', likes: 16, title: 'Contre-attaque et vitesse', theme: 'Transition offensive', phase: 'transition', type: 'Situation',
  players: [8, 9, 12], size: [50, 50], duration: 21, intensity: 4,
  src: MYCOACH.src('Contre attaque et vitesse', 'Timothée Bennoit', 'SO Velleronnais'),
  goal: 'Au numéro appelé, un attaquant part avec l’appui et doit marquer en moins de 8 secondes.',
  rules: [
    'Les attaquants conduisent chacun leur ballon dans leur zone ; les défenseurs attendent sur la ligne médiane, attentifs.',
    'Le coach appelle un numéro : l’attaquant et le défenseur de ce numéro partent.',
    'L’attaquant joue avec l’appui placé devant et doit marquer en moins de 8 secondes.',
    'Changement de rôles après 7 minutes.'
  ],
  coach: ['Réagir au numéro tout de suite.', 'Jouer vite avec l’appui, une ou deux touches.', 'Frapper avant le retour du défenseur.'],
  posture: 'Entre les deux groupes : il appelle les numéros et compte les 8 secondes.',
  expect: ['Démarrer au signal.', 'Frapper en moins de 8 secondes.', 'Marquer.'],
  easier: '10 secondes.', harder: 'Le coach appelle deux numéros : 2 + appui contre 2.',
  success: 'Des contres conclus avant le retour défensif.',
  also: [{ moment: 'perd', sub: 'Zone 1 / Box · Défendre le but', obj: 'Revenir sur un contre',
    posture: 'Derrière le but : il observe le défenseur appelé.',
    coach: ['Repartir vers son but par le chemin le plus court.', 'Se placer entre le ballon et le but.'],
    expect: ['Revenir à temps.', 'Empêcher la frappe.', 'Récupérer.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[0, 0, 30, 100, 'Zone des attaquants']], supports: [[72, 50]], ballsFor: 'b',
    formations: n => MYCOACH.grid(n, 6, 14, 28, 86), formationsAway: n => Array.from({ length: n }, (_, i) => [46, Math.round(12 + 76 * (i + .5) / n)]), ball: 'b1', script: [
    ['b1', [42, 30], 'd', 'Numéro appelé : l’attaquant part'], ['r1', [62, 40], 'c+', 'Le défenseur aussi'],
    ['b1', 'a1', 'p', 'Jeu avec l’appui'], ['b1', [80, 36], 'c+', ''],
    ['a1', [80, 36], 'p', 'Remise dans la course'], ['b1', 'butR', 's', 'But en moins de 8 secondes']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
// Petit carré 20 × 20 dans un grand 40 × 40 : 5 contre 2 dedans, puis 7 contre 5 dans le grand.
const EXO = {
  ...MYCOACH, moment: 'recupere', sub: 'Zone 1 · Jouer vers l’avant', name: 'Sortir du petit carré', obj: 'Sortir vite de la zone de récupération',
  id: 'mc-petit-carre', likes: 51, title: 'Conservation et transitions en deux carrés', theme: 'Transition offensive', phase: 'transition', type: 'Jeu',
  players: [12, 12, 14], size: [40, 40], duration: 20, intensity: 4, defenders: f => f - 5,
  src: MYCOACH.src('Conservation, jeu dans l’intervalle, transition défense-attaque/attaque-défense', 'Christophe Marchat', 'ES Douvaine-Loisin'),
  goal: 'Récupérer dans le petit carré, en sortir tout de suite et conserver dans le grand.',
  rules: [
    'Un carré de 20 × 20 au centre d’un carré de 40 × 40. Une équipe de 5 (bleus), une de 7 (rouges).',
    'Départ : 5 bleus contre 2 rouges dans le petit carré, les 5 autres rouges dans le grand.',
    'À la récupération, les rouges sortent du petit carré : 7 contre 5 dans le grand.',
    'Si les bleus récupèrent, ils cherchent à revenir dans le petit carré. 4 × 5 minutes.'
  ],
  coach: ['À la récupération, première passe vers l’extérieur.', 'Les rouges du grand carré se rendent disponibles avant la récupération.', 'Écarter le jeu dans le grand carré.'],
  posture: 'Au bord du petit carré : il observe la première passe après la récupération.',
  expect: ['Sortir du petit carré.', 'Sortir en une passe.', 'Conserver 6 passes dans le grand carré.'],
  easier: 'Petit carré plus grand.', harder: 'Deux touches dans le grand carré.',
  success: 'Le ballon quitte le petit carré dès la récupération.',
  also: [{ moment: 'perd', sub: 'Zone 3 · Pressing', obj: 'Récupérer et revenir dans le petit carré',
    posture: 'Dans le grand carré : il observe les bleus après la perte.',
    coach: ['Presser tout de suite le porteur.', 'Fermer la sortie vers le grand carré.'],
    expect: ['Presser dès la perte.', 'Récupérer.', 'Revenir dans le petit carré.'] }],
  layout: { zones: [[30, 30, 40, 40, 'Petit carré']],
    formations: n => [[33, 33], [67, 33], [67, 67], [33, 67], [50, 36]].slice(0, n), formationsAway: n => [[46, 50], [56, 54], [8, 10], [92, 10], [92, 90], [8, 90], [50, 92], [50, 8]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b2', 'p', '5 contre 2 dans le petit carré'], ['r2', [64, 36], 'c+', ''],
    ['b2', 'r2', 'p', 'Passe interceptée'],
    ['r4', [80, 76], 'c+', 'Les rouges du grand carré se proposent'],
    ['r2', 'r4', 'p', 'Sortie immédiate : 7 contre 5']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
// Terrain coupé en deux camps : chaque équipe conserve chez elle ; à la perte, 3 joueurs vont presser chez l'adversaire.
const EXO = {
  ...MYCOACH, game: 'Physique intégré', moment: 'physique', sub: '5 contre 3 en deux camps', name: '5 contre 3 en deux camps', obj: 'Développer la puissance aérobie',
  id: 'mc-5c3', likes: 14, title: 'Jeu de transition en 5 contre 3', theme: 'Physique', phase: 'ballon', type: 'Jeu',
  players: [10, 10, 12], size: [25, 40], duration: 40, intensity: 4, series: [360, 120],
  src: MYCOACH.src('Jeu de transition en 5 contre 3 + 2', 'Olivier Daviet', 'Garches Vaucresson FC'),
  goal: 'Conserver dans son camp à 5 contre 3, presser à 3 dans le camp adverse après la perte.',
  rules: [
    'Terrain de 40 × 25 coupé en deux camps. Deux équipes de 5, chacune dans son camp.',
    '8 passes de suite dans son camp = 1 point. 2 touches maximum.',
    'À la perte, 3 joueurs vont défendre dans le camp adverse (3 contre 5). À la récupération, ramener le ballon dans son camp.',
    '6 × 6 minutes, 2 minutes de récupération. Variantes : un 4e défenseur après 5 passes ; ballon au sol.'
  ],
  coach: ['Occuper tout l’espace de son camp.', 'Les 3 presseurs partent tout de suite.', 'Ramener le ballon chez soi en une ou deux passes.'],
  posture: 'Sur la ligne médiane : il compte les passes à voix haute et chronomètre les séries.',
  expect: ['Faire 8 passes.', 'Presser à 3 sans attendre.', 'Garder l’intensité sur les 6 séries.'],
  easier: '6 passes pour un point.', harder: 'Un 4e défenseur après 5 passes.',
  success: 'Des transitions rapides du début à la fin.',
  layout: { zones: [[50, 0, .01, 100, '']],
    formations: () => [[8, 20], [8, 80], [26, 12], [26, 88], [40, 50]], formationsAway: () => [[92, 20], [92, 80], [74, 12], [74, 88], [60, 50]], ball: 'b1', script: [
    ['b1', 'b3', 'p', 'Conservation dans son camp'],
    ['r5', [32, 40], 'c+', 'Trois rouges viennent presser'], ['r3', [20, 20], 'c+', ''], ['r4', [20, 76], 'c+', ''],
    ['b3', 'b5', 'p', '5 contre 3 : 8 passes = 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Vitesse', template: 'circuit', keepers: 1, moment: 'physique', sub: 'Vitesse de démarrage', name: 'Vitesse de démarrage', obj: 'Réagir à un départ',
  id: 'mc-demarrage', likes: 168, title: 'Vitesse de démarrage', theme: 'Physique', phase: 'ballon', type: 'Exercice',
  players: [2, 4, 8], size: [25, 37], duration: 25, intensity: 4, series: [12, 60], params: { unit: 'joueurs' },
  src: MYCOACH.src('Vitesse de démarrage', 'Timothée Bennoit', 'SO Velleronnais'),
  goal: 'L’attaquant choisit sa porte, le défenseur réagit : course sur 20 m, puis face au gardien.',
  rules: [
    'L’attaquant manipule le ballon entre deux plots rouges ; le défenseur attend dans un carré à côté.',
    'Quand il veut, l’attaquant part vers une des deux portes ; le défenseur démarre et doit l’empêcher de la franchir.',
    'Porte franchie : face à face avec le gardien sur 16,50 m.',
    'Pas de tacle par derrière. 2 séries de 4 passages, récupération complète.'
  ],
  coach: ['Défenseur : premier pas explosif, regarder les hanches de l’attaquant.', 'Attaquant : feinter avant de partir.', 'Récupération complète entre les passages.'],
  posture: 'Au niveau des portes : il observe le temps de réaction du défenseur.',
  expect: ['Démarrer tout de suite.', 'Rattraper avant la porte.', 'Gagner trois passages sur quatre.'],
  easier: 'Portes plus proches du défenseur.', harder: 'Le défenseur part dos à l’attaquant, au son.',
  success: 'Des départs explosifs, sans fatigue accumulée.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[10, 44], [10, 56], [50, 20], [50, 32], [50, 68], [50, 80]], discs: [[22, 66], [32, 66], [22, 76], [32, 76]],
    start: [12, 50], home: [[12, 50], [27, 71]], ball: [14, 52], moves: [
    [12, 50, 30, 30, 'd', 'L’attaquant choisit une porte'], [27, 71, 40, 34, 'c+', 'Le défenseur démarre'],
    [30, 30, 54, 26, 'd', 'Porte franchie'], [54, 26, 82, 42, 'd', 'Face au gardien'], [84, 44, 98, 48, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', moment: 'physique', sub: 'Garder son ballon', name: 'Garder son ballon', obj: 'Protéger son ballon sous l’effort',
  id: 'mc-garder-ballon', likes: 21, title: 'Garder son ballon', theme: 'Physique', phase: 'ballon', type: 'Jeu',
  players: [2, 10, 20], size: [15, 15], duration: 6, intensity: 4, series: [30, 30],
  src: MYCOACH.src('Garder son ballon - Résistance', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Par deux, un ballon chacun : protéger le sien et sortir celui du partenaire, 30 secondes à fond.',
  rules: [
    'Par deux dans une zone, un ballon chacun.',
    'Pendant 30 secondes, chacun garde son ballon et essaie de sortir celui de l’autre.',
    'Récupération de 30 secondes : passes tranquilles entre les deux.',
    '6 séquences de 30 secondes.'
  ],
  coach: ['Corps entre l’adversaire et le ballon.', 'Bras pour sentir l’adversaire, sans pousser.', 'Rester actif jusqu’au coup de sifflet.'],
  posture: 'Au bord de la zone : il chronomètre et relance les duels qui s’arrêtent.',
  expect: ['Rester actif 30 secondes.', 'Garder son ballon.', 'Sortir le ballon adverse.'],
  easier: '20 secondes d’effort.', harder: 'Zone plus petite.',
  success: 'Six séquences à pleine intensité.',
  layout: { ballsFor: 'br', formations: n => MYCOACH.grid(n, 10, 12, 90, 88).map(([x, y]) => [x - 5, y]), formationsAway: n => MYCOACH.grid(n, 10, 12, 90, 88).map(([x, y]) => [x + 5, y]), script: [
    ['b1', [20, 26], 'd', 'Chacun protège son ballon'], ['r1', [24, 22], 'c+', 'et attaque celui de l’autre']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Conduite par deux', obj: 'Se mettre en route balle au pied',
  id: 'mc-conduite-deux', likes: 886, title: 'Conduite par deux et slalom', theme: 'Conduite', phase: 'ballon', type: 'Exercice',
  players: [2, 4, 12], size: [7, 20], duration: 12, intensity: 1, params: { unit: 'joueurs' },
  src: MYCOACH.src('Echauffement', 'Timothée Bennoit', 'SO Velleronnais'),
  goal: 'Par deux, conduire jusqu’à chaque coupelle, échanger sa place, puis revenir en slalom.',
  rules: [
    'Un couloir de 20 m (quatre portions de 5 m), 7 m de large. Un ballon chacun.',
    'A et B partent ensemble en conduite, stoppent le ballon à la coupelle suivante et échangent leur position.',
    'On recommence jusqu’à la dernière coupelle.',
    'Retour en slalom entre les plots. 6 séries de 2 passages.'
  ],
  coach: ['Ballon proche du pied, tête levée.', 'Semelle pour stopper net.', 'Accélérer un peu à chaque série.'],
  posture: 'Au bout du couloir : il donne le départ et fait monter le rythme.',
  expect: ['Conduire sans perdre le ballon.', 'Stopper net à la coupelle.', 'Slalom rapide sans toucher un plot.'],
  easier: 'Pas d’échange de place.', harder: 'Pied faible seulement.',
  success: 'Tout le monde se met en route sans faute technique.',
  also: [MYCOACH.physique('Endurance capacité balle au pied', 'Au bout du couloir : il impose un rythme régulier et chronomètre les séries.')],
  layout: { discs: [[10, 25], [35, 25], [60, 25], [85, 25], [10, 75], [35, 75], [60, 75], [85, 75]], cones: [[20, 50], [40, 50], [60, 50], [80, 50]],
    start: [6, 25], home: [[6, 25], [6, 75]], ball: [9, 28], balls: [[9, 78]], moves: [
    [6, 25, 33, 25, 'd', 'Conduite jusqu’à la coupelle'], [6, 75, 33, 75, 'd+', ''],
    [33, 25, 35, 72, 'c', 'Échange de position'], [33, 75, 35, 28, 'c+', ''],
    [35, 72, 85, 72, 'd', 'Jusqu’au bout'], [85, 72, 10, 50, 'd', 'Retour en slalom']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', moment: 'physique', sub: 'Passes et tour du plot', name: 'Passes et tour du plot', obj: 'Changer de rythme sur des efforts courts',
  id: 'mc-tour-plot', likes: 516, title: 'Endurance puissance avec ballon', theme: 'Physique', phase: 'ballon', type: 'Exercice',
  players: [2, 2, 4], size: [15, 25], duration: 20, intensity: 4, series: [30, 30],
  src: MYCOACH.src('Endurance puissance avec ballon', 'Timothée Bennoit', 'SO Velleronnais'),
  goal: 'Par deux, se faire des passes, puis sprinter autour de son plot au coup de sifflet.',
  rules: [
    'Par deux, face à face à 15 m, un plot 5 à 6 m derrière chaque joueur. Un ballon pour deux.',
    'Passes pendant 25 secondes.',
    'Au sifflet : on arrête le ballon et on fait le tour de son plot à pleine vitesse.',
    '2e série : tour du plot en course arrière puis avant.'
  ],
  coach: ['Passes appuyées même en fatigue.', 'Réagir au sifflet sans attendre.', 'Tourner serré autour du plot.'],
  posture: 'Au milieu des duos : il siffle les changements de rythme.',
  expect: ['Réagir au sifflet.', 'Tour du plot à pleine vitesse.', 'Passes justes jusqu’à la fin.'],
  easier: 'Plot à 4 m.', harder: 'Deux tours de plot.',
  success: 'Changements de rythme nets à chaque sifflet.',
  layout: { cones: [[4, 50], [96, 50]], formations: () => [[25, 50]], formationsAway: () => [[75, 50]], ball: 'b1', script: [
    ['b1', 'r1', 'p', 'Passes pendant 25 secondes'], ['r1', 'b1', 'p', ''],
    ['b1', [4, 40], 'c', 'Sifflet : tour du plot'], ['r1', [96, 60], 'c+', ''],
    ['b1', [25, 50], 'c', 'On reprend les passes'], ['r1', [75, 50], 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Enchaînement de passes courtes', obj: 'Soigner la passe courte',
  id: 'mc-passe-courte', likes: 326, title: 'Enchaînement de passes courtes', theme: 'Passe', phase: 'ballon', type: 'Exercice',
  players: [4, 6, 10], size: [20, 25], duration: 15, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('Exercice de passe courte', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Une-deux, passe dans la course, centre au sol et slalom : 10 m maximum entre les passes.',
  rules: [
    'Le 1 passe au 2, qui remet en une touche.',
    'Le 1 sert le 3 dans sa course.',
    'Le 3 conduit puis sert le 4 dans sa course ; le 4 slalome entre les jalons et rentre au poste 1.',
    'Rotation : 1 → 2 → 3 → 4 → 1.'
  ],
  coach: ['Passe plat du pied, cheville bloquée.', 'Remise en une touche, devant le joueur.', 'Passe dans la course : viser l’espace devant.'],
  posture: 'Au centre du circuit : il corrige la surface de contact.',
  expect: ['Circuit sans faute.', 'Une touche sur la remise.', 'Rythme soutenu sans perte de précision.'],
  easier: 'Deux touches partout.', harder: 'Mauvais pied.',
  success: 'Des passes précises dans la course.',
  layout: { cones: [[56, 80], [66, 80], [76, 80], [86, 80]], start: [10, 20], home: [[10, 20], [40, 20], [40, 60], [80, 30]], ball: [13, 23], moves: [
    [10, 20, 37, 20, 'p', 'Le 1 joue avec le 2'], [40, 20, 16, 24, 'p', 'Remise en une touche'],
    [10, 20, 18, 26, 'c+', ''], [18, 26, 50, 60, 'p', 'Passe dans la course du 3'], [40, 60, 50, 62, 'c+', ''],
    [50, 62, 66, 52, 'd', 'Conduite'], [66, 52, 86, 40, 'p', 'Passe dans la course du 4'], [80, 30, 86, 40, 'c+', ''],
    [86, 40, 50, 80, 'd', 'Slalom et retour au départ']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'echauffement', sub: 'Mise en route', name: 'Jeu à quatre buts', obj: 'S’échauffer en jouant',
  id: 'mc-quatre-buts', likes: 295, title: 'Jeu réduit d’échauffement à quatre buts', theme: 'Échauffement', phase: 'ballon', type: 'Jeu',
  players: [8, 10, 12], size: [20, 30], duration: 20, intensity: 2, oddJoker: true,
  src: MYCOACH.src('Echauffement - Jeu réduit', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Deux équipes, deux mini-buts à attaquer, deux à défendre : se mettre en route en jouant.',
  rules: [
    'Deux équipes sur 30 × 20, deux mini-buts de chaque côté.',
    'Séquence 1 : 3 touches maximum.',
    'Séquence 2 : but seulement en une touche.',
    'Séquence 3 : chacun a un adversaire attitré ; seul lui peut lui prendre le ballon, les autres ne font que gêner.'
  ],
  coach: ['Changer de côté quand un but est fermé.', 'Lever la tête avant de recevoir.', 'Accélérer à chaque séquence.'],
  posture: 'Au bord du terrain : il change la consigne à chaque séquence.',
  expect: ['Marquer.', 'Marquer en une touche.', 'Marquer en changeant de côté.'],
  easier: 'Touches libres.', harder: 'Deux touches.',
  success: 'Tout le monde est actif et chaud.',
  layout: { minis: [[98.5, 25, 90], [98.5, 75, 90], [1.5, 25, 90], [1.5, 75, 90]], formations: n => MYCOACH.grid(n, 10, 12, 48, 88), ball: 'b1', script: [
    ['b1', 'b3', 'p', 'Circulation'], ['r2', [62, 30], 'c+', 'Un but est fermé'],
    ['b3', 'b4', 'p', 'On change de côté'], ['b4', [98.5, 75], 's', 'But dans le mini-but libre']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Une touche en passe et suis', obj: 'Faire circuler en une touche',
  id: 'mc-titi-kaka', likes: 223, title: 'Circulation en une touche', theme: 'Passe', phase: 'ballon', type: 'Exercice',
  players: [8, 9, 12], size: [25, 25], duration: 10, intensity: 2, params: { unit: 'plots' },
  src: MYCOACH.src('Titi-kaka', 'Julien Krommenacker', 'US Foy. Brouderdorff'),
  goal: 'Huit plots, un joueur par plot : le ballon circule en une touche, chacun suit sa passe.',
  rules: [
    'Huit plots sur 25 × 25 m, un joueur par plot, deux au départ.',
    'Passe et suit, dans le sens montré par le coach.',
    'Une touche de balle dès que possible.',
    'Variantes : changement de sens, changement de positions.'
  ],
  coach: ['Toujours concerné par le ballon, même sans le toucher.', 'Passe dans le bon pied du suivant.', 'Suivre sa passe sans traîner.'],
  posture: 'Au centre : il montre le sens de circulation et annonce les changements.',
  expect: ['Circuler sans arrêt.', 'Une touche partout.', 'Deux ballons en même temps.'],
  easier: 'Deux touches.', harder: 'Deux ballons.',
  success: 'Le ballon ne s’arrête pas.',
  layout: { cones: [[10, 10], [50, 10], [90, 10], [90, 50], [90, 90], [50, 90], [10, 90], [10, 50]], start: [10, 50],
    home: [[10, 50], [50, 10], [90, 50], [50, 90], [10, 10], [90, 10], [90, 90], [10, 90]], ball: [13, 53], moves: [
    [10, 50, 47, 13, 'p', 'Passe et suit'], [10, 50, 47, 14, 'c+', ''],
    [50, 10, 87, 47, 'p', 'Une touche'], [50, 10, 86, 46, 'c+', ''],
    [90, 50, 53, 87, 'p', ''], [90, 50, 53, 86, 'c+', ''],
    [50, 90, 13, 87, 'p', 'Le ballon change de diagonale'], [50, 90, 14, 86, 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Quatre ateliers', obj: 'Se mettre en route par ateliers tournants',
  id: 'mc-quatre-ateliers', likes: 192, title: 'Échauffement technique en quatre zones', theme: 'Échauffement', phase: 'ballon', type: 'Exercice',
  players: [8, 16, 24], size: [40, 50], duration: 18, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Echauffement technique 4 zones', 'Cédric Gavory', 'FC Pays Minier'),
  goal: 'Quatre groupes, quatre carrés : jonglage, passes courtes, conduite, motricité. On tourne toutes les 4 minutes.',
  rules: [
    'Quatre carrés sur un demi-terrain, un groupe par carré.',
    'Carré 1 jonglage, carré 2 passes courtes, carré 3 conduite de balle, carré 4 motricité (sans ballon).',
    '4 minutes par atelier.',
    'Entre deux ateliers, le groupe court ensemble au carré suivant ; le rythme monte à chaque rotation.'
  ],
  coach: ['Beaucoup de touches de balle.', 'Courir groupés entre les carrés.', 'Accélérer un peu à chaque rotation.'],
  posture: 'Au centre des quatre carrés : il chronomètre et lance les rotations.',
  expect: ['Rester actif dans chaque atelier.', 'Respecter le temps.', 'Finir à bon rythme.'],
  easier: '3 minutes par atelier.', harder: 'Pied faible dans tous les ateliers.',
  success: 'Le groupe est chaud, sans temps mort.',
  layout: { zones: [[4, 6, 40, 38, 'Jonglage'], [56, 6, 40, 38, 'Passes'], [56, 56, 40, 38, 'Conduite'], [4, 56, 40, 38, 'Motricité']],
    start: [24, 25], home: [[18, 18], [30, 18], [18, 32], [30, 32], [70, 18], [82, 18], [70, 32], [82, 32], [70, 68], [82, 68], [70, 82], [82, 82], [18, 68], [30, 68], [18, 82], [30, 82]],
    balls: [[33, 21], [73, 21], [85, 35], [73, 71], [85, 85]], moves: [
    [30, 18, 62, 18, 'c', 'Rotation : chaque groupe court au carré suivant'], [30, 32, 62, 32, 'c+', ''], [82, 32, 82, 62, 'c+', ''], [70, 32, 70, 62, 'c+', ''],
    [70, 68, 40, 68, 'c+', ''], [70, 82, 40, 82, 'c+', ''], [18, 68, 18, 40, 'c+', ''], [30, 68, 30, 40, 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Appuis-remises en une touche', obj: 'Combiner en une touche pour lancer l’appel',
  id: 'mc-une-touche', likes: 179, title: 'Travail offensif en une touche', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [4, 5, 15], size: [40, 50], duration: 15, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('Travail offensif en 1 touche', 'Sébastien Languille', 'US Moyenne Durance'),
  goal: 'Deux appuis-remises, puis la passe qui lance dans l’intervalle et la frappe.',
  rules: [
    'Le 1 sert le 2 sur son appel ; le 2 remet en une touche au 1.',
    'Le 1 joue en une touche sur le 3, qui sert le 4 sur son appel.',
    'Le 4 remet au 3, qui le lance dans l’intervalle en une touche ; le 4 frappe.',
    'Alterner côté gauche et côté droit.'
  ],
  coach: ['Le timing : l’appel part avant la passe.', 'Cheville bloquée sur chaque passe.', 'Équilibre sur la remise.'],
  posture: 'Derrière le 3 : il voit les appels et l’intervalle.',
  expect: ['Toute la séquence en une touche.', 'Frappe cadrée.', 'But.'],
  easier: 'Deux touches pour le 3.', harder: 'Un défenseur sur le 4.',
  success: 'L’intervalle est trouvé à chaque passage.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[60, 30], [60, 50], [74, 40], [74, 60]], start: [20, 50], home: [[20, 50], [38, 30], [50, 56], [66, 40]], ball: [23, 53], moves: [
    [38, 30, 34, 40, 'c', 'Appel du 2'], [20, 50, 32, 42, 'p', 'Passe au 2'], [34, 40, 26, 50, 'p', 'Remise en une touche'],
    [26, 50, 48, 56, 'p', 'Une touche sur le 3'], [66, 40, 60, 44, 'c+', 'Appel du 4'],
    [48, 56, 58, 46, 'p', 'Passe au 4'], [58, 46, 50, 54, 'p', 'Remise'],
    [60, 44, 80, 50, 'c+', 'Le 4 attaque l’intervalle'], [50, 54, 80, 50, 'p', 'Passe dans l’intervalle'], [80, 50, 98, 48, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Appui, soutien, profondeur', obj: 'Combiner puis centrer pour trois attaquants',
  id: 'mc-anim-off', likes: 178, title: 'Animation offensive : appui, soutien, centre', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [5, 6, 12], size: [45, 55], duration: 20, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('Animation offensive', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Jeu en appui puis en soutien, ballon dans la profondeur pour le côté qui centre, trois joueurs à la réception.',
  rules: [
    'Départ du plot rouge : passe en appui au joueur avancé.',
    'L’appui remet en soutien au joueur qui a suivi.',
    'Le soutien met le ballon dans la profondeur pour le côté qui a fait l’appel ; il centre.',
    'Les trois autres attaquent la surface. Travailler des deux côtés ; variante : appel-contre-appel.'
  ],
  coach: ['L’appel en profondeur part au moment du soutien.', 'Trois zones d’arrivée : premier poteau, second, point de penalty.', 'Centre tendu.'],
  posture: 'À l’entrée de la surface : il voit l’appel et l’arrivée des trois joueurs.',
  expect: ['Combinaison sans arrêt.', 'Centre exploitable.', 'But.'],
  easier: 'Pas d’appel-contre-appel.', harder: 'Deux défenseurs dans la surface.',
  success: 'Trois joueurs dans la surface sur chaque centre.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, start: [26, 50], home: [[26, 50], [50, 50], [36, 64], [52, 14], [66, 70]], ball: [29, 53], moves: [
    [26, 50, 47, 50, 'p', 'Passe en appui'], [36, 64, 40, 54, 'c+', 'Le soutien se présente'],
    [50, 50, 42, 54, 'p', 'Remise en soutien'],
    [52, 14, 82, 10, 'c+', 'Appel en profondeur'], [42, 54, 80, 12, 'p', 'Ballon dans la profondeur'],
    [50, 50, 88, 42, 'c+', 'Premier poteau'], [66, 70, 88, 62, 'c+', 'Second poteau'], [26, 50, 76, 50, 'c+', 'Point de penalty'],
    [82, 12, 88, 42, 'p', 'Centre'], [88, 42, 98, 46, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
// Trois équipes : une en possession, une en appui sur le pourtour (vert), une qui récupère.
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Passe à dix avec appuis', obj: 'Occuper la largeur et la profondeur',
  id: 'mc-passe-dix-appuis', likes: 155, title: 'Passe à dix avec une équipe en appui', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [15, 18, 18], size: [30, 50], duration: 18, intensity: 3, defenders: f => Math.round(f / 3),
  src: MYCOACH.src('Passe à dix avec appui', 'Anthony Barreto', 'US Vivo 04'),
  goal: 'Les bleus font 10 passes avec l’aide de l’équipe en appui ; les rouges récupèrent et enchaînent 3 passes.',
  rules: [
    'Trois équipes de 6 : les bleus conservent, les verts sont en appui sur le pourtour, les rouges récupèrent.',
    'Bleus : 10 passes, appuis compris = 1 point. Rouges : récupérer et enchaîner 3 passes = 1 point.',
    'Toutes les 3 minutes, on change : l’équipe qui défendait passe en appui, les appuis entrent.',
    'Chaque équipe passe deux fois par rôle ; pause après la 3e séquence.'
  ],
  coach: ['Écarter au maximum, utiliser toute la longueur.', 'Les appuis se déplacent le long de la ligne pour être disponibles.', 'Changer de côté par l’appui.'],
  posture: 'Au bord du terrain : il compte les passes à voix haute et fait tourner les rôles.',
  expect: ['Faire 10 passes.', 'Utiliser les appuis des deux côtés.', 'Enchaîner deux fois 10 passes.'],
  easier: '8 passes.', harder: 'Appuis en une touche.',
  success: 'Le ballon circule sur toute la surface.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'Récupérer et enchaîner 3 passes',
    posture: 'Au bord du terrain : il observe l’équipe qui récupère.',
    coach: ['Presser à deux le porteur.', 'Fermer la passe vers l’appui.'],
    expect: ['Récupérer.', 'Enchaîner 3 passes.', 'Récupérer deux fois par séquence.'] }],
  layout: { thirdTeam: true, formations: (n, roles) => { const k = n - Math.floor(n / 2); return [...MYCOACH.grid(k, 14, 14, 86, 86), ...[[25, 2], [75, 2], [98, 50], [75, 98], [25, 98], [2, 50]].slice(0, n - k)]; },
    formationsAway: n => MYCOACH.grid(n, 30, 30, 70, 70).map(([x, y]) => [x + 4, y + 6]), ball: 'b1', script: [
    ['b1', 'b2', 'p', '1…'], ['b2', 'b5', 'p', '2…'], ['b5', 'b6', 'p', 'Passe à l’appui (vert)'], ['b6', 'b3', 'p', '… jusqu’à 10 : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Passe et suit en trois séquences', obj: 'Améliorer la passe courte',
  id: 'mc-passe-suit-plots', likes: 142, title: 'Exercice technique : la passe', theme: 'Passe', phase: 'ballon', type: 'Exercice',
  players: [6, 8, 12], size: [16, 16], duration: 15, intensity: 2, params: { unit: 'plots' },
  src: MYCOACH.src('Exercice technique - La passe', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Passe et suit à 8 m, deux ballons en même temps, de plus en plus vite.',
  rules: [
    'Un joueur par plot bleu, les autres aux deux plots de départ, un ballon à chaque départ. Les deux ballons partent ensemble.',
    'Séquence 1 : passe et suit, deux touches maximum, on court à son plot.',
    'Séquence 2 : après la passe, on contourne un plot avant d’aller au suivant ; deux touches au départ, une touche aux plots bleus.',
    'Séquence 3 : contourner le plot en sprint.'
  ],
  coach: ['Passe à 8 m, appuyée.', 'Ouvrir le corps vers le joueur suivant.', 'Repartir vite après la passe.'],
  posture: 'Au centre : il donne le départ des deux ballons et change de séquence.',
  expect: ['Deux touches sans faute.', 'Une touche aux plots bleus.', 'Séquence en sprint sans perte de précision.'],
  easier: 'Un seul ballon.', harder: 'Une touche partout.',
  success: 'Les deux ballons circulent sans collision.',
  layout: { cones: [[50, 20], [50, 80]], start: [8, 50], home: [[8, 50], [30, 10], [70, 10], [92, 50], [70, 90], [30, 90]], ball: [11, 53], balls: [[89, 47]], moves: [
    [8, 50, 28, 14, 'p', 'Passe et suit'], [8, 50, 27, 15, 'c+', ''], [92, 50, 72, 86, 'p+', 'Les deux ballons partent ensemble'], [92, 50, 73, 85, 'c+', ''],
    [30, 10, 67, 12, 'p', ''], [30, 10, 50, 20, 'c+', 'On contourne le plot'], [70, 90, 33, 88, 'p+', ''], [70, 90, 50, 80, 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Passe et suit jusqu’à la frappe', obj: 'Contrôle orienté puis frappe',
  id: 'mc-passe-suit-frappe', likes: 125, title: 'Passe et suit avec frappe', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [5, 7, 12], size: [40, 45], duration: 20, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('passe et suit', 'Loïc Izzo', 'FC Biassais'),
  goal: 'Cinq postes : contrôle orienté à chaque poste, frappe hors de la surface au bout.',
  rules: [
    'A passe à B et prend sa place ; B contrôle orienté, passe à C et prend sa place ; et ainsi de suite jusqu’à E.',
    'E contrôle orienté et frappe de l’extérieur de la surface, récupère son ballon et rejoint A.',
    'Après 10 minutes, on change de côté.',
    'Variante 1 : C lance D en profondeur, D centre sans contrôle, E reprend de volée ou de la tête. Variante 2 : passes à mi-hauteur, contrôle poitrine.'
  ],
  coach: ['Contrôle orienté vers le joueur suivant.', 'Passe appuyée au sol.', 'Frappe : pied d’appui à côté du ballon, buste au-dessus.'],
  posture: 'À l’entrée de la surface : il voit le dernier contrôle et la frappe.',
  expect: ['Contrôles orientés réussis.', 'Frappe cadrée.', 'But hors de la surface.'],
  easier: 'Deux touches partout.', harder: 'Variante 1 avec centre en une touche.',
  success: 'Le ballon ne s’arrête pas avant la frappe.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, start: [10, 80], home: [[10, 80], [24, 40], [44, 70], [56, 20], [64, 54]], ball: [13, 83], moves: [
    [10, 80, 22, 44, 'p', 'A passe à B'], [10, 80, 22, 46, 'c+', 'et prend sa place'],
    [24, 40, 42, 66, 'p', 'Contrôle orienté, passe à C'], [24, 40, 42, 67, 'c+', ''],
    [44, 70, 54, 24, 'p', 'Passe à D'], [44, 70, 54, 25, 'c+', ''],
    [56, 20, 62, 50, 'p', 'Passe à E'], [64, 54, 72, 50, 'd', 'Contrôle orienté'], [72, 50, 98, 46, 's', 'Frappe hors de la surface']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Une-deux et frappe en une touche', obj: 'Frapper en une touche après un une-deux',
  id: 'mc-une-deux-tir', likes: 123, title: 'Une-deux et tir en une touche', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [4, 8, 12], size: [40, 50], duration: 15, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('UNE-DEUX / TIR - À une touche de balle', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Le joueur excentré lance le une-deux et met son partenaire en position de frapper, tout en une touche.',
  rules: [
    'Deux files face au but, un joueur excentré de chaque côté.',
    'Le joueur de la file sert l’excentré, qui remet dans sa course (une-deux).',
    'Frappe en une touche.',
    'On alterne gauche et droite. Rotation : le passeur devient tireur, le tireur passe dans la file de l’autre côté.'
  ],
  coach: ['Une seule touche pour tout le monde.', 'Remise devant le tireur, pas dans ses pieds.', 'Frappe placée plutôt que puissante.'],
  posture: 'À côté du but : il voit la remise et la course du tireur.',
  expect: ['Une touche partout.', 'Frappe cadrée.', 'But.'],
  easier: 'Contrôle autorisé avant la frappe.', harder: 'Un défenseur passif suit le tireur.',
  success: 'Des frappes en une touche, cadrées.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, start: [40, 40], home: [[40, 40], [64, 20], [40, 60], [64, 80]], ball: [43, 43], balls: [[43, 63]], moves: [
    [40, 40, 61, 22, 'p', 'Passe à l’excentré'], [40, 40, 66, 40, 'c+', 'Le tireur attaque l’espace'],
    [64, 20, 68, 38, 'p', 'Remise dans la course'], [68, 38, 98, 46, 's', 'Frappe en une touche'],
    [40, 60, 61, 78, 'p', 'Puis l’autre côté'], [40, 60, 66, 60, 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', template: 'circuit', moment: 'physique', sub: 'Le flipper', name: 'Le flipper', obj: 'Travail aérobie avec ballon',
  id: 'mc-flipper', likes: 114, title: 'Le flipper', theme: 'Physique', phase: 'ballon', type: 'Exercice',
  players: [2, 2, 4], size: [10, 20], duration: 12, intensity: 3, series: [60, 60], params: { unit: 'joueurs' },
  src: MYCOACH.src('Le flipper', 'Amaury Signac', 'Landi FC'),
  goal: 'Par deux : 10 secondes de passes, 10 secondes d’aller-retour sur 20 m, en continu pendant une minute.',
  rules: [
    'Par deux. Le joueur au travail alterne 10 secondes de passes avec son partenaire et 10 secondes d’aller-retour sur 20 m.',
    'Le partenaire récupère et assure les passes.',
    'On change de rôle toutes les minutes.',
    'Nombre de séries selon l’âge et le niveau du groupe.'
  ],
  coach: ['Passes justes même essoufflé.', 'Aller-retour à vitesse soutenue, pas un sprint.', 'Encourager et valoriser l’effort.'],
  posture: 'Au milieu des duos : il annonce les changements toutes les 10 secondes.',
  expect: ['Tenir une minute.', 'Garder la qualité de passe.', 'Tenir toutes les séries.'],
  easier: 'Aller-retour sur 15 m.', harder: 'Passes en une touche.',
  success: 'Rythme régulier du début à la fin.',
  layout: { discs: [[30, 20], [30, 80], [95, 20], [95, 80]], start: [30, 50], home: [[30, 50], [5, 50]], ball: [27, 53], moves: [
    [30, 50, 8, 52, 'p', '10 s de passes'], [8, 52, 27, 50, 'p', ''],
    [30, 50, 95, 50, 'c', '10 s d’aller-retour sur 20 m'], [95, 50, 30, 50, 'c', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', name: 'Duel après contournement', obj: 'Cadrer et protéger l’axe ballon-but',
  id: 'mc-duel-contri', likes: 102, title: 'Duel après contournement', theme: 'Technique défensive', phase: 'sans', type: 'Situation',
  players: [3, 5, 11], size: [30, 35], duration: 20, intensity: 4,
  src: MYCOACH.src('Exercice DUEL!', 'Dylan Leverrier', 'AS Verson'),
  goal: 'Au sifflet, les deux joueurs contournent leur plot ; le coach sert l’attaquant ; duel jusqu’au but.',
  rules: [
    'Deux files de départ. Au sifflet, un joueur de chaque file part et contourne son plot.',
    'Le coach passe le ballon à l’attaquant après le contournement.',
    'Duel : l’attaquant veut marquer, le défenseur récupère et ressort.',
    'Variante : deux joueurs par file, 2 contre 2.'
  ],
  coach: ['Défenseur : revenir sur l’axe ballon-but avant de cadrer.', 'Freiner, fléchi, de côté.', 'Intervenir quand le ballon s’éloigne.'],
  posture: 'Au point de passe : il sert l’attaquant et observe le cadrage.',
  expect: ['Revenir sur l’axe.', 'Cadrer sans se jeter.', 'Récupérer.'],
  easier: 'Le défenseur contourne un plot plus proche.', harder: '2 contre 2.',
  success: 'Le défenseur gagne un duel sur deux.',
  also: [{ moment: 'possede', sub: 'Zone 3 / Box · Finition', obj: 'Gagner son duel pour frapper',
    posture: 'Derrière le but : il observe l’attaquant.', coach: ['Contrôle orienté vers le but.', 'Attaquer le défenseur de face.'],
    expect: ['Frapper.', 'Éliminer.', 'Marquer.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], cones: [[40, 20], [40, 80]], supports: [[40, 50, 'C']], balls: [[43, 53]],
    formations: () => [[14, 20], [8, 20]], formationsAway: () => [[14, 80], [8, 80]], script: [
    ['b1', [42, 14], 'c', 'Sifflet : contournement'], ['r1', [42, 86], 'c+', ''],
    [[43, 53], [62, 30], 'p', 'Le coach sert l’attaquant'], ['b1', [62, 30], 'c+', ''], ['r1', [70, 44], 'c+', 'Le défenseur revient sur l’axe'],
    ['b1', [74, 36], 'd', 'Duel'], ['b1', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', template: 'circuit', moment: 'physique', sub: 'Huit ateliers en 15-15', name: 'Huit ateliers en 15-15', obj: 'Endurance puissance par ateliers',
  id: 'mc-ateliers-15-15', likes: 100, title: 'Huit ateliers en 15-15', theme: 'Physique', phase: 'ballon', type: 'Exercice',
  players: [8, 16, 16], size: [64, 100], duration: 25, intensity: 4, series: [15, 15], params: { unit: 'joueurs' },
  src: MYCOACH.src('Endurance puissance avec ballon', 'Timothée Bennoit', 'SO Velleronnais'),
  goal: 'Huit ateliers en travers du terrain : 15 secondes pour traverser, 15 secondes de récupération.',
  rules: [
    'Par deux, un binôme par atelier, en travers du terrain.',
    '1 conduite · 2 un appui dans chaque cerceau · 3 traversée en une-deux · 4 grandes foulées puis trot.',
    '5 sauts pieds joints au-dessus des plots · 6 course arrière puis avant · 7 fréquence, genoux hauts · 8 course en zigzag.',
    '15 secondes de travail, 15 secondes de récupération, puis atelier suivant.'
  ],
  coach: ['Traverser en 15 secondes.', 'Qualité des appuis avant la vitesse.', 'Récupération en marchant.'],
  posture: 'Au milieu du terrain : il siffle les départs et les rotations.',
  expect: ['Finir chaque traversée.', 'Traverser en 15 secondes.', 'Tenir les huit ateliers.'],
  easier: '15 s de travail, 30 s de récupération.', harder: 'Deux tours complets.',
  success: 'Tous les ateliers faits à bonne intensité.',
  layout: { zones: [[0, 0, 100, 12.5, '1'], [0, 12.5, 100, 12.5, '2'], [0, 25, 100, 12.5, '3'], [0, 37.5, 100, 12.5, '4'], [0, 50, 100, 12.5, '5'], [0, 62.5, 100, 12.5, '6'], [0, 75, 100, 12.5, '7'], [0, 87.5, 100, 12.5, '8']],
    start: [6, 6], home: [[6, 6], [6, 19], [6, 31], [6, 44], [6, 56], [6, 69], [6, 81], [6, 94]], ball: [9, 9], moves: [
    [6, 6, 94, 6, 'd', '15 secondes pour traverser'], [6, 19, 94, 19, 'c+', ''], [6, 31, 94, 31, 'c+', ''], [6, 44, 94, 44, 'c+', ''],
    [6, 56, 94, 56, 'c+', ''], [6, 69, 94, 69, 'c+', ''], [6, 81, 94, 81, 'c+', ''], [6, 94, 94, 94, 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 2, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Vivacité-finition', obj: 'Finir dans la précipitation',
  id: 'mc-vivacite-finition', likes: 98, title: 'Vivacité et finition', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [6, 10, 14], size: [30, 40], duration: 20, intensity: 3, params: { unit: 'joueurs' },
  src: MYCOACH.src('Vivacité-finition', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Deux joueurs se croisent : passe simultanée, sprint vers l’autre ballon, frappe.',
  rules: [
    'Deux équipes, une à chaque plot de départ, face à face.',
    'Les deux premiers font une passe en même temps entre deux plots, puis sprintent 10 à 15 m pour récupérer l’autre ballon.',
    'Ils enchaînent sur une frappe, puis changent de colonne.',
    'Concours : le plus de buts gagne. Sans deux gardiens, frappe de précision dans un mini-but.'
  ],
  coach: ['Passe précise pour ne pas gêner le partenaire.', 'Sprint dès que le ballon part.', 'Frapper sans arrêter le ballon si possible.'],
  posture: 'Entre les deux buts : il compte les buts de chaque équipe.',
  expect: ['Frapper vite.', 'Cadrer.', 'Gagner le concours.'],
  easier: 'Contrôle autorisé.', harder: 'Frappe en une touche.',
  success: 'Des frappes rapides et cadrées.',
  also: [MYCOACH.echauffement('Se mettre en route en frappant', 'Entre les buts : il démarre à 70 % puis augmente le rythme.')],
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], keepers: [[6, 50], [94, 50]], cones: [[46, 44], [54, 44], [46, 56], [54, 56]],
    start: [40, 20], home: [[40, 20], [60, 80]], ball: [43, 23], balls: [[57, 77]], moves: [
    [43, 23, 57, 74, 'p', 'Passes en même temps'], [57, 77, 43, 26, 'p+', ''],
    [40, 20, 60, 70, 'c', 'Sprint vers l’autre ballon'], [60, 80, 40, 30, 'c+', ''],
    [60, 72, 98, 54, 's', 'Frappe'], [40, 28, 2, 46, 's+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Joueur axial', obj: 'Appui-remise et recherche du joueur libre',
  id: 'mc-carre-axial', likes: 88, title: 'Contrôle-passe autour du joueur axial', theme: 'Passe', phase: 'ballon', type: 'Exercice',
  players: [5, 9, 18], size: [8, 8], duration: 20, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Échauffement technique de contrôle-passe #1', 'Jérôme Maret', 'Ploërmel FC'),
  goal: 'Le joueur axial demande le ballon à chaque joueur du carré et lui remet en appui-remise.',
  rules: [
    'Carré de 8 × 8 m, une coupelle au centre. Un joueur par coupelle ; ceux de l’extérieur ont un ballon chacun.',
    'Pendant 1 minute, le joueur axial demande le ballon à chacun et remet en deux touches.',
    'On change de joueur axial toutes les minutes.',
    'Variantes : une touche ; enlever un ou deux ballons, l’axial doit trouver un joueur libre.'
  ],
  coach: ['L’axial se déplace vers le joueur qu’il appelle.', 'Remise dans le bon pied.', 'Regarder où est le joueur libre avant de recevoir.'],
  posture: 'À côté du carré : il chronomètre et change l’axial.',
  expect: ['Remises justes en deux touches.', 'Une touche.', 'Trouver le joueur libre à chaque fois.'],
  easier: 'Carré de 10 m.', harder: 'Une touche et deux ballons en moins.',
  success: 'L’axial enchaîne sans arrêt.',
  layout: { discs: [[50, 50]], start: [50, 50], home: [[50, 50], [6, 6], [94, 6], [94, 94], [6, 94]], ball: [9, 9], balls: [[91, 9], [91, 91], [9, 91]], moves: [
    [50, 50, 18, 18, 'c', 'L’axial demande'], [9, 9, 18, 18, 'p', 'Passe'], [18, 18, 9, 9, 'p', 'Remise'],
    [18, 18, 80, 20, 'c', 'Il va vers le suivant'], [91, 9, 80, 20, 'p', ''], [80, 20, 91, 9, 'p', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'ludique', sub: '2 contre 2 montée-descente', name: '2 contre 2 montée-descente', obj: 'Gagner pour monter',
  id: 'mc-2c2-montee', likes: 87, title: '2 contre 2 : montée et descente', theme: 'Ludique', phase: 'ballon', type: 'Jeu',
  players: [4, 4, 4], size: [15, 20], duration: 15, intensity: 3,
  src: MYCOACH.src('Échauffement, jeu 2vs2', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Matchs de 2 minutes en 2 contre 2 : le gagnant monte d’un terrain, le perdant descend.',
  rules: [
    'Plusieurs terrains côte à côte, deux équipes de 2 par terrain.',
    'But marqué en frappant entre les jalons, sans gardien. Touches au pied, on peut aussi rentrer en conduite.',
    'Matchs de 2 minutes : le gagnant monte, le perdant descend.',
    'Match nul : pierre-feuille-ciseaux.'
  ],
  coach: ['Frapper dès que c’est ouvert.', 'Toujours un joueur pour défendre le but.', 'Jouer à deux : une-deux, appel.'],
  posture: 'Au terrain du haut : il chronomètre et annonce les rotations.',
  expect: ['Marquer.', 'Gagner un match.', 'Monter au terrain du haut.'],
  easier: 'Matchs de 3 minutes.', harder: 'Deux touches.',
  success: 'Tout le monde joue à fond.',
  also: [{ moment: 'echauffement', sub: 'Mise en route', obj: 'S’échauffer en 2 contre 2', posture: 'Au terrain du haut : il fait monter l’intensité.',
    coach: ['Démarrer à 70 %.', 'Accélérer à chaque match.'], expect: ['Bouger tout le temps.', 'Marquer.', 'Gagner.'] }],
  layout: { cones: [[1, 38], [1, 62], [99, 38], [99, 62]], formations: () => [[30, 30], [36, 70]], formationsAway: () => [[64, 30], [70, 70]], ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Une-deux'], ['b2', [60, 60], 'd', ''], ['b2', [99, 50], 's', 'Frappe entre les jalons']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Toucher les quatre appuis', obj: 'Sécuriser et maîtriser la possession',
  id: 'mc-quatre-appuis', likes: 85, title: 'Sécuriser la possession avec quatre appuis', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [12, 14, 14], size: [25, 25], duration: 15, intensity: 3,
  src: MYCOACH.src('Sécuriser et maîtriser la possession', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Jouer avec les quatre appuis, sans sens de jeu : 4 passes aux 4 appuis = 1 point.',
  rules: [
    '5 contre 5 dans un carré, un appui neutre au milieu de chaque côté.',
    'Pas de sens de jeu ; les appuis jouent avec les deux équipes.',
    'Toucher les quatre appuis différents sans perdre le ballon = 1 point.',
    'Variantes : changer les appuis, limiter les touches.'
  ],
  coach: ['Si un appui est fermé, en chercher un autre.', 'Se replacer après chaque passe à l’appui.', 'Garder le ballon : pas de passe risquée.'],
  posture: 'Dans un coin : il compte les appuis touchés à voix haute.',
  expect: ['Toucher deux appuis.', 'Toucher les quatre.', 'Deux points par séquence.'],
  easier: 'Trois appuis suffisent.', harder: 'Appuis en une touche.',
  success: 'La possession est calme et sûre.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'Fermer les appuis',
    posture: 'Dans un coin : il observe le pressing sur le porteur.', coach: ['Fermer l’appui le plus proche.', 'Presser à deux.'],
    expect: ['Fermer un appui.', 'Récupérer.', 'Récupérer et marquer.'] }],
  layout: { supports: [[50, 2], [98, 50], [50, 98], [2, 50]], formations: n => MYCOACH.grid(n, 14, 14, 86, 86), formationsAway: n => MYCOACH.grid(n, 24, 24, 76, 76).map(([x, y]) => [x + 5, y + 5]), ball: 'b1', script: [
    ['b1', 'a1', 'p', 'Appui 1'], ['a1', 'b2', 'p', ''], ['b2', 'a2', 'p', 'Appui 2'], ['a2', 'b4', 'p', ''], ['b4', 'a3', 'p', 'Appui 3'], ['a3', 'b3', 'p', ''], ['b3', 'a4', 'p', 'Appui 4 : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'ludique', sub: 'Parcours conduite et frappe', name: 'Parcours conduite et frappe', obj: 'Conduire vite et finir',
  id: 'mc-conduite-frappe', likes: 85, title: 'Parcours de conduite et frappe', theme: 'Conduite', phase: 'ballon', type: 'Exercice',
  players: [4, 10, 16], size: [30, 40], duration: 20, intensity: 3, params: { unit: 'joueurs' },
  src: MYCOACH.src('Conduite de balle', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Un parcours de conduite qui finit par une frappe : d’abord un défi individuel, puis par équipes.',
  rules: [
    'Deux équipes, un ballon chacun.',
    'Séquence 1 (5 min) : parcours en continu, défi individuel : marquer le plus de buts.',
    'Séquence 2 : 3 × 3 minutes par équipes, 1 but = 1 point pour son équipe.',
    'Parcours plus court pour les plus jeunes.'
  ],
  coach: ['Ballon proche dans le slalom, toucher long dans la ligne droite.', 'Lever la tête avant de frapper.', 'Frapper sans s’arrêter.'],
  posture: 'À côté du but : il compte les buts et encourage.',
  expect: ['Finir le parcours sans faute.', 'Cadrer.', 'Gagner le défi d’équipe.'],
  easier: 'Moins de plots.', harder: 'Pied faible dans le slalom.',
  success: 'Rythme élevé et frappes cadrées.',
  also: [MYCOACH.echauffement('Se mettre en route avec conduite et frappe', 'À côté du but : il fait monter le rythme.')],
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[20, 30], [30, 40], [40, 30], [50, 40]], discs: [[60, 70], [70, 70]],
    start: [8, 35], home: [[8, 35], [8, 75]], ball: [11, 38], balls: [[11, 78]], moves: [
    [8, 35, 56, 35, 'd', 'Slalom'], [56, 35, 64, 60, 'd', 'Conduite rapide'], [64, 60, 74, 52, 'd', ''], [76, 54, 98, 50, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Un joueur par couloir', obj: 'Écarter le bloc pour marquer sur centre',
  id: 'mc-occuper-espace', likes: 84, title: 'Occuper l’espace et marquer sur centre', theme: 'Largeur', phase: 'ballon', type: 'Jeu',
  players: [8, 10, 12], size: [45, 70], duration: 15, intensity: 3,
  src: MYCOACH.src('JEU / OCCUPER L’ESPACE', 'Maxime Gaillac', 'JS Bassin Aveyron'),
  goal: 'En possession, un joueur dans chaque couloir et un bloc écarté ; sans ballon, un bloc compact côté ballon.',
  rules: [
    'Sur les deux tiers d’un terrain, deux couloirs marqués, deux buts avec gardiens.',
    'L’équipe qui a le ballon garde un joueur dans chaque couloir.',
    'But valable seulement sur un centre venu d’un couloir. Hors-jeu à 10 m du but.',
    'Relance du gardien à la main.'
  ],
  coach: ['Écarter pour créer des espaces.', 'Sans ballon : tout le bloc glisse côté ballon.', 'Valoriser la prise de risque.'],
  posture: 'Sur la touche, au milieu : il observe l’occupation des couloirs et la cohérence du bloc.',
  expect: ['Toujours un joueur par couloir.', 'Centrer.', 'Marquer sur centre.'],
  easier: 'But dans l’axe autorisé = 1 point.', harder: 'Centre en une touche.',
  success: 'Le jeu s’écarte, les centres arrivent.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'Bloc compact côté ballon',
    posture: 'Sur la touche : il observe le bloc qui glisse.', coach: ['Glisser ensemble vers le couloir du ballon.', 'Fermer le centre.'],
    expect: ['Glisser ensemble.', 'Empêcher le centre.', 'Récupérer dans le couloir.'] }],
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[0, 0, 100, 16, 'Couloir'], [0, 84, 100, 16, 'Couloir']],
    formations: n => [[22, 50], [38, 30], [38, 70], [56, 8], [56, 92]].slice(0, n), ball: 'b2', script: [
    ['b2', 'b4', 'p', 'Passe dans le couloir'], ['r', -8, 'bloc+', 'Le bloc rouge glisse'],
    ['b4', [80, 8], 'd', ''], ['b1', [86, 44], 'c+', 'Attaque de la surface'],
    ['b4', 'b1', 'p', 'Centre'], ['b1', 'butR', 's', 'But sur centre']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Vitesse', template: 'circuit', moment: 'physique', sub: 'Relais explosif', name: 'Relais explosif', obj: 'Travailler l’explosivité',
  id: 'mc-relai', likes: 78, title: 'Relais explosif', theme: 'Physique', phase: 'ballon', type: 'Exercice',
  players: [3, 5, 8], size: [10, 20], duration: 20, intensity: 4, series: [10, 60], params: { unit: 'joueurs' },
  src: MYCOACH.src('relai', 'Loïc Izzo', 'FC Biassais'),
  goal: 'Courtes courses avec un ballon à déplacer d’un cône à l’autre, en relais par équipes.',
  rules: [
    'Trois cônes alignés. A sprinte au cône 2, prend le ballon à la main et le pose au cône 1.',
    'Il sprinte au cône 3, reprend le ballon et va le donner à B.',
    'B fait le parcours inverse, puis passe le relais à C.',
    'Variantes de départ : assis, couché, de dos, balle au pied.'
  ],
  coach: ['Premier pas explosif.', 'Freiner bas avant de poser le ballon.', 'Récupération complète entre les passages.'],
  posture: 'Au cône 1 : il donne les départs et change la position de départ.',
  expect: ['Démarrer vite.', 'Changer de direction sans glisser.', 'Gagner le relais.'],
  easier: 'Distances plus courtes.', harder: 'Départ couché.',
  success: 'Des départs explosifs à chaque passage.',
  also: [{ moment: 'ludique', sub: 'Relais explosif', obj: 'Gagner le relais par équipe', posture: 'Au cône 1 : il anime le défi entre équipes.',
    coach: ['Encourager son équipe.', 'Passer le ballon proprement.'], expect: ['Finir le parcours.', 'Aller vite.', 'Gagner le relais.'] }],
  layout: { cones: [[10, 50], [50, 50], [90, 50]], start: [10, 60], home: [[10, 60]], balls: [[50, 46]], moves: [
    [10, 60, 48, 54, 'c', 'Sprint au cône 2'], [48, 54, 12, 54, 'c', 'Ballon posé au cône 1'], [12, 54, 88, 54, 'c', 'Sprint au cône 3'], [88, 54, 12, 66, 'c', 'Relais au suivant']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'echauffement', sub: 'Mise en route', name: 'Jeu à la main', obj: 'S’échauffer en se démarquant',
  id: 'mc-jeu-main', likes: 76, title: 'Jeu à la main', theme: 'Échauffement', phase: 'ballon', type: 'Jeu',
  players: [8, 12, 16], size: [25, 35], duration: 15, intensity: 2, oddJoker: true,
  src: MYCOACH.src('Jeu à la main', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Jeu de passes à la main : poser le ballon derrière la ligne adverse.',
  rules: [
    'Deux équipes. Point marqué en posant le ballon derrière la ligne adverse.',
    'Séquence 1 : interdit de se déplacer avec le ballon. On récupère par interception ou si le ballon tombe.',
    'Séquence 2 : on peut courir avec le ballon ; on récupère en touchant le porteur.',
    'Trop facile : deux joueurs différents doivent toucher le porteur.'
  ],
  coach: ['Se démarquer dans l’espace libre.', 'Regarder avant de lancer.', 'Courir vers la ligne dès la récupération.'],
  posture: 'Au bord du terrain : il fait passer d’une séquence à l’autre.',
  expect: ['Se démarquer.', 'Marquer.', 'Marquer en trois passes.'],
  easier: 'Zone plus grande.', harder: 'Passes au-dessus de la tête interdites.',
  success: 'Tout le monde bouge et se démarque.',
  also: [{ moment: 'ludique', sub: 'Jeu à la main', obj: 'Se démarquer en jouant', posture: 'Au bord du terrain : il anime le jeu.',
    coach: ['Toujours bouger.', 'Annoncer son appel.'], expect: ['Participer.', 'Marquer.', 'Gagner.'] }],
  layout: { zones: [[0, 0, 4, 100, ''], [96, 0, 4, 100, '']], formations: n => MYCOACH.grid(n, 10, 12, 60, 88), formationsAway: n => MYCOACH.grid(n, 40, 16, 90, 84), ball: 'b1', script: [
    ['b1', 'b3', 'p', 'Passe à la main'], ['b5', [90, 30], 'c+', 'Appel vers la ligne'], ['b3', 'b5', 'p', ''], ['b5', [98, 30], 'c', 'Ballon posé : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Grand triangle', obj: 'Se préparer au contenu de la séance',
  id: 'mc-triangle', likes: 72, title: 'L’étoile : grand triangle d’échauffement', theme: 'Passe', phase: 'ballon', type: 'Exercice',
  players: [6, 12, 18], size: [26, 30], duration: 21, intensity: 2, params: { unit: 'plots' },
  src: MYCOACH.src('L’étoile Echauffement', 'Timothée Bennoit', 'SO Velleronnais'),
  goal: 'Deux équipes font circuler le ballon sur un grand triangle de 30 m, avec trois séquences.',
  rules: [
    'Un triangle de 30 m de côté, deux équipes réparties sur les sommets.',
    'Séquence 1 (7 min) : conduite sur la moitié de la distance, puis passe au partenaire.',
    'Séquence 2 (7 min) : deux touches de balle.',
    'Séquence 3 (7 min) : changement de sens, on met la pression au joueur suivant après sa passe.'
  ],
  coach: ['Passe longue au sol, appuyée.', 'Contrôle orienté vers le sommet suivant.', 'Pression réelle mais sans tacle en séquence 3.'],
  posture: 'Au centre du triangle : il annonce les séquences.',
  expect: ['Passes justes sur 15 m.', 'Deux touches.', 'Garder la qualité sous pression.'],
  easier: 'Triangle de 20 m.', harder: 'Une touche en séquence 2.',
  success: 'Le ballon tourne sans perte.',
  layout: { discs: [[50, 8], [92, 88], [8, 88]], start: [50, 8], home: [[50, 8], [92, 88], [8, 88], [44, 8], [88, 92], [12, 92]], ball: [53, 11], balls: [[89, 85]], moves: [
    [50, 8, 70, 48, 'd', 'Conduite sur la moitié'], [70, 48, 89, 85, 'p', 'Passe au partenaire'], [50, 8, 92, 88, 'c+', ''],
    [89, 85, 50, 85, 'd', ''], [50, 85, 11, 85, 'p', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', template: 'circuit', moment: 'physique', sub: 'Coordination et fartlek', name: 'Coordination et fartlek', obj: 'Alterner coordination, course et conduite',
  id: 'mc-fartlek', likes: 107, title: 'Parcours coordination et fartlek', theme: 'Physique', phase: 'ballon', type: 'Exercice',
  players: [3, 4, 16], size: [20, 40], duration: 30, intensity: 3, series: [480, 150], params: { unit: 'joueurs' },
  src: MYCOACH.src('Parcours coordination-TE + Fartlek', 'Christophe Marchat', 'ES Douvaine-Loisin'),
  goal: 'Par groupes de 3-4, un parcours qui alterne course, skipping, sauts et conduite de balle.',
  rules: [
    'Groupes de 3 ou 4 sur un parcours en boucle : échelle ou cerceaux, haies basses, slalom balle au pied, ligne droite.',
    'On enchaîne les tours en variant l’allure (fartlek) : lent, moyen, vite sur la ligne droite.',
    'Séries de 6 à 10 minutes, 2 ou 3 séries.',
    '2 à 3 minutes de récupération active entre les séries (travail technique à deux).'
  ],
  coach: ['Appuis rapides et légers dans les cerceaux.', 'Gainage sur les sauts.', 'Ballon proche dans le slalom.'],
  posture: 'Au milieu du parcours : il annonce les changements d’allure.',
  expect: ['Tenir la série.', 'Appuis propres.', 'Accélérer quand c’est demandé.'],
  easier: 'Séries de 6 minutes.', harder: '3 séries de 10 minutes.',
  success: 'Le parcours reste propre malgré la fatigue.',
  layout: { discs: [[10, 20], [20, 20], [30, 20], [40, 20]], cones: [[60, 15], [70, 25], [80, 15], [90, 25], [70, 80], [50, 80], [30, 80]],
    start: [5, 20], home: [[5, 20], [5, 30]], ball: [62, 50], moves: [
    [5, 20, 44, 20, 'c', 'Cerceaux : appuis rapides'], [44, 20, 92, 20, 'c', 'Haies et skipping'],
    [92, 20, 92, 80, 'c', 'Ligne droite : on accélère'], [92, 80, 10, 80, 'c', 'Slalom balle au pied'], [10, 80, 5, 30, 'c', 'Retour au trot']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', template: 'circuit', moment: 'physique', sub: 'Circuit conduite en binôme', name: 'Circuit conduite en binôme', obj: 'Reprendre en douceur, balle au pied',
  id: 'mc-circuit-conduite', likes: 88, title: 'Circuit training de conduite de balle', theme: 'Physique', phase: 'ballon', type: 'Exercice',
  players: [8, 16, 16], size: [50, 50], duration: 40, intensity: 2, series: [720, 360], params: { unit: 'joueurs' },
  src: MYCOACH.src('Circuit training conduite de balle', 'Kevin Senas', 'Les Labourdins d’Ustaritz'),
  goal: 'Huit ateliers de conduite autour d’une zone centrale : un joueur travaille, son binôme récupère en jonglant ou en gainage.',
  rules: [
    'Huit ateliers autour d’une zone centrale de 20 × 20, un binôme par atelier.',
    'Ateliers : tour du cerceau de l’extérieur du pied, semelle avant-arrière, slalom, conduite semelle latérale, slalom mauvais pied, haies balle au pied, aller-retour à fond avec blocage.',
    'Séquence 1 : 12 min de travail continu, 6 min de récupération en jonglant. Séquence 2 : 12 min, puis 3 min de jonglage et 3 min de repos.',
    'Le partenaire récupère en gainage ou en jonglage, puis on échange.'
  ],
  coach: ['Démontrer chaque atelier avant de commencer.', 'Ballon proche du pied, regard détaché du ballon.', 'Tout le monde est en mouvement.'],
  posture: 'Dans la zone centrale : il démontre, chronomètre et fait tourner les binômes.',
  expect: ['Faire chaque atelier sans perte.', 'Tenir les 12 minutes.', 'Garder la maîtrise en accélérant.'],
  easier: 'Séquences de 8 minutes.', harder: 'Ateliers au mauvais pied.',
  success: 'Une reprise en douceur, avec beaucoup de touches de balle.',
  layout: { zones: [[30, 30, 40, 40, 'Récupération']], cones: [[10, 10], [50, 6], [90, 10], [94, 50], [90, 90], [50, 94], [10, 90], [6, 50]],
    start: [16, 16], home: [[16, 16], [50, 14], [84, 16], [86, 50], [84, 84], [50, 86], [16, 84], [14, 50]], ball: [19, 19], moves: [
    [16, 16, 30, 24, 'd', 'Chacun fait son atelier'], [50, 14, 60, 22, 'd+', ''], [84, 16, 74, 26, 'd+', ''], [86, 50, 76, 58, 'd+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'ludique', sub: 'Relais agilité et finition', name: 'Relais agilité et finition', obj: 'Agilité balle au pied en compétition',
  id: 'mc-relais-agilite', likes: 71, title: 'Relais : agilité, vitesse et finition', theme: 'Ludique', phase: 'ballon', type: 'Exercice',
  players: [6, 12, 16], size: [35, 50], duration: 20, intensity: 3, params: { unit: 'joueurs' },
  src: MYCOACH.src('Relais : Agilité, motricité, vitesse et finition', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Relais à trois joueurs par équipe : haies, slalom, cerceaux, puis passe ; le dernier frappe.',
  rules: [
    'Deux équipes côte à côte, départ au sifflet. On prend la place de celui à qui on fait la passe.',
    'Joueur 1 : haies en poussant le ballon, slalom entre piquets, appuis dans les cerceaux, sprint balle au pied et passe.',
    'Joueur 2 : pas chassés entre les barres, conduite entre les plots, sprint et passe en retrait. Joueur 3 : sprint balle au pied et frappe avant la surface.',
    'Premier à frapper = 1 point, but = 1 point. Le coach annonce le score.'
  ],
  coach: ['Ballon poussé juste devant pour garder la vitesse.', 'Appuis courts dans les cerceaux.', 'Frapper avant la surface si la frappe est maîtrisée.'],
  posture: 'Près du but : il annonce le score après chaque relais.',
  expect: ['Finir le parcours sans faute.', 'Frapper cadré.', 'Gagner le relais.'],
  easier: 'Moins d’obstacles.', harder: 'Frappe obligatoire avant la surface.',
  success: 'Rythme et précision malgré la compétition.',
  also: [MYCOACH.physique('Vitesse et agilité balle au pied', 'Près du but : il impose une récupération complète entre les relais.')],
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[15, 30], [22, 30], [30, 30], [38, 30], [15, 70], [22, 70], [30, 70], [38, 70]],
    start: [5, 30], home: [[5, 30], [48, 30], [62, 40], [5, 70], [48, 70], [62, 60]], ball: [8, 33], balls: [[8, 73]], moves: [
    [5, 30, 44, 30, 'd', 'Joueur 1 : haies, slalom, cerceaux'], [5, 70, 44, 70, 'd+', ''],
    [44, 30, 48, 33, 'p', 'Passe au joueur 2'], [48, 30, 60, 38, 'd', 'Pas chassés et conduite'],
    [60, 38, 64, 42, 'p', 'Passe au joueur 3'], [62, 40, 76, 44, 'd', 'Sprint balle au pied'], [78, 46, 98, 48, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Losange : fixer puis centrer', obj: 'Fixer dans une zone pour jouer dans une autre',
  id: 'mc-losange', likes: 70, title: 'Losange offensif et centre', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [5, 9, 18], size: [45, 55], duration: 20, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('Exercice technique', 'Arthur Chaney', 'ESCC Tournoi'),
  goal: 'Quatre joueurs en losange : soutien, appui, remise, puis jeu sur l’aile et centre.',
  rules: [
    'Quatre groupes de 4, deux par côté (gauchers à gauche, droitiers à droite). Le gardien relance.',
    'Relance sur A1 qui sert A2 en soutien ; A2 joue sur A3 qui a décroché, puis part sur l’aile.',
    'A3 remet en soutien sur A4, qui lance A2 sur l’aile.',
    'A2 contrôle et centre ; A1, A3 et A4 attaquent la surface. Chacun garde son poste pour répéter.'
  ],
  coach: ['Le décrochage de A3 attire le défenseur : c’est là qu’on fixe.', 'L’appel de A2 part pendant la remise.', 'Trois zones d’arrivée sur le centre.'],
  posture: 'À l’entrée de la surface : il voit le décrochage et l’appel sur l’aile.',
  expect: ['Combinaison sans arrêt.', 'Centre exploitable.', 'But.'],
  easier: 'Deux touches partout.', harder: 'Un défenseur suit A3.',
  success: 'Le centre arrive sur un partenaire lancé.',
  layout: { goals: MYCOACH.goal, keepers: [[6, 50], [94, 50]], start: [24, 50], home: [[24, 50], [40, 30], [58, 50], [42, 70]], ball: [9, 53], moves: [
    [9, 53, 22, 52, 'p', 'Relance sur A1'], [24, 50, 38, 34, 'p', 'Soutien sur A2'],
    [58, 50, 50, 44, 'c+', 'A3 décroche'], [38, 34, 48, 44, 'p', 'A2 joue sur A3'],
    [48, 44, 42, 66, 'p', 'Remise en soutien sur A4'], [40, 30, 78, 12, 'c+', 'A2 part sur l’aile'],
    [42, 66, 78, 14, 'p', 'A4 lance A2'], [24, 50, 86, 44, 'c+', 'Attaque de la surface'], [50, 44, 88, 58, 'c+', ''],
    [80, 14, 86, 44, 'p', 'Centre'], [86, 44, 98, 48, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Le plot libre', obj: 'Passer et occuper le plot libre',
  id: 'mc-plot-libre', likes: 69, title: 'Passe courte et vision : le plot libre', theme: 'Passe', phase: 'ballon', type: 'Exercice',
  players: [4, 4, 5], size: [8, 8], duration: 15, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Passe courte - la vision', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Quatre joueurs pour cinq plots : je passe à qui je veux, puis je cours au plot libre.',
  rules: [
    'Groupes de 4 pour 5 plots, un plot reste libre. Un ballon par groupe.',
    'Je passe à un partenaire de mon choix, puis je vais le plus vite possible au plot libre.',
    'Variante : chacun doit avoir touché le ballon avant qu’un joueur le retouche.',
    'Défi entre groupes : le plus de passes en 1 min 30.'
  ],
  coach: ['Regarder le plot libre avant de passer.', 'Passe courte et appuyée.', 'Se retourner vers le jeu en arrivant au plot.'],
  posture: 'Entre les groupes : il chronomètre les défis.',
  expect: ['Passes sans faute.', 'Toujours un joueur au bon plot.', 'Gagner le défi.'],
  easier: 'Plots plus espacés.', harder: 'Une touche.',
  success: 'Le ballon circule vite, personne n’hésite.',
  layout: { cones: [[10, 10], [90, 10], [90, 90], [10, 90], [50, 50]], start: [10, 10], home: [[10, 10], [90, 10], [90, 90], [10, 90]], ball: [13, 13], moves: [
    [10, 10, 87, 13, 'p', 'Passe au choix'], [10, 10, 48, 48, 'c+', 'Je cours au plot libre'],
    [90, 10, 13, 87, 'p', ''], [90, 10, 12, 12, 'c+', 'Le plot libre change']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
// Double surface : 4 contre 4 sur le terrain, 4 appuis offensifs par équipe autour.
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Appuis offensifs', obj: 'Déséquilibrer pour finir',
  id: 'mc-appuis-offensifs', likes: 64, title: 'Déséquilibrer pour finir avec des appuis', theme: 'Finition', phase: 'ballon', type: 'Jeu',
  players: [16, 16, 18], size: [36, 40], duration: 40, intensity: 3,
  src: MYCOACH.src('jeu réduit - déséquilibrer pour finir - défendre son but', 'Johan Roubault', 'AS Aix-en-Provence'),
  goal: '4 contre 4 dans une double surface, chaque équipe a 4 appuis offensifs autour du terrain adverse.',
  rules: [
    'Deux équipes de 8 : 4 sur le terrain, 4 en appuis offensifs le long du terrain adverse. Matchs de 5 minutes, on échange les rôles.',
    'Les appuis jouent avec leur équipe ; jeu aux postes.',
    'Ballon sorti : on repart vite du gardien.',
    'Variantes : touches limitées ; passe décisive d’un appui = 2 points ; 3 passes maximum avant de tirer ; un défenseur peut presser un appui.'
  ],
  coach: ['Utiliser l’appui pour déséquilibrer, puis frapper vite.', 'Frapper dès qu’un angle s’ouvre.', 'Défendre son but en premier à la perte.'],
  posture: 'Sur le côté, au milieu : il compte les points et valorise les passes décisives des appuis.',
  expect: ['Frapper.', 'Marquer après un appui.', 'Marquer en 3 passes.'],
  easier: 'Appuis à deux touches.', harder: 'Appuis à une touche.',
  success: 'Beaucoup de frappes, des buts construits avec les appuis.',
  also: [{ moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', obj: 'Défendre son but face aux appuis',
    posture: 'Derrière un but : il observe la défense de la surface.', coach: ['Protéger l’axe avant de presser l’appui.', 'Bloquer les frappes.'],
    expect: ['Rester entre le ballon et le but.', 'Contrer une frappe.', 'Récupérer et relancer.'] }],
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], formations: n => [[30, 30], [30, 70], [46, 40], [46, 60], [64, 2], [86, 2], [64, 98], [86, 98]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b5', 'p', 'Jeu avec l’appui'], ['b4', [74, 44], 'c+', ''], ['b5', 'b4', 'p', 'Passe décisive de l’appui'], ['b4', 'butR', 's', 'But : 2 points']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Ajuster sa vitesse', obj: 'Arriver en même temps que son partenaire',
  id: 'mc-ajuster-vitesse', likes: 63, title: 'Ajustement de sa vitesse', theme: 'Coordination', phase: 'ballon', type: 'Exercice',
  players: [2, 4, 8], size: [20, 25], duration: 15, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Ajustement de sa vitesse', 'Pascal Laforge', 'US Am. Montbron'),
  goal: 'Deux parcours parallèles : le joueur avec ballon règle sa vitesse pour servir son partenaire dans la course.',
  rules: [
    'Deux parcours côte à côte (piquets, cerceaux, échelle). Un joueur avec ballon, un sans.',
    'Le porteur conduit en regardant son partenaire et ajuste sa vitesse.',
    'Ils arrivent ensemble au plot de sortie : passe dans la course du partenaire.',
    'On échange les rôles et les parcours.'
  ],
  coach: ['Lever la tête pour voir le partenaire.', 'Ni trop tôt, ni trop tard.', 'Passe devant le partenaire, dans sa course.'],
  posture: 'Au plot de sortie : il juge la synchronisation.',
  expect: ['Arriver en même temps.', 'Passe dans la course.', 'Synchronisation parfaite à vitesse élevée.'],
  easier: 'Parcours plus simple pour le porteur.', harder: 'Le partenaire change de rythme sans prévenir.',
  success: 'La passe tombe dans la course à chaque fois.',
  layout: { cones: [[25, 30], [40, 30], [55, 30], [25, 70], [40, 70], [55, 70], [75, 30], [75, 70]], start: [8, 30], home: [[8, 30], [8, 70]], ball: [11, 33], moves: [
    [8, 30, 72, 30, 'd', 'Conduite, tête levée'], [8, 70, 72, 70, 'c+', 'Le partenaire fait son parcours'],
    [74, 33, 92, 62, 'p', 'Passe dans la course'], [72, 70, 92, 62, 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'echauffement', sub: 'Mise en route', name: 'Trois buts : conduire ou frapper', obj: 'Occuper le terrain',
  id: 'mc-trois-buts', likes: 62, title: 'Jeu réduit d’échauffement à trois buts', theme: 'Échauffement', phase: 'ballon', type: 'Jeu',
  players: [8, 10, 14], size: [25, 30], duration: 20, intensity: 2, oddJoker: true,
  src: MYCOACH.src('Jeu réduit - échauffement', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Trois buts par équipe : deux portes à franchir en conduite (1 point), un mini-but à viser (2 points).',
  rules: [
    'Deux équipes, trois cibles de chaque côté.',
    'Porte de 2 m franchie en conduite = 1 point.',
    'Mini-but de 1 m touché sur une frappe = 2 points.',
    'Variantes : touches limitées, appuis.'
  ],
  coach: ['Écarter pour ouvrir les portes.', 'Choisir : conduire ou frapper.', 'Changer de cible quand une est fermée.'],
  posture: 'Au bord du terrain : il fait monter le rythme.',
  expect: ['Marquer 1 point.', 'Marquer 2 points.', 'Varier les cibles.'],
  easier: 'Touches libres.', harder: 'Deux touches.',
  success: 'Tout le monde est actif.',
  layout: { cones: [[99, 10], [99, 26], [99, 74], [99, 90], [1, 10], [1, 26], [1, 74], [1, 90]], minis: [[98.5, 50, 90], [1.5, 50, 90]], formations: n => MYCOACH.grid(n, 10, 12, 48, 88), ball: 'b1', script: [
    ['b1', 'b3', 'p', 'Circulation'], ['b3', [86, 18], 'd', ''], ['b3', [99, 18], 'd', 'Porte franchie : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Stop-ball dans l’intervalle', obj: 'Jouer dans l’intervalle en profondeur',
  id: 'mc-stop-ball', likes: 57, title: 'Jeu de découverte : stop-ball', theme: 'Profondeur', phase: 'ballon', type: 'Jeu',
  players: [12, 16, 16], size: [40, 50], duration: 10, intensity: 3,
  src: MYCOACH.src('Jeu de découverte', 'Arthur Chaney', 'ESCC Tournoi'),
  goal: '8 contre 8 en 4-2-2 : marquer en arrêtant le ballon dans la zone de fond adverse.',
  rules: [
    'Deux équipes organisées en 4-2-2. Jeu libre, ballon au sol.',
    'Point : ballon arrêté sous la semelle dans la zone de fond adverse.',
    'Les défenseurs ne peuvent pas défendre dans la zone de fond. Hors-jeu à l’entrée de la zone.',
    'Le jeu repart de l’équipe qui a encaissé.'
  ],
  coach: ['Chercher l’intervalle entre deux défenseurs.', 'L’appel part avant la passe, sans être hors-jeu.', 'Passe au sol, dans la course.'],
  posture: 'Sur le côté, à hauteur de la zone : il juge le hors-jeu et montre les intervalles.',
  expect: ['Trouver l’intervalle.', 'Stop-ball réussi.', 'Deux points par séquence.'],
  easier: 'Pas de hors-jeu.', harder: 'Deux touches.',
  success: 'Des passes dans l’intervalle bien dosées.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'Fermer les intervalles',
    posture: 'Sur le côté : il observe la ligne défensive.', coach: ['Ligne de 4 alignée.', 'Fermer l’intervalle côté ballon.'],
    expect: ['Rester alignés.', 'Couper la passe.', 'Mettre hors-jeu.'] }],
  layout: { zones: [[0, 0, 10, 100, 'Zone de fond'], [90, 0, 10, 100, 'Zone de fond']],
    formations: n => [[18, 15], [16, 38], [16, 62], [18, 85], [32, 35], [32, 65], [44, 30], [44, 70]].slice(0, n), ball: 'b2', script: [
    ['b2', 'b5', 'p', 'Circulation'], ['b7', [80, 36], 'c+', 'Appel dans l’intervalle'], ['b5', [86, 38], 'p', 'Passe dans l’intervalle'], ['b7', [92, 38], 'c', 'Stop-ball : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Contrôle, sortie et frappe', obj: 'Frapper vite après le contrôle',
  id: 'mc-specifique-attaquant', likes: 56, title: 'Spécifique attaquant : contrôle et frappe', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [4, 4, 8], size: [25, 30], duration: 12, intensity: 3, params: { unit: 'joueurs' },
  src: MYCOACH.src('spécifique attaquant', 'Abdallah Nasri', 'Caluire FF 1968'),
  goal: 'L’attaquant reçoit dans un petit carré, contrôle pour en sortir et frappe tout de suite.',
  rules: [
    'Un carré de 1,50 m entre quatre poteaux, à l’entrée de la surface.',
    'Trois passeurs à 10 m servent l’attaquant à tour de rôle.',
    'Contrôle qui fait sortir du carré, puis frappe.',
    'Même attaquant pendant 3 minutes pour répéter, puis on tourne.'
  ],
  coach: ['Regarder le but avant de recevoir.', 'Contrôle orienté vers l’espace de frappe.', 'Frapper dans la foulée.'],
  posture: 'À côté du but : il observe le premier contrôle.',
  expect: ['Sortir du carré en un contrôle.', 'Cadrer.', 'Marquer en deux touches.'],
  easier: 'Passes à la main.', harder: 'Un défenseur passif derrière l’attaquant.',
  success: 'Contrôle et frappe enchaînés sans arrêt.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[68, 46], [68, 54], [74, 46], [74, 54]], start: [71, 50], home: [[71, 50], [40, 20], [36, 50], [40, 80]], ball: [43, 23], balls: [[39, 53], [43, 77]], moves: [
    [43, 23, 70, 48, 'p', 'Passe'], [71, 50, 78, 40, 'c', 'Contrôle pour sortir du carré'], [79, 42, 98, 48, 's', 'Frappe'],
    [78, 40, 71, 50, 'c', 'Retour au carré'], [39, 53, 69, 51, 'p', 'Passeur suivant']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'echauffement', sub: 'Mise en route', name: 'Deux ballons, trois couleurs', obj: 'Prendre l’information et s’orienter',
  id: 'mc-prise-info', likes: 52, title: 'Échauffement prise d’information', theme: 'Prise d’information', phase: 'ballon', type: 'Exercice',
  players: [9, 18, 21], size: [40, 40], duration: 15, intensity: 2, defenders: f => Math.round(f / 3),
  src: MYCOACH.src('Echauffement prise d’info', 'Kevin Senas', 'Les Labourdins d’Ustaritz'),
  goal: 'Trois couleurs mélangées : le ballon tourne bleu-vert-rouge au pied, et une petite balle circule à la main dans chaque équipe.',
  rules: [
    'Trois équipes dans un carré de 40 m.',
    'Le ballon passe dans l’ordre bleu → vert → rouge → bleu. Jamais deux fois avec le même joueur.',
    'En même temps, chaque équipe se passe une balle de tennis à la main sans la faire tomber.',
    'Variantes : changer l’ordre des couleurs, une touche imposée pour une couleur.'
  ],
  coach: ['Voir avant de recevoir.', 'Donner le ballon dans le sens de l’action du partenaire.', 'Être sur ses appuis, ouvert.'],
  posture: 'Au bord du carré : il change l’ordre des couleurs sans prévenir.',
  expect: ['Respecter l’ordre.', 'Ne pas faire tomber la balle.', 'Une touche sur la couleur imposée.'],
  easier: 'Sans balle de tennis.', harder: 'Deux ballons au pied.',
  success: 'Les joueurs lèvent la tête en permanence.',
  layout: { thirdTeam: true, formations: n => MYCOACH.grid(n, 8, 10, 92, 90), formationsAway: n => MYCOACH.grid(n, 14, 18, 86, 82).map(([x, y]) => [x + 3, y + 6]), ball: 'b1', script: [
    ['b1', 'b5', 'p', 'Bleu → vert'], ['b5', 'r2', 'p', 'Vert → rouge'], ['r2', 'b2', 'p', 'Rouge → bleu']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', template: 'circuit', keepers: 1, moment: 'physique', sub: 'Athlétique et frappe', name: 'Athlétique et frappe', obj: 'Répéter un effort jusqu’à la frappe',
  id: 'mc-athletique-frappe', likes: 51, title: 'Endurance avec frappe', theme: 'Physique', phase: 'ballon', type: 'Exercice',
  players: [4, 8, 16], size: [30, 40], duration: 15, intensity: 4, series: [360, 120], params: { unit: 'joueurs' },
  src: MYCOACH.src('Endurance capacité/puissance', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Par deux : un exercice athlétique, un sprint, une frappe, puis retour en footing.',
  rules: [
    'Par deux, départs alternés.',
    'Exercice athlétique (sauts, cerceaux ou haies basses), puis course rapide vers le plot de frappe.',
    'Frappe au but, puis retour en footing.',
    '2 séquences de 6 minutes.'
  ],
  coach: ['Sprint à fond, retour au footing.', 'Frappe placée malgré la fatigue.', 'Ne pas s’arrêter entre les passages.'],
  posture: 'Au plot de frappe : il compte les buts et garde le rythme.',
  expect: ['Tenir 6 minutes.', 'Cadrer malgré la fatigue.', 'Marquer sur la moitié des frappes.'],
  easier: 'Séquences de 4 minutes.', harder: 'Frappe en une touche sur passe du partenaire.',
  success: 'Intensité et précision jusqu’au bout.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, discs: [[20, 40], [26, 40], [32, 40], [38, 40]], cones: [[70, 50]], balls: [[70, 54]],
    start: [10, 40], home: [[10, 40], [10, 60]], moves: [
    [10, 40, 40, 40, 'c', 'Exercice athlétique'], [40, 40, 68, 52, 'c', 'Course rapide'], [70, 54, 98, 50, 's', 'Frappe'], [68, 52, 10, 62, 'c', 'Retour en footing']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 2, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Dribbler pour marquer', obj: 'Oser éliminer avant de finir',
  id: 'mc-jeu-magique', likes: 43, title: 'Le jeu magique', theme: 'Dribble', phase: 'ballon', type: 'Jeu',
  players: [10, 14, 16], size: [35, 45], duration: 15, intensity: 3,
  src: MYCOACH.src('Le jeux Magique', 'Ricardo Cunha', 'FC Espagnol Lausanne'),
  goal: 'Pour marquer, il faut avoir éliminé un défenseur en dribble dans la zone offensive.',
  rules: [
    'Terrain coupé en deux : une zone défensive et une zone offensive par équipe.',
    'Jeu libre.',
    'But valable seulement si le buteur a éliminé un adversaire en dribble dans la zone offensive.',
    'Un dribble réussi sans but = rien, mais le coach le valorise.'
  ],
  coach: ['Oser le un contre un.', 'Accélérer après le dribble.', 'Créer le un contre un en écartant.'],
  posture: 'Sur le côté, à hauteur de la ligne médiane : il valide les dribbles et encourage la prise de risque.',
  expect: ['Tenter le dribble.', 'Éliminer.', 'Marquer après un dribble.'],
  easier: 'Un dribble n’importe où compte.', harder: 'Deux dribbles avant de marquer.',
  success: 'Des tentatives de dribble à chaque attaque.',
  also: [{ moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', obj: 'Ne pas se faire éliminer',
    posture: 'Derrière un but : il observe les duels défensifs.', coach: ['Distance d’intervention.', 'Fléchi, de côté.'],
    expect: ['Tenir son duel.', 'Orienter vers l’extérieur.', 'Récupérer.'] }],
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], zones: [[50, 0, .01, 100, '']], formations: n => [[22, 30], [22, 70], [40, 50], [60, 25], [60, 75], [72, 50]].slice(0, n), ball: 'b3', script: [
    ['b3', 'b6', 'p', 'Passe dans la zone offensive'], ['b6', [80, 40], 'd', 'Dribble : défenseur éliminé'], ['b6', 'butR', 's', 'But valable']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Portes en largeur', obj: 'Déplacer le ballon collectivement sur la largeur',
  id: 'mc-portes-largeur', likes: 43, title: 'Bloc équipe et jeu des portes', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [14, 18, 18], size: [50, 64], duration: 35, intensity: 3, oddJoker: true,
  src: MYCOACH.src('Bloc équipe + jeu de parme', 'Kevin Senas', 'Les Labourdins d’Ustaritz'),
  goal: 'Neuf portes réparties sur un demi-terrain : passer le ballon dans une porte à un partenaire, puis attaquer la ligne adverse.',
  rules: [
    '9 contre 9 sur un demi-terrain, 9 portes placées au hasard, sources de ballons autour.',
    'Séquence 1 (10 min) : conservation ; passe à un partenaire à travers une porte = 1 point, le jeu continue. 3 min de récupération.',
    'Séquence 2 (15 min) : chaque équipe défend une ligne ; il faut passer une porte avant d’aller arrêter le ballon derrière la ligne adverse.',
    'Jeu en deux touches de préférence.'
  ],
  coach: ['Déplacer le ballon sur toute la largeur.', 'Se placer derrière une porte libre.', 'Premier contrôle propre pour enchaîner.'],
  posture: 'Sur la touche : il observe les déplacements collectifs et la communication.',
  expect: ['Passer une porte.', 'Passer une porte puis marquer.', 'Deux points par séquence.'],
  easier: 'Plus de portes.', harder: 'Deux touches obligatoires.',
  success: 'Le ballon change souvent de côté.',
  also: [{ moment: 'nepossede', sub: 'Zone 2 · Contrôler l’adversaire', obj: 'Bloc compact sur la largeur',
    posture: 'Sur la touche : il observe le bloc qui coulisse.', coach: ['Coulisser ensemble.', 'Fermer les portes côté ballon.'],
    expect: ['Rester compact.', 'Fermer les portes.', 'Récupérer.'] }],
  layout: { zones: [[0, 0, 4, 100, ''], [96, 0, 4, 100, '']], cones: [[20, 20], [20, 28], [50, 15], [50, 23], [80, 20], [80, 28], [30, 55], [30, 63], [70, 55], [70, 63], [50, 80], [50, 88]],
    formations: n => MYCOACH.grid(n, 8, 10, 56, 90), formationsAway: n => MYCOACH.grid(n, 44, 14, 92, 86), ball: 'b1', script: [
    ['b1', 'b4', 'p', 'Le jeu change de côté'], ['b6', [36, 59], 'c+', 'Un partenaire se place derrière la porte'], ['b4', 'b6', 'p', 'Passe dans la porte : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Renversement à trois', obj: 'Se démarquer pour renverser',
  id: 'mc-renversement-simple', likes: 40, title: 'Renversement du jeu à trois', theme: 'Passe', phase: 'ballon', type: 'Exercice',
  players: [3, 3, 9], size: [20, 30], duration: 20, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Exercice très simple pour renversement du jeu', 'Tony Montiel', 'Racing Club de France'),
  goal: 'Passe claquée au joueur du milieu, qui se démarque et renverse vers le joueur opposé.',
  rules: [
    'Trois joueurs : deux aux plots extérieurs, un au milieu.',
    'Le premier fait une passe claquée au joueur du milieu.',
    'Le joueur du milieu fait une courte course de démarquage, reçoit et transmet au joueur opposé.',
    'On enchaîne dans l’autre sens ; on change le joueur du milieu régulièrement.'
  ],
  coach: ['Course de démarquage avant la passe.', 'Corps ouvert pour recevoir et transmettre.', 'Tempo élevé.'],
  posture: 'À côté du joueur du milieu : il corrige l’orientation du corps.',
  expect: ['Passes claquées.', 'Renversement en deux touches.', 'Renversement en une touche.'],
  easier: 'Deux touches.', harder: 'Une touche, distances plus grandes.',
  success: 'Le ballon change de côté sans ralentir.',
  layout: { cones: [[8, 50], [92, 50]], start: [8, 50], home: [[8, 50], [50, 50], [92, 50]], ball: [11, 53], moves: [
    [50, 50, 50, 36, 'c', 'Démarquage'], [11, 53, 48, 38, 'p', 'Passe claquée'], [50, 36, 89, 50, 'p', 'Renversement'], [50, 36, 50, 62, 'c+', 'Il se démarque de l’autre côté']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Épaule contre épaule', obj: 'Résister à la charge et frapper',
  id: 'mc-epaule', likes: 39, title: 'Épaule contre épaule et face au gardien', theme: 'Finition', phase: 'ballon', type: 'Situation',
  players: [4, 10, 12], size: [35, 40], duration: 15, intensity: 4, params: { unit: 'joueurs' },
  src: MYCOACH.src('Epaule contre épaule / Finition / Face à face', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Le coach glisse un ballon entre deux joueurs côte à côte : duel à l’épaule, le gagnant va au face à face.',
  rules: [
    'Deux joueurs côte à côte, épaule contre épaule. Le coach glisse le ballon devant eux.',
    'Prise du ballon avec l’épaule uniquement.',
    'Celui qui gagne va au face à face ; l’autre va chercher un ballon sur un plot latéral et frappe aussi.',
    'Repérer la position du gardien avant de frapper. Chacun ramène son ballon.'
  ],
  coach: ['Charge loyale, épaule contre épaule.', 'Regarder le gardien avant de frapper.', 'Face à face : viser le ras du poteau.'],
  posture: 'Derrière les deux joueurs : il glisse le ballon et juge les charges.',
  expect: ['Gagner le duel loyalement.', 'Cadrer.', 'Marquer au ras du poteau.'],
  easier: 'Départ avec un mètre d’écart.', harder: 'Le perdant peut défendre.',
  success: 'Duels engagés et frappes réfléchies.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, discs: [[60, 15], [60, 85]], balls: [[60, 19], [52, 50]],
    start: [36, 46], home: [[36, 46], [36, 54]], moves: [
    [52, 50, 60, 50, 'p', 'Le coach glisse le ballon'], [36, 46, 58, 48, 'c', 'Duel épaule contre épaule'], [36, 54, 56, 54, 'c+', ''],
    [58, 48, 80, 50, 'c', 'Le gagnant va au face à face'], [60, 50, 80, 50, 'p+', ''], [82, 50, 98, 44, 's', 'Frappe au ras du poteau'],
    [56, 54, 60, 22, 'c', 'Le perdant va au plot latéral'], [60, 19, 98, 52, 's', 'et frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Contrôle-passe à deux', obj: 'Varier contrôles et enchaînements',
  id: 'mc-controle-deux', likes: 39, title: 'Contrôle-passe à deux, entre deux carrés', theme: 'Technique', phase: 'ballon', type: 'Exercice',
  players: [2, 2, 4], size: [5, 25], duration: 20, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('contôle passe à 2', 'Johan Roubault', 'AS Aix-en-Provence'),
  goal: 'Deux carrés de 5 m à 15 m l’un de l’autre, un ballon pour deux : une consigne nouvelle toutes les 2 à 3 minutes.',
  rules: [
    'Contrôle-passe en deux touches dans le carré ; puis un joueur en une touche, l’autre en deux ; puis une touche pour les deux.',
    'Contrôle sur le côté du carré, passe en deux touches.',
    'Appel à l’extérieur du carré, passe dans le carré.',
    'Contrôle orienté, conduite autour d’un plot et passe ; puis contrôle, dribble (crochet, râteau, passement) et passe.'
  ],
  coach: ['Contrôle orienté vers où l’on veut aller.', 'Passe appuyée, au sol.', 'Le geste juste avant la vitesse.'],
  posture: 'Entre les ateliers : il démontre chaque consigne.',
  expect: ['Deux touches sans faute.', 'Une touche.', 'Enchaîner le dribble sans perdre le ballon.'],
  easier: 'Carrés plus proches.', harder: 'Pied faible imposé.',
  success: 'Les gestes sont propres à toutes les consignes.',
  layout: { zones: [[0, 0, 20, 100, ''], [80, 0, 20, 100, '']], start: [10, 50], home: [[10, 50], [90, 50]], ball: [13, 53], moves: [
    [13, 53, 87, 50, 'p', 'Passe'], [90, 50, 90, 25, 'c', 'Contrôle sur le côté'], [90, 25, 12, 48, 'p', 'Passe'], [10, 50, 10, 75, 'c', 'Contrôle orienté']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Le Y', obj: 'Prise de balle et orientation du corps',
  id: 'mc-le-y', likes: 38, title: 'Le Y : une-deux et passes longues', theme: 'Passe', phase: 'ballon', type: 'Exercice',
  players: [4, 5, 10], size: [25, 35], duration: 15, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('Le Y', 'Kevin Senas', 'Les Labourdins d’Ustaritz'),
  goal: 'Un circuit en Y : une-deux, passe longue claquée, remise, et retour au départ.',
  rules: [
    'A fait un une-deux avec B (au centre du Y).',
    'A joue pour C (une des branches) ; C rejoue avec B.',
    'B joue direct sur D (l’autre branche) ; D rejoue vers le départ.',
    'Rotation A → B → C → D → A. Passes longues de 25 m.'
  ],
  coach: ['Être orienté pour enchaîner vite.', 'Passes longues claquées.', 'Toujours en mouvement.'],
  posture: 'Au centre du Y : il corrige l’orientation du corps.',
  expect: ['Circuit sans faute.', 'Passes longues précises.', 'Tout en deux touches.'],
  easier: 'Distances de 15 m.', harder: 'Une touche pour B.',
  success: 'Le ballon ne s’arrête pas.',
  layout: { cones: [[50, 55]], start: [10, 50], home: [[10, 50], [44, 50], [88, 15], [88, 85]], ball: [13, 53], moves: [
    [13, 53, 41, 50, 'p', 'Une-deux avec B'], [44, 50, 22, 44, 'p', ''], [10, 50, 20, 46, 'c+', ''],
    [22, 44, 85, 18, 'p', 'Passe longue vers C'], [88, 15, 47, 47, 'p', 'C rejoue avec B'],
    [47, 47, 85, 82, 'p', 'B joue direct sur D'], [88, 85, 14, 54, 'p', 'D relance au départ']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 2, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Double finition', obj: 'Frapper puis attaquer un centre',
  id: 'mc-double-finition', likes: 38, title: 'Double finition', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [10, 16, 18], size: [40, 50], duration: 20, intensity: 3, params: { unit: 'postes' },
  src: MYCOACH.src('double finition pochetino', 'Loris Carrafa', ''),
  goal: 'Une combinaison avec deux appuis axiaux et une frappe, puis course vers l’autre but pour reprendre un centre.',
  rules: [
    'Rectangle de 50 × 40, deux buts avec gardiens, deux appuis au centre (l’un devant l’autre), un centreur de chaque côté.',
    'A joue dans les pieds du premier appui, qui remet à A’ ; A’ joue avec le second appui, qui remet dans la course de A. A frappe.',
    'A et A’ courent vers l’autre but et reprennent le centre du centreur.',
    'La paire suivante fait la même chose dans l’autre sens. 16 joueurs minimum dont 2 gardiens.'
  ],
  coach: ['Remises en une touche, devant le joueur.', 'Après la frappe, repartir tout de suite.', 'Sur le centre : un au premier poteau, un au second.'],
  posture: 'Au centre, près des appuis : il donne le rythme des départs.',
  expect: ['Frappe cadrée.', 'Arriver à temps sur le centre.', 'Marquer deux fois.'],
  easier: 'Pas de centre.', harder: 'Un défenseur sur le centre.',
  success: 'Deux frappes à chaque passage.',
  also: [MYCOACH.physique('Enchaîner les finitions', 'Au centre : il enchaîne les paires sans temps mort.')],
  layout: { goals: [[1.5, 50, 90], [98.5, 50, 90]], keepers: [[6, 50], [94, 50]], start: [24, 40], home: [[24, 40], [24, 60], [44, 50], [58, 50], [50, 4], [50, 96]], ball: [27, 43], balls: [[53, 7]], moves: [
    [27, 43, 41, 50, 'p', 'Passe au premier appui'], [44, 50, 26, 58, 'p', 'Remise à A’'],
    [26, 58, 55, 50, 'p', 'A’ joue avec le second appui'], [24, 40, 66, 42, 'c+', 'A part'],
    [58, 50, 66, 42, 'p', 'Remise dans la course'], [66, 42, 98, 46, 's', 'Frappe'],
    [66, 42, 16, 44, 'c', 'Course vers l’autre but'], [24, 60, 14, 58, 'c+', ''],
    [53, 7, 14, 44, 'p', 'Centre'], [14, 44, 2, 50, 's', 'Reprise']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Vitesse', template: 'circuit', moment: 'physique', sub: 'Signal de couleur', name: 'Signal de couleur', obj: 'Réagir à un signal en plein mouvement',
  id: 'mc-signal-couleur', likes: 36, title: 'Vivacité au signal de couleur', theme: 'Physique', phase: 'sans', type: 'Exercice',
  players: [2, 4, 14], size: [8, 12], duration: 15, intensity: 4, series: [6, 45], params: { unit: 'joueurs' },
  src: MYCOACH.src('Vivacité', 'Nicolas Flohic', ''),
  goal: 'Saut, signal de couleur, appui dans le bon cerceau, pas chassés, sprint.',
  rules: [
    'Au top : saut pieds joints par-dessus la haie.',
    'À la réception, le coach annonce « bleu » ou « rouge » : un appui dans le cerceau de cette couleur.',
    'Pas chassés derrière la latte.',
    'Sprint jusqu’aux coupelles d’arrivée (10 m du départ). Récupération complète.'
  ],
  coach: ['Réception équilibrée pour réagir vite.', 'Appuis courts et rapides.', 'Sprint à fond jusqu’à la ligne.'],
  posture: 'À côté des cerceaux : il annonce la couleur au moment de la réception.',
  expect: ['Bon cerceau.', 'Réaction immédiate.', 'Sprint sans ralentir.'],
  easier: 'Couleur annoncée avant le saut.', harder: 'Signal visuel seulement.',
  success: 'Pas d’hésitation sur le signal.',
  layout: { cones: [[20, 50]], discs: [[38, 35], [38, 65], [95, 40], [95, 60]], zones: [[56, 30, 4, 40, '']], start: [6, 50], home: [[6, 50], [6, 70]], moves: [
    [6, 50, 26, 50, 'c', 'Saut par-dessus la haie'], [26, 50, 38, 35, 'c', 'Signal : appui dans le bon cerceau'],
    [38, 35, 58, 50, 'c', 'Pas chassés'], [58, 50, 95, 50, 'c', 'Sprint']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Vitesse', template: 'circuit', keepers: 1, moment: 'physique', sub: 'Plots et frappe', name: 'Plots et frappe', obj: 'Réagir, mémoriser, sprinter et frapper',
  id: 'mc-plots-frappe', likes: 35, title: 'Réaction, vivacité et duel de frappe', theme: 'Physique', phase: 'ballon', type: 'Exercice',
  players: [2, 4, 10], size: [20, 30], duration: 20, intensity: 4, series: [8, 60], params: { unit: 'joueurs' },
  src: MYCOACH.src('Réaction Vivacité + duel', 'Loïc Izzo', 'FC Biassais'),
  goal: 'Le coach annonce une suite de plots ; les deux joueurs les touchent dans l’ordre puis sprintent pour frapper.',
  rules: [
    'Quatre plots de couleur à 1-2 m les uns des autres, chacun avec un numéro. Les joueurs partent par deux.',
    'Le coach annonce 2 ou 3 numéros ou couleurs (ex. « 2-1-3 ») : on touche les plots dans l’ordre.',
    'Puis sprint jusqu’au ballon et frappe : le premier qui frappe gagne.',
    'Variante : une couleur, retour en marche arrière, nouvelle couleur… puis « ballon ! ». 4 à 5 passages par joueur.'
  ],
  coach: ['Écouter toute la suite avant de partir.', 'Appuis courts autour des plots.', 'Frapper sans s’arrêter.'],
  posture: 'Derrière les plots : il annonce les suites, de plus en plus longues.',
  expect: ['Respecter l’ordre.', 'Frapper le premier.', 'Marquer.'],
  easier: 'Deux plots seulement.', harder: 'Mélanger numéros et couleurs.',
  success: 'Bon ordre et réaction rapide.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[20, 40], [26, 46], [20, 54], [26, 60]], balls: [[70, 46], [70, 56]],
    start: [8, 46], home: [[8, 46], [8, 56]], moves: [
    [8, 46, 26, 44, 'c', 'Plot 2'], [26, 44, 20, 40, 'c', 'Plot 1'], [20, 40, 24, 58, 'c', 'Plot 3'], [24, 58, 68, 48, 'c', 'Sprint'], [70, 46, 98, 48, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Passe et va à quatre', obj: 'Prises de balle et enchaînements',
  id: 'mc-passe-va-4', likes: 35, title: 'Passe et va à quatre joueurs', theme: 'Passe', phase: 'ballon', type: 'Exercice',
  players: [4, 4, 8], size: [16, 16], duration: 20, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Passe et va à 4 joueurs', 'Kevin Senas', 'Les Labourdins d’Ustaritz'),
  goal: 'Passe et va sur 16 m, avec des prises de balle imposées puis des appuis-remises.',
  rules: [
    '2 min : passe et va simple, prise de balle libre.',
    '4 min : prise de balle imposée, qui change toutes les 45 secondes.',
    '2 min : appui-remise ; 2 min : appui-remise et troisième joueur.',
    '4 min : concours entre ateliers sur l’appui-remise.'
  ],
  coach: ['Être prêt à recevoir, sur ses appuis.', 'Prise de balle dans le sens du jeu.', 'Concentration jusqu’au bout du concours.'],
  posture: 'Entre les ateliers : il annonce la prise de balle imposée.',
  expect: ['Passes justes.', 'Prise de balle imposée réussie.', 'Gagner le concours.'],
  easier: 'Distance de 12 m.', harder: 'Une touche sur l’appui.',
  success: 'Enchaînements fluides.',
  layout: { cones: [[30, 50], [70, 50]], start: [6, 50], home: [[6, 50], [94, 50], [12, 50], [88, 50]], ball: [9, 53], moves: [
    [9, 53, 91, 50, 'p', 'Passe'], [6, 50, 86, 54, 'c+', 'et va'], [94, 50, 15, 50, 'p', ''], [94, 50, 14, 54, 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, game: 'Physique intégré', template: 'circuit', moment: 'physique', sub: 'Circuit training 15-15', name: 'Circuit training 15-15', obj: 'Coordination et puissance en circuit',
  id: 'mc-circuit-15-15', likes: 34, title: 'Circuit training 15-15', theme: 'Physique', phase: 'sans', type: 'Exercice',
  players: [10, 20, 20], size: [40, 60], duration: 30, intensity: 3, series: [15, 15], params: { unit: 'joueurs' },
  src: MYCOACH.src('circuit training 15/15', 'Jimmy Valentin', 'JS Luronnes'),
  goal: 'Dix ateliers en 15 secondes de travail, 15 secondes de récupération.',
  rules: [
    'Échelle de coordination · médecine-ball à deux, genoux fléchis · haies basses pieds joints avec rebond · corde à sauter.',
    '80 m en 15 secondes · cerceaux (pied droit rouge, pied gauche jaune) · vitesse sur 15 m.',
    'Appuis latéraux dans les lattes · pas chassés avec élastique aux chevilles · 80 m en 15 secondes.',
    '15 s de travail, 15 s de récupération, atelier suivant.'
  ],
  coach: ['Qualité d’exécution avant tout.', 'Gainage pendant les sauts.', 'Respecter l’ordre du circuit.'],
  posture: 'Au centre du circuit : il chronomètre et corrige chaque atelier.',
  expect: ['Faire tous les ateliers.', 'Tenir le rythme.', 'Exécution propre jusqu’à la fin.'],
  easier: '15 s de travail, 30 s de récupération.', harder: 'Deux tours.',
  success: 'Un circuit complet sans baisse de qualité.',
  layout: { zones: [[2, 4, 18, 26, 'Échelle'], [22, 4, 18, 26, 'Médecine-ball'], [42, 4, 18, 26, 'Haies'], [62, 4, 18, 26, 'Corde'], [82, 4, 16, 26, '80 m'],
    [2, 70, 18, 26, 'Cerceaux'], [22, 70, 18, 26, 'Vitesse 15 m'], [42, 70, 18, 26, 'Lattes'], [62, 70, 18, 26, 'Élastique'], [82, 70, 16, 26, '80 m']],
    start: [11, 17], home: [[11, 17], [31, 17], [51, 17], [71, 17], [90, 17], [11, 83], [31, 83], [51, 83], [71, 83], [90, 83]], moves: [
    [11, 17, 31, 40, 'c', 'Rotation toutes les 30 s'], [31, 17, 51, 40, 'c+', ''], [51, 17, 71, 40, 'c+', ''], [71, 17, 90, 40, 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'echauffement', sub: 'Mise en route', name: 'Gammes, slalom et finition', obj: 'S’échauffer ensemble jusqu’à la frappe',
  id: 'mc-gammes-finition', likes: 30, title: 'Échauffement : gammes, slalom et finition', theme: 'Échauffement', phase: 'ballon', type: 'Exercice',
  players: [6, 20, 20], size: [35, 50], duration: 15, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('echauffement technique', 'Jimmy Valentin', 'JS Luronnes'),
  goal: 'Par deux : gammes en croisant les courses, puis slalom balle au pied et frappe.',
  rules: [
    'Par deux, trottiner jusqu’à la première quille et croiser les courses en faisant des gammes, avec puis sans ballon.',
    'Puis conduite en slalom entre les piquets.',
    'Finition devant le but.',
    'La paire suivante part quand la précédente croise ses courses.'
  ],
  coach: ['Rythme commun, tous coordonnés.', 'Gammes amples et propres.', 'Frappe placée.'],
  posture: 'Au milieu du parcours : il donne les gammes à faire.',
  expect: ['Gammes correctes.', 'Slalom sans toucher.', 'Frappe cadrée.'],
  easier: 'Pas de gammes avec ballon.', harder: 'Frappe en une touche sur passe.',
  success: 'Le groupe est chaud et coordonné.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, cones: [[20, 30], [20, 70], [50, 46], [56, 54], [62, 46], [68, 54]],
    start: [6, 30], home: [[6, 30], [6, 70]], balls: [[33, 37]], moves: [
    [6, 30, 30, 66, 'c', 'Gammes en croisant'], [6, 70, 30, 34, 'c+', ''],
    [30, 34, 72, 50, 'd', 'Slalom balle au pied'], [74, 52, 98, 50, 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Attaque placée par les côtés', obj: 'Passer par les côtés pour marquer',
  id: 'mc-attaque-relance', likes: 30, title: 'Attaque placée et relance de la défense', theme: 'Finition', phase: 'ballon', type: 'Jeu',
  players: [10, 12, 14], size: [45, 55], duration: 20, intensity: 3,
  src: MYCOACH.src('Attaque placée, relance Défense', 'Manuel Castang', 'Ste Om.S. St Papoul'),
  goal: 'Les bleus attaquent le grand but en passant par les côtés ; les rouges relancent proprement vers deux mini-buts.',
  rules: [
    'Attaque contre défense sur un demi-terrain. Deux jokers dans les couloirs jouent avec l’équipe qui a le ballon.',
    'Bleus : passage obligatoire par un côté avant de marquer.',
    'Rouges : à la récupération, 5 passes latérales minimum (gardien et jokers compris) avant de marquer dans un mini-but.',
    'Jeu libre, puis deux touches.'
  ],
  coach: ['Jouer en triangle.', 'Limiter les dribbles inutiles.', 'Le gardien participe à la relance.'],
  posture: 'Sur le côté, à hauteur du milieu : il compte les passes de relance.',
  expect: ['Passer par un côté.', 'Marquer après le côté.', 'Rouges : 5 passes puis mini-but.'],
  easier: 'Pas de minimum de passes.', harder: 'Deux touches pour tous.',
  success: 'Attaques construites, relances calmes.',
  also: [{ moment: 'possede', sub: 'Zone 1 · Construire le jeu', obj: 'Relancer sans pression',
    posture: 'Derrière le but : il observe la relance des rouges.', coach: ['Écarter les défenseurs.', 'Utiliser le gardien.'],
    expect: ['5 passes.', 'Utiliser un joker.', 'Marquer dans un mini-but.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], minis: [[1.5, 25, 90], [1.5, 75, 90]], zones: [[0, 0, 100, 16, 'Couloir'], [0, 84, 100, 16, 'Couloir']], supports: [[60, 8, 'J'], [60, 92, 'J']],
    formations: n => [[30, 50], [44, 30], [44, 70], [60, 40], [66, 60]].slice(0, n), formationsAway: n => [[86, 34], [86, 66], [76, 50], [72, 30], [72, 70]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Circulation'], ['b2', 'a1', 'p', 'Passage par le côté'], ['b4', [86, 44], 'c+', ''], ['a1', 'b4', 'p', 'Centre'], ['b4', 'butR', 's', 'But']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'possede', sub: 'Zone 2 · Maîtriser et déstabiliser', name: 'Jeu de position en quatre zones', obj: 'Faire voyager le ballon',
  id: 'mc-jeu-position', likes: 30, title: 'Jeu de position en quatre zones', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [14, 17, 18], size: [35, 40], duration: 20, intensity: 3, oddJoker: true, keepers: 0,
  src: MYCOACH.src('JEU DE POSITION', 'Jordan Galtier', ''),
  goal: 'Faire passer le ballon dans les quatre zones, puis finir avec un attaquant et un troisième homme.',
  rules: [
    '8 contre 8 + 1 joker, trois touches, jeu au sol. Terrain en quatre zones, mini-buts aux deux bouts.',
    'Ballon passé par les quatre zones = 1 point. But avec un attaquant et un troisième homme = double.',
    'Variante 1 : à la récupération, trouver l’appui opposé + troisième homme + but = triple.',
    'Variante 2 : à la récupération, changer de zone en moins de 3 passes sans passer par l’appui le plus proche.'
  ],
  coach: ['Occuper chaque zone.', 'Sortir de la densité par la passe.', 'Changer de statut tout de suite.'],
  posture: 'Sur le côté : il compte les zones traversées.',
  expect: ['Traverser deux zones.', 'Traverser les quatre.', 'Marquer avec le troisième homme.'],
  easier: 'Sans hors-jeu.', harder: 'Deux touches.',
  success: 'Le ballon voyage sur tout le terrain.',
  layout: { minis: [[1.5, 30, 90], [1.5, 70, 90], [98.5, 30, 90], [98.5, 70, 90]], zones: [[0, 0, 50, 50, ''], [50, 0, 50, 50, ''], [0, 50, 50, 50, ''], [50, 50, 50, 50, '']],
    formations: n => MYCOACH.grid(n, 8, 10, 92, 90), formationsAway: n => MYCOACH.grid(n, 16, 18, 84, 82).map(([x, y]) => [x + 4, y + 5]), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Zone 1'], ['b2', 'b5', 'p', 'Zone 2'], ['b5', 'b6', 'p', 'Zone 3'], ['b6', 'b8', 'p', 'Zone 4 : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, moment: 'recupere', sub: 'Zone 1 · Jouer vers l’avant', name: 'Dix passes ou une porte', obj: 'Choisir : conserver ou attaquer vite',
  id: 'mc-dix-ou-porte', likes: 29, title: 'Créer et utiliser les espaces', theme: 'Transition offensive', phase: 'transition', type: 'Jeu',
  players: [14, 16, 16], size: [35, 35], duration: 21, intensity: 3,
  src: MYCOACH.src('Echauffement créer et utiliser les espaces', 'Grégory Joly', 'US Colomiers'),
  goal: 'Conservation 8 contre 8 : à la récupération, soit 10 passes, soit passage dans une porte en moins de 5 secondes.',
  rules: [
    '8 contre 8 dans un carré de 35 m, une porte au milieu de chaque côté.',
    '10 passes = 1 point.',
    'À la récupération : 10 passes, ou passage dans une porte en moins de 5 secondes (1 point). Porte ratée : ballon rendu.',
    'Variantes : 3 touches ; un but à marquer dans une porte en première intention après 10 passes.'
  ],
  coach: ['Lever la tête dès la récupération : porte libre ?', 'Toujours en mouvement.', 'Oser la prise de risque.'],
  posture: 'Au bord du carré : il compte les 5 secondes après chaque récupération.',
  expect: ['10 passes.', 'Porte en moins de 5 secondes.', 'Choisir la bonne option à chaque récupération.'],
  easier: '8 passes.', harder: 'Trois touches.',
  success: 'Des portes attaquées vite quand elles sont libres.',
  also: [{ moment: 'echauffement', sub: 'Mise en route', obj: 'S’échauffer en conservant', posture: 'Au bord du carré : il fait monter l’intensité.',
    coach: ['Démarrer en 4 touches.', 'Accélérer ensuite.'], expect: ['Bouger.', 'Faire 10 passes.', 'Passer une porte.'] }],
  layout: { cones: [[50, 1], [50, 99], [1, 50], [99, 50]].flatMap(([x, y]) => x === 50 ? [[44, y], [56, y]] : [[x, 44], [x, 56]]),
    formations: n => MYCOACH.grid(n, 8, 10, 92, 90), formationsAway: n => MYCOACH.grid(n, 16, 18, 84, 82).map(([x, y]) => [x + 4, y + 5]), ball: 'r1', script: [
    ['r1', 'r2', 'p', 'Les rouges conservent'], ['b3', [40, 30], 'c+', ''],
    ['r2', 'b3', 'p', 'Récupération bleue'], ['b3', [50, 6], 'd', 'Porte libre : on y va'], ['b3', [50, 0], 'd', 'Porte en moins de 5 s : 1 point']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'ludique', sub: 'Course à la couleur', name: 'Course à la couleur', obj: 'Réagir le premier au signal',
  id: 'mc-course-couleur', likes: 29, title: 'Course à la couleur', theme: 'Vivacité', phase: 'sans', type: 'Jeu',
  players: [2, 2, 8], size: [10, 20], duration: 20, intensity: 4, params: { unit: 'joueurs' },
  src: MYCOACH.src('vivacité', 'Loïc Izzo', 'FC Biassais'),
  goal: 'Deux joueurs côte à côte, deux portes de couleur : au signal, le premier dans la bonne porte gagne.',
  rules: [
    'Deux portes de couleurs différentes, une de chaque côté.',
    'Les deux joueurs sont côte à côte au milieu.',
    'Signal visuel ou sonore : courir vers la porte de la couleur annoncée.',
    'Le perdant a un gage.'
  ],
  coach: ['Position basse, prêt à partir.', 'Premier pas dans la bonne direction.', 'Sprint jusqu’au bout.'],
  posture: 'Face aux joueurs : il varie signaux visuels et sonores.',
  expect: ['Bonne porte.', 'Réaction immédiate.', 'Gagner.'],
  easier: 'Signal sonore seulement.', harder: 'Signal inversé : aller à l’autre couleur.',
  success: 'Des départs rapides et justes.',
  also: [{ moment: 'physique', sub: 'Course à la couleur', obj: 'Vitesse de réaction', posture: 'Face aux joueurs : il impose une récupération complète.',
    coach: ['Départ explosif.', 'Récupération complète.'], expect: ['Réagir.', 'Partir vite.', 'Garder la vitesse sur toutes les séries.'] }],
  layout: { discs: [[2, 40], [2, 60], [98, 40], [98, 60]], start: [46, 50], home: [[46, 50], [54, 50]], moves: [
    [46, 50, 4, 50, 'c', 'Signal : « rouge » !'], [54, 50, 14, 52, 'c+', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Contrôle orienté en trois carrés', obj: 'Contrôler orienté et frapper vite',
  id: 'mc-co-trois-carres', likes: 29, title: 'Finition avec contrôle orienté', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [6, 9, 18], size: [35, 45], duration: 15, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('FINITION AVEC CONTROLE ORIENTER', 'Jimmy Valentin', 'JS Luronnes'),
  goal: 'Trois carrés de 5 m face au but : contrôle orienté puis frappe sans sortir du carré.',
  rules: [
    'Trois carrés de 5 × 5 m (gauche, centre, droite), une source de ballons devant chacun.',
    'Le passeur sert le joueur du carré, puis prend sa place.',
    'Carré droit : contrôle vers la droite, frappe pied droit. Carré gauche : contrôle vers la gauche, frappe pied gauche. Carré central : au choix.',
    'Le tireur récupère son ballon et rejoint la source.'
  ],
  coach: ['Contrôle orienté qui prépare la frappe.', 'Enchaîner vite, sans toucher de plus.', 'Rester dans le carré.'],
  posture: 'Derrière les carrés : il observe l’orientation du contrôle.',
  expect: ['Contrôle orienté réussi.', 'Frappe cadrée.', 'But en deux touches.'],
  easier: 'Carrés plus grands.', harder: 'Passes plus fortes.',
  success: 'Contrôle et frappe enchaînés.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, zones: [[64, 20, 10, 14, ''], [64, 43, 10, 14, ''], [64, 66, 10, 14, '']],
    start: [69, 27], home: [[69, 27], [69, 50], [69, 73], [36, 27], [36, 50], [36, 73]], ball: [39, 30], balls: [[39, 53], [39, 76]], moves: [
    [39, 30, 67, 28, 'p', 'Passe'], [69, 27, 72, 22, 'c', 'Contrôle orienté'], [73, 23, 98, 44, 's', 'Frappe'],
    [39, 76, 67, 74, 'p', 'Carré gauche'], [69, 73, 72, 78, 'c', ''], [73, 77, 98, 54, 's', 'Frappe pied gauche']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Fixer une zone, jouer l’autre', obj: 'Fixer dans une zone pour jouer dans une autre',
  id: 'mc-fixer-zone', likes: 28, title: 'Situation : fixer pour jouer ailleurs', theme: 'Finition', phase: 'ballon', type: 'Situation',
  players: [14, 15, 16], size: [50, 55], duration: 20, intensity: 3, defenders: 5,
  src: MYCOACH.src('Situation', 'Arthur Chaney', 'ESCC Tournoi'),
  goal: '7 attaquants contre 5 défenseurs : déplacer le bloc d’un côté pour attaquer de l’autre.',
  rules: [
    'Bleus en attaque : un soutien fixe et deux lignes de trois. Rouges en défense : trois défenseurs et deux milieux, en zone devant une ligne de coupelles.',
    'Les bleus entrent dans la zone de finition dès qu’une passe a franchi la ligne. Hors-jeu appliqué.',
    'Bleus : marquer. Rouges : récupérer et passer à l’un des deux relais placés au milieu de terrain.',
    'On repart toujours du soutien.'
  ],
  coach: ['Attirer le bloc d’un côté par la circulation.', 'Renverser vite quand le bloc a glissé.', 'L’appel dans la zone part au moment de la passe.'],
  posture: 'Sur le côté, à hauteur de la ligne : il observe le bloc rouge qui glisse.',
  expect: ['Faire glisser le bloc.', 'Renverser pour entrer dans la zone.', 'Marquer.'],
  easier: 'Défenseurs à 4.', harder: 'Attaque en moins de 15 secondes.',
  success: 'Les attaques finissent du côté faible.',
  also: [{ moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', obj: 'Défendre en zone, décalé côté ballon',
    posture: 'Derrière le but : il observe le décalage côté ballon.', coach: ['Glisser ensemble.', 'Ne pas laisser le côté faible vide.'],
    expect: ['Glisser côté ballon.', 'Couper le renversement.', 'Trouver un relais.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], zones: [[72, 0, 28, 100, 'Zone de finition']], supports: [[4, 30, 'R'], [4, 70, 'R']],
    formations: n => [[24, 50], [44, 20], [44, 50], [44, 80], [60, 20], [60, 50], [60, 80]].slice(0, n), formationsAway: n => [[78, 30], [78, 50], [78, 70], [66, 38], [66, 62]].slice(0, n), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Circulation côté gauche'], ['r', -4, 'bloc+', ''],
    ['b2', 'b3', 'p', ''], ['b3', 'b4', 'p', 'Renversement'], ['b7', [84, 76], 'c+', 'Appel dans la zone'], ['b4', 'b7', 'p', ''], ['b7', 'butR', 's', 'But du côté faible']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Contrôle vers la cible', obj: 'Orienter son contrôle vers la passe',
  id: 'mc-xavi', likes: 28, title: 'Passe et contrôle orienté vers une cible', theme: 'Technique', phase: 'ballon', type: 'Exercice',
  players: [3, 4, 8], size: [15, 15], duration: 15, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Master Class de Xavi (Passe et contrôle orienter)', 'Aissa Hamadou', 'Shamrock’s Academy'),
  goal: 'Le distributeur passe au receveur dans un carré, qui contrôle orienté vers une des cibles et passe.',
  rules: [
    'Un receveur dans un petit carré, un distributeur, des mini-buts (ou des joueurs) comme cibles autour.',
    'Passe tendue vers le carré ; le receveur contrôle dans la direction de sa passe et vise une cible. Deux touches maximum.',
    'Trois tours dans le sens des aiguilles d’une montre, puis on change de receveur. Groupes de 3 ou 4.',
    'Variantes : le distributeur annonce la cible, contrôle du pied arrière, un défenseur harcèle le receveur.'
  ],
  coach: ['Passe tendue et claquée.', 'Le ballon ne reste pas dans le pied au contrôle.', 'Intérieur ou extérieur selon la cible.'],
  posture: 'À côté du carré : il annonce les cibles.',
  expect: ['Contrôle orienté.', 'Deux touches.', 'Cible annoncée au dernier moment.'],
  easier: 'Trois touches.', harder: 'Un défenseur harcèle.',
  success: 'Le contrôle ouvre toujours la passe.',
  layout: { minis: [[98.5, 10, 90], [98.5, 90, 90], [50, 1.5, 0]], zones: [[42, 42, 16, 16, '']], start: [50, 50], home: [[50, 50], [10, 50]], ball: [13, 53], moves: [
    [13, 53, 48, 52, 'p', 'Passe tendue'], [50, 50, 56, 40, 'd', 'Contrôle orienté'], [57, 41, 96, 8, 's', 'Passe dans la cible']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Passe, motricité et conduite', obj: 'Technique et motricité en alternance',
  id: 'mc-passe-motricite', likes: 27, title: 'Passe, conduite et motricité', theme: 'Motricité', phase: 'ballon', type: 'Exercice',
  players: [4, 8, 12], size: [20, 30], duration: 15, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Travail technique (passe-conduite) - Motricité', 'Ambroise Courtogit', 'ES Azé'),
  goal: 'Échange de passes entre deux plots, puis l’un fait un parcours de motricité, l’autre un parcours de conduite.',
  rules: [
    'Deux colonnes face à face, les ballons à la colonne du haut.',
    'Le porteur passe au joueur d’en face, qui lui remet.',
    'Le passeur fait le parcours de motricité (cerceaux, coupelles) et revient dans sa colonne ; l’autre fait le parcours de conduite.',
    '2 séquences de 6 minutes, puis on inverse. Plus de rythme quand les joueurs sont chauds.'
  ],
  coach: ['Passe appuyée, remise propre.', 'Appuis légers et rapides sur la motricité.', 'Ballon proche en conduite.'],
  posture: 'Entre les deux parcours : il fait monter le rythme.',
  expect: ['Passes sans faute.', 'Parcours propres.', 'Rythme élevé à la fin.'],
  easier: 'Parcours plus courts.', harder: 'Remise en une touche.',
  success: 'Le groupe enchaîne sans attente.',
  layout: { discs: [[30, 15], [40, 25], [50, 15], [60, 25]], cones: [[30, 85], [45, 75], [60, 85]], start: [10, 20], home: [[10, 20], [10, 80]], ball: [13, 23], moves: [
    [13, 23, 10, 77, 'p', 'Passe'], [10, 80, 13, 26, 'p', 'Remise'],
    [10, 20, 70, 20, 'c', 'Parcours de motricité'], [10, 80, 70, 80, 'c+', 'Parcours de conduite']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: '4-3-3 : attaque contre défense', obj: 'Jouer au poste, préparer le match',
  id: 'mc-433', likes: 27, title: 'Mise en place en 4-3-3 : attaque contre défense', theme: 'Animation offensive', phase: 'ballon', type: 'Situation',
  players: [16, 16, 18], size: [64, 52], duration: 25, intensity: 3, defenders: 7,
  src: MYCOACH.src('mise en place en 4-3-3 - attaque défense', 'Johan Roubault', 'AS Aix-en-Provence'),
  goal: '8 attaquants (latéraux, milieux, attaquants) contre 7 défenseurs : déséquilibrer par la vitesse, chacun à son poste.',
  rules: [
    'Demi-terrain. Bleus : 2 latéraux, 3 milieux, 3 attaquants. Rouges : 4 défenseurs, 3 milieux + gardien.',
    'Départ de la ligne médiane, hors-jeu pour les attaquants. But = 1 point.',
    'À la récupération, les rouges marquent dans un mini-but à la médiane ; les bleus font la transition défensive.',
    'Variantes : temps limité, touches limitées, rapport de force, stop-ball à la médiane, touches et corners.'
  ],
  coach: ['Une technique de vitesse pour déséquilibrer.', 'Chacun respecte son couloir et son poste.', 'Réagir tout de suite à la perte.'],
  posture: 'Sur la touche, à hauteur des milieux : il fait répéter les circuits et arrête pour corriger.',
  expect: ['Respecter les postes.', 'Se créer une frappe.', 'Marquer.'],
  easier: 'Défense à 6.', harder: 'Attaque en moins de 15 secondes.',
  success: 'Des attaques qui ressemblent au match.',
  also: [{ moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', obj: 'Défendre en zone et relancer',
    posture: 'Derrière le but : il observe la ligne de 4.', coach: ['Défendre en zone.', 'Transition offensive vers les mini-buts.'],
    expect: ['Rester en bloc.', 'Récupérer.', 'Marquer dans un mini-but.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], minis: [[1.5, 30, 90], [1.5, 70, 90]],
    formations: n => [[30, 10], [30, 90], [34, 50], [46, 30], [46, 70], [64, 14], [68, 50], [64, 86]].slice(0, n), formationsAway: n => [[86, 20], [88, 40], [88, 60], [86, 80], [74, 32], [72, 50], [74, 68]].slice(0, n), ball: 'b3', script: [
    ['b3', 'b4', 'p', 'Circulation'], ['b1', [62, 4], 'c+', 'Le latéral monte'], ['b4', 'b1', 'p', 'Ouverture'], ['b7', [86, 44], 'c+', 'Appel'], ['b1', 'b7', 'p', 'Centre'], ['b7', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', name: 'Courses défensives', obj: 'Maîtriser les courses défensives',
  id: 'mc-courses-def', likes: 25, title: 'Courses défensives en trois ateliers', theme: 'Technique défensive', phase: 'sans', type: 'Exercice',
  players: [6, 9, 12], size: [20, 30], duration: 15, intensity: 4, params: { unit: 'joueurs' },
  src: MYCOACH.src('Courses défensives', 'Sylvain Castaignau', 'AS Bidache'),
  goal: 'Trois ateliers de 30 m : reculer, se retourner, sprinter, défendre debout.',
  rules: [
    'Atelier 1 : départ à reculons, pas chassés vers chaque cerceau ; après le 4e retournement, sprint et échelle jusqu’aux portes.',
    'Atelier 2 : l’attaquant part balle au pied ; le défenseur sprinte au plot central, se met en position et recule. Duel : l’attaquant passe entre les plots, le défenseur sort le ballon.',
    'Atelier 3 : à reculons jusqu’au cerceau, retournement, remise au coach (sol, mi-hauteur ou tête), slalom en sprint, puis duel contre un attaquant.',
    'Montrer chaque atelier avant de commencer ; rotation des ateliers.'
  ],
  coach: ['Défendre debout, sur ses appuis.', 'Retournements vifs.', 'Engagement total à chaque course.'],
  posture: 'Entre les ateliers : il pousse les défenseurs sur la vitesse et l’engagement.',
  expect: ['Courses propres.', 'Défendre debout dans le duel.', 'Récupérer le ballon.'],
  easier: 'Duel à 50 %.', harder: 'Attaquant qui part plus près.',
  success: 'Des défenseurs vifs et engagés.',
  also: [MYCOACH.physique('Vivacité défensive', 'Entre les ateliers : il impose une récupération complète.')],
  layout: { discs: [[20, 20], [30, 30], [40, 20], [50, 30]], cones: [[50, 60], [80, 55], [80, 75]], start: [8, 25], home: [[8, 25], [8, 65], [30, 72]], ball: [33, 75], moves: [
    [8, 25, 50, 25, 'c', 'Atelier 1 : à reculons, pas chassés'], [50, 25, 92, 25, 'c', 'Sprint et échelle'],
    [33, 75, 70, 66, 'd', 'Atelier 2 : l’attaquant part'], [8, 65, 50, 60, 'c+', 'Le défenseur sprinte au plot'], [50, 60, 64, 64, 'c', 'Position défensive, il recule']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'ludique', sub: 'But central', name: 'But central', obj: 'Marquer des deux côtés du but',
  id: 'mc-gardien-central', likes: 25, title: 'Match avec un gardien central', theme: 'Ludique', phase: 'ballon', type: 'Jeu',
  players: [9, 13, 13], size: [25, 25], duration: 20, intensity: 3, oddJoker: true,
  src: MYCOACH.src('Match avec un gardien central', 'Gary Lenzoni', 'Stade Nyonnais'),
  goal: 'Un but au milieu du terrain, un gardien neutre : on marque des deux côtés, le jeu ne s’arrête pas.',
  rules: [
    'Terrain de 25 × 25, un but (deux piquets) au centre, un gardien neutre.',
    'On peut marquer des deux côtés du but ; après un but, le jeu continue.',
    'Le gardien relance dans un espace vide quand il capte.',
    'Orienter le jeu pour contourner l’adversaire.'
  ],
  coach: ['Changer de côté du but pour surprendre.', 'Se mettre en position de frappe.', 'Frapper vite.'],
  posture: 'Au bord du terrain : il compte les buts.',
  expect: ['Frapper.', 'Marquer.', 'Marquer en changeant de côté.'],
  easier: 'But plus large.', harder: 'Deux touches.',
  success: 'Beaucoup de frappes.',
  also: [{ moment: 'echauffement', sub: 'Mise en route', obj: 'S’échauffer en frappant', posture: 'Au bord du terrain : il fait monter l’intensité.',
    coach: ['Démarrer à 70 %.', 'Augmenter le rythme.'], expect: ['Bouger.', 'Frapper.', 'Marquer.'] }],
  layout: { cones: [[50, 42], [50, 58]], keepersAt: [[50, 50]], formations: n => MYCOACH.grid(n, 10, 12, 40, 88), formationsAway: n => MYCOACH.grid(n, 60, 12, 90, 88), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Circulation'], ['b2', [36, 30], 'd', ''], ['b2', [50, 50], 's', 'Frappe d’un côté'], ['gb', 'r1', 'p', 'Le gardien relance dans un espace vide']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Passe et suit avec porte', obj: 'Contrôle orienté pour franchir la porte',
  id: 'mc-passe-suit-porte', likes: 24, title: 'Passe et suit avec contrôle dans la porte', theme: 'Passe', phase: 'ballon', type: 'Exercice',
  players: [6, 10, 12], size: [20, 25], duration: 20, intensity: 2, params: { unit: 'joueurs' },
  src: MYCOACH.src('Passe et suit', 'Pascal Laforge', 'US Am. Montbron'),
  goal: 'Deux départs de ballon ; les joueurs excentrés contrôlent orienté pour franchir une porte avant de passer.',
  rules: [
    'Deux colonnes de départ, deux joueurs excentrés, une porte de piquets devant chacun.',
    'Le départ sert l’excentré, puis le suit.',
    'L’excentré contrôle orienté pour passer la porte, puis passe à la colonne d’en face.',
    'Deux touches de balle.'
  ],
  coach: ['Contrôle orienté vers la porte.', 'Passe précise vers la colonne.', 'Suivre sa passe.'],
  posture: 'Au centre : il veille aux deux touches et à la qualité du contrôle.',
  expect: ['Deux touches.', 'Porte franchie sur le contrôle.', 'Rythme soutenu.'],
  easier: 'Portes plus larges.', harder: 'Une touche après la porte.',
  success: 'Le contrôle fait franchir la porte à chaque fois.',
  layout: { cones: [[40, 20], [40, 34], [60, 66], [60, 80]], start: [8, 27], home: [[8, 27], [30, 27], [92, 73], [70, 73]], ball: [11, 30], balls: [[89, 70]], moves: [
    [11, 30, 27, 28, 'p', 'Passe à l’excentré'], [8, 27, 28, 32, 'c+', 'et suit'], [30, 27, 46, 27, 'd', 'Contrôle orienté dans la porte'], [48, 29, 89, 72, 'p', 'Passe à l’autre colonne'],
    [89, 70, 73, 72, 'p', 'Même chose en face'], [70, 73, 54, 73, 'd', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', name: 'Défendre le débordement', obj: 'Défendre sans se jeter',
  id: 'mc-debordement', likes: 23, title: 'Défendre un débordement, puis finition', theme: 'Technique défensive', phase: 'sans', type: 'Situation',
  players: [5, 5, 11], size: [35, 45], duration: 20, intensity: 3, defenders: 1,
  src: MYCOACH.src('Travail défensif et de débordement avec finition', 'Jean-Paul Bouchard', 'Jacou Clapiers FA'),
  goal: 'Un ailier attaque son couloir, un défenseur l’accompagne sans se jeter ; le gagnant donne en retrait à l’attaquant central.',
  rules: [
    'Départ alterné à gauche et à droite : l’ailier s’élance dans son couloir, le défenseur part pour récupérer.',
    'Le défenseur accompagne la course et tente de récupérer sans se jeter.',
    'Le duel finit quand un des deux entre dans la surface avec le ballon, ou si le ballon sort.',
    'Celui qui a le ballon donne en retrait à l’attaquant central, qui frappe. Rotation : l’ailier devient attaquant central.'
  ],
  coach: ['Défenseur : course parallèle, épaule contre épaule.', 'Intervenir quand le ballon s’éloigne du pied.', 'Ne jamais se jeter.'],
  posture: 'À l’entrée de la surface : il juge les duels.',
  expect: ['Accompagner sans se faire passer.', 'Récupérer sans faute.', 'Gagner deux duels sur trois.'],
  easier: 'Le défenseur part plus près.', harder: 'L’ailier peut rentrer dans l’axe.',
  success: 'Le défenseur reste debout et récupère.',
  also: [{ moment: 'possede', sub: 'Zone 3 / Box · Finition', obj: 'Déborder et servir en retrait',
    posture: 'Derrière le but : il observe l’ailier et la passe en retrait.', coach: ['Accélérer après le premier contact.', 'Passe en retrait au sol.'],
    expect: ['Déborder.', 'Servir en retrait.', 'Marquer.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], discs: [[82, 12]], formations: () => [[40, 10], [60, 50], [40, 90]], formationsAway: () => [[56, 20]], ball: 'b1', script: [
    ['b1', [78, 10], 'd', 'L’ailier attaque son couloir'], ['r1', [76, 16], 'c+', 'Le défenseur accompagne sans se jeter'],
    ['b1', 'b2', 'p', 'Passe en retrait'], ['b2', 'butR', 's', 'Frappe']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
// Deux carrés de 15 × 15 côte à côte, une équipe par carré.
const EXO = {
  ...MYCOACH, moment: 'echauffement', sub: 'Mise en route', name: 'Toro aux numéros', obj: 'Passes et déplacements, chasse au numéro',
  id: 'mc-toro-numeros', likes: 22, title: 'Toro en mouvement avec numéros', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [10, 16, 16], size: [15, 30], duration: 12, intensity: 3,
  src: MYCOACH.src('Toro en mouvement avec numéros', 'Sébastien Languille', 'US Moyenne Durance'),
  goal: 'Chaque équipe conserve dans son carré ; au numéro appelé, un joueur va chasser dans le carré adverse.',
  rules: [
    'Deux carrés de 15 × 15, une équipe de 8 par carré. Chaque joueur a un numéro.',
    'Les équipes font circuler le ballon dans leur carré : 5 passes = 1 point.',
    'Le coach appelle un numéro : ce joueur (de chaque équipe) va chasser dans le carré adverse.',
    'Ballon récupéré : la conservation s’arrête pour cette équipe. On relance quand les deux sont finies. Appeler 1, 2 ou 3 numéros.'
  ],
  coach: ['Prendre l’information en permanence.', 'Tout le monde en mouvement.', 'Le chasseur part tout de suite.'],
  posture: 'Entre les deux carrés : il appelle les numéros.',
  expect: ['5 passes.', 'Garder le ballon contre deux chasseurs.', 'Garder le ballon contre trois.'],
  easier: 'Un seul chasseur.', harder: 'Trois chasseurs.',
  success: 'Des passes rapides malgré les chasseurs.',
  also: [{ moment: 'perd', sub: 'Zone 3 · Pressing', obj: 'Chasser vite et à plusieurs', posture: 'Entre les carrés : il observe les chasseurs.',
    coach: ['Presser le porteur, couper la passe facile.', 'À deux : un presse, l’autre coupe.'], expect: ['Presser tout de suite.', 'Récupérer.', 'Récupérer en moins de 5 passes.'] }],
  layout: { zones: [[0, 0, 49, 100, ''], [51, 0, 49, 100, '']], formations: n => MYCOACH.grid(n, 4, 8, 46, 92), formationsAway: n => MYCOACH.grid(n, 54, 8, 96, 92), ball: 'b1', script: [
    ['b1', 'b2', 'p', 'Conservation : 5 passes = 1 point'], ['r3', [30, 40], 'c+', 'Numéro appelé : le chasseur part'], ['b2', 'b4', 'p', '']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: '3 contre 2 en 20 secondes', obj: 'Finir une supériorité vite',
  id: 'mc-3c2', likes: 22, title: 'Attaque-défense à 3 contre 2', theme: 'Finition', phase: 'ballon', type: 'Situation',
  players: [5, 6, 12], size: [40, 50], duration: 30, intensity: 4, defenders: 2,
  src: MYCOACH.src('attaque défense', 'Loïc Izzo', 'FC Biassais'),
  goal: 'Trois attaquants contre deux défenseurs : marquer en moins de 20 secondes, ou stopper le contre.',
  rules: [
    'Trois attaquants partent du milieu de terrain avec le ballon, deux défenseurs les attendent.',
    'Attaquants : marquer en moins de 20 secondes.',
    'Défenseurs : retarder, récupérer et ressortir le ballon au-delà de la ligne de départ.',
    'On tourne les rôles ; les défenseurs passent en attaque.'
  ],
  coach: ['Attaque : écarter, fixer, donner.', 'Défense : fermer l’axe, retarder, communiquer.', 'Frapper avant les 20 secondes.'],
  posture: 'Sur le côté : il compte les 20 secondes à voix haute.',
  expect: ['Frapper.', 'Marquer en moins de 20 secondes.', 'Défenseurs : récupérer une fois sur trois.'],
  easier: '30 secondes.', harder: '12 secondes.',
  success: 'Des supériorités conclues vite.',
  also: [{ moment: 'nepossede', sub: 'Zone 1 / Box · Défendre bas', obj: 'Stopper un contre en infériorité',
    posture: 'Derrière le but : il observe les deux défenseurs.', coach: ['Reculer ensemble en fermant l’axe.', 'Le second couvre le premier.'],
    expect: ['Retarder.', 'Empêcher la frappe.', 'Récupérer.'] }],
  layout: { goals: MYCOACH.goal, keepersAt: [[95, 50]], formations: () => [[30, 50], [34, 20], [34, 80]], formationsAway: () => [[74, 38], [74, 62]], ball: 'b1', script: [
    ['b1', [52, 50], 'd', 'Le porteur fixe'], ['b2', [70, 16], 'c+', ''], ['b3', [68, 84], 'c+', ''], ['r1', [64, 44], 'c+', ''],
    ['b1', 'b2', 'p', 'Il donne'], ['b2', 'butR', 's', 'Frappe en moins de 20 secondes']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Remises des deux pieds', obj: 'Remettre en une touche, des deux pieds',
  id: 'mc-remises-main', likes: 22, title: 'Technique des deux pieds : remises', theme: 'Technique', phase: 'ballon', type: 'Exercice',
  players: [2, 2, 20], size: [5, 8], duration: 20, intensity: 1, params: { unit: 'joueurs' },
  src: MYCOACH.src('exercice technique individuelle', 'Sébastien Languille', 'US Moyenne Durance'),
  goal: 'Par deux à 5 m : l’un sert à la main, l’autre remet en une touche, pied droit puis pied gauche.',
  rules: [
    'Deux joueurs face à face à 5 m.',
    'Le serveur lance à la main ; le receveur remet en une touche à mi-hauteur, pied droit (2 min), puis pied gauche (2 min).',
    'Puis amorti du genou et remise pied droit (2 min), pied gauche (2 min).',
    'On inverse les rôles après chaque consigne.'
  ],
  coach: ['Pied d’appui bien ancré.', 'Cheville bloquée sur la remise.', 'Équilibre avant le contact.'],
  posture: 'Entre les duos : il corrige le pied d’appui.',
  expect: ['Remises dans les mains.', 'Pied faible aussi juste que le fort.', 'Amorti et remise sans faute.'],
  easier: 'Ballon lancé plus bas.', harder: 'Distance de 8 m.',
  success: 'Des remises précises des deux pieds.',
  layout: { start: [15, 50], home: [[15, 50], [85, 50]], ball: [18, 53], moves: [
    [18, 53, 82, 48, 'p', 'Lancer à la main'], [85, 50, 20, 50, 'p', 'Remise pied droit, une touche']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 1 · Construire le jeu', name: 'Combiné sur les côtés', obj: 'Libérer le couloir pour le latéral',
  id: 'mc-combine-cotes', likes: 22, title: 'Jeu combiné sur les côtés', theme: 'Animation offensive', phase: 'ballon', type: 'Exercice',
  players: [6, 9, 18], size: [50, 64], duration: 20, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('Exercice : Jeu combiné sur les côtés', 'Thomas Jouan', 'FC Le Relecq-Kerhuon'),
  goal: 'Triangle des centraux et du milieu axial, puis l’excentré rentre pour libérer le couloir au latéral qui dédouble.',
  rules: [
    'Postes : deux centraux, un milieu axial, un excentré, un latéral, un attaquant + gardien.',
    'Circuit gauche : triangle centraux-milieu, qui trouve l’excentré ; prise de balle vers l’intérieur, passe au latéral qui dédouble.',
    'Circuit droit : l’excentré joue en deux touches avec le milieu, qui redemande et rentre ; le couloir est libre pour le latéral.',
    'Finition devant le but. Changer de côté à la moitié du temps.'
  ],
  coach: ['Orientation du corps sur chaque prise de balle.', 'Courses coordonnées, dans le bon tempo.', 'Enchaîner vite.'],
  posture: 'Sur la touche, au niveau du milieu : il fait répéter les circuits.',
  expect: ['Circuit sans arrêt.', 'Latéral lancé dans le couloir.', 'Finition.'],
  easier: 'Passe et suit à vide.', harder: 'Un défenseur sur l’excentré.',
  success: 'Le latéral reçoit lancé à chaque passage.',
  layout: { goals: MYCOACH.goal, keepers: [[94, 50], [6, 50]], start: [16, 36], home: [[16, 36], [16, 64], [32, 50], [52, 14], [30, 8], [72, 50]], ball: [19, 39], moves: [
    [19, 39, 16, 60, 'p', 'Triangle des centraux'], [16, 64, 30, 48, 'p', ''], [32, 50, 50, 18, 'p', 'Le milieu trouve l’excentré'],
    [52, 14, 58, 26, 'd', 'Prise de balle vers l’intérieur'], [30, 8, 74, 6, 'c+', 'Le latéral dédouble'], [60, 28, 74, 8, 'p', 'Passe au latéral'],
    [72, 50, 88, 44, 'c+', 'Appel de l’attaquant'], [74, 8, 88, 44, 'p', 'Centre'], [88, 44, 98, 48, 's', 'Finition']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
// Rond central : trois équipes de 4 autour, une équipe toro au milieu.
const EXO = {
  ...MYCOACH, moment: 'echauffement', sub: 'Mise en route', name: 'Toro à quatre équipes', obj: 'Se mettre en train en conservant',
  id: 'mc-toro-multi', likes: 22, title: 'Toro multi-équipes', theme: 'Conservation', phase: 'ballon', type: 'Jeu',
  players: [12, 16, 16], size: [18, 18], duration: 20, intensity: 2, defenders: f => Math.round(f / 4),
  src: MYCOACH.src('Toro multi-équipe', 'Elyes Atallah', 'Issy-les-Moulineaux FC'),
  goal: 'Quatre équipes de 4 : trois conservent autour du rond, la quatrième chasse au milieu. Qui perd le ballon devient toro.',
  rules: [
    'Séquence 1 : 3 touches, 10 passes = un tour de plus pour l’équipe toro ; l’équipe qui perd le ballon devient toro.',
    'Séquence 2 : 2 touches. Séquence 3 : une passe dans un intervalle = un tour de plus.',
    'Séquence 4 : après sa passe, obligation de se déplacer ; sinon, son équipe devient toro.',
    'Un toro ne défend qu’après avoir ramassé sa chasuble (le comptage continue).'
  ],
  coach: ['Dynamique sur ses appuis pour bien s’orienter.', 'Voir avant de recevoir pour aérer le jeu.', 'Toros : collaborer et communiquer.'],
  posture: 'Au bord du rond : il compte les passes et annonce les changements de toro.',
  expect: ['10 passes.', 'Passes dans les intervalles.', 'Ne jamais devenir toro.'],
  easier: '4 touches.', harder: 'Une touche.',
  success: 'Le ballon circule, les toros changent souvent.',
  layout: { thirdTeam: true, formations: n => { const k = n - Math.floor(n / 2); return [...Array.from({ length: n }, (_, i) => { const a = (i / n) * 2 * Math.PI; return [Math.round(50 + 44 * Math.cos(a)), Math.round(50 + 44 * Math.sin(a))]; })]; },
    formationsAway: n => MYCOACH.grid(n, 38, 38, 62, 62), ball: 'b1', script: [
    ['b1', 'b3', 'p', 'Conservation autour du rond'], ['r1', [64, 40], 'c+', 'Les toros chassent'], ['b3', 'b8', 'p', 'Passe dans l’intervalle']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', keepers: 1, moment: 'possede', sub: 'Zone 3 / Box · Finition', name: 'Donner puis recevoir', obj: 'Lancer le côté puis finir son centre',
  id: 'mc-donner-recevoir', likes: 22, title: 'Centre et reprise : donner puis recevoir', theme: 'Finition', phase: 'ballon', type: 'Exercice',
  players: [3, 6, 10], size: [45, 50], duration: 15, intensity: 2, params: { unit: 'postes' },
  src: MYCOACH.src('EXERCICE ADAPTATIF / CENTRE - REPRISE DE VOLEE', 'Maxime Gaillac', 'JS Bassin Aveyron'),
  goal: 'Le 1 lance le 2 dans le couloir et continue sa course dans la surface ; le 3 attaque le premier poteau sur le centre.',
  rules: [
    'Le 1 lance le 2 dans le couloir, puis file vers la zone de finition.',
    'Le 3 fait son appel au premier poteau au moment du centre.',
    'Le 2 centre, voit avant de centrer ; reprise du 1 ou du 3.',
    'Rotation 1 → 2 → 3 → 1. Alterner gauche et droite. Variantes : une touche, un défenseur dans la surface.'
  ],
  coach: ['Passe du 1 dans la course.', 'Voir avant de centrer.', 'Reprendre vers le sol.'],
  posture: 'À l’entrée de la surface : il valorise les réussites.',
  expect: ['Centre exploitable.', 'Reprise cadrée.', 'But en une touche.'],
  easier: 'Centre à la main.', harder: 'Un défenseur dans la surface.',
  success: 'Deux joueurs à la réception de chaque centre.',
  layout: { goals: MYCOACH.goal, keepers: MYCOACH.keeper, start: [40, 40], home: [[40, 40], [46, 10], [64, 56]], ball: [43, 43], moves: [
    [43, 43, 76, 10, 'p', 'Le 1 lance le 2'], [46, 10, 76, 10, 'c+', ''], [40, 40, 84, 54, 'c+', 'Le 1 file dans la surface'],
    [64, 56, 88, 42, 'c', 'Appel au premier poteau'], [78, 12, 88, 42, 'p', 'Centre'], [88, 42, 98, 46, 's', 'Reprise']
  ] }
};

return EXO;
})());
EXOS.push((() => {

// famille: mycoach
const EXO = {
  ...MYCOACH, template: 'circuit', moment: 'echauffement', sub: 'Mise en route', name: 'Remises dans le rond central', obj: 'Mise en train technique par deux',
  id: 'mc-rond-central', likes: 21, title: 'Échauffement technique dans le rond central', theme: 'Technique', phase: 'ballon', type: 'Exercice',
  players: [8, 18, 20], size: [9, 9], duration: 18, intensity: 1, params: { unit: 'joueurs' },
  src: MYCOACH.src('Echauffement technique', 'Grégory Joly', 'US Colomiers'),
  goal: 'Par deux autour du rond central : échanges statiques, puis les joueurs intérieurs tournent et remettent à chaque appui.',
  rules: [
    'Statique, face à face : pied droit sans contrôle, pied gauche sans contrôle, puis contrôle d’un pied et passe de l’autre.',
    'Dynamique : les extérieurs ne bougent pas ; les intérieurs tournent et remettent à chaque extérieur.',
    'Remise pied droit, puis pied gauche en changeant de sens ; ballon donné à la main, remise intérieur ; contrôle poitrine et remise.',
    'On écarte les extérieurs de 4 m, puis remises de la tête.'
  ],
  coach: ['Respecter le sens de rotation.', 'Justesse de la passe et de la remise.', 'Rester sur l’avant des pieds.'],
  posture: 'Au centre du rond : il annonce les consignes.',
  expect: ['Remises justes.', 'Pied faible juste aussi.', 'Contrôle poitrine et remise.'],
  easier: 'Rester en statique.', harder: 'Remises de la tête.',
  success: 'Tous les joueurs ont beaucoup touché le ballon.',
  layout: { start: [50, 30], home: [[50, 4], [96, 50], [50, 96], [4, 50], [50, 30], [70, 50], [50, 70], [30, 50]], ball: [53, 7], balls: [[93, 53], [53, 93], [7, 53]], moves: [
    [53, 7, 50, 27, 'p', 'L’extérieur sert'], [50, 30, 52, 8, 'p', 'Remise'], [50, 30, 68, 34, 'c', 'Il tourne vers l’appui suivant'],
    [93, 53, 72, 50, 'p', ''], [70, 50, 92, 52, 'p', 'Remise']
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
  ludique: { label: 'Ludique', band: '#214fa0', accent: '#214fa0', subs: [] },
  echauffement: { label: 'Échauffement', band: '#0e8a7e', accent: '#0e8a7e', subs: [] },
  physique: { label: 'Physique', band: '#6b3fa0', accent: '#6b3fa0', subs: [] }
};
const FICHE_LEVELS = { decouverte: 'Découverte', dev: 'En développement', confirme: 'Confirmé' };
const FICHE_CATEGORIES = ['U11', 'U13', 'U15', 'U17', 'U19', 'Seniors'];

// onBack : dans le fichier qui regroupe toutes les fiches, bouton de retour au rangement.
function renderFiche(e, onBack) {
  const mo = FICHE_MOMENTS[e.moment];
  const sim = { category: e.refCategory || 'Seniors', players: e.players[1], keepers: e.keepers || 0, level: 'dev', moment: 'libre', space: [68, 105] };
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
    const plan = adapt(e, { ...sim, players: Math.max(2, sim.players) }), model = buildExerciseModel(plan), series = seriesOf(e, e.duration, plan.band, plan), cad = cadenceOf(plan);
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
        h('p', { class: 'f-var' }, h('b', {}, '− '), e.easier), h('p', { class: 'f-var' }, h('b', {}, '+ '), e.harder),
        cad ? h('p', { class: 'f-mat' }, h('b', {}, 'Physique : '), cad.phys) : null]]
    };
    tabs.replaceChildren(...Object.entries(PANELS).map(([k, [label]]) => h('button', { type: 'button', role: 'tab', class: 'xs-tab' + (tab === k ? ' on' : ''), 'aria-selected': String(tab === k), onclick: () => { tab = k; paint(); } }, label)));
    panel.replaceChildren(...PANELS[tab][1]().filter(Boolean));
  }
  paint();

  document.title = e.game + ' · ' + (e.name || e.sub);
  const family = (e.family || []).filter(r => r !== (e.name || e.sub));
  const card = h('article', { class: 'f-card' },
    h('header', { class: 'f-top' }, onBack ? h('button', { type: 'button', class: 'f-back', onclick: onBack, 'aria-label': 'Retour aux exos' }, '←') : null, h('img', { src: LOGO, alt: '' }),
      h('div', {}, h('small', {}, mo.label), h('b', {}, e.sub)), h('span', { class: 'f-num' }, e.game)),
    h('div', { class: 'xs' },
      h('h1', { class: 'f-title' }, e.title), e.obj ? h('p', { class: 'f-obj' }, h('b', {}, 'Obj : '), e.obj) : null, info, simRow,
      h('div', { class: 'xs-main' }, h('div', { class: 'xs-left' }, pic), h('div', { class: 'xs-right' }, tabs, panel)),
      h('footer', { class: 'xs-foot' },
        h('span', { class: 'xs-src' }, e.src ? 'Source : ' + e.src.label + (e.likes ? ' · ♥ ' + e.likes + ' likes' : '') : 'Fiche originale du Vestiaire'),
        family.length ? h('span', { class: 'xs-src' }, 'Autres variantes du ' + e.game + ' : ' + (family.length > 5 ? family.length + ' fiches dans Exos foot' : family.join(' · '))) : null)));
  card.style.setProperty('--theme', mo.accent); card.style.setProperty('--band', mo.band);
  return card;
}

// Toutes les fiches dans un seul fichier : rangement thème › jeu › variante, puis la fiche choisie.
function renderBundle(list) {
  const show = () => {
    const i = Number(location.hash.slice(1));
    if (location.hash && list[i]) { document.body.replaceChildren(renderFiche(list[i], () => history.back())); return; }
    const allGames = [...new Set(list.map(e => e.game))], name = typeof BUNDLE_LABEL !== 'undefined' && BUNDLE_LABEL ? 'Exos foot · ' + BUNDLE_LABEL : allGames.length === 1 ? 'Exos foot · ' + allGames[0] : 'Exos foot';
    document.title = name;
    const themes = Object.entries(FICHE_MOMENTS).map(([key, mo]) => {
      const mine = list.map((e, i) => ({ e, i })).filter(({ e }) => e.moment === key).sort((a, b) => (b.e.likes || 0) - (a.e.likes || 0) || a.e.sub.localeCompare(b.e.sub, 'fr')); // les plus appréciées d'abord
      if (!mine.length) return null;
      const games = [...new Set(mine.map(({ e }) => e.game))];
      const sec = h('section', { class: 'b-theme' }, h('h2', {}, mo.label),
        games.map(g => h('div', { class: 'b-game' }, h('h3', {}, g),
          h('div', { class: 'b-list' }, mine.filter(({ e }) => e.game === g).map(({ e, i }) =>
            h('a', { href: '#' + i }, h('b', {}, e.sub), h('span', {}, (e.name ? e.name + ' · ' : '') + (e.obj || e.title) + (e.likes ? ' · ♥ ' + e.likes : ''))))))));
      sec.style.setProperty('--band', mo.band); sec.style.setProperty('--theme', mo.accent);
      return sec;
    });
    document.body.replaceChildren(h('main', { class: 'b-home' }, h('header', { class: 'b-head' }, h('img', { src: LOGO, alt: '' }), h('h1', {}, name)), ...themes.filter(Boolean)));
    scrollTo(0, 0);
  };
  addEventListener('hashchange', show);
  show();
}
// Une fiche peut servir plusieurs thèmes (also) : même jeu, autre posture et autres observations du coach.
const viewsOf = e => [e, ...(e.also || []).map(a => ({ ...e, ...a, also: null }))];

return {exercises:EXOS,viewsOf,adapt,buildExerciseModel,createBoard,renderFiche,materialOf,seriesOf,moments:FICHE_MOMENTS};
})();
