/* build-app.js — /janela/: the app shell. STATIC: it carries the places, the
   presets, the published rules, the alpha tables, the month's exact counts and
   the deciding modules; the DAY (forecast, bands, decisions, the scoreboard) is
   fetched from the janela-field branch, so main does not grow by a day's data.

   emit(N, git) -> { files, bytes } writes site/janela/{index.html, app.js,
   geo.js, vendor/}. Called by apps/janela/build.js after the gates.
   apps/janela/app · cert-machine                                         MIT */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = path.join(__dirname, '..', '..', '..');
const SITE = path.join(ROOT, 'site', 'janela');
const MODEL = require('./model.js');
const PLACAR = require('../audit/placar.js');
const { en } = require('../numbers.js');
const { renderApp } = require(path.join(ROOT, 'design', 'app-shell.js'));
const esc = require(path.join(ROOT, 'design', 'components.js')).esc;
/* WARRANT (design/WARRANT.md, v2.1): the grammar's renderer, here for the shell's own marks and shipped to the tab beside
   the deciding modules (not a deciding module: no pin, no day check), so the card draws with the same calls */
const WR = require(path.join(ROOT, 'playground', 'warrant.js'));
/* its own English words: the legend and the premise ladder (the app went English 2026-10-30; warrant-pt.js is not read here) */
const GW = WR.GRADE, GG = WR.GRADE_GLOSS, legend = WR.legendHtml;
/* a held-out statistic is a FLOATING-POINT evaluation (the record says so): its value is computed, never decided */
/* `from`: the record cells it is computed from (numbers.js N.at, D10) */
const fl = (txt, rec, from) => WR.value(txt, WR.COMPUTED, { title: 'computed — a floating-point evaluation (' + rec + '); the decisions are exact', derived: from });
/* a held-out row's cells: its coverage, and its LIBERADA broken over its LIBERADA at Hs <= 2 m */
const covOf = (row) => row + '/coverage';
const brokeOf = (row) => [row + '/limits/2.0/brokeLiberada', row + '/limits/2.0/liberada'];
/* THE MODEL THE TAB IS SHIPPED, IN ENGLISH (model.js EN). The fingerprint stays the Portuguese model's (it is what a
   published day records, cfg.model below); the tab reads only names and notes from these copies, never decides on them.
   Two Portuguese strings stay as they are: a place's siteWhy (criteria.js returns it as the reason, and the reason is
   inside every decision's canonical line, hence the day's digest: the tab translates it for display) and a terminal
   rule's quote (the act's own words). Anything without an English here refuses the build. */
function shipEnglish(M) {
  const E = MODEL.EN, C = (x) => JSON.parse(JSON.stringify(x));
  const R = J('apps/janela/scenario/regions.json').regions, caveats = {};
  for (const [id, r] of Object.entries(R)) {
    if (!r.caveatPt) continue;
    if (!E.caveats[id]) throw new Error('REFUSED: the region ' + id + ' has a caveat with no English (apps/janela/app/model.js EN.caveats)');
    caveats[r.caveatPt] = E.caveats[id];
  }
  const places = C(M.places).map((p) => {
    if (p.kind !== 'uep') { if (!E.sites[p.id]) throw new Error('REFUSED: the site ' + p.id + ' has no English name (model.js EN.sites)'); p.name = E.sites[p.id]; }
    if (p.caveat) { if (!caveats[p.caveat]) throw new Error('REFUSED: a caveat with no English at ' + p.id); p.caveat = caveats[p.caveat]; }
    if (p.siteWhy && !MODEL.whyEn(p.siteWhy)) throw new Error('REFUSED: no English for "' + p.siteWhy + '" (model.js EN.why)');
    if (p.kind === 'uep' && p.type && !E.types[p.type]) throw new Error('REFUSED: the unit type ' + p.type + ' has no English (model.js EN.types)');
    return p;
  });
  const presets = C(M.presets).map((p) => {
    const e = E.presets[p.id];
    if (!e || !e.name) throw new Error('REFUSED: the preset ' + p.id + ' has no English (model.js EN.presets)');
    for (const k of ['name', 'long', 'source', 'notDecided']) if (p[k] !== undefined) { if (!e[k]) throw new Error('REFUSED: the preset ' + p.id + ' has no English ' + k); p[k] = e[k]; }
    if (p.appliesTo) { if (!e.why) throw new Error('REFUSED: the preset ' + p.id + ' has no English appliesTo.why'); p.appliesTo.why = e.why; }
    return p;
  });
  /* the terminal rules' names: operations.json carries each one's English beside the Portuguese */
  const OPS = Object.fromEntries(J('apps/janela/scenario/operations.json').operations.map((o) => [o.id, o.en]));
  const npcp = C(M.npcp).map((o) => { if (!OPS[o.id]) throw new Error('REFUSED: the terminal rule ' + o.id + ' has no English name (operations.json)'); o.name = OPS[o.id]; return o; });
  return { places, presets, npcp };
}
/* the words the tab still meets in Portuguese: the reasons criteria.js and siteWhy hand it, ANP's unit types, and the
   scoreboard's words (placar.js) a published day carries */
function enWords() {
  return { types: MODEL.EN.types, why: MODEL.EN.why, proposers: PLACAR.NAMES_EN, pairs: PLACAR.PAIRS_EN, leads: PLACAR.LEADS_EN };
}

const RAW = 'https://raw.githubusercontent.com/carlostoledo1891/cert-machine/janela-field/';
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const J = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));

/* ---- the geography: land, the production fields, the pre-salt polygon, rounded and thinned for drawing ---- */
function ring(r, k) {
  const out = [];
  for (const p of r) {
    const q = [Math.round(p[0] * k) / k, Math.round(p[1] * k) / k];
    const a = out[out.length - 1], b = out[out.length - 2];
    if (a && a[0] === q[0] && a[1] === q[1]) continue;
    /* staircase polygons: drop the middle of three collinear points (exactly collinear on the rounded grid) */
    if (a && b && ((b[0] === a[0] && a[0] === q[0]) || (b[1] === a[1] && a[1] === q[1]))) out.pop();
    out.push(q);
  }
  return out.length >= 4 ? out : null;
}
function geo(places) {
  const pins = J('corpus/anp/PINS.json');
  const read = (name) => {
    const b = fs.readFileSync(path.join(ROOT, 'corpus', 'anp', name));
    if (sha(b) !== pins.files[name].sha256) throw new Error('REFUSED: corpus/anp/' + name + ' does not hash to its pin');
    return JSON.parse(b.toString('utf8'));
  };
  /* the whole ocean basin the map can show, so no clip edge is ever on screen (the map's maxBounds sit inside
     this box): full detail inside the Brazilian margin (basemap.js's own box), the coast beyond it thinned to one
     vertex per 0.1° — it is context, drawn small, and nothing is decided from it */
  const B = require('../audit/basemap.js');
  const land = B.land({ w: -100, e: 0, s: -56, n: 20 });
  const inMargin = (p) => p[0] >= B.BOX.w && p[0] <= B.BOX.e && p[1] >= B.BOX.s && p[1] <= B.BOX.n;
  const thin = (r) => {
    const out = [];
    for (const p of r) { const l = out[out.length - 1]; if (!l || inMargin(p) || Math.abs(p[0] - l[0]) + Math.abs(p[1] - l[1]) >= 0.1) out.push(p); }
    const a = out[0], z = out[out.length - 1];
    if (a[0] !== z[0] || a[1] !== z[1]) out.push(a);
    return out.length >= 4 ? out : null;
  };
  const g0 = land.features[0].geometry;
  g0.coordinates = g0.coordinates.map((poly) => poly.map(thin).filter(Boolean)).filter((poly) => poly.length);
  /* the fields drawn: offshore (a water depth) or served by a production unit on the map */
  const served = new Set();
  for (const p of places) if (p.serves) for (const m of String(p.serves).toUpperCase().matchAll(/([A-ZÀ-Ú][A-ZÀ-Ú0-9 '\-]+?)\s*\(/g)) served.add(m[1].trim());
  const fields = [];
  for (const f of read('campos.geojson').features) {
    const pr = f.properties;
    if (!(Number(pr.med_lamina) > 0) && !served.has(String(pr.name || '').toUpperCase().trim())) continue;
    const g = f.geometry, polys = g.type === 'Polygon' ? [g.coordinates] : g.coordinates;
    const coords = polys.map((poly) => poly.map((r) => ring(r, 1000)).filter(Boolean)).filter((p) => p.length);
    if (!coords.length) continue;
    fields.push({ type: 'Feature', properties: { n: String(pr.name || '').trim(), b: String(pr.nome_bacia || '').replace(/\s+/g, ' ').trim(), e: String(pr.etapa || '').trim() },
      geometry: { type: 'MultiPolygon', coordinates: coords } });
  }
  const ps = read('presal.geojson').features[0].geometry;
  const presal = { type: 'Feature', properties: { n: 'the pre-salt polygon' }, geometry: { type: ps.type, coordinates: ps.type === 'Polygon' ? ps.coordinates.map((r) => ring(r, 1000))
    : ps.coordinates.map((poly) => poly.map((r) => ring(r, 1000)).filter(Boolean)) } };
  return { land, fields: { type: 'FeatureCollection', features: fields }, presal: { type: 'FeatureCollection', features: [presal] },
    sources: { land: 'Natural Earth 1:10m (public domain), corpus/basemap', anp: 'ANP — GeoMaps (open data), corpus/anp, ' + pins.fetched } };
}

/* ---- the vendored map library, the pinned bytes or nothing ---- */
function vendor(dir) {
  const V = path.join(ROOT, 'apps', 'skyaudit', 'vendor');
  const pins = Object.fromEntries(fs.readFileSync(path.join(V, 'VENDOR-SHA256.txt'), 'utf8').trim().split('\n').map((l) => l.trim().split(/\s+/).reverse()));
  fs.mkdirSync(path.join(dir, 'vendor'), { recursive: true });
  /* the stylesheet carries a DECLARED patch (its header, 2026-09-05: six light-scheme queries disabled by an
     unknown media feature). It is accepted only if reverting exactly that patch gives the pinned upstream bytes. */
  const unpatch = (b) => Buffer.from(b.toString('utf8').replace(/^\/\* VENDOR PATCH, cert-machine[\s\S]*?\*\/\n/, '').split(' and (min-cert-machine-dark-lock:0)').join(''), 'utf8');
  const patched = {};
  for (const f of ['maplibre-gl.js', 'maplibre-gl.css']) {
    const b = fs.readFileSync(path.join(V, f));
    if (sha(b) !== pins[f]) {
      if (!(f.endsWith('.css') && sha(unpatch(b)) === pins[f])) throw new Error('REFUSED: ' + f + ' is neither the pinned bytes nor the pinned bytes plus the declared patch (apps/skyaudit/vendor/VENDOR-SHA256.txt)');
      patched[f] = sha(b);
    }
    fs.writeFileSync(path.join(dir, 'vendor', f), b);
  }
  const vp = J('apps/skyaudit/vendor/VENDOR-PINS.json');
  fs.writeFileSync(path.join(dir, 'vendor', 'VENDOR-PINS.json'), JSON.stringify({ 'maplibre-gl': vp['maplibre-gl'], sha256: {
    'maplibre-gl.js': pins['maplibre-gl.js'], 'maplibre-gl.css': pins['maplibre-gl.css'] }, declaredPatch: patched,
    from: 'apps/skyaudit/vendor (checked at build: the upstream pin, or the upstream pin plus the patch the file declares)' }, null, 1) + '\n');
}

const pc1 = (x) => (100 * x).toFixed(1) + '%';
const pc2 = (a, b) => (100 * a / b).toFixed(2) + '%';
/* WHAT EVERY VERDICT RESTS ON (WARRANT v2.1, rule 11), once for the fleet in the trust box: the premises in the order
   a number travels through them, each graded from its record (numbers.js premises), and the line naming the weakest.
   The card draws the same chain for one place and one criterion (client.js restsOn). */
function trustChain(N) {
  const P = N.premises, H = P.heldOut.main, U = H.opt['U(E,N)'], A = P.alpha, RE = H.file, Ua = N.at.eval[H.file].opt['U(E,N)'];
  const borrowKm = J('apps/janela/scenario/platforms.json').borrowKm;
  if (!(borrowKm > 0)) throw new Error('REFUSED: apps/janela/scenario/platforms.json lost borrowKm');
  const mm = H.split.slice(0, 7);
  const items = [
    { grade: WR.VALIDATED, label: 'The Hs band, at the measured sites', evidence: 'calibrated before ' + mm + ' and judged over ' + H.months + ' months it had not seen: the ECMWF ∪ NOAA union covered '
      + fl(pc1(U.coverage), RE, covOf(Ua)) + ' of ' + en.int(H.test) + ' satellite passes (it claims 9 in 10); of the CLEARED with Hs ≤ 2 m, the sea broke ' + fl(pc2(U.broke, U.liberada), RE, brokeOf(Ua)) + ' (' + en.int(U.broke) + ' of ' + en.int(U.liberada) + ').' },
    { grade: WR.ASSUMED, label: 'The wind band', evidence: 'measured on the same ' + en.int(P.wind.rows) + ' pairs (the altimeter\'s wind); it claims 9 in 10 by theorem, if the next error resembles the archive\'s. That was not tested outside the calibration: the scoreboard and the check of the decisions look only at Hs.' },
    { grade: WR.ASSUMED, label: 'The band carried to a unit or a terminal', evidence: 'each unit uses the band of the nearest measured site, up to ' + borrowKm + ' km away; the forecast error there is assumed to hold here, and nothing measured it at the unit\'s node. On the card\'s chart, the halo.' },
    { grade: WR.ASSUMED, label: 'The α of Table 4-1 (DNV)', evidence: 'adopted from DNV-OS-H101, calibrated in the North Sea; the 1-in-' + en.int(A.oneIn) + ' tail behind it is extrapolated: three years of satellite do not observe it.' },
    { grade: WR.VERIFIED, label: 'The site α method', evidence: 'reproduces Table 4-1 in ' + A.within + ' of ' + A.of + ' cells (±' + en.dec(A.tol) + ') before looking at Brazil; the α estimated with it carries the same extrapolated tail.' }
  ];
  return WR.premisesHtml(items, { words: GW, gloss: GG, meetLine: 'The arithmetic is exact under every criterion; each decision is worth the rung of its weakest premise. '
    + 'By the band, at a measured site and with an Hs-only limit: <b>validated</b>. With a wind limit, at a unit, at a terminal or by α: <b>assumed</b>.' });
}

/* ---- the panel's skeleton: the script fills it; with scripts off it says what the app is ---- */
function panel(M, N) {
  const CRIT = [['band', 'Measured band', 'measured error'], ['table', 'DNV Tab. 4-1', 'table α'], ['site', 'DNV site α', 'estimated α']];
  const seg = (attr, items) => items.map(([v, a, b], i) => `<button type="button" role="radio" ${attr}="${v}" aria-checked="${i ? 'false' : 'true'}">${esc(a)}${b ? '<small>' + esc(b) + '</small>' : ''}</button>`).join('');
  const W = N.work;
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const nUnits = M.places.filter((p) => p.kind === 'uep').length;
  /* THE USE CASES (apps/janela/uses.js, one definition): each one a door into the app's state, set by client.js */
  const USES = require('../uses.js').doors('en').map((u) => [u.door, u.label, u.sub]);
  const RE = 'certs/janela-providers-eval.json', HA = N.at.heldOut || {};
  const area = (k, s) => (MODEL.EN.sites[k] || s.name).replace(/^Equatorial Margin — /, '').replace(/ — .*$/, '').replace(/ Basin$/, '');
  return `
<button type="button" class="jn-grip" id="jn-grip" aria-controls="panel" aria-label="Show more of the panel"><i></i></button>
<div class="jn-scroll" id="jn-scroll">
<section class="jn-pane" id="pane-semana" data-mode="semana" aria-label="The week">
  <div class="jn-box jn-intro" id="jn-intro">
    <button type="button" class="jn-introt" id="jn-introt" aria-expanded="true" aria-controls="jn-introb"><span>Every offshore operation's window, decided.</span><i aria-hidden="true"></i></button>
    <div id="jn-introb">
      <p class="jn-p">The next seven days of sea against your operation's limit, at Brazil's ${nUnits} offshore production units and at the terminals with a rule from the Harbour Master (Capitania dos Portos) — over a forecast whose error was measured by satellite. Every hour comes out <b>CLEARED</b>, <b>BLOCKED</b>, <b>UNDECIDED</b> or <b>NEEDS DATA</b>, with the reason and the threshold that would flip it.</p>
      ${N.heldOut ? `<div class="jn-proof" role="list">
        <div role="listitem"><b>${nUnits}</b><span>offshore units, plus ${M.places.length - nUnits} measured sites and terminals</span></div>
        <div role="listitem"><b>${fl(pc1(N.heldOut.coverage), RE, covOf(HA.U))}</b><span>band coverage over ${en.int(N.heldOut.pairs)} satellite measurements it had not seen</span></div>
        <div role="listitem"><b>${fl(pc2(N.heldOut.broke, N.heldOut.liberada), RE, brokeOf(HA.U))}</b><span>of the CLEARED with Hs ≤ 2 m that the sea broke; ECMWF alone: ${fl(pc2(N.heldOut.eBroke, N.heldOut.eLiberada), RE, brokeOf(HA.E))}</span></div>
      </div>` : ''}
      <div class="jn-k">what do you need to decide?</div>
      <div class="jn-seg jn-uses" id="jn-uses">${USES.map(([v, a, b]) => `<button type="button" data-use="${v}">${esc(a)}<small>${esc(b)}</small></button>`).join('')}</div>
    </div>
  </div>
  <div class="jn-box" id="jn-opbox">
    <div class="jn-k">the operation</div>
    <div class="jn-chips" id="jn-ops" role="radiogroup" aria-label="Operation"></div>
    <div id="jn-edit"></div>
  </div>
  <div class="jn-answer" id="jn-answer">
    <p class="jn-late" id="jn-late" role="note" hidden></p>
    <div id="jn-ansl" aria-live="polite"><p class="jn-ans">The operating window of every offshore unit in Brazil, decided against the published limit.</p>
    <p class="jn-sub"><noscript>This app decides in your browser and needs JavaScript. The method and the published decisions are at <a href="/janela/metodo/">/janela/metodo/</a>.</noscript><span id="jn-load">loading today's forecast…</span></p></div>
    <div class="jn-seg jn-crit" id="jn-crit" role="radiogroup" aria-label="Criterion">${seg('data-crit', CRIT)}</div>
    <details class="jn-src jn-critd"><summary>how this criterion decides</summary><span id="jn-critx"></span></details>
  </div>
  <div class="jn-box jn-time" id="jn-time">
    <div class="jn-timeh"><span class="jn-when" id="jn-when">—</span><span class="jn-lead" id="jn-lead"></span><span class="jn-grow"></span>
      <button type="button" class="jn-btn" id="jn-prev" aria-label="six hours earlier">‹</button><button type="button" class="jn-btn" id="jn-play" aria-pressed="false" aria-label="play the week">▶</button><button type="button" class="jn-btn" id="jn-next" aria-label="six hours later">›</button></div>
    <div class="jn-days" id="jn-days" aria-hidden="true"></div>
    <div class="jn-strip" id="jn-strip" role="slider" tabindex="0" aria-label="Window start, Brasília time" aria-valuemin="0" aria-valuemax="28" aria-valuenow="0"></div>
  </div>
  <div class="jn-box jn-card" id="jn-card" hidden></div>
  <div class="jn-box" id="jn-listbox">
    <div class="jn-k" id="jn-listk">the units, by their next window</div>
    <div class="jn-find"><input class="jn-in" id="jn-q" type="search" placeholder="Search a unit or field: P-75, Búzios" aria-label="Search a unit or field" autocomplete="off"></div>
    <div class="jn-seg three-l tight" id="jn-kind" role="radiogroup" aria-label="Which places">${seg('data-kind', [['all', 'All', ''], ['uep', 'Units', ''], ['own', 'Basins and terminals', '']])}</div>
    <div class="jn-rows" id="jn-rows"></div>
  </div>
</section>
<section class="jn-pane" id="pane-mes" data-mode="mes" aria-label="The campaign" hidden>
  <div class="jn-box">
    <div class="jn-k">the campaign · months ahead</div>
    <p class="jn-p">To plan an installation, a decommissioning or a run of offloadings: how many days N operations take from a given month, which months open a window and how much DNV's α closes — counted over ${Number(W.to.slice(0, 4)) - Number(W.from.slice(0, 4)) + 1} years of past sea, nothing fitted.</p>
    <div class="jn-k jn-k2">area</div><div class="jn-seg three-l" id="jn-m-site" role="radiogroup" aria-label="Area">${seg('data-ms', Object.entries(W.sites).map(([k, s]) => [k, area(k, s), '']))}</div>
    <div class="jn-k jn-k2">Hs limit (OPLIM)</div><div class="jn-seg six" id="jn-m-lim" role="radiogroup" aria-label="Hs limit">${seg('data-ml', W.limits.map((l) => [l, l + ' m', '']))}</div>
    <div class="jn-k jn-k2">window (TR)</div><div class="jn-seg four" id="jn-m-tr" role="radiogroup" aria-label="Window">${seg('data-mt', W.periods.map((t) => [String(t), t + ' h', '']))}</div>
  </div>
  <div class="jn-box" id="jn-m-camp-b">
    <div class="jn-k">how many operations</div><div class="jn-seg four" id="jn-m-n" role="radiogroup" aria-label="Operations">${seg('data-mn', [1, 5, 10, 20].map((k) => [String(k), String(k), '']))}</div>
    <div class="jn-k jn-k2">starting on the 1st of</div><div class="jn-seg six" id="jn-m-start" role="radiogroup" aria-label="Start month">${seg('data-mm', MON.map((m, k) => [String(k + 1).padStart(2, '0'), m, '']))}</div>
    <div id="jn-m-camp"></div>
  </div>
  <div class="jn-box" id="jn-m-chart"></div>
  <div class="jn-box" id="jn-m-season"></div>
  <div class="jn-box" id="jn-m-table"></div>
  <div class="jn-box" id="jn-m-cost"></div>
  <div class="jn-box" id="jn-m-rests"></div>
  <div class="jn-box"><p class="jn-fine">Every operation start, every 3 h, over ${Number(W.to.slice(0, 4)) - Number(W.from.slice(0, 4)) + 1} years of hindcast (${esc(W.from.slice(0, 4))}–${esc(W.to.slice(0, 4))}): a window of TR hours with Hs under the limit fits, or it does not. Exact fractions of integers, nothing fitted.</p></div>
</section>
<section class="jn-pane" id="pane-placar" data-mode="placar" aria-label="The scoreboard" hidden>
  <div class="jn-box"><div class="jn-k">the scoreboard · the forecast against the satellite</div>
    <p class="jn-p">Every band is committed before the sea happens and scored afterwards against what a satellite altimeter measured. A wrong forecast stays in the record for good.</p></div>
  ${N.heldOut ? `<div class="jn-box"><div class="jn-k">what is already measured</div>
    <div class="jn-season"><div><div class="jn-k">coverage of the deciding band</div><div class="big">${fl(pc1(N.heldOut.coverage), RE, covOf(HA.U))}</div><div class="s">over ${en.int(N.heldOut.pairs)} satellite comparisons it had not seen (it claims 90%)</div></div>
    <div><div class="jn-k">CLEARED that the sea broke</div><div class="big">${fl(pc2(N.heldOut.broke, N.heldOut.liberada), RE, brokeOf(HA.U))}</div><div class="s">${en.int(N.heldOut.broke)} of ${en.int(N.heldOut.liberada)} with Hs ≤ 2 m; ECMWF's band alone: ${fl(pc2(N.heldOut.eBroke, N.heldOut.eLiberada), RE, brokeOf(HA.E))}</div></div></div>
    <p class="jn-fine">Measured in hindsight: the bands calibrated before ${esc(N.heldOut.from.slice(0, 7))} and judged only after it (certs/janela-providers-eval.json). Below, the forward record, which nobody can rewrite.</p></div>` : ''}
  <div id="jn-props" class="jn-pane"></div>
  <div class="jn-box"><div class="jn-k">the admission rule</div>
    <p class="jn-p">${esc(PLACAR.RULE_EN)} Admission is lost by record, never by opinion.</p></div>
</section>
<div class="jn-box jn-trust" id="jn-trust">
  <div class="jn-k">why trust it</div>
  <p class="jn-p">The verdict is exact arithmetic on the limit as printed; the band is a claim the scoreboard audits in public. The published band is rounded <b>outward</b> (Hs to 0.001 m, wind to 0.01 kn): a CLEARED or BLOCKED on it holds on the exact band; only UNDECIDED can grow. It is not an approval of an operation: it is evidence a surveyor can redo. <a href="/janela/metodo/">The method ↗</a> · <a href="/janela/janela-apresentacao.pdf">the presentation (PDF, in Portuguese)</a></p>
  ${N.heldOut ? `<p class="jn-p">Over ${en.int(N.heldOut.pairs)} satellite comparisons no band had seen (since ${esc(N.heldOut.from.slice(0, 7))}): when the deciding band put Hs under 2 m, the sea went over the limit <b>${fl(pc2(N.heldOut.broke, N.heldOut.liberada), RE, brokeOf(HA.U))}</b> of the time (${en.int(N.heldOut.broke)} of ${en.int(N.heldOut.liberada)}); with ECMWF's band alone, ${fl(pc2(N.heldOut.eBroke, N.heldOut.eLiberada), RE, brokeOf(HA.E))}.</p>` : ''}
  <div class="jn-k jn-k2">what each verdict rests on</div>
  ${trustChain(N)}
  ${legend({ compact: true, from: [WR.DECIDED, WR.COMPUTED] })}
  <p class="jn-check" id="jn-check">—</p>
  <p class="jn-fine">Forecast: ECMWF open data (CC BY 4.0) and NOAA WAVEWATCH III (public domain) · current: Generated using E.U. Copernicus Marine Service Information, <a href="https://doi.org/10.48670/moi-00016">doi:10.48670/moi-00016</a> · altimetry NOAA RADS · hindcast Ifremer WW3 (CC BY-SA 4.0) · units, fields and pre-salt: ANP — GeoMaps · coast: Natural Earth · code: <a href="https://github.com/carlostoledo1891/cert-machine/tree/main/apps/janela">apps/janela</a></p>
</div>
</div>`;
}

function extra() {
  return `<canvas id="jn-crest" class="jn-layer" aria-hidden="true"></canvas>
<canvas id="jn-wind" class="jn-layer" aria-hidden="true"></canvas>
<canvas id="jn-marks" class="jn-layer" aria-hidden="true"></canvas>
<div class="jn-clock" id="jn-clock" aria-hidden="true"><span id="jn-clockt">—</span><span class="jn-lead" id="jn-clockl"></span><button type="button" class="jn-btn jn-keybtn" id="jn-keybtn" aria-expanded="false" aria-controls="jn-legend" aria-label="Map legend">?</button></div>
<div class="jn-legend" id="jn-legend" role="note" aria-label="Map legend">
  <div class="row"><span><i class="jn-g L"></i>CLEARED</span><span><i class="jn-g V"></i>BLOCKED</span><span><i class="jn-g I"></i>UNDECIDED</span><span><i class="jn-g S"></i>NEEDS DATA</span></div>
  <div class="row fc"><span><svg viewBox="0 0 22 12" aria-hidden="true"><path class="cr" d="M5 10 Q11 4 17 10"/></svg>waves: crests, lighter = higher Hs</span><span><svg viewBox="0 0 22 12" aria-hidden="true"><path class="st" d="M2 8 L20 4"/></svg>wind at 10 m</span><span>ECMWF forecast, not decided: a drawing of the model</span></div>
</div>
<section class="jn-board open" id="jn-board" aria-label="Fleet board: every place against the week's 29 starts" hidden>
  <header class="jn-bbar">
    <button type="button" class="jn-bt" id="jn-bt" aria-expanded="true" aria-controls="jn-bgrid" title="Fleet board (key Q)"><i aria-hidden="true"></i>Fleet board</button>
    <span class="jn-bsum" id="jn-bsum"></span>
    <span class="jn-grow"></span>
    <span class="jn-bkey" aria-hidden="true"><span><i class="jn-g L"></i>CLEARED</span><span><i class="jn-g V"></i>BLOCKED</span><span><i class="jn-g I"></i>UNDECIDED</span><span><i class="jn-g S"></i>NEEDS DATA</span></span>
    <button type="button" class="jn-bcsv" id="jn-bcsv" title="Download the board as a spreadsheet (CSV): every place, every start, the verdict">CSV ↓</button>
    <div class="jn-bsort" id="jn-bsort" role="radiogroup" aria-label="Board order"><button type="button" role="radio" data-bsort="bacia" aria-checked="true">by basin</button><button type="button" role="radio" data-bsort="janela" aria-checked="false">by next window</button></div>
  </header>
  <div class="jn-bgrid" id="jn-bgrid" role="table" aria-label="Fleet board"></div>
</section>
<div class="jn-tip" id="jn-tip" role="status"></div>
<div class="jn-status" id="jn-status" role="status"></div>
<article class="jn-nota" id="jn-nota" aria-hidden="true"></article>`;
}

function emit(N, git) {
  const M = MODEL.load();
  const mods = MODEL.modules();
  /* the grammar's own renderer, for the marks and the premise chains the tab draws (not a deciding module: no pin) */
  for (const rel of ['design/grammar.js', 'playground/warrant.js']) mods.src[path.basename(rel)] = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  fs.mkdirSync(SITE, { recursive: true });
  vendor(SITE);
  const G = geo(M.places);
  const geoJs = 'window.JANELA_GEO=' + JSON.stringify(G) + ';\n';
  fs.writeFileSync(path.join(SITE, 'geo.js'), geoJs);
  const APPJS = fs.readFileSync(path.join(__dirname, 'client.js'));
  fs.writeFileSync(path.join(SITE, 'app.js'), APPJS);
  /* the day's data starts loading BEFORE the map library (276 KB) is fetched and parsed: the answer line waits for
     the data, never for the map. The same source order as app.js's loader (the published branch first, a local
     copy first on a desk); app.js falls back to its own loader if this fails. */
  const EARLY = Buffer.from("(function(){var c=window.JANELA&&window.JANELA.data;if(!c||!window.fetch)return;"
    + "var local=/^(localhost|127\\.0\\.0\\.1|\\[::1\\])$/.test(location.hostname)||location.protocol==='file:';"
    + "var u=local?c.today.slice().reverse():c.today;"
    + "var get=function(i){return fetch(u[i],{cache:'no-cache'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})"
    + ".catch(function(e){if(i+1<u.length)return get(i+1);throw e;});};"
    + "window.JANELA_EARLY={today:get(0)};})();\n");
  fs.writeFileSync(path.join(SITE, 'early.js'), EARLY);

  /* THE CAMPAIGN PLANNER's inputs: each hindcast node's 32-year series as little-endian int16 (Hs x 500, the
     hindcast's own packing; hindcast.js verifies every monthly file against its pin first), fetched by the tab
     only when the planner opens and checked against the sha256 below before it counts anything */
  const H = require('../audit/hindcast.js');
  const HD = path.join(SITE, 'hindcast');
  fs.mkdirSync(HD, { recursive: true });
  const hind = {};
  for (const node of Object.keys(N.work.sites)) {
    const s = H.load(node);
    const buf = Buffer.alloc(s.x.length * 2);
    s.x.forEach((v, k) => buf.writeInt16LE(v, 2 * k));
    fs.writeFileSync(path.join(HD, node + '.i16'), buf);
    hind[node] = { file: 'hindcast/' + node + '.i16', sha256: sha(buf), n: s.x.length, from: s.from, to: s.to, stepH: s.stepH, scale: s.scale, fill: s.fill };
  }
  const CAMP = fs.readFileSync(path.join(ROOT, 'instruments', 'window', 'campaign.js'));
  const W = N.work;
  const ME = shipEnglish(M);
  const cfg = {
    v: 1, git, model: MODEL.fingerprint(M),
    data: { today: [RAW + 'today.json', 'data/today.json'], todayJs: 'data/today.js', field: [RAW + 'field.bin', 'data/field.bin'], fieldJs: 'data/field.js' },
    places: ME.places, presets: ME.presets, npcp: ME.npcp, crits: M.crits, alphaT: M.alphaT, wind46: M.wind46,
    t41: M.t41, columns: M.columns, dnvSource: { title: M.dnvSource.title, sha256: M.dnvSource.sha256 },
    work: { from: W.from, to: W.to, samples: W.samples, source: W.source, limits: W.limits, periods: W.periods,
      sites: Object.fromEntries(Object.entries(W.sites).map(([k, s]) => [k, { name: MODEL.EN.sites[k] || s.name, cells: s.cells }])) },
    records: M.records, modules: mods, proposerNames: PLACAR.NAMES_EN,
    plan: { src: CAMP.toString('utf8'), sha256: sha(CAMP), hindcast: hind, source: W.source },
    /* WARRANT v2.1: the premises each verdict rests on, every grade's numbers read from its record (numbers.js) */
    premises: Object.assign({ borrowKm: J('apps/janela/scenario/platforms.json').borrowKm, words: GW, gloss: GG,
      /* drawn at runtime (app.js): the legends name the standings those figures draw (R20) — a decided band with computed
         lines, and a decided band with the chosen α */
      legend: { dc: legend({ compact: true, from: [WR.DECIDED, WR.COMPUTED] }), dch: legend({ compact: true, from: [WR.DECIDED, WR.CHOSEN] }) } }, N.premises),
    /* the English for the Portuguese the tab still meets (shipEnglish and enWords above) */
    en: enWords(),
    shas: { 'app.js': sha(APPJS), 'geo.js': sha(geoJs), 'early.js': sha(EARLY) }
  };
  const json = JSON.stringify(cfg).replace(/</g, '\\u003c');
  const html = renderApp({
    title: 'Janela — every offshore unit\'s operating window, decided',
    description: 'For Brazil\'s offshore production units: the next window for offloading, PSV cargo, line laying or lifting, decided against the operation\'s limit over a forecast whose error was measured by satellite — CLEARED, BLOCKED, UNDECIDED or NEEDS DATA, with the reason.',
    path: '/janela/', lang: 'en', appName: 'Janela', brand: 'CERT-MACHINE', homeHref: '/',
    meta: '<span id="jn-run">ECMWF · —</span>',
    topHtml: '<nav class="jn-modes" id="jn-modes" role="tablist" aria-label="Mode"><button type="button" role="tab" data-mode="semana" aria-selected="true">WEEK</button><button type="button" role="tab" data-mode="mes" aria-selected="false">CAMPAIGN</button><button type="button" role="tab" data-mode="placar" aria-selected="false">SCOREBOARD</button></nav>',
    navLinks: [{ href: '/janela/metodo/', label: 'Method ↗' }, { href: 'https://github.com/carlostoledo1891/cert-machine/tree/main/apps/janela', label: 'code' }],
    mapAria: 'Map of the Brazilian margin: every offshore production unit marked with the verdict of the chosen operation at the chosen hour; the wave and wind forecast drawn over it',
    styles: ['vendor/maplibre-gl.css'],
    cssRaw: require('./style.js')(),
    noDock: true, noLeft: true, warrant: true,
    panelHtml: panel(M, N),
    extraHtml: extra(),
    configGlobal: 'JANELA', configJson: json,
    scripts: ['early.js', 'vendor/maplibre-gl.js', 'geo.js', 'app.js']
  });
  fs.writeFileSync(path.join(SITE, 'index.html'), html);
  return { html, bytes: html.length, geo: geoJs.length, fields: G.fields.features.length, places: M.places.length };
}

module.exports = { emit, geo, vendor, shipEnglish };
