#!/usr/bin/env node
/* run-easota-ledger.js — decide every construction in the EinsteinArena /
   Together AI "new SOTA" table and write certs/easota-ledger.json.

   Every row reads a file pinned byte for byte under corpus/easota (re-hashed
   here against corpus/easota/meta.json), decides the platform's objective in
   exact rational arithmetic, and compares the exact value with the digits the
   repository prints. Grammar per row: WITNESSED (the bytes are an exact
   witness of the printed value), REPAIRED (a witness only up to the platform's
   tolerance; an exact witness built from the same bytes, deficit printed),
   UNWITNESSED (bytes fail exactly, no repair). A failed witness refutes no
   bound. Improvements over the previous best are decided as exact signs. */
'use strict';
const fs = require('fs');
const path = require('path');
const cp = require('child_process');
const crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..');
const L = require(path.join(ROOT, 'instruments', 'easota', 'lib.js'));
const D = require(path.join(ROOT, 'instruments', 'easota', 'decide.js'));
const H = require(path.join(ROOT, 'instruments', 'easota', 'hexagons.js'));
const Q = L.Q;
const die = (m) => { console.error('EASOTA LEDGER REFUSED: ' + m); process.exit(1); };

/* ---- the pins ---- */
const meta = JSON.parse(fs.readFileSync(path.join(L.CORPUS, 'meta.json'), 'utf8'));
for (const [rel, m] of Object.entries(meta.files)) {
  const sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(L.CORPUS, rel))).digest('hex');
  if (sha !== m.sha256) die('corpus/easota/' + rel + ' does not hash to its pin');
}
const readme = (p) => L.read(p + '/README.md');
const printedInReadme = (p, s) => readme(p).includes(String(s));

const dec = (r, d) => (r ? L.toFixed(r, d) : null);
const rows = [];
const push = (row) => {
  rows.push(row);
  console.log('  ' + row.id.padEnd(30) + row.verdict.padEnd(12) + (row.exact !== undefined && row.exact !== null ? ' exact ' + row.exact : '') + (row.printed ? '  printed ' + row.printed : ''));
};
/* the claim value: rounds-to or ceils-to the printed digits? */
const agree = (exact, printed, convention) => {
  const d = (String(printed).split('.')[1] || '').length;
  const p = L.parseDecimal(printed);
  if (convention === 'ceil') { /* an upper bound printed as its ceiling to d digits: p - 10^-d < exact <= p */
    const step = Q.R(1n, 10n ** BigInt(d));
    return Q.cmp(exact, p) <= 0 && Q.cmp(exact, Q.sub(p, step)) > 0;
  }
  return L.printedIsRounding(exact, printed);
};

/* ================= circles in a rectangle: maximise Σr ================= */
console.log('circles-rectangle:');
const CIR = {};
for (const [file, who, printed, date] of [['alphaevolve_2025.json', 'AlphaEvolve V2 (Georgiev, Gómez-Serrano, Tao, Wagner — arXiv:2511.02864)', '2.3658321334', '2025-11'], ['ours_2026.json', 'Together AI agents, this repository', '2.3658323759', '2026-04']]) {
  if (!printedInReadme('circles-rectangle', printed)) die('printed value ' + printed + ' is not in the circles README');
  const r = D.circles(L.loaders.circles('circles-rectangle/' + file));
  const exact = r.witnessed ? r.sumR : (r.repair ? r.repair.sumR : null);
  if (!exact) die('circles ' + file + ': not a witness and no repair — write it up before shipping');
  CIR[file] = exact;
  push({ id: 'circles/' + file.replace('.json', ''), problem: 'circles-rectangle', claim: 'n = 21 circles in a rectangle of perimeter 4 (bounding box w + h ≤ 2), no overlaps: Σ r = ' + printed, claimant: who, date,
    file: 'corpus/easota/circles-rectangle/' + file, sha256: meta.files['circles-rectangle/' + file].sha256,
    verdict: r.witnessed ? 'WITNESSED' : 'REPAIRED', exact: dec(exact, 16), exactRational: Q.toString(exact),
    asPublished: { sumR: dec(r.sumR, 16), boxSlack: dec(r.boxSlack, 20), overlappingPairs: r.overlaps, worstPairSlackSquared: dec(r.worstPair.slack, 20), worstPair: [r.worstPair.i, r.worstPair.j] },
    repair: r.repair ? { lambda: dec(r.repair.lambda, 18), sumR: dec(r.repair.sumR, 16), deficit: dec(r.repair.deficit, 18), how: 'every radius scaled by λ, the largest rational with λ² ≤ d²/(rᵢ+rⱼ)² on every pair and the box inside w + h ≤ 2' } : null,
    printed, printedConvention: 'rounding', printedAgrees: agree(exact, printed, 'round'),
    platformTolerance: 'overlap allowed to 1e-9 in distance, box to 1e-9 in w + h',
    ms: 0 });
}
const cirImprove = Q.sub(CIR['ours_2026.json'], CIR['alphaevolve_2025.json']);

/* ================= Heilbronn, convex region ================= */
console.log('heilbronn-convex:');
const HEI = {};
for (const [file, who, printed, date] of [['alphaevolve_2025.json', 'AlphaEvolve V2 (arXiv:2511.02864)', '0.0278355715', '2025-11'], ['ours_2026.json', 'Together AI agents, this repository', '0.0278355805', '2026-04']]) {
  if (!printedInReadme('heilbronn-convex', printed)) die('printed value ' + printed + ' is not in the heilbronn README');
  const r = D.heilbronn(L.loaders.points('heilbronn-convex/' + file, 'points'));
  HEI[file] = r.score;
  push({ id: 'heilbronn/' + file.replace('.json', ''), problem: 'heilbronn-convex', claim: 'n = 14 points, min triangle area / convex-hull area = ' + printed, claimant: who, date,
    file: 'corpus/easota/heilbronn-convex/' + file, sha256: meta.files['heilbronn-convex/' + file].sha256,
    verdict: r.witnessed ? 'WITNESSED' : 'UNWITNESSED', exact: dec(r.score, 16), exactRational: Q.toString(r.score),
    detail: { hullVertices: r.hullVertices, hullArea: dec(r.hullArea, 16), minTriangle: r.minTriangle, minArea: dec(r.minArea, 18) },
    printed, printedConvention: 'rounding', printedAgrees: agree(r.score, printed, 'round') });
}
const heiImprove = Q.sub(HEI['ours_2026.json'], HEI['alphaevolve_2025.json']);

/* ================= min distance ratio, 2-D ================= */
console.log('min-distance-ratio-2d:');
const MDR = {};
for (const [file, who, printed, date] of [['alphaevolve_2025.json', 'AlphaEvolve (Novikov et al. — arXiv:2506.13131)', '12.889266', '2025-06'], ['ours_2026.json', 'Together AI agents, this repository', '12.889230', '2026-03']]) {
  if (!printedInReadme('min-distance-ratio-2d', printed)) die('printed value ' + printed + ' is not in the min-distance README');
  const r = D.mindist(L.loaders.points('min-distance-ratio-2d/' + file, 'vectors'));
  MDR[file] = r.score;
  push({ id: 'mindist/' + file.replace('.json', ''), problem: 'min-distance-ratio-2d', claim: 'n = 16 points, (max distance / min distance)² = ' + printed, claimant: who, date,
    file: 'corpus/easota/min-distance-ratio-2d/' + file, sha256: meta.files['min-distance-ratio-2d/' + file].sha256,
    verdict: r.witnessed ? 'WITNESSED' : 'UNWITNESSED', exact: dec(r.score, 16), exactRational: Q.toString(r.score),
    detail: { minPair: r.minPair, maxPair: r.maxPair, minD2: dec(r.minD2, 16), maxD2: dec(r.maxD2, 16) },
    printed, printedConvention: 'rounding', printedAgrees: agree(r.score, printed, 'round') });
}
const mdrImprove = Q.sub(MDR['alphaevolve_2025.json'], MDR['ours_2026.json']);   /* minimise: previous − ours */

/* ================= Erdős minimum overlap ================= */
console.log('erdos-minimum-overlap:');
const OVL = {};
for (const [file, how, who, printed, date] of [
  ['haugland_2016.py', 'haugland', 'J. K. Haugland (arXiv:1609.08000)', '0.380927', '2016'],
  ['alphaevolve_2025.py', 'ae-half', 'AlphaEvolve (arXiv:2506.13131)', '0.380924', '2025-06'],
  ['ttt_discover_2026.py', 'full', 'TTT-Discover (Yuksekgonul et al. — arXiv:2601.16175)', '0.380876', '2026-01'],
  ['together_ai_2026.py', 'full', 'Together AI agents, this repository', '0.380871', '2026-03']]) {
  if (!printedInReadme('erdos-minimum-overlap', printed)) die('printed value ' + printed + ' is not in the overlap README');
  const r = D.overlap(L.loaders.overlapPy('erdos-minimum-overlap/' + file, how));
  const exact = r.witnessed ? r.bound : (r.repair ? r.repair.bound : null);
  OVL[file] = exact;
  push({ id: 'overlap/' + file.replace('.py', ''), problem: 'erdos-minimum-overlap', claim: 'a step function h with ' + r.n + ' steps, 0 ≤ h ≤ 1, Σh = n/2: upper bound ' + printed, claimant: who, date,
    file: 'corpus/easota/erdos-minimum-overlap/' + file, sha256: meta.files['erdos-minimum-overlap/' + file].sha256,
    verdict: r.witnessed ? 'WITNESSED' : (r.repair ? 'REPAIRED' : 'UNWITNESSED'), exact: dec(exact, 16), exactRational: exact ? Q.toString(exact) : null,
    asPublished: { steps: r.n, inRange: r.inRange, sumMinusHalfN: dec(r.sumSlack, 20), bound: dec(r.bound, 16), lag: r.lag },
    repair: r.repair ? { how: r.repair.how, bound: dec(r.repair.bound, 16), delta: dec(r.repair.delta, 20) } : null,
    printed, printedConvention: 'ceiling', printedAgrees: exact ? agree(exact, printed, 'ceil') : false,
    platformTolerance: 'Σh = n/2 within 1e-6' });
}
const ovlImprove = Q.sub(OVL['ttt_discover_2026.py'], OVL['together_ai_2026.py']);

/* ================= edges vs triangles: a benchmark score ================= */
console.log('edges-vs-triangles:');
const EVT = {};
for (const [file, who, printed, date] of [['alphaevolve_2025.py', 'AlphaEvolve V2 (arXiv:2511.02864)', '-0.712494', '2025-11'], ['ours_2026.py', 'Together AI agents, this repository', '-0.712256', '2026-03']]) {
  if (!printedInReadme('edges-vs-triangles', printed.replace('-', '−')) && !printedInReadme('edges-vs-triangles', printed)) die('printed value ' + printed + ' is not in the edges README');
  const r = D.edges(L.loaders.weightsPy('edges-vs-triangles/' + file));
  EVT[file] = r.score;
  push({ id: 'edges/' + file.replace('.py', ''), problem: 'edges-vs-triangles', claim: r.rows + ' rows of 20 weights → (edge density, triangle density) points; the platform\'s envelope score = ' + printed, claimant: who, date,
    file: 'corpus/easota/edges-vs-triangles/' + file, sha256: meta.files['edges-vs-triangles/' + file].sha256,
    verdict: r.witnessed ? 'WITNESSED' : 'UNWITNESSED', exact: dec(r.score, 16), exactRational: Q.toString(r.score),
    detail: { area: dec(r.area, 16), maxGap: dec(r.maxGap, 16), distinctRho: r.distinctRho, note: 'a benchmark score, not a theorem: the area under the platform\'s slope-3 envelope plus 10 × the largest gap in edge density, recomputed exactly (its 1e-9 branches are exact comparisons here)' },
    printed, printedConvention: 'rounding', printedAgrees: agree(r.score, printed, 'round') });
}
const evtImprove = Q.sub(EVT['ours_2026.py'], EVT['alphaevolve_2025.py']);

/* ================= the first autocorrelation inequality ================= */
console.log('first-autocorrelation:');
const AC = {};
for (const [file, load, who, printed, date] of [
  ['alphaevolve_2025.py', 'autocorrPy', 'AlphaEvolve (arXiv:2506.13131)', '1.50529397', '2025-06'],
  ['alphaevolve_v2_2025.json', 'autocorrJson', 'AlphaEvolve V2 (arXiv:2511.02864)', null, '2025-11'],
  ['ttt_discover_2026.json', 'autocorrJson', 'TTT-Discover (arXiv:2601.16175)', '1.50286290', '2026-01'],
  ['ours_2026.json', 'autocorrJson', 'Together AI agents, this repository', '1.50286286', '2026-03']]) {
  if (printed && !printedInReadme('first-autocorrelation', printed)) die('printed value ' + printed + ' is not in the autocorrelation README');
  const t0 = Date.now();
  const r = D.autocorr(L.loaders[load]('first-autocorrelation/' + file));
  AC[file] = r.C1;
  push({ id: 'autocorr/' + file.replace(/\.(json|py)$/, ''), problem: 'first-autocorrelation', claim: 'f ≥ 0 as ' + r.n + ' values on [−1/4, 1/4]: C₁ ≤ ' + (printed || '(no value printed for this file)'), claimant: who, date,
    file: 'corpus/easota/first-autocorrelation/' + file, sha256: meta.files['first-autocorrelation/' + file].sha256,
    verdict: r.witnessed ? 'WITNESSED' : 'UNWITNESSED', exact: dec(r.C1, 16), exactRational: r.C1 ? Q.toString(r.C1) : null,
    detail: { n: r.n, argmax: r.argmax, candidatesDecidedExactly: r.candidates, screenErrorBound: r.errorBound, decimalDigits: r.denominatorDigits, note: 'for a step function the discrete maximum IS the supremum of f∗f; n² products screened in float64, every index within the forward-error bound of the float maximum decided exactly' },
    printed, printedConvention: 'ceiling', printedAgrees: printed ? agree(r.C1, printed, 'ceil') : null, ms: Date.now() - t0 });
}
const acImprove = Q.sub(AC['ttt_discover_2026.json'], AC['ours_2026.json']);

/* ================= flat polynomials: the supremum, certified ================= */
console.log('flat-polynomials:');
const FLT = {};
for (const [file, who, printed, gridScore, date] of [['alphaevolve_2025.py', 'AlphaEvolve V2 (arXiv:2511.02864)', '1.340925', '1.3409252794557085', '2025-11'], ['ours_2026.py', 'Together AI agents, this repository', '1.280932', '1.2809320527987995', '2026-03']]) {
  if (!printedInReadme('flat-polynomials', printed)) die('printed value ' + printed + ' is not in the flat-polynomials README');
  if (!L.read('flat-polynomials/' + file).includes(gridScore)) die('grid score ' + gridScore + ' is not in ' + file);
  const c = L.loaders.coefficientsPy('flat-polynomials/' + file);
  if (c.length !== 70) die('flat: ' + file + ' has ' + c.length + ' coefficients');
  const r = D.flat(c);
  if (!r.witnessed) die('flat: ' + file + ' refused: ' + r.reason);
  FLT[file] = r.Cplus;
  const grid = L.parseDecimal(gridScore);
  push({ id: 'flat/' + file.replace('.py', ''), problem: 'flat-polynomials', claim: '70 coefficients ±1: C⁺ = max_{|z|=1} |g(z)| / √71 = ' + printed, claimant: who, date,
    file: 'corpus/easota/flat-polynomials/' + file, sha256: meta.files['flat-polynomials/' + file].sha256,
    verdict: 'WITNESSED', exact: dec(r.Cplus[0], 16), exactRational: null,
    enclosure: { lo: dec(r.Cplus[0], 20), hi: dec(r.Cplus[1], 20), width: dec(Q.sub(r.Cplus[1], r.Cplus[0]), 20), maxSqLo: dec(r.maxSq[0], 16), maxSqHi: dec(r.maxSq[1], 16) },
    detail: { degree: r.degree, gridScore, gridShortfall: dec(Q.sub(r.Cplus[0], grid), 16), argCosTheta: r.arg, method: r.method, counts: r.counts, ms: r.ms,
      note: 'the platform\'s score is a maximum over 1,000,000 grid points on the circle, a lower bound of the supremum; the enclosure is the supremum, certified (Sturm chain, interval Newton, exact Taylor bounds) — and the grid falls short of it by gridShortfall' },
    printed, printedConvention: 'rounding', printedAgrees: agree(r.Cplus[0], printed, 'round') && agree(r.Cplus[1], printed, 'round') });
}
/* the improvement is decided between two enclosures: real iff they are disjoint in the right order */
const fltImprove = Q.sub(FLT['alphaevolve_2025.py'][0], FLT['ours_2026.py'][1]);

/* ================= hexagon packing: certified intervals with certified trigonometry ================= */
console.log('hexagon-packing:');
const HEX = {};
for (const [file, who, printed, date] of [['alphaevolve_2025.json', 'AlphaEvolve V2 (arXiv:2511.02864)', '3.9419123', '2025-11'], ['ours_2026.json', 'Together AI agents, this repository', '3.9416523', '2026-04']]) {
  if (!printedInReadme('hexagon-packing', printed)) die('printed value ' + printed + ' is not in the hexagon README');
  const j = L.readJson('hexagon-packing/' + file);
  const data = { hexagons: j.hexagons.map((h) => h.map(L.fromJsonNumber)), outer: { center: j.outer_center.map(L.fromJsonNumber), side: L.fromJsonNumber(j.outer_side_length), angleDeg: L.fromJsonNumber(j.outer_angle_deg) } };
  if (data.hexagons.length !== 12) die('hexagons: ' + file + ' has ' + data.hexagons.length);
  const r = H.decide(data);
  HEX[file] = r.score;
  push({ id: 'hexagons/' + file.replace('.json', ''), problem: 'hexagon-packing', claim: '12 unit hexagons inside a hexagon of side ' + printed + ', no overlaps, all inside: score = the outer side', claimant: who, date,
    file: 'corpus/easota/hexagon-packing/' + file, sha256: meta.files['hexagon-packing/' + file].sha256,
    verdict: r.verdict, exact: dec(r.score, 16), exactRational: Q.toString(r.score),
    detail: { pairs: r.pairTally, vertices: r.vertexTally, closestPair: r.closestPair, tightestVertex: r.tightestVertex, enclosureWidth: r.enclosureWidth, intersecting: r.intersecting, outside: r.outside, undecidedPairs: r.undecidedPairs, undecidedVertices: r.undecidedVertices, ms: r.ms,
      note: 'every vertex is a cosine and a sine of a published decimal, so the decision runs in outward-rounded interval arithmetic with a certified π and certified sin/cos (instruments/interval): a pair is SEPARATED when some edge normal has certainly disjoint projections, a vertex INSIDE when every edge cross product is certainly non-negative. gapAtLeast and crossAtLeast are certain lower bounds; the platform separates only past 1e-9 and admits a vertex outside by up to 1e-9' },
    printed, printedConvention: 'exact', printedAgrees: r.witnessed && Q.cmp(r.score, L.parseDecimal(printed)) === 0,
    platformTolerance: 'a pair counts as intersecting unless separated by more than 1e-9; a vertex counts as inside unless outside by more than 1e-9' });
}
const hexImprove = Q.sub(HEX['alphaevolve_2025.json'], HEX['ours_2026.json']);   /* minimise the outer side */

/* ================= not decided here, and why ================= */
const undecided = [
  { problem: 'prime-number-theorem', claim: 'S(f) = 0.994179 (AlphaEvolve: 0.921292)', status: 'NOT DECIDABLE AS STATED', why: 'the platform\'s score is estimated from 10,000,000 random samples; a Monte Carlo score is not a mathematical claim about the construction and this ledger does not certify it.' },
  { problem: 'tammes / second & third autocorrelation / uncertainty (README rows)', claim: 'four further table rows', status: 'NEEDS DATA', why: 'the repository README lists them; no solution files are published in the repository at the pinned commit.' },
];

/* ================= improvements, decided as exact signs ================= */
const improvements = [
  { problem: 'circles-rectangle', direction: 'maximise', previous: 'AlphaEvolve V2', delta: dec(cirImprove, 16), sign: Q.sign(cirImprove), note: 'ours taken as its REPAIRED exact witness' },
  { problem: 'heilbronn-convex', direction: 'maximise', previous: 'AlphaEvolve V2', delta: dec(heiImprove, 16), sign: Q.sign(heiImprove) },
  { problem: 'min-distance-ratio-2d', direction: 'minimise', previous: 'AlphaEvolve', delta: dec(mdrImprove, 16), sign: Q.sign(mdrImprove) },
  { problem: 'erdos-minimum-overlap', direction: 'minimise', previous: 'TTT-Discover', delta: dec(ovlImprove, 16), sign: Q.sign(ovlImprove) },
  { problem: 'edges-vs-triangles', direction: 'maximise', previous: 'AlphaEvolve V2', delta: dec(evtImprove, 16), sign: Q.sign(evtImprove) },
  { problem: 'first-autocorrelation', direction: 'minimise', previous: 'TTT-Discover', delta: dec(acImprove, 16), sign: Q.sign(acImprove) },
  { problem: 'flat-polynomials', direction: 'minimise', previous: 'AlphaEvolve V2', delta: dec(fltImprove, 16), sign: Q.sign(fltImprove), note: 'a lower bound on the difference: the two certified enclosures are disjoint' },
  { problem: 'hexagon-packing', direction: 'minimise', previous: 'AlphaEvolve V2', delta: dec(hexImprove, 16), sign: Q.sign(hexImprove), note: 'both outer sides are exact decimals; both packings certified as witnesses' },
];
for (const im of improvements) console.log('  improvement ' + im.problem.padEnd(24) + (im.sign > 0 ? 'REAL  ' : im.sign < 0 ? 'REVERSED ' : 'TIE ') + im.delta);
if (rows.some((r) => r.verdict === 'UNWITNESSED')) console.log('  note: an UNWITNESSED row is a finding about the bytes, never about the bound');

const out = {
  what: 'The EinsteinArena / Together AI "new state-of-the-art" table (github.com/togethercomputer/EinsteinArena-new-SOTA, commit ' + meta.commit.slice(0, 8) + '), every published construction re-decided in exact rational arithmetic from its own bytes read as the decimals they print. Per row: the exact value of the platform\'s objective, every constraint\'s exact slack, whether the printed digits are the exact value\'s (rounding, or ceiling for an upper bound), and a REPAIR where the bytes are a witness only up to the platform\'s tolerance.',
  grammar: { WITNESSED: 'the bytes are an exact witness of the value stated', REPAIRED: 'a witness only up to the platform\'s tolerance; an exact witness built from the same bytes, its deficit printed', UNWITNESSED: 'the bytes fail exactly and no repair was built — a finding about the bytes, never a refutation of the bound' },
  scope: 'constructions only; no upper-bound theorem, no optimality claim, and no search for better constructions. The "improvement over the previous best" rows are exact signs between two published constructions.',
  provenance: { repo: meta.repo, commit: meta.commit, fetched: meta.fetched, files: Object.fromEntries(Object.entries(meta.files).map(([k, v]) => [k, v.sha256])) },
  generated: new Date().toISOString(),
  git: (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })(),
  rows, improvements, undecided,
};
fs.writeFileSync(path.join(ROOT, 'certs', 'easota-ledger.json'), JSON.stringify(out, null, 1) + '\n');
const tally = {}; for (const r of rows) tally[r.verdict] = (tally[r.verdict] || 0) + 1;
console.log('wrote certs/easota-ledger.json — ' + rows.length + ' rows: ' + Object.entries(tally).map(([k, v]) => v + ' ' + k).join(', ') + '; ' + improvements.filter((i) => i.sign > 0).length + '/' + improvements.length + ' improvements real');
