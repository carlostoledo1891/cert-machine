#!/usr/bin/env node
/* run-easota-ledger.js — decide every construction in the EinsteinArena /
   Together AI "new SOTA" table and write certs/easota-ledger.json.

   Every row reads a file pinned byte for byte under corpus/easota (re-hashed
   here against corpus/easota/meta.json), decides the platform's objective in
   exact rational arithmetic, and compares the exact value with the digits the
   repository prints. Grammar per row: WITNESSED (the bytes are an exact
   witness of the printed value), REPAIRED (a witness only within a verifier's
   tolerance — the platform's or the repository notebook's, named and dated in
   the row's platformRule; an exact witness built from the same bytes, deficit
   printed), UNWITNESSED (bytes fail exactly, no repair). A failed witness
   refutes no bound. Improvements over the previous best are decided as exact
   signs.

   The platform's rules move (EinsteinArena dropped its circles slack on
   2026-08-24), so a row never says "the platform's tolerance" without a date:
   platformRule holds the rule when the construction was published and the
   rule now, each read from bytes pinned in corpus/sources/easota-platform and
   re-checked here. Interval endpoints are written outward: a lower end
   rounded down, an upper end rounded up. */
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

/* ---- the platform's rules, dated, from pinned bytes ----
   corpus/sources/easota-platform holds vinid/einstein-arena's changelog and the
   verifier sources at the commits that matter, and the live API's verifier
   strings of 2026-10-06; every one is re-hashed against corpus/sources/PINS.json
   and every rule a row states is found in those bytes, or nothing is written. */
const SRC = path.join(ROOT, 'corpus', 'sources');
const PINS = JSON.parse(fs.readFileSync(path.join(SRC, 'PINS.json'), 'utf8'));
const pinned = (rel) => {
  const key = 'easota-platform/' + rel, want = PINS[key];
  if (!want) die('no pin for corpus/sources/' + key);
  const b = fs.readFileSync(path.join(SRC, key));
  if (crypto.createHash('sha256').update(b).digest('hex') !== want) die('corpus/sources/' + key + ' does not hash to its pin');
  return b.toString('utf8');
};
const says = (name, txt, ...needles) => { for (const n of needles) if (!txt.includes(n)) die(name + ' no longer says: ' + n); };
const saysNot = (name, txt, ...needles) => { for (const n of needles) if (txt.includes(n)) die(name + ' says: ' + n); };
const tsVerifier = (src) => { const m = /verifier: `([\s\S]*?)`,\n/.exec(src); if (!m) die('a pinned .ts has no verifier'); return m[1].replace(/\\\\/g, '\\').replace(/\\`/g, '`'); };
const PF = {
  changelog: pinned('einstein-arena-changelog_9cd6fbfb.md'),
  cirThen: pinned('circles-rectangle_9f3ffd44.ts'), cirNow: pinned('circles-rectangle_9cd6fbfb.ts'),
  ovlFirst: pinned('erdos-min-overlap_7fe55b61.ts'), ovlNow: pinned('erdos-min-overlap_9cd6fbfb.ts'),
  hexNow: pinned('hexagon-packing_9cd6fbfb.ts'),
  apiCir: JSON.parse(pinned('api-problems-circles-rectangle_2026-10-06.json')),
  apiOvl: JSON.parse(pinned('api-problems-erdos-min-overlap_2026-10-06.json')),
  apiList: JSON.parse(pinned('api-problems_2026-10-06.json')),
  note: pinned('einstein-arena-platform-pin.txt'),
};
pinned('api-problems-edges-vs-triangles_2026-10-06.json');
says('the changelog', PF.changelog, '## 2026-08-24\n\n### Feasibility checks tightened\n\nRemoved the `1e-9` feasibility slack from `circle-packing`, `circles-rectangle`, and `heilbronn-triangles`.',
  'Packings that only passed via slack or rounding are no longer on the leaderboard.');
says('circles-rectangle.ts @ 9f3ffd44', PF.cirThen, 'if width + height > 2 + 1e-9:', 'if dist < c1[2] + c2[2] - 1e-9:');
says('circles-rectangle.ts @ 9cd6fbfb', PF.cirNow, 'if width + height > Fraction(2):', 'if dist < c1[2] + c2[2]:');
saysNot('circles-rectangle.ts @ 9cd6fbfb', PF.cirNow, '1e-9');
if (PF.apiCir.verifier !== tsVerifier(PF.cirNow)) die('the live circles verifier of 2026-10-06 is not the pinned source at 9cd6fbfb');
for (const [name, t] of [['erdos-min-overlap.ts @ 7fe55b61', PF.ovlFirst], ['erdos-min-overlap.ts @ 9cd6fbfb', PF.ovlNow]]) {
  says(name, t, 'sequence_array = _normalize_sum_constraint(sequence_array)', 'sequence_array = sequence_array * (target_sum / current_sum)');
  saysNot(name, t, 'isclose', 'atol');
}
if (PF.apiOvl.verifier !== tsVerifier(PF.ovlNow)) die('the live overlap verifier of 2026-10-06 is not the pinned source at 9cd6fbfb');
says('hexagon-packing.ts @ 9cd6fbfb', PF.hexNow, 'if mx1 < mn2 - 1e-9 or mx2 < mn1 - 1e-9:', 'edge[0]*pv[1] - edge[1]*pv[0] < -1e-9:');
if (!Array.isArray(PF.apiList) || PF.apiList.some((p) => p.slug === 'hexagon-packing')) die('the live problem list of 2026-10-06 does list hexagon-packing');
says('the circles notebook', L.read('circles-rectangle/verifier.py'), 'if width + height > 2 + 1e-9:', '< c1[2] + c2[2] - 1e-9:');
says('the overlap notebook', L.read('erdos-minimum-overlap/verifier.py'), 'np.isclose(actual_sum, target_sum, atol=1e-6)');
says('the pin note', PF.note, '9f3ffd44 2026-04-01', '59e560a5 2026-08-31', '10955d03 "update STOA (#9)", Yongchan Kwon, 2026-04-02', 'ee1495c1 "Restructure (#2)", 2026-03-16');
const ASOF = '2026-10-06', PUBLIC_FROM = '2026-03-26';
const PSRC = 'corpus/sources/easota-platform/';
const PLATFORM = {
  circles: {
    slack: 'overlap allowed to 1e-9 in distance, box to 1e-9 in w + h',
    exact: 'no slack: w + h ≤ 2 checked in exact rationals over the parsed doubles, dist ≥ rᵢ + rⱼ with no margin; packings that passed only via slack or rounding were dropped from the leaderboard',
    since: '2026-08-24',
    sinceSource: PSRC + 'einstein-arena-changelog_9cd6fbfb.md (entry 2026-08-24, "Feasibility checks tightened"); the code is vinid/einstein-arena 59e560a5, PR #60, merged 2026-08-31; ' + PSRC + 'circles-rectangle_9cd6fbfb.ts, the live verifier of ' + ASOF + ' byte for byte',
    thenSource: PSRC + 'circles-rectangle_9f3ffd44.ts (2026-04-01; the same rule in every version from ' + PUBLIC_FROM + ' to 98073fca, 2026-08-06)',
    notebook: { rule: 'overlap allowed to 1e-9 in distance, box to 1e-9 in w + h', slack: '1e-9', source: 'corpus/easota/circles-rectangle/verifier.py (the repository\'s analysis.ipynb)' },
  },
  overlap: {
    now: 'no tolerance on the sum: the values are rescaled to Σh = n/2 in float64 before scoring (_normalize_sum_constraint), then 0 ≤ h ≤ 1 is required — in every public version of the verifier',
    source: PSRC + 'erdos-min-overlap_7fe55b61.ts (the first public version, ' + PUBLIC_FROM + ') and erdos-min-overlap_9cd6fbfb.ts, the live verifier of ' + ASOF + ' byte for byte',
    notebook: { rule: 'Σh = n/2 within 1e-6 (np.isclose, atol=1e-6)', slack: '1e-6', source: 'corpus/easota/erdos-minimum-overlap/verifier.py (the repository\'s analysis.ipynb)' },
  },
  hexagons: {
    rule: 'a pair counts as intersecting unless separated by more than 1e-9; a vertex counts as inside unless outside by more than 1e-9',
    source: PSRC + 'hexagon-packing_9cd6fbfb.ts (the rule unchanged in every version since ' + PUBLIC_FROM + ')',
    served: 'the problem is not served by the live API on ' + ASOF + ': absent from /api/problems (' + PSRC + 'api-problems_2026-10-06.json), /api/problems/hexagon-packing 404',
  },
};
/* published before the platform's public history began? (a construction from a paper, or Together's own overlap file) */
const beforePlatform = (date) => date < PUBLIC_FROM;
const noPlatformYet = (date, extra) => ({ rule: 'none: no public platform verifier yet (published ' + date + '; EinsteinArena\'s public history starts ' + PUBLIC_FROM + ')' + (extra || ''), slack: null, source: PSRC + 'einstein-arena-platform-pin.txt' });

const dec = (r, d) => (r ? L.toFixed(r, d) : null);
/* the upper end of an enclosure, rounded UP to d decimals (L.toFixed truncates, which is outward only for a lower end) */
const decUp = (r, d) => {
  const t = L.toFixed(r, d);
  if (Q.cmp(L.parseDecimal(t), r) >= 0) return t;
  const up = Q.add(L.parseDecimal(t), Q.R(1n, 10n ** BigInt(d)));
  return L.toFixed(up, d);
};
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
for (const [file, who, printed, date, publishedOn] of [['alphaevolve_2025.json', 'AlphaEvolve V2 (Georgiev, Gómez-Serrano, Tao, Wagner — arXiv:2511.02864)', '2.3658321334', '2025-11', '2025-11'], ['ours_2026.json', 'Together AI agents, this repository', '2.3658323759', '2026-04', '2026-04-02']]) {
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
    platformTolerance: (beforePlatform(publishedOn) ? 'no platform verifier when published (' + publishedOn + '); 1e-9 from ' + PUBLIC_FROM + ' to ' + PLATFORM.circles.since + ' (' + PLATFORM.circles.slack + '); '
      : '1e-9 when published (' + publishedOn + '): ' + PLATFORM.circles.slack + '; ')
      + 'none since ' + PLATFORM.circles.since + ' (the box in exact rationals, the pairs with no margin)' + (r.witnessed ? ' — an exact witness under every rule' : ' — the bytes as published pass the rule of their publication date and fail today\'s'),
    platformRule: {
      publishedOn,
      atPublication: beforePlatform(publishedOn)
        ? noPlatformYet(publishedOn, '; from ' + PUBLIC_FROM + ' to ' + PLATFORM.circles.since + ' the platform\'s rule was ' + PLATFORM.circles.slack)
        : { rule: PLATFORM.circles.slack, slack: '1e-9', source: PLATFORM.circles.thenSource + ', live when togethercomputer/EinsteinArena-new-SOTA 10955d03 committed this file' },
      now: { asOf: ASOF, rule: PLATFORM.circles.exact, slack: null, since: PLATFORM.circles.since, source: PLATFORM.circles.sinceSource,
        thisFile: r.witnessed ? 'passes: an exact witness, so no slack was ever needed'
          : 'fails: the box exceeds w + h = 2 by ' + dec(Q.neg(r.boxSlack), 20) + ' and ' + r.overlaps + ' pairs overlap, exactly; the live verifier returned −inf on ' + ASOF + ' (' + PSRC + 'einstein-arena-platform-pin.txt)' },
      repositoryNotebook: PLATFORM.circles.notebook,
    },
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
for (const [file, how, who, printed, date, publishedOn] of [
  ['haugland_2016.py', 'haugland', 'J. K. Haugland (arXiv:1609.08000)', '0.380927', '2016', '2016'],
  ['alphaevolve_2025.py', 'ae-half', 'AlphaEvolve (arXiv:2506.13131)', '0.380924', '2025-06', '2025-06'],
  ['ttt_discover_2026.py', 'full', 'TTT-Discover (Yuksekgonul et al. — arXiv:2601.16175)', '0.380876', '2026-01', '2026-01'],
  ['together_ai_2026.py', 'full', 'Together AI agents, this repository', '0.380871', '2026-03', '2026-03-16']]) {
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
    platformTolerance: 'none on the platform: it rescales h to Σh = n/2 before scoring, in every public version of its verifier (' + PUBLIC_FROM + ' to ' + ASOF + '); the 1e-6 on Σh = n/2 is the repository\'s analysis.ipynb',
    platformRule: {
      publishedOn,
      atPublication: beforePlatform(publishedOn) ? noPlatformYet(publishedOn, file.startsWith('together') ? '; togethercomputer/EinsteinArena-new-SOTA ee1495c1 committed this file 2026-03-16' : '')
        : { rule: PLATFORM.overlap.now, slack: null, source: PLATFORM.overlap.source },
      now: { asOf: ASOF, rule: PLATFORM.overlap.now, slack: null, since: PUBLIC_FROM, source: PLATFORM.overlap.source,
        thisFile: r.witnessed ? 'Σh = n/2 exactly: the rescale changes nothing' : 'Σh misses n/2 by ' + dec(Q.abs(r.sumSlack), 20) + ' exactly; the platform\'s rescale is itself a repair, but in float64 the sum already reads n/2, and the live verifier accepted the file on ' + ASOF + ' (' + PSRC + 'einstein-arena-platform-pin.txt)' },
      repositoryNotebook: PLATFORM.overlap.notebook,
    } });
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
  if (Q.cmp(L.parseDecimal(dec(r.Cplus[0], 20)), r.Cplus[0]) > 0 || Q.cmp(L.parseDecimal(decUp(r.Cplus[1], 20)), r.Cplus[1]) < 0
    || Q.cmp(L.parseDecimal(dec(r.maxSq[0], 16)), r.maxSq[0]) > 0 || Q.cmp(L.parseDecimal(decUp(r.maxSq[1], 16)), r.maxSq[1]) < 0) die('flat: ' + file + ': a written endpoint is not outward');
  const grid = L.parseDecimal(gridScore);
  push({ id: 'flat/' + file.replace('.py', ''), problem: 'flat-polynomials', claim: '70 coefficients ±1: C⁺ = max_{|z|=1} |g(z)| / √71 = ' + printed, claimant: who, date,
    file: 'corpus/easota/flat-polynomials/' + file, sha256: meta.files['flat-polynomials/' + file].sha256,
    verdict: 'WITNESSED', exact: dec(r.Cplus[0], 16), exactRational: null,
    enclosure: { lo: dec(r.Cplus[0], 20), hi: decUp(r.Cplus[1], 20), width: dec(Q.sub(r.Cplus[1], r.Cplus[0]), 20), maxSqLo: dec(r.maxSq[0], 16), maxSqHi: decUp(r.maxSq[1], 16), rounding: 'outward: lo and maxSqLo rounded down, hi and maxSqHi rounded up' },
    detail: { degree: r.degree, gridScore, gridShortfall: dec(Q.sub(r.Cplus[0], grid), 16), argCosTheta: r.arg, method: r.method, counts: r.counts, ms: r.ms,
      note: 'the platform\'s score is a maximum over 1,000,000 grid points on the circle, a lower bound of the supremum; the enclosure is the supremum, certified (Sturm chain, interval Newton, exact Taylor bounds) — and the grid falls short of it by gridShortfall' },
    printed, printedConvention: 'rounding', printedAgrees: agree(r.Cplus[0], printed, 'round') && agree(r.Cplus[1], printed, 'round') });
}
/* the improvement is decided between two enclosures: real iff they are disjoint in the right order */
const fltImprove = Q.sub(FLT['alphaevolve_2025.py'][0], FLT['ours_2026.py'][1]);

/* ================= hexagon packing: certified intervals with certified trigonometry ================= */
console.log('hexagon-packing:');
const HEX = {};
for (const [file, who, printed, date, publishedOn] of [['alphaevolve_2025.json', 'AlphaEvolve V2 (arXiv:2511.02864)', '3.9419123', '2025-11', '2025-11'], ['ours_2026.json', 'Together AI agents, this repository', '3.9416523', '2026-04', '2026-04-02']]) {
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
    platformTolerance: PLATFORM.hexagons.rule,
    platformRule: {
      publishedOn,
      atPublication: beforePlatform(publishedOn) ? noPlatformYet(publishedOn, '; from ' + PUBLIC_FROM + ' the platform\'s rule is the one below')
        : { rule: PLATFORM.hexagons.rule, slack: '1e-9', source: PLATFORM.hexagons.source },
      now: { asOf: ASOF, rule: PLATFORM.hexagons.rule, slack: '1e-9', since: PUBLIC_FROM, source: PLATFORM.hexagons.source, served: false, note: PLATFORM.hexagons.served,
        thisFile: r.witnessed ? 'passes with no margin needed: every pair certified separated, every vertex certified inside' : 'not certified here' },
    } });
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
  { problem: 'flat-polynomials', direction: 'minimise', previous: 'AlphaEvolve V2', delta: dec(fltImprove, 16), sign: Q.sign(fltImprove), lowerBound: true, note: 'a lower bound on the difference (rounded down): the two certified enclosures are disjoint' },
  { problem: 'hexagon-packing', direction: 'minimise', previous: 'AlphaEvolve V2', delta: dec(hexImprove, 16), sign: Q.sign(hexImprove), note: 'both outer sides are exact decimals; both packings certified as witnesses' },
];
for (const im of improvements) console.log('  improvement ' + im.problem.padEnd(24) + (im.sign > 0 ? 'REAL  ' : im.sign < 0 ? 'REVERSED ' : 'TIE ') + im.delta);
if (rows.some((r) => r.verdict === 'UNWITNESSED')) console.log('  note: an UNWITNESSED row is a finding about the bytes, never about the bound');

const out = {
  what: 'The EinsteinArena / Together AI "new state-of-the-art" table (github.com/togethercomputer/EinsteinArena-new-SOTA, commit ' + meta.commit.slice(0, 8) + '), every published construction re-decided in exact rational arithmetic from its own bytes read as the decimals they print. Per row: the exact value of the platform\'s objective, every constraint\'s exact slack, whether the printed digits are the exact value\'s (rounding, or ceiling for an upper bound), and a REPAIR where the bytes are a witness only within a verifier\'s tolerance. Where a verifier has a tolerance, the row\'s platformRule says which (the platform\'s or the repository notebook\'s) and dates it: the rule when the construction was published and the rule on ' + ASOF + ', each read from pinned bytes (corpus/sources/easota-platform).',
  grammar: { WITNESSED: 'the bytes are an exact witness of the value stated', REPAIRED: 'a witness only within a verifier\'s tolerance (named and dated in platformRule); an exact witness built from the same bytes, its deficit printed', UNWITNESSED: 'the bytes fail exactly and no repair was built — a finding about the bytes, never a refutation of the bound' },
  scope: 'constructions only; no upper-bound theorem, no optimality claim, and no search for better constructions. The "improvement over the previous best" rows are exact signs between two published constructions.',
  provenance: { repo: meta.repo, commit: meta.commit, fetched: meta.fetched, files: Object.fromEntries(Object.entries(meta.files).map(([k, v]) => [k, v.sha256])),
    platform: { repo: 'github.com/vinid/einstein-arena', head: '9cd6fbfb4b88ca303a61963665b1b6ad20ffdb1e', publicFrom: PUBLIC_FROM, fetched: ASOF,
      files: Object.fromEntries(Object.entries(PINS).filter(([k]) => k.startsWith('easota-platform/')).map(([k, v]) => ['corpus/sources/' + k, v])) } },
  generated: new Date().toISOString(),
  git: (() => { try { return cp.execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) { return 'unknown'; } })(),
  rows, improvements, undecided,
};
fs.writeFileSync(path.join(ROOT, 'certs', 'easota-ledger.json'), JSON.stringify(out, null, 1) + '\n');
const tally = {}; for (const r of rows) tally[r.verdict] = (tally[r.verdict] || 0) + 1;
console.log('wrote certs/easota-ledger.json — ' + rows.length + ' rows: ' + Object.entries(tally).map(([k, v]) => v + ' ' + k).join(', ') + '; ' + improvements.filter((i) => i.sign > 0).length + '/' + improvements.length + ' improvements real');
