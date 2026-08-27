/* app.js — the SkyAudit client: one real day of helicopter traffic,
   replayed, with a mathematically certified verdict on every flight.
   apps/skyaudit · cert-machine
   Globals: maplibregl, deck, pmtiles (vendored UMD; VENDOR-PINS.json). */
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
const VNAME = { C: 'CERTIFIED', R: 'REFUTED', F: 'REFUSED' };
const VEXPL = {
  C: 'every point of the stated parameter boxes lands at or above the reserve floor — a mathematically certified enclosure, not a simulation',
  R: 'EVERY point of the boxes violates the reserve floor; the most favorable corner is re-proved failing in exact rational arithmetic',
  F: 'the boxes straddle the floor — some points pass, some fail. With assumption-grade public specs this MEASURES what the manufacturer has not published' };

const qs = new URLSearchParams(location.search);
if (qs.get('k')) S.key = qs.get('k');
if (qs.get('m')) S.mode = qs.get('m');
if (qs.get('s')) S.speed = +qs.get('s') || 60;

/* ---------------------------- map ---------------------------- */
const protocol = new pmtiles.Protocol();
maplibregl.addProtocol('pmtiles', protocol.tile);
const map = new maplibregl.Map({
  container: 'map', style: CFG.style, center: [-73.995, 40.72], zoom: 11.4,
  pitch: 52, bearing: -14, minZoom: 8.2, maxZoom: 16.8,
  maxBounds: [[-74.75, 40.25], [-73.25, 41.15]], attributionControl: { compact: true },
});
map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-left');

map.on('load', () => {
  map.addLayer({ id: 'sk-buildings', type: 'fill-extrusion', source: 'protomaps',
    'source-layer': 'buildings', minzoom: 12,
    paint: { 'fill-extrusion-color': getComputedStyle(document.documentElement).getPropertyValue('--surface').trim(),
      'fill-extrusion-opacity': 0.55,
      'fill-extrusion-height': ['coalesce', ['get', 'height'], 10],
      'fill-extrusion-base': ['coalesce', ['get', 'min_height'], 0] } });
});

/* ---------------------------- data ---------------------------- */
fetch(CFG.bundle).then((r) => r.json()).then((b) => {
  S.bundle = b;
  const tDefault = Math.max(0, Math.min(b.span, (Math.floor(b.t0 / 86400) * 86400 + 14 * 3600) - b.t0));
  S.t = qs.get('t') !== null ? Math.max(0, Math.min(b.span, +qs.get('t'))) : tDefault;
  if (qs.get('f')) S.sel = b.flights.find((f) => f.id === qs.get('f')) || null;
  $('scrub').max = String(Math.ceil(b.span));
  buildKeyChips(); renderCounts(); renderPanel(); tick0 = performance.now();
  requestAnimationFrame(frame);
});

/* position on a track at rel time t (linear interp), null if outside */
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
map.addControl(overlay);

function trailColor(f) {
  if (S.mode === 'a') return (d, { index }) => altColor(f.track[Math.min(index, f.track.length - 1)][3]);
  return COL[f.verdicts[S.key]] || COL.F;
}
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
map.on('click', (e) => {
  const pick = overlay.pickObject && overlay.pickObject({ x: e.point.x, y: e.point.y, radius: 6 });
  if (pick && pick.object) { S.sel = pick.object.f || pick.object; renderPanel(); pushUrl(); }
});

/* ---------------------------- loop ---------------------------- */
let tick0 = performance.now(), lastFollow = 0, lastUrl = 0;
function frame(now) {
  const dt = (now - tick0) / 1000; tick0 = now;
  if (S.playing && S.bundle) {
    S.t += dt * S.speed;
    if (S.t > S.bundle.span) S.t = 0;
  }
  if (S.bundle) {
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
  history.replaceState(null, '', '?' + u.toString());
}

/* ---------------------------- controls ---------------------------- */
$('play').onclick = () => { S.playing = !S.playing; $('play').textContent = S.playing ? '❚❚' : '▶'; };
$('scrub').oninput = (e) => { S.t = +e.target.value; };
$('speed').onchange = (e) => { S.speed = +e.target.value; };
$('mode').onclick = () => { S.mode = S.mode === 'v' ? 'a' : 'v';
  $('mode').textContent = S.mode === 'v' ? 'color: verdict' : 'color: altitude';
  renderCounts(); };
new MutationObserver(loadColors).observe(document.documentElement, { attributes: true });

/* ---------------------------- panel ---------------------------- */
function keyLabel(k) {
  const [s, r] = k.split('|');
  return s.replace('-', ' ') + ' · ' + (r === 'faa-sfar-vfr' ? 'FAA 20-min' : 'EASA 5-min');
}
function buildKeyChips() {
  const b = S.bundle, host = $('keys'); host.innerHTML = '';
  for (const sp of b.specs) for (const r of b.rules) {
    const k = sp + '|' + r;
    const c = document.createElement('span');
    c.className = 'as-chip'; c.dataset.on = k === S.key ? '1' : '0';
    c.textContent = keyLabel(k);
    c.onclick = () => { S.key = k; buildKeyChips(); renderCounts(); renderPanel(); };
    host.appendChild(c);
  }
}
function renderCounts() {
  const b = S.bundle; if (!b) return;
  const n = { C: 0, R: 0, F: 0 };
  for (const f of b.flights) n[f.verdicts[S.key]]++;
  $('counts').innerHTML = ['C', 'R', 'F'].map((v) =>
    `<span class="as-chip" style="cursor:default"><span class="as-dot" style="background:var(${
      v === 'C' ? '--v-cert' : v === 'R' ? '--v-refu' : '--v-refd'})"></span>${VNAME[v]} ${n[v]}</span>`).join(' ');
}
function bar(enc) {
  const dLo = enc.e[0] + enc.r[0], dHi = enc.e[1] + enc.r[1];
  const max = Math.max(enc.u[1], dHi) * 1.06;
  const seg = (a, b2, v, top) =>
    `<div class="seg" style="left:${(a / max * 100).toFixed(1)}%;width:${((b2 - a) / max * 100).toFixed(1)}%;` +
    `top:${top ? '0' : '50%'};height:50%;background:var(${v});opacity:.55"></div>`;
  return `<div class="as-bar">${seg(enc.u[0], enc.u[1], '--v-cert', true)}${seg(dLo, dHi, '--v-refu', false)}</div>
  <div class="as-note">top: usable energy ${enc.u[0]}–${enc.u[1]} kWh · bottom: demanded incl. reserve ${dLo.toFixed(1)}–${dHi.toFixed(1)} kWh</div>`;
}
function renderPanel() {
  const b = S.bundle, host = $('flight'); if (!b) return;
  if (!S.sel) { host.innerHTML = '<div class="as-note">Click any aircraft — trail or dot — for its certificate. Colors are VERDICTS under the selected aircraft + rule, not telemetry.</div>'; return; }
  const f = S.sel, v = f.verdicts[S.key], enc = f.enc[S.key];
  const vd = { C: '--v-cert', R: '--v-refu', F: '--v-refd' }[v];
  host.innerHTML = `
  <div class="as-kv">
    <span>aircraft</span><b>${f.reg || f.icao} · ${f.type}</b>
    <span>flight</span><b>${(f.km).toFixed(1)} km · ${Math.round(f.dur / 60)} min · max ${f.alt} ft</b>
    <span>coverage</span><b>${f.trunc[0] || f.trunc[1] ? 'truncated at ' + (f.trunc[0] ? 'start' : '') + (f.trunc[0] && f.trunc[1] ? '+' : '') + (f.trunc[1] ? 'end' : '') : 'ground-to-ground'}</b>
  </div>
  <div class="as-h">verdict — ${keyLabel(S.key)}</div>
  <div style="font-family:monospace;font-size:15px;color:var(${vd});font-weight:700">${VNAME[v]}</div>
  <div class="as-note" style="margin:4px 0 8px">${VEXPL[v]}</div>
  ${bar(enc)}
  ${v === 'R' && enc.wit ? `<div class="as-note">exact witness margin (rational): ${enc.wit}</div>` : ''}
  ${typeof enc.m === 'number' ? `<div class="as-note">interval margin: ${enc.m} kWh</div>`
    : `<div class="as-note">margins: worst ${enc.m.w} / best ${enc.m.b} kWh</div>`}
  <div class="as-h">all eight verdicts</div>
  <div>${b.specs.map((sp) => b.rules.map((r) => {
    const k = sp + '|' + r, vv = f.verdicts[k];
    return `<span class="as-chip" data-on="${k === S.key ? 1 : 0}" onclick="window._selKey('${k}')">
      <span class="as-dot" style="background:var(${{ C: '--v-cert', R: '--v-refu', F: '--v-refd' }[vv]})"></span>${keyLabel(k)}</span>`;
  }).join(' ')).join(' ')}</div>
  <div class="as-h">actions</div>
  <button class="as-btn" id="followBtn" data-on="${S.follow ? 1 : 0}">follow</button>
  <button class="as-btn" onclick="window._deselect()">deselect</button>`;
  const fb = $('followBtn'); if (fb) fb.onclick = () => { S.follow = !S.follow; fb.dataset.on = S.follow ? '1' : '0'; };
}
window._selKey = (k) => { S.key = k; buildKeyChips(); renderCounts(); renderPanel(); };
window._deselect = () => { S.sel = null; S.follow = false; renderPanel(); pushUrl(); };
})();
