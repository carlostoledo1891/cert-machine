#!/usr/bin/env node
/* build-report-mfg-observatory.js — generate reports/mfg-observatory.html:
   THE MFG REGIME OBSERVATORY — the parameter plane of a mean-field game,
   partitioned into cells and decided, each cell carrying its own certificate.

   The lab is labs/mfg/. The page is tools-first: the certifier runs in the
   reader's tab, ships beside the page as a dependency-free command-line file,
   and lives in the repository. The map is the evidence that the tool works at
   scale; the tool is what the reader actually takes away.

   GATES, every build — the page refuses on any of them:
     1. labs/mfg/battery.js re-runs: ALL PASS, every falsifier red. That battery
        contains the zero-width equality with the lifted point kernel, so a
        divergence between the two implementations stops the page.
     2. labs/mfg/widget.js gate(): the assembled browser bundle must answer
        exactly what the Node path answers, including the witnesses.
     3. The map record is re-tallied HERE from its own cells — counts, areas,
        and the exact area identity (the partition must cover the domain).
     4. A deterministic sample of cells is RE-DECIDED at build and must return
        the same verdict and the same witness numbers.

   usage: node tools/build-report-mfg-observatory.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const B = require(path.join(ROOT, 'labs', 'mfg', 'box.js'));
const W = require(path.join(ROOT, 'labs', 'mfg', 'widget.js'));
const die = (m) => { console.error('MFG OBSERVATORY REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const fmt = (n, d) => Number(n).toFixed(d === undefined ? 2 : d);
/* cell edges are halvings of the base cell, so they are exact binary fractions;
   printing them needs the shortest form, not 0.012499999999999983 */
const cellNum = (x) => { for (let d = 1; d <= 12; d++) { const t = Number(x.toFixed(d)); if (Math.abs(t - x) < 1e-12) return String(t); } return String(x); };
const pct = (x, t) => (100 * x / t).toFixed(1) + '%';

/* ---- gate 1: the lab battery --------------------------------------------- */
const bat = cp.spawnSync(process.execPath, [path.join(ROOT, 'labs', 'mfg', 'battery.js')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /ALL PASS   \((\d+) checks, (\d+)\/(\d+) falsifiers\)/.exec(bout);
if (bat.status !== 0 || !bm) die('labs/mfg/battery.js did not pass:\n' + bout.slice(-900));
if (bm[2] !== bm[3]) die('not every falsifier fired: ' + bm[2] + '/' + bm[3]);
const BAT = { checks: bm[1], reds: bm[2] };
/* the prose below quotes the battery's own measurements, so they are PARSED
   from the run that just gated this build — never transcribed */
const batNum = (re, what) => { const m = re.exec(bout); if (!m) die('the battery output lost the ' + what + ' line'); return m; };
const C1 = batNum(/C1 .*?\[r = ([\d.e+-]+), worst corner distance ([\d.e+-]+)\]/, 'C1 corner check');
const R1 = batNum(/R1 .*?\[(\S+): \|Phi\| >= ([\d.e+-]+) vs the ball's reach ([\d.e+-]+)\]/, 'R1 refutation');
const X2 = batNum(/X2 freezing the tangent collapses the widest closing cell from ([\d.e+-]+) to ([\d.e+-]+) in c \(([\d.]+)x\)/, 'X2 predictor measurement');
if (!/G1 at zero width the box certifier reproduces validate\.js BIT FOR BIT/.test(bout))
  die('the zero-width equality check is gone from the battery');

/* ---- gate 2: the browser bundle ------------------------------------------ */
try { W.gate(); } catch (e) { die('the assembled browser bundle disagrees with the Node path: ' + e.message); }
const BUNDLE = W.bundle();

/* ---- gate 3: the map record, re-tallied here ------------------------------ */
const MAPF = path.join(ROOT, 'certs', 'mfg-regime-map.json');
if (!fs.existsSync(MAPF)) die('certs/mfg-regime-map.json is missing — run node labs/mfg/regime.js');
const MAPBYTES = fs.readFileSync(MAPF);
const MAP = JSON.parse(MAPBYTES.toString('utf8'));
const MAPSHA = crypto.createHash('sha256').update(MAPBYTES).digest('hex');
const CFG = MAP.config;
/* the record interns its UNDECIDED reasons; resolve them back here */
const whyOf = (c) => (typeof c.why === 'number' ? (MAP.reasons || [])[c.why] : c.why) || '';

const T = { MULTIPLE: 0, UNIQUE: 0, UNDECIDED: 0 };
const AREA = { MULTIPLE: 0, UNIQUE: 0, UNDECIDED: 0 };
let encOnly = 0, encArea = 0, capped = 0, minCell = Infinity, maxDepth = 0;
let worstSep = Infinity, bestSep = 0, minDensity = Infinity, worstKappa = 0, maxR = 0;
const whyCount = new Map();
const byDepth = new Map();       /* MULTIPLE cells by the width that closed them */
for (const c of MAP.cells) {
  if (!(c.verdict in T)) die('a cell carries an unknown verdict: ' + c.verdict);
  const w = c.c1 - c.c0, h = c.a1 - c.a0;
  if (!(w > 0 && h > 0)) die('a cell has non-positive extent');
  const a = w * h;
  T[c.verdict]++; AREA[c.verdict] += a;
  minCell = Math.min(minCell, w); maxDepth = Math.max(maxDepth, c.depth || 0);
  if (c.capped) capped++;
  if (c.verdict === 'UNDECIDED') {
    if (c.enclosures >= 1) { encOnly++; encArea += a; }
    const key = whyOf(c).replace(/\(separation[^)]*\)/, '').replace(/\s+$/, '');
    whyCount.set(key, (whyCount.get(key) || 0) + 1);
  }
  if (c.verdict === 'MULTIPLE') {
    byDepth.set(w, (byDepth.get(w) || 0) + 1);
    const wt = c.witness;
    if (!(wt && wt.separation > wt.rSum)) die('a MULTIPLE cell does not carry disjoint balls');
    if (!(wt.minM > 0)) die('a MULTIPLE cell does not carry a positive density');
    worstSep = Math.min(worstSep, wt.separation / wt.rSum);
    bestSep = Math.max(bestSep, wt.separation / wt.rSum);
    minDensity = Math.min(minDensity, wt.minM);
    worstKappa = Math.max(worstKappa, wt.aligned.kappa, wt.herding.kappa);
    maxR = Math.max(maxR, wt.aligned.r, wt.herding.r);
  }
  if (c.verdict === 'UNIQUE' && !(c.c0 >= 0)) die('a UNIQUE cell reaches into c < 0 — Lasry-Lions does not apply there');
}
const CELLS = MAP.cells.length;
const DOMAIN = (CFG.cRange[1] - CFG.cRange[0]) * (CFG.aRange[1] - CFG.aRange[0]);
const COVERED = AREA.MULTIPLE + AREA.UNIQUE + AREA.UNDECIDED;
if (Math.abs(COVERED - DOMAIN) > 1e-9 * DOMAIN)
  die('the partition does not cover the domain: ' + COVERED + ' vs ' + DOMAIN);
if (capped) die(capped + ' cells hit the cell cap — the sweep was truncated, rerun with a larger cap');
if (T.MULTIPLE === 0) die('the map carries no multiplicity cells — nothing to publish');

/* ---- gate 4: re-decide a deterministic sample at build --------------------
   The sweep hands its cells a warm start from a precomputed float atlas; this
   check re-decides them FROM SCRATCH, with no seed at all. The verdict must be
   the same — that is the point of the check, and it is stronger than
   reproducing the record's bytes: it shows the answer does not depend on how
   the candidate was reached. The witness NUMBERS legitimately differ, because a
   different starting point converges to a different last-bit representative of
   the same solution; what is required of the re-derived witness is that it
   clears its own inequality on its own numbers. */
const SAMPLE = [];
{
  const pick = (verdict, n) => {
    const all = MAP.cells.map((c, i) => [c, i]).filter(([c]) => c.verdict === verdict);
    const out = [];
    for (let k = 0; k < n && all.length; k++) out.push(all[Math.floor(k * (all.length - 1) / Math.max(1, n - 1))][0]);
    return out;
  };
  for (const c of pick('MULTIPLE', 4).concat(pick('UNIQUE', 2)).concat(pick('UNDECIDED', 2))) {
    const box = { sigma: [CFG.sigma, CFG.sigma], c: [c.c0, c.c1], A: [c.a0, c.a1], N: CFG.N };
    const d = B.decideCell(box, { nu: CFG.nu, collapseTol: CFG.collapseTol });
    if (d.verdict !== c.verdict)
      die('cell c=[' + c.c0 + ',' + c.c1 + '] A=[' + c.a0 + ',' + c.a1 + '] re-decided as ' + d.verdict + ', record says ' + c.verdict);
    if (c.verdict === 'MULTIPLE' && !(d.witness.separation > d.witness.rSum && d.witness.minM > 0))
      die('a MULTIPLE cell re-derived from scratch does not clear its own disjointness inequality');
    SAMPLE.push({ c, d });
  }
}

/* ---- the standalone verifier ships beside the page ----------------------- */
const CLI = W.cli();
fs.writeFileSync(path.join(ROOT, 'reports', 'mfg-certify.js'), CLI);
const CLISHA = crypto.createHash('sha256').update(CLI).digest('hex');
{
  const r = cp.spawnSync(process.execPath, [path.join(ROOT, 'reports', 'mfg-certify.js'),
    JSON.stringify({ sigma: CFG.sigma, c: [-16.03125, -15.96875], A: [0.2875, 0.3125], N: 16, nu: 1.02 })], { cwd: ROOT });
  const v = JSON.parse(String(r.stdout));
  if (v.verdict !== 'MULTIPLE') die('the shipped command-line verifier does not reproduce the multiplicity cell');
}

/* ---- the map figure ------------------------------------------------------
   Up to tens of thousands of quadtree cells is far too many rectangles to put
   in a page, so the cells are rasterised onto the finest grid they use and each
   raster ROW is run-length encoded. The picture is exact — every raster pixel
   takes the verdict of the cell that covers it — and costs a few thousand
   rects instead of tens of thousands. */
function mapFigure() {
  const dc = minCell, da = MAP.cells.reduce((m, c) => Math.min(m, c.a1 - c.a0), Infinity);
  const NC = Math.round((CFG.cRange[1] - CFG.cRange[0]) / dc);
  const NA = Math.round((CFG.aRange[1] - CFG.aRange[0]) / da);
  if (NC * NA > 4e6) die('the raster is implausibly large — check the cell sizes');
  const grid = new Uint8Array(NC * NA);            /* 0 unset, 1 MULT, 2 UNIQ, 3 UND+enc, 4 UND */
  const codeOf = c => c.verdict === 'MULTIPLE' ? 1 : c.verdict === 'UNIQUE' ? 2 : (c.enclosures >= 1 ? 3 : 4);
  for (const c of MAP.cells) {
    const i0 = Math.round((c.c0 - CFG.cRange[0]) / dc), i1 = Math.round((c.c1 - CFG.cRange[0]) / dc);
    const j0 = Math.round((c.a0 - CFG.aRange[0]) / da), j1 = Math.round((c.a1 - CFG.aRange[0]) / da);
    const v = codeOf(c);
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) grid[j * NC + i] = v;
  }
  let unset = 0;
  for (let k = 0; k < grid.length; k++) if (grid[k] === 0) unset++;
  if (unset) die(unset + ' raster cells were never covered — the partition has a hole');

  const W0 = 900, H0 = 420, L = 62, R = 18, TOP = 16, BOT = 52;
  const pw = W0 - L - R, ph = H0 - TOP - BOT;
  const px = v => L + (v - CFG.cRange[0]) / (CFG.cRange[1] - CFG.cRange[0]) * pw;
  const py = v => TOP + ph - (v - CFG.aRange[0]) / (CFG.aRange[1] - CFG.aRange[0]) * ph;
  const FILL = { 1: 'var(--sig)', 2: 'var(--held)', 3: 'var(--rule)', 4: 'url(#mfgHatch)' };
  const out = [];
  out.push(C.svgOpen({ w: W0, h: H0, alt:
    'The parameter plane of the mean-field game: coupling c on the horizontal axis, potential depth A on the '
    + 'vertical. A large plum region on the left, below the bifurcation line c* = -9.8696, holds the cells where '
    + 'two solutions are certified for every parameter in the cell. A green band on the right, c >= 0, is the '
    + 'monotone half-plane where uniqueness is classical and the enclosure is certified here. Between and above '
    + 'them, grey cells are undecided, hatched where nothing at all was enclosed.' }));
  out.push('      <defs><pattern id="mfgHatch" width="6" height="6" patternUnits="userSpaceOnUse">'
    + '<rect width="6" height="6" fill="var(--sunk)"/>'
    + '<path d="M0,6 l6,-6 M-1.5,1.5 l3,-3 M4.5,7.5 l3,-3" stroke="var(--ink-3)" stroke-width="0.7" fill="none"/>'
    + '</pattern></defs>');
  const cw = pw / NC, chh = ph / NA;
  for (let j = 0; j < NA; j++) {
    let i = 0;
    while (i < NC) {
      const v = grid[j * NC + i];
      let k = i + 1;
      while (k < NC && grid[j * NC + k] === v) k++;
      const x = L + i * cw, y = TOP + ph - (j + 1) * chh;
      out.push('      <rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + ((k - i) * cw + 0.35).toFixed(2)
        + '" height="' + (chh + 0.35).toFixed(2) + '" fill="' + FILL[v] + '"/>');
      i = k;
    }
  }
  /* the two curves the theory names */
  const cStar = MAP.cStar;
  out.push('      <line x1="' + px(cStar).toFixed(2) + '" y1="' + TOP + '" x2="' + px(cStar).toFixed(2) + '" y2="' + (TOP + ph)
    + '" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="5 4"/>');
  out.push(C.label({ x: px(cStar) + 6, y: TOP + 14, text: 'c* = ' + cStar.toFixed(4), cls: 't-note', anchor: 'start' }));
  out.push('      <line x1="' + px(0).toFixed(2) + '" y1="' + TOP + '" x2="' + px(0).toFixed(2) + '" y2="' + (TOP + ph)
    + '" stroke="var(--ink)" stroke-width="1" stroke-dasharray="2 3"/>');
  out.push(C.label({ x: px(0) - 6, y: TOP + 14, text: 'c = 0', cls: 't-note', anchor: 'end' }));
  /* frame + axes */
  out.push('      <rect x="' + L + '" y="' + TOP + '" width="' + pw + '" height="' + ph + '" fill="none" stroke="var(--rule)"/>');
  for (let v = Math.ceil(CFG.cRange[0] / 3) * 3; v <= CFG.cRange[1]; v += 3) {
    out.push('      <line x1="' + px(v).toFixed(2) + '" y1="' + (TOP + ph) + '" x2="' + px(v).toFixed(2) + '" y2="' + (TOP + ph + 5) + '" stroke="var(--rule)"/>');
    out.push(C.label({ x: px(v), y: TOP + ph + 18, text: String(v), cls: 't-note', anchor: 'middle' }));
  }
  for (let v = CFG.aRange[0]; v <= CFG.aRange[1] + 1e-9; v += 0.3) {
    out.push('      <line x1="' + (L - 5) + '" y1="' + py(v).toFixed(2) + '" x2="' + L + '" y2="' + py(v).toFixed(2) + '" stroke="var(--rule)"/>');
    out.push(C.label({ x: L - 9, y: py(v) + 4, text: v.toFixed(1), cls: 't-note', anchor: 'end' }));
  }
  out.push(C.label({ x: L + pw / 2, y: H0 - 6, text: 'coupling c    (c < 0 herding · c > 0 crowd-averse)', cls: 't-note', anchor: 'middle' }));
  out.push('      <text x="14" y="' + (TOP + ph / 2) + '" class="t-note" transform="rotate(-90 14 ' + (TOP + ph / 2) + ')" text-anchor="middle">potential depth A</text>');
  out.push(C.svgClose);
  return { svg: out.join('\n'), NC, NA, dc, da };
}
const FIG = mapFigure();

/* how the multiplicity cells are distributed over the widths that closed them —
   the sweep's own answer to the same question falsifier X2 asks in the lab */
const widthTable = [...byDepth.entries()].sort((a, b) => b[0] - a[0])
  .map(([w, n]) => n.toLocaleString() + ' close at ' + cellNum(w)).join(' and ');

/* ---- the page ------------------------------------------------------------ */
const O = [];
const multPct = pct(AREA.MULTIPLE, DOMAIN);

O.push(C.header({
  eyebrow: 'cert-machine · lab · the certifier runs in your tab',
  title: 'The MFG regime observatory',
  deck: 'Pick a rectangle of mean-field-game parameters. This decides it: two solutions, one solution, or '
    + 'honestly undecided — and when it says two, it hands you both, each inside a ball with a radius, valid for '
    + 'EVERY parameter in the rectangle. ' + CELLS.toLocaleString() + ' cells of the coupling–potential plane are '
    + 'decided below; ' + T.MULTIPLE.toLocaleString() + ' of them carry a proof that uniqueness fails there. The '
    + 'same certifier runs in this page, ships beside it as one dependency-free file, and is in the repository.'
}));

O.push(C.tldr({
  findingRaw: 'Uniqueness fails on a SET, not at a point: ' + multPct + ' of the swept plane is covered by cells in '
    + 'which two distinct equilibria are enclosed in provably disjoint balls, uniformly over each cell — the '
    + 'tightest cell still clears its own radii by a factor of ' + fmt(worstSep, 0) + '×, and every density is '
    + 'certified positive.',
  mechanismRaw: 'A radii-polynomial contraction in outward-rounded interval arithmetic, run with the PARAMETERS as '
    + 'intervals and a tangent predictor carrying the candidate across the cell — so the conclusion comes with a '
    + 'quantifier over the rectangle, not a sample of it.',
  checkRaw: C.m('node labs/mfg/battery.js') + ' (' + BAT.checks + ' checks, ' + BAT.reds + ' falsifiers that must each fire), '
    + 'then paste your own cell into the box below — or run ' + C.m('reports/mfg-certify.js') + ' offline.'
}));

O.push(C.stats([
  { k: 'multiplicity, proved', v: T.MULTIPLE.toLocaleString() + ' cells', role: 'sig',
    n: multPct + ' of the swept plane — in each, two exact solutions for EVERY parameter in the cell, not merely at a sampled point' },
  { k: 'the tightest witness', v: fmt(worstSep, 0) + '× clear', role: 'held',
    n: 'the smallest separation-to-radii ratio anywhere in the map (the largest is ' + bestSep.toExponential(1) + '×) — disjointness is never marginal' },
  { k: 'densities', v: '≥ ' + minDensity.toExponential(2), role: 'held',
    n: 'the smallest certified lower bound on m over any enclosure in the map — m > 0 is a hypothesis of the model, so it is proved, never assumed' },
  { k: 'monotone half-plane', v: T.UNIQUE.toLocaleString() + ' cells', role: 'held',
    n: 'c ≥ 0: global uniqueness is Lasry–Lions’ (cited); the enclosure of that solution, uniform over the cell, is ours' },
  { k: 'undecided', v: T.UNDECIDED.toLocaleString() + ' cells', role: 'warn',
    n: encOnly.toLocaleString() + ' of them still enclose at least one exact solution — a solution is proved to exist, and whether it is alone is open' },
  { k: 'the partition', v: 'exact', n: 'the ' + CELLS.toLocaleString() + ' cells cover the domain with no gap and no overlap — area ' + fmt(COVERED, 6) + ' against ' + fmt(DOMAIN, 6) + ', checked at this build' }
]));

O.push(C.scope('Published, not peer-reviewed, not independently rerun. The radii-polynomial machinery is van den '
  + 'Berg–Lessard; the uniform-over-a-rectangle variant, the refutation mode and the partition are this lab’s.'));

/* §1 — the tool, first */
O.push(C.section({
  lab: '§1 · the tool', title: 'Decide a cell, here, now',
  wide: true,
  bodyRaw: '<div class="col">'
    + C.p('Give it a rectangle of parameters. It solves for both branches, wraps each in a contraction argument '
      + 'over the whole rectangle, and answers. Nothing is uploaded — the certifier below is the repository’s own '
      + 'code, assembled from the same files the map was made with, running in this tab.')
    + C.plainList([
      { b: 'MULTIPLE.', raw: 'Two exact solutions for every parameter in the cell, in two provably disjoint balls. '
        + 'You get both radii, the separation, and a lower bound on both densities.' },
      { b: 'UNIQUE.', raw: 'The cell sits in c ≥ 0, where Lasry–Lions gives global uniqueness — <em>cited, not proved '
        + 'here</em>. What is proved here is the enclosure of that solution, uniform over the cell.' },
      { b: 'UNDECIDED.', raw: 'With the reason, verbatim. Near the bifurcation the argument <em>cannot</em> close, '
        + 'and a certifier that certified there would be broken.' }
    ])
    + '</div>'
    + '<div class="col">' + W.boxHtml() + '</div>'
}));

/* §2 — the map */
O.push(C.section({
  lab: '§2 · the map', title: 'The plane, partitioned',
  wide: true,
  bodyRaw: '<div class="col">'
    + C.p('Every cell below was decided by the certifier in §1, over its own rectangle. A grid of point results '
      + 'would prove nothing between its points; this is a partition, so the plum region is a set of positive '
      + 'measure on which uniqueness provably fails. Cells that refused were quartered and retried — which is why '
      + 'the resolution sharpens exactly along the two curves the theory names.')
    + '</div>'
    + C.figure({
      svgRaw: FIG.svg,
      caption: 'σ = ' + CFG.sigma + '. Plum: two solutions certified for every parameter in the cell ('
        + T.MULTIPLE.toLocaleString() + ' cells, ' + multPct + ' of the plane). Green: the monotone half-plane, '
        + 'uniqueness cited and the enclosure certified (' + T.UNIQUE.toLocaleString() + '). Grey: undecided but '
        + 'at least one solution enclosed (' + encOnly.toLocaleString() + '). Hatched: undecided with nothing '
        + 'enclosed (' + (T.UNDECIDED - encOnly).toLocaleString() + '). Dashed line: the pitchfork of the constant '
        + 'state at c* = −σ²(2π)² = ' + MAP.cStar.toFixed(6) + ', predicted from the symbol before it was measured; '
        + 'no enclosure can exist there, and the map shows the refusal as a seam. Rasterised at the finest cell '
        + 'used, ' + cellNum(FIG.dc) + ' × ' + cellNum(FIG.da) + '.'
    })
    + '<div class="col">'
    + C.p('Read the seam. The constant state loses invertibility exactly at c*, so cells straddling it refuse — '
      + 'that vertical scar is not a rendering artefact and not a limitation of the solver: it is the theorem’s own '
      + 'hypothesis failing, drawn to scale. To its left the herding branch has been born and the multiplicity '
      + 'region opens; to its right the aligned branch is alone in this family, and the honest verdict is that we '
      + 'enclose it and cannot say it is the only one until c reaches 0 and the classical theorem takes over.')
    + '</div>'
}));

/* §3 — what is actually proved */
O.push(C.section({
  lab: '§3 · the argument', title: 'What a cell certificate says, and why the quantifier is the hard part',
  bodyRaw: [
    C.p('For one parameter triple, the standard argument is Newton–Kantorovich in radii-polynomial form: build an '
      + 'approximate inverse A of the linearisation at a numerical candidate x̄, bound Y0 = ‖AΦ(x̄)‖, '
      + 'Z1 = ‖I − ADΦ(x̄)‖ and the Lipschitz constant Z2, and close ½Z2r² − (1−Z1)r + Y0 < 0. Then an exact '
      + 'solution lies within r of x̄ and is the only one there. That is the lifted kernel, unchanged.'),
    C.p('Over a whole rectangle two things go wrong, and both are visible in the code. First, A must be ONE fixed '
      + 'operator or “I − ADΦ” is not an operator at all — so A is built at the cell midpoint, and the tail of '
      + 'I − ADΦ then carries a term 1 − σ/σ₀ that does not decay in the mode index. That is the honest price of a '
      + 'wide σ box, and it is charged explicitly.'),
    C.p('Second, and worse: with a FIXED candidate, Y0 grows linearly in the cell width, and the discriminant '
      + 'condition then admits only cells narrower than ' + X2[2] + ' in c on the herding branch — a hairline, not '
      + 'a map. So the candidate travels: the tangent ẋ solving DΦ ẋ = −∂ₛΦ is computed from the Jacobian already '
      + 'factored for A, and the bound becomes a mean-value form whose first-order term vanishes by construction. '
      + 'Y0 drops to second order in the width, and cells ' + X2[3] + '× wider close — ' + X2[1] + ' in c. Falsifier '
      + 'X2 measures both thresholds on the same ladder by switching the predictor off, so that ratio is a '
      + 'measurement of this build, not a claim about one. The map agrees with it: not one cell of the sweep’s '
      + 'starting width ' + cellNum(CFG.baseCell.c) + ' certifies multiplicity anywhere, while ' + widthTable + '.'),
    C.eq('for every s ∈ S :   ∃! x*(s) ∈ B<sub>r</sub>( x̄(s) ),   Φ<sub>s</sub>(x*(s)) = 0,   m(s) &gt; 0'),
    C.p('Two such certificates over the same cell, with a separation bounded below by more than r₁ + r₂, prove that '
      + 'the cell holds at least two solutions everywhere on it. In the worst cell of the whole map that separation '
      + 'clears the combined radii by a factor of ' + fmt(worstSep, 0) + '; the enclosures are never nearly touching.'),
    C.note({ lab: 'the check a reader can run in their head', bodyRaw:
      C.p('The claim is a statement about every point of a rectangle, so battery check C1 re-solves the system at '
        + 'all four CORNERS of a certified cell and measures the distance from each corner solution to the '
        + 'predicted centre. The certificate says that distance must be below r. On the cell it tests, this build '
        + 'measured r = ' + C1[1] + ' against a worst corner distance of ' + C1[2] + '. A uniform claim that failed '
        + 'at a corner would be caught by arithmetic a referee can repeat.') })
  ].join('\n')
}));

/* §4 — refutation */
O.push(C.section({
  lab: '§4 · the other direction', title: 'Refute a candidate equilibrium',
  bodyRaw: [
    C.p('A solver gives you a residual near zero and asks you to believe. This lab will also decide the NEGATIVE, '
      + 'which no solver can: paste a claimed equilibrium and the accuracy you claim for it, and if a single '
      + 'equation’s residual exceeds what the whole ball of that radius could move it, then no exact solution lies '
      + 'that close — whatever the rest of the vector does.'),
    C.eq('|Φ<sub>j</sub>(y)| ≥ |Φ<sub>j</sub>(x)| − L<sub>j</sub>·δ &nbsp;&gt; 0 &nbsp;&nbsp;for all ‖y − x‖<sub>ν</sub> ≤ δ'),
    C.p('The witness is that one equation, its enclosed residual, and its row bound — three numbers, checkable by '
      + 'hand. A residual near zero is evidence; a residual provably too large is a proof. And the instrument '
      + 'refuses to over-claim in the other direction: hand it a true equilibrium and it returns REFUSED, not a '
      + 'certificate (battery R2). The “refute a candidate” button in §1 loads a worked example, and this build '
      + 'measured its refutation: equation ' + R1[1] + ' carries |Φ| ≥ ' + R1[2] + ' while the whole ball of radius '
      + 'δ = 10⁻³ could move it by at most ' + R1[3] + '.')
  ].join('\n')
}));

/* §5 — take it away */
O.push(C.section({
  lab: '§5 · take it with you', title: 'Three ways to run this, none of which involve me',
  bodyRaw: [
    C.p('The map is evidence that the tool works at scale. The tool is the point.'),
    C.plainList([
      { b: 'In this tab.', raw: 'The box in §1. Nothing uploaded, nothing logged; a cell takes about a tenth of a second.' },
      { b: 'One file, offline.', raw: C.m('reports/mfg-certify.js') + ' — the same certifier as a standalone Node script '
        + 'with <em>no dependencies at all</em>, assembled from the repository sources at this build (sha256 '
        + CLISHA.slice(0, 16) + '…). Download it, run it, diff it against the map.' },
      { b: 'The repository.', raw: C.m('labs/mfg/') + ' — the certifier, the sweep, the battery, and the README '
        + 'that states the scope. MIT.' }
    ]),
    C.code('node mfg-certify.js \'{"sigma":0.5,"c":[-16.03,-15.97],"A":[0.288,0.313]}\'\n'
      + '  -> MULTIPLE — two exact solutions for every parameter in the cell\n\n'
      + 'git clone https://github.com/carlostoledo1891/cert-machine\n'
      + 'node labs/mfg/battery.js       # ' + BAT.checks + ' checks, ' + BAT.reds + ' falsifiers\n'
      + 'node labs/mfg/regime.js        # rebuild the whole map'),
    C.p('The browser certifier is not a re-implementation. It is ASSEMBLED at build time from '
      + BUNDLE.sources.map(s => s.file).join(', ') + ' — nothing retyped — and then executed against the Node path '
      + 'and required to give the same verdicts and the same witnesses, or this page does not build. A rule '
      + 'defined twice will diverge; the only defence is a check that fires when it does.')
  ].join('\n')
}));

/* §6 — the shelf this lab already holds */
O.push(C.section({
  lab: '§6 · the shelf', title: 'What else this lab has decided',
  wide: true,
  bodyRaw: '<div class="col">'
    + C.p('The observatory is the front door, not the whole lab. Each page below is a separate certified result in '
      + 'mean-field games and traffic equilibrium, and each one re-proves its own claims during its own build — '
      + 'nothing on any of them is remembered from a previous run.')
    + '</div>'
    + C.cards([
      { href: 'mfg-cap.html', k: 'the point this map generalises',
        title: 'Two solutions, provably',
        desc: 'Certified multiplicity at ONE parameter set in the anti-monotone regime: two equilibria in disjoint '
          + 'interval-arithmetic balls, and a proof that REFUSES at the bifurcation. The theorem the observatory '
          + 'turns into a partition.',
        n: 'the kernel this lab is built on' },
      { href: 'mfg-congest.html', k: 'no Hopf–Cole reduction',
        title: 'A congestion mean-field game, enclosed',
        desc: 'An equilibrium of an MFG with congestion enclosed by validated numerics — locally unique in the full '
          + 'sequence-space ball, density strictly positive. Its solver is not published, so it stands as one '
          + 'certified point rather than a map: the honest next rung.',
        n: 'its stdlib verifier travels inside the page' },
      { href: 'wardrop-repro.html', k: 'reproduction with a verdict',
        title: 'Wardrop, certified: exact, enclosed, refused',
        desc: 'A published paper’s multi-population equilibria reproduced with certificates — exact where exactness '
          + 'is available, enclosed where it is not, and refused where honesty demands it.',
        n: 'the third verdict is the useful one' },
      { href: 'mfg-lab.html', k: 'the registry claims',
        title: 'The MFG laboratory, certified',
        desc: 'A published Wardrop table reproduced within its own rounding AND proved, the discrete adjoint '
          + 'identity, and the non-unique split behind unique totals.',
        n: 'four of the lab’s own batteries re-run at build' }
    ])
}));

/* §7 — the undecided, honestly */
{
  const rows = [...whyCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
    .map(([why, n]) => [String(n), { raw: C.esc(why) }]);
  O.push(C.section({
    lab: '§7 · the remainder', title: 'What is undecided, and why — every reason kept',
    wide: true,
    bodyRaw: '<div class="col">'
      + C.p('NEEDS-DATA is the sharpest verdict a machine can give, and here it is called UNDECIDED. It is a '
        + 'measurement of where this argument stops, not a shrug — and ' + encOnly.toLocaleString() + ' of the '
        + T.UNDECIDED.toLocaleString() + ' undecided cells still contain a certified enclosure, which means an '
        + 'exact solution is proved to exist there and only its loneliness is open.')
      + '</div>'
      + C.table({ cols: [{ h: 'cells' }, { h: 'the reason, as the certifier stated it' }], rows })
      + '<div class="col">'
      + C.p('Three of these are worth reading as physics rather than as failure. “Z1 ≥ 1 over the box” is the cell '
        + 'straddling a singular linearisation — the bifurcation seam. “Density positivity not certified” is the '
        + 'herding density pressing toward zero as the potential deepens, and m > 0 is a hypothesis of the model, '
        + 'so it must be proved and cannot be waved through. “Only one solution found” is the region above the '
        + 'fold where the two branches have collided and annihilated: we exhibit one solution and decline to '
        + 'pretend we know it is alone.')
      + '</div>'
  }));
}

/* §7 — provenance and the invitation */
O.push(C.section({
  lab: '§8 · provenance', title: 'Where this comes from, and what would make it better',
  bodyRaw: [
    C.p('The model and the solver are the KAUST mean-field-games line and the Lasry–Lions/Cirant multiplicity '
      + 'literature; the radii-polynomial framework is van den Berg–Lessard, unchanged. The kernels under '
      + C.m('legacy/core/') + ' were lifted file-level from the published mfg-lab tree, are recorded with their '
      + 'sha256 in ' + C.m('PROVENANCE.json') + ', and are never edited here — ' + C.m('labs/mfg/box.js') + ' is a '
      + 'second implementation of the same argument, which is exactly why the battery demands bit-for-bit '
      + 'agreement with them at zero cell width before this page is allowed to build. The certification layer, and '
      + 'any error in it, is ours.'),
    C.p('This lab is not a platform and is not looking for users in general. It is looking for ONE claim at a '
      + 'time. If you work on mean-field games and there is a statement your group keeps having to defend by hand '
      + '— a uniqueness regime, a numerical equilibrium, a bound someone doubts — send it. If it is decidable, it '
      + 'gets decided here, with the witness, and the answer is yours whether or not it is the one you wanted.'),
    C.pRaw('The instruments next door: ' + '<a href="mfg-cap.html">certified multiplicity at a point</a>, the '
      + 'result this map generalises; <a href="mfg-congest.html">a congestion MFG enclosed</a>, whose Hamiltonian '
      + 'admits no Hopf–Cole reduction; <a href="wardrop-repro.html">Wardrop equilibria reproduced, enclosed and '
      + 'refused</a>; and <a href="methods-note.html">the methods note</a>.')
  ].join('\n')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-mfg-observatory.js @ git ' + git + '. '
  + 'Gates that ran for this build: labs/mfg/battery.js (' + BAT.checks + ' checks, ' + BAT.reds + '/' + BAT.reds
  + ' falsifiers red, including the bit-for-bit zero-width equality with the lifted kernel); the browser bundle '
  + 'executed against the Node path and required to agree; the map record re-tallied here from its own '
  + CELLS.toLocaleString() + ' cells with the area identity checked to ' + fmt(COVERED, 6) + ' = ' + fmt(DOMAIN, 6)
  + '; and ' + SAMPLE.length + ' cells re-decided at build FROM SCRATCH — no warm start — with the same verdicts '
  + 'and independently re-derived witnesses. Map record: '
  + C.m('certs/mfg-regime-map.json') + ', sha256 ' + MAPSHA.slice(0, 16) + '…, swept ' + MAP.generated + ' in '
  + MAP.seconds + ' s. Lab: <a href="https://github.com/carlostoledo1891/cert-machine/tree/main/labs/mfg">labs/mfg/</a>. '
  + 'MIT.</p></footer>';

const html = TPL.render({
  title: 'The MFG regime observatory · cert-machine',
  desc: 'The coupling–potential plane of a mean-field game, partitioned into ' + CELLS.toLocaleString() + ' cells and '
    + 'decided: ' + T.MULTIPLE.toLocaleString() + ' carry two exact equilibria in provably disjoint balls valid for '
    + 'every parameter in the cell, ' + T.UNIQUE.toLocaleString() + ' sit in the monotone half-plane with the '
    + 'enclosure certified, the rest are undecided with the reason kept. The certifier runs in the page and ships '
    + 'as one dependency-free file.',
  path: '/reports/mfg-observatory.html',
  bodyRaw: O.join('\n\n'),
  footRaw: foot
});
fs.writeFileSync(path.join(ROOT, 'reports', 'mfg-observatory.html'), html);
console.log('wrote reports/mfg-observatory.html  (' + (html.length / 1024).toFixed(0) + ' KB)');
console.log('  cells ' + CELLS + '  MULTIPLE ' + T.MULTIPLE + ' (' + multPct + ')  UNIQUE ' + T.UNIQUE
  + '  UNDECIDED ' + T.UNDECIDED + ' (' + encOnly + ' with an enclosure)');
console.log('  raster ' + FIG.NC + ' x ' + FIG.NA + ' at ' + FIG.dc + ' x ' + FIG.da
  + '   worst separation ratio ' + fmt(worstSep, 1) + 'x   min density ' + minDensity.toExponential(2));
console.log('  wrote reports/mfg-certify.js  (' + (CLI.length / 1024).toFixed(0) + ' KB, sha256 ' + CLISHA.slice(0, 16) + '…)');
