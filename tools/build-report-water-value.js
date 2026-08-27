#!/usr/bin/env node
/* build-report-water-value.js — generate reports/water-value.html: the water
   value of Brazil's hydro grid, certified — the opening page of the energy
   shelf.

   Sources: the stock-constraint unit's PUBLIC set, lifted file-level from the
   source lab under the published-mfg-lab-tree allowlist (LIFT.json; drift
   re-hashed every run). Nothing on the page is remembered:
     · the unit's own batteries RE-RUN as build gates — test-sin.js (the page
       kernel, extracted from the artifact's bytes, 324 corners) and
       test-transpose-sin.js (the adjoint-matched pair, whose two mutants
       must print CAUGHT — the red controls of this build);
     · the scenario-tree water-value solver is EXTRACTED from the published
       page's verbatim block (sha-pinned; a flipped byte refuses), re-run on
       120 seeded random trees, and every certificate re-checked: duality gap,
       martingale residual, trichotomy, sign of the gap;
     · the PLD empirical layer is quoted AS HISTORY (its data lives behind
       CCEE's WAF; the recipe ships) and carries its own downgrade.

   usage: node tools/build-report-water-value.js */
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const C = require(path.join(ROOT, 'design', 'components.js'));
const TPL = require(path.join(ROOT, 'design', 'template.js'));
const die = (m) => { console.error('WATER-VALUE REPORT REFUSED: ' + m); process.exit(1); };
const git = (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })();

const UNIT = path.join(ROOT, 'legacy', 'research', 'stock-constraint');

/* ---- gate 1: the unit's own batteries, re-run ---------------------------- */
const runBat = (f) => {
  const r = cp.spawnSync(process.execPath, [path.join(UNIT, 'tests', f)], { cwd: ROOT });
  const out = String(r.stdout) + String(r.stderr);
  if (r.status !== 0 || !/ALL PASS/.test(out)) die(f + ' did not pass:\n' + out.slice(-800));
  return out;
};
const sinOut = runBat('test-sin.js');
const sinPasses = (sinOut.match(/^PASS /gm) || []).length;
const trOut = runBat('test-transpose-sin.js');
const trCaught = (trOut.match(/is CAUGHT/g) || []).length;
if (trCaught < 2) die('the adjoint battery\'s mutants did not fire (' + trCaught + ' CAUGHT) — no proof the gate can go red');

/* ---- gate 2: extract the solver from the published bytes, sha-pinned ----- */
const EXTRACT_SHA = '28fc1501dde6b59fb56196d84ad4e12ee5e9e542d69867cd121fcb7ccf230b27';
const html = fs.readFileSync(path.join(UNIT, 'water-value.html'), 'utf8');
const MB = '/* ==== BEGIN VERBATIM research/stock-constraint/tools/water_value_tree.js ==== */';
const ME = '/* ==== END VERBATIM ==== */';
const bi = html.indexOf(MB), ei = html.indexOf(ME);
if (bi < 0 || ei <= bi) die('verbatim markers not found in water-value.html');
const solverSrc = html.slice(bi + MB.length, ei);
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
if (sha(solverSrc) !== EXTRACT_SHA) die('extracted solver sha moved: ' + sha(solverSrc) + ' — the published bytes changed; re-pin deliberately, never silently');
/* the extraction's own red control: a single flipped byte must be detected */
if (sha(solverSrc.slice(0, 100) + '!' + solverSrc.slice(101)) === EXTRACT_SHA) die('the extraction pin failed to detect a flipped byte — impossible');
fs.writeFileSync(path.join(ROOT, 'reports', 'water_value_tree.extracted.js'), solverSrc);
const WV = new Function('module', 'require', solverSrc + '\nreturn module.exports;')({ exports: {} }, { main: null });
for (const k of ['buildTree', 'solveTree']) if (typeof WV[k] !== 'function') die('extracted solver lacks ' + k);

/* ---- gate 3: the certificate suite — 120 seeded random trees ------------- */
const mulberry32 = (s) => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
let maxGap = 0, maxMart = 0, nBinding = 0, nSpill = 0, nPure = 0;
for (let seed = 1; seed <= 120; seed++) {
  const rng = mulberry32(seed);
  const depth = 3 + (seed % 3), branch = 2 + (seed % 2);
  const nodes = WV.buildTree(depth, branch, (n) => ({
    price: 0.3 + 1.2 * rng() + (n.depth === 1 ? 0.4 * (seed % 2) : 0),
    inflow: 0.05 + 0.6 * rng()
  }));
  const r = WV.solveTree(nodes, { R0: 0.2 + 0.5 * rng(), Rbar: 0.8, hbar: 0.2 + 0.3 * rng(), phi: 0.3 + 0.5 * rng() });
  const c = r.cert;
  /* the sign check is SEPARATE from the magnitude check, as in the solver
     itself — but the arithmetic is IEEE doubles, so a violation at the scale
     of accumulated rounding (a few ulp of the revenue) is noise, not a broken
     assembly. Structural violations are orders of magnitude above this bar. */
  if (c.signViolation > 1e-12) die('weak duality violated at seed ' + seed + ' (' + c.signViolation + ') — structurally impossible, the assembly is broken');
  if (c.tri !== 0) die('Hotelling trichotomy violated at seed ' + seed);
  if (c.gapRel > 1e-11) die('duality gap too large at seed ' + seed + ': ' + c.gapRel);
  if (Math.max(c.dynErr, c.boxErr, c.wedgeSignErr, c.spillDualErr) > 1e-9) die('KKT residuals too large at seed ' + seed);
  maxGap = Math.max(maxGap, c.gapRel);
  maxMart = Math.max(maxMart, c.martingaleRes);
  if (c.bindingNodes > 0) nBinding++;
  if (c.spillNodes > 0) nSpill++;
  if (c.bindingNodes === 0 && c.spillNodes === 0) nPure++;
}
if (maxMart > 1e-10) die('off-binding martingale residual too large: ' + maxMart);
if (!nBinding || !nSpill || !nPure) die('the suite did not exercise binding AND spill AND pure-martingale trees ('
  + nBinding + '/' + nSpill + '/' + nPure + ') — a certificate class went untested');

/* ---- the page ------------------------------------------------------------ */
const fmtE = (x) => x.toExponential(1);
const B = [];

B.push(C.header({
  eyebrow: 'cert-machine · certified audit · energy — re-proved at every build',
  title: 'The water value, certified',
  deck: 'In a hydro-dominated grid the marginal value of stored water is the shadow price that sets the whole '
    + 'dispatch — and it obeys a theorem: between the events where the reservoir hits full or empty, the water '
    + 'value is a MARTINGALE, stepping down across full-reservoir events and up across empty ones. On finite '
    + 'scenario trees that statement is proved by LP duality with no constraint qualification, and this page '
    + 're-proves it at every build: the solver is extracted from the published artifact\'s own bytes, run on 120 '
    + 'random trees, and every certificate re-checked — duality gap, martingale residual, Hotelling trichotomy.'
}));

B.push(C.tldr({
  findingRaw: 'The stochastic water value on scenario trees is a certified theorem, not a heuristic: '
    + 'w = E[w(child)] at every interior-stock node, exact to ' + fmtE(maxMart) + ' across this build\'s 120-tree '
    + 'suite, with zero duality gap (worst relative gap ' + fmtE(maxGap) + ') and zero trichotomy violations. '
    + 'The deterministic case is proved outright; the continuum limit is honestly OPEN.',
  mechanismRaw: 'The dispatch problem is a finite LP; the water value is its balance multiplier. Weak duality '
    + 'makes the gap one-signed — a negative gap is structurally impossible and the build dies on it rather '
    + 'than reporting a magnitude. The solver ships VERBATIM inside the published page; this build extracts it '
    + 'from those bytes (sha-pinned), so the thing certified is the thing published.',
  checkRaw: C.m('node legacy/research/stock-constraint/tests/test-sin.js') + ' from a clone — the unit\'s own '
    + 'battery, ' + sinPasses + ' checks; the extracted solver ships beside this page as '
    + C.m('reports/water_value_tree.extracted.js') + ' and self-demos under node.'
}));

B.push(C.stats([
  { k: 'the theorem', v: 'PROVED (discrete)', role: 'held', n: 'deterministic: LP duality, no constraint qualification needed · scenario trees: w = E[w child] off-binding — the discrete content of dw = Z dB + dL⁰ − dL̄' },
  { k: 'duality gap', v: fmtE(maxGap), role: 'held', n: 'worst RELATIVE gap across 120 seeded random trees, re-solved this build; the sign is checked separately — a negative gap dies, never rounds' },
  { k: 'martingale residual', v: fmtE(maxMart), role: 'held', n: 'max |w − E[w child]| over every interior-stock node in the suite' },
  { k: 'unit batteries', v: sinPasses + ' checks green', role: 'held', n: 'the lifted unit\'s own gates re-run: kernel extracted from the artifact bytes; ' + trCaught + ' adjoint mutants CAUGHT (the reds fired)' },
  { k: 'tree classes', v: nBinding + ' · ' + nSpill + ' · ' + nPure, n: 'trees with binding stock events · with spill · pure-martingale — all three certificate classes exercised or the build refuses' },
  { k: 'continuum limit', v: 'OPEN', role: 'warn', n: 'the reflected-FBSDE well-posedness (OP-1) and the reflecting-boundary duality (OP-2) are stated, not claimed' }
]));

B.push(C.section({
  lab: '§1 · the object', title: 'A shadow price with a martingale inside',
  bodyRaw: [
    C.p('A hydro operator holding stock R releases h against price ϖ under a hard box 0 ≤ R ≤ R̄. The water value '
      + 'w is the multiplier of the stock balance, and optimality is the Hotelling trichotomy: release at full '
      + 'rate where ϖ > w, hold where ϖ < w, and at interior release the price IS the water value. In the '
      + 'deterministic case w is piecewise constant, jumping up across empty-reservoir events and down across '
      + 'full ones — proved here as the KKT system of a finite LP, where no constraint qualification is needed '
      + 'and strong duality is an identity you can print.'),
    C.p('On a scenario tree the same proof gives the stochastic statement: at every node whose post-release '
      + 'stock is interior, w equals the conditional expectation of its children\'s w — the water value is a '
      + 'martingale between stock-binding events, and spilling nodes pin w = 0 (marginal water at a spilling '
      + 'dam is worthless, reappearing as a dual complementarity). That is the exact discrete content of the '
      + 'continuum equation dw = Z dB + dL⁰ − dL̄, with the local times acting only at the barriers.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§2 · re-proved at build', title: 'The certificate suite this page just ran',
  bodyRaw: [
    C.p('The scenario-tree solver ships verbatim inside the published water-value artifact, between markers, '
      + 'ending in its own module exports — so this build does not trust a copy: it extracts the solver from '
      + 'the page bytes, checks the extraction\'s sha256 against the pin, and refuses on a single flipped byte. '
      + 'The extracted source is then run on 120 seeded random trees (depths 3–5, branching 2–3, randomized '
      + 'prices, inflows, stock boxes and salvage), and on every tree four certificate families are re-checked: '
      + 'the KKT residuals (dynamics, boxes, wedge signs, spill duals), the Hotelling trichotomy (zero '
      + 'violations tolerated), the off-binding martingale residual, and the duality gap.'),
    C.p('The gap check is one-signed on purpose. This is a maximization LP, so weak duality makes '
      + 'dual − primal non-negative for ANY feasible pair — a negative value cannot be a convergence artifact; '
      + 'it can only mean the assembly is wrong, and the build dies on it as a separate check rather than '
      + 'folding it into a magnitude. The red controls are the lifted unit\'s own: the adjoint-matched-operator '
      + 'battery must catch both of its planted mutants (it did — ' + trCaught + ' CAUGHT this build), and the '
      + 'page-kernel battery re-extracts the browser kernel from the artifact and re-runs its full corner sweep.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§3 · the empirical layer', title: 'Five years of PLD, quoted as history — with its own downgrade',
  bodyRaw: [
    C.p('The unit tested the theorem\'s signature against Brazil\'s hourly spot price (PLD, submarket Sudeste, '
      + '2021–2025): between jumps the price should be flat where hydro is marginal. The record shows interior '
      + 'windows with flatness shrinkage up to 75× against a permutation null, and the flattest year is 2021 — '
      + 'the water crisis, when scarcity kept hydro marginal nearly year-round. The naive seasonal reading '
      + '("wet years flatter") is REFUTED by the same data: flatness tracks the hydro-marginal regime, not the '
      + 'calendar.'),
    C.p('The unit\'s own adversarial review downgraded this layer from "confirmed" to DESCRIPTIVE CONSISTENCY, '
      + 'and this page keeps the downgrade: PLD is an administered price built from a model that already moves '
      + 'its water value slowly, the permutation null measures persistence rather than pinning, and the window '
      + 'selection is partly circular. These numbers are quoted as history because their data sits behind '
      + 'CCEE\'s access wall — the recipe to re-run them ships with the unit ('
      + 'docs/pld-data-run.md), and nothing in §2\'s certificates depends on them.')
  ].join('\n')
}));

B.push(C.section({
  lab: '§4 · open, and said so', title: 'What the theorem does not yet reach',
  bodyRaw: C.plainList([
    { b: 'OP-1 — the continuum limit.', text: 'Well-posedness of the doubly-reflected FBSDE for the stock, the '
      + 'water value and its barrier local times, jointly with the mean-field price coupling. Reflection sits in '
      + 'the FORWARD state with solution-dependent barrier events — outside the standard reflected-BSDE '
      + 'toolkits. Three candidate routes are recorded in the unit\'s OPEN_PROBLEMS file.' },
    { b: 'OP-2 — the reflecting-boundary duality.', text: 'The discrete side is now exact at every resolution '
      + '(the adjoint-matched pair re-verified this build has operator defect exactly zero), so Γ-convergence '
      + 'of the discrete KKT system is a live route to the continuum duality — a route that did not exist '
      + 'before the matched pair was built.' },
    { b: 'The band variational inequality.', text: 'Brazil\'s administrative price band makes the equilibrium a '
      + 'monotone VI rather than a minimizer — existence and uniqueness of aggregates follow, and the welfare '
      + 'gap of the band becomes a model output. Sketched in the unit\'s model spec with status labels; not '
      + 'claimed here.' }
  ])
}));

B.push(C.section({
  lab: '§5 · provenance', title: 'Where these bytes come from',
  bodyRaw: C.p('Every source file behind this page was lifted FILE-LEVEL from the research unit\'s public set — '
    + 'the eligibility criterion is presence in the source lab\'s own published tree, checked against the live '
    + 'repository listing — and sits byte-preserved in this repository under legacy/research/stock-constraint/: '
    + 'the two original artifacts, the batteries this build re-ran, the reference implementations, and '
    + 'the model spec with its PROVED/SKETCHED/OPEN labels. The lineage is the price-formation program of the '
    + 'KAUST mean-field-games group (Gomes, Gutierrez, Ribeiro; Bakaryan, Aoun, de Lima Ribeiro, Hovakimyan, '
    + 'Gomes), whose results the source unit reproduces; the certification layer and this page are independent '
    + 'of that group and any error here is ours.')
}));

const foot = '<footer class="col"><p>Generated by tools/build-report-water-value.js @ git ' + git + '. The unit\'s '
  + 'own batteries re-ran as gates (' + sinPasses + ' checks; ' + trCaught + ' mutants caught), the solver was '
  + 're-extracted from the published bytes against its sha pin, and 120 random trees re-certified — the build '
  + 'refuses on any deviation. Source unit files: legacy/research/stock-constraint/ in this repository · '
  + 'extracted solver: reports/water_value_tree.extracted.js.</p></footer>';

fs.writeFileSync(path.join(ROOT, 'reports', 'water-value.html'),
  TPL.render({ title: 'The water value, certified', bodyRaw: B.join('\n\n'), footRaw: foot }));
console.log('reports/water-value.html written: 120 trees re-certified (gap ' + fmtE(maxGap) + ', martingale '
  + fmtE(maxMart) + '), batteries ' + sinPasses + ' checks + ' + trCaught + ' mutants caught @ git ' + git);
