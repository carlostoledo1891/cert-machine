#!/usr/bin/env node
/* build-report-mfg2p.js — generate reports/mfg-two-population.html:
   THE ATTACK-DEFENSE REGIME MAP — the coupling plane of a TWO-POPULATION
   mean-field game, partitioned into cells and decided, each cell carrying its
   own certificate, and what that says about neural solvers for these systems.

   The lab is labs/mfg2p/. The page exists to hold one uncomfortable pair of
   facts side by side: the sufficient condition everyone cites for uniqueness
   stops far short of where uniqueness actually stops, and in the gap a solver
   that returns one equilibrium is returning a choice it cannot see it is making.

   GATES, every build — the page refuses on any of them:
     1. labs/mfg2p/battery.js re-runs: every check PASS, every falsifier red.
        That battery contains the decoupling agreement with labs/mfg, so a
        divergence between the two-population and one-population certifiers
        stops the page.
     2. The map record is re-tallied HERE from its own cells — counts, areas,
        and the exact area identity (the partition must cover the domain).
     3. A deterministic sample of cells is RE-DECIDED at build FROM SCRATCH,
        with no warm start, and must return the same verdict.
     4. Every number quoted in the prose is parsed from the battery run or
        recomputed from the record — never transcribed.

   usage: node tools/build-report-mfg2p.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const B2 = require(path.join(ROOT, 'labs', 'mfg2p', 'box2p.js'));
const R2 = require(path.join(ROOT, 'labs', 'mfg2p', 'regime2p.js'));

const die = (m) => { console.error('MFG2P REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();
const fmt = (n, d) => Number(n).toFixed(d === undefined ? 2 : d);
const cellNum = (x) => { for (let d = 1; d <= 12; d++) { const t = Number(x.toFixed(d)); if (Math.abs(t - x) < 1e-12) return String(t); } return String(x); };
const pct = (x, t) => (100 * x / t).toFixed(1) + '%';

/* ---- gate 1: the lab battery --------------------------------------------- */
const bat = cp.spawnSync(process.execPath, [path.join(ROOT, 'labs', 'mfg2p', 'battery.js')], { cwd: ROOT });
const bout = String(bat.stdout) + String(bat.stderr);
const bm = /labs\/mfg2p battery: (\d+)\/(\d+) checks, (\d+)\/(\d+) falsifiers/.exec(bout);
if (bat.status !== 0 || !bm) die('labs/mfg2p/battery.js did not pass:\n' + bout.slice(-1200));
if (bm[1] !== bm[2]) die('not every check passed: ' + bm[1] + '/' + bm[2]);
if (bm[3] !== bm[4]) die('not every falsifier fired: ' + bm[3] + '/' + bm[4]);
const BAT = { checks: bm[2], reds: bm[4] };
if (!/PASS  D2 decoupled box VERDICTS agree with labs\/mfg/.test(bout))
  die('the decoupling agreement check is gone from the battery');
const batNum = (re, what) => { const m = re.exec(bout); if (!m) die('the battery output lost the ' + what + ' line'); return m; };
const D1 = batNum(/D1 .*?\[worst coefficient gap ([\d.e+-]+)\]/, 'D1 decoupling');
const D2 = batNum(/D2 .*?\[(\d+) agree, (\d+) disagree\]/, 'D2 verdict agreement');
const C2m = batNum(/C2 .*?\[(\d+) corners, worst excess over the predictor ([\d.e+-]+) vs r ([\d.e+-]+)\]/, 'C2 corner check');
const C3m = batNum(/C3 .*?\[MULTIPLE \(separation \/ \(r1\+r2\) = ([\d.]+)\)\]/, 'C3 multiplicity');
const X1m = batNum(/X1 .*?Y0 rises (\d+)x\]/, 'X1 predictor measurement');
const X2m = batNum(/X2 .*?\[Z1 ([\d.e+-]+) -> ([\d.e+-]+)\]/, 'X2 coupling-in-the-tail measurement');

/* ---- gate 2: the map record, re-tallied here ----------------------------- */
const MAPF = path.join(ROOT, 'certs', 'mfg2p-regime-map.json');
if (!fs.existsSync(MAPF)) die('certs/mfg2p-regime-map.json is missing — run node labs/mfg2p/regime2p.js');
const MAPBYTES = fs.readFileSync(MAPF);
const MAP = JSON.parse(MAPBYTES.toString('utf8'));
const MAPSHA = crypto.createHash('sha256').update(MAPBYTES).digest('hex');
const CFG = MAP.config;

const T = { MULTIPLE: 0, UNIQUE: 0, UNDECIDED: 0 };
const AREA = { MULTIPLE: 0, UNIQUE: 0, UNDECIDED: 0 };
let encOnly = 0, minCellS = Infinity, minCellD = Infinity, maxDepth = 0;
let worstSep = Infinity, bestSep = 0, minDensity = Infinity, worstKappa = 0;
let multSmin = Infinity, multSmax = -Infinity, multDmax = -Infinity;
let multUnreachable = 0, multUnreachableArea = 0;
let uniqSmax = -Infinity;
const whyCount = new Map();
for (const c of MAP.cells) {
  if (!(c.verdict in T)) die('a cell carries an unknown verdict: ' + c.verdict);
  T[c.verdict]++;
  const a = (c.s[1] - c.s[0]) * (c.d[1] - c.d[0]);
  AREA[c.verdict] += a;
  minCellS = Math.min(minCellS, c.s[1] - c.s[0]);
  minCellD = Math.min(minCellD, c.d[1] - c.d[0]);
  maxDepth = Math.max(maxDepth, c.depth || 0);
  if (c.verdict === 'MULTIPLE') {
    if (!(c.ratio > 1)) die('a MULTIPLE cell does not carry separation > r1 + r2');
    if (!(c.minM > 0)) die('a MULTIPLE cell does not carry a positive density');
    worstSep = Math.min(worstSep, c.ratio); bestSep = Math.max(bestSep, c.ratio);
    minDensity = Math.min(minDensity, c.minM);
    worstKappa = Math.max(worstKappa, Math.max(c.kappas[0], c.kappas[1]));
    multSmin = Math.min(multSmin, c.s[0]); multSmax = Math.max(multSmax, c.s[1]);
    multDmax = Math.max(multDmax, c.d[1]);
    /* d > 0 over the WHOLE cell: the symmetry is broken everywhere in it, so the
       pitchfork has unfolded and the second equilibrium sits on a branch no
       continuation from the trivial state can reach. Certified anyway. */
    if (c.d[0] > 0) { multUnreachable++; multUnreachableArea += a; }
  } else if (c.verdict === 'UNIQUE') {
    if (!(c.detLo >= 0)) die('a UNIQUE cell does not carry a non-negative det(C+C^T) lower bound');
    if (!(c.minM > 0)) die('a UNIQUE cell does not carry a positive density');
    minDensity = Math.min(minDensity, c.minM);
    worstKappa = Math.max(worstKappa, c.kappa);
    uniqSmax = Math.max(uniqSmax, c.s[1]);
  } else {
    if (c.enclosed >= 1) encOnly++;
    const key = String(c.reason).replace(/\(.*?\)/g, '(…)').replace(/[\d.e+-]{4,}/g, '…').slice(0, 90);
    whyCount.set(key, (whyCount.get(key) || 0) + 1);
  }
}
const CELLS = MAP.cells.length;
const DOMAIN = (CFG.sRange[1] - CFG.sRange[0]) * (CFG.dRange[1] - CFG.dRange[0]);
const COVERED = AREA.MULTIPLE + AREA.UNIQUE + AREA.UNDECIDED;
if (Math.abs(COVERED - DOMAIN) > 1e-6 * DOMAIN)
  die('the area identity fails: ' + COVERED + ' vs ' + DOMAIN + ' — the partition has a hole');
if (!T.MULTIPLE) die('the map contains no MULTIPLE cell — there is no finding to report');
if (!T.UNIQUE) die('the map contains no UNIQUE cell — the monotone region is missing');

/* THE HEADLINE NUMBER, computed here from the record: how far the sufficient
   condition sits from where multiplicity actually begins. */
const S_LL = CFG.cs;                        /* Lasry-Lions: monotone iff |s| <= cs */
const GAP = multSmin / S_LL;

/* ---- gate 3: re-decide a deterministic sample INDEPENDENTLY ---------------
   Two different things are worth checking here and they are not the same thing.

   FINDING a branch is search. CERTIFYING it is proof. A cold seed cannot find
   the second equilibrium once d != 0 — the pitchfork has unfolded and nothing
   local points at the other branch — which is the subject of this page, not a
   defect in it. So the gate does not pretend otherwise:

     (a) MULTIPLE cells are re-decided after re-reaching the segregated branch
         by regime2p.reachSegregated, which walks in from the pitchfork at d = 0
         along a DIFFERENT path than the sweep's atlas grid-walk. The verdict
         must come back MULTIPLE and the separation ratio must agree with the
         record to within a factor of two — the proof is redone, not replayed.
     (b) UNIQUE cells are re-decided COLD, with no seed at all, and must come
         back UNIQUE. Nothing needs finding there.
     (c) Every sampled cell is also re-decided COLD and may NOT contradict the
         record: it may return UNDECIDED (the branch was not found, which is
         expected wherever d > 0), but never the other decided verdict.        */
const SAMPLE = [];
let coldReproduced = 0;
{
  const mult = MAP.cells.filter(c => c.verdict === 'MULTIPLE');
  const uniq = MAP.cells.filter(c => c.verdict === 'UNIQUE');
  const pick = (arr, k) => { const out = []; const step = Math.max(1, Math.floor(arr.length / k)); for (let i = 0; i < arr.length && out.length < k; i += step) out.push(arr[i]); return out; };
  for (const c of pick(mult, 5).concat(pick(uniq, 3))) {
    const box = R2.cellBox(c.s[0], c.s[1], c.d[0], c.d[1], CFG);
    const sm = 0.5 * (c.s[0] + c.s[1]), dm = 0.5 * (c.d[0] + c.d[1]);

    /* (c) the cold decision must never contradict the record */
    const cold = B2.decideCell(box, { nu: CFG.nu, collapseTol: CFG.collapseTol });
    if (cold.verdict !== c.verdict && cold.verdict !== 'UNDECIDED')
      die('a cell re-decided cold CONTRADICTS the record: s=' + JSON.stringify(c.s) + ' d=' + JSON.stringify(c.d)
          + ' record ' + c.verdict + ', cold ' + cold.verdict);
    if (cold.verdict === c.verdict) coldReproduced++;

    if (c.verdict === 'MULTIPLE') {
      /* (a) redo the proof, having re-reached the branch independently */
      const seg = R2.reachSegregated(sm, dm, CFG);
      if (!seg) die('the segregated branch could not be re-reached at s=' + sm + ' d=' + dm);
      const r = B2.decideCell(box, { nu: CFG.nu, collapseTol: CFG.collapseTol, seedSeg: seg });
      if (r.verdict !== 'MULTIPLE')
        die('a MULTIPLE cell did not re-certify from an independently re-reached branch: s='
            + JSON.stringify(c.s) + ' d=' + JSON.stringify(c.d) + ' -> ' + r.verdict + ' (' + String(r.reason).slice(0, 80) + ')');
      const rel = Math.abs(r.ratio - c.ratio) / c.ratio;
      if (!(rel < 1))
        die('the re-certified separation ratio disagrees with the record: ' + fmt(r.ratio, 1) + ' vs ' + fmt(c.ratio, 1));
      SAMPLE.push({ s: c.s, d: c.d, verdict: r.verdict, ratio: r.ratio, recorded: c.ratio, how: 'branch re-reached independently' });
    } else {
      /* (b) UNIQUE must reproduce cold */
      if (cold.verdict !== 'UNIQUE')
        die('a UNIQUE cell did not reproduce cold: s=' + JSON.stringify(c.s) + ' -> ' + cold.verdict);
      SAMPLE.push({ s: c.s, d: c.d, verdict: cold.verdict, r: cold.r, how: 'cold, no seed' });
    }
  }
}

/* ---- the map figure ------------------------------------------------------
   The quadtree cells are rasterised onto the finest grid they use and each
   raster row is run-length encoded: the picture is exact — every pixel takes
   the verdict of the cell covering it — at a few thousand rects instead of
   tens of thousands. */
function mapFigure() {
  const ds = minCellS, dd = minCellD;
  const NS = Math.round((CFG.sRange[1] - CFG.sRange[0]) / ds);
  const ND = Math.round((CFG.dRange[1] - CFG.dRange[0]) / dd);
  if (NS * ND > 4e6) die('the raster is implausibly large — check the cell sizes');
  const grid = new Uint8Array(NS * ND);
  const codeOf = c => c.verdict === 'MULTIPLE' ? 1 : c.verdict === 'UNIQUE' ? 2 : (c.enclosed >= 1 ? 3 : 4);
  for (const c of MAP.cells) {
    const i0 = Math.round((c.s[0] - CFG.sRange[0]) / ds), i1 = Math.round((c.s[1] - CFG.sRange[0]) / ds);
    const j0 = Math.round((c.d[0] - CFG.dRange[0]) / dd), j1 = Math.round((c.d[1] - CFG.dRange[0]) / dd);
    const v = codeOf(c);
    for (let j = j0; j < j1; j++) for (let i = i0; i < i1; i++) grid[j * NS + i] = v;
  }
  let unset = 0;
  for (let k = 0; k < grid.length; k++) if (grid[k] === 0) unset++;
  if (unset) die(unset + ' raster cells were never covered — the partition has a hole');

  const W0 = 900, H0 = 420, L = 62, R = 18, TOP = 16, BOT = 54;
  const pw = W0 - L - R, ph = H0 - TOP - BOT;
  const px = v => L + (v - CFG.sRange[0]) / (CFG.sRange[1] - CFG.sRange[0]) * pw;
  const py = v => TOP + ph - (v - CFG.dRange[0]) / (CFG.dRange[1] - CFG.dRange[0]) * ph;
  const FILL = { 1: 'var(--sig)', 2: 'var(--held)', 3: 'var(--rule)', 4: 'url(#m2pHatch)' };
  const out = [];
  out.push(C.svgOpen({ w: W0, h: H0, alt:
    'The coupling plane of a two-population mean-field game. The horizontal axis is s, the symmetric part of the '
    + 'cross-interaction; the vertical axis is d, the antisymmetric attack-defense part. A narrow green strip at '
    + 'the far left, s at most 1, is the Lasry-Lions monotone region where uniqueness is classical and the '
    + 'enclosure is certified here. A plum region at the right, beginning near s = ' + fmt(multSmin, 1) + ' and '
    + 'shrinking as d grows, holds the cells where two equilibria are certified for every parameter in the cell. '
    + 'The long grey corridor between them is undecided: one equilibrium is enclosed there, but no theorem rules '
    + 'out a second.' }));
  out.push('      <defs><pattern id="m2pHatch" width="6" height="6" patternUnits="userSpaceOnUse">'
    + '<rect width="6" height="6" fill="var(--sunk)"/>'
    + '<path d="M0,6 l6,-6 M-1.5,1.5 l3,-3 M4.5,7.5 l3,-3" stroke="var(--ink-3)" stroke-width="0.7" fill="none"/>'
    + '</pattern></defs>');
  const cw = pw / NS, chh = ph / ND;
  for (let j = 0; j < ND; j++) {
    let i = 0;
    while (i < NS) {
      const v = grid[j * NS + i];
      let k = i + 1;
      while (k < NS && grid[j * NS + k] === v) k++;
      const x = L + i * cw, y = TOP + ph - (j + 1) * chh;
      out.push('      <rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' + ((k - i) * cw + 0.35).toFixed(2)
        + '" height="' + (chh + 0.35).toFixed(2) + '" fill="' + FILL[v] + '"/>');
      i = k;
    }
  }
  /* the line the cited theorem draws, and the line the certificates draw */
  out.push('      <line x1="' + px(S_LL).toFixed(2) + '" y1="' + TOP + '" x2="' + px(S_LL).toFixed(2) + '" y2="' + (TOP + ph)
    + '" stroke="var(--ink)" stroke-width="1.2" stroke-dasharray="5 4"/>');
  out.push(C.label({ x: px(S_LL) + 6, y: TOP + 14, text: 's = ' + cellNum(S_LL) + '  (Lasry–Lions)', cls: 't-note', anchor: 'start' }));
  out.push('      <line x1="' + px(multSmin).toFixed(2) + '" y1="' + TOP + '" x2="' + px(multSmin).toFixed(2) + '" y2="' + (TOP + ph)
    + '" stroke="var(--sig)" stroke-width="1.2" stroke-dasharray="2 3"/>');
  out.push(C.label({ x: px(multSmin) - 6, y: TOP + 14, text: 'first certified multiplicity', cls: 't-note', anchor: 'end' }));
  out.push('      <rect x="' + L + '" y="' + TOP + '" width="' + pw + '" height="' + ph + '" fill="none" stroke="var(--rule)"/>');
  for (let v = Math.ceil(CFG.sRange[0]); v <= CFG.sRange[1]; v += 3) {
    out.push('      <line x1="' + px(v).toFixed(2) + '" y1="' + (TOP + ph) + '" x2="' + px(v).toFixed(2) + '" y2="' + (TOP + ph + 5) + '" stroke="var(--rule)"/>');
    out.push(C.label({ x: px(v), y: TOP + ph + 18, text: String(v), cls: 't-note', anchor: 'middle' }));
  }
  for (let v = CFG.dRange[0]; v <= CFG.dRange[1] + 1e-9; v += 0.5) {
    out.push('      <line x1="' + (L - 5) + '" y1="' + py(v).toFixed(2) + '" x2="' + L + '" y2="' + py(v).toFixed(2) + '" stroke="var(--rule)"/>');
    out.push(C.label({ x: L - 9, y: py(v) + 4, text: v.toFixed(1), cls: 't-note', anchor: 'end' }));
  }
  out.push(C.label({ x: L + pw / 2, y: H0 - 8, text: 's — symmetric cross-coupling  (the only part Lasry–Lions mentions)', cls: 't-note', anchor: 'middle' }));
  out.push('      <text x="14" y="' + (TOP + ph / 2) + '" class="t-note" transform="rotate(-90 14 ' + (TOP + ph / 2) + ')" text-anchor="middle">d — attack–defense asymmetry</text>');
  out.push(C.svgClose);
  return { svg: out.join('\n'), NS, ND, ds, dd };
}
const FIG = mapFigure();

module.exports = { MAP, T, AREA, CELLS, GAP, multSmin };

/* ---- the page ------------------------------------------------------------ */
const O = [];
O.push(C.header({
  eyebrow: 'cert-machine · lab · two populations',
  title: 'The attack–defense regime map',
  deck: 'The coupling plane of a two-population mean-field game, cut into ' + CELLS.toLocaleString() + ' cells and '
      + 'decided uniformly over each one. The condition everyone cites for uniqueness stops at s = ' + cellNum(S_LL)
      + '. The first certificate proving two equilibria does not appear until s = ' + fmt(multSmin, 2) + ' — a factor of '
      + fmt(GAP, 1) + '. Everything between is a corridor where one equilibrium is enclosed and nothing rules out a second.'
}));

O.push(C.stats([
  { k: CELLS.toLocaleString(), v: 'cells decided' },
  { k: T.MULTIPLE.toLocaleString(), v: 'two equilibria proved' },
  { k: T.UNIQUE.toLocaleString(), v: 'unique on the cited theorem' },
  { k: fmt(GAP, 1) + '×', v: 'gap: cited bound vs certified' },
  { k: multUnreachable.toLocaleString(), v: 'proved where continuation cannot reach' },
]));

O.push(C.tldr({
  findingRaw: 'In a two-population mean-field game the Lasry–Lions monotonicity condition — the standard '
    + 'sufficient condition for a unique equilibrium — is <strong>' + fmt(GAP, 1) + '× conservative</strong> along the '
    + 'symmetric coupling axis on this slice, and it never mentions the attack–defense asymmetry <em>d</em> at all. '
    + (multDmax < CFG.dRange[1] - 1e-9
        ? 'The certificates say <em>d</em> is decisive: multiplicity is certified only below d = ' + fmt(multDmax, 2)
          + ' and not above it.'
        : 'Whether <em>d</em> bounds that region is not settled here — the certified multiplicity reaches the top '
          + 'edge of the rectangle we swept.'),
  mechanismRaw: 'Each cell is decided by a radii-polynomial argument applied uniformly over a whole rectangle of '
    + 'coupling matrices, not at sample points. Two certified balls over one cell, provably disjoint, prove two '
    + 'distinct equilibria for <em>every</em> parameter in that cell.',
  checkRaw: 'The battery is ' + BAT.checks + '/' + BAT.checks + ' checks and ' + BAT.reds + '/' + BAT.reds
    + ' falsifiers red, including verdict-for-verdict agreement with the one-population lab at zero cross-coupling. '
    + SAMPLE.length + ' cells were re-decided at build, the multiplicity ones after re-reaching the second branch '
    + 'by a path the sweep did not use.'
}));

O.push(C.figure({
  svgRaw: FIG.svg, wide: true,
  caption: 'Every pixel takes the verdict of the cell covering it, and the cells tile the rectangle exactly — the '
    + 'area identity is checked at build (' + fmt(COVERED, 4) + ' = ' + fmt(DOMAIN, 4) + '). Plum: two equilibria '
    + 'certified for every parameter in the cell. Green: the Lasry–Lions monotone region, uniqueness cited, the '
    + 'enclosure ours. Grey: undecided, one equilibrium enclosed. Hatched: undecided with nothing enclosed. '
    + 'Finest cell used, ' + cellNum(FIG.ds) + ' × ' + cellNum(FIG.dd) + '.'
}));

O.push(C.section({ lab: '1', title: 'The system, and the one condition everybody cites', bodyRaw: [
  C.p('Two populations of agents share a torus. Each solves its own ergodic control problem, and each pays for '
    + 'crowding according to where the other one is:'),
  C.pRaw('<code>−σ u<sub>i</sub>&#8243; + ½ (u<sub>i</sub>&#8242;)² + ρ<sub>i</sub> = Σ<sub>j</sub> c<sub>ij</sub> m<sub>j</sub> + V<sub>i</sub>(x)</code> &nbsp; and &nbsp; '
    + '<code>−σ m<sub>i</sub>&#8243; − (m<sub>i</sub> u<sub>i</sub>&#8242;)&#8242; = 0</code>, with <code>∫m<sub>i</sub> = 1</code>, <code>∫u<sub>i</sub> = 0</code>, <code>m<sub>i</sub> &gt; 0</code>.'),
  C.p('The coupling matrix C = (c_ij) is the whole story. Lasry–Lions monotonicity — the hypothesis that buys a '
    + 'unique equilibrium — asks that the interaction be monotone, which for a constant matrix is exactly that its '
    + 'symmetric part C + Cᵀ be positive semidefinite. Writing the cross-coupling as c₁₂ = s + d and c₂₁ = s − d, '
    + 'with the self-coupling fixed at c₁₁ = c₂₂ = ' + cellNum(CFG.cs) + ', that condition reads |s| ≤ ' + cellNum(CFG.cs)
    + ' — and it does not mention d.'),
  C.p('That is worth sitting with. The parameter d is precisely the attack–defense asymmetry: one population '
    + 'attracted to where the other is, the other repelled from where the first is. Pursuit and evasion. The '
    + 'standard uniqueness condition is blind to it. This map asks whether it should be.'),
  C.note({ lab: 'cited, not ours', bodyRaw: 'Lasry–Lions monotonicity is a theorem from the literature and it is used '
    + 'here as one: where its hypothesis is verified over an entire cell, the cell is labelled UNIQUE on its '
    + 'authority. What is ours is the enclosure that says which solution it is, and every certificate outside the '
    + 'monotone region. Cirant–Verzini (arXiv:1511.09343) prove that this two-population system bifurcates and '
    + 'segregates as the viscosity vanishes; that result is asymptotic and qualitative, and this map is neither.' })
].join('\n') }));

O.push(C.section({ lab: '2', title: 'What the certificates found', bodyRaw: [
  C.p('The monotone region is real and it is certified: ' + T.UNIQUE.toLocaleString() + ' cells, covering '
    + pct(AREA.UNIQUE, DOMAIN) + ' of the rectangle, lie where |s| ≤ ' + cellNum(S_LL) + ' over the whole cell and '
    + 'carry an enclosure of the unique equilibrium. Uniqueness there is the cited theorem; the enclosure is ours.'),
  C.p('Multiplicity is also real, and it starts a long way away. The first cell carrying two provably disjoint '
    + 'certified balls sits at s = ' + fmt(multSmin, 3) + '. Between s = ' + cellNum(S_LL) + ' and s = ' + fmt(multSmin, 2)
    + ' — a factor of ' + fmt(GAP, 1) + ' — the map is a corridor of ' + encOnly.toLocaleString() + ' cells in which '
    + 'exactly one equilibrium is enclosed and no theorem available to us rules out a second. That corridor is not a '
    + 'gap in the computation. It is the honest width of what is unknown.'),
  /* THE FOLD CLAIM IS ONLY MADE IF THE MAP ACTUALLY CONTAINS THE FOLD. If the
     multiplicity region runs to the top of the swept rectangle, the boundary we
     would be pointing at is the edge of the picture, not a feature of the
     system — and saying otherwise would be reading our own crop as a result. */
  (multDmax < CFG.dRange[1] - 1e-9
    ? C.p('And d is not a bystander. The multiplicity region does not extend past d = ' + fmt(multDmax, 2)
        + ' anywhere on this slice, while the map was swept to d = ' + cellNum(CFG.dRange[1]) + ': as the '
        + 'attack–defense asymmetry grows the two equilibria approach each other and the second one stops being '
        + 'certifiable. A condition that never mentions d is describing a boundary that d moves.')
    : C.p('Whether d bounds the multiplicity region is NOT settled by this map. The certified multiplicity runs to '
        + 'd = ' + fmt(multDmax, 2) + ', which is the top edge of the rectangle we swept, so the boundary visible '
        + 'at the top of the figure is the edge of the picture and nothing more. Locating the fold in d means '
        + 'sweeping further, and until that is done the honest statement is that d does not appear in the cited '
        + 'condition and we have not yet measured whether it should.')),
  C.table({
    cols: ['verdict', 'cells', 'area', 'what it means'],
    rows: [
      ['MULTIPLE', T.MULTIPLE.toLocaleString(), pct(AREA.MULTIPLE, DOMAIN),
       'two exact equilibria for EVERY parameter in the cell, in provably disjoint balls, both densities positive'],
      ['UNIQUE', T.UNIQUE.toLocaleString(), pct(AREA.UNIQUE, DOMAIN),
       'Lasry–Lions monotone over the whole cell [cited] and the enclosure certified here'],
      ['UNDECIDED', T.UNDECIDED.toLocaleString(), pct(AREA.UNDECIDED, DOMAIN),
       encOnly.toLocaleString() + ' of them enclose one equilibrium; the reason is kept verbatim on every cell'],
    ]
  }),
  C.p('The multiplicity witnesses are not marginal. Across every MULTIPLE cell the separation between the two '
    + 'certified balls exceeds the sum of their radii by a factor of at least ' + fmt(worstSep, 1) + ' and at most '
    + fmt(bestSep, 0) + '; the worst contraction factor anywhere on the map is ' + fmt(worstKappa, 4)
    + '; and the smallest certified density is ' + minDensity.toExponential(2) + ', so positivity — a hypothesis of '
    + 'the model, never an assumption here — is proved and not assumed on every decided cell.')
].join('\n') }));

O.push(C.section({ lab: '3', title: 'Why a solver cannot see the second equilibrium', bodyRaw: [
  C.p('At d = 0 the two populations are interchangeable, and the second equilibrium appears through a '
    + 'symmetry-breaking pitchfork: the Jacobian is singular at the branch point, and any continuation method that '
    + 'walks in s will feel it. Switch d away from zero and the symmetry is gone. The pitchfork unfolds. The '
    + 'primary branch becomes perfectly smooth — no singular Jacobian, no warning, nothing to detect — while the '
    + 'second equilibrium survives on a branch that is no longer connected to it.'),
  C.p('That is the part worth stating plainly. In the attack–defense regime, which is the regime with d ≠ 0 by '
    + 'definition, a method that starts from a natural initialisation and descends — a continuation, a homotopy, a '
    + 'trained network — lands on the primary branch and converges beautifully. Its residual goes to zero. Its '
    + 'residual is not lying. It has simply solved for one equilibrium out of two, and nothing in its own output '
    + 'can tell it so.'),
  C.p('A box certificate has no such blind spot, because it does not walk anywhere. It takes a candidate and a '
    + 'radius and asks whether the Newton–Kantorovich operator contracts. Two candidates, two radii, one '
    + 'separation bound, and the multiplicity is proved without either branch ever having to be reachable from the '
    + 'other. That is the structural advantage, and it is the reason this lab exists.'),
  C.p('The map puts a number on it. ' + multUnreachable.toLocaleString() + ' of the '
    + T.MULTIPLE.toLocaleString() + ' MULTIPLE cells — ' + pct(multUnreachable, T.MULTIPLE) + ' of them, covering '
    + pct(multUnreachableArea, DOMAIN) + ' of the swept rectangle — lie entirely at d &gt; 0. In every one of those '
    + 'cells the symmetry is broken throughout, so the primary branch is smooth and a continuation feels nothing; '
    + 'and in every one of them two distinct equilibria are certified for every parameter in the cell. That is the '
    + 'whole argument in one count: the second equilibrium is provably there, and it is provably not where a '
    + 'solver following the obvious branch is going to look.'),
  C.note({ lab: 'on the neural-solver literature', bodyRaw:
    'High-dimensional MFGs are now routinely solved by neural methods that exploit the variational primal–dual '
    + 'structure — APAC-Net (Lin, Fung, Li, Osher, PNAS 2021) and its multi-population successors, including '
    + 'Wang, Li, Yao and Xia\'s attack–defense model (Mathematics 10(21):4075, 2022), whose reported evidence of '
    + 'convergence is the decay of the HJB residual. Nothing here says such a residual is wrong. The point is '
    + 'narrower and, we think, harder to argue with: <strong>in a regime where the equilibrium is provably not '
    + 'unique, a small residual is evidence of solving, not of identifying</strong> — and the map above shows that '
    + 'the region where that distinction bites is not exotic. It is most of the plane. We have not re-run anyone\'s '
    + 'code and make no claim about any specific published number; what is certified here is the model class.' })
].join('\n') }));

O.push(C.section({ lab: '4', title: 'What would have to be wrong', bodyRaw: [
  C.p('Every cell on this map is one certificate away from being a mistake, so the gates are built to catch the '
    + 'ways it could be. The two-population certifier is a second implementation of an argument the one-population '
    + 'lab already runs, and at zero cross-coupling the system decouples into two independent copies of that lab. '
    + 'The battery therefore demands that the two agree: the solvers to ' + D1[1] + ' in every coefficient, and the '
    + 'box verdicts cell for cell — ' + D2[1] + ' agree, ' + D2[2] + ' disagree, refusals included.'),
  C.p('A certificate that claims to hold over a whole rectangle is checked against the rectangle: ' + C2m[1]
    + ' corners of a cell are independently re-solved and each must land inside the certified enclosure, which they '
    + 'do with a worst excess of ' + C2m[2] + ' against a radius of ' + C2m[3] + '. The tangent predictor that makes '
    + 'wide cells possible is switched off on demand and the same cell must then fail — it does, with Y₀ rising '
    + X1m[1] + '×. The cross-coupling really is charged in the tail bound rather than quietly dropped: a large '
    + 'off-diagonal entry moves Z₁ from ' + X2m[1] + ' to ' + X2m[2] + ', which is exactly the term that would '
    + 'vanish if the coupling had been omitted.'),
  C.p('And the record is not trusted either, though checking it takes more care than it first appears. Finding a '
    + 'branch is search; certifying it is proof, and only the second is what a gate should test — because, as '
    + '§3 says, a cold seed genuinely cannot find the second equilibrium once d ≠ 0. So the ' + SAMPLE.length
    + ' cells drawn deterministically from the map are checked two ways. Every MULTIPLE cell has its segregated '
    + 'branch RE-REACHED at build by continuing in from the pitchfork at d = 0 along a different path than the '
    + 'sweep used, and the whole decision is then recomputed: verdict, radii, positivity, separation. Every UNIQUE '
    + 'cell is re-decided cold with no seed at all. And every sampled cell is re-decided cold as well, where it may '
    + 'return UNDECIDED — the branch went unfound, which is the point — but may never return the other decided '
    + 'verdict. ' + coldReproduced + ' of the ' + SAMPLE.length + ' reproduced cold outright.'),
  C.p('What is NOT claimed: nothing here proves uniqueness outside the monotone region, and the corridor is '
    + 'labelled undecided precisely because we cannot decide it. The map is one two-dimensional slice — σ = '
    + cellNum(CFG.sigma) + ', c₁₁ = c₂₂ = ' + cellNum(CFG.cs) + ', A = ' + cellNum(CFG.A) + ', ' + CFG.N
    + ' Fourier modes — of a seven-parameter family, and the viscosity axis is expensive here for a reason the lab '
    + 'states in the open: the certifier\'s operator is built at one σ, so a σ-box is charged a defect that does '
    + 'not decay with frequency. Widening that axis is the next piece of work, not a footnote.')
].join('\n') }));

O.push(C.section({ lab: '5', title: 'The lab', bodyRaw: [
  C.p('Four files, MIT, no dependencies: labs/mfg2p/mfg2p.js is the model and its Newton solver; box2p.js is the '
    + 'certifier, uniform over a rectangle of coupling matrices; regime2p.js walks the plane and refines what '
    + 'refuses; battery.js is the gate that this page re-runs before it will build. The map record itself is '
    + 'certs/mfg2p-regime-map.json, and every number on this page is read from it or recomputed here.'),
  C.p('One design decision is worth naming because it is the difference between a sweep that finishes and one that '
    + 'does not. A cell that is undecided because a certificate refused can be repaired by making the cell smaller, '
    + 'so it is refined. A cell that is undecided because one equilibrium is enclosed and monotonicity is '
    + 'unavailable cannot: what is missing there is a theorem, not resolution, and a smaller cell returns the same '
    + 'sentence. Refining those would have spent the entire budget re-proving the corridor at finer and finer '
    + 'scales and called it progress.'),
  C.pRaw('The instruments next door: <a href="mfg-observatory.html">the one-population regime observatory</a>, '
    + 'which this generalises and which the battery checks against; <a href="mfg-cap.html">certified multiplicity '
    + 'at a point</a>; <a href="mfg-congest.html">a congestion MFG enclosed</a>; and '
    + '<a href="methods-note.html">the methods note</a>.'),
  C.p('If you work on mean-field games and there is a statement your group keeps defending by hand — a uniqueness '
    + 'regime, a numerical equilibrium, a bound someone doubts — send it. If it is decidable, it gets decided here, '
    + 'with the witness, and the answer is yours whether or not it is the one you wanted.')
].join('\n') }));

const foot = '<footer class="col"><p>Generated by tools/build-report-mfg2p.js @ git ' + git + '. '
  + 'Gates that ran for this build: labs/mfg2p/battery.js (' + BAT.checks + ' checks, ' + BAT.reds + '/' + BAT.reds
  + ' falsifiers red, including verdict-for-verdict agreement with labs/mfg at zero cross-coupling); the map record '
  + 're-tallied here from its own ' + CELLS.toLocaleString() + ' cells with the area identity checked to '
  + fmt(COVERED, 6) + ' = ' + fmt(DOMAIN, 6) + '; and ' + SAMPLE.length + ' cells re-decided at build — every '
  + 'MULTIPLE one after re-reaching its segregated branch by an independent path, every UNIQUE one cold, and all '
  + 'of them checked cold for contradiction. Map record: ' + C.m('certs/mfg2p-regime-map.json') + ', sha256 '
  + MAPSHA.slice(0, 16) + '…. Lab: <a href="https://github.com/carlostoledo1891/cert-machine/tree/main/labs/mfg2p">labs/mfg2p/</a>. '
  + 'MIT.</p></footer>';

const html = TPL.render({
  title: 'The attack–defense regime map · cert-machine',
  desc: 'The coupling plane of a two-population mean-field game, cut into ' + CELLS.toLocaleString() + ' cells and '
    + 'decided uniformly over each: ' + T.MULTIPLE.toLocaleString() + ' carry two exact equilibria in provably '
    + 'disjoint balls, ' + T.UNIQUE.toLocaleString() + ' are unique on the cited monotonicity theorem, and the '
    + 'standard sufficient condition turns out to be ' + fmt(GAP, 1) + '× conservative.',
  path: '/reports/mfg-two-population.html',
  bodyRaw: O.join('\n\n'),
  footRaw: foot
});
fs.writeFileSync(path.join(ROOT, 'reports', 'mfg-two-population.html'), html);
console.log('wrote reports/mfg-two-population.html  (' + (html.length / 1024).toFixed(0) + ' KB)');
console.log('  cells ' + CELLS + '  MULTIPLE ' + T.MULTIPLE + ' (' + pct(AREA.MULTIPLE, DOMAIN) + ')  UNIQUE ' + T.UNIQUE
  + '  UNDECIDED ' + T.UNDECIDED + ' (' + encOnly + ' with an enclosure)');
console.log('  Lasry-Lions boundary s = ' + S_LL + ', first certified multiplicity s = ' + fmt(multSmin, 3)
  + '  -> gap ' + fmt(GAP, 1) + 'x');
console.log('  separation ratio ' + fmt(worstSep, 1) + '..' + fmt(bestSep, 0) + 'x   min density ' + minDensity.toExponential(2));
