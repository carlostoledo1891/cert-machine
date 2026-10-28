#!/usr/bin/env node
/* build-report-ember.js — generate reports/ember.html: the hot-spots
   theorem. tools/ · cert-machine

   The research report for the certified hot-spots domain: the trapezoid,
   the six-stage certificate chain, the zone map drawn from the SAME exact
   rational cell decisions the proof uses, the corner table, and the
   ladder identity — every number read from a VERIFIED record in certs/
   at build time; the build refuses if any record is missing, refused, or
   drifted, if the claim appears without its fence list, or if any
   workshop narrative reaches the page.

   usage: node tools/build-report-ember.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const CH = require(path.join(ROOT, 'design', 'charts.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const SP = require(path.join(ROOT, 'instruments', 'hotspots', 'specimen.js'));
const die = (m) => { console.error('EMBER REPORT REFUSED: ' + m); process.exit(1); };
const gitrev = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

/* ---- inputs, gated ---- */
const rd = (f) => { const p = path.join(ROOT, 'certs', f); if (!fs.existsSync(p)) die('missing certs/' + f); return JSON.parse(fs.readFileSync(p, 'utf8')); };
const R = {};
for (const st of ['spectrum', 'defect', 'eigenpair', 'pointwise', 'collar', 'corner', 'cross', 'theorem']) {
  R[st] = rd('ember-' + st + '.json');
  if (R[st].verdict !== 'VERIFIED') die('ember-' + st + ' not VERIFIED');
}
const pin = require(path.join(ROOT, 'instruments', 'pin.js')).verify('liu2018_arxiv-1808-08148.pdf');
if (!pin.ok) die('Liu pin drifted: ' + pin.why);

/* WARRANT v2.2 (design/WARRANT.md), 2026-10-28. Every number on this page is decided (interval or exact rational
   arithmetic) unless it is marked; what the float steering saw and what a clock measured are COMPUTED. Every printed
   bound moves OUTWARD through design/outward.js, exactly (a double expanded to its decimal, never multiplied): this file
   kept a private float copy of that rule, and seven prints went the wrong way around it — lower bounds printed rounded up
   (−φ̂(w₋′) ≥ 1.993811 for 1.9938107…, φ̂_nn ≥ 13.04 for 13.0399…, the band's μ₂ ≥ 13.90774 for 13.9077384…, C_tr's lower
   end 2.6426189450 for 2.64261894499…) and upper bounds printed below their value (tip C's sup b₁ = −0.8791 for
   −0.87908…, corner A's worst ∂rφ̂ −4.99e-2 for −0.049888…). The theorem stands on cited lemmas; they are named, graded,
   beside the chain (rule 11). */
const W = require(path.join(ROOT, 'playground', 'warrant.js'));
const OUT = require(path.join(ROOT, 'design', 'outward.js'));
const ivStr = (a, dp) => OUT.enc(a, dp === undefined ? 4 : dp);
const lo = (x, d) => OUT.down(x, d), hi = (x, d) => OUT.up(x, d);          /* a lower / an upper bound, fixed decimals */
const sLo = (x) => OUT.sci(x, 2, false), sHi = (x) => OUT.sci(x, 2, true);   /* the same, three significant digits */
const steer = (t) => W.value(t, W.COMPUTED, { title: 'float steering — the record says "no claim": computed, not decided' });
const clock = (t) => W.value(t, W.COMPUTED, { title: 'a wall-clock time, measured: not decided' });

const MU1 = R.eigenpair.mu1;
const WITP = R.pointwise.witnesses.max.value;
const WITM = R.pointwise.witnesses.minDeep.value;

/* ---- THE TYPED NUMBERS (WARRANT rule 8), read from their records ----
   Until 2026-10-28 the chain table said "19 checks, all green" over a theorem record that holds 23, the reproduce block
   said the Γ/Bessel battery has "69 checks, 5 reds" (it has more), the stat strip printed the WIDTH of μ₁'s enclosure
   under the label "μ₁ enclosure", and "105×", "0.0195", "−1.9998", "ν − 2 ≈ −0.19" and "~2 min" were typed by hand. */
const THM_CHECKS = R.theorem.checks;
if (!THM_CHECKS.length || THM_CHECKS.some((c) => !c.ok)) die('the theorem record\'s checks are not all green');
const TIGHT = (R.spectrum.mu1[1] - R.spectrum.mu1[0]) / (MU1[1] - MU1[0]);              /* a float ratio of two decided widths */
if (Math.abs((MU1[1] - MU1[0]) - R.eigenpair.mu1width) > 1e-15) die('the eigenpair record\'s width is not its enclosure\'s');
const BM = R.pointwise.boundaryLandscape;                                                  /* float steering: "no claim" */
const VC = [17 / 20, 9 / 10];
const dMinC = VC[0] - BM.min.x;
if (!(BM.min.y === VC[1] && /float steering only/.test(BM.note) && /float −1\.9998 at distance 0\.0195 from C/.test(R.theorem.corollary.minimumLocation)
  && dMinC.toFixed(4) === '0.0195' && BM.min.v.toFixed(4) === '-1.9998')) die('the observed boundary minimum moved off the top edge, or from the record\'s −1.9998 at 0.0195 from C');
/* ν at corner C = π / (interior angle at C), the angle between CB and CD, in floats */
const nuC = (() => { const cb = [1 - VC[0], 0 - VC[1]], cd = [1 / 4 - VC[0], 0]; const ang = Math.acos((cb[0] * cd[0] + cb[1] * cd[1]) / (Math.hypot(...cb) * Math.hypot(...cd))); return Math.PI / ang; })();
const RTIP = R.corner.RTIP;
if (!(RTIP === 0.11 && /the C wedge to 0\.12/.test(R.corner.statement) && R.pointwise.I0 === '5/48' && R.cross.I0 === '5/48' && R.pointwise.core.depthFloor === '3/40'
  && R.theorem.partition.grid === '1/100' && Object.keys(R.pointwise.witnesses).length === 3)) die('r ≤ 0.11, the C wedge, I₀ = 5/48, depth 3/40, the 1/100 grid or the three witnesses moved in their records');
const LIT = R.theorem.trustBase.filter((t) => /LITERATURE INPUT/.test(t));
if (!(LIT.length === 2 && /Liu framework Thm 2\.4/.test(LIT[0]) && /CR interpolation constant 0\.1893·h_K/.test(LIT[1]))) die('the two literature inputs moved in the theorem record\'s trust base');
const CLASSICAL = R.theorem.trustBase.find((t) => /^classical facts/.test(t)) || die('the classical facts are gone from the trust base');
const chainSecs = ['spectrum', 'defect', 'eigenpair', 'pointwise', 'collar', 'corner', 'cross', 'theorem'].reduce((s, k) => s + R[k].secs, 0);
const chainMin = Math.round(chainSecs / 60);
/* the batteries the reproduce block names, run here and counted (they take about a second together) */
const runBat = (rel) => { try { return cp.execFileSync(process.execPath, [path.join(ROOT, rel)], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { die(rel + ' did not pass:\n' + (e.stdout || e.message)); } };
const batCount = (out, re) => { const m = re.exec(out); if (!m) die('a battery line moved: ' + re); return Number(m[1]); };
const HS = runBat('instruments/hotspots/battery.js'), IV = runBat('instruments/ivspecial/battery.js');
const hsPass = batCount(HS, /hotspots battery: (\d+) pass, 0 fail/), hsReds = (HS.match(/^PASS\s+RED/gm) || []).length;
const ivPass = batCount(IV, /ivspecial battery: (\d+) pass, 0 fail/), ivReds = (IV.match(/^PASS\s+RED/gm) || []).length;
if (!(hsReds >= 5 && ivReds >= 1)) die('the batteries\' red controls no longer show');

/* ---- THE BAND (P3a): the family result that subsumes this specimen ----
   Read from certs/ember-band.json, which tools/run-ember-band.js writes only
   after instruments/emberband/verify-band.js VERIFIES both covering ladders.
   The page refuses if the band record is present but does not contain this
   domain, so the two statements can never drift apart. */
const BANDP = path.join(ROOT, 'certs', 'ember-band.json');
const BAND = fs.existsSync(BANDP) ? JSON.parse(fs.readFileSync(BANDP, 'utf8')) : null;
if (BAND) {
  const iv = BAND.audited.interval;
  if (!(iv[0] <= 0.85 && 0.85 <= iv[1])) die('the band record does not cover this page\'s specimen c = 17/20');
  if (BAND.audited.chunks !== 17) die('the band record no longer carries 17 chunks');
  for (const w of ['Judge', 'de Dios Pont']) if (!BAND.fences.includes(w)) die('the band record lost the fence naming ' + w);
}
/* "All eight must fire or the page does not build" (§B) was not true until 2026-10-28: nothing here ran the band's battery */
const EB = BAND ? runBat('instruments/emberband/battery.js') : '';
const ebm = /ember band battery: (\d+) pass, 0 fail, (\d+)\/(\d+) red controls fired/.exec(EB);
if (BAND && !(ebm && ebm[2] === ebm[3] && ebm[3] === '8')) die('the band battery did not fire its eight red controls');
if (BAND && !/~10 h/.test(BAND.scope)) die('the band record no longer gives the chain\'s running time (~10 h)');
const BAND_RECS = BAND ? ((/its (\d+) certified stage records/.exec(BAND.scope) || die('the band record no longer counts its stage records'))[1]) : null;
/* the symmetric-quadrangle fence: six authors on the pinned arXiv abstract page (Zou was missing from the page and
   both records until 2026-10-06); every place that names them must carry the same list */
const SYMQ = 'ember/arxiv-2604.19003-abs_2026-10-06.html';
{ const v = require(path.join(ROOT, 'instruments', 'pin.js')).verify(SYMQ); if (!v.ok) die('pinned source ' + SYMQ + ': ' + v.why); }
const SYMQ_AUTH = [...fs.readFileSync(path.join(ROOT, 'corpus', 'sources', SYMQ), 'utf8')
  .matchAll(/<meta name="citation_author" content="([^,"]+),/g)].map((m) => m[1]).join('–');
if (SYMQ_AUTH !== 'Deng–Gui–Jiang–Yang–Yao–Zou') die('the pinned arXiv:2604.19003 page lists ' + SYMQ_AUTH);
if (BAND && !BAND.fences.includes(SYMQ_AUTH + ' arXiv:2604.19003')) die('the band record names arXiv:2604.19003\'s authors differently from the pinned page — run tools/run-ember-band.js');
if (!R.theorem.honestFraming.fences.some((f) => f.includes(SYMQ_AUTH + ', arXiv:2604.19003'))) die('the theorem record names arXiv:2604.19003\'s authors differently from the pinned page — run tools/run-ember-chain.js theorem');

/* ================================================================ the page */
const O = [];

O.push(C.header({
  eyebrow: 'cert-machine · spectral geometry · rebuilt from certificates at every build',
  title: 'The hot spot stays on the boundary',
  deck: (BAND ? 'Not one domain but a CONTINUUM of them: for every c in [' + BAND.audited.interval[0] + ', '
    + BAND.audited.interval[1] + '] the convex trapezoid A(0,0) B(1,0) C(c,9/10) D(1/4,9/10) — no symmetry axis, '
    + 'outside every analytically proven class — has a simple second Neumann eigenvalue whose eigenfunction '
    + 'attains its extrema on the boundary only. To our knowledge the first certified hot-spots result for a '
    + 'positive-measure FAMILY rather than a single specimen. The domain below, c = 17/20, is the right endpoint '
    + 'and is where the program started. '
    : '')
    + 'The domain treated in full below is that endpoint: a convex trapezoid with no symmetry axis, whose '
    + 'second Neumann eigenfunction attains its maximum and its minimum on the boundary only. And more precisely: the maximum is attained AT VERTEX A, and only there — '
    + 'certified, with φ̂(A) ∈ ' + ivStr(R.theorem.corollary.phiAtA, 6) + '. One domain, one theorem, one '
    + 'corollary: μ₁ is simple, its enclosure is ' + ivStr(MU1, 9) + ', and every interior point is excluded by '
    + 'a certified cell of an exact partition. Floats propose; interval and rational arithmetic decide.',
}));

O.push(C.stats([
  { k: 'the domain', v: 'A B C D', n: '(0,0) · (1,0) · (17/20, 9/10) · (1/4, 9/10) — exact rationals; convex, side slopes 6 and 18/5, no symmetry axis, not a lip domain' },
  /* the WIDTH, printed up (the enclosure is at most this wide); the stat was labelled "μ₁ enclosure" until 2026-10-28 */
  { k: 'μ₁ enclosure, width', v: sHi(R.eigenpair.mu1width), n: 'μ₁ ∈ ' + ivStr(MU1, 9) + ', simple (certified spectral gap: μ₂ ≥ ' + lo(R.spectrum.mu2lo, 4) + ')' },
  { k: 'the partition', v: (R.theorem.partition.coreCells + R.theorem.partition.collarCells).toLocaleString('en-US') + ' cells', n: 'core ' + R.theorem.partition.coreCells + ' + collar ' + R.theorem.partition.collarCells + ' on the ' + R.theorem.partition.grid + ' grid, classes decided in exact rationals; four corner sectors close the rest — zero surviving cells' },
  { k: 'the band', v: BAND ? 'c ∈ [' + BAND.audited.interval[0] + ', ' + BAND.audited.interval[1] + ']' : 'not built', role: 'held', n: BAND ? BAND.audited.chunks + ' chunks tiling the interval with shared endpoints and no gap, ' + BAND.audited.sigmaCells.toLocaleString('en-US') + ' σ-cells inside them — both ladders re-derived by an independent auditor; μ₁ ≥ ' + lo(BAND.audited.mu1LowerUniform, 5) + ' and μ₂ ≥ ' + lo(BAND.audited.mu2LowerUniform, 5) + ' uniformly, so μ₁ is simple for every c' : 'run tools/run-ember-band.js' },
  /* the record keeps these two at three digits; they print as recorded (a decimal string, not the double's expansion) */
  { k: 'band margins', v: BAND ? sLo(String(BAND.audited.marginPMin)) + ' / ' + sLo(String(BAND.audited.marginMMin)) : '—', role: 'held', n: BAND ? 'the thinnest zone margins over all ' + BAND.audited.sigmaCells.toLocaleString('en-US') + ' cells of all ' + BAND.audited.chunks + ' chunks, max and min side, as the audit records them; zero collar survivors outside the corner windows anywhere' : '' },
  { k: 'trust base', v: LIT.length + ' inputs', n: 'two quoted lemmas of Liu (arXiv:1808.08148, pinned sha256 ' + pin.sha256.slice(0, 12) + '…), named in every record, and the textbook facts the records list beside them (see what the theorem rests on, below); everything else re-derives here' },
]));
/* the marks, said once (WARRANT rule 9) */
O.push('<div class="col">' + C.note({ lab: 'how to read the marks', bodyRaw: C.pRaw('Every number on this page is decided by interval or exact rational arithmetic unless it is marked, and every printed bound is rounded outward. '
  + 'Underlined dashed: nothing decided it — where the float steering saw the boundary minimum, a float angle, a wall-clock time. '
  + 'The theorem holds <i>given two lemmas of Liu, cited and pinned</i>; what it rests on, and how far each premise was checked, is listed under the certificate chain.')
  + W.legendHtml({ exclude: [W.CHOSEN, W.REFUSED], compact: true }) }) + '</div>');

O.push(C.scope('Machine-derived; published from this repository; not peer-reviewed; not independently rerun. '
  + 'The claim is fenced: Judge–Mondal proved all triangles (Annals 2020, after partial acute-triangle results, '
  + 'Siudeja arXiv:1308.3005), lip domains are Atar–Burdzy, certain non-convex L-tiled polygons are Hatcher '
  + '(arXiv:2405.19508), and symmetric quadrangle subcases are ' + SYMQ_AUTH + ' (arXiv:2604.19003) — this '
  + 'domain sits outside each class. In the other direction, in sufficiently high dimension the conjecture is '
  + 'FALSE for convex sets (de Dios Pont, arXiv:2412.06344), so the planar convex case is exactly where it '
  + 'remains expected — and where this domain lives. A validated-numerics route to acute triangles was developed '
  + 'in the Polymath7 project before the analytic triangle proof; it is lineage here, not a fence. The claim is '
  + 'ONE domain, never the quadrilateral conjecture. Race watch: arXiv, weekly. Every number on this page comes '
  + 'from a VERIFIED record in certs/ember-*.json; the chain re-runs in about ' + (chainMin === 1 ? 'a minute' : chainMin + ' minutes') + ' (its records\' own timings).'));

/* ---------------------------------------------------------- the zone map */
{
  const W = 880, H = 560, L = 60, RM = 24, T = 26, B = 90;
  const pw = W - L - RM, ph = H - T - B;
  const sc = Math.min(pw / 1.0, ph / 0.9);
  const px = v => L + v * sc;
  const py = v => T + (0.9 - v) * sc + (ph - 0.9 * sc) / 2;
  const paths = { core: [], collar: [], tip: [] };
  for (let ix = 0; ix < 100; ix++) {
    for (let iy = 0; iy < 90; iy++) {
      const x0 = SP.rat(ix, 100), y0 = SP.rat(iy, 100), h = SP.rat(1, 100);
      const x1 = SP.radd(x0, h), y1 = SP.radd(y0, h);
      const cs = SP.cellCorners(x0, x1, y0, y1);
      let cls = null;
      if (SP.cellInTipQ(cs)) cls = 'tip';
      else if (!SP.cellTouchesSubCoreQ(cs)) cls = 'core';
      else if (SP.cellMeetsDomainQ(x0, x1, y0, y1)) cls = 'collar';
      if (!cls) continue;
      const x = px(ix / 100), y = py((iy + 1) / 100);
      const w = px((ix + 1) / 100) - x, hh = py(iy / 100) - y;
      paths[cls].push('M' + x.toFixed(1) + ' ' + y.toFixed(1) + 'h' + w.toFixed(1) + 'v' + hh.toFixed(1) + 'h-' + w.toFixed(1) + 'z');
    }
  }
  /* "drawn from those same decisions": the three counts drawn must be the theorem record's */
  const PT = R.theorem.partition;
  if (!(paths.core.length === PT.coreCells && paths.collar.length === PT.collarCells && paths.tip.length === PT.tipCells))
    die('the zone map draws ' + paths.core.length + '/' + paths.collar.length + '/' + paths.tip.length + ' core/collar/tip cells, the theorem record holds ' + PT.coreCells + '/' + PT.collarCells + '/' + PT.tipCells);
  const VFl = SP.VF;
  const outline = 'M' + VFl.map(p => px(p[0]).toFixed(1) + ' ' + py(p[1]).toFixed(1)).join('L') + 'Z';
  const svg = [CH.open({ w: W, h: H, alt: 'zone map of the trapezoid: core cells, collar cells, and the four corner sectors, with the certified witnesses' })];
  /* THE TIPS ARE A BODY (WARRANT, 2026-10-28). They were hatched, and on this site a hatch is the void: "nothing was
     enclosed here" (design/charts.js HATCH_DEF), the grammar's REFUSED. The tip cells are the opposite, decided in exact
     rationals and closed by the corner lemmas, so they take a filled grey of the categorical set, the third step of the
     lightness order the core and collar already use; the witness diamonds that sit inside two of them move to the
     lightest grey so they stay visible on it */
  svg.push('    <path d="' + paths.core.join('') + '" fill="var(--c-3)" fill-opacity="0.55"/>');
  svg.push('    <path d="' + paths.collar.join('') + '" fill="var(--c-1)" fill-opacity="0.5"/>');
  svg.push('    <path d="' + paths.tip.join('') + '" fill="var(--c-2)"/>');
  svg.push('    <path d="' + outline + '" fill="none" stroke="var(--c-axis)" stroke-width="1.5"/>');
  const lbl = [['A', -10, 18, 'end'], ['B', 10, 18, 'start'], ['C', 14, 2, 'start'], ['D', -14, 2, 'end']];
  VFl.forEach((p, i) => svg.push(CH.txt(px(p[0]) + lbl[i][1], py(p[1]) + lbl[i][2], lbl[i][0] + ' (' + SP.VERT_STR[i].replace(/[()]/g, '') + ')', 't-note', lbl[i][3])));
  /* a label that sits on a filled cell keeps the figure's ground around its glyphs (no new colour: the ground itself) */
  const HALO = ' paint-order="stroke" stroke="var(--sunk)" stroke-width="3" stroke-linejoin="round"';
  /* witnesses: interior diamonds; boundary extrema: marks on the boundary */
  const wit = [
    { w: R.pointwise.witnesses.max, t: 'w₊ · φ̂ ≥ ' + lo(WITP, 4), dx: 10, anchor: 'start', dy: 16 },
    { w: R.pointwise.witnesses.minDeep, t: 'w₋′ · −φ̂ ≥ ' + lo(WITM, 4), dx: -12, anchor: 'end', dy: 22 },
  ];
  for (const { w, t, dx, anchor, dy } of wit) {
    const x = px(w.x), y = py(w.y);
    svg.push('    <path d="M' + x.toFixed(1) + ' ' + (y - 6).toFixed(1) + 'l6 6l-6 6l-6 -6z" fill="var(--c-1)" stroke="var(--paper)" stroke-width="1"><title>' + C.escAttr(t) + '</title></path>');
    svg.push(CH.txt(x + dx, y + dy, t, 't-note', anchor, HALO));
  }
  const bm = R.pointwise.boundaryLandscape;
  svg.push(CH.txt(px(bm.max.x) + 16, py(bm.max.y) - 28, 'boundary max (at A)', 't-ax', 'start', HALO));
  svg.push(CH.txt(px(0.55), py(bm.min.y) - 10, 'boundary min (float steering) →', 't-ax', 'middle'));
  svg.push(CH.legend([
    { token: 'var(--c-3)', t: 'CORE — ' + R.theorem.partition.coreCells + ' cells, depth ≥ ' + R.pointwise.core.depthFloor + ' everywhere (killed by witness vs sup + solid-mean bound)' },
    { token: 'var(--c-1)', t: 'COLLAR — ' + R.theorem.partition.collarCells + ' cells (killed with reflected boundary bounds)' },
    { token: 'var(--c-2)', t: 'CORNER SECTORS r ≤ ' + RTIP + ' — ' + R.theorem.partition.tipCells + ' cells, closed by the four tip lemmas' },
  ], L, H - 30, null, pw));
  svg.push(CH.close);
  O.push(C.section({
    lab: 'the zone map', title: 'Every interior point is somebody\'s problem',
    wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('The interior is partitioned on the 1/100 grid, and the classes are decided in EXACT RATIONALS '
      + '— depth is concave on a convex domain, so a cell\'s minimum depth sits at a corner and the core test is '
      + 'exact; a cell goes to a corner sector only when it lies ENTIRELY inside that vertex\'s 0.11-disk (the '
      + 'max-corner test is exact because distance is convex); domain membership is a separating-axis decision. '
      + 'The theorem record re-decides the whole partition at assembly time, and this figure is drawn from those '
      + 'same decisions — not from an artist\'s sketch.') + '</div>'
      + C.figure({
        svgRaw: svg.join('\n'),
        caption: 'Core cells die by comparison against the interior witnesses (diamonds): certified sup + '
          + 'solid-mean error stays below the witness value on both sides (margins at least ' + sLo(R.pointwise.core.marginMax)
          + ' max side, ' + sLo(R.pointwise.core.marginMin) + ' min side). Collar cells die the same way with '
          + 'REFLECTED error bounds across their nearest open edge. The four corner sectors, the brightest grey, are where the corner '
          + 'expansions take over; they are decided too, so they are drawn as a body and not hatched, which on this site marks a void. Zero cells survive anywhere.',
      }),
  }));
}

/* ------------------------------------------------------------- the chain */
{
  const rows = [
    ['1 · spectrum', 'two-sided localization; μ₁ SIMPLE by the certified gap',
      'μ₁ ∈ ' + ivStr(R.spectrum.mu1, 6) + ', μ₂ ≥ ' + lo(R.spectrum.mu2lo, 6), 'ember-spectrum.json'],
    ['2 · defect', 'the frozen Helmholtz trial\'s boundary flux, by interval Taylor jets',
      '‖∂νu‖ ≤ ' + sHi(R.defect.defectUpper), 'ember-defect.json'],
    /* the narrowing factor floors: the enclosure shrank by at least this much (it read "105×" by hand until 2026-10-28) */
    ['3 · eigenpair', 'μ₁ tightened more than ' + Math.floor(TIGHT) + '×; the eigenfunction enclosure',
      'μ₁ ∈ ' + ivStr(MU1, 9) + ' · ‖u − c₁φ₁‖ ≤ ' + sHi(R.eigenpair.eigenfunctionL2Error), 'ember-eigenpair.json'],
    ['4 · pointwise', 'solid-mean lemma (I₀ = ' + R.pointwise.I0 + ' exact); witnesses; every core cell killed',
      'φ̂(w₊) ≥ ' + lo(WITP, 6) + ' · −φ̂(w₋′) ≥ ' + lo(WITM, 6), 'ember-pointwise.json'],
    ['5 · collar', 'every collar cell killed with reflected boundary bounds',
      R.collar.sweep.collarCells + ' cells, 0 survivors', 'ember-collar.json'],
    ['6 · corners', 'the four tip sectors, by certified corner expansions',
      'b-coefficients enclosed at TWO annuli; all four tips closed', 'ember-corner.json'],
    ['cross', 'independent re-derivations: I₀ rational, C_tr on bigfloat, μ₁ upper on a P1 basis',
      'C_tr ∈ ' + ivStr(R.cross.Ctr.bigfloat, 10) + ' · P1 upper ' + hi(R.cross.p1Upper.upper, 4), 'ember-cross.json'],
    ['theorem', 'chain consistency + the partition re-decided in rationals + assembly',
      THM_CHECKS.length + ' checks, all green', 'ember-theorem.json'],
  ].map(r => [
    { raw: '<b>' + C.esc(r[0]) + '</b>' },
    { raw: C.esc(r[1]) },
    { raw: C.m(r[2]) },
    { raw: C.m('certs/' + r[3]) },
  ]);
  O.push(C.section({
    lab: 'the certificate chain', title: 'Six stages, two cross-checks, one record each',
    wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('Every stage reads its inputs from the upstream record — no constant travels by hand — and '
      + 'each is a falsifiable claim: the batteries mutate a vertex, forge the kernel norm, flip the ladder '
      + 'identity\'s sign, inflate the flux, and the chain must refuse each one. The two literature inputs '
      + '(Liu\'s framework theorem and the Crouzeix–Raviart constant 0.1893·h_K) are assumptions, named in every '
      + 'record\'s trust base, with the source PDF pinned and re-hashed at certify time.') + '</div>'
      + C.table({
        cols: [{ h: 'stage' }, { h: 'what it certifies' }, { h: 'the number' }, { h: 'record' }],
        rows,
      })
      /* WHAT THE THEOREM RESTS ON (WARRANT v2.1, rule 11), from the records' own trust base; a lemma read and not run
         is graded assumed (2026-10-28) */
      + '<div class="col">' + C.pRaw('<b>What the theorem rests on</b>, as every record\'s trust base names it, in the order the chain uses it:')
      + W.premisesHtml([
        { grade: W.ASSUMED, label: 'Liu\'s framework theorem (Thm 2.4, 2015), behind every lower eigenvalue bound', evidence: 'as quoted in You–Xie–Liu, arXiv:1808.08148 §2; the PDF pinned by sha256 (' + pin.sha256.slice(0, 12) + '…) and re-hashed at certify time; read, not machine-checked' },
        { grade: W.ASSUMED, label: 'The Crouzeix–Raviart interpolation constant 0.1893·h_K', evidence: 'Liu\'s Lemma 3.2, quoted on p. 8 of the same pin; read' },
        { grade: W.ASSUMED, label: 'Neumann separation in a sector, H¹ regularity, Green\'s identity, the spectral theorem, Courant', evidence: 'textbook facts, listed in every record\'s trust base (“' + C.esc(CLASSICAL.split(':')[0]) + '”); H¹ regularity is what excludes the singular Bessel family at the corners' }
      ], { meetLine: 'Every stage is interval or exact rational arithmetic over these premises, and the record walk and live re-proofs of ' + C.m('instruments/hotspots/battery.js') + ' ran at this build; the weakest premise is <b>assumed</b>: two cited lemmas and the textbook facts, which no machine here checked.' }) + '</div>',
  }));
}

/* ------------------------------------------------------------ the corners */
{
  const T2 = R.corner.tips;
  const rows = Object.entries(T2).map(([name, t]) => {
    const arg = name === 'A' ? 'max: ∂rφ̂ < 0 (worst ≤ ' + sHi(t.radialWorst) + ') · min: value'
      : name === 'C' ? 'max: value · min: |∇φ̂| > 0 on the sector + φ̂_nn ≥ ' + lo(t.wedgeWorstC2, 1) + ' on the wedge'
      : 'value kill, both sides';
    return [
      { raw: '<b>' + name + '</b>' },
      { raw: C.m(ivStr(t.b0, 3)) },
      { raw: C.m(ivStr(t.b1, 3)) },
      { raw: C.m(ivStr(t.b2, 3)) },
      { raw: C.m(ivStr([t.valueRange[0], t.valueRange[1]], 3)) },
      { raw: C.esc(arg) },
    ];
  });
  O.push(C.section({
    lab: 'the corner sectors', title: 'The tips, and the ladder identity',
    wide: true,
    bodyRaw: '<div class="col">' + C.pRaw('In each corner sector the eigenfunction is EXACTLY a Bessel–Fourier series '
      + 'φ̂ = Σ b_k J_{kν}(√μ₁ r) cos(kνθ) (Neumann separation; H¹ regularity excludes the singular family). '
      + 'The b-coefficients are certified by annulus L² extraction and — the chain\'s most delicate step — '
      + 're-extracted at a SECOND annulus: the two enclosures of every coefficient must intersect, and do.') + '</div>'
      + C.table({
        cols: [{ h: 'corner' }, { h: 'b₀' }, { h: 'b₁' }, { h: 'b₂' }, { h: 'value range on the tip' }, { h: 'the argument' }],
        rows,
      })
      + C.pRaw('At corner C — where the float steering puts the boundary minimum, ' + steer(dMinC.toFixed(4)) + ' from the vertex — the '
        + 'wedge along the top edge is closed by normal monotonicity, and the second tangential derivative comes '
        + 'from the Bessel ladder:')
      + C.eq(C.esc('∂t²[J_ν(kr)cos(νθ)] = (k²/4)[ J_{ν+2}cos((ν+2)θ) + J_{ν−2}cos((ν−2)θ) − 2 J_ν cos(νθ) ]'))
      + C.pRaw('The polar-split pieces diverge individually like r^{ν−2} with cancelling signs interval arithmetic '
        + 'cannot see; the ladder form is exact and sign-explicit — and the singular term arrives with b₁ < 0 '
        + '(certified at both annuli), so it HELPS: φ̂_nn ≥ ' + lo(R.corner.tips.C.wedgeWorstC2, 2) + ' on the '
        + 'wedge from r = 0.12 down to r = 10⁻⁶, and ≥ ' + lo(R.corner.tips.C.wedgeInnerC2, 2) + ' inside r ≤ 10⁻⁶; and the exact second-order Taylor from the Neumann edge (the first-order '
        + 'term vanishes by the boundary condition) forces every interior wedge point strictly above the boundary '
        + 'minimum. J_{ν−2} at ν − 2 ≈ ' + W.value((nuC - 2).toFixed(2).replace('-', '−'), W.COMPUTED, { title: 'π over the interior angle at C, in floats: computed, not decided' }) + ' is a NEGATIVE-ORDER Bessel evaluation — the reason the instrument '
        + 'layer carries fractional and negative orders with their own falsifier battery.')
      + C.note({
        lab: 'the corollary, and its open twin',
        bodyRaw: C.pRaw('<b>The hot spot is vertex A — certified.</b> The witness w₊ sits inside A\'s sector '
          + '(decided in exact rationals); ∂rφ̂ < 0 on the whole punctured sector means φ̂ strictly decreases '
          + 'along every ray from A, so φ̂(A) > φ̂(w₊) ≥ ' + lo(WITP, 6) + '; and '
          + 'every point outside the sector — core, collar, tips B/C/D — is certified strictly below that. At '
          + 'the vertex the expansion collapses to φ̂(A) = b₀(A), so φ̂(A) ∈ ' + ivStr(R.theorem.corollary.phiAtA, 6)
          + '. For triangles, extrema-only-at-vertices is Judge–Mondal\'s refinement; the maximum-side analogue '
          + 'now holds, certified, for this quadrilateral.')
          + C.pRaw('<b>The cold spot is an open question of enclosure width.</b> φ̂(C) = b₀(C) ∈ '
          + ivStr(R.corner.tips.C.b0, 4) + ' overlaps the observed boundary minimum (float ' + steer(BM.min.v.toFixed(4).replace('-', '−')) + ', sitting '
          + steer(dMinC.toFixed(4)) + ' from C along the top edge). Whether the minimum is at vertex C or strictly inside the edge '
          + 'is undecided; a tighter corner extraction would decide it — and an off-vertex answer would contrast '
          + 'with the triangle behaviour, where extrema occur only at vertices.'),
      }),
  }));
}

/* ------------------------------------------------------------- the method */
O.push(C.section({
  lab: 'the method', title: 'Rules the instruments enforce',
  bodyRaw: C.plainList([
    { text: 'Intervals enter LAST in rational-core pipelines — exact sums are converted once, never per-term against large coefficients.' },
    { text: 'A passing value bridge does not test a jet: every derivative order used is bridged against an independent evaluation.' },
    { text: 'Cell tests match the geometry: depth is concave (cell minimum at a corner — exact), distance is convex (cell maximum at a corner — exact), and the partition is re-decided in rationals at assembly, never assumed from a sweep\'s bookkeeping.' },
    { text: 'Two implementations, one gate: the kernel norm, the trace constant, the μ₁ upper bound and the corner coefficients each have an independent second derivation that must agree.' },
    { text: 'Witness balls are decided in exact rationals; the three witnesses provably sit inside corner sectors, so no sweep cell has to beat its own witness.' },
    { text: 'Every red control fires: a mutated vertex, a forged I₀, a flipped ladder sign, an inflated flux, a moved witness — each refuses the build.' },
  ]),
}));

/* -------------------------------------------------------------- reproduce */
if (BAND) {
  const A = BAND.audited;
  O.push(C.section({
    lab: '§B · the band', title: 'From one domain to a continuum',
    bodyRaw: C.table({
      cols: [{ h: 'what is certified' }, { h: 'value', cls: 'n' }, { h: 'why it is the load-bearing part' }],
      rows: [
        ['the interval', 'c ∈ [' + A.interval[0] + ', ' + A.interval[1] + ']', 'a positive-measure family, not a point — the uniqueness wall is crossed on an interval'],
        ['chunk ladder', A.chunks + ' chunks, no gap', 'shared endpoints, re-derived here; a gap of 1e-12 would make the interval claim false'],
        ['σ-cell ladder', A.sigmaCells.toLocaleString('en-US') + ' cells, no gap', 'every certified quantity is per-cell, so the cells must tile [−1,0] in each stage too'],
        ['uniform simplicity', 'μ₁ ≥ ' + lo(A.mu1LowerUniform, 5) + ', μ₂ ≥ ' + lo(A.mu2LowerUniform, 5), 'the gap never closes, so μ₁ stays simple for every c and the eigenfunction is well defined'],
        /* as the audit records them, three digits (toExponential(3) printed a fourth the record does not hold) */
        ['thinnest margins', sLo(String(A.marginPMin)) + ' / ' + sLo(String(A.marginMMin)), 'max and min side, worst over every cell of every chunk — both strictly positive'],
        ['collar survivors outside the corner windows', String(A.collarSurvivorsOutsideWindows), 'zero, everywhere; the corners are closed by exact local expansions instead'],
        /* an upper bound on b₁, printed UP: it read −0.8791, below its value −0.87908…, until 2026-10-28 */
        ['tip C genericity', 'sup b₁ ≤ ' + hi(A.tipC_b1_sup, 4) + ' < 0', 'the named condition the specimen proof leaned on, re-checked on all ' + A.chunks + ' chunks by corner position, not by sign'],
        ['zero-width cells found', String(A.degenerateCells), 'an audit finding, not in the producer\'s summary: cells the σ-refinement emitted at zero width. They certify an empty set, so they cannot affect the covering — and the covering is complete without them in every chunk and every stage'],
      ]
    }) + '<div class="col">'
    + C.pRaw('An interval theorem is a union of chunk theorems, and the way such a union fails is almost never '
      + 'arithmetic — it is COVERING. Two ladders carry the whole result and neither is visible inside any single '
      + 'certificate: the chunks must tile the interval, and inside each chunk the σ-cells must tile [−1,0] in '
      + 'every stage that reports per-cell numbers. Both are re-derived here from the stage records by '
      + C.m('instruments/emberband/verify-band.js') + ', which shares no code with the producer, and the battery '
      + 'keeps eight red controls that each break the band in a different realistic way — a removed chunk, an '
      + 'endpoint nudged by 1e-5, one missing σ-cell out of ' + A.sigmaCells.toLocaleString('en-US') + ', a single '
      + 'margin at −1e-9, one escaped collar survivor, a dropped stage, tip C losing its sign, and a ladder that '
      + 'tiles the wrong interval. All ' + ebm[3] + ' must fire or the page does not build: this build ran it (' + ebm[1] + ' checks, ' + ebm[2] + '/' + ebm[3] + ' red controls fired).')
    + C.pRaw('The audit also turned up something the producing summary does not mention: <strong>'
      + A.degenerateCells + ' of the σ-cells are zero-width</strong>, emitted where the ratio-1.3 refinement toward '
      + 'σ = 0 bottoms out and duplicates a shared endpoint. They certify an empty set, so they cannot bridge a gap '
      + 'or affect the conclusion — and the auditor confirms the remaining cells still tile [−1,0] in every chunk '
      + 'and every stage. It is reported rather than dropped because a certificate covering nothing is worth '
      + 'counting, and because the check that excludes them is also the check that stops one from papering over a '
      + 'real hole.')
    /* the running time is the producer's own figure (the band record's scope, "~10 h"); the per-chunk time the page
       also typed lives in no record and is gone (WARRANT rule 8, 2026-10-28) */
    + C.pRaw('<strong>Scope, stated plainly.</strong> The six-stage chain was executed on the bench that produced '
      + 'it, not re-executed here — ' + clock('about 10 hours') + ', on the producer\'s own figure in the band record. What '
      + 'this page adds is the independent audit: the covering ladders and every band-wide value re-derived from '
      + 'per-cell data by a checker that shares no code with the producer, over records sha-pinned in '
      + C.m('corpus/emberband') + '. That is the genre of this repository\'s '
      + '<a href="/reports/tensor-rank-bounds.html">lower-bound audit</a>, not of its from-scratch theorems. The '
      + 'convex-quadrilateral conjecture itself remains open: this is a family, not the census.')
    /* WHAT THE BAND RESTS ON (rule 11): the specimen's premises, and one more */
    + C.pRaw('<b>What the band rests on</b>, beyond the premises the specimen names above:') + W.premisesHtml([
      { grade: W.ASSUMED, label: 'The ' + BAND_RECS + ' stage records, as the producer\'s bench wrote them', evidence: 'adopted: their covering and every band-wide value are re-derived here by an auditor that shares no code with the producer, but the per-cell interval arithmetic inside them is not re-run here' }
    ], { meetLine: 'The audit is exact over what the records hold; the weakest premise is <b>assumed</b>: the per-cell arithmetic of a chain this repository did not re-execute.' }) + '</div>'
  }));
}

O.push(C.section({
  lab: 'reproduce', title: 'Reproduce',
  bodyRaw: C.pRaw('The whole chain re-runs from this repository, deterministically:')
    /* the counts and the time read from the batteries this build ran and the records' own timings (2026-10-28: the
       Γ/Bessel line said 69 checks and 5 reds, long stale) */
    + C.code('node tools/run-ember-chain.js            # all 8 stages, ~' + chainMin + ' min, records in certs/\n'
      + 'node tools/run-ember-chain.js corner     # any single stage\n'
      + 'node instruments/hotspots/battery.js     # record walk, live re-proofs: ' + hsPass + ' checks, ' + hsReds + ' reds\n'
      + 'node instruments/ivspecial/battery.js    # the Γ/Bessel layer: ' + ivPass + ' checks, ' + ivReds + ' reds\n'
      + 'make test                                # every battery in the machine')
    + C.pRaw('Sources: ' + C.m('instruments/hotspots/') + ' + ' + C.m('instruments/ivspecial/') + ' · literature '
      + 'input pinned at ' + C.m('corpus/sources/liu2018_arxiv-1808-08148.pdf') + ' with its transcription beside '
      + 'it. Refutations and independent re-runs are invited: carlos@carlostoledo.co.'),
}));

O.push('<p>cert-machine · built ' + new Date().toISOString().slice(0, 10) + ' · git ' + gitrev
  + ' · every number from a VERIFIED record · Liu pin ' + pin.sha256.slice(0, 12) + '…'
  + ' · archived: <a href="https://doi.org/10.5281/zenodo.22225860">DOI 10.5281/zenodo.22225860</a></p>'
  + '<p><a href="/reports/">all reports</a> · <a href="/machine/">the machine</a></p>');

/* ---- the gates ---- */
const html = TPL.render({
  title: 'The hot spot stays on the boundary — a certified theorem',
  desc: 'The second Neumann eigenfunction of a convex trapezoid outside every analytically proven class attains '
    + 'its extrema on the boundary only: a certified six-stage chain with exact-rational partition decisions, '
    + 'interval Bessel corner expansions, and firing red controls.',
  path: '/reports/ember.html',
  bodyRaw: O.join('\n\n'),
});
if (/first certified/i.test(html) && !/to our knowledge/i.test(html)) die('the claim appears without its qualifier');
for (const fence of ['Judge–Mondal', 'lip domains', '2604.19003', 'de Dios Pont', '2405.19508', '1308.3005']) {
  if (!html.includes(fence)) die('the fence list is incomplete: missing ' + fence);
}
if (/de Dios[- ]Pardo/.test(html)) die('the misattributed fence wording is back — 2412.06344 is de Dios Pont, and it is a COUNTEREXAMPLE, not a proven class');
if (!/ONE domain/.test(html)) die('the one-domain scope statement is missing');
if (/quadrilateral conjecture (is|now) (settled|proved)|census (is )?complete/i.test(html)) die('counting inflation reached the page');
/* word boundaries matter here: the un-anchored /ported/ matched "reported",
   "supported" and "imported", so this gate was rejecting legitimate prose. Its
   intent — keep port-log archaeology off the report — is unchanged. */
if (/\bfrontier\b|origin bench|\bported\b|\bport log\b|re-proved end to end/i.test(html)) die('workshop archaeology reached the page — this is the report, not a port log');
fs.writeFileSync(path.join(ROOT, 'reports', 'ember.html'), html);
console.log('reports/ember.html written: μ₁ ∈ ' + ivStr(MU1, 9) + ', partition '
  + R.theorem.partition.coreCells + '+' + R.theorem.partition.collarCells + ' cells, 8 records @ git ' + gitrev);
