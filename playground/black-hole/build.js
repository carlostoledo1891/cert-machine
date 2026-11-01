/* build.js — site/instruments/black-hole/index.html: the M87* viewer (Phase 2).
   playground/black-hole/ · cert-machine · 2026-10-31. Pre-registered in
   notes/black-hole-phase0-preregistration-2026-10-31.md, § Phase 2, before any view off 17° existed.

   THE OPERATOR'S RULINGS (HANDOFF, 2026-10-31): a headline about standing ("every line says what it rests on"), never
   a claim of accuracy; the disk in the ink ramp (greys; the red stays the witness, and nothing here is a witness); the
   thin disk labelled assumed; the camera fixed at 17°, leaving it an explicit control that relabels the view as a
   model; the motion on the real clock, shown; the jet from a licence-clear VLBI image or else an assumed sketch,
   dotted. Controls: spin (the four precomputed values), mass row, the photon-ring layers, the view.

   WHAT THE PAGE READS, and nothing it types:
     certs/bh-shadow.json       Phase 0, DECIDED: every number printed (W.val, re-read by tools/check-marks.js)
     certs/bh-maps-check.json   Phase 1/2, the maps' grade (AGREES); the page refuses a map that does not agree
     corpus/bh-maps/            the maps, COMPUTED: copied byte for byte beside the page and checked in the tab
     playground/black-hole/out/scene.json   the decided curve as a cover of boxes, and the files to load; re-derived
                                here (scene.js derive) and refused unless identical
   The build refuses: a scene that does not re-derive, a map that is not its pin, a stroke thinner than its cover, a
   printed number outside its record (check-marks), the n = 2 layer drawn without its blur. */
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const HERE = __dirname;
const PG = path.join(HERE, '..');
const ROOT = path.join(PG, '..');
const { page, esc } = require(path.join(PG, 'design', 'shell.js'));
const W = require(path.join(PG, 'warrant.js'));
const THEME = require(path.join(PG, 'design', 'theme.js'));
const SC = require(path.join(HERE, 'scene.js'));
const BP = require(path.join(HERE, 'paths.js'));
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
const die = (m) => { throw new Error('black-hole instrument: ' + m); };

const REC = 'certs/bh-shadow.json', CHK = 'certs/bh-maps-check.json', MAN = 'corpus/bh-maps/manifest.json', SCN = 'playground/black-hole/out/scene.json';
const SH = JSON.parse(fs.readFileSync(path.join(ROOT, REC), 'utf8'));
const CK = JSON.parse(fs.readFileSync(path.join(ROOT, CHK), 'utf8'));
const SCENE = JSON.parse(fs.readFileSync(path.join(ROOT, SCN), 'utf8'));
const APP = fs.readFileSync(path.join(HERE, 'app.js'), 'utf8');
const PATHS = fs.readFileSync(path.join(HERE, 'paths.js'), 'utf8');
const CSS = fs.readFileSync(path.join(HERE, 'page.css'), 'utf8');

/* ---- the gates ---- */
if (JSON.stringify(SC.derive()) !== JSON.stringify(SCENE)) die(SCN + ' does not re-derive identically: node playground/black-hole/scene.js');
if (CK.verdict !== 'AGREES') die(CHK + ' does not AGREE');
for (const v of SCENE.views) {
  /* the decided stroke covers its boxes: the drawn width in overlay units is at least strokeM, and strokeM ≥ 2·maxDistM */
  if (!(v.curve.strokeM >= 2 * v.curve.maxDistM)) die('the stroke of ' + v.key + ' is thinner than its cover');
  if (!(v.curve.maxBoxM <= SCENE.cover.boxMaxM)) die('a cover box of ' + v.key + ' is wider than ' + SCENE.cover.boxMaxM + ' M');
}
const STROKE = Math.max(...SCENE.views.map((v) => v.curve.strokeM)) * BP.unitsPerM;            /* overlay units */
const STROKE_TXT = (Math.ceil(STROKE * 10) / 10).toFixed(1);
if (!(Number(STROKE_TXT) >= STROKE)) die('the decided stroke rounds below its cover');
if (!/\(uLay & 4\)[\s\S]{0,120}for \(int dy = -2/.test(APP)) die('the n = 2 layer is no longer drawn blurred; Phase 1 found it unresolved');

const SPINS = { '0': { label: 'a = 0', short: '0' }, '1/2': { label: 'a = 1/2', short: '0.5' }, '47/50': { label: 'a = 47/50 = 0.94 (the chosen default)', short: '0.94' }, '499/500': { label: 'a = 499/500 = 0.998', short: '0.998' } };
const spinD = (s) => (s.includes('/') ? Number(s.split('/')[0]) / Number(s.split('/')[1]) : Number(s));
const DEFAULT = SCENE.defaultSpin;
const DEFAULT_ROW = 'eht2019';
const RATE = 4, EPOCH = 40;
const ROWS = SH.inputs.massRows;
const E = SH.enclosures;
const key = (s) => s.replace(/~/g, '~0').replace(/\//g, '~1');

/* the readouts' values for the tab, read from the record (the printed copies below carry their addresses) */
const SPEC = {
  grid: SCENE.grid.n, mapsDir: 'maps/', record: REC, defaultKey: DEFAULT, defaultSpin: DEFAULT, defaultRow: DEFAULT_ROW,
  tgPerSecond: RATE, epochTg: EPOCH,
  views: SCENE.views.map((v) => ({ key: v.key, spin: v.spin, spinD: spinD(v.spin), inclinationDeg: v.inclinationDeg, model: v.model,
    spinLabel: SPINS[v.spin].label + (v.model ? ', at ' + v.inclinationDeg + '° (a picture of the model)' : ''), iscoKey: v.iscoKey, files: v.files, curve: { points: v.curve.points } })),
  rows: Object.fromEntries(ROWS.map((r) => [r.id, { label: r.label, thetaG: E.thetaG[r.id].uas, pred: E.predictedUas[r.id].band17,
    ratio: E.comparison.rows[r.id]['eht2017-2021'].band17, tgHours: E.clock[r.id].tgHours, iscoDays: E.clock[r.id].iscoDays, circular: !!r.circular }])),
  isco: Object.fromEntries(Object.entries(E.isco.at).map(([k, v]) => [k, v.periodTg]))
};
const dv = SCENE.views.find((v) => v.key === DEFAULT);
const rowIdx = (id) => ROWS.findIndex((r) => r.id === id);
const val = (ptr, standing = W.DECIDED, id) => W.val({ rec: { path: REC, ptr }, standing }).replace('<span ', id ? '<span id="' + id + '" ' : '<span ');

/* ---- the figure: the stage (canvas + overlay) and its caption ---- */
const U = BP.unitsPerM;
const overlay = `<svg id="bh-ov" viewBox="0 0 512 512" role="img" aria-label="The shadow edge of the black hole decided in interval arithmetic and drawn as a solid line over the computed image; the frame of the image is dashed, the jet sketch dotted.">
  <rect x="1" y="1" width="510" height="510" ${W.attrs(W.COMPUTED, { width: 1.5 })}/>
  <path id="bh-jet" d="${BP.jetPath('17', 1)}" ${W.attrs(W.CHOSEN, { width: 1.5 })}/>
  <path id="bh-casing" d="${BP.curvePath(dv.curve.points)}" fill="none" stroke="var(--bg)" stroke-width="${(Number(STROKE_TXT) + 1.2).toFixed(1)}" stroke-linejoin="round" opacity="0.75"/>
  <path id="bh-curve" d="${BP.curvePath(dv.curve.points)}" class="w-decided" fill="none" stroke-width="${STROKE_TXT}" stroke-linejoin="round" data-rec="${SCN}#/views/${SCENE.views.indexOf(dv)}/curve/points"/>
</svg>`;
const recs = [REC, CHK, MAN, SCN].map((r) => r + '@' + sha(r).slice(0, 12));
const figure = `<figure class="bh-fig">
  <div class="bh-stage" id="bh-stage">
    <canvas id="bh-gl" width="512" height="512" aria-hidden="true"></canvas>
    ${overlay}
    <div class="bh-tag" id="bh-viewtag">M87*&rsquo;s view, 17&deg; (assumed, from the jet)</div>
    <div class="bh-time" aria-live="off"><span class="k">t</span> <span class="w-computed" id="bh-t">0</span> t<sub>g</sub> &middot; <span class="k">M87* day</span> <span class="w-computed" id="bh-days">[0.0, 0.0]</span></div>
  </div>
  <figcaption data-record="${esc(recs.join(' '))}" data-stop>The shadow&rsquo;s edge, Bardeen&rsquo;s critical curve, is the one solid line: Phase 0 encloses it in interval arithmetic and the line is drawn at least as wide as the boxes that cover it (${esc(String(SCENE.cover.boxMaxM))} M across at most), so the true curve lies inside it. The image under it is <span class="w-computed">computed</span>: each pixel is a light ray traced backward through the Kerr metric in double precision (the lensing maps, which agree with the decided curve on every pre-registered check) and shaded in your tab as an <em>assumed</em> thin disk, &Sigma; g&sup3;J; its frame is dashed for that standing. The jet is a dotted sketch, <em>chosen</em> to be legible: no jet image is drawn. Every image of the disk shows it at one moment; the light-travel delay between them is not applied.
    <span class="fig-rec">Records: ${recs.map((r) => '<span class="m">' + esc(r.split('@')[0]) + '</span> &middot; sha256 ' + r.split('@')[1]).join('; ')}</span><span class="fig-stop">The build refuses this figure if the scene record does not re-derive from Phase 0&rsquo;s decider, if a map does not agree with the decided curve or is not its pinned file, or if the solid line is drawn thinner than the boxes it covers.</span></figcaption>
</figure>`;

const spinBtns = Object.keys(SPINS).map((s) => `<button type="button" data-spin="${s}" aria-pressed="${s === DEFAULT}">${SPINS[s].short}</button>`).join('');
const viewBtns = ['17'].concat(SCENE.views.filter((v) => v.model).map((v) => v.inclinationDeg))
  .map((d) => `<button type="button" data-view="${d}" aria-pressed="${d === '17'}">${d}&deg;${d === '17' ? ' &middot; M87*' : ' &middot; model'}</button>`).join('');
const row0 = DEFAULT_ROW;
const panel = `<div class="bh-panel">
  <div class="grp"><div class="lab">spin <em>a</em>, <span class="w-chosen">chosen</span>: the data do not constrain it</div><div class="seg" role="group" aria-label="spin">${spinBtns}</div>
    <p class="note" id="bh-spinnote" hidden>Off 17&deg; the maps exist for a = 0.94 only.</p></div>
  <div class="grp"><div class="lab">the view</div><div class="seg" role="group" aria-label="inclination">${viewBtns}</div>
    <p class="note">17&deg; is M87*&rsquo;s view, taken from its jet; leaving it draws a picture of the model.</p></div>
  <div class="grp"><div class="lab">layers</div>
    <label class="ck"><input type="checkbox" data-lay="1" checked> n = 0, the disk seen directly</label>
    <label class="ck"><input type="checkbox" data-lay="2" checked> n = 1, the first photon-ring image</label>
    <label class="ck"><input type="checkbox" data-lay="4"> n = 2, unresolved: narrower than one pixel of the maps, so drawn blurred, never as a line</label></div>
  <div class="grp"><label class="lab" for="bh-row">mass row</label>
    <select id="bh-row">${ROWS.map((r) => `<option value="${r.id}"${r.id === row0 ? ' selected' : ''}>${esc(r.label)}</option>`).join('')}</select>
    <dl class="rd">
      <dt>&theta;<sub>g</sub> = GM/c&sup2;D, &micro;as</dt><dd>${val('/enclosures/thetaG/' + row0 + '/uas', W.DECIDED, 'bh-tg')}</dd>
      <dt>the shadow, d&#772; over every spin at 17&deg;, &micro;as</dt><dd>${val('/enclosures/predictedUas/' + row0 + '/band17', W.DECIDED, 'bh-pred')}</dd>
      <dt>the ring the EHT measures</dt><dd>${W.val({ rec: { path: REC, ptr: '/inputs/rings[id=eht2017-2021]/published' }, standing: W.COMPUTED })}</dd>
      <dt>ring &divide; shadow, <em>compared</em></dt><dd>${val('/enclosures/comparison/rows/' + row0 + '/eht2017-2021/band17', W.DECIDED, 'bh-ratio')}</dd>
    </dl>
    <p class="note" id="bh-circ"${ROWS[rowIdx(row0)].circular ? '' : ' hidden'}>This row&rsquo;s &theta;<sub>g</sub> was fitted to the 2017 ring with the GRMHD calibration, so the ratio returns that calibration: printed, never a test.</p></div>
  <div class="grp"><div class="lab">the clock</div>
    <dl class="rd">
      <dt>one second here</dt><dd><span class="w-chosen">4</span> t<sub>g</sub> = <span class="w-computed" id="bh-speedh">&hellip;</span> h of M87* (t<sub>g</sub> = ${val('/enclosures/clock/' + row0 + '/tgHours', W.DECIDED, 'bh-tgh')} h, <span id="bh-rowlabel">${esc(ROWS[rowIdx(row0)].label)}</span>)</dd>
      <dt>the inner edge goes round in</dt><dd>${val('/enclosures/isco/at/' + key(dv.iscoKey) + '/periodTg', W.DECIDED, 'bh-iscotg')} t<sub>g</sub> = ${val('/enclosures/clock/' + row0 + '/iscoDays/' + key(dv.iscoKey), W.DECIDED, 'bh-iscod')} days, <span class="w-chosen" id="bh-iscos">&hellip;</span> s here (<span id="bh-spinlabel">${esc(SPINS[DEFAULT].label)}</span>)</dd>
    </dl>
    <p class="note" id="bh-reduce" hidden>Your system asks for reduced motion, so the clock stands still at t = 0.</p></div>
  <div class="grp tiny"><span class="lab">drawn by</span> <span id="bh-renderer">&hellip;</span>. <span id="bh-pin">The map files are checked against their pinned sha256 as they load.</span></div>
</div>`;

/* ---- below the viewer: the standing, the mass rows, the clock, what it does not show, the sources ---- */
const P = [
  { grade: W.ASSUMED, label: 'The Kerr metric', evidence: 'general relativity, an uncharged black hole in vacuum, no plasma lensing: adopted, not checked here' },
  { grade: W.ASSUMED, label: 'The inclination, 17°', evidence: 'from the jet’s motions (Mertens et al. 2016, 17.2° ± 3.3°); the EHT’s 163° is the same curve mirrored' },
  { grade: W.ASSUMED, label: 'The spin, swept over four values', evidence: 'the data constrain nothing; 0.94 is the chosen default' },
  { grade: W.VERIFIED, label: 'The ray tracer (instruments/kerr/rays.js)', evidence: 'its crossings against Gralla & Lupsasca’s closed form and its shadow against Phase 0’s decided curve: AGREES on every check, at every map (certs/bh-maps-check.json)' },
  { grade: W.ASSUMED, label: 'The thin disk and its emission', evidence: 'equatorial, prograde Keplerian, cut at the ISCO, optically thin, J ∝ r⁻², I = Σ g³J; the brightness pattern that turns with it is chosen to be legible' },
  { grade: W.COMPARED, label: 'The ring-to-shadow factor (the mass-row comparison only)', evidence: 'calibrated on GRMHD in the EHT’s Paper VI; a thin disk’s lensing ring sits about 5 % outside the curve (Gralla, Holz & Wald 2019)' },
];
const standingRows = [
  ['the shadow&rsquo;s edge (the critical curve)', 'the solid line', '<span class="w-decided">decided</span>', 'Phase 0: interval enclosure by two deciders that share no code; drawn as a cover of boxes, the line wider than any of them'],
  ['the image of the disk and its photon rings', 'the grey field, its frame dashed', '<span class="w-computed">computed</span>', 'rays traced in double precision through the Kerr metric (the lensing maps), graded against the decided curve; shaded in float32 in your tab'],
  ['the disk, its brightness and its motion', 'the pattern in the grey field', '<em>assumed</em>', 'a thin disk on Keplerian orbits; the pattern turns at Ω(r) = 1/(r<sup>3/2</sup> + a) per t<sub>g</sub>, born and faded every 40 t<sub>g</sub>'],
  ['the spin', 'the pressed button', '<span class="w-chosen">chosen</span>', 'four precomputed values; the decided band over every spin is in the table below'],
  ['the view', '17&deg; (or 45&deg;, 80&deg; as a model)', '<em>assumed</em>', 'M87*&rsquo;s inclination from its jet; the other two are pictures of the model'],
  ['the jet', 'the dotted funnel', '<span class="w-chosen">chosen</span>', 'an assumed sketch; no jet image is drawn'],
  ['the clock', 't in t<sub>g</sub> and M87* days', '<span class="w-decided">decided</span> &times; <span class="w-chosen">chosen</span>', 't<sub>g</sub> per mass row and the ISCO periods are Phase 0&rsquo;s; four t<sub>g</sub> a second is chosen; the elapsed time is measured by your browser'],
];
const tbl = (head, rows) => `<div class="tw"><table class="bh-t"><thead><tr>${head.map((h) => '<th>' + h + '</th>').join('')}</tr></thead><tbody>${rows.map((r) => '<tr>' + r.map((c) => '<td>' + c + '</td>').join('') + '</tr>').join('')}</tbody></table></div>`;
const massRows = ROWS.map((r) => [esc(r.label) + '<div class="src">' + esc(r.source) + '</div>',
  val('/enclosures/thetaG/' + r.id + '/uas'), val('/enclosures/predictedUas/' + r.id + '/band17'), val('/enclosures/predictedUas/' + r.id + '/bandIncl'),
  val('/enclosures/comparison/rows/' + r.id + '/eht2017-2021/band17')]);
const clockRows = Object.keys(SPINS).map((s) => [esc(SPINS[s].label), val('/enclosures/isco/at/' + key(s + ' pro') + '/r'), val('/enclosures/isco/at/' + key(s + ' pro') + '/periodTg'),
  ...ROWS.map((r) => val('/enclosures/clock/' + r.id + '/iscoDays/' + key(s + ' pro')))]);
const sources = SH.priorArt.concat(ROWS.map((r) => r.source), SH.inputs.rings.map((r) => r.source),
  ['Mertens et al. 2016, A&A 595, A54 — the inclination, from the jet', 'instruments/kerr/rays.js and certs/bh-maps-check.json — the lensing maps (Phase 1) and their grade']);

const body = `
<header class="hero"><div class="wrap">
  <div class="eyebrow">Carlos Toledo &middot; instruments &middot; the black hole in M87</div>
  <h1>Every line on this black hole says what it rests on.</h1>
  <p class="lede">M87*, the black hole the Event Horizon Telescope imaged, drawn so that each element carries its standing. The edge of its shadow is decided in interval arithmetic and drawn solid. The image is computed, ray by ray, through the Kerr metric and drawn as computed. The glowing disk is an assumed thin disk, and it turns at its Keplerian rate on M87*&rsquo;s own clock, sped up and shown. Nothing here models the plasma, and the page says where the assumptions begin.</p>
</div></header>

<section class="wrap">
  <div class="bh-wrap">
    <div>${figure}
    <div class="bh-legend">${W.legendHtml({ compact: true, from: overlay + panel })}</div></div>
    ${panel}
  </div>
</section>

<section class="wrap">
  <h2>What each line rests on</h2>
  ${tbl(['element', 'drawn as', 'standing', 'what it rests on'], standingRows)}
  <p class="prose">The chain the image travelled through, in order, each premise with the grade its checking reached:</p>
  ${W.premisesHtml(P, { meetLine: 'The image is as checked as its weakest premise: <b>assumed</b>, the thin disk. The shadow&rsquo;s edge rests only on the Kerr metric, the spin and the view.' })}
</section>

<section class="wrap">
  <h2>The shadow against the ring, per mass row</h2>
  <p class="prose">The size of the shadow on the sky is the curve&rsquo;s mean diameter d&#772; in M times &theta;<sub>g</sub> = GM/c&sup2;D, and &theta;<sub>g</sub> for a dynamical mass does not depend on the distance assumed (the mass scales with it). The EHT measures a ring of ${W.val({ rec: { path: REC, ptr: '/inputs/rings[id=eht2017-2021]/published' }, standing: W.COMPUTED })}. The ring is not the shadow&rsquo;s edge: the factor between them is <em>calibrated</em> on simulations, so the last column is the factor each row would need, <em>compared</em>, never a verdict on the black hole, on general relativity, or on which mass is right.</p>
  ${tbl(['mass row', '&theta;<sub>g</sub>, &micro;as', 'shadow over every spin, 17&deg;, &micro;as', 'over 13.9&ndash;20.5&deg;', 'ring &divide; shadow'], massRows)}
  <p class="prose">The EHT row&rsquo;s &theta;<sub>g</sub> was fitted to the 2017 ring with that calibration, so its ratio returns the calibration. The last column of the gas-dynamical row (Walsh et al. 2013) starts above every other row&rsquo;s; the stellar rows and the EHT&rsquo;s own overlap. Every interval is printed outward from certs/bh-shadow.json.</p>
</section>

<section class="wrap">
  <h2>The clock</h2>
  <p class="prose">The disk turns as a disk of matter on circular orbits would: at radius r its pattern goes round once every 2&pi;(r<sup>3/2</sup> + a) t<sub>g</sub>, where t<sub>g</sub> = GM/c&sup3; is the black hole&rsquo;s own unit of time. Here one second of the screen is <span class="w-chosen">four</span> t<sub>g</sub>, and the clock on the image counts t<sub>g</sub> from the moment the page opened and prints them as days of M87*, an interval because the mass is one. The inner edge turns fastest, the outer disk slowest, so the pattern shears and never returns: the picture does not loop, and nothing resets it. Its features are born and fade every 40 t<sub>g</sub> (assumed), so the shear never winds the disk into stripes. The periods at the inner edge, the ISCO of Bardeen, Press &amp; Teukolsky, decided in Phase 0:</p>
  ${tbl(['spin', 'r<sub>isco</sub>, M', 'period, t<sub>g</sub>', ...ROWS.map((r) => 'days, ' + esc(r.label))], clockRows)}
  <p class="prose">These are coordinate times at infinity in the hole&rsquo;s rest frame; an observer on Earth sees them stretched by M87&rsquo;s redshift, not applied here.</p>
</section>

<section class="wrap">
  <h2>What this does not show</h2>
  <ul class="plain">
    <li><b>The plasma.</b> No magnetohydrodynamics, no electron temperatures, no polarization: the disk is a thin, optically thin sheet with J &prop; r<sup>&minus;2</sup>, cut at the ISCO. What M87* looks like is set by its plasma, and the plasma is assumed. This is why the page claims a standing for each line and nothing more.</li>
    <li><b>The second photon ring.</b> The n = 2 image is far narrower than one pixel of the maps; the layer only samples it, so it is drawn blurred and labelled unresolved. No photon ring has been detected in M87*: every ring layer here is the model&rsquo;s.</li>
    <li><b>Light-travel time.</b> The maps carry no arrival time, so every image of the disk is drawn at one moment; a real n = 1 image arrives later than the direct one.</li>
    <li><b>The sky&rsquo;s orientation.</b> The image is in the black hole&rsquo;s frame, the spin axis up; it is not rotated to M87*&rsquo;s position angle.</li>
    <li><b>The jet.</b> No jet image is used. The 230 GHz data do not image the jet at this scale, and the jet maps at lower frequencies were not checked for a licence here; the funnel is a dotted sketch, chosen.</li>
    <li><b>The ring the EHT measures.</b> It is compared in the table above and not drawn over the image; that is the next step, with the interferometer&rsquo;s data-allowed set (<a href="../interferometer/index.html">the interferometer</a>).</li>
  </ul>
</section>

<section class="wrap">
  <h2>Sources</h2>
  <ul class="plain src">${sources.map((s) => '<li>' + esc(s) + '</li>').join('')}</ul>
  <p class="prose">The decided layer, its pre-registration and every deviation: notes/black-hole-phase0-preregistration-2026-10-31.md (Phases 0, 1 and 2), certs/bh-shadow.json and certs/bh-maps-check.json, re-derived by <span class="m">tools/run-bh-shadow.js --check</span> and <span class="m">tools/run-bh-maps.js --check</span> in the test suite.</p>
</section>`;

function build(OUT) {
  const dir = path.join(OUT, 'black-hole'), mdir = path.join(dir, 'maps');
  fs.mkdirSync(mdir, { recursive: true });
  /* the maps beside the page, byte for byte; nothing else in maps/ */
  const want = new Set();
  for (const v of SCENE.views) for (const f of Object.values(v.files)) {
    if (f.name.includes('fate')) continue;
    const src = path.join(ROOT, 'corpus', 'bh-maps', f.name);
    if (sha('corpus/bh-maps/' + f.name) !== f.sha256) die(f.name + ' is not the pinned file');
    want.add(f.name);
    const dst = path.join(mdir, f.name);
    if (!fs.existsSync(dst) || crypto.createHash('sha256').update(fs.readFileSync(dst)).digest('hex') !== f.sha256) fs.copyFileSync(src, dst);
  }
  for (const f of fs.readdirSync(mdir)) if (!want.has(f)) fs.unlinkSync(path.join(mdir, f));
  const html = page({
    title: 'Every line on this black hole says what it rests on',
    desc: 'M87*’s black hole drawn with each element’s standing: the shadow’s edge decided in interval arithmetic and drawn solid, the image computed by rays traced through the Kerr metric, the thin disk assumed and turning on M87*’s own clock.',
    path: '/instruments/black-hole/', body, css: CSS + THEME.CSS,
    script: `<script id="bh-spec" type="application/json">${JSON.stringify(SPEC).replace(/</g, '\\u003c')}</script>\n<script>${THEME.CLIENT}</script>\n<script>${PATHS}</script>\n<script>${APP}</script>`
  });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return { bytes: html.length, maps: want.size, mapBytes: [...want].reduce((t, f) => t + fs.statSync(path.join(mdir, f)).size, 0), views: SCENE.views.length };
}

/* the card: the decided curve at the default spin inside the image frame; plain ink, no grammar marks (a card is not a figure with a record) */
function cardArt() {
  const S0 = 560, k = 28;                                            /* ±10 M across the card */
  const P = dv.curve.points;
  let d = '';
  for (let i = 0; i < P.length; i += 2) d += (i ? 'L' : 'M') + ((P[i] + 10) * k).toFixed(1) + ' ' + ((10 - P[i + 1]) * k).toFixed(1);
  return `<svg viewBox="0 0 ${S0} ${S0}" class="shape" role="img" aria-label="The shadow edge of M87* at spin 0.94, seen from 17 degrees, inside the frame of the image.">`
    + `<rect x="14" y="14" width="${S0 - 28}" height="${S0 - 28}" rx="6" fill="none" stroke="currentColor" stroke-opacity="0.25" stroke-width="1.2"/>`
    + `<path d="${d}Z" fill="none" stroke="currentColor" stroke-width="3"/></svg>`;
}

module.exports = { build, cardArt, facts: { views: SCENE.views.length, spins: Object.keys(SPINS).length } };
