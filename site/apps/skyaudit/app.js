/* app.js — the SkyAudit client: one real day of helicopter traffic,
   replayed, with a mathematically certified verdict on every flight.
   apps/skyaudit · cert-machine
   Globals: maplibregl, deck, pmtiles (vendored UMD; VENDOR-PINS.json).
   Basemap: pinned PMTiles from the repo raw URL; if that fetch fails the
   client falls back to OpenFreeMap's keyless dark style (stated in the
   attribution) — the certificates never depend on the basemap.           */
'use strict';
(() => {
const CFG = window.SKYAUDIT;
const $ = (id) => document.getElementById(id);

/* ---- token-sourced colors (no literals: read the CSS custom props) ---- */
function cssRgb(name) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const n = parseInt(v.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
let COL = {};
function loadColors() {
  COL = { C: cssRgb('--v-cert'), R: cssRgb('--v-refu'), F: cssRgb('--v-refd'),
    sig: cssRgb('--sig'), ink: cssRgb('--ink'), dim: cssRgb('--v-refd') };
}
loadColors();
const lerp = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
function altColor(alt) {
  const t = Math.max(0, Math.min(1, alt / 3000));
  return t < 0.5 ? lerp(COL.dim, COL.sig, t * 2) : lerp(COL.sig, COL.ink, (t - 0.5) * 2);
}

/* ---------------------------- state ---------------------------- */
const S = { t: 0, speed: 60, playing: true, key: 'beta-alia|faa-sfar-vfr',
  mode: 'v', sel: null, follow: false, trail: 240, bundle: null };
const NAMES = { 'joby-s4': 'Joby S4', 'archer-midnight': 'Archer Midnight',
  'beta-alia': 'Beta ALIA', 'eve-100': 'Eve EVE-100' };
const RULES = { 'faa-sfar-vfr': 'FAA 20-min', 'easa-final-reserve': 'EASA 5-min' };
const VNAME = { C: 'CERTIFIED', R: 'REFUTED', F: 'REFUSED' };
const VEXPL = {
  C: 'Every point of the stated parameter boxes lands at or above the reserve floor — a mathematically certified enclosure, not a simulation.',
  R: 'EVERY point of the boxes violates the reserve floor; the most favorable corner is re-proved failing in exact rational arithmetic.',
  F: 'The boxes straddle the floor — some points pass, some fail. With assumption-grade public specs this measures what the manufacturer has not published.' };

const qs = new URLSearchParams(location.search);
if (qs.get('k')) S.key = qs.get('k');
if (qs.get('m')) S.mode = qs.get('m');
if (qs.get('s')) S.speed = +qs.get('s') || 60;

/* ---------------------------- map (with basemap fallback) ------- */
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);
const OFM_DARK = 'https://tiles.openfreemap.org/styles/fiord';

async function pickStyle() {
  try {
    const r = await fetch(CFG.tiles, { headers: { Range: 'bytes=0-127' } });
    if (r.ok || r.status === 206) return CFG.style;
  } catch (e) { /* fall through */ }
  console.warn('skyaudit: pinned tiles unreachable — falling back to OpenFreeMap');
  return OFM_DARK;
}

let map;
pickStyle().then((styleUrl) => {
  map = new maplibregl.Map({
    container: 'map', style: styleUrl, center: [-73.995, 40.72], zoom: 11.4,
    pitch: 52, bearing: -14, minZoom: 8.2, maxZoom: 16.8,
    maxBounds: [[-74.75, 40.25], [-73.25, 41.15]], attributionControl: { compact: true },
  });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-left');
  map.on('load', addBuildings);
  map.addControl(overlay);
  map.on('click', onMapClick);
});

function addBuildings() {
  const surface = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
  const sources = map.getStyle().sources;
  const tries = [
    { src: 'protomaps', layer: 'buildings', h: 'height', b: 'min_height' },
    { src: Object.keys(sources).find((k) => sources[k].type === 'vector'), layer: 'building', h: 'render_height', b: 'render_min_height' },
  ];
  for (const t of tries) {
    if (!t.src || !sources[t.src]) continue;
    try {
      map.addLayer({ id: 'sk-buildings', type: 'fill-extrusion', source: t.src,
        'source-layer': t.layer, minzoom: 12,
        paint: { 'fill-extrusion-color': surface, 'fill-extrusion-opacity': 0.55,
          'fill-extrusion-height': ['coalesce', ['get', t.h], 10],
          'fill-extrusion-base': ['coalesce', ['get', t.b], 0] } });
      return;
    } catch (e) { /* try next schema */ }
  }
}

/* ---------------------------- data ---------------------------- */
fetch(CFG.bundle).then((r) => r.json()).then((b) => {
  S.bundle = b;
  const tDefault = Math.max(0, Math.min(b.span, (Math.floor(b.t0 / 86400) * 86400 + 14 * 3600) - b.t0));
  S.t = qs.get('t') !== null ? Math.max(0, Math.min(b.span, +qs.get('t'))) : tDefault;
  if (qs.get('f')) S.sel = b.flights.find((f) => f.id === qs.get('f')) || null;
  $('scrub').max = String(Math.ceil(b.span));
  syncDock(); buildMatrix(); renderCounts(); renderPanel();
  tick0 = performance.now();
  requestAnimationFrame(frame);
});

function posAt(track, t) {
  if (t < track[0][0] || t > track[track.length - 1][0]) return null;
  let lo = 0, hi = track.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; (track[m][0] <= t ? lo = m : hi = m); }
  const a = track[lo], b2 = track[hi], u = (t - a[0]) / Math.max(1e-9, b2[0] - a[0]);
  return { lon: a[2] + (b2[2] - a[2]) * u, lat: a[1] + (b2[1] - a[1]) * u,
    alt: a[3] + (b2[3] - a[3]) * u };
}

/* ---------------------------- deck ---------------------------- */
const overlay = new deck.MapboxOverlay({ interleaved: false, layers: [] });

function layers() {
  const b = S.bundle; if (!b) return [];
  const heads = [];
  for (const f of b.flights) {
    const p = posAt(f.track, S.t);
    if (p) heads.push({ f, p });
  }
  const L = [
    new deck.TripsLayer({ id: 'trips', data: b.flights,
      getPath: (f) => f.track.map((e) => [e[2], e[1]]),
      getTimestamps: (f) => f.track.map((e) => e[0]),
      currentTime: S.t, trailLength: S.trail, fadeTrail: true,
      capRounded: true, jointRounded: true, widthMinPixels: 2.4,
      getColor: (f) => (S.mode === 'a'
        ? f.track.map((e) => altColor(e[3]))
        : COL[f.verdicts[S.key]] || COL.F),
      opacity: 0.9, pickable: true,
      updateTriggers: { getColor: [S.key, S.mode] } }),
    new deck.ScatterplotLayer({ id: 'heads', data: heads,
      getPosition: (d) => [d.p.lon, d.p.lat],
      getFillColor: (d) => (S.mode === 'a' ? altColor(d.p.alt) : COL[d.f.verdicts[S.key]] || COL.F),
      radiusMinPixels: 4, radiusMaxPixels: 7, pickable: true,
      updateTriggers: { getFillColor: [S.key, S.mode] } }),
  ];
  if (S.sel) {
    L.push(new deck.PathLayer({ id: 'selpath', data: [S.sel],
      getPath: (f) => f.track.map((e) => [e[2], e[1]]),
      getColor: [...COL.sig, 210], widthMinPixels: 1.4 }));
    const p = posAt(S.sel.track, S.t);
    if (p) L.push(new deck.ScatterplotLayer({ id: 'selhead', data: [p],
      getPosition: (d) => [d.lon, d.lat], radiusMinPixels: 9,
      stroked: true, filled: false, getLineColor: [...COL.sig, 255], lineWidthMinPixels: 2.5 }));
  }
  return L;
}
function onMapClick(e) {
  const pick = overlay.pickObject && overlay.pickObject({ x: e.point.x, y: e.point.y, radius: 6 });
  if (pick && pick.object) { S.sel = pick.object.f || pick.object; renderPanel(); pushUrl(); }
}

/* ---------------------------- loop ---------------------------- */
let tick0 = performance.now(), lastFollow = 0, lastUrl = 0;
function frame(now) {
  const dt = (now - tick0) / 1000; tick0 = now;
  if (S.playing && S.bundle) {
    S.t += dt * S.speed;
    if (S.t > S.bundle.span) S.t = 0;
  }
  if (S.bundle && map) {
    overlay.setProps({ layers: layers() });
    $('scrub').value = String(S.t);
    $('clock').textContent = clockText();
    if (S.follow && S.sel && now - lastFollow > 700) {
      const p = posAt(S.sel.track, S.t);
      if (p) { map.easeTo({ center: [p.lon, p.lat], duration: 650 }); lastFollow = now; }
    }
    if (now - lastUrl > 800) { pushUrl(); lastUrl = now; }
  }
  requestAnimationFrame(frame);
}
function clockText() {
  return new Date((S.bundle.t0 + S.t) * 1000)
    .toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false }) + ' ET';
}
function pushUrl() {
  const u = new URLSearchParams({ t: S.t.toFixed(0), s: String(S.speed), k: S.key, m: S.mode });
  if (S.sel) u.set('f', S.sel.id);
  if (qs.get('theme')) u.set('theme', qs.get('theme'));
  history.replaceState(null, '', '?' + u.toString());
}

/* ---------------------------- dock ---------------------------- */
function segSync(host, val) {
  for (const b of host.querySelectorAll('button')) b.dataset.on = b.dataset.v === String(val) ? '1' : '0';
}
function syncDock() {
  segSync($('speed'), S.speed); segSync($('mode'), S.mode);
  $('play').textContent = S.playing ? '❚❚' : '▶';
}
$('play').onclick = () => { S.playing = !S.playing; $('play').textContent = S.playing ? '❚❚' : '▶'; };
$('scrub').oninput = (e) => { S.t = +e.target.value; };
$('speed').onclick = (e) => { if (e.target.dataset.v) { S.speed = +e.target.dataset.v; segSync($('speed'), S.speed); } };
$('mode').onclick = (e) => { if (e.target.dataset.v) { S.mode = e.target.dataset.v; segSync($('mode'), S.mode); renderCounts(); } };
new MutationObserver(loadColors).observe(document.documentElement, { attributes: true });

/* ---------------------------- panel components ------------------ */
function dotHtml(v) {
  const c = { C: '--v-cert', R: '--v-refu', F: '--v-refd' }[v];
  return `<span class="as-dot" style="background:var(${c})"></span>`;
}
function matrixHtml(selKey, withDots) {
  const b = S.bundle;
  return b.specs.map((sp) => `<span class="name">${NAMES[sp]}</span>` + b.rules.map((r) => {
    const k = sp + '|' + r;
    const dot = withDots && S.sel ? dotHtml(S.sel.verdicts[k]) : '';
    return `<button class="as-cell" data-k="${k}" data-on="${k === selKey ? 1 : 0}">${dot}${RULES[r]}</button>`;
  }).join('')).join('');
}
function buildMatrix() {
  $('keys').innerHTML = matrixHtml(S.key, false);
  $('keys').onclick = (e) => {
    const k = e.target.closest && e.target.closest('.as-cell');
    if (k) selKey(k.dataset.k);
  };
}
function selKey(k) { S.key = k; buildMatrix(); renderCounts(); renderPanel(); }

function renderCounts() {
  const b = S.bundle; if (!b) return;
  const n = { C: 0, R: 0, F: 0 };
  for (const f of b.flights) n[f.verdicts[S.key]]++;
  $('counts').innerHTML =
    `<div class="as-stat c"><b>${n.C}</b><span>certified</span></div>` +
    `<div class="as-stat r"><b>${n.R}</b><span>refuted</span></div>` +
    `<div class="as-stat f"><b>${n.F}</b><span>refused</span></div>`;
}

function encHtml(enc) {
  const dLo = enc.e[0] + enc.r[0], dHi = enc.e[1] + enc.r[1];
  const max = Math.max(enc.u[1], dHi) * 1.05;
  const seg = (a, b2, cls) =>
    `<div class="band ${cls}" style="left:${(a / max * 100).toFixed(1)}%;width:${Math.max(0.8, (b2 - a) / max * 100).toFixed(1)}%"></div>`;
  return `<div class="as-enc">
    <div class="as-encrow"><span class="lbl">usable</span><div class="track">${seg(enc.u[0], enc.u[1], 'u')}</div></div>
    <div class="as-encrow"><span class="lbl">demanded</span><div class="track">${seg(dLo, dHi, 'd')}</div></div>
    <div class="as-encscale"><span></span><div><span>0</span><span>${Math.round(max)} kWh</span></div></div>
  </div>
  <div class="as-encvals">usable ${enc.u[0]}–${enc.u[1]} kWh · demanded incl. reserve ${dLo.toFixed(1)}–${dHi.toFixed(1)} kWh</div>`;
}

function renderPanel() {
  const b = S.bundle, host = $('flight'); if (!b) return;
  if (!S.sel) {
    host.innerHTML = `<div class="as-fine">Click any aircraft — trail or dot — for its certificate.
    Trail colors are VERDICTS under the selected aircraft + rule, never telemetry.</div>`;
    return;
  }
  const f = S.sel, v = f.verdicts[S.key], enc = f.enc[S.key];
  const cov = f.trunc[0] || f.trunc[1]
    ? 'truncated at ' + (f.trunc[0] ? 'start' : '') + (f.trunc[0] && f.trunc[1] ? ' + ' : '') + (f.trunc[1] ? 'end' : '')
    : 'ground-to-ground';
  host.innerHTML = `
  <div class="as-kv">
    <span>aircraft</span><b>${f.reg || f.icao} · ${f.type}</b>
    <span>flight</span><b>${f.km.toFixed(1)} km · ${Math.round(f.dur / 60)} min · max ${f.alt} ft</b>
    <span>coverage</span><b>${cov}</b>
  </div>
  <div class="as-verdict ${v}">
    <div class="w">${VNAME[v]} — ${NAMES[S.key.split('|')[0]]} · ${RULES[S.key.split('|')[1]]}</div>
    <div class="e">${VEXPL[v]}</div>
  </div>
  ${encHtml(enc)}
  ${v === 'R' && enc.wit ? `<div class="as-encvals">exact witness margin (rational): ${enc.wit}</div>` : ''}
  ${typeof enc.m === 'number' ? `<div class="as-encvals">interval margin: ${enc.m} kWh</div>`
    : `<div class="as-encvals">margins — worst ${enc.m.w} / best ${enc.m.b} kWh</div>`}
  <div class="as-h" style="margin-top:14px">All eight verdicts</div>
  <div class="as-mx" id="mini-mx">${matrixHtml(S.key, true)}</div>
  <div style="display:flex;gap:8px;margin-top:14px">
    <button class="as-btn" id="followBtn" data-on="${S.follow ? 1 : 0}">FOLLOW</button>
    <button class="as-btn" id="deselBtn">DESELECT</button>
  </div>`;
  $('mini-mx').onclick = (e) => {
    const k = e.target.closest && e.target.closest('.as-cell');
    if (k) selKey(k.dataset.k);
  };
  $('followBtn').onclick = () => { S.follow = !S.follow; $('followBtn').dataset.on = S.follow ? '1' : '0'; };
  $('deselBtn').onclick = () => { S.sel = null; S.follow = false; renderPanel(); pushUrl(); };
}
})();
