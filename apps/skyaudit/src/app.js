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
/* product labels on the surface; the rigorous terms live in the
   certificate detail layer, one click down */
const VNAME = { C: 'E-FLYABLE', R: 'BEYOND RANGE', F: 'NEEDS DATA' };
const TRUST = { C: 'CERTIFIED', R: 'REFUTED', F: 'REFUSED' };
const VEXPL = {
  C: 'This flight is provably within the aircraft\'s electric envelope — with reserve energy to spare, under every value of its published numbers.',
  R: 'This flight provably exceeds what the aircraft\'s public numbers allow — even under the most favorable reading, the battery comes up short.',
  F: 'The public numbers are too incomplete to decide this flight — the manufacturer hasn\'t published enough to prove it either way.' };

S.tab = 'day'; S.lpMin = false; S.plan = null;
const qs = new URLSearchParams(location.search);
if (qs.get('k')) S.key = qs.get('k');
if (qs.get('m')) S.mode = qs.get('m');
if (qs.get('s')) S.speed = +qs.get('s') || 60;
if (qs.get('tab')) S.tab = qs.get('tab');
if (qs.get('pf') && qs.get('pt')) S.plan = [qs.get('pf'), qs.get('pt')];

/* aircraft chevron icon (mask -> tintable by verdict color) */
const CHEV_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><path d="M32 6 L52 54 L32 42 L12 54 Z" fill="white"/></svg>';
const CHEV_URL = 'data:image/svg+xml;base64,' + btoa(CHEV_SVG);
const CHEV_MAP = { chev: { x: 0, y: 0, width: 64, height: 64, mask: true } };

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
  syncDock(); buildMatrix(); renderCounts(); renderPanel(); dzRender();
  setTab(S.tab);
  if (S.plan && $('pl-from')) { $('pl-from').value = S.plan[0]; $('pl-to').value = S.plan[1]; renderPlan(); }
  tick0 = performance.now();
  requestAnimationFrame(frame);
});

/* ambient decor layer: all other traffic, dim, non-pickable */
let AMBIENT = null;
if (CFG.ambient) {
  fetch(CFG.ambient).then((r) => (r.ok ? r.json() : null))
    .then((a) => { AMBIENT = a; }).catch(() => {});
}

function posAt(track, t) {
  if (t < track[0][0] || t > track[track.length - 1][0]) return null;
  let lo = 0, hi = track.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; (track[m][0] <= t ? lo = m : hi = m); }
  const a = track[lo], b2 = track[hi], u = (t - a[0]) / Math.max(1e-9, b2[0] - a[0]);
  const brg = Math.atan2((b2[2] - a[2]) * Math.cos(a[1] * Math.PI / 180), b2[1] - a[1]) * 180 / Math.PI;
  return { lon: a[2] + (b2[2] - a[2]) * u, lat: a[1] + (b2[1] - a[1]) * u,
    alt: a[3] + (b2[3] - a[3]) * u, brg };
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
  const L = [];
  if (AMBIENT) {
    L.push(new deck.TripsLayer({ id: 'ambient', data: AMBIENT.tracks,
      getPath: (tr) => tr.map((e) => [e[2], e[1]]),
      getTimestamps: (tr) => tr.map((e) => e[0]),
      currentTime: S.t, trailLength: 150, fadeTrail: true,
      widthMinPixels: 1, getColor: [...COL.dim, 70], opacity: 0.5, pickable: false }));
  }
  L.push(
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
    new deck.IconLayer({ id: 'heads', data: heads,
      iconAtlas: CHEV_URL, iconMapping: CHEV_MAP, getIcon: () => 'chev',
      getPosition: (d) => [d.p.lon, d.p.lat],
      getAngle: (d) => -d.p.brg,
      getColor: (d) => (S.mode === 'a' ? altColor(d.p.alt) : COL[d.f.verdicts[S.key]] || COL.F),
      getSize: 15, sizeMinPixels: 11, sizeMaxPixels: 20, pickable: true,
      updateTriggers: { getColor: [S.key, S.mode] } }),
  );
  /* heliport nodes + the planned route */
  const PL = CFG.planner;
  if (PL) {
    const hp = Object.entries(PL.heliports).map(([id, h]) => ({ id, ...h }));
    L.push(new deck.ScatterplotLayer({ id: 'heliports', data: hp,
      getPosition: (d) => [d.lon, d.lat], radiusMinPixels: 4, radiusMaxPixels: 6,
      stroked: true, filled: true, getFillColor: [...COL.sig, 60],
      getLineColor: [...COL.sig, 220], lineWidthMinPixels: 1.5, pickable: false }));
    L.push(new deck.TextLayer({ id: 'heliport-lbl', data: hp,
      getPosition: (d) => [d.lon, d.lat], getText: (d) => d.id,
      getSize: 11, getColor: [...COL.sig, 235], getPixelOffset: [0, -14],
      fontFamily: 'IBM Plex Mono, monospace', characterSet: 'auto', pickable: false }));
    const route = planRoute();
    if (route) {
      L.push(new deck.PathLayer({ id: 'plan-route', data: [route],
        getPath: (r) => r.coords, getColor: [...COL.sig, 235],
        widthMinPixels: 3.5, capRounded: true, jointRounded: true }));
    }
  }
  if (S.sel) {
    L.push(new deck.PathLayer({ id: 'selpath', data: [S.sel],
      getPath: (f) => f.track.map((e) => [e[2], e[1]]),
      getColor: [...COL.sig, 210], widthMinPixels: 1.4 }));
    const p = posAt(S.sel.track, S.t);
    if (p) L.push(new deck.ScatterplotLayer({ id: 'selhead', data: [p],
      getPosition: (d) => [d.lon, d.lat], radiusMinPixels: 9,
      stroked: true, filled: false, getLineColor: [...COL.sig, 255], lineWidthMinPixels: 2.5 }));
    const ex = exhaustInfo(S.sel, S.key);
    if (ex) L.push(new deck.ScatterplotLayer({ id: 'exhaust', data: [ex],
      getPosition: (d) => [d.lon, d.lat], radiusMinPixels: 6, radiusMaxPixels: 8,
      stroked: true, filled: true, getFillColor: [...COL.R, 230],
      getLineColor: [255, 255, 255, 200], lineWidthMinPixels: 1.5,
      updateTriggers: { getPosition: [S.key] } }));
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
    altCursor();
  }
  requestAnimationFrame(frame);
}
function clockText() {
  return new Date((S.bundle.t0 + S.t) * 1000)
    .toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false }) + ' ET';
}
function pushUrl() {
  const u = new URLSearchParams({ t: S.t.toFixed(0), s: String(S.speed), k: S.key, m: S.mode, tab: S.tab });
  if (S.sel) u.set('f', S.sel.id);
  if (S.plan) { u.set('pf', S.plan[0]); u.set('pt', S.plan[1]); }
  if (qs.get('theme')) u.set('theme', qs.get('theme'));
  history.replaceState(null, '', '?' + u.toString());
}

/* ---------------------------- tabs + left panel ------------------ */
function setTab(t) {
  S.tab = t;
  for (const b of $('tabs').querySelectorAll('button')) b.dataset.on = b.dataset.tab === t ? '1' : '0';
  for (const d of document.querySelectorAll('.as-tabbody')) d.classList.toggle('on', d.dataset.body === t);
  pushUrl();
}
$('tabs').onclick = (e) => {
  if (e.target.dataset.tab) {
    setTab(e.target.dataset.tab);
    if (e.target.dataset.tab === 'plan' && !S.plan) renderPlan();   /* open with a live example */
  }
};
$('lp-min').onclick = () => { S.lpMin = !S.lpMin; $('leftpanel').classList.toggle('min', S.lpMin); };
$('lp-close').onclick = () => { S.sel = null; S.follow = false; renderPanel(); pushUrl(); };
function leftOpen(open) {
  $('leftpanel').classList.toggle('open', open);
  if (open && S.lpMin) { S.lpMin = false; $('leftpanel').classList.remove('min'); }
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

/* ---------------------------- the flight planner ----------------- */
function planRoute() {
  const PL = CFG.planner;
  if (!PL || !S.plan) return null;
  const [a, b] = S.plan;
  return PL.routes.find((r) => (r.from === a && r.to === b) || (r.from === b && r.to === a)) || null;
}
function renderPlan() {
  const PL = CFG.planner, host = $('pl-out');
  if (!PL || !host) return;
  const a = $('pl-from').value, b = $('pl-to').value;
  if (a === b) { S.plan = null; host.innerHTML = '<div class="as-fine">Pick two different heliports.</div>'; return; }
  S.plan = [a, b];
  const r = planRoute();
  if (!r) { host.innerHTML = '<div class="as-fine">No corridor route in the graph for this pair.</div>'; return; }
  const rule = S.key.split('|')[1];
  const rows = S.bundle ? S.bundle.specs : ['joby-s4', 'archer-midnight', 'beta-alia', 'eve-100'];
  host.innerHTML = `
  <div class="as-kv" style="margin-bottom:10px">
    <span>route</span><b>${PL.heliports[a].name} → ${PL.heliports[b].name}</b>
    <span>distance</span><b>${r.km} km along the corridors</b>
    <span>airspace</span><b>${r.bands.map((k) => (PL.bands[k] || k).split(' - ')[0]).join(' · ')}</b>
  </div>
  ${rows.map((sp) => {
    const v = r.verdicts[sp + '|' + rule];
    const ann = v.v === 'C' ? '<span class="as-ann go">GO</span>'
      : v.v === 'R' ? '<span class="as-ann no">NO-GO</span>'
      : '<span class="as-ann na">NEEDS DATA</span>';
    return `<div class="as-frow"><span><span class="name">${NAMES[sp]}</span>
      <span class="sub">${v.t_min[0]}–${v.t_min[1]} min flight · charge after ≈${v.charge_after_min} min${
        typeof v.m === 'number' ? ' · margin ' + v.m + ' kWh proved' : ''}</span></span>${ann}</div>`;
  }).join('')}
  <div class="as-fine" style="margin-top:8px">Energy GO/NO-GO under the ${RULES[rule]} rule (switch
  aircraft·rule in FLEET) — a mathematically certified enclosure per aircraft, precomputed and
  gate-checked. Bands: ${r.bands.map((k) => PL.bands[k] || k).join(' · ')}</div>`;
  pushUrl();
}

/* ---------------------------- fleet designer -------------------- */
const DZ = CFG.designer;
function dzSpec() { return S.key.split('|')[0]; }
function dzLookup(grid, x) {
  let best = grid[0];
  for (const p of grid) if (Math.abs(p[0] - x) < Math.abs(best[0] - x)) best = p;
  return best;
}
const EVTOL_SIL = `<svg viewBox="0 0 24 24"><g fill="currentColor">
  <circle cx="5" cy="5" r="3" opacity=".55"/><circle cx="19" cy="5" r="3" opacity=".55"/>
  <circle cx="5" cy="19" r="3" opacity=".55"/><circle cx="19" cy="19" r="3" opacity=".55"/>
  <rect x="10.3" y="4" width="3.4" height="16" rx="1.7"/>
  <rect x="3.5" y="10.4" width="17" height="3.2" rx="1.6"/></g></svg>`;
const ARC_LEN = 141.4;
function dzRender() {
  if (!DZ) return;
  const total = DZ.flights, sp = dzSpec();
  const b = dzLookup(DZ.battery[sp], +$('dz-b').value);
  const pct = Math.round(b[1] / total * 100);
  const arc = $('dz-arc');
  arc.style.strokeDashoffset = (ARC_LEN * (1 - b[1] / total)).toFixed(1);
  arc.style.stroke = pct < 20 ? 'var(--v-refu)' : pct < 50 ? 'var(--warn)' : 'var(--v-cert)';
  $('dz-pct').textContent = pct + '%';
  const fill = $('dz-bfill');
  fill.style.transform = 'scaleX(' + (b[0] / 700).toFixed(3) + ')';
  fill.style.background = pct < 20 ? 'var(--v-refu)' : pct < 50 ? 'var(--warn)' : 'var(--v-cert)';
  $('dz-b-out').innerHTML = `<b>${NAMES[sp]}</b> at <b>${b[0]} kWh</b> → <b>${b[1]}/${total}</b> flights provable`;
  const r = dzLookup(DZ.reserve[sp], +$('dz-r').value);
  $('dz-r-out').innerHTML = `${NAMES[sp]} under a <b>${r[0]}-minute</b> reserve → <b>${r[1]}/${total}</b> flights provable (${Math.round(r[1] / total * 100)}%)`;
  const m = Math.max(0, Math.min(60, Math.round(+$('dz-c').value)));
  const fleet = DZ.charge_fleet_by_minute[m];
  const maxFleet = Math.max(...DZ.charge_fleet_by_minute);
  $('dz-c-lbl').textContent = m + ' min';
  $('dz-fleet').innerHTML = Array.from({ length: maxFleet }, (_, i) =>
    EVTOL_SIL.replace('<svg ', `<svg class="${i < fleet ? 'on' : 'off'}" `)).join('');
  $('dz-c-out').innerHTML = `Beta ALIA re-flies its provable day with <b>${fleet} aircraft</b>` +
    (fleet < maxFleet ? ` — <b>${maxFleet - fleet} fewer</b> than at slow charge` : '');
}
for (const id of ['dz-b', 'dz-r', 'dz-c']) {
  const el = $(id); if (el) el.oninput = dzRender;
}
for (const id of ['pl-from', 'pl-to']) {
  const el = $(id); if (el) el.onchange = renderPlan;
}
if ($('pl-swap')) $('pl-swap').onclick = () => {
  const a = $('pl-from').value; $('pl-from').value = $('pl-to').value; $('pl-to').value = a; renderPlan();
};

/* ---------------------------- panel components ------------------ */
/* altitude sparkline (viewBox 100x26; cursor moved each frame) */
function altSvg(f) {
  const tr = f.track, t0 = tr[0][0], span = Math.max(1, tr[tr.length - 1][0] - t0);
  const maxAlt = Math.max(100, ...tr.map((e) => e[3]));
  const step = Math.max(1, Math.floor(tr.length / 200));
  const pts = [];
  for (let i = 0; i < tr.length; i += step) {
    pts.push(((tr[i][0] - t0) / span * 100).toFixed(2) + ',' + (24 - tr[i][3] / maxAlt * 21).toFixed(2));
  }
  return `<svg id="altsvg" viewBox="0 0 100 26" preserveAspectRatio="none"
    style="width:100%;height:54px;display:block;background:var(--sunk);border:1px solid var(--rule-soft);border-radius:8px;margin:10px 0 2px">
    <polyline points="${pts.join(' ')}" fill="none" stroke="var(--sig-2)" stroke-width="1" vector-effect="non-scaling-stroke"/>
    <line id="altcur" x1="0" x2="0" y1="1" y2="25" stroke="var(--sig)" stroke-width="1" vector-effect="non-scaling-stroke"/>
  </svg>
  <div class="as-fine">altitude 0–${Math.round(maxAlt)} ft across the flight · the cursor tracks replay time</div>`;
}
function altCursor() {
  const el = document.getElementById('altcur');
  if (!el || !S.sel) return;
  const tr = S.sel.track, t0 = tr[0][0], t1 = tr[tr.length - 1][0];
  const x = Math.max(0, Math.min(100, (S.t - t0) / Math.max(1, t1 - t0) * 100));
  el.setAttribute('x1', x); el.setAttribute('x2', x);
}
/* worst-corner exhaustion point: the route fraction at which worst-corner
   accrual consumes usable-minus-reserve (preview from recorded enclosures) */
function exhaustInfo(f, key) {
  const enc = f.enc[key]; if (!enc) return null;
  const frac = (enc.u[0] - enc.r[1]) / (enc.e[1] || 1);
  if (!(frac > 0 && frac < 1)) return null;
  if (!f._cum) {
    const d = [0];
    for (let i = 1; i < f.track.length; i++) {
      const a = f.track[i - 1], b2 = f.track[i], dx = (b2[2] - a[2]) * 85, dy = (b2[1] - a[1]) * 111;
      d.push(d[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    f._cum = d;
  }
  const total = f._cum[f._cum.length - 1], target = total * frac;
  let i = f._cum.findIndex((x) => x >= target);
  if (i < 1) i = 1;
  return { frac, km: target, totalKm: total, lon: f.track[i][2], lat: f.track[i][1] };
}
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
function selKey(k) { S.key = k; buildMatrix(); renderCounts(); renderPanel(); dzRender(); }

function renderCounts() {
  const b = S.bundle; if (!b) return;
  const n = { C: 0, R: 0, F: 0 };
  for (const f of b.flights) n[f.verdicts[S.key]]++;
  const pct = Math.round(n.C / b.flights.length * 100);
  $('counts').innerHTML =
    `<div class="as-score">${pct}%<span> of this day is provably electric under the selection</span></div>` +
    `<div class="as-stat c" title="CERTIFIED — every point of the parameter boxes clears the reserve floor"><b>${n.C}</b><span>e-flyable</span></div>` +
    `<div class="as-stat r" title="REFUTED — every point of the boxes fails; exact-rational witness"><b>${n.R}</b><span>beyond range</span></div>` +
    `<div class="as-stat f" title="REFUSED — the published numbers cannot decide it"><b>${n.F}</b><span>needs data</span></div>`;
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
  if (!S.sel) { leftOpen(false); host.innerHTML = ''; return; }
  leftOpen(true);
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
  ${altSvg(f)}
  <div class="as-verdict ${v}">
    <div class="w">${VNAME[v]} — ${NAMES[S.key.split('|')[0]]} · ${RULES[S.key.split('|')[1]]}</div>
    <div class="e">${VEXPL[v]}</div>
  </div>
  <details class="as-more"><summary>The certificate — why you can trust this</summary>
  <div class="as-fine" style="margin:6px 0 4px">Verdict class: <b>${TRUST[v]}</b> — a mathematically
  certified enclosure from interval arithmetic over the published parameter boxes.</div>
  ${encHtml(enc)}
  ${v === 'R' && enc.wit ? `<div class="as-encvals">exact witness margin (rational): ${enc.wit}</div>` : ''}
  ${typeof enc.m === 'number' ? `<div class="as-encvals">interval margin: ${enc.m} kWh</div>`
    : `<div class="as-encvals">margins — worst ${enc.m.w} / best ${enc.m.b} kWh</div>`}
  ${(() => { const ex = exhaustInfo(f, S.key); return ex
    ? `<div class="as-encvals" style="color:var(--v-refu)">worst-corner budget exhausts at km ${ex.km.toFixed(1)} of ${ex.totalKm.toFixed(1)} — marked ● on the route (preview)</div>` : ''; })()}
  </details>
  <div class="as-h" style="margin-top:14px">Reserve what-if</div>
  <input type="range" id="rsv" class="as-scrub" min="5" max="45" step="1" style="width:100%"
    value="${S.key.endsWith('faa-sfar-vfr') ? 20 : 5}" aria-label="reserve minutes">
  <div class="as-encvals" id="rsvout"></div>
  <div class="as-fine" style="margin-top:2px">Preview: scales this flight's recorded reserve
  enclosure linearly in time. Committed verdicts are gate-checked at the published rules;
  the day-level thresholds above are the certified ones.</div>
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
  const baseMin = S.key.endsWith('faa-sfar-vfr') ? 20 : 5;
  const rsvUpdate = () => {
    const t = +$('rsv').value, k = t / baseMin;
    const worst = enc.u[0] - enc.e[1] - enc.r[1] * k;
    const best = enc.u[1] - enc.e[0] - enc.r[0] * k;
    const pv = worst >= 0 ? 'C' : best < 0 ? 'R' : 'F';
    const c = { C: '--v-cert', R: '--v-refu', F: '--v-refd' }[pv];
    $('rsvout').innerHTML = `at a <b>${t}-minute</b> reserve: ` +
      `<span style="color:var(${c});font-weight:600">${VNAME[pv]}</span>` +
      ` · margins worst ${worst.toFixed(1)} / best ${best.toFixed(1)} kWh`;
  };
  $('rsv').oninput = rsvUpdate; rsvUpdate();
  $('followBtn').onclick = () => { S.follow = !S.follow; $('followBtn').dataset.on = S.follow ? '1' : '0'; };
  $('deselBtn').onclick = () => { S.sel = null; S.follow = false; renderPanel(); pushUrl(); };
}
})();
