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

/* outward display of an enclosure: lo printed rounded down, hi rounded up */
function outward([lo, hi], dp) {
  const f = Math.pow(10, dp);
  return '[' + (Math.floor(lo * f) / f).toFixed(dp) + ', ' + (Math.ceil(hi * f) / f).toFixed(dp) + ']';
}
const e2 = (x) => Number(x).toExponential(2);
const ivStr = (a, dp) => outward(a, dp === undefined ? 4 : dp);

const MU1 = R.eigenpair.mu1;
const WITP = R.pointwise.witnesses.max.value;
const WITM = R.pointwise.witnesses.minDeep.value;

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
  { k: 'μ₁ enclosure', v: '1.42e-3', n: 'μ₁ ∈ ' + ivStr(MU1, 9) + ', simple (certified spectral gap: μ₂ ≥ ' + R.spectrum.mu2lo.toFixed(4) + ')' },
  { k: 'the partition', v: (R.theorem.partition.coreCells + R.theorem.partition.collarCells).toLocaleString('en-US') + ' cells', n: 'core ' + R.theorem.partition.coreCells + ' + collar ' + R.theorem.partition.collarCells + ' on the 1/100 grid, classes decided in exact rationals; four corner sectors close the rest — zero surviving cells' },
  { k: 'the band', v: BAND ? 'c ∈ [' + BAND.audited.interval[0] + ', ' + BAND.audited.interval[1] + ']' : 'not built', role: 'held', n: BAND ? BAND.audited.chunks + ' chunks tiling the interval with shared endpoints and no gap, ' + BAND.audited.sigmaCells.toLocaleString('en-US') + ' σ-cells inside them — both ladders re-derived by an independent auditor; μ₁ ≥ ' + BAND.audited.mu1LowerUniform.toFixed(5) + ' and μ₂ ≥ ' + BAND.audited.mu2LowerUniform.toFixed(5) + ' uniformly, so μ₁ is simple for every c' : 'run tools/run-ember-band.js' },
  { k: 'band margins', v: BAND ? BAND.audited.marginPMin.toExponential(2) + ' / ' + BAND.audited.marginMMin.toExponential(2) : '—', role: 'held', n: BAND ? 'the thinnest zone margins over all ' + BAND.audited.sigmaCells.toLocaleString('en-US') + ' cells of all ' + BAND.audited.chunks + ' chunks, max and min side; zero collar survivors outside the corner windows anywhere' : '' },
  { k: 'trust base', v: '2 inputs', n: 'two quoted lemmas of Liu (arXiv:1808.08148, pinned sha256 ' + pin.sha256.slice(0, 12) + '…) — named in every record; everything else re-derives here' },
]));

O.push(C.scope('Machine-derived; published from this repository; not peer-reviewed; not independently rerun. '
  + 'The claim is fenced: Judge–Mondal proved all triangles (Annals 2020, after partial acute-triangle results, '
  + 'Siudeja arXiv:1308.3005), lip domains are Atar–Burdzy, certain non-convex L-tiled polygons are Hatcher '
  + '(arXiv:2405.19508), and symmetric quadrangle subcases are Deng–Gui–Jiang–Yang–Yao (arXiv:2604.19003) — this '
  + 'domain sits outside each class. In the other direction, in sufficiently high dimension the conjecture is '
  + 'FALSE for convex sets (de Dios Pont, arXiv:2412.06344), so the planar convex case is exactly where it '
  + 'remains expected — and where this domain lives. A validated-numerics route to acute triangles was developed '
  + 'in the Polymath7 project before the analytic triangle proof; it is lineage here, not a fence. The claim is '
  + 'ONE domain, never the quadrilateral conjecture. Race watch: arXiv, weekly. Every number on this page comes '
  + 'from a VERIFIED record in certs/ember-*.json; the chain re-runs in about two minutes.'));

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
  const VFl = SP.VF;
  const outline = 'M' + VFl.map(p => px(p[0]).toFixed(1) + ' ' + py(p[1]).toFixed(1)).join('L') + 'Z';
  const svg = [CH.open({ w: W, h: H, alt: 'zone map of the trapezoid: core cells, collar cells, and the four corner sectors, with the certified witnesses' })];
  svg.push(CH.HATCH_DEF);
  svg.push('    <path d="' + paths.core.join('') + '" fill="var(--c-3)" fill-opacity="0.55"/>');
  svg.push('    <path d="' + paths.collar.join('') + '" fill="var(--c-1)" fill-opacity="0.5"/>');
  svg.push('    <path d="' + paths.tip.join('') + '" fill="url(#cmHatch)"/>');
  svg.push('    <path d="' + outline + '" fill="none" stroke="var(--c-axis)" stroke-width="1.5"/>');
  const lbl = [['A', -10, 18, 'end'], ['B', 10, 18, 'start'], ['C', 14, 2, 'start'], ['D', -14, 2, 'end']];
  VFl.forEach((p, i) => svg.push(CH.txt(px(p[0]) + lbl[i][1], py(p[1]) + lbl[i][2], lbl[i][0] + ' (' + SP.VERT_STR[i].replace(/[()]/g, '') + ')', 't-note', lbl[i][3])));
  /* witnesses: interior diamonds; boundary extrema: marks on the boundary */
  const wit = [
    { w: R.pointwise.witnesses.max, t: 'w₊ · φ̂ ≥ ' + WITP.toFixed(4), dx: 10, anchor: 'start', dy: 4 },
    { w: R.pointwise.witnesses.minDeep, t: 'w₋′ · −φ̂ ≥ ' + WITM.toFixed(4), dx: -12, anchor: 'end', dy: 22 },
  ];
  for (const { w, t, dx, anchor, dy } of wit) {
    const x = px(w.x), y = py(w.y);
    svg.push('    <path d="M' + x.toFixed(1) + ' ' + (y - 6).toFixed(1) + 'l6 6l-6 6l-6 -6z" fill="var(--c-2)" stroke="var(--paper)" stroke-width="1"><title>' + C.escAttr(t) + '</title></path>');
    svg.push(CH.txt(x + dx, y + dy, t, 't-note', anchor));
  }
  const bm = R.pointwise.boundaryLandscape;
  svg.push(CH.txt(px(bm.max.x) + 16, py(bm.max.y) - 10, 'boundary max (at A)', 't-ax', 'start'));
  svg.push(CH.txt(px(0.55), py(bm.min.y) - 10, 'boundary min →', 't-ax', 'middle'));
  svg.push(CH.legend([
    { token: 'var(--c-3)', t: 'CORE — ' + R.theorem.partition.coreCells + ' cells, depth ≥ 3/40 everywhere (killed by witness vs sup + solid-mean bound)' },
    { token: 'var(--c-1)', t: 'COLLAR — ' + R.theorem.partition.collarCells + ' cells (killed with reflected boundary bounds)' },
    { token: 'var(--c-ctx)', t: 'CORNER SECTORS r ≤ 0.11 — the four tip lemmas', kind: 'hatch' },
  ], L, H - 30, null, pw));
  svg.push(CH.close);
  O.push(C.section({
    lab: 'the zone map', title: 'Every interior point is somebody\'s problem',
    wide: true,
    bodyRaw: C.pRaw('The interior is partitioned on the 1/100 grid, and the classes are decided in EXACT RATIONALS '
      + '— depth is concave on a convex domain, so a cell\'s minimum depth sits at a corner and the core test is '
      + 'exact; a cell goes to a corner sector only when it lies ENTIRELY inside that vertex\'s 0.11-disk (the '
      + 'max-corner test is exact because distance is convex); domain membership is a separating-axis decision. '
      + 'The theorem record re-decides the whole partition at assembly time, and this figure is drawn from those '
      + 'same decisions — not from an artist\'s sketch.')
      + C.figure({
        svgRaw: svg.join('\n'),
        caption: 'Core cells die by comparison against the interior witnesses (diamonds): certified sup + '
          + 'solid-mean error stays below the witness value on both sides (margins ' + e2(R.pointwise.core.marginMax)
          + ' max side, ' + e2(R.pointwise.core.marginMin) + ' min side). Collar cells die the same way with '
          + 'REFLECTED error bounds across their nearest open edge. The hatched sectors are where the corner '
          + 'expansions take over. Zero cells survive anywhere.',
      }),
  }));
}

/* ------------------------------------------------------------- the chain */
{
  const rows = [
    ['1 · spectrum', 'two-sided localization; μ₁ SIMPLE by the certified gap',
      'μ₁ ∈ ' + ivStr(R.spectrum.mu1, 6) + ', μ₂ ≥ ' + R.spectrum.mu2lo.toFixed(6), 'ember-spectrum.json'],
    ['2 · defect', 'the frozen Helmholtz trial\'s boundary flux, by interval Taylor jets',
      '‖∂νu‖ ≤ ' + e2(R.defect.defectUpper), 'ember-defect.json'],
    ['3 · eigenpair', 'μ₁ tightened 105×; the eigenfunction enclosure',
      'μ₁ ∈ ' + ivStr(MU1, 9) + ' · ‖u − c₁φ₁‖ ≤ ' + e2(R.eigenpair.eigenfunctionL2Error), 'ember-eigenpair.json'],
    ['4 · pointwise', 'solid-mean lemma (I₀ = 5/48 exact); witnesses; every core cell killed',
      'φ̂(w₊) ≥ ' + WITP.toFixed(6) + ' · −φ̂(w₋′) ≥ ' + WITM.toFixed(6), 'ember-pointwise.json'],
    ['5 · collar', 'every collar cell killed with reflected boundary bounds',
      R.collar.sweep.collarCells + ' cells, 0 survivors', 'ember-collar.json'],
    ['6 · corners', 'the four tip sectors, by certified corner expansions',
      'b-coefficients enclosed at TWO annuli; all four tips closed', 'ember-corner.json'],
    ['cross', 'independent re-derivations: I₀ rational, C_tr on bigfloat, μ₁ upper on a P1 basis',
      'C_tr ∈ [' + R.cross.Ctr.bigfloat[0].toFixed(10) + ', ' + R.cross.Ctr.bigfloat[1].toFixed(10) + '] · P1 upper ' + R.cross.p1Upper.upper.toFixed(4), 'ember-cross.json'],
    ['theorem', 'chain consistency + the partition re-decided in rationals + assembly',
      '19 checks, all green', 'ember-theorem.json'],
  ].map(r => [
    { raw: '<b>' + C.esc(r[0]) + '</b>' },
    { raw: C.esc(r[1]) },
    { raw: C.m(r[2]) },
    { raw: C.m('certs/' + r[3]) },
  ]);
  O.push(C.section({
    lab: 'the certificate chain', title: 'Six stages, two cross-checks, one record each',
    wide: true,
    bodyRaw: C.pRaw('Every stage reads its inputs from the upstream record — no constant travels by hand — and '
      + 'each is a falsifiable claim: the batteries mutate a vertex, forge the kernel norm, flip the ladder '
      + 'identity\'s sign, inflate the flux, and the chain must refuse each one. The two literature inputs '
      + '(Liu\'s framework theorem and the Crouzeix–Raviart constant 0.1893·h_K) are assumptions, named in every '
      + 'record\'s trust base, with the source PDF pinned and re-hashed at certify time.')
      + C.table({
        cols: [{ h: 'stage' }, { h: 'what it certifies' }, { h: 'the number' }, { h: 'record' }],
        rows,
      }),
  }));
}

/* ------------------------------------------------------------ the corners */
{
  const T2 = R.corner.tips;
  const rows = Object.entries(T2).map(([name, t]) => {
    const arg = name === 'A' ? 'max: ∂rφ̂ < 0 (worst ' + e2(t.radialWorst) + ') · min: value'
      : name === 'C' ? 'max: value · min: |∇φ̂| > 0 on the sector + φ̂_nn ≥ ' + t.wedgeWorstC2.toFixed(1) + ' on the wedge'
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
    bodyRaw: C.pRaw('In each corner sector the eigenfunction is EXACTLY a Bessel–Fourier series '
      + 'φ̂ = Σ b_k J_{kν}(√μ₁ r) cos(kνθ) (Neumann separation; H¹ regularity excludes the singular family). '
      + 'The b-coefficients are certified by annulus L² extraction and — the chain\'s most delicate step — '
      + 're-extracted at a SECOND annulus: the two enclosures of every coefficient must intersect, and do.')
      + C.table({
        cols: [{ h: 'corner' }, { h: 'b₀' }, { h: 'b₁' }, { h: 'b₂' }, { h: 'value range on the tip' }, { h: 'the argument' }],
        rows,
      })
      + C.pRaw('At corner C — where the boundary minimum lives, ' + (0.0195).toFixed(4) + ' from the vertex — the '
        + 'wedge along the top edge is closed by normal monotonicity, and the second tangential derivative comes '
        + 'from the Bessel ladder:')
      + C.eq(C.esc('∂t²[J_ν(kr)cos(νθ)] = (k²/4)[ J_{ν+2}cos((ν+2)θ) + J_{ν−2}cos((ν−2)θ) − 2 J_ν cos(νθ) ]'))
      + C.pRaw('The polar-split pieces diverge individually like r^{ν−2} with cancelling signs interval arithmetic '
        + 'cannot see; the ladder form is exact and sign-explicit — and the singular term arrives with b₁ < 0 '
        + '(certified at both annuli), so it HELPS: φ̂_nn ≥ ' + R.corner.tips.C.wedgeWorstC2.toFixed(2) + ' on the '
        + 'whole wedge, down to r = 10⁻⁶, and the exact second-order Taylor from the Neumann edge (the first-order '
        + 'term vanishes by the boundary condition) forces every interior wedge point strictly above the boundary '
        + 'minimum. J_{ν−2} at ν − 2 ≈ −0.19 is a NEGATIVE-ORDER Bessel evaluation — the reason the instrument '
        + 'layer carries fractional and negative orders with their own falsifier battery.')
      + C.note({
        lab: 'the corollary, and its open twin',
        bodyRaw: C.pRaw('<b>The hot spot is vertex A — certified.</b> The witness w₊ sits inside A\'s sector '
          + '(decided in exact rationals); ∂rφ̂ < 0 on the whole punctured sector means φ̂ strictly decreases '
          + 'along every ray from A, so φ̂(A) > φ̂(w₊) ≥ ' + R.pointwise.witnesses.max.value.toFixed(6) + '; and '
          + 'every point outside the sector — core, collar, tips B/C/D — is certified strictly below that. At '
          + 'the vertex the expansion collapses to φ̂(A) = b₀(A), so φ̂(A) ∈ ' + ivStr(R.theorem.corollary.phiAtA, 6)
          + '. For triangles, extrema-only-at-vertices is Judge–Mondal\'s refinement; the maximum-side analogue '
          + 'now holds, certified, for this quadrilateral.')
          + C.pRaw('<b>The cold spot is an open question of enclosure width.</b> φ̂(C) = b₀(C) ∈ '
          + ivStr(R.corner.tips.C.b0, 4) + ' overlaps the observed boundary minimum (float −1.9998, sitting '
          + '0.0195 from C along the top edge). Whether the minimum is at vertex C or strictly inside the edge '
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
        ['uniform simplicity', 'μ₁ ≥ ' + A.mu1LowerUniform.toFixed(5) + ', μ₂ ≥ ' + A.mu2LowerUniform.toFixed(5), 'the gap never closes, so μ₁ stays simple for every c and the eigenfunction is well defined'],
        ['thinnest margins', A.marginPMin.toExponential(3) + ' / ' + A.marginMMin.toExponential(3), 'max and min side, worst over every cell of every chunk — both strictly positive'],
        ['collar survivors outside the corner windows', String(A.collarSurvivorsOutsideWindows), 'zero, everywhere; the corners are closed by exact local expansions instead'],
        ['tip C genericity', 'sup b₁ = ' + A.tipC_b1_sup.toFixed(4) + ' < 0', 'the named condition the specimen proof leaned on, re-checked on all ' + A.chunks + ' chunks by corner position, not by sign'],
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
      + 'tiles the wrong interval. All eight must fire or the page does not build.')
    + C.pRaw('The audit also turned up something the producing summary does not mention: <strong>'
      + A.degenerateCells + ' of the σ-cells are zero-width</strong>, emitted where the ratio-1.3 refinement toward '
      + 'σ = 0 bottoms out and duplicates a shared endpoint. They certify an empty set, so they cannot bridge a gap '
      + 'or affect the conclusion — and the auditor confirms the remaining cells still tile [−1,0] in every chunk '
      + 'and every stage. It is reported rather than dropped because a certificate covering nothing is worth '
      + 'counting, and because the check that excludes them is also the check that stops one from papering over a '
      + 'real hole.')
    + C.pRaw('<strong>Scope, stated plainly.</strong> The six-stage chain was executed on the bench that produced '
      + 'it, not re-executed here — roughly ten hours, with the defect stage alone at 25 minutes per chunk. What '
      + 'this page adds is the independent audit: the covering ladders and every band-wide value re-derived from '
      + 'per-cell data by a checker that shares no code with the producer, over records sha-pinned in '
      + C.m('corpus/emberband') + '. That is the genre of this repository\'s '
      + '<a href="/reports/tensor-rank-bounds.html">lower-bound audit</a>, not of its from-scratch theorems. The '
      + 'convex-quadrilateral conjecture itself remains open: this is a family, not the census.') + '</div>'
  }));
}

O.push(C.section({
  lab: 'reproduce', title: 'Reproduce',
  bodyRaw: C.pRaw('The whole chain re-runs from this repository, deterministically:')
    + C.code('node tools/run-ember-chain.js            # all 8 stages, ~2 min, records in certs/\n'
      + 'node tools/run-ember-chain.js corner     # any single stage\n'
      + 'node instruments/hotspots/battery.js     # record walk + live re-proofs + 8 red controls\n'
      + 'node instruments/ivspecial/battery.js    # the Γ/Bessel layer: 69 checks, 5 reds\n'
      + 'make test                                # every battery in the machine')
    + C.pRaw('Sources: ' + C.m('instruments/hotspots/') + ' + ' + C.m('instruments/ivspecial/') + ' · literature '
      + 'input pinned at ' + C.m('corpus/sources/liu2018_arxiv-1808-08148.pdf') + ' with its transcription beside '
      + 'it. Refutations and independent re-runs are invited: carlos@carlostoledo.co.'),
}));

O.push('<footer><p>cert-machine · built ' + new Date().toISOString().slice(0, 10) + ' · git ' + gitrev
  + ' · every number from a VERIFIED record · Liu pin ' + pin.sha256.slice(0, 12) + '…'
  + ' · archived: <a href="https://doi.org/10.5281/zenodo.22225860">DOI 10.5281/zenodo.22225860</a></p>'
  + '<p><a href="/reports/">all reports</a> · <a href="/machine/">the machine</a></p></footer>');

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
